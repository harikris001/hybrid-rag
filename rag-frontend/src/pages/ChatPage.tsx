import { useEffect, useRef } from "react";
import type { ChatPageProps } from "../types/types";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import ThinkingIndicator from "../components/chat/ThinkingIndicator";
import MaterialIcon from "../components/icons/MaterialIcon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage({
  messages,
  isLoading,
  isStreaming,
  error,
  onSend,
  onStopStreaming,
  activeTool,
}: ChatPageProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or during streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <>
      {/* Chat Canvas (scrollable area) */}
      <main className="flex-1 overflow-y-auto w-full pt-20 pb-32">
        <div className="max-w-[900px] mx-auto w-full px-md lg:px-xl flex flex-col gap-xl">
          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-md">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <MaterialIcon
                  icon="auto_awesome"
                  filled
                  className="text-primary"
                  size={28}
                />
              </div>
              <h2 className="text-headline-md text-on-surface font-bold">
                Start a Conversation
              </h2>
              <p className="text-body-md text-on-surface-variant">
                Ask anything about your uploaded documents. Nexus will retrieve
                relevant context and provide grounded answers.
              </p>
            </div>
          )}

          {/* Loading initial conversation */}
          {isLoading && messages.length === 0 && (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="flex items-center gap-sm text-on-surface-variant">
                <MaterialIcon
                  icon="sync"
                  size={20}
                  className="animate-spin"
                />
                <span className="text-body-md">Loading conversation...</span>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role === "user" ? "user" : "ai"}
              metadata={msg.metadata}
            >
              <div className="text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
            </ChatMessage>
          ))}

          {/* Streaming / thinking indicator */}
          {isStreaming && (
            <div className="mt-md mb-xl">
              <ThinkingIndicator activeTool={activeTool} />
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-sm p-md bg-error-container/20 border border-error/30 rounded-lg">
              <MaterialIcon
                icon="error"
                className="text-error shrink-0"
                size={20}
              />
              <p className="text-body-sm text-error">{error}</p>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Fixed input bar */}
      <ChatInput
        onSend={onSend}
        disabled={isLoading}
        isStreaming={isStreaming}
        onStopStreaming={onStopStreaming}
      />
    </>
  );
}
