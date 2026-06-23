"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Inbox, Play, CheckCircle2, Filter } from "lucide-react";
import { SlidingPanel } from "@/components/l2/cognitive/sliding-panel";
import { PendingApprovalsCard } from "@/components/_deprecated/l2-removed/approvals/pending-approvals-card";
import { ExecutionStatusCard } from "@/components/_deprecated/l2-removed/approvals/execution-status-card";
import { GovernancePanel } from "@/components/workbench/primitives";
import { useGovernanceQueue } from "@/hooks/use-governance-queue";
import { cn } from "@/lib/utils";

type GovernanceScope = "all" | "personal" | "org";

interface GovernanceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  scope?: GovernanceScope;
  onScopeChange?: (scope: GovernanceScope) => void;
}

export function GovernanceOverlay({
  isOpen,
  onClose,
  scope = "all",
  onScopeChange,
}: GovernanceOverlayProps) {
  const [activeTab, setActiveTab] = useState<"approvals" | "execution" | "queue">("approvals");
  const { items: governanceItems, approve, reject } = useGovernanceQueue();

  const filteredItems =
    scope === "all"
      ? governanceItems
      : governanceItems.filter((item) => {
          if (scope === "personal") {
            return item.continuityType === "follow_up" || item.continuityType === "outreach";
          }
          return !["follow_up", "outreach"].includes(item.continuityType);
        });

  return (
    <SlidingPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Governance"
      subtitle="Approval queue & execution stream"
      icon={<Shield className="h-5 w-5" />}
      position="right"
      size="lg"
    >
      <div className="h-full flex flex-col">
        {/* Scope Filter */}
        <div className="px-4 py-3 border-b border-[#ebe5d8] flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#f4f0e8] rounded-lg p-0.5">
            {(["all", "personal", "org"] as GovernanceScope[]).map((s) => (
              <button
                key={s}
                onClick={() => onScopeChange?.(s)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all",
                  scope === s
                    ? "bg-white text-[#0e1410] shadow-sm"
                    : "text-[#8a8580] hover:text-[#5a5550]"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#8a8580]">
            <Filter className="w-3 h-3" />
            <span>{filteredItems.length} items</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-2 border-b border-[#ebe5d8] flex items-center gap-2">
          <TabButton
            active={activeTab === "approvals"}
            onClick={() => setActiveTab("approvals")}
            icon={<Inbox className="w-3.5 h-3.5" />}
            label="Pending"
          />
          <TabButton
            active={activeTab === "execution"}
            onClick={() => setActiveTab("execution")}
            icon={<Play className="w-3.5 h-3.5" />}
            label="Execution"
          />
          <TabButton
            active={activeTab === "queue"}
            onClick={() => setActiveTab("queue")}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            label="Queue"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {activeTab === "approvals" && (
              <motion.div
                key="approvals"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PendingApprovalsCard
                  onApprovalClick={() => {}}
                  onQuickApprove={() => {}}
                  onQuickReject={() => {}}
                />
              </motion.div>
            )}
            {activeTab === "execution" && (
              <motion.div
                key="execution"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ExecutionStatusCard />
              </motion.div>
            )}
            {activeTab === "queue" && (
              <motion.div
                key="queue"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GovernancePanel
                  items={filteredItems}
                  onApprove={(id) => approve({ id })}
                  onReject={(id) => reject({ id, reason: "Rejected from overlay" })}
                  onEdit={() => {}}
                  onDefer={() => {}}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SlidingPanel>
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
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
        active ? "bg-[#1a3a2a] text-white" : "text-[#5a5550] hover:bg-[#ebe5d8]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
