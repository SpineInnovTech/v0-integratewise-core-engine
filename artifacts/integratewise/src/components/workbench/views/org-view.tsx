"use client";

/**
 * Org View — Executive Cross-Cut
 *
 * Cross-department rollup for owners, admins, and managers.
 * Shows org-wide health, metrics, governance, and continuity.
 * Built from the same 8 primitives as the work view.
 */

import { useMemo } from "react";
import { useSpineEntityCounts } from "@/hooks/use-workspace-entities";
import { useGovernanceQueue } from "@/hooks/use-governance-queue";
import {
  MetricTile,
  HealthRing,
  TimelineStream,
  GovernancePanel,
  OperationalCanvas,
} from "@/components/workbench/primitives";
import { Users, Building2, TrendingUp, AlertTriangle, BookOpen, ExternalLink } from "lucide-react";

export function OrgView() {
  // Org-wide entity counts (all departments)
  const { counts, isLoading } = useSpineEntityCounts([
    "account",
    "contact",
    "opportunity",
    "task",
    "generated_insight",
    "risk",
  ]);

  const { items: governanceItems } = useGovernanceQueue();

  const timelineEvents = useMemo(
    () => [
      {
        id: "o1",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        type: "ingest" as const,
        title: "Salesforce sync completed",
        description: "124 contacts, 23 opportunities, 8 accounts ingested.",
        source: "Salesforce",
      },
      {
        id: "o2",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        type: "live" as const,
        title: "Q2 forecast published",
        description: "Revenue forecast approved and live across all departments.",
        actor: "Nirmal",
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Org Health Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Total Accounts"
          value={counts.account ?? 0}
          icon={<Building2 className="w-4 h-4" />}
        />
        <MetricTile
          label="Active Opportunities"
          value={counts.opportunity ?? 0}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricTile
          label="Open Tasks"
          value={counts.task ?? 0}
          icon={<Users className="w-4 h-4" />}
        />
        <MetricTile
          label="AI Insights"
          value={counts.generated_insight ?? 0}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      <OperationalCanvas
        title="Organization Overview"
        subtitle="Cross-department operational reality"
        sections={[
          {
            id: "dept-health",
            label: "Department Health",
            width: "third",
            component: (
              <div className="grid grid-cols-2 gap-3">
                <HealthRing label="Sales" score={88} size={70} strokeWidth={5} status="healthy" />
                <HealthRing
                  label="Marketing"
                  score={72}
                  size={70}
                  strokeWidth={5}
                  status="warning"
                />
                <HealthRing label="CS" score={94} size={70} strokeWidth={5} status="healthy" />
                <HealthRing label="Finance" score={65} size={70} strokeWidth={5} status="warning" />
              </div>
            ),
          },
          {
            id: "timeline",
            label: "Org Continuity",
            width: "third",
            component: <TimelineStream events={timelineEvents} maxItems={4} />,
          },
          {
            id: "governance",
            label: "Cross-Department Governance",
            width: "third",
            component: (
              <GovernancePanel
                items={governanceItems}
                onApprove={() => {}}
                onReject={() => {}}
                onEdit={() => {}}
                onDefer={() => {}}
              />
            ),
          },
        ]}
      />

      {/* Doctrine Browser — BookStack Integrated Reference */}
      <OperationalCanvas
        title="Doctrine & Canon"
        subtitle="Organizational knowledge and decision canon"
        sections={[
          {
            id: "doctrine-browser",
            label: "Canon",
            width: "half",
            component: (
              <div className="space-y-3">
                <a
                  href="/docs/tech/workbench-projection-doctrine.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#ebe5d8] hover:bg-[#f4f0e8] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#2d5a3d]/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-[#2d5a3d]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#0e1410] group-hover:text-[#2d5a3d]">
                      Projection Doctrine
                    </div>
                    <div className="text-[11px] text-[#8a8580] truncate">
                      How relevance is computed and rendered
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8a8580] opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="/docs/tech/workbench-builder-doctrine.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#ebe5d8] hover:bg-[#f4f0e8] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#3d7a50]/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-[#3d7a50]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#0e1410] group-hover:text-[#3d7a50]">
                      Builder Doctrine
                    </div>
                    <div className="text-[11px] text-[#8a8580] truncate">
                      How the surface must be built
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8a8580] opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="/docs/tech/tool-absorption-doctrine.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#ebe5d8] hover:bg-[#f4f0e8] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#B8943F]/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-[#B8943F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#0e1410] group-hover:text-[#B8943F]">
                      Tool Absorption Doctrine
                    </div>
                    <div className="text-[11px] text-[#8a8580] truncate">
                      How external capabilities are internalized
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8a8580] opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            ),
          },
          {
            id: "bookstack-ref",
            label: "BookStack Library",
            width: "half",
            component: (
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-dashed border-[#d8d0c0] bg-[#f4f0e8]">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-[#8a8580]" />
                    <span className="text-[13px] font-semibold text-[#5a5550]">
                      BookStack Integration
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8a8580] leading-relaxed mb-3">
                    Hierarchical doctrine navigation and canon browsing via BookStack. Integrated
                    reference stage — links open in BookStack instance.
                  </p>
                  <a
                    href="https://docs.integratewise.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2d5a3d] text-white text-[11px] font-semibold hover:bg-[#1a3a2a] transition-colors"
                  >
                    Open BookStack
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["Architecture Decisions", "Runbooks", "SOPs", "Playbooks"].map((item) => (
                    <div
                      key={item}
                      className="p-2 rounded-lg border border-[#ebe5d8] text-[11px] font-medium text-[#5a5550] hover:bg-[#f4f0e8] cursor-pointer transition-colors"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
