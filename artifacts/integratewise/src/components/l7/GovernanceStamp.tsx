/**
 * GovernanceStamp — Reusable display widget
 * Phase 7 Task 30
 * Requirements: 8.7
 */

import React from "react";

interface GovernanceStampData {
  decision_id: string;
  policy_id: string;
  approver: string;
  decided_at: string;
  audit_id: string;
}

export function GovernanceStamp({ stamp }: { stamp: GovernanceStampData }) {
  return (
    <div className="governance-stamp">
      <h4>🔏 Governance Stamp</h4>
      <dl>
        <dt>Decision ID</dt><dd>{stamp.decision_id}</dd>
        <dt>Policy</dt><dd>{stamp.policy_id}</dd>
        <dt>Approver</dt><dd>{stamp.approver}</dd>
        <dt>Decided</dt><dd>{new Date(stamp.decided_at).toLocaleString()}</dd>
        <dt>Audit ID</dt><dd>{stamp.audit_id}</dd>
      </dl>
    </div>
  );
}
