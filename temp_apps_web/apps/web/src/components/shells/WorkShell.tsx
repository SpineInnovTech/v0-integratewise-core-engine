"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Briefcase, Building2, MessageSquare, Shield } from "lucide-react";
import { DepartmentWorkbench } from "@/components/workbench/department-workbench";
import { OrgView } from "@/components/workbench/views/org-view";
import { GovernancePanel } from "@/components/workbench/primitives";
import { AnimatedContentRouter } from "@/components/l1/workspace/animated-content-router";
import { useGovernanceQueue } from "@/hooks/use-governance-queue";
import { cn } from "@/lib/utils";
import type { DepartmentWorkbenchMetric } from "@/components/workbench/department-workbench";
import type { Domain } from "@/components/l1/workspace/workspace-config";
import type { ModuleData } from "@/components/l1/workspace/data-density-scorer";

type WorkTab = "workbench" | "org" | "conversations" | "governance";

interface WorkShellProps {
  department: string;
  title: string;
  entityTypes: string[];
  metrics: DepartmentWorkbenchMetric[];
  icon?: React.ReactNode;
  moduleId?: string;
  domain?: Domain;
  dataContext?: ModuleData;
  userRole?: string;
  /** false for customers: only Twin + Memory + Governance(insights). true for internal Customer Zero full showcase (includes L5/L6) */
  fullLayers?: boolean;
}

const SHELL_MODULES = new Set(["dashboard", "workbench", "home", "today"]);

export function WorkShell({
  department,
  title,
  entityTypes,
  metrics,
  icon,
  moduleId = "dashboard",
  domain = "BIZOPS",
  dataContext,
  userRole,
  fullLayers = false,
}: WorkShellProps) {
  const [activeTab, setActiveTab] = useState<WorkTab>("workbench");
  const { items: governanceItems, approve, reject } = useGovernanceQueue();

  const isShellModule = SHELL_MODULES.has(moduleId);

  return (
    <div className="h-full flex flex-col bg-[#eef3f0]">
      {/* Sub-nav */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-2">
        <TabButton
          active={activeTab === "workbench"}
          onClick={() => setActiveTab("workbench")}
          icon={<Briefcase className="w-3.5 h-3.5" />}
          label="Workbench"
        />
        <TabButton
          active={activeTab === "org"}
          onClick={() => setActiveTab("org")}
          icon={<Building2 className="w-3.5 h-3.5" />}
          label="Org Memory"
        />
        <TabButton
          active={activeTab === "conversations"}
          onClick={() => setActiveTab("conversations")}
          icon={<MessageSquare className="w-3.5 h-3.5" />}
          label="Conversations"
        />
        <TabButton
          active={activeTab === "governance"}
          onClick={() => setActiveTab("governance")}
          icon={<Shield className="w-3.5 h-3.5" />}
          label="Governance"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "workbench" && (
            <motion.div
              key="workbench"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {isShellModule ? (
                <DepartmentWorkbench
                  department={department}
                  title={title}
                  entityTypes={entityTypes}
                  metrics={metrics}
                  icon={icon}
                />
              ) : (
                <AnimatedContentRouter
                  domain={domain}
                  moduleId={moduleId}
                  dataContext={dataContext}
                  userRole={userRole}
                  fullLayers={fullLayers}
                />
              )}
            </motion.div>
          )}
          {activeTab === "org" && (
            <motion.div
              key="org"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <OrgView />
            </motion.div>
          )}
          {activeTab === "conversations" && (
            <motion.div
              key="conversations"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <OperationalConversations />
            </motion.div>
          )}
          {activeTab === "governance" && (
            <motion.div
              key="governance"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-lg font-semibold text-[#0e1410]">Governance Workbench</h2>
                <GovernancePanel
                  items={governanceItems}
                  onApprove={(id) => approve({ id })}
                  onReject={(id) => reject({ id, reason: "Rejected from Workbench" })}
                  onEdit={() => {}}
                  onDefer={() => {}}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all",
        active
          ? "bg-[#1a3a2a] text-white shadow-sm"
          : "text-[#5a5550] hover:bg-[#ebe5d8] hover:text-[#0e1410]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Operational Conversations ──────────────────────────────────────────────

function OperationalConversations() {
  const threads = [
    {
      id: "t1",
      title: "Account Health: TechServe India",
      participants: ["Twin", "You"],
      lastMessage: "Health score dropped to 62. Recommend scheduling a call.",
      time: "10 min ago",
    },
    {
      id: "t2",
      title: "Revenue Forecast Q2",
      participants: ["Twin", "Finance Team"],
      lastMessage: "Forecast updated with latest pipeline data.",
      time: "2h ago",
    },
    {
      id: "t3",
      title: "Risk Alert: CloudBridge",
      participants: ["Twin"],
      lastMessage: "Detected usage decline pattern. Escalation drafted.",
      time: "Yesterday",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0e1410]">Operational Conversations</h2>
        <span className="text-[11px] text-[#8a8580]">Live chat is in the Twin sidebar →</span>
      </div>

      {threads.map((thread) => (
        <button
          key={thread.id}
          className="w-full text-left p-4 rounded-xl bg-white border border-[#ebe5d8] hover:border-[#d8d0c0] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-[#0e1410]">{thread.title}</span>
            <span className="text-[11px] text-[#8a8580]">{thread.time}</span>
          </div>
          <p className="text-[12px] text-[#5a5550] line-clamp-1 mb-1">{thread.lastMessage}</p>
          <div className="flex items-center gap-1.5">
            {thread.participants.map((p) => (
              <span
                key={p}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#ebe5d8] text-[#5a5550] font-medium"
              >
                {p}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
