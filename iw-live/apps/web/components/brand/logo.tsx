interface LogoProps {
  variant?: "light" | "dark"
  showTagline?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: { width: 180, height: 40, scale: 0.28 },
  md: { width: 320, height: 70, scale: 0.5 },
  lg: { width: 640, height: 140, scale: 1 },
}

export function Logo({ variant = "light", showTagline = true, className = "", size = "md" }: LogoProps) {
  const { width, height } = sizeMap[size]
  const isDark = variant === "dark"

  // Brand colors
  const pathColor = isDark ? "#5C6BC0" : "#3F51B5"
  const wordmarkColor = isDark ? "#FFFFFF" : "#1E2A4A"
  const taglineColor = isDark ? "#E0E7FF" : "#3F51B5"
  const bgColor = isDark ? "#1E2A4A" : "transparent"

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 640 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`IntegrateWise${showTagline ? " — Enterprise Integrations" : ""}`}
      className={className}
    >
      {isDark && <rect width="640" height="140" fill={bgColor} rx="8" />}

      {/* Logomark: 4 uniform nodes connected by a single clean path */}
      <g transform="translate(24, 30)">
        {/* Grid-aligned winding path */}
        <path
          d="M0 40 C 24 40, 24 12, 48 12 C 72 12, 72 68, 96 68 C 120 68, 120 40, 144 40"
          stroke={pathColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Uniform circular nodes */}
        <circle cx="0" cy="40" r="14" fill={pathColor} />
        <circle cx="48" cy="12" r="14" fill={pathColor} />
        <circle cx="96" cy="68" r="14" fill={pathColor} />
        <circle cx="144" cy="40" r="14" fill={pathColor} />
      </g>

      {/* Wordmark + Tagline */}
      <g transform="translate(200, 0)">
        <text
          x="0"
          y="76"
          fontFamily="'Inter', sans-serif"
          fontWeight="700"
          fontSize="56"
          fill={wordmarkColor}
          letterSpacing="-1.2"
        >
          IntegrateWise
        </text>
        {showTagline && (
          <text
            x="2"
            y="106"
            fontFamily="'Inter', sans-serif"
            fontWeight="500"
            fontSize="18"
            fill={taglineColor}
            letterSpacing="0.6"
          >
            Enterprise Integrations
          </text>
        )}
      </g>
    </svg>
  )
}

export function LogoMark({
  variant = "light",
  className = "",
  size = 48,
}: { variant?: "light" | "dark"; className?: string; size?: number }) {
  const isDark = variant === "dark"
  const color = isDark ? "#5C6BC0" : "#3F51B5"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="IntegrateWise"
      className={className}
    >
      {/* Grid-aligned winding path (scaled) */}
      <path
        d="M8 40 C 20 40, 20 16, 32 16 C 44 16, 44 64, 56 64 C 68 64, 68 40, 80 40"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(-4, 0) scale(0.9)"
      />
      {/* Uniform circular nodes (scaled) */}
      <circle cx="4" cy="36" r="7" fill={color} />
      <circle cx="26" cy="14" r="7" fill={color} />
      <circle cx="48" cy="58" r="7" fill={color} />
      <circle cx="70" cy="36" r="7" fill={color} />
    </svg>
  )
}

export function LogoWordmark({
  variant = "light",
  className = "",
}: { variant?: "light" | "dark"; className?: string }) {
  const isDark = variant === "dark"
  const color = isDark ? "#FFFFFF" : "#1E2A4A"

  return (
    <span
      className={`font-bold text-2xl tracking-tight ${className}`}
      style={{
        fontFamily: "'Inter', sans-serif",
        color,
        letterSpacing: "-0.02em",
      }}
    >
      IntegrateWise
    </span>
  )
}
