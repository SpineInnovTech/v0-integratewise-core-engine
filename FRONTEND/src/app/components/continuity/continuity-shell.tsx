/**
 * Continuity Shell — The Meaning Layer
 *
 * Where observations become organizational memory.
 *
 * Flow:
 *   Intake → Triage → Evolution → Promotion Queue → Org Memory → Knowledge
 *
 * The Promotion Queue is the most important screen in IntegrateWise.
 * It's where: AI learns → Human approves → Organization remembers.
 *
 * Doctrine: Truth you own. AI you rent. Approval in between.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Inbox, Bot, TrendingUp, Star, Database, BookOpen,
  GitBranch, BarChart3, ChevronRight, Search, Check, X,
  ArrowRight, Clock, MessageSquare, Mic, Users,
  FileText, Zap, Shield, AlertTriangle, CheckCircle2,
  Brain, RefreshCw, Edit2, Activity
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContinuityTab =
  | "Intake"
  | "Triage"
  | "Evolution"
  | "Promotion"
  | "OrgMemory"
  | "Knowledge";

type MemoryType =
  | "Observation" | "Decision" | "Fact" | "Playbook"
  | "Relationship" | "Outcome" | "Policy" | "Pattern" | "Preference";

type MemoryScope = "personal" | "shared" | "org";

interface IntakeItem {
  id: string;
  source: "meeting" | "slack" | "email" | "chat" | "voice" | "agent" | "workflow";
  content: string;
  entity?: string;
  confidence: number;
  timestamp: string;
  status: "pending" | "triaged" | "dismissed";
}

interface TriageItem {
  id: string;
  content: string;
  rawSource: string;
  suggestedType: MemoryType;
  confidence: number;
  entity?: string;
  timestamp: string;
  status: "pending" | "classified" | "dismissed";
}

interface EvolutionChain {
  id: string;
  entity: string;
  stages: { date: string; content: string; type: string }[];
  currentType: MemoryType;
  confidence: number;
}

interface PromotionCandidate {
  id: string;
  content: string;
  type: MemoryType;
  scope: MemoryScope;
  confidence: number;
  evidence: string;
  evidenceCount: number;
  recommendedAction: "promote" | "review" | "discard";
  status: "pending" | "approved" | "rejected" | "revised";
  createdAt: string;
}

interface OrgMemoryEntry {
  id: string;
  content: string;
  type: MemoryType;
  scope: MemoryScope;
  approvedBy: string;
  approvedAt: string;
  confidence: number;
  usageCount: number;
  tags: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INTAKE_ITEMS: IntakeItem[] = [
  { id: "in-001", source: "meeting", content: "Customer sounded frustrated about the support backlog. Mentioned budget review in Q3.", entity: "FinanceFlow Solutions", confidence: 78, timestamp: "10:30 AM", status: "pending" },
  { id: "in-002", source: "slack",   content: "David Park went silent after the API latency issue on May 8th.", entity: "David Park", confidence: 91, timestamp: "10:45 AM", status: "pending" },
  { id: "in-003", source: "agent",   content: "Renewal Watchdog: FinanceFlow risk score crossed 80 threshold. Pattern matches 3 prior churn events.", entity: "FinanceFlow Solutions", confidence: 94, timestamp: "10:42 AM", status: "triaged" },
  { id: "in-004", source: "voice",   content: "User noted that APAC accounts respond better to executive outreach than standard CSM contact.", confidence: 72, timestamp: "09:15 AM", status: "pending" },
  { id: "in-005", source: "workflow",content: "CRM Reconciler: 4 lifecycle mismatches found and proposed for correction. Pattern recurring weekly.", confidence: 88, timestamp: "08:32 AM", status: "triaged" },
  { id: "in-006", source: "email",   content: "CFO mentioned renewals are under scrutiny this quarter due to board pressure.", entity: "TechServe Asia", confidence: 65, timestamp: "Yesterday", status: "pending" },
];

const TRIAGE_ITEMS: TriageItem[] = [
  { id: "tr-001", content: "Customer sounded frustrated about the support backlog. Mentioned budget review in Q3.", rawSource: "Meeting · FinanceFlow", suggestedType: "Observation", confidence: 78, entity: "FinanceFlow Solutions", timestamp: "10:30 AM", status: "pending" },
  { id: "tr-002", content: "David Park went silent after the API latency issue on May 8th.", rawSource: "Slack signal", suggestedType: "Observation", confidence: 91, entity: "David Park", timestamp: "10:45 AM", status: "pending" },
  { id: "tr-003", content: "APAC accounts respond better to executive outreach than standard CSM contact.", rawSource: "Voice session", suggestedType: "Preference", confidence: 72, timestamp: "09:15 AM", status: "pending" },
  { id: "tr-004", content: "CFO mentioned renewals are under scrutiny this quarter due to board pressure.", rawSource: "Email · Twin surfaced", suggestedType: "Observation", confidence: 65, entity: "TechServe Asia", timestamp: "Yesterday", status: "classified" },
];

const EVOLUTION_CHAINS: EvolutionChain[] = [
  {
    id: "ev-001",
    entity: "Renewal Risk Pattern",
    currentType: "Playbook",
    confidence: 94,
    stages: [
      { date: "Day 1", content: "Customer unhappy with support response time.", type: "Observation" },
      { date: "Day 14", content: "Customer unhappy due to unresolved P1 tickets before renewal.", type: "Pattern" },
      { date: "Day 30", content: "Open P1 tickets + champion silence correlates with renewal risk.", type: "Insight" },
      { date: "Day 90", content: "Support backlog + silent champion → renewal risk pattern. Seen in 17 accounts.", type: "Playbook" },
    ],
  },
  {
    id: "ev-002",
    entity: "APAC Outreach Preference",
    currentType: "Preference",
    confidence: 81,
    stages: [
      { date: "Week 1", content: "APAC user mentioned preferring executive contact.", type: "Observation" },
      { date: "Week 3", content: "3 APAC accounts responded better to VP-level outreach.", type: "Pattern" },
      { date: "Month 2", content: "Executive outreach in APAC 2.3× more effective than CSM contact.", type: "Insight" },
    ],
  },
];

const PROMOTION_QUEUE: PromotionCandidate[] = [
  {
    id: "pq-001",
    content: "Support backlog + champion silence is a leading indicator of renewal risk. Seen in 17 of 23 at-risk accounts in the past 6 months.",
    type: "Playbook",
    scope: "org",
    confidence: 94,
    evidence: "17 accounts · 6 months · Renewal Watchdog correlation",
    evidenceCount: 17,
    recommendedAction: "promote",
    status: "pending",
    createdAt: "Today",
  },
  {
    id: "pq-002",
    content: "APAC executive outreach achieves 2.3× higher renewal save rate vs standard CSM contact.",
    type: "Playbook",
    scope: "shared",
    confidence: 81,
    evidence: "12 accounts · 3 months · CS team data",
    evidenceCount: 12,
    recommendedAction: "promote",
    status: "pending",
    createdAt: "Yesterday",
  },
  {
    id: "pq-003",
    content: "Budget review mentions in Q3 meetings correlate with 40% likelihood of renewal risk.",
    type: "Pattern",
    scope: "org",
    confidence: 71,
    evidence: "8 accounts · 2 quarters",
    evidenceCount: 8,
    recommendedAction: "review",
    status: "pending",
    createdAt: "2 days ago",
  },
  {
    id: "pq-004",
    content: "User prefers Claude 3.7 for complex reasoning tasks and IW Pro for CRM queries.",
    type: "Preference",
    scope: "personal",
    confidence: 96,
    evidence: "Observed across 34 sessions",
    evidenceCount: 34,
    recommendedAction: "promote",
    status: "approved",
    createdAt: "3 days ago",
  },
];

const ORG_MEMORY: OrgMemoryEntry[] = [
  { id: "om-001", content: "Silent Champion + Open P1 tickets → renewal risk. Trigger Renewal Watchdog immediately.", type: "Playbook", scope: "org", approvedBy: "Alex Rivera", approvedAt: "Last week", confidence: 97, usageCount: 23, tags: ["renewal", "cs", "risk"] },
  { id: "om-002", content: "APAC accounts require executive outreach — standard CSM contact not sufficient for renewal recovery.", type: "Playbook", scope: "shared", approvedBy: "Alex Rivera", approvedAt: "2 weeks ago", confidence: 89, usageCount: 8, tags: ["apac", "renewal", "outreach"] },
  { id: "om-003", content: "Credit extension offers should be framed as proactive value delivery, not compensation for failures.", type: "Policy", scope: "org", approvedBy: "Alex Rivera", approvedAt: "Last month", confidence: 92, usageCount: 5, tags: ["credit", "policy", "cs"] },
  { id: "om-004", content: "User Nirmal: prefers approval before any writeback. EBR before escalation. Table format for account plans.", type: "Preference", scope: "personal", approvedBy: "Alex Rivera", approvedAt: "2 months ago", confidence: 98, usageCount: 47, tags: ["preference", "workflow"] },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const SOURCE_ICONS: Record<string, any> = {
  meeting: Users, slack: MessageSquare, email: FileText,
  chat: MessageSquare, voice: Mic, agent: Bot, workflow: Zap,
};

const SOURCE_EMOJI: Record<string, string> = {
  meeting: "🤝", slack: "💬", email: "📧",
  chat: "🧠", voice: "🎙️", agent: "✦", workflow: "⚙️",
};

// "agent" source = Twin surfaced this via an execution path — not autonomous agent noise
const SOURCE_LABEL: Record<string, string> = {
  meeting: "Meeting", slack: "Slack", email: "Email",
  chat: "Chat", voice: "Voice", agent: "Twin observation", workflow: "Workflow result",
};

const SCOPE_CONFIG: Record<MemoryScope, { label: string; color: string; bg: string }> = {
  personal: { label: "Personal", color: "var(--iw-blue)",    bg: "rgba(66,86,171,0.1)" },
  shared:   { label: "Shared",   color: "var(--iw-purple)",  bg: "rgba(123,94,167,0.1)" },
  org:      { label: "Org",      color: "var(--iw-success)", bg: "rgba(61,139,110,0.1)" },
};

const TYPE_COLORS: Record<string, string> = {
  Observation: "var(--iw-blue)",    Decision: "var(--iw-purple)",
  Fact:        "var(--iw-success)", Playbook: "var(--iw-warning)",
  Relationship:"var(--iw-blue)",    Outcome:  "var(--iw-success)",
  Policy:      "var(--iw-danger)",  Pattern:  "var(--iw-pink)",
  Preference:  "var(--muted-foreground)",
};

// ─── Tab views ────────────────────────────────────────────────────────────────

function IntakeView() {
  const [items, setItems] = useState(INTAKE_ITEMS);
  const pending = items.filter(i => i.status === "pending");
  const processed = items.filter(i => i.status !== "pending");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Incoming observations from all sources — Slack, meetings, email, agents, voice.
        </p>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full"
          style={{ background: "rgba(212,136,62,0.1)", color: "var(--iw-warning)" }}>
          {pending.length} pending
        </span>
      </div>
      <div className="space-y-2">
        {items.map(item => {
          const SIcon = SOURCE_ICONS[item.source] || FileText;
          return (
            <div key={item.id} className="rounded-xl border overflow-hidden"
              style={{ borderColor: "var(--border)", background: "var(--card)", opacity: item.status !== "pending" ? 0.6 : 1 }}>
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="text-lg shrink-0 leading-none mt-0.5">{SOURCE_EMOJI[item.source]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold" style={{ color: "var(--muted-foreground)" }}>{SOURCE_LABEL[item.source] || item.source}</span>
                    {item.entity && <span className="text-[9px] font-mono" style={{ color: "var(--iw-blue)" }}>{item.entity}</span>}
                    <span className="text-[9px] ml-auto" style={{ color: "var(--muted-foreground)" }}>{item.timestamp}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{item.content}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 rounded-full" style={{ background: "var(--secondary)" }}>
                      <div className="h-full rounded-full" style={{ width: `${item.confidence}%`, background: item.confidence >= 80 ? "var(--iw-success)" : item.confidence >= 65 ? "var(--iw-warning)" : "var(--iw-danger)" }} />
                    </div>
                    <span className="text-[9px] font-mono shrink-0" style={{ color: "var(--muted-foreground)" }}>{item.confidence}%</span>
                  </div>
                </div>
                {item.status === "pending" && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "dismissed" as const } : i))}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: "var(--secondary)" }}>
                      <X className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                    </button>
                    <button onClick={() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "triaged" as const } : i))}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: "var(--iw-blue)" }}>
                      <ArrowRight className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
                {item.status === "triaged" && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--iw-success)" }} />}
                {item.status === "dismissed" && <X className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TriageView() {
  const [items, setItems] = useState(TRIAGE_ITEMS);
  const [editingType, setEditingType] = useState<string | null>(null);

  const MEMORY_TYPES: MemoryType[] = ["Observation","Decision","Fact","Playbook","Relationship","Outcome","Policy","Pattern","Preference"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: "rgba(66,86,171,0.07)", border: "1px solid rgba(66,86,171,0.2)" }}>
        <Bot className="w-4 h-4 shrink-0" style={{ color: "var(--iw-blue)" }} />
        <p className="text-xs" style={{ color: "var(--iw-blue)", fontWeight: 500 }}>
          Triage Bot classifying incoming observations. Confirm or adjust type before routing.
        </p>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="rounded-xl border overflow-hidden"
            style={{ borderColor: item.status === "classified" ? "rgba(61,139,110,0.3)" : "var(--border)", background: "var(--card)", opacity: item.status === "classified" ? 0.6 : 1 }}>
            <div className="px-4 py-3">
              <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--foreground)" }}>{item.content}</p>
              <div className="flex items-center gap-2 mb-3 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                <span>{item.rawSource}</span>
                {item.entity && <><span>·</span><span style={{ color: "var(--iw-blue)", fontWeight: 600 }}>{item.entity}</span></>}
                <span>·</span><span>{item.timestamp}</span>
              </div>

              {/* Type suggestion */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Bot suggests:</span>
                {editingType === item.id ? (
                  <div className="flex flex-wrap gap-1">
                    {MEMORY_TYPES.map(t => (
                      <button key={t} onClick={() => {
                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, suggestedType: t } : i));
                        setEditingType(null);
                      }}
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: `${TYPE_COLORS[t]}15`, color: TYPE_COLORS[t] }}>
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] px-2 py-0.5 rounded font-bold"
                      style={{ background: `${TYPE_COLORS[item.suggestedType]}15`, color: TYPE_COLORS[item.suggestedType] }}>
                      {item.suggestedType}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: "var(--muted-foreground)" }}>{item.confidence}%</span>
                    <button onClick={() => setEditingType(item.id)} className="ml-1">
                      <Edit2 className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                    </button>
                  </div>
                )}
              </div>

              {item.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "dismissed" as const } : i))}
                    className="flex-1 py-1.5 rounded-xl text-[10px] transition-all"
                    style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)", fontWeight: 600 }}>
                    Dismiss
                  </button>
                  <button onClick={() => setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "classified" as const } : i))}
                    className="flex-1 py-1.5 rounded-xl text-[10px] transition-all"
                    style={{ background: "var(--iw-blue)", color: "white", fontWeight: 700 }}>
                    Confirm → Promotion Queue
                  </button>
                </div>
              )}
              {item.status === "classified" && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--iw-success)" }} />
                  <span className="text-[10px]" style={{ color: "var(--iw-success)", fontWeight: 600 }}>Classified · In promotion queue</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvolutionView() {
  return (
    <div className="space-y-5">
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Memory evolves over time. Observations compound into patterns, patterns into insights, insights into playbooks.
      </p>
      {EVOLUTION_CHAINS.map(chain => (
        <div key={chain.id} className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--iw-warning)" }} />
              <span className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{chain.entity}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold ml-auto"
                style={{ background: `${TYPE_COLORS[chain.currentType]}15`, color: TYPE_COLORS[chain.currentType] }}>
                Now: {chain.currentType}
              </span>
              <span className="text-[9px] font-mono" style={{ color: "var(--muted-foreground)" }}>{chain.confidence}%</span>
            </div>
          </div>
          <div className="px-4 py-3 space-y-0">
            {chain.stages.map((stage, i) => (
              <div key={i} className="flex gap-3 relative">
                {i < chain.stages.length - 1 && (
                  <div className="absolute left-[10px] top-6 bottom-0 w-px" style={{ background: "var(--border)" }} />
                )}
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 mt-1"
                  style={{ background: i === chain.stages.length - 1 ? "var(--iw-warning)" : "var(--secondary)", border: "1px solid var(--border)" }}>
                  <div className="w-1.5 h-1.5 rounded-full"
                    style={{ background: i === chain.stages.length - 1 ? "white" : "var(--muted-foreground)" }} />
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-mono" style={{ color: "var(--muted-foreground)" }}>{stage.date}</span>
                    <span className="text-[8px] px-1 py-0.5 rounded font-bold"
                      style={{ background: `${TYPE_COLORS[stage.type]}12`, color: TYPE_COLORS[stage.type] }}>
                      {stage.type}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{stage.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PromotionQueueView() {
  const [candidates, setCandidates] = useState(PROMOTION_QUEUE);
  const pending = candidates.filter(c => c.status === "pending");

  const act = (id: string, status: "approved" | "rejected") => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  return (
    <div className="space-y-4">
      {/* Doctrine callout */}
      <div className="px-4 py-3 rounded-xl"
        style={{ background: "var(--iw-blue-900)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-xs text-white" style={{ fontWeight: 700 }}>
          The Promotion Queue is where the organization learns.
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
          AI observes and evolves memories. Only your approvals make them permanent.
          Truth you own. AI you rent. Approval in between.
        </p>
      </div>

      {pending.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
            Awaiting your decision · {pending.length} candidates
          </p>
          <div className="space-y-3">
            {pending.map(c => {
              const sc = SCOPE_CONFIG[c.scope];
              return (
                <div key={c.id} className="rounded-xl border overflow-hidden"
                  style={{ borderColor: c.recommendedAction === "promote" ? "rgba(61,139,110,0.3)" : "var(--border)", background: "var(--card)" }}>
                  <div className="px-4 py-3">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0"
                        style={{ background: `${TYPE_COLORS[c.type]}15`, color: TYPE_COLORS[c.type] }}>
                        {c.type}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0"
                        style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                      <span className="text-[9px] ml-auto" style={{ color: "var(--muted-foreground)" }}>{c.createdAt}</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--foreground)", fontWeight: 500 }}>{c.content}</p>

                    {/* Evidence */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-1 rounded-full" style={{ background: "var(--secondary)" }}>
                        <div className="h-full rounded-full" style={{ width: `${c.confidence}%`, background: c.confidence >= 85 ? "var(--iw-success)" : "var(--iw-warning)" }} />
                      </div>
                      <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{c.confidence}%</span>
                    </div>
                    <p className="text-[10px] mb-3" style={{ color: "var(--muted-foreground)" }}>
                      Evidence: {c.evidence}
                    </p>

                    <div className="flex gap-2">
                      <button onClick={() => act(c.id, "rejected")}
                        className="flex-1 py-2 rounded-xl text-xs transition-all"
                        style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)", fontWeight: 600 }}>
                        Reject
                      </button>
                      <button onClick={() => act(c.id, "approved")}
                        className="flex-1 py-2 rounded-xl text-xs transition-all"
                        style={{ background: "var(--iw-success)", color: "white", fontWeight: 700 }}>
                        ✓ Approve → Org Memory
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved */}
      {candidates.filter(c => c.status !== "pending").length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Resolved</p>
          {candidates.filter(c => c.status !== "pending").map(c => (
            <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1.5"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", opacity: 0.7 }}>
              {c.status === "approved" ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--iw-success)" }} /> : <X className="w-4 h-4 shrink-0" style={{ color: "var(--iw-danger)" }} />}
              <p className="text-xs flex-1 truncate" style={{ color: "var(--foreground)" }}>{c.content}</p>
              <span className="text-[9px] capitalize font-bold shrink-0" style={{ color: c.status === "approved" ? "var(--iw-success)" : "var(--iw-danger)" }}>{c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrgMemoryView() {
  const [scopeFilter, setScopeFilter] = useState<MemoryScope | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = ORG_MEMORY.filter(m => {
    const matchScope = scopeFilter === "all" || m.scope === scopeFilter;
    const matchSearch = m.content.toLowerCase().includes(search.toLowerCase());
    return matchScope && matchSearch;
  });

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Approved institutional memory. Curated, governed, compounding.
      </p>

      <div className="flex gap-1">
        {(["all", "personal", "shared", "org"] as const).map(s => {
          const cfg = s === "all" ? null : SCOPE_CONFIG[s];
          return (
            <button key={s} onClick={() => setScopeFilter(s)}
              className="text-[9px] px-2 py-1 rounded-full capitalize transition-all"
              style={{ fontWeight: 600, background: scopeFilter === s ? (cfg?.color || "var(--iw-blue)") : "var(--secondary)", color: scopeFilter === s ? "white" : "var(--muted-foreground)" }}>
              {s === "all" ? "All scopes" : cfg?.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search org memory…"
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
      </div>

      <div className="space-y-2">
        {filtered.map(m => {
          const sc = SCOPE_CONFIG[m.scope];
          return (
            <div key={m.id} className="rounded-xl border px-4 py-3"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: `${TYPE_COLORS[m.type]}15`, color: TYPE_COLORS[m.type] }}>{m.type}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                <span className="text-[9px] ml-auto" style={{ color: "var(--muted-foreground)" }}>
                  Used {m.usageCount}× · {m.approvedAt}
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--foreground)", fontWeight: 500 }}>{m.content}</p>
              <div className="flex items-center gap-2 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                <span>Approved by {m.approvedBy}</span>
                <span>·</span>
                <span className="font-mono">{m.confidence}% confidence</span>
              </div>
              <div className="flex gap-1 mt-1.5">
                {m.tags.map(t => (
                  <span key={t} className="text-[8px] px-1 py-0.5 rounded font-mono"
                    style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>{t}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { id: ContinuityTab; label: string; icon: any; badge?: number; important?: boolean }[] = [
  { id: "Intake",     label: "Intake",     icon: Inbox,      badge: 4 },
  { id: "Triage",     label: "Triage",     icon: Bot,        badge: 2 },
  { id: "Evolution",  label: "Evolution",  icon: TrendingUp },
  { id: "Promotion",  label: "Promotion Queue", icon: Star, badge: 2, important: true },
  { id: "OrgMemory",  label: "Org Memory", icon: Database },
  { id: "Knowledge",  label: "Knowledge",  icon: BookOpen },
];

export function ContinuityShell() {
  const [tab, setTab] = useState<ContinuityTab>("Promotion");

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-0 shrink-0" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(212,103,128,0.12)", border: "1px solid rgba(212,103,128,0.2)" }}>
            <Brain className="w-4 h-4" style={{ color: "var(--iw-pink)" }} />
          </div>
          <div>
            <h1 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>Continuity</h1>
            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              The Meaning Layer · Intake → Triage → Evolution → Promotion → Org Memory
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs border-b-2 transition-all whitespace-nowrap shrink-0"
              style={{
                fontWeight: tab === t.id ? 700 : 500,
                borderColor: tab === t.id ? "var(--iw-blue)" : "transparent",
                color: tab === t.id ? "var(--iw-blue)" : "var(--muted-foreground)",
              }}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.badge !== undefined && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: t.important && tab !== t.id ? "var(--iw-warning)" : tab === t.id ? "var(--iw-blue)" : "var(--secondary)",
                    color: (t.important && tab !== t.id) || tab === t.id ? "white" : "var(--muted-foreground)",
                  }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "Intake"    && <IntakeView />}
        {tab === "Triage"    && <TriageView />}
        {tab === "Evolution" && <EvolutionView />}
        {tab === "Promotion" && <PromotionQueueView />}
        {tab === "OrgMemory" && <OrgMemoryView />}
        {tab === "Knowledge" && (
          <div className="flex flex-col items-center py-12 text-center">
            <BookOpen className="w-8 h-8 mb-3" style={{ color: "var(--iw-blue)", opacity: 0.4 }} />
            <p className="text-sm" style={{ fontWeight: 600, color: "var(--foreground)" }}>Knowledge base</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Documents, runbooks, SOPs, templates — separate from memory
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
