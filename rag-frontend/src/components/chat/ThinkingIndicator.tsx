import MaterialIcon from "../icons/MaterialIcon";

export default function ThinkingIndicator() {
  return (
    <div className="flex flex-col items-start w-full gap-sm">
      {/* AI Header */}
      <div className="flex items-center gap-sm mb-xs ml-sm">
        <MaterialIcon icon="auto_awesome" className="text-primary" size={18} />
        <span className="text-label-mono text-primary font-bold">Nexus AI</span>
      </div>
      {/* Thinking shimmer block */}
      <div className="bg-surface-container border border-outline-variant rounded-xl rounded-tl-sm p-md w-[220px] h-[60px] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
        <div className="flex items-center gap-xs h-full text-on-surface-variant text-label-mono relative z-10">
          <MaterialIcon icon="database_search" className="text-secondary" size={18} />
          <span>Retrieving context...</span>
        </div>
      </div>
    </div>
  );
}
