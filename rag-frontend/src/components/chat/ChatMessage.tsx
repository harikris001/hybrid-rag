import MaterialIcon from "../icons/MaterialIcon";
import type { MessageMetadata, DocumentSource } from "../../types/types";
import { useState } from "react";

interface ChatMessageProps {
  role: "user" | "ai";
  children: React.ReactNode;
  metadata?: MessageMetadata;
}

export default function ChatMessage({ role, children, metadata }: ChatMessageProps) {
  const [activeChunk, setActiveChunk] = useState<DocumentSource | null>(null);
  const [chunkText, setChunkText] = useState<string>("");
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);
  const handleChunkClick = async (source: DocumentSource) => {
    setActiveChunk(source);

    // 1. If the text was preloaded in metadata, use it directly
    const preloadedText = source.text || source.document;
    if (preloadedText) {
      setChunkText(preloadedText);
      return;
    }
    // 2. Otherwise, fetch it on-demand from the backend using the chunk ID
    if (source.id) {
      setIsLoadingChunk(true);
      setChunkText("Loading...");
      try {
        // Adjust the API base URL to match your server configuration
        const response = await fetch(`http://localhost:8000/doc/chunks/${source.id}`);
        if (!response.ok) throw new Error("Failed to load chunk");

        const data = await response.json();
        setChunkText(data.document || data.text || "No content available.");
      } catch (err) {
        setChunkText("Failed to retrieve chunk content from the server.");
      } finally {
        setIsLoadingChunk(false);
      }
    } else {
      setChunkText("Unable to fetch chunk content (missing chunk ID).");
    }
  };
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

        {/* Sources/Metadata section */}
        {metadata?.sources && metadata.sources.length > 0 && (
          <div className="mt-xs pt-sm border-t border-primary/10 flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant font-medium">Sources</span>
            <div className="flex flex-wrap gap-xs">
              {metadata.sources.map((source: DocumentSource, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleChunkClick(source)}
                  className="flex items-center gap-xs bg-surface-container hover:bg-primary/10 rounded-md px-2 py-1 border border-outline-variant/50 cursor-pointer transition-colors duration-200 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <MaterialIcon icon="description" size={14} className="text-primary/70" />
                  <span className="text-body-sm text-on-surface-variant text-[11px]">
                    {source.source || "Document"}
                    {source.chunk_number !== undefined ? ` (Chunk ${source.chunk_number})` : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Modal / Dialog Backdrop */}
      {activeChunk && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-md"
          onClick={() => setActiveChunk(null)}
        >
          {/* Modal Container */}
          <div
            className="bg-surface rounded-2xl border border-outline-variant max-w-[600px] w-full p-lg shadow-2xl flex flex-col gap-md"
            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the modal
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-outline-variant/50 pb-sm">
              <div className="flex items-center gap-sm">
                <MaterialIcon icon="description" className="text-primary" />
                <div>
                  <h3 className="font-semibold text-on-surface text-body-lg">
                    {activeChunk.source}
                  </h3>
                  <p className="text-label-sm text-on-surface-variant">
                    Chunk {activeChunk.chunk_number ?? "N/A"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveChunk(null)}
                className="text-on-surface-variant hover:text-on-surface p-xs rounded-full hover:bg-surface-container-high transition-colors"
              >
                <MaterialIcon icon="close" size={20} />
              </button>
            </div>
            {/* Modal Content / Text Area */}
            <div className="text-body-md text-on-surface leading-relaxed max-h-[300px] overflow-y-auto pr-xs bg-surface-container-low p-md rounded-lg border border-outline-variant/30 whitespace-pre-wrap">
              {isLoadingChunk ? (
                <div className="flex items-center gap-sm text-on-surface-variant">
                  <MaterialIcon icon="sync" size={16} className="animate-spin" />
                  <span>Fetching content...</span>
                </div>
              ) : (
                chunkText
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-xs">
              <button
                onClick={() => setActiveChunk(null)}
                className="px-lg py-sm bg-primary text-on-primary rounded-full hover:shadow-lg transition-all text-body-sm font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
