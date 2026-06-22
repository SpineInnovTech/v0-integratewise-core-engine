import { useState } from "react";
import { Bot, Brain, ChevronRight, Search, Zap, BookOpen, TrendingUp, Shield } from "lucide-react";

interface AgentMemoryEntry {
  agentId: string;
  agentName: string;
  description: string;
  patterns: string[];
  learnedThresholds: { rule: string; value: string }[];
  playbooks: string[];
  factCount: number;
  lastUpdated: string;
  runs: number;
}

const AGENT_MEMORIES: AgentMemoryEntry[] = [
  {
    agentId: "renewal-watchdog",
    agentName: "Renewal Watchdog",
    description: "Monitors account renewal health and surfaces at-risk signals",
    patterns: ["Silent Champion", "Support Escalation", "Payment Failure", "Usage Drop", "Low Adoption"],
    learnedThresholds: [
      { rule: "Risk score trigger", value: "> 75" },
      { rule: "Champion silence", value: "> 10 days" },
      { rule: "Usage drop alert", value: "> 15% MoM decline" },
    ],
    playbooks: ["Recovery Motion v2", "EBR Scheduling Protocol", "Credit Extension Policy"],
    factCount: 47,
    lastUpdated: "2 hours ago",
    runs: 842,
  },
  {
    agentId: "crm-reconciler",
    agentName: "CRM Reconciler",
    description: "Detects and proposes corrections for CRM data inconsistencies",
    patterns: ["Lifecycle stage mismatch", "Duplicate company records", "Missing close dates", "Stage regression"],
    learnedThresholds: [
      { rule: "Mismatch confidence", value: "> 0.85 to auto-propose" },
      { rule: "High risk auto-skip", value: "ARR > $50K" },
    ],
    playbooks: ["CRM Correction Playbook v1", "Duplicate Merge Protocol"],
    factCount: 23,
    lastUpdated: "5 hours ago",
    runs: 312,
  },
  {
    agentId: "pipeline-scout",
    agentName: "Pipeline Scout",
    description: "Analyses pipeline health and surfaces forecasting insights",
    patterns: ["Deal stall > 14d", "Stage regression", "Champion disengagement", "Competitor mention"],
    learnedThresholds: [
      { rule: "Stall alert", value: "> 14 days no activity" },
      { rule: "Coverage warning", value: "< 3.5x target" },
      { rule: "At-risk flag", value: "Probability drops > 20%" },
    ],
    playbooks: ["Pipeline Acceleration v3", "Deal Recovery Playbook"],
    factCount: 31,
    lastUpdated: "8 hours ago",
    runs: 89,
  },
];

function AgentMemoryDetail({ entry, onBack }: { entry: AgentMemoryEntry; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--card)" }}>
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} className="text-xs font-semibold mb-1" style={{ color: "var(--iw-blue)" }}>← Back</button>
        <h2 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>{entry.agentName}</h2>
        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{entry.runs.toLocaleString()} runs · {entry.factCount} facts · updated {entry.lastUpdated}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Patterns */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--iw-blue)" }} />
            <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Known Patterns</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entry.patterns.map((p, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "var(--iw-blue-50)", color: "var(--iw-blue)", border: "1px solid rgba(66,86,171,0.15)", fontWeight: 600 }}>
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Learned thresholds */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Shield className="w-3.5 h-3.5" style={{ color: "var(--iw-warning)" }} />
            <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Learned Thresholds</p>
          </div>
          <div className="space-y-1.5">
            {entry.learnedThresholds.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--foreground)" }}>{t.rule}</span>
                <span className="text-xs font-mono" style={{ fontWeight: 700, color: "var(--iw-warning)" }}>{t.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Playbooks learned */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--iw-success)" }} />
            <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Playbooks Learned</p>
          </div>
          <div className="space-y-1.5">
            {entry.playbooks.map((p, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style={{ background: "rgba(61,139,110,0.08)", border: "1px solid rgba(61,139,110,0.2)" }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--iw-success)" }} />
                <span className="text-xs" style={{ color: "var(--foreground)", fontWeight: 500 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            <span style={{ fontWeight: 700, color: "var(--foreground)" }}>{entry.factCount} stable facts</span> logged in agent memory.
            This agent is not stateless — it compounds knowledge across every run.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TwinAgentMemory() {
  const [selected, setSelected] = useState<AgentMemoryEntry | null>(null);
  const [search, setSearch] = useState("");

  if (selected) return <AgentMemoryDetail entry={selected} onBack={() => setSelected(null)} />;

  const filtered = AGENT_MEMORIES.filter(a =>
    a.agentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--card)" }}>
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm mb-0.5" style={{ fontWeight: 700, color: "var(--foreground)" }}>Agent Memory</h2>
        <p className="text-[10px] mb-3" style={{ color: "var(--muted-foreground)" }}>
          Patterns, thresholds, and playbooks each agent has learned
        </p>
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
        {filtered.map(entry => (
          <button key={entry.agentId} onClick={() => setSelected(entry)}
            className="w-full text-left px-4 py-3 transition-all group"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(123,94,167,0.1)", border: "1px solid rgba(123,94,167,0.2)" }}>
                <Bot className="w-3.5 h-3.5" style={{ color: "var(--iw-purple)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{entry.agentName}</p>
                <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>{entry.description}</p>
                <div className="flex items-center gap-2 mt-1 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                  <span>{entry.patterns.length} patterns</span>
                  <span>·</span>
                  <span>{entry.learnedThresholds.length} thresholds</span>
                  <span>·</span>
                  <span>{entry.playbooks.length} playbooks</span>
                  <span>·</span>
                  <span>{entry.factCount} facts</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 shrink-0 mt-1 transition-opacity" style={{ color: "var(--muted-foreground)" }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
