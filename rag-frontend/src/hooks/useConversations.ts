import { useCallback, useEffect, useState } from "react";
import type { Conversation } from "../types/types";
import { fetchConversations, createConversation, deleteConversation, updateConvoTitle } from "../services/api";

/**
 * useConversations – manages the sidebar conversation list.
 *
 * Loads all conversations on mount, lets the parent create new ones,
 * and tracks which conversation is currently selected.
 */
export function useConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load conversation list on mount
    const loadConversations = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchConversations();
            setConversations(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load conversations");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Create a new conversation and make it active 
    const startNewConversation = useCallback(async () => {
        setError(null);

        try {
            const newConv = await createConversation();
            // Prepend the new conversation to the top of the list
            setConversations((prev) => [newConv, ...prev]);
            setActiveConversationId(newConv.id);
            return newConv;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create conversation");
            return null;
        }
    }, []);

    // Select an existing conversation 
    const selectConversation = useCallback((id: string) => {
        setActiveConversationId(id);
    }, []);

    // Delete an exsisting conversation
    const deleteAnyConversation = useCallback(async (id: string) => {
        setError(null);

        try {
            await deleteConversation(id);

            setConversations((prev) => prev.filter((conv) => conv.id !== id));

            if (activeConversationId === id) {
                setActiveConversationId(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete conversation");
        }
    }, [activeConversationId]);

    const updateConversationTitle = useCallback(async (id: string, title: string) => {
        setError(null);

        try {
            await updateConvoTitle(id, title);

            setConversations((prev) => prev.map((conv) => {
                if (conv.id === id) {
                    return { ...conv, title };
                }
                return conv;
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update conversation title");
        }
    }, []);

    return {
        conversations,
        activeConversationId,
        isLoading,
        error,
        loadConversations,
        startNewConversation,
        selectConversation,
        deleteAnyConversation,
        updateConversationTitle,
    };
}
