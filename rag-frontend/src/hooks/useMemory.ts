import { useCallback, useEffect, useRef, useState } from "react";
import type { UserProfile, MemoryUpdateEvent } from "../types/types";
import {
    fetchUserProfile,
    clearUserProfile,
    deleteInterest as apiDeleteInterest,
    deletePreference as apiDeletePreference,
} from "../services/api";

const API_BASE = "/api";

/**
 * useMemory – manages user profile memory state with real-time SSE updates.
 *
 * On mount:
 * 1. Fetches the current profile via REST.
 * 2. Opens a persistent EventSource to /profile/stream for real-time updates.
 *
 * When the memory agent updates the profile in the background, the SSE stream
 * pushes a `memory_updated` event, and this hook updates the local state and
 * triggers a toast notification.
 */
export function useMemory() {
    const [profile, setProfile] = useState<UserProfile>({
        interests: [],
        preferences: [],
        updated_at: null,
    });
    const [toast, setToast] = useState<MemoryUpdateEvent | null>(null);
    const toastTimeoutRef = useRef<number | null>(null);

    // Fetch initial profile on mount
    useEffect(() => {
        fetchUserProfile()
            .then((data) => {
                setProfile({
                    interests: data.interests || [],
                    preferences: data.preferences || [],
                    updated_at: data.updated_at,
                });
            })
            .catch((err) => {
                console.error("[useMemory] Failed to fetch profile:", err);
            });
    }, []);

    // Open persistent SSE connection for real-time memory updates
    useEffect(() => {
        const es = new EventSource(`${API_BASE}/profile/stream`);

        es.addEventListener("memory_updated", (e) => {
            try {
                const data: MemoryUpdateEvent = JSON.parse(e.data);
                setProfile({
                    interests: data.interests || [],
                    preferences: data.preferences || [],
                    updated_at: new Date().toISOString(),
                });

                // Show toast notification
                setToast(data);

                // Auto-dismiss after 5 seconds
                if (toastTimeoutRef.current) {
                    window.clearTimeout(toastTimeoutRef.current);
                }
                toastTimeoutRef.current = window.setTimeout(() => {
                    setToast(null);
                    toastTimeoutRef.current = null;
                }, 5000);
            } catch (err) {
                console.error("[useMemory] Failed to parse SSE event:", err);
            }
        });

        es.onerror = () => {
            console.warn("[useMemory] SSE connection error, will auto-reconnect...");
        };

        return () => {
            es.close();
            if (toastTimeoutRef.current) {
                window.clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    const dismissToast = useCallback(() => {
        setToast(null);
        if (toastTimeoutRef.current) {
            window.clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = null;
        }
    }, []);

    const handleDeleteInterest = useCallback(async (interest: string) => {
        try {
            await apiDeleteInterest(interest);
            setProfile((prev) => ({
                ...prev,
                interests: prev.interests.filter((i) => i !== interest),
            }));
        } catch (err) {
            console.error("[useMemory] Failed to delete interest:", err);
        }
    }, []);

    const handleDeletePreference = useCallback(async (preference: string) => {
        try {
            await apiDeletePreference(preference);
            setProfile((prev) => ({
                ...prev,
                preferences: prev.preferences.filter((p) => p !== preference),
            }));
        } catch (err) {
            console.error("[useMemory] Failed to delete preference:", err);
        }
    }, []);

    const handleClearMemory = useCallback(async () => {
        try {
            await clearUserProfile();
            setProfile({ interests: [], preferences: [], updated_at: null });
        } catch (err) {
            console.error("[useMemory] Failed to clear profile:", err);
        }
    }, []);

    return {
        profile,
        toast,
        dismissToast,
        deleteInterest: handleDeleteInterest,
        deletePreference: handleDeletePreference,
        clearMemory: handleClearMemory,
    };
}
