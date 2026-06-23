"use client";

/**
 * Ingestion Panel — Real-time source connector status
 *
 * Shows all connected tools, their sync health, and recent ingestion events.
 * Uses HealthRing for overall health + TimelineStream for recent events.
 * Additive SDAI surface — does not modify existing architecture.
 */

import { useConnectorStatus, useSyncCheckpoints } from "@/hooks/use-sdai-pipeline";
import { HealthRing, TimelineStream } from "@/components/workbench/primitives";
import { ConnectorTile } from "./connector-tile";
import { Plug, Activity, AlertTriangle } from "lucide-react";

export function IngestionPanel() {
  const { data: connectors = [], isLoading: connectorsLoading } = useConnectorStatus();
  const { data: checkpoints = [] } = useSyncCheckpoints();

  if (connectorsLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-6 h-6 border-2 border-[#2d5a3d] border-t-transparent rounded-full" />
      </div>
    );
  }

  const healthyCount = connectors.filter((c) =>
    ["healthy", "connected", "syncing_delta", "syncing_creamy"].includes(c.status)
  ).length;
  const failedCount = connectors.filter((c) =>
    ["failed", "error", "reauth_required"].includes(c.status)
  ).length;
  const totalCount = connectors.length;
  const healthScore = totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0;

  const totalRecords = checkpoints.reduce((s, cp) => s + (cp.records_written || 0), 0);

  const timelineEvents = connectors
    .filter((c) => c.last_sync_at)
    .sort((a, b) => new Date(b.last_sync_at!).getTime() - new Date(a.last_sync_at!).getTime())
    .slice(0, 6)
    .map((c) => ({
      id: `sync-${c.id}`,
      timestamp: c.last_sync_at!,
      type:
        c.status === "failed" || c.status === "error" ? ("govern" as const) : ("ingest" as const),
      title: `${c.provider} ${c.status.replace("_", " ")}`,
      description: c.sync_error || `Connector ${c.status}`,
      source: c.provider,
    }));

  return (
    <div className="space-y-5">
      {/* Health summary */}
      <div className="flex items-center gap-4">
        <HealthRing
          label="Ingestion Health"
          score={healthScore}
          size={80}
          strokeWidth={6}
          status={healthScore >= 80 ? "healthy" : healthScore >= 50 ? "warning" : "critical"}
        />
        <div className="flex-1 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#f4f0e8] border border-[#ebe5d8]">
            <div className="text-[9px] text-[#8a8580] uppercase font-bold tracking-wider">
              Connectors
            </div>
            <div className="text-[18px] font-bold text-[#0e1410]">{totalCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#f4f0e8] border border-[#ebe5d8]">
            <div className="text-[9px] text-[#8a8580] uppercase font-bold tracking-wider">
              Healthy
            </div>
            <div className="text-[18px] font-bold text-[#3d7a50]">{healthyCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#f4f0e8] border border-[#ebe5d8]">
            <div className="text-[9px] text-[#8a8580] uppercase font-bold tracking-wider">
              Records
            </div>
            <div className="text-[18px] font-bold text-[#2d5a3d]">
              {totalRecords.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Connector grid */}
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-[#d8d0c0] bg-[#f4f0e8]">
          <Plug className="w-8 h-8 text-[#d8d0c0] mb-3" />
          <div className="text-[13px] font-semibold text-[#5a5550]">No connectors configured</div>
          <div className="text-[11px] text-[#8a8580] mt-1">
            Connect your first tool to see ingestion status
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {connectors.map((c) => (
            <ConnectorTile key={c.id} connector={c} compact />
          ))}
        </div>
      )}

      {/* Recent sync timeline */}
      {timelineEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[#2d5a3d]" />
            <h4 className="text-[13px] font-bold text-[#0e1410]">Recent Sync Activity</h4>
          </div>
          <TimelineStream events={timelineEvents} maxItems={6} />
        </div>
      )}

      {/* Failed connectors alert */}
      {failedCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#c79f4a]/5 border border-[#c79f4a]/20">
          <AlertTriangle className="w-4 h-4 text-[#c79f4a] shrink-0" />
          <span className="text-[12px] text-[#c79f4a] font-medium">
            {failedCount} connector{failedCount > 1 ? "s" : ""} need{failedCount === 1 ? "s" : ""}{" "}
            attention
          </span>
        </div>
      )}
    </div>
  );
}
