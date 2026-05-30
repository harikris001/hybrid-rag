interface RiskCardProps {
  number: string;
  label: string;
  description: string;
  accentColor?: "tertiary" | "secondary" | "primary" | "error";
}

const colorMap = {
  tertiary: "text-tertiary",
  secondary: "text-secondary",
  primary: "text-primary",
  error: "text-error",
};

export default function RiskCard({
  number,
  label,
  description,
  accentColor = "tertiary",
}: RiskCardProps) {
  return (
    <div className="p-md rounded border border-outline-variant bg-surface/50">
      <span className={`text-label-mono ${colorMap[accentColor]} mb-xs block`}>
        {number} // {label}
      </span>
      <p className="text-body-sm text-on-surface-variant">{description}</p>
    </div>
  );
}
