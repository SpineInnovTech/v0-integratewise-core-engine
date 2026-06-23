/**
 * ProposalDetail — Full detail view with approve/reject/dispatch
 *
 * Displays action spec, evidence, policy basis, confidence, HITL drawer.
 * Approve → adapter selection → dispatch.
 *
 * Phase 7 Tasks 28-29
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */

import React, { useState, useEffect } from "react";
import { GovernanceStamp } from "./GovernanceStamp";

interface ProposalDetailProps {
  packageId: string;
  tenantId: string;
  onBack: () => void;
  onAction: () => void;
}

interface PackageDetail {
  package_id: string;
  proposal_id: string;
  state: string;
  action: { kind: string; target: string; params: Record<string, unknown> };
  evidence: Array<{ fact_id: string; confidence?: number }>;
  success_criteria: Array<{ id: string; description: string }>;
  governance_stamp: {
    decision_id: string;
    policy_id: string;
    approver: string;
    decided_at: string;
    audit_id: string;
  } | null;
  adapter_target: string;
  created_at: string;
  expires_at: string;
}

export function ProposalDetail({ packageId, tenantId, onBack, onAction }: ProposalDetailProps) {
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [adapterMode, setAdapterMode] = useState<"download" | "endpoint">("download");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [step, setStep] = useState<"detail" | "adapter" | "dispatched">("detail");

  useEffect(() => {
    fetchDetail();
  }, [packageId]);

  async function fetchDetail() {
    try {
      const res = await fetch(`/api/v1/handoff/${packageId}?tenant_id=${tenantId}`);
      if (res.ok) setPkg(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    const res = await fetch(`/api/v1/handoff/${packageId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId }),
    });
    if (res.ok) {
      setStep("adapter");
      await fetchDetail();
    }
  }

  async function handleDispatch() {
    setDispatching(true);
    try {
      const res = await fetch(`/api/v1/handoff/${packageId}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          adapter: "json",
          target: { mode: adapterMode, url: adapterMode === "endpoint" ? endpointUrl : undefined },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.kind === "download" && data.body) {
          // Trigger browser download
          const blob = new Blob([data.body], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = data.filename || `handoff-${packageId}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setStep("dispatched");
        onAction();
      }
    } finally {
      setDispatching(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    await fetch(`/api/v1/handoff/${packageId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, reason: rejectReason }),
    });
    onAction();
    onBack();
  }

  if (loading) return <div>Loading...</div>;
  if (!pkg) return <div>Package not found</div>;

  return (
    <div className="proposal-detail">
      <button onClick={onBack}>← Back</button>

      <h2>{pkg.action.kind} → {pkg.action.target}</h2>
      <div className="state-badge">{pkg.state}</div>

      {/* Evidence */}
      <section>
        <h3>Evidence</h3>
        <ul>
          {pkg.evidence.map((e, i) => (
            <li key={i}>Fact: {e.fact_id} {e.confidence ? `(${(e.confidence * 100).toFixed(0)}%)` : ""}</li>
          ))}
        </ul>
      </section>

      {/* Success Criteria */}
      <section>
        <h3>Success Criteria</h3>
        <ul>
          {pkg.success_criteria.map((c) => (
            <li key={c.id}>{c.description}</li>
          ))}
        </ul>
      </section>

      {/* Governance Stamp */}
      {pkg.governance_stamp && <GovernanceStamp stamp={pkg.governance_stamp} />}

      {/* Action Buttons */}
      {step === "detail" && pkg.state === "PROPOSED" && (
        <div className="actions">
          <button className="approve-btn" onClick={handleApprove}>Approve</button>
          <button className="reject-btn" onClick={() => setShowReject(true)}>Reject</button>
        </div>
      )}

      {/* Adapter Selection */}
      {step === "adapter" && (
        <div className="adapter-selection">
          <h3>Select Dispatch Method</h3>
          <label>
            <input type="radio" checked={adapterMode === "download"} onChange={() => setAdapterMode("download")} />
            Download JSON file
          </label>
          <label>
            <input type="radio" checked={adapterMode === "endpoint"} onChange={() => setAdapterMode("endpoint")} />
            POST to endpoint
          </label>
          {adapterMode === "endpoint" && (
            <input type="url" placeholder="https://..." value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} />
          )}
          <button onClick={handleDispatch} disabled={dispatching}>
            {dispatching ? "Dispatching..." : "Dispatch"}
          </button>
        </div>
      )}

      {step === "dispatched" && <div className="success">✓ Package dispatched successfully</div>}

      {/* Reject Modal */}
      {showReject && (
        <div className="reject-modal">
          <h3>Rejection Reason (required)</h3>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Why are you rejecting this proposal?" />
          <button onClick={handleReject} disabled={!rejectReason.trim()}>Confirm Reject</button>
          <button onClick={() => setShowReject(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
