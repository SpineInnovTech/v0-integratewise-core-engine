import { useState } from "react";
import {
  MessageSquare, Brain, BookOpen, Zap, Bot, Cpu, Wrench,
  Maximize2, Minimize2, ScrollText, GitBranch, MessagesSquare,
  Timer, Database, Play, Activity, BarChart2, Kanban
} from "lucide-react";
import { type CTXEnum } from "@/spine/types";
import { TwinChat } from "./twin-chat";
import { TwinMemory } from "./twin-memory";
import { TwinKnowledge } from "./twin-knowledge";
import { TwinSkills, TwinAgents, TwinModels, TwinTools } from "./twin-config";
import { TwinLogs } from "./twin-logs";
import { TwinWorkflows } from "./twin-workflows";
import { TwinConversations } from "./twin-conversations";
import { TwinSessions } from "./twin-sessions";
import { TwinAgentMemory } from "./twin-agent-memory";
import { TwinExecutions } from "./twin-executions";
import { TwinObservability } from "./twin-observability";
import { TwinBench } from "./twin-bench";

export type TwinSection =
  | "Chat" | "Conversations" | "Sessions"
  | "Memory" | "Knowledge"
  | "Bench"
  | "Agents" | "AgentMemory" | "Logs"
  | "Skills" | "Workflows" | "Executions"
  | "Models" | "Tools"
  | "Observability";

// Grouped nav — matches the spec exactly
type NavGroup = { label: string; items: { id: TwinSection; icon: any; label: string }[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Interact",
    items: [
      { id: "Chat",          icon: MessageSquare,  label: "Chat" },
      { id: "Conversations", icon: MessagesSquare, label: "Conversations" },
      { id: "Sessions",      icon: Timer,          label: "Sessions" },
    ],
  },
  {
    label: "Continuity",
    items: [
      { id: "Memory",    icon: Brain,    label: "Memory" },
      { id: "Knowledge", icon: BookOpen, label: "Knowledge" },
    ],
  },
  {
    label: "Tasks",
    items: [
      { id: "Bench", icon: Kanban, label: "Task Bench" },
    ],
  },
  {
    label: "Agents",
    items: [
      { id: "Agents",      icon: Bot,        label: "Agents" },
      { id: "AgentMemory", icon: Database,   label: "Agent Memory" },
      { id: "Logs",        icon: ScrollText, label: "Agent Logs" },
    ],
  },
  {
    label: "Execution",
    items: [
      { id: "Skills",     icon: Zap,       label: "Skills" },
      { id: "Workflows",  icon: GitBranch, label: "Workflows" },
      { id: "Executions", icon: Play,      label: "Executions" },
    ],
  },
  {
    label: "Config",
    items: [
      { id: "Models", icon: Cpu,          label: "Models" },
      { id: "Tools",  icon: Wrench,       label: "Tools" },
    ],
  },
  {
    label: "Health",
    items: [
      { id: "Observability", icon: BarChart2, label: "Observability" },
    ],
  },
];

interface TwinShellProps {
  section: TwinSection;
  onSectionChange: (s: TwinSection) => void;
  activeCtx: CTXEnum;
}

function NavBtn({ item, active, onClick }: { item: { id: TwinSection; icon: any; label: string }; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={item.label}
      className="w-9 h-9 mx-auto rounded-xl flex items-center justify-center transition-all group relative"
      style={{
        background: active ? "var(--iw-blue)" : "transparent",
        color: active ? "white" : "var(--muted-foreground)",
        boxShadow: active ? "0 1px 4px rgba(66,86,171,0.25)" : "none",
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "var(--card)"; (e.currentTarget as HTMLElement).style.color = "var(--iw-blue)"; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; } }}
    >
      <item.icon className="w-4 h-4" />
      <span className="absolute left-full ml-2.5 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg"
        style={{ background: "var(--iw-blue-900)", fontWeight: 500 }}>
        {item.label}
      </span>
    </button>
  );
}

export function TwinShell({ section, onSectionChange, activeCtx }: TwinShellProps) {
  const [expanded, setExpanded] = useState(false);

  const content = (() => {
    switch (section) {
      case "Chat":          return <TwinChat activeCtx={activeCtx} />;
      case "Conversations": return <TwinConversations />;
      case "Sessions":      return <TwinSessions />;
      case "Memory":        return <TwinMemory />;
      case "Knowledge":     return <TwinKnowledge />;
      case "Agents":        return <TwinAgents />;
      case "AgentMemory":   return <TwinAgentMemory />;
      case "Bench":         return <TwinBench />;
      case "Logs":          return <TwinLogs />;
      case "Skills":        return <TwinSkills />;
      case "Workflows":     return <TwinWorkflows />;
      case "Executions":    return <TwinExecutions />;
      case "Models":        return <TwinModels />;
      case "Tools":         return <TwinTools />;
      case "Observability": return <TwinObservability />;
    }
  })();

  const inner = (
    <div className="flex h-full w-full" style={{ background: "var(--card)" }}>
      {/* Grouped nav strip — 52px */}
      <div className="w-[52px] shrink-0 flex flex-col overflow-y-auto py-2 gap-0.5 border-r"
        style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>

        {/* Twin label */}
        <div className="flex items-center justify-center py-1.5 mb-1">
          <span className="text-[8px] uppercase tracking-widest" style={{ fontWeight: 800, color: "var(--iw-blue)" }}>Twin</span>
        </div>

        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && (
              <div className="mx-3 my-1.5 h-px" style={{ background: "var(--border)" }} />
            )}
            {group.items.map(item => (
              <NavBtn key={item.id} item={item} active={section === item.id} onClick={() => onSectionChange(item.id)} />
            ))}
          </div>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Collapse" : "Full screen"}
          className="w-9 h-9 mx-auto rounded-xl flex items-center justify-center transition-all mb-2"
          style={{ color: "var(--muted-foreground)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--card)"; (e.currentTarget as HTMLElement).style.color = "var(--iw-blue)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}
        >
          {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Section Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {content}
      </div>
    </div>
  );

  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex">
        {inner}
      </div>
    );
  }

  return inner;
}
