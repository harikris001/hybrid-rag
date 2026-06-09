import type { MemoryToastProps } from "../../types/types";
import MaterialIcon from "../icons/MaterialIcon";

/**
 * MemoryToast – animated toast notification that appears when the
 * memory agent updates the user profile in the background.
 */
export default function MemoryToast({ event, onDismiss }: MemoryToastProps) {
    if (!event) return null;

    const newItems = [...event.new_interests, ...event.new_preferences];
    const summary = newItems.length > 0
        ? newItems.slice(0, 3).join(", ") + (newItems.length > 3 ? ` +${newItems.length - 3} more` : "")
        : "profile updated";

    return (
        <div
            className="fixed bottom-6 right-6 z-[100] animate-toast-in cursor-pointer"
            onClick={onDismiss}
        >
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-surface-container-high border border-outline-variant/40 shadow-2xl backdrop-blur-sm">
                {/* Animated sparkle icon */}
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 animate-pulse">
                    <MaterialIcon icon="psychology" filled className="text-primary" size={18} />
                </div>

                <div className="flex flex-col">
                    <span className="text-body-sm font-semibold text-on-surface">
                        Memory updated
                    </span>
                    <span className="text-body-sm text-on-surface-variant">
                        Learned: <em className="text-primary/80">{summary}</em>
                    </span>
                </div>

                {/* Dismiss button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                    className="ml-2 p-1 rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer"
                >
                    <MaterialIcon icon="close" size={14} className="text-outline" />
                </button>
            </div>
        </div>
    );
}
