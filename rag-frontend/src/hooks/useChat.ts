import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "../types/types";
import { fetchConversation, sendMessage, streamMessage } from "../services/api";

/**
 * useChat – manages chat state for a given conversation.
 *
 * Accepts a conversationId and returns everything the UI needs:
 * messages, loading/streaming flags, error state, and action handlers.
 */
export function useChat(conversationId: string | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<{ tool: string; query?: string } | null>(null);

    // Keep a ref to the active stream's AbortController so we can
    // cancel it on unmount or when the user switches conversations.
    const streamControllerRef = useRef<AbortController | null>(null);

    // ── Load messages when conversationId changes ───────────
    useEffect(() => {
        // Reset state for the new conversation
        setMessages([]);
        setError(null);
        setActiveTool(null);

        if (!conversationId) return;

        // Use an AbortController so the fetch is cancelled if the
        // conversation changes or a stream starts before it completes.
        const fetchController = new AbortController();
        setIsLoading(true);

        fetchConversation(conversationId)
            .then((data) => {
                // Don't overwrite messages if streaming is already underway
                // (happens when a message is sent immediately after a new
                // conversation is created, before this fetch returns).
                if (fetchController.signal.aborted) return;
                if (streamControllerRef.current) return;
                setMessages(data.messages);
            })
            .catch((err) => {
                if (fetchController.signal.aborted) return;
                setError(err.message);
            })
            .finally(() => {
                if (!fetchController.signal.aborted) {
                    setIsLoading(false);
                }
            });

        return () => {
            fetchController.abort();
            setIsLoading(false);
        };
    }, [conversationId]);


    // Refs for typing effect intervals so we can clean them up
    const typingIntervalRef = useRef<number | null>(null);
    const drainIntervalRef = useRef<number | null>(null);

    // ── Abort any running stream on unmount or conversation switch ──
    useEffect(() => {
        return () => {
            streamControllerRef.current?.abort();
            if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
            if (drainIntervalRef.current) window.clearInterval(drainIntervalRef.current);
            setActiveTool(null);
        };
    }, [conversationId]);

    // ── Helper: build an optimistic user message ────────────
    const createUserMessage = useCallback(
        (prompt: string): Message => ({
            id: crypto.randomUUID(),
            content: prompt,
            role: "user",
            timestamp: new Date().toISOString(),
            conversation_id: conversationId ?? "",
        }),
        [conversationId]
    );

    // ── Send (non-streaming) ────────────────────────────────
    const handleSend = useCallback(
        async (prompt: string) => {
            if (!conversationId || !prompt.trim()) return;

            setError(null);
            setIsLoading(true);

            // Optimistically add the user's message to the list
            const userMsg = createUserMessage(prompt);
            setMessages((prev) => [...prev, userMsg]);

            try {
                const result = await sendMessage(conversationId, prompt);

                const assistantMsg: Message = {
                    id: crypto.randomUUID(),
                    content: result.response,
                    role: "assistant",
                    timestamp: new Date().toISOString(),
                    conversation_id: conversationId,
                };

                setMessages((prev) => [...prev, assistantMsg]);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong");
            } finally {
                setIsLoading(false);
            }
        },
        [conversationId, createUserMessage]
    );

    // ── Send (streaming via SSE) ────────────────────────────
    const handleStreamSend = useCallback(
        (prompt: string) => {
            if (!conversationId || !prompt.trim()) return;

            // Abort any previous stream and clear intervals
            streamControllerRef.current?.abort();
            if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
            if (drainIntervalRef.current) window.clearInterval(drainIntervalRef.current);

            setError(null);
            setIsStreaming(true);
            setActiveTool(null);

            // Optimistically add the user's message
            const userMsg = createUserMessage(prompt);
            setMessages((prev) => [...prev, userMsg]);

            // Create a placeholder assistant message that we'll append chunks to
            const assistantId = crypto.randomUUID();
            const assistantMsg: Message = {
                id: assistantId,
                content: "",
                role: "assistant",
                timestamp: new Date().toISOString(),
                conversation_id: conversationId,
            };
            setMessages((prev) => [...prev, assistantMsg]);

            // Buffer for the typing effect
            let fullText = "";
            let displayedText = "";

            // Interval to smoothly drain the buffer into the UI
            typingIntervalRef.current = window.setInterval(() => {
                if (displayedText.length < fullText.length) {
                    // Adaptive speed: add more characters if the buffer gets large
                    const remaining = fullText.length - displayedText.length;
                    const charsToAdd = Math.max(1, Math.ceil(remaining / 5));
                    displayedText += fullText.substring(displayedText.length, displayedText.length + charsToAdd);

                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantId
                                ? { ...msg, content: displayedText }
                                : msg
                        )
                    );
                }
            }, 30); // ~33fps update rate

            const controller = streamMessage(
                conversationId,
                prompt,
                // onChunk – append text to the fullText buffer
                (chunk: string) => {
                    fullText += chunk;
                },
                // onDone
                () => {
                    // Wait until the typing buffer is fully drained before ending the stream
                    drainIntervalRef.current = window.setInterval(() => {
                        if (displayedText.length === fullText.length) {
                            if (drainIntervalRef.current) window.clearInterval(drainIntervalRef.current);
                            if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
                            setIsStreaming(false);
                            setActiveTool(null);
                            streamControllerRef.current = null;
                        }
                    }, 50);
                },
                // onError
                (err: Error) => {
                    if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
                    setError(err.message);
                    setIsStreaming(false);
                    setActiveTool(null);
                    streamControllerRef.current = null;
                },
                // onMetadata
                (metadata) => {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantId ? { ...msg, metadata } : msg
                        )
                    );
                },
                // onToolEvent
                (event) => {
                    console.log("[useChat] onToolEvent called:", event);
                    if (event.event === "tool_start") {
                        console.log("[useChat] Setting activeTool:", event.tool);
                        setActiveTool({ tool: event.tool, query: event.query });
                    } else if (event.event === "tool_complete") {
                        console.log("[useChat] Clearing activeTool");
                        setActiveTool(null);
                    }
                }
            );

            streamControllerRef.current = controller;
        },
        [conversationId, createUserMessage]
    );

    // ── Stop a running stream ───────────────────────────────
    const stopStreaming = useCallback(() => {
        streamControllerRef.current?.abort();
        streamControllerRef.current = null;
        if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
        if (drainIntervalRef.current) window.clearInterval(drainIntervalRef.current);
        setIsStreaming(false);
        setActiveTool(null);
    }, []);

    // ── Clear messages (e.g. for a "New Chat" action) ───────
    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
        setActiveTool(null);
    }, []);

    return {
        messages,
        isLoading,
        isStreaming,
        error,
        activeTool,
        handleSend,
        handleStreamSend,
        stopStreaming,
        clearMessages,
    };
}