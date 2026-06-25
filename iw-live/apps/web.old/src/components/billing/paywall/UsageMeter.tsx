"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useTenant } from "@/contexts/tenant-context";

export interface UsageMeterProps {
  /**
   * Metric key matching keys in tenant context limits/usage
   * e.g., "ai.sessions", "connectors.count", "storageGb"
   */
  metricKey: string;
  /**
   * Display label for the meter
   */
  label: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Compact mode for sidebar/header use (single line without label)
   */
  compact?: boolean;
  /**
   * Custom formatter for the usage value
   */
  formatValue?: (value: number) => string;
  /**
   * Custom formatter for the limit value
   */
  formatLimit?: (limit: number | "unlimited") => string;
}

/**
 * Usage meter component that displays current usage vs limit with a progress bar.
 * Color changes based on usage percentage:
 * - Green (default): < 80%
 * - Amber: 80-95%
 * - Red: >= 95%
 *
 * @example
 * ```tsx
 * <UsageMeter metricKey="ai.sessions" label="AI Sessions" />
 * <UsageMeter metricKey="storageGb" label="Storage" formatValue={(v) => `${v} GB`} />
 * <UsageMeter metricKey="connectors.count" label="Integrations" compact />
 * ```
 */
export function UsageMeter({
  metricKey,
  label,
  className,
  compact = false,
  formatValue = (v) => v.toLocaleString(),
  formatLimit = (l) =>
    l === "unlimited" ? "∞" : typeof l === "number" ? l.toLocaleString() : String(l),
}: UsageMeterProps) {
  const { limits, usage } = useTenant();

  const currentUsage = (usage?.[metricKey] ?? 0) as number;
  const limit = limits?.[metricKey];
  const isUnlimited = limit === "unlimited" || limit === undefined;

  // Calculate percentage for progress bar
  const percentage = isUnlimited ? 0 : (currentUsage / (limit as number)) * 100;
  const cappedPercentage = Math.min(100, Math.max(0, percentage));

  // Determine color based on usage percentage
  const getProgressColor = () => {
    if (isUnlimited) return "bg-primary";
    if (percentage >= 95) return "bg-red-500";
    if (percentage >= 80) return "bg-amber-500";
    return "bg-primary";
  };

  const getTextColor = () => {
    if (isUnlimited) return "text-muted-foreground";
    if (percentage >= 95) return "text-red-600";
    if (percentage >= 80) return "text-amber-600";
    return "text-muted-foreground";
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Progress
          value={isUnlimited ? 0 : cappedPercentage}
          max={100}
          className={cn("h-2 flex-1", isUnlimited && "opacity-50")}
          style={{
            ["--progress-color" as string]: getProgressColor(),
          }}
        />
        <span className={cn("text-xs tabular-nums", getTextColor())}>
          {formatValue(currentUsage)}/{formatLimit((limit ?? "unlimited") as number | "unlimited")}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn("text-sm tabular-nums", getTextColor())}>
          {formatValue(currentUsage)} /{" "}
          {formatLimit((limit as number | "unlimited") ?? "unlimited")}
        </span>
      </div>
      <div className="relative">
        <Progress
          value={isUnlimited ? 0 : cappedPercentage}
          max={100}
          className={cn(
            "h-2",
            isUnlimited && "opacity-50",
            !isUnlimited && percentage >= 95 && "[&>div]:bg-red-500",
            !isUnlimited && percentage >= 80 && percentage < 95 && "[&>div]:bg-amber-500"
          )}
        />
      </div>
      {!isUnlimited && percentage >= 80 && (
        <p className={cn("text-xs", getTextColor())}>
          {percentage >= 95 ? "⚠️ Limit almost reached. Upgrade for more." : "Approaching limit."}
        </p>
      )}
    </div>
  );
}

/**
 * Hook to get usage data for a specific metric
 */
export function useUsage(metricKey: string) {
  const { limits, usage } = useTenant();

  return React.useMemo(() => {
    const currentUsage = (usage?.[metricKey] ?? 0) as number;
    const limit = limits?.[metricKey];
    const isUnlimited = limit === "unlimited" || limit === undefined;
    const percentage = isUnlimited ? 0 : (currentUsage / (limit as number)) * 100;

    return {
      current: currentUsage,
      limit,
      isUnlimited,
      percentage,
      isNearLimit: percentage >= 80,
      isAtLimit: percentage >= 100,
    };
  }, [limits, usage, metricKey]);
}
