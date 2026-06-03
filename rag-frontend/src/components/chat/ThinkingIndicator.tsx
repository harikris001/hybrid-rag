import MaterialIcon from "../icons/MaterialIcon";

interface ThinkingIndicatorProps {
  activeTool: { tool: string; query?: string } | null;
}

export default function ThinkingIndicator({ activeTool }: ThinkingIndicatorProps) {
  let icon = "auto_awesome";
  let statusText = "Thinking...";
  let detailText = "";

  if (activeTool) {
    if (activeTool.tool === "search_documents") {
      icon = "database";
      statusText = "Retrieving context...";
      detailText = activeTool.query || "";
    } else if (activeTool.tool === "web_search") {
      icon = "language";
      statusText = "Searching the web...";
      detailText = activeTool.query || "";
    } else if (activeTool.tool === "solve_math") {
      icon = "calculate";
      statusText = "Solving expression...";
      detailText = activeTool.query || "";
    }
  }

  return (
    <div className="flex flex-col items-start w-full gap-xs">
      {/* AI Header */}
      <div className="flex items-center gap-sm mb-xs ml-sm">
        <MaterialIcon icon="auto_awesome" className="text-primary animate-pulse" size={18} />
        <span className="text-label-mono text-primary font-bold">Nexus AI</span>
      </div>
      {/* Thinking shimmer block */}
      <div className="bg-surface-container border border-outline-variant rounded-xl rounded-tl-sm p-md min-w-[240px] max-w-[400px] relative overflow-hidden transition-all duration-350 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
        <div className="flex flex-col gap-xs h-full text-on-surface-variant text-label-mono relative z-10">
          <div className="flex items-center gap-sm font-medium">
            <MaterialIcon icon={icon} className="text-secondary animate-pulse" size={18} />
            <span>{statusText}</span>
          </div>
          {detailText && (
            <div className="text-body-sm text-on-surface-variant/70 italic pl-7 truncate max-w-[340px]" title={detailText}>
              "{detailText}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
