"use client";

import { Shield } from "lucide-react";

export interface GovernanceStampData {
  decision_id: string;
  policy_id: string;
  approver: string;
  decided_at: string;
  audit_id: string;
}

interface GovernanceStampProps {
  stamp: GovernanceStampData;
  className?: string;
}

/**
 * GovernanceStamp — Reusable widget displaying governance decision metadata.
 * Shows decision_id, policy_id, approver, decided_at, audit_id.
 */
export function GovernanceStamp({ stamp, className = "" }: GovernanceStampProps) {
  const formattedDate = new Date(stamp.decided_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      className={`border border-iw-forest/20 bg-iw-forest/5 rounded-lg p-3 ${className}`}
      aria-label="Governance stamp"
    >
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-iw-forest" aria-hidden="true" />
        <span className="text-xs font-semibold text-iw-forest uppercase tracking-wide">
          Governance Stamp
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <dt className="text-gray-500">Decision</dt>
        <dd className="font-mono text-gray-700 truncate" title={stamp.decision_id}>
          {stamp.decision_id}
        </dd>

        <dt className="text-gray-500">Policy</dt>
        <dd className="font-mono text-gray-700 truncate" title={stamp.policy_id}>
          {stamp.policy_id}
        </dd>

        <dt className="text-gray-500">Approver</dt>
        <dd className="text-gray-700">{stamp.approver}</dd>

        <dt className="text-gray-500">Decided</dt>
        <dd className="text-gray-700">{formattedDate}</dd>

        <dt className="text-gray-500">Audit ID</dt>
        <dd className="font-mono text-gray-700 truncate" title={stamp.audit_id}>
          {stamp.audit_id}
        </dd>
      </dl>
    </div>
  );
}
