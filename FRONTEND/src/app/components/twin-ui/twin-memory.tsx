/**
 * Twin Working Memory — Layer 1 (Cognitive Traces Only)
 *
 * This is NOT organizational memory.
 * This is the Twin's cognitive working space:
 * conversations, sessions, voice, reasoning chains, temporary context.
 *
 * Nothing here is permanent truth.
 * Everything here is eligible for triage → promotion → org memory.
 *
 * Spine = Truth. Memory = Meaning. Twin = Reasoning.
 */

import { useState } from "react";
import {
  MessageSquare, Timer, Mic, Brain, Clock, ArrowRight,
  Search, Zap, RefreshCw
} from "lucide-react";

type MemoryItemType = "conversation" | "session" | "voice" | "reasoning" | "note";

interface WorkingMemoryItem {
  id: string;
  type: MemoryItemType;
  title: string;
  content: string;
  timestamp: string;
  ttl: string;
  triageEligible: boolean;
  promoted: boolean;
  tags: string[];
}

const WORKING_MEMORY: WorkingMemoryItem[] = [
  {
    id: "wm-001",
    type: "conversation",
    title: "APAC Renewal Risk Review",
    content: "Discussed FinanceFlow renewal risk — champion silent 12d, risk 92/100. 48h action plan drafted. EBR to be scheduled. Credit extension proposed.",
    timestamp: "Today 10:42 AM",
    ttl: "Eligible for triage",
    triageEligible: true,
    promoted: false,
    tags: ["renewal", "financeflow", "apac"],
  },
  {
    id: "wm-002",
    type: "session",
    title: "Session ses-1024 — Reasoning window",
    content: "5 entities loaded, 14 memory refs, 3 tool calls. Outcome: Renewal proposal. Duration 18 min.",
    timestamp: "Today 10:42 AM",
    ttl: "Eligible for triage",
    triageEligible: true,
    promoted: false,
    tags: ["session", "renewal"],
  },
  {
    id: "wm-003",
    type: "reasoning",
    title: "Pipeline coverage reasoning chain",
    content: "Coverage 3.1x vs 4x target → 5 slipped deals → 3 worth saving → acceleration recommendation.",
    timestamp: "Today 09:00 AM",
    ttl: "Eligible for triage",
    triageEligible: true,
    promoted: false,
    tags: ["pipeline", "reasoning"],
  },
  {
    id: "wm-004",
    type: "note",
    title: "Working note — FinanceFlow recovery",
    content: "User prefers EBR before escalation. Credit extension needs Finance approval first. David Park responds to Slack over email.",
    timestamp: "Yesterday 3:30 PM",
    ttl: "Expires in 5 days",
    triageEligible: false,
    promoted: false,
    tags: ["financeflow", "preference"],
  },
  {
    id: "wm-005",
    type: "voice",
    title: "Voice session — morning brief",
    content: "User asked: 'What's critical today?' Twin responded with FinanceFlow summary, P1 status, pipeline gap.",
    timestamp: "Today 08:30 AM",
    ttl: "Expires in 3 days",
    triageEligible: true,
    promoted: false,
    tags: ["voice", "morning"],
  },
  {
    id: "wm-006",
    type: "conversation",
    title: "FinanceFlow Recovery Plan",
    content: "Full 48h plan committed. EBR scheduling, P1 escalation, credit extension. Promoted to org memory queue.",
    timestamp: "Yesterday 3:15 PM",
    ttl: "Promoted",
    triageEligible: false,
    promoted: true,
    tags: ["financeflow", "recovery"],
  },
];

const TYPE_CONFIG: Record<MemoryItemType, { icon: any; label: string; color: string; bg: string }> = {
  conversation: { icon: MessageSquare, label: "Conversation", color: "var(--iw-blue)",    bg: "rgba(66,86,171,0.1)" },
  session:      { icon: Timer,         label: "Session",      color: "var(--iw-purple)",  bg: "rgba(123,94,167,0.1)" },
  voice:        { icon: Mic,           label: "Voice",        color: "var(--iw-pink)",    bg: "rgba(212,103,128,0.1)" },
  reasoning:    { icon: Brain,         label: "Reasoning",    color: "var(--iw-warning)", bg: "rgba(212,136,62,0.1)" },
  note:         { icon: Zap,           label: "Note",         color: "var(--iw-success)", bg: "rgba(61,139,110,0.1)" },
};

export function TwinMemory() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<MemoryItemType | "all">("all");

  const filtered = WORKING_MEMORY.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || item.type === filterType;
    return matchSearch && matchType;
  });

  const eligibleCount = WORKING_MEMORY.filter(m => m.triageEligible && !m.promoted).length;

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--card)" }}>

      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-0.5">
          <h2 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>Working Memory</h2>
          <button className="p-1.5 rounded-lg" style={{ color: "var(--muted-foreground)" }}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] mb-3" style={{ color: "var(--muted-foreground)" }}>
          Cognitive traces — temporary. Not truth, not org memory. Eligible for triage.
        </p>

        {/* Triage nudge */}
        {eligibleCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 cursor-pointer"
            style={{ background: "rgba(212,136,62,0.08)", border: "1px solid rgba(212,136,62,0.25)" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: "var(--iw-warning)" }} />
            <p className="text-[10px] flex-1" style={{ color: "var(--iw-warning)", fontWeight: 600 }}>
              {eligibleCount} items ready → Continuity Triage
            </p>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--iw-warning)" }} />
          </div>
        )}

        {/* Type filters */}
        <div className="flex gap-1 flex-wrap">
          {(["all", "conversation", "session", "voice", "reasoning", "note"] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className="text-[9px] px-2 py-1 rounded-full capitalize transition-all"
              style={{
                fontWeight: 600,
                background: filterType === t ? "var(--iw-blue)" : "var(--secondary)",
                color: filterType === t ? "white" : "var(--muted-foreground)",
              }}>
              {t === "all" ? "All" : TYPE_CONFIG[t as MemoryItemType].label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search working memory…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
        {filtered.map(item => {
          const tc = TYPE_CONFIG[item.type];
          const TypeIcon = tc.icon;
          return (
            <div key={item.id} className="px-4 py-3 cursor-pointer transition-all"
              style={{ opacity: item.promoted ? 0.55 : 1 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: tc.bg }}>
                  <TypeIcon className="w-3.5 h-3.5" style={{ color: tc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{item.title}</p>
                    {item.promoted && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: "rgba(61,139,110,0.12)", color: "var(--iw-success)" }}>
                        Promoted ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] line-clamp-2 leading-relaxed mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                    {item.content}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                      <Clock className="w-2.5 h-2.5" /> {item.timestamp}
                    </span>
                    <span className="text-[9px]" style={{
                      color: item.triageEligible && !item.promoted ? "var(--iw-warning)" :
                             item.promoted ? "var(--iw-success)" : "var(--muted-foreground)",
                      fontWeight: 600,
                    }}>
                      · {item.ttl}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[8px] px-1 py-0.5 rounded font-mono"
                        style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Doctrine footer */}
      <div className="px-4 py-2.5 border-t shrink-0 text-center"
        style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
        <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>
          Temporary cognitive traces · Promote via{" "}
          <strong style={{ color: "var(--iw-blue)" }}>Continuity → Triage</strong>{" "}
          to become org memory
        </p>
      </div>
    </div>
  );
}
