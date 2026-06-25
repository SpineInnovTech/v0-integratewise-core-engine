export interface IntegrateWiseLogoProps {
  className?: string;
  size?: number;
  variant?: "icon" | "full" | "text";
}

export function IntegrateWiseLogo({
  className = "",
  size = 32,
  variant = "icon",
}: IntegrateWiseLogoProps) {
  if (variant === "text") {
    return <div className={`font-bold text-lg ${className}`}>IntegrateWise</div>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="flex-shrink-0">
        <rect width="32" height="32" rx="8" fill="#2d5a3d" />
        <text
          x="50%"
          y="50%"
          fill="white"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          iW
        </text>
      </svg>
      {variant === "full" && (
        <span className="hidden sm:inline font-semibold text-gray-900">IntegrateWise</span>
      )}
    </div>
  );
}

export default IntegrateWiseLogo;
