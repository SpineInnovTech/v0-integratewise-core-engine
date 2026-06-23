"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { PendingQueue } from "./PendingQueue";
import { ProposalDetail } from "./ProposalDetail";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = "PROPOSED" | "APPROVED" | "AWAITING_OUTCOME" | "COMPLETED" | "FAILED";

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: "PROPOSED", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "AWAITING_OUTCOME", label: "Awaiting Outcome" },
  { id: "COMPLETED", label: "Completed" },
  { id: "FAILED", label: "Failed / Cancelled" },
];

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ApprovalCenter — L7 Governance Workbench main shell.
 * Tabs: Pending | Approved | Awaiting Outcome | Completed | Failed/Cancelled.
 * Each tab fetches from GET /api/v1/handoff/list?state=...
 * Selecting an item drills into ProposalDetail.
 */
export function ApprovalCenter() {
  const [activeTab, setActiveTab] = useState<TabId>("PROPOSED");
  const [selectedHandoffId, setSelectedHandoffId] = useState<string | null>(null);

  // ─── Detail view ─────────────────────────────────────────────────────────

  if (selectedHandoffId) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <ProposalDetail handoffId={selectedHandoffId} onBack={() => setSelectedHandoffId(null)} />
      </div>
    );
  }

  // ─── List view ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-iw-forest" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-gray-900">Approval Center</h1>
      </div>

      {/* Tab bar */}
      <nav aria-label="Approval queue tabs">
        <div className="flex gap-1 border-b border-gray-200" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px focus:outline-none focus:ring-2 focus:ring-inset focus:ring-iw-forest rounded-t-lg ${
                activeTab === tab.id
                  ? "border-iw-forest text-iw-forest"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab panel */}
      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        <PendingQueue state={activeTab} onSelect={(id) => setSelectedHandoffId(id)} />
      </div>
    </div>
  );
}
