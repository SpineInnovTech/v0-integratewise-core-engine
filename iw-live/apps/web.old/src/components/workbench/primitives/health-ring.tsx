"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";

export interface HealthRingProps {
  label: string;
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  status?: "healthy" | "warning" | "critical" | "unknown";
  sublabel?: string;
  className?: string;
}

export function HealthRing({
  label,
  score,
  maxScore = 100,
  size = 80,
  strokeWidth = 6,
  status,
  sublabel,
  className,
}: HealthRingProps) {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const inferredStatus =
    status || (percentage >= 80 ? "healthy" : percentage >= 60 ? "warning" : "critical");

  const statusColors = {
    healthy: "#3d7a50",
    warning: "#B8943F",
    critical: "#EF4444",
    unknown: "#8A8580",
  };

  const color = statusColors[inferredStatus];

  return (
    <Card className={cn("p-4 gap-3 flex flex-col items-center", className)}>
      <CardHeader className="p-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col items-center gap-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#ebe5d8"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-semibold">{Math.round(percentage)}%</span>
          </div>
        </div>
        {sublabel && (
          <span className="text-[10px] text-muted-foreground text-center">{sublabel}</span>
        )}
      </CardContent>
    </Card>
  );
}
