"use client";

import { Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useGatewayQuery } from "@/hooks/use-gateway-query";

// ─── Types ───────────────────────────────────────────────────────────────────

type GovernanceState = "staging" | "pending" | "approved" | "rejected";

interface MemoryItem {
  id: string;
  title: string;
  type: string;
  domain: string;
  governance_state: GovernanceState;
  proposed_at: string;
  reviewed_at?: string;
  reviewer?: string;
}

interface GovernanceListResponse {
  items: MemoryItem[];
  total: number;
}

interface MemoryGovernanceStatusProps {
  filter: "pending" | "approved";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<GovernanceState, { label: string; color: string; Icon: typeof Clock }> =
  {
    staging: { label: "Staging", color: "bg-gray-100 text-gray-700", Icon: Clock },
    pending: { label: "Pending Review", color: "bg-yellow-100 text-yellow-800", Icon: AlertCircle },
    approved: { label: "Approved", color: "bg-green-100 text-green-800", Icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-800", Icon: XCircle },
  };

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * MemoryGovernanceStatus — Lists memory items filtered by governance state.
 * Polls every 30s for updated state. Displays color-coded badges per item.
 */
export function MemoryGovernanceStatus({ filter }: MemoryGovernanceStatusProps) {
  const { data, isLoading, error } = useGatewayQuery<GovernanceListResponse>(
    ["memory", "governance", filter],
    "/api/v1/memory/list",
    { state: filter },
    { refetchInterval: 30_000 }
  );

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-label="Loading memory items"
      >
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" aria-hidden="true" />
        <span className="sr-only">Loading memory items...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="p-4 rounded-lg bg-red-50 text-red-800 text-sm">
        Failed to load memory items: {error.message ?? "Unknown error"}
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        {filter === "pending" ? "No memory items pending review." : "No promoted memory items yet."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100" aria-label={`${filter} memory items`}>
      {data.items.map((item) => {
        const config = STATE_CONFIG[item.governance_state];
        const { Icon } = config;

        return (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.type} &middot; {item.domain} &middot;{" "}
                {new Date(item.proposed_at).toLocaleDateString()}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
              aria-label={`Governance state: ${config.label}`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {config.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
