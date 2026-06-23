"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: "ingest" | "curate" | "govern" | "approve" | "live" | "writeback" | "archive";
  title: string;
  description: string;
  entityType?: string;
  entityName?: string;
  actor?: string;
  source?: string;
}

export interface TimelineStreamProps {
  events: TimelineEvent[];
  maxItems?: number;
  className?: string;
}

const eventTypeConfig: Record<string, { label: string; color: string; dot: string }> = {
  ingest: { label: "Ingested", color: "bg-iw-forest-bright", dot: "#3d7a50" },
  curate: { label: "Curated", color: "bg-iw-gold", dot: "#b8943f" },
  govern: { label: "Governed", color: "bg-iw-gold", dot: "#B8943F" },
  approve: { label: "Approved", color: "bg-iw-forest-bright", dot: "#3D7A50" },
  live: { label: "Live", color: "bg-iw-forest-bright", dot: "#3D7A50" },
  writeback: { label: "Write-back", color: "bg-cyan-500", dot: "#3d7a50" },
  archive: { label: "Archived", color: "bg-slate-400", dot: "#8A8580" },
};

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function TimelineStream({ events, maxItems = 10, className }: TimelineStreamProps) {
  const displayEvents = events.slice(0, maxItems);

  return (
    <Card className={cn("p-0 gap-0 overflow-hidden", className)}>
      <CardHeader className="px-4 py-3 border-b border-[#d8d0c0]">
        <CardTitle className="text-sm font-semibold">Continuity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {displayEvents.map((event, index) => {
            const config = eventTypeConfig[event.type] || eventTypeConfig.ingest;
            const isLast = index === displayEvents.length - 1;

            return (
              <div
                key={event.id}
                className={cn(
                  "flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors",
                  !isLast && "border-b border-[#d8d0c0]"
                )}
              >
                <div className="flex flex-col items-center pt-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.dot }} />
                  {!isLast && <div className="w-px flex-1 bg-[#ebe5d8] mt-1" />}
                </div>
                <div className="flex-1 flex flex-col gap-1 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{event.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                      {config.label}
                    </Badge>
                    {event.entityName && (
                      <span className="text-[10px] text-muted-foreground">
                        {event.entityType} · {event.entityName}
                      </span>
                    )}
                    {event.actor && (
                      <span className="text-[10px] text-muted-foreground">by {event.actor}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
