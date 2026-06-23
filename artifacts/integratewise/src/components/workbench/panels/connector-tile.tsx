"use client";

/**
 * Connector Tile — Per-tool status card
 *
 * Shows real-time connector health: provider, status, last sync, record counts.
 * Part of SDAI operational surfaces (Phase 3).
 */

import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  Loader2,
  Plug,
  type LucideIcon,
} from "lucide-react";
import type { ConnectorStatus } from "@/hooks/use-sdai-pipeline";

const PROVIDER_ICONS: Record<string, LucideIcon> = {
  salesforce: Cloud,
  hubspot: Cloud,
  slack: Cloud,
  gmail: Cloud,
  google: Cloud,
  notion: Cloud,
  jira: Cloud,
  github: Cloud,
  zendesk: Cloud,
  intercom: Cloud,
  stripe: Cloud,
  quickbooks: Cloud,
  default: Plug,
};

const STATUS_CONFIG: Record<
  ConnectorStatus["status"],
  { icon: LucideIcon; color: string; bg: string; label: string }
> = {
  pending_auth: {
    icon: CloudOff,
    color: "text-[#8a8580]",
    bg: "bg-[#ebe5d8]",
    label: "Auth Required",
  },
  connected: {
    icon: CheckCircle2,
    color: "text-[#3d7a50]",
    bg: "bg-[#3d7a50]/10",
    label: "Connected",
  },
  initializing: {
    icon: Loader2,
    color: "text-[#2d5a3d]",
    bg: "bg-[#2d5a3d]/10",
    label: "Initializing",
  },
  syncing_creamy: {
    icon: RefreshCw,
    color: "text-[#2d5a3d]",
    bg: "bg-[#2d5a3d]/10",
    label: "Creamy Sync",
  },
  healthy: { icon: CheckCircle2, color: "text-[#3d7a50]", bg: "bg-[#3d7a50]/10", label: "Healthy" },
  syncing_delta: {
    icon: RefreshCw,
    color: "text-[#2d5a3d]",
    bg: "bg-[#2d5a3d]/10",
    label: "Delta Sync",
  },
  syncing_full: {
    icon: RefreshCw,
    color: "text-[#2d5a3d]",
    bg: "bg-[#2d5a3d]/10",
    label: "Full Sync",
  },
  degraded: {
    icon: AlertTriangle,
    color: "text-[#B8943F]",
    bg: "bg-[#B8943F]/10",
    label: "Degraded",
  },
  reauth_required: {
    icon: CloudOff,
    color: "text-[#c79f4a]",
    bg: "bg-[#c79f4a]/10",
    label: "Re-auth",
  },
  paused: { icon: PauseCircle, color: "text-[#8a8580]", bg: "bg-[#ebe5d8]", label: "Paused" },
  failed: { icon: AlertTriangle, color: "text-[#c79f4a]", bg: "bg-[#c79f4a]/10", label: "Failed" },
  disconnected: {
    icon: CloudOff,
    color: "text-[#8a8580]",
    bg: "bg-[#ebe5d8]",
    label: "Disconnected",
  },
  error: { icon: AlertTriangle, color: "text-[#c79f4a]", bg: "bg-[#c79f4a]/10", label: "Error" },
  pending: { icon: Loader2, color: "text-[#8a8580]", bg: "bg-[#ebe5d8]", label: "Pending" },
};

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

interface ConnectorTileProps {
  connector: ConnectorStatus;
  onClick?: (connector: ConnectorStatus) => void;
  compact?: boolean;
}

export function ConnectorTile({ connector, onClick, compact = false }: ConnectorTileProps) {
  const config = STATUS_CONFIG[connector.status] || STATUS_CONFIG.pending;
  const Icon = PROVIDER_ICONS[connector.provider] || PROVIDER_ICONS.default;
  const StatusIcon = config.icon;
  const isSyncing = connector.status.startsWith("syncing") || connector.status === "initializing";

  if (compact) {
    return (
      <button
        onClick={() => onClick?.(connector)}
        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#ebe5d8] hover:border-[#d8d0c0] hover:bg-[#f4f0e8] transition-all text-left w-full"
      >
        <div
          className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}
        >
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-[#0e1410] truncate capitalize">
            {connector.provider}
          </div>
          <div className="flex items-center gap-1">
            <StatusIcon className={`w-3 h-3 ${config.color} ${isSyncing ? "animate-spin" : ""}`} />
            <span className={`text-[10px] ${config.color}`}>{config.label}</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick?.(connector)}
      className="flex flex-col p-4 rounded-xl border border-[#ebe5d8] hover:border-[#d8d0c0] hover:shadow-sm hover:bg-[#f4f0e8] transition-all text-left w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}
          >
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#0e1410] capitalize">
              {connector.provider}
            </div>
            {connector.provider_workspace_name && (
              <div className="text-[11px] text-[#8a8580] truncate max-w-[140px]">
                {connector.provider_workspace_name}
              </div>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg}`}>
          <StatusIcon className={`w-3 h-3 ${config.color} ${isSyncing ? "animate-spin" : ""}`} />
          <span className={`text-[10px] font-semibold ${config.color}`}>{config.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <div className="p-2 rounded-lg bg-[#f4f0e8]">
          <div className="text-[9px] text-[#8a8580] uppercase font-bold tracking-wider">
            Last Sync
          </div>
          <div className="text-[11px] font-semibold text-[#0e1410]">
            {formatRelativeTime(connector.last_sync_at)}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-[#f4f0e8]">
          <div className="text-[9px] text-[#8a8580] uppercase font-bold tracking-wider">Status</div>
          <div className="text-[11px] font-semibold text-[#0e1410] capitalize">
            {connector.sync_enabled ? "Enabled" : "Disabled"}
          </div>
        </div>
      </div>

      {connector.sync_error && (
        <div className="mt-2 p-2 rounded-lg bg-[#c79f4a]/5 border border-[#c79f4a]/20">
          <div className="text-[10px] text-[#c79f4a] font-medium">{connector.sync_error}</div>
        </div>
      )}
    </button>
  );
}
