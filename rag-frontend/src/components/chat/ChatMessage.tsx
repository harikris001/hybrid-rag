import MaterialIcon from "../icons/MaterialIcon";
import type { MessageMetadata, DocumentSource } from "../../types/types";

interface ChatMessageProps {
  role: "user" | "ai";
  children: React.ReactNode;
  metadata?: MessageMetadata;
}

export default function ChatMessage({ role, children, metadata }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex flex-col items-end w-full">
        <div className="bg-surface-container-high rounded-xl rounded-tr-sm p-lg text-on-surface max-w-[85%] md:max-w-[75%] border border-outline-variant shadow-sm">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start w-full gap-sm">
      {/* AI Header */}
      <div className="flex items-center gap-sm mb-xs ml-sm">
        <MaterialIcon icon="auto_awesome" className="text-primary" size={18} />
        <span className="text-label-mono text-primary font-bold">Nexus AI</span>
      </div>
      <div className="bg-primary/5 backdrop-blur-md rounded-xl rounded-tl-sm p-lg text-on-surface max-w-[90%] border border-primary/20 shadow-[0_4px_24px_-4px_rgba(194,193,255,0.05)] flex flex-col gap-md">
        {children}
        
        {/* Metadata section */}
        {metadata?.sources && metadata.sources.length > 0 && (
          <div className="mt-xs pt-sm border-t border-primary/10 flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant font-medium">Sources</span>
            <div className="flex flex-wrap gap-xs">
              {metadata.sources.map((source: DocumentSource, idx: number) => (
                <div key={idx} className="flex items-center gap-xs bg-surface-container rounded-md px-2 py-1 border border-outline-variant/50">
                  <MaterialIcon icon="description" size={14} className="text-primary/70" />
                  <span className="text-body-sm text-on-surface-variant text-[11px]">
                    {source.source || "Document"}
                    {source.chunk_number !== undefined ? ` (Chunk ${source.chunk_number})` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
