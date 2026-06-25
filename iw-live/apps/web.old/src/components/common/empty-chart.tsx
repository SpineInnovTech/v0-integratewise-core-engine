/**
 * EmptyChart — Consistent empty state for chart sections across all dashboards.
 * Shows a subtle placeholder with icon + message + optional CTA.
 */
import { BarChart3, Cable, Loader2, type LucideIcon } from "lucide-react";

type EmptyChartVariant = "connect" | "syncing" | "empty";

interface EmptyChartProps {
  /** Height of the placeholder area (matches chart height) */
  height?: number;
  /** What to show */
  variant?: EmptyChartVariant;
  /** Custom message (overrides variant default) */
  message?: string;
  /** Tool name for "connect" variant (e.g. "CRM", "billing") */
  toolHint?: string;
  /** Custom icon */
  icon?: LucideIcon;
}

const VARIANT_CONFIG: Record<EmptyChartVariant, { icon: LucideIcon; message: string }> = {
  connect: {
    icon: Cable,
    message: "Connect your tools to see data here",
  },
  syncing: {
    icon: Loader2,
    message: "Data is syncing — charts will populate shortly",
  },
  empty: {
    icon: BarChart3,
    message: "Not enough data to display yet",
  },
};

export function EmptyChart({
  height = 200,
  variant = "connect",
  message,
  toolHint,
  icon,
}: EmptyChartProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = icon || config.icon;
  const displayMessage =
    message || (toolHint ? `Connect ${toolHint} to see this data` : config.message);

  return (
    <div className="flex flex-col items-center justify-center text-center gap-3" style={{ height }}>
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
        <Icon
          className={`w-5 h-5 text-muted-foreground ${variant === "syncing" ? "animate-spin" : ""}`}
        />
      </div>
      <p className="text-sm text-muted-foreground max-w-[240px]">{displayMessage}</p>
    </div>
  );
}
