import MaterialIcon from "../icons/MaterialIcon";

interface SourceBadgeProps {
  icon: string;
  label: string;
}

export default function SourceBadge({ icon, label }: SourceBadgeProps) {
  return (
    <button className="bg-surface-variant text-on-surface-variant border border-outline-variant px-sm py-xs rounded hover:bg-surface-container-highest hover:text-primary transition-colors flex items-center gap-xs cursor-pointer">
      <MaterialIcon icon={icon} size={14} />
      <span className="text-label-mono">{label}</span>
    </button>
  );
}
