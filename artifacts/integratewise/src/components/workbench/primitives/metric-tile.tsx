"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

export interface MetricTileProps {
  label: string;
  value: string | number;
  formatted?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  provenance?: string[];
  className?: string;
}

export function MetricTile({
  label,
  value,
  formatted,
  trend,
  trendLabel,
  icon,
  color = "#2d5a3d",
  provenance,
  className,
}: MetricTileProps) {
  const displayValue = formatted || (typeof value === "number" ? value.toLocaleString() : value);
  const trendUp = trend && trend > 0;
  const trendDown = trend && trend < 0;

  return (
    <Card className={cn("p-5 gap-3", className)}>
      <CardContent className="p-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          {icon && (
            <div className="text-muted-foreground" style={{ color }}>
              {icon}
            </div>
          )}
        </div>
        <div className="text-2xl font-semibold tracking-tight">{displayValue}</div>
        {(trend !== undefined || trendLabel) && (
          <div className="flex items-center gap-1.5 text-xs">
            {trendUp && <span className="text-iw-forest-bright font-medium">+{trend}%</span>}
            {trendDown && <span className="text-iw-red font-medium">{trend}%</span>}
            {trendLabel && (
              <span
                className={cn(
                  "text-muted-foreground",
                  trendUp && "text-iw-forest-bright/70",
                  trendDown && "text-iw-red/70"
                )}
              >
                {trendLabel}
              </span>
            )}
          </div>
        )}
        {provenance && provenance.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
            <span>via</span>
            {provenance.map((s, i) => (
              <span key={s} className="bg-muted px-1.5 py-0.5 rounded">
                {s}
                {i < provenance.length - 1 ? "," : ""}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
