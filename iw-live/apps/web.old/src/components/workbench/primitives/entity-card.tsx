"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

export interface EntityCardProps {
  id: string;
  name: string;
  entityType: string;
  healthScore?: number;
  status?: string;
  sources?: string[];
  fields?: Array<{ label: string; value: string | number }>;
  actions?: Array<{ label: string; onClick: () => void }>;
  className?: string;
}

export function EntityCard({
  id,
  name,
  entityType,
  healthScore,
  status,
  sources,
  fields,
  actions,
  className,
}: EntityCardProps) {
  const healthColor =
    healthScore && healthScore >= 80
      ? "bg-iw-forest-bright"
      : healthScore && healthScore >= 60
        ? "bg-iw-gold"
        : "bg-iw-red";
  const statusVariant =
    status === "active" ? "default" : status === "at-risk" ? "destructive" : "secondary";

  return (
    <Card className={cn("p-0 gap-0 overflow-hidden", className)}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {entityType}
            </span>
            <span className="font-semibold text-sm">{name}</span>
          </div>
          {status && <Badge variant={statusVariant}>{status}</Badge>}
        </div>

        {healthScore !== undefined && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Health</span>
              <span className="font-medium">{healthScore}%</span>
            </div>
            <Progress value={healthScore} className="h-1.5" />
          </div>
        )}

        {fields && fields.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {fields.map((f) => (
              <div key={f.label} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase">{f.label}</span>
                <span className="text-xs font-medium">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {sources && sources.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>Sources:</span>
            {sources.map((s) => (
              <span key={s} className="bg-muted px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      {actions && actions.length > 0 && (
        <CardFooter className="px-4 py-3 border-t border-[#d8d0c0] flex gap-2">
          {actions.map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant="outline"
              className="text-xs h-8"
              onClick={a.onClick}
            >
              {a.label}
            </Button>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}
