"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";

export interface InsightBlockProps {
  id: string;
  title: string;
  description: string;
  confidence?: number;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  entityType?: string;
  entityName?: string;
  suggestedAction?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function InsightBlock({
  id,
  title,
  description,
  confidence,
  severity = "info",
  entityType,
  entityName,
  suggestedAction,
  onAction,
  onDismiss,
  className,
}: InsightBlockProps) {
  const severityColors = {
    critical: "border-iw-red/20 bg-iw-red/5/50",
    high: "border-iw-gold/20 bg-iw-gold/5/50",
    medium: "border-iw-gold/20 bg-iw-gold/5/50",
    low: "border-iw-forest/20 bg-iw-forest/5/50",
    info: "border-[#d8d0c0]",
  };

  const badgeVariant =
    severity === "critical" ? "destructive" : severity === "high" ? "destructive" : "secondary";

  return (
    <Card className={cn("p-4 gap-3", severityColors[severity], className)}>
      <CardContent className="p-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold">{title}</span>
            {entityName && (
              <span className="text-[10px] text-muted-foreground">
                {entityType} · {entityName}
              </span>
            )}
          </div>
          <Badge variant={badgeVariant} className="text-[10px] h-5">
            {severity}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            {confidence !== undefined && (
              <span className="text-[10px] text-muted-foreground">{confidence}% confidence</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onDismiss && (
              <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
            {suggestedAction && onAction && (
              <Button size="sm" className="text-xs h-7 px-3" onClick={onAction}>
                {suggestedAction}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
