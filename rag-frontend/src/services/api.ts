// api.ts – service layer for all backend HTTP calls.
//
// Every function uses the "/api" prefix which Vite's dev-server
// proxy rewrites to http://localhost:8000 (see vite.config.ts).
// In production you'd swap this for the real backend origin.
import type { Conversation, ConversationDetail, ChatResponse, DocumentListResponse, UploadResponse, MessageMetadata } from '../types/types';
import handleResponse from '../helper';

const API_BASE = "/api";

// Conversation endpoints (/conversations)

export async function fetchConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/conversations/list`);
    return handleResponse<Conversation[]>(res);
}

export async function createConversation(): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/new`, {
        method: "POST",
    });
    return handleResponse<Conversation>(res);
}

export async function fetchConversation(
    conversationId: string
): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}`);
    return handleResponse<ConversationDetail>(res);
}

export async function deleteConversation(
    conversationId: string
): Promise<void> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}`, {
        method: "DELETE",
    });
    return handleResponse<void>(res);
}

export async function updateConvoTitle(
    conversationId: string,
    title: string
): Promise<void> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/title`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
    });
    return handleResponse<void>(res);
}

// Chat endpoints (/chat)

/** Send a message and receive the full response at once. */
export async function sendMessage(
    conversationId: string,
    prompt: string
): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, prompt }),
    });
    return handleResponse<ChatResponse>(res);
}

/**
 * Send a message and stream the response back via SSE.
 *
 * @param conversationId – active conversation
 * @param prompt         – user's message text
 * @param onChunk        – callback fired for every streamed text chunk
 * @param onDone         – called when the stream finishes
 * @param onError        – called if something goes wrong
 * @returns an AbortController so the caller can cancel the stream
 */
export function streamMessage(
    conversationId: string,
    prompt: string,
    onChunk: (text: string) => void,
    onDone?: () => void,
    onError?: (error: Error) => void,
    onMetadata?: (metadata: MessageMetadata) => void,
    onToolEvent?: (event: { event: string; tool: string; query?: string }) => void
): AbortController {
    const controller = new AbortController();

    (async () => {
        try {
            const res = await fetch(`${API_BASE}/chat/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversation_id: conversationId, prompt }),
                signal: controller.signal,
            });

            if (!res.ok) {
                throw new Error(`Stream error ${res.status}: ${await res.text()}`);
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error("ReadableStream not supported");

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // SSE frames are separated by double newlines
                const parts = buffer.split("\n\n");
                // The last element may be an incomplete frame, keep it in the buffer
                buffer = parts.pop() ?? "";

                for (const part of parts) {
                    if (!part.trim()) continue;

                    const lines = part.split("\n");
                    let eventType = "message";
                    let dataPayload = "";

                    for (const line of lines) {
                        if (line.startsWith("event:")) {
                            eventType = line.slice(6).trim();
                        } else if (line.startsWith("data:")) {
                            dataPayload = line.slice(5).trim();
                        }
                    }

                    if (!dataPayload) continue;

                    // [DONE] sentinel signals end of stream
                    if (dataPayload === "[DONE]") {
                        onDone?.();
                        return;
                    }

                    try {
                        const parsed = JSON.parse(dataPayload);
                        if (parsed.error) {
                            onError?.(new Error(parsed.error));
                            return;
                        }
                        
                        console.log("[SSE API] Event received:", eventType, parsed);

                        if (eventType === "metadata") {
                            onMetadata?.(parsed);
                        } else if (eventType === "tool_start" || eventType === "tool_complete") {
                            onToolEvent?.({ event: eventType, tool: parsed.tool, query: parsed.query });
                        } else if (parsed.content) {
                            onChunk(parsed.content);
                        }
                    } catch {
                        // Non-JSON data line, skip
                    }
                }
            }

            onDone?.();
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                onError?.(err as Error);
            }
        }
    })();

    return controller;
}

// Document endpoints (/doc)

export async function fetchDocuments(): Promise<DocumentListResponse> {
    const res = await fetch(`${API_BASE}/doc/`);
    return handleResponse<DocumentListResponse>(res);
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/doc/upload`, {
        method: "POST",
        body: formData, // no Content-Type header – browser sets multipart boundary
    });
    return handleResponse<UploadResponse>(res);
}

// Profile / Memory endpoints (/profile)

export async function fetchUserProfile(): Promise<{ interests: string[]; preferences: string[]; updated_at: string | null }> {
    const res = await fetch(`${API_BASE}/profile/`);
    return handleResponse(res);
}

export async function clearUserProfile(): Promise<void> {
    const res = await fetch(`${API_BASE}/profile/`, { method: "DELETE" });
    return handleResponse(res);
}

export async function deleteInterest(interest: string): Promise<void> {
    const res = await fetch(`${API_BASE}/profile/interests/${encodeURIComponent(interest)}`, {
        method: "DELETE",
    });
    return handleResponse(res);
}

export async function deletePreference(preference: string): Promise<void> {
    const res = await fetch(`${API_BASE}/profile/preferences/${encodeURIComponent(preference)}`, {
        method: "DELETE",
    });
    return handleResponse(res);
}
