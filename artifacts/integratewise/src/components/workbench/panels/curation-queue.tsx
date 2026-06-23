"use client";

/**
 * Curation Queue — AI-Proposed Entities Awaiting Human Judgment
 *
 * Shows continuity_objects in 'proposed' or 'triaged' state.
 * Users can approve, reject, or edit each proposal.
 * This is the HITL surface for SDAI.
 * Additive SDAI surface — does not modify existing architecture.
 */

import {
  useCurationQueue,
  useApproveCuration,
  useRejectCuration,
  type CurationItem,
} from "@/hooks/use-sdai-pipeline";
import { CheckCircle2, XCircle, Edit3, Brain, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";

function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    doctrine: "bg-[#2d5a3d]/10 text-[#2d5a3d]",
    architecture: "bg-[#2d5a3d]/10 text-[#2d5a3d]",
    workflow: "bg-[#3d7a50]/10 text-[#3d7a50]",
    campaign: "bg-[#b8943f]/10 text-[#b8943f]",
    entity_update: "bg-[#B8943F]/10 text-[#B8943F]",
    escalation: "bg-[#c79f4a]/10 text-[#c79f4a]",
    approval: "bg-[#3d7a50]/10 text-[#3d7a50]",
    insight: "bg-[#2d5a3d]/10 text-[#2d5a3d]",
    continuity_gap: "bg-[#B8943F]/10 text-[#B8943F]",
    deployment: "bg-[#2d5a3d]/10 text-[#2d5a3d]",
    governance_event: "bg-[#c79f4a]/10 text-[#c79f4a]",
  };
  return map[type] || "bg-[#ebe5d8] text-[#5a5550]";
}

function getSourceIcon(source: string) {
  const icons: Record<string, string> = {
    manus: "🤖",
    spark: "⚡",
    hermes: "📬",
    gmail: "📧",
    slack: "💬",
    n8n: "🔀",
    ops_board: "📋",
    manual: "✍️",
  };
  return icons[source] || "🤖";
}

function CurationCard({ item }: { item: CurationItem }) {
  const approve = useApproveCuration();
  const reject = useRejectCuration();
  const [expanded, setExpanded] = useState(false);

  const isProcessing = approve.isPending || reject.isPending;

  return (
    <div className="p-4 rounded-xl border border-[#ebe5d8] hover:border-[#d8d0c0] hover:shadow-sm transition-all bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{getSourceIcon(item.source)}</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getTypeColor(item.continuity_type)}`}
          >
            {item.continuity_type}
          </span>
          {item.hitl_required && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#c79f4a]/10 text-[#c79f4a]">
              <AlertCircle className="w-3 h-3" />
              HITL
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#8a8580]">
          <Clock className="w-3 h-3" />
          {new Date(item.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p
          className={`text-[13px] text-[#0e1410] leading-relaxed ${expanded ? "" : "line-clamp-3"}`}
        >
          {item.content}
        </p>
        {item.content.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-[#2d5a3d] font-medium mt-1 hover:underline"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* Entity refs */}
      {item.entity_refs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.entity_refs.map((ref, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-[#ebe5d8] text-[10px] font-medium text-[#5a5550]"
            >
              {ref.type}: {ref.name || ref.id.slice(0, 8)}
            </span>
          ))}
        </div>
      )}

      {/* Weight indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 rounded-full bg-[#ebe5d8] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              item.continuity_weight >= 8
                ? "bg-[#c79f4a]"
                : item.continuity_weight >= 5
                  ? "bg-[#B8943F]"
                  : "bg-[#3d7a50]"
            }`}
            style={{ width: `${item.continuity_weight * 10}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-[#5a5550] w-6 text-right">
          {item.continuity_weight}/10
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => approve.mutate(item.id)}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3d7a50]/10 text-[#3d7a50] text-[11px] font-semibold hover:bg-[#3d7a50]/20 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approve
        </button>
        <button
          onClick={() => reject.mutate(item.id)}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c79f4a]/10 text-[#c79f4a] text-[11px] font-semibold hover:bg-[#c79f4a]/20 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject
        </button>
        <button
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ebe5d8] text-[#5a5550] text-[11px] font-semibold hover:bg-[#ebe5d8] transition-colors disabled:opacity-50"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>
    </div>
  );
}

export function CurationQueue() {
  const { data: items = [], isLoading } = useCurationQueue({ limit: 20 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-6 h-6 border-2 border-[#2d5a3d] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#2d5a3d]" />
          <h4 className="text-[13px] font-bold text-[#0e1410]">AI Curation Queue</h4>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-[#2d5a3d]/10 text-[#2d5a3d] text-[10px] font-bold">
          {items.length} pending
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-[#d8d0c0] bg-[#f4f0e8]">
          <CheckCircle2 className="w-8 h-8 text-[#3d7a50] mb-3" />
          <div className="text-[13px] font-semibold text-[#5a5550]">All caught up</div>
          <div className="text-[11px] text-[#8a8580] mt-1">
            No AI-proposed items awaiting review
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {items.map((item) => (
            <CurationCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
