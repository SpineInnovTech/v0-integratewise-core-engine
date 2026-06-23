"use client";

import { useState } from "react";
import { Brain } from "lucide-react";
import { MemorySearch } from "./MemorySearch";
import { MemoryProposeForm } from "./MemoryProposeForm";
import { MemoryGovernanceStatus } from "./MemoryGovernanceStatus";
import { MemoryVisibilityControls } from "./MemoryVisibilityControls";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = "search" | "propose" | "pending" | "promoted" | "visibility";

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: "search", label: "Search" },
  { id: "propose", label: "Propose" },
  { id: "pending", label: "Pending Review" },
  { id: "promoted", label: "Promoted" },
  { id: "visibility", label: "Visibility" },
];

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * MemoryHub — L4 Knowledge Workbench main shell.
 * Tabs: Search | Propose | Pending Review | Promoted | Visibility.
 * Each tab renders the appropriate sub-component.
 */
export function MemoryHub() {
  const [activeTab, setActiveTab] = useState<TabId>("search");

  function renderTabPanel() {
    switch (activeTab) {
      case "search":
        return <MemorySearch />;
      case "propose":
        return <MemoryProposeForm />;
      case "pending":
        return <MemoryGovernanceStatus filter="pending" />;
      case "promoted":
        return <MemoryGovernanceStatus filter="approved" />;
      case "visibility":
        return <MemoryVisibilityControls />;
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="w-5 h-5 text-iw-forest" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-gray-900">Memory Hub</h1>
      </div>

      {/* Tab bar */}
      <nav aria-label="Memory hub tabs">
        <div className="flex gap-1 border-b border-gray-200" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-memory-${tab.id}`}
              id={`tab-memory-${tab.id}`}
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
      <div
        role="tabpanel"
        id={`tabpanel-memory-${activeTab}`}
        aria-labelledby={`tab-memory-${activeTab}`}
      >
        {renderTabPanel()}
      </div>
    </div>
  );
}
