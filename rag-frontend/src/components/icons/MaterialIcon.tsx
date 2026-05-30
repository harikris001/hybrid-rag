interface MaterialIconProps {
  icon: string;
  filled?: boolean;
  size?: number;
  className?: string;
}

export default function MaterialIcon({
  icon,
  filled = false,
  size,
  className = "",
}: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
        ...(size ? { fontSize: `${size}px` } : {}),
      }}
    >
      {icon}
    </span>
  );
}
