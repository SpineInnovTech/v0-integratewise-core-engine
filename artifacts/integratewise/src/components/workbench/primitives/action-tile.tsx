"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";

export interface ActionTileProps {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss?: () => void;
  entityType?: string;
  entityName?: string;
  targetSystem?: string;
  impact?: "high" | "medium" | "low";
  className?: string;
}

export function ActionTile({
  id,
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  entityType,
  entityName,
  targetSystem,
  impact = "medium",
  className,
}: ActionTileProps) {
  const impactColors = {
    high: "border-iw-red/20 bg-iw-red/5/30",
    medium: "border-iw-gold/20 bg-iw-gold/5/30",
    low: "border-iw-forest/20 bg-iw-forest/5/30",
  };

  return (
    <Card className={cn("p-0 gap-0 overflow-hidden", impactColors[impact], className)}>
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium">{title}</span>
          {targetSystem && (
            <Badge variant="outline" className="text-[10px] h-5">
              {targetSystem}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        {entityName && (
          <span className="text-[10px] text-muted-foreground">
            {entityType} · {entityName}
          </span>
        )}
      </CardContent>
      <CardFooter className="px-4 py-3 border-t border-[#d8d0c0] flex items-center justify-between">
        {onDismiss && (
          <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
        <div className="flex-1" />
        <Button size="sm" className="text-xs h-7 px-3" onClick={onAction}>
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
