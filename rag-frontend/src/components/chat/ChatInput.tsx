import { useState, useRef, useEffect } from "react";
import MaterialIcon from "../icons/MaterialIcon";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
}

export default function ChatInput({
  onSend,
  disabled = false,
  isStreaming = false,
  onStopStreaming,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "40px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter adds a newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-[280px] bg-background/80 backdrop-blur-md border-t border-outline-variant pb-xl pt-md px-md lg:px-xl z-50">
      <div className="max-w-[900px] mx-auto w-full relative">
        {/* Input Container */}
        <div className="flex items-end gap-sm bg-surface-container border border-outline-variant rounded-xl p-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-sm">
          {/* File Upload */}
          <button className="w-10 h-10 shrink-0 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-highest rounded-lg cursor-pointer">
            <MaterialIcon icon="attach_file" />
          </button>

          {/* Textarea */}
          <div className="flex-1 min-h-[40px] flex items-center relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="w-full bg-transparent border-none focus:ring-0 outline-none text-on-surface placeholder:text-on-surface-variant text-body-md py-sm resize-none h-[40px] max-h-[160px] overflow-y-auto block disabled:opacity-50"
              placeholder="Ask Nexus anything, or type '/' for commands..."
              rows={1}
            />
          </div>

          {/* Send / Stop button */}
          {isStreaming ? (
            <button
              onClick={onStopStreaming}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-error text-on-error rounded-lg hover:bg-error/80 transition-colors cursor-pointer"
              title="Stop generating"
            >
              <MaterialIcon icon="stop" filled />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={disabled || !input.trim()}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-primary text-on-primary rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-[0_0_10px_rgba(194,193,255,0.2)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MaterialIcon icon="send" filled />
            </button>
          )}
        </div>

        {/* Footer note */}
        <div className="flex justify-center mt-sm">
          <p className="text-label-mono text-outline flex items-center gap-xs">
            <MaterialIcon icon="lock" size={14} />
            Enterprise context active. Responses are grounded in internal data.
          </p>
        </div>
      </div>
    </div>
  );
}
