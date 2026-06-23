/**
 * Health Gauge — Circular health score visualization
 * Cherry-picked from Project Task Organizer, adapted for IntegrateWise
 */
import { cn } from "@/components/ui/utils";

interface HealthGaugeProps {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function HealthGauge({
  score,
  maxScore = 10,
  size = "md",
  showLabel = true,
  label = "Health Score",
  className,
}: HealthGaugeProps) {
  const percentage = (score / maxScore) * 100;

  const getColor = (s: number) => {
    if (s >= 7) return "#3d7a50"; // iw-forest-bright
    if (s >= 5) return "var(--iw-gold)"; // amber-500
    return "#ef4444"; // red-500
  };

  const color = getColor(score);

  const sizeConfig = {
    sm: { container: 80, inner: 60, font: "text-xl", labelSize: "text-[10px]" },
    md: { container: 140, inner: 110, font: "text-3xl", labelSize: "text-xs" },
    lg: { container: 200, inner: 160, font: "text-5xl", labelSize: "text-sm" },
  };

  const config = sizeConfig[size];
  const strokeWidth = size === "sm" ? 8 : size === "md" ? 12 : 16;
  const radius = (config.container - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: config.container, height: config.container }}>
        {/* Background circle */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={config.container}
          height={config.container}
        >
          <circle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 0.5s ease-out",
            }}
          />
        </svg>

        {/* Inner content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            margin: (config.container - config.inner) / 2,
            width: config.inner,
            height: config.inner,
          }}
        >
          <span className={cn("font-bold", config.font)} style={{ color }}>
            {score.toFixed(1)}
          </span>
          {showLabel && (
            <span className={cn("text-muted-foreground mt-0.5", config.labelSize)}>{label}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface HealthBadgeProps {
  score: number;
  maxScore?: number;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function HealthBadge({
  score,
  maxScore = 10,
  showValue = true,
  size = "md",
  className,
}: HealthBadgeProps) {
  const getStatus = (s: number) => {
    if (s >= 7) return { label: "Healthy", color: "bg-iw-forest-bright", text: "text-white" };
    if (s >= 5) return { label: "At Risk", color: "bg-iw-gold", text: "text-white" };
    return { label: "Critical", color: "bg-iw-red", text: "text-white" };
  };

  const status = getStatus(score);

  const sizeClasses: Record<NonNullable<HealthBadgeProps["size"]>, string> = {
    sm: "gap-1.5 px-2 py-0.5 text-[11px]",
    md: "gap-2 px-2.5 py-1 text-xs",
    lg: "gap-2.5 px-3 py-1.5 text-sm",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeClasses[size],
        status.color,
        status.text,
        className
      )}
    >
      <span className={cn("rounded-full bg-white/80", size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2")} />
      {status.label}
      {showValue && (
        <span className="opacity-80">
          ({score.toFixed(1)}/{maxScore})
        </span>
      )}
    </div>
  );
}
