"use client";

import { ChevronRight } from "lucide-react";
import { useGatewayQuery } from "@/hooks/use-gateway-query";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HandoffSummary {
  id: string;
  action_title: string;
  action_type: string;
  target: string;
  confidence: number;
  created_at: string;
  state: string;
}

interface HandoffListResponse {
  items: HandoffSummary[];
  total: number;
}

interface PendingQueueProps {
  state: string;
  onSelect: (handoffId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * PendingQueue — Renders a filtered list of handoff packages for a given state.
 * Shows action title, target, confidence indicator per item. Clicking opens ProposalDetail.
 */
export function PendingQueue({ state, onSelect }: PendingQueueProps) {
  const { data, isLoading, error } = useGatewayQuery<HandoffListResponse>(
    ["handoff", "list", state],
    "/api/v1/handoff/list",
    { state }
  );

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-3 py-4" role="status" aria-label="Loading handoff queue">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="py-8 text-center" role="alert">
        <p className="text-sm text-red-600">{error.message || "Failed to load queue."}</p>
      </div>
    );
  }

  // ─── Empty ───────────────────────────────────────────────────────────────

  if (!data?.items?.length) {
    return (
      <div className="py-12 text-center" role="status">
        <p className="text-sm text-gray-500">No items in this queue.</p>
      </div>
    );
  }

  // ─── List ────────────────────────────────────────────────────────────────

  return (
    <ul className="divide-y divide-gray-100" role="list" aria-label={`${state} handoff queue`}>
      {data.items.map((item) => (
        <li key={item.id}>
          <button
            onClick={() => onSelect(item.id)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-inset focus:ring-iw-forest rounded-lg"
            aria-label={`View proposal: ${item.action_title}`}
          >
            {/* Confidence dot */}
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                item.confidence >= 80
                  ? "bg-green-500"
                  : item.confidence >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              aria-label={`Confidence: ${item.confidence}%`}
              title={`Confidence: ${item.confidence}%`}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.action_title}</p>
              <p className="text-xs text-gray-500 truncate">
                {item.action_type} → {item.target}
              </p>
            </div>

            {/* Timestamp */}
            <time className="text-xs text-gray-400 shrink-0" dateTime={item.created_at}>
              {new Date(item.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </time>

            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
