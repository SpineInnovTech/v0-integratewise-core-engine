"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, BookOpen, MessageSquare, FileText, Sparkles } from "lucide-react";
import { PersonalView } from "@/components/workbench/views/personal-view";
import { AnimatedContentRouter } from "@/components/l1/workspace/animated-content-router";
import { cn } from "@/lib/utils";
import type { Domain } from "@/components/l1/workspace/workspace-config";
import type { ModuleData } from "@/components/l1/workspace/data-density-scorer";

type PersonalTab = "workspace" | "memory" | "conversations";

interface PersonalShellProps {
  moduleId?: string;
  domain?: Domain;
  dataContext?: ModuleData;
  userRole?: string;
  fullLayers?: boolean;
}

const SHELL_MODULES = new Set(["dashboard", "home", "hub-home", "hub-today", "today", "profile"]);

export function PersonalShell({
  moduleId = "dashboard",
  domain = "PERSONAL",
  dataContext,
  userRole,
  fullLayers = false,
}: PersonalShellProps) {
  const [activeTab, setActiveTab] = useState<PersonalTab>("workspace");

  const isShellModule = SHELL_MODULES.has(moduleId);

  return (
    <div className="h-full flex flex-col bg-[#eef3f0]">
      {/* Sub-nav */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-2">
        <TabButton
          active={activeTab === "workspace"}
          onClick={() => setActiveTab("workspace")}
          icon={<CheckCircle className="w-3.5 h-3.5" />}
          label="Workspace"
        />
        <TabButton
          active={activeTab === "memory"}
          onClick={() => setActiveTab("memory")}
          icon={<BookOpen className="w-3.5 h-3.5" />}
          label="Memory Base"
        />
        <TabButton
          active={activeTab === "conversations"}
          onClick={() => setActiveTab("conversations")}
          icon={<MessageSquare className="w-3.5 h-3.5" />}
          label="Conversations"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === "workspace" && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {isShellModule ? (
                <PersonalView />
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
          {activeTab === "memory" && (
            <motion.div
              key="memory"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="pt-2"
            >
              <PersonalMemoryBase />
            </motion.div>
          )}
          {activeTab === "conversations" && (
            <motion.div
              key="conversations"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="pt-2"
            >
              <PersonalConversations />
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

// ─── Personal Memory Base ───────────────────────────────────────────────────

function PersonalMemoryBase() {
  const [content, setContent] = useState(
    `# Personal Knowledge Space

Start writing your thoughts, notes, and ideas here. This is your private markdown-first memory base.

## Today's Focus
- [ ] Review account health signals
- [ ] Draft Q3 strategy notes
- [ ] Follow up with team

## Quick Notes
Write freely. Everything here is scoped to you and never shared unless you explicitly choose to.`
  );

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl border border-[#ebe5d8] shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[#ebe5d8] flex items-center justify-between bg-[#f4f0e8]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2d5a3d]" />
          <span className="text-[13px] font-semibold text-[#0e1410]">Personal Memory Base</span>
        </div>
        <span className="text-[10px] text-[#8a8580] uppercase tracking-wider font-bold">
          Markdown
        </span>
      </div>
      <div className="flex h-[calc(100vh-240px)]">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 p-6 text-[14px] leading-relaxed font-mono text-[#0e1410] bg-white resize-none outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

// ─── Personal Conversations ─────────────────────────────────────────────────

function PersonalConversations() {
  const sessions = [
    {
      id: "s1",
      title: "Q3 Strategy Brainstorm",
      date: "Today",
      preview: "Discussed expansion opportunities and risk signals...",
    },
    {
      id: "s2",
      title: "Account Health Review",
      date: "Yesterday",
      preview: "Analyzed TechServe India's health score and churn risk...",
    },
    {
      id: "s3",
      title: "Personal Task Planning",
      date: "May 17",
      preview: "Created task list for the week with priorities...",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#0e1410]">Conversation History</h2>
        <span className="text-[11px] text-[#8a8580]">Live chat is in the Twin sidebar →</span>
      </div>

      {sessions.map((session) => (
        <button
          key={session.id}
          className="w-full text-left p-4 rounded-xl bg-white border border-[#ebe5d8] hover:border-[#d8d0c0] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2d5a3d]" />
              <span className="text-[13px] font-semibold text-[#0e1410]">{session.title}</span>
            </div>
            <span className="text-[11px] text-[#8a8580]">{session.date}</span>
          </div>
          <p className="text-[12px] text-[#5a5550] line-clamp-2">{session.preview}</p>
        </button>
      ))}

      <div className="text-center py-8">
        <p className="text-[12px] text-[#8a8580]">
          Older sessions are archived to your Knowledge Base automatically.
        </p>
      </div>
    </div>
  );
}
