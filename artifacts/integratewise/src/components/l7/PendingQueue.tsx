/**
 * PendingQueue — List view of handoff packages by state
 *
 * Displays action title, target, confidence, and timestamp.
 * Click to view detail / approve / reject.
 *
 * Phase 7 Task 28
 * Requirements: 8.2
 */

import React from "react";
import { ProposalDetail } from "./ProposalDetail";
import { useState } from "react";

interface HandoffListItem {
  package_id: string;
  proposal_id: string;
  state: string;
  action: { kind: string; target: string };
  created_at: string;
  updated_at: string;
}

interface PendingQueueProps {
  packages: HandoffListItem[];
  activeTab: string;
  tenantId: string;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

export function PendingQueue({ packages, activeTab, tenantId, onSelect, onRefresh }: PendingQueueProps) {
  const [detailPkg, setDetailPkg] = useState<string | null>(null);

  if (detailPkg) {
    return (
      <ProposalDetail
        packageId={detailPkg}
        tenantId={tenantId}
        onBack={() => setDetailPkg(null)}
        onAction={onRefresh}
      />
    );
  }

  if (packages.length === 0) {
    return <div className="empty-state">No packages in {activeTab} state.</div>;
  }

  return (
    <div className="pending-queue">
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Target</th>
            <th>State</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.package_id}>
              <td>{pkg.action.kind}</td>
              <td>{pkg.action.target}</td>
              <td><span className={`state-badge state-${pkg.state.toLowerCase()}`}>{pkg.state}</span></td>
              <td>{new Date(pkg.created_at).toLocaleString()}</td>
              <td>
                <button onClick={() => setDetailPkg(pkg.package_id)}>View</button>
                <button onClick={() => onSelect(pkg.package_id)}>Audit Trail</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
