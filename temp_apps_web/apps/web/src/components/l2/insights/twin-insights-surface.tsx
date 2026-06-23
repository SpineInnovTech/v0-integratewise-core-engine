"use client";

import { Bot, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignalsPanel } from "@/components/_deprecated/l2-removed/panels-index-full";
import { openTwinWorkbench } from "@/lib/twin-handoff";

interface TwinInsightsSurfaceProps {
  entityType?: string;
  entityId?: string;
  entityName?: string;
  domain?: string;
  insightTitle?: string;
}

/**
 * L2 Twin insights — digest and signals only.
 * Full chat/voice/execute lives in L3 (native Twin Workbench), opened via handoff.
 */
export function TwinInsightsSurface({
  entityType,
  entityId,
  entityName,
  domain,
  insightTitle,
}: TwinInsightsSurfaceProps) {
  const hasEntity = Boolean(entityId && entityId !== "current");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2d5a3d] to-[#c79f4a] flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold">Twin Insights (L2)</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Signals and scoring digests stay here. Chat, voice, and execution run in the Twin
              Workbench (L3).
            </p>
            {hasEntity && (
              <p className="text-xs font-medium mt-2 truncate">
                Context: {entityName || entityId}
                {entityType ? ` · ${entityType}` : ""}
              </p>
            )}
            {insightTitle && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {insightTitle}
              </p>
            )}
          </div>
        </div>
        <Button
          className="w-full mt-4"
          onClick={() =>
            openTwinWorkbench({
              entityId,
              entityType,
              entityName,
              domain,
              insightTitle,
              source: "l2",
            })
          }
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Twin Workbench
        </Button>
      </div>

      {hasEntity && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Entity Signals
          </h4>
          <SignalsPanel entityType={entityType} entityId={entityId} />
        </div>
      )}
    </div>
  );
}
