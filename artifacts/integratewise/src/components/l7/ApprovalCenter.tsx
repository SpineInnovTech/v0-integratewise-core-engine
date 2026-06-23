/**
 * Approval Center (L7) — Main Shell
 *
 * Tabbed interface for managing handoff packages:
 * Pending | Approved | Awaiting Outcome | Completed | Failed/Cancelled
 *
 * Phase 7 Task 27
 * Requirements: 8.1
 */

import React, { useState, useEffect } from "react";
import { PendingQueue } from "./PendingQueue";
import { AuditTrail } from "./AuditTrail";

type TabState = "PROPOSED" | "APPROVED" | "AWAITING_OUTCOME" | "COMPLETED" | "FAILED";

const TABS: { key: TabState; label: string }[] = [
  { key: "PROPOSED", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "AWAITING_OUTCOME", label: "Awaiting Outcome" },
  { key: "COMPLETED", label: "Completed" },
  { key: "FAILED", label: "Failed / Cancelled" },
];

interface HandoffListItem {
  package_id: string;
  proposal_id: string;
  state: string;
  action: { kind: string; target: string };
  created_at: string;
  updated_at: string;
}

export function ApprovalCenter({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTab] = useState<TabState>("PROPOSED");
  const [packages, setPackages] = useState<HandoffListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, [activeTab, tenantId]);

  async function fetchPackages() {
    setLoading(true);
    try {
      const stateFilter = activeTab === "FAILED" ? "FAILED,CANCELLED" : activeTab;
      const res = await fetch(
        `/api/v1/handoff/list?state=${stateFilter}&tenant_id=${tenantId}`
      );
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
      }
    } catch (err) {
      console.error("Failed to fetch packages:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="approval-center">
      <h1>Approval Center</h1>
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => { setActiveTab(tab.key); setSelectedPackageId(null); }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : selectedPackageId ? (
          <AuditTrail
            packageId={selectedPackageId}
            tenantId={tenantId}
            onBack={() => setSelectedPackageId(null)}
          />
        ) : (
          <PendingQueue
            packages={packages}
            activeTab={activeTab}
            tenantId={tenantId}
            onSelect={(id) => setSelectedPackageId(id)}
            onRefresh={fetchPackages}
          />
        )}
      </div>
    </div>
  );
}
