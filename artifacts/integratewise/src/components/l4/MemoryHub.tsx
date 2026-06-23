/**
 * Memory Hub (L4) — Main Shell
 *
 * Tabbed interface: Search | Propose | Pending Review | Promoted | Visibility
 *
 * Phase 8 Task 33
 * Requirements: 9.1
 */

import React, { useState } from "react";
import { MemorySearch } from "./MemorySearch";
import { MemoryProposeForm } from "./MemoryProposeForm";
import { MemoryGovernanceStatus } from "./MemoryGovernanceStatus";
import { MemoryVisibilityControls } from "./MemoryVisibilityControls";

type MemoryTab = "search" | "propose" | "pending" | "promoted" | "visibility";

const TABS: { key: MemoryTab; label: string }[] = [
  { key: "search", label: "Search" },
  { key: "propose", label: "Propose" },
  { key: "pending", label: "Pending Review" },
  { key: "promoted", label: "Promoted" },
  { key: "visibility", label: "Visibility" },
];

export function MemoryHub({ tenantId, domain }: { tenantId: string; domain?: string }) {
  const [activeTab, setActiveTab] = useState<MemoryTab>("search");

  return (
    <div className="memory-hub">
      <h1>Memory Hub</h1>
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {activeTab === "search" && <MemorySearch tenantId={tenantId} domain={domain} />}
        {activeTab === "propose" && <MemoryProposeForm tenantId={tenantId} domain={domain} />}
        {activeTab === "pending" && <MemoryGovernanceStatus tenantId={tenantId} filter="pending" />}
        {activeTab === "promoted" && <MemoryGovernanceStatus tenantId={tenantId} filter="approved" />}
        {activeTab === "visibility" && <MemoryVisibilityControls tenantId={tenantId} domain={domain} />}
      </div>
    </div>
  );
}
