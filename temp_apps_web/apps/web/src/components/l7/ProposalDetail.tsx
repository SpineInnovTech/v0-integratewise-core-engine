"use client";

import { useState } from "react";
import { ArrowLeft, ExternalLink, FileText, AlertTriangle } from "lucide-react";
import { useGatewayQuery, useGatewayMutation } from "@/hooks/use-gateway-query";
import { AuditTrail, type AuditEntry } from "./AuditTrail";
import { GovernanceStamp, type GovernanceStampData } from "./GovernanceStamp";
import { ApproveDispatch } from "./ApproveDispatch";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EvidenceRef {
  id: string;
  label: string;
  entity_type: string;
  entity_id: string;
  field?: string;
  url?: string;
}

interface HandoffDetail {
  id: string;
  state: string;
  action_title: string;
  action_type: string;
  target: string;
  confidence: number;
  evidence: EvidenceRef[];
  policy_basis: string;
  policy_id: string;
  created_at: string;
  updated_at: string;
  audit_trail: AuditEntry[];
  governance_stamp?: GovernanceStampData;
}

interface RejectPayload {
  action: "reject";
  reason: string;
}

interface ProposalDetailProps {
  handoffId: string;
  onBack: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ProposalDetail — Detail view for a single handoff proposal.
 * Shows evidence (Spine fact refs), policy basis, HITL drawer with approve/reject buttons.
 * Includes inline reject dialog with mandatory reason field.
 */
export function ProposalDetail({ handoffId, onBack }: ProposalDetailProps) {
  const [showApproveFlow, setShowApproveFlow] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error, refetch } = useGatewayQuery<HandoffDetail>(
    ["handoff", "detail", handoffId],
    `/api/v1/handoff/${handoffId}`
  );

  const rejectMutation = useGatewayMutation<{ success: boolean }, RejectPayload>(
    `/api/v1/handoff/${handoffId}/reject`,
    "POST",
    {
      invalidateKeys: [
        ["handoff", "list"],
        ["handoff", "detail", handoffId],
      ],
      onSuccess: () => {
        setShowRejectDialog(false);
        setRejectReason("");
        refetch();
      },
    }
  );

  // ─── Loading / Error states ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-label="Loading proposal"
      >
        <div className="w-6 h-6 border-2 border-iw-forest border-t-transparent rounded-full animate-spin" />
        <span className="sr-only">Loading proposal details</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4" role="alert">
        <p className="text-sm text-red-600">
          {error?.message || "Failed to load proposal details."}
        </p>
        <button
          onClick={onBack}
          className="mt-2 text-sm text-iw-forest hover:underline focus:outline-none focus:ring-2 focus:ring-iw-forest rounded"
        >
          Back to queue
        </button>
      </div>
    );
  }

  const isPending = data.state === "PROPOSED";

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-iw-forest"
          aria-label="Back to queue"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{data.action_title}</h2>
          <p className="text-sm text-gray-500">
            {data.action_type} → {data.target}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            data.state === "PROPOSED"
              ? "bg-amber-100 text-amber-700"
              : data.state === "APPROVED"
                ? "bg-green-100 text-green-700"
                : data.state === "REJECTED"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
          }`}
        >
          {data.state}
        </span>
      </div>

      {/* Confidence indicator */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">Confidence</span>
        <div
          className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={data.confidence}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all ${
              data.confidence >= 80
                ? "bg-green-500"
                : data.confidence >= 50
                  ? "bg-amber-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${data.confidence}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-700">{data.confidence}%</span>
      </div>

      {/* Evidence (Spine fact references) */}
      <section aria-labelledby="evidence-heading">
        <h3
          id="evidence-heading"
          className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          Evidence
        </h3>
        {data.evidence.length === 0 ? (
          <p className="text-xs text-gray-500">No evidence attached.</p>
        ) : (
          <ul className="space-y-2">
            {data.evidence.map((ref) => (
              <li
                key={ref.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-xs"
              >
                <span className="font-medium text-gray-700">{ref.label}</span>
                <span className="text-gray-400">
                  {ref.entity_type}:{ref.entity_id}
                  {ref.field && `.${ref.field}`}
                </span>
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-iw-forest hover:underline flex items-center gap-0.5 focus:outline-none focus:ring-2 focus:ring-iw-forest rounded"
                    aria-label={`Open evidence: ${ref.label}`}
                  >
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    View
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Policy Basis */}
      <section aria-labelledby="policy-heading">
        <h3 id="policy-heading" className="text-sm font-semibold text-gray-700 mb-1">
          Policy Basis
        </h3>
        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{data.policy_basis}</p>
        <p className="text-xs text-gray-400 mt-1">
          Policy ID: <code className="font-mono">{data.policy_id}</code>
        </p>
      </section>

      {/* Governance Stamp (if decided) */}
      {data.governance_stamp && <GovernanceStamp stamp={data.governance_stamp} />}

      {/* HITL Actions (only for PROPOSED state) */}
      {isPending && !showApproveFlow && !showRejectDialog && (
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => setShowApproveFlow(true)}
            className="flex-1 px-4 py-2.5 bg-iw-forest text-white text-sm font-medium rounded-lg hover:bg-iw-forest/90 transition-colors focus:outline-none focus:ring-2 focus:ring-iw-forest focus:ring-offset-2"
            aria-label="Approve this proposal"
          >
            Approve
          </button>
          <button
            onClick={() => setShowRejectDialog(true)}
            className="flex-1 px-4 py-2.5 border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            aria-label="Reject this proposal"
          >
            Reject
          </button>
        </div>
      )}

      {/* Approve Flow (adapter selection + dispatch) */}
      {isPending && showApproveFlow && (
        <div className="pt-2 border-t border-gray-100">
          <ApproveDispatch
            handoffId={handoffId}
            onApproved={() => {
              setShowApproveFlow(false);
              refetch();
            }}
            onCancel={() => setShowApproveFlow(false)}
          />
        </div>
      )}

      {/* Reject Dialog (inline with mandatory reason) */}
      {isPending && showRejectDialog && (
        <div className="pt-2 border-t border-gray-100 space-y-3" aria-label="Reject proposal form">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" aria-hidden="true" />
            <span className="text-sm font-medium text-red-700">Reject Proposal</span>
          </div>

          <label className="block">
            <span className="text-xs text-gray-600">
              Reason <span className="text-red-500">*</span>
            </span>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              rows={3}
              required
              className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
              aria-label="Rejection reason"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={() => rejectMutation.mutate({ action: "reject", reason: rejectReason })}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              aria-label="Confirm rejection"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Reject"}
            </button>
            <button
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              aria-label="Cancel rejection"
            >
              Cancel
            </button>
          </div>

          {rejectMutation.isError && (
            <div
              role="alert"
              className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600"
            >
              {rejectMutation.error?.message || "Rejection failed. Try again."}
            </div>
          )}
        </div>
      )}

      {/* Audit Trail */}
      <section aria-labelledby="audit-heading" className="pt-2 border-t border-gray-100">
        <h3 id="audit-heading" className="text-sm font-semibold text-gray-700 mb-3">
          Audit Trail
        </h3>
        <AuditTrail entries={data.audit_trail} />
      </section>
    </div>
  );
}
