import { useEffect } from "react";
import type { UserProfile } from "../../types/types";
import MaterialIcon from "../icons/MaterialIcon";

interface MemoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onDeleteInterest: (interest: string) => void;
    onDeletePreference: (preference: string) => void;
    onClearMemory: () => void;
}

/**
 * Removable chip used for both interest and preference tags.
 */
function MemoryChip({
    label,
    icon,
    onDelete,
    variant = "primary",
}: {
    label: string;
    icon: string;
    onDelete: () => void;
    variant?: "primary" | "tertiary";
}) {
    const styles =
        variant === "primary"
            ? "bg-primary/8 text-primary border-primary/15 hover:bg-primary/15 hover:border-primary/30"
            : "bg-tertiary/8 text-tertiary border-tertiary/15 hover:bg-tertiary/15 hover:border-tertiary/30";

    return (
        <div
            className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-body-sm font-medium transition-all duration-200 ${styles}`}
        >
            <MaterialIcon icon={icon} size={16} className="opacity-60" />
            <span>{label}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5 rounded-full hover:bg-black/10"
            >
                <MaterialIcon icon="close" size={12} />
            </button>
        </div>
    );
}

export default function MemoryModal({
    isOpen,
    onClose,
    profile,
    onDeleteInterest,
    onDeletePreference,
    onClearMemory,
}: MemoryModalProps) {
    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const hasMemory =
        profile.interests.length > 0 || profile.preferences.length > 0;
    const totalCount = profile.interests.length + profile.preferences.length;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-background/80 backdrop-blur-sm animate-modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Modal Container */}
            <div className="w-full max-w-2xl bg-surface border border-outline-variant rounded-2xl shadow-2xl ai-glow flex flex-col max-h-[80vh] overflow-hidden animate-modal-content">
                {/* ── Header ── */}
                <div className="p-lg border-b border-outline-variant bg-surface-container-lowest">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-md">
                            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <MaterialIcon
                                    icon="psychology"
                                    filled
                                    size={24}
                                    className="text-primary"
                                />
                            </div>
                            <div>
                                <h2 className="text-headline-md font-bold text-on-surface">
                                    Memory
                                </h2>
                                <p className="text-body-sm text-on-surface-variant mt-0.5">
                                    What the AI has learned about you from conversations.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-on-surface-variant hover:text-on-surface transition-colors p-sm rounded-lg hover:bg-surface-variant cursor-pointer"
                        >
                            <MaterialIcon icon="close" />
                        </button>
                    </div>

                    {/* Stats bar */}
                    {hasMemory && (
                        <div className="flex items-center gap-lg mt-md pt-md border-t border-outline-variant/30">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-body-sm text-on-surface-variant">
                                    <span className="font-semibold text-on-surface">
                                        {profile.interests.length}
                                    </span>{" "}
                                    {profile.interests.length === 1
                                        ? "interest"
                                        : "interests"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-tertiary" />
                                <span className="text-body-sm text-on-surface-variant">
                                    <span className="font-semibold text-on-surface">
                                        {profile.preferences.length}
                                    </span>{" "}
                                    {profile.preferences.length === 1
                                        ? "preference"
                                        : "preferences"}
                                </span>
                            </div>
                            {profile.updated_at && (
                                <div className="flex items-center gap-1.5 ml-auto">
                                    <MaterialIcon
                                        icon="schedule"
                                        size={14}
                                        className="text-outline"
                                    />
                                    <span className="text-label-mono text-outline">
                                        Updated{" "}
                                        {new Date(profile.updated_at).toLocaleDateString(
                                            undefined,
                                            {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto p-lg bg-surface-container-lowest">
                    {!hasMemory ? (
                        /* ── Empty state ── */
                        <div className="flex flex-col items-center justify-center py-xl text-center gap-md">
                            <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant/30">
                                <MaterialIcon
                                    icon="psychology"
                                    size={40}
                                    className="text-outline"
                                />
                            </div>
                            <div>
                                <p className="text-body-lg font-medium text-on-surface">
                                    No memories yet
                                </p>
                                <p className="text-body-sm text-on-surface-variant mt-1 max-w-sm">
                                    As you chat, the AI will learn your interests,
                                    technologies you use, and communication preferences to
                                    personalize responses.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-xl">
                            {/* ── Interests section ── */}
                            {profile.interests.length > 0 && (
                                <div className="flex flex-col gap-md">
                                    <div className="flex items-center gap-sm">
                                        <MaterialIcon
                                            icon="interests"
                                            size={18}
                                            className="text-primary"
                                        />
                                        <span className="text-body-sm font-semibold text-on-surface">
                                            Interests & Topics
                                        </span>
                                        <span className="text-label-mono text-on-surface-variant/50">
                                            ({profile.interests.length})
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.interests.map((interest) => (
                                            <MemoryChip
                                                key={interest}
                                                label={interest}
                                                icon="topic"
                                                onDelete={() =>
                                                    onDeleteInterest(interest)
                                                }
                                                variant="primary"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Preferences section ── */}
                            {profile.preferences.length > 0 && (
                                <div className="flex flex-col gap-md">
                                    <div className="flex items-center gap-sm">
                                        <MaterialIcon
                                            icon="tune"
                                            size={18}
                                            className="text-tertiary"
                                        />
                                        <span className="text-body-sm font-semibold text-on-surface">
                                            Style & Preferences
                                        </span>
                                        <span className="text-label-mono text-on-surface-variant/50">
                                            ({profile.preferences.length})
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.preferences.map((preference) => (
                                            <MemoryChip
                                                key={preference}
                                                label={preference}
                                                icon="settings"
                                                onDelete={() =>
                                                    onDeletePreference(preference)
                                                }
                                                variant="tertiary"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="p-md border-t border-outline-variant bg-surface flex justify-between items-center">
                    <div className="text-label-mono text-on-surface-variant flex items-center gap-sm">
                        <MaterialIcon icon="psychology" size={16} />
                        {totalCount} {totalCount === 1 ? "memory" : "memories"} stored
                    </div>
                    <div className="flex items-center gap-sm">
                        {hasMemory && (
                            <button
                                onClick={onClearMemory}
                                className="flex items-center gap-xs px-md py-sm rounded-lg text-body-sm text-error/70 hover:text-error hover:bg-error/5 border border-transparent hover:border-error/20 transition-all cursor-pointer"
                            >
                                <MaterialIcon icon="delete_sweep" size={16} />
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-md py-sm rounded-lg text-label-caps text-on-surface-variant hover:bg-surface-variant transition-colors border border-transparent hover:border-outline-variant cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
