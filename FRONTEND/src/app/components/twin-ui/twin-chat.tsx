import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare, Plus, Search, Send, Paperclip, ChevronDown,
  Copy, ThumbsUp, ThumbsDown, RefreshCw, Sparkles, MoreHorizontal,
  Brain, Loader2, Bot, Clock, Star, Zap, X, Check,
  Database, Hash, Mic, MicOff, Radio, BookOpen, FileCheck, Layers,
  ArrowRight
} from "lucide-react";
import { type CTXEnum } from "../spine/types";
import { useSpine } from "../spine/spine-client";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

interface EvidenceSource {
  source: string;
  type: "crm" | "support" | "memory" | "spine" | "billing" | "comms" | "analytics";
  detail?: string;
}

interface EntitySnapshot {
  name: string;
  type: string;
  status: "critical" | "warning" | "healthy" | "info";
  metrics: { label: string; value: string }[];
}

// ─── Rich block types (Notion/Slack-style structured content) ─────────────────

type Block =
  | { t: "p";       text: string }
  | { t: "callout"; variant: "critical" | "warning" | "info" | "success" | "memory"; emoji: string; title?: string; text: string }
  | { t: "card";    emoji?: string; title: string; subtitle?: string; id?: string; fields?: { k: string; v: string; color?: string }[] }
  | { t: "list";    label?: string; items: { text: string; id?: string; link?: string; done?: boolean }[] }
  | { t: "refs";    label: string; items: { text: string; id?: string; source?: string }[] }
  | { t: "sep";     label?: string }

interface Message {
  id: string;
  role: Role;
  content: string;           // fallback plain text
  blocks?: Block[];          // rich structured content (preferred)
  timestamp: string;
  thinking?: boolean;
  actions?: { label: string; type: "approve" | "view" | "link" }[];
  table?: { headers: string[]; rows: string[][] };
  evidence?: EvidenceSource[];
  entity?: EntitySnapshot;
  memoryRefs?: string[];
  memoryCommit?: string;
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
  time: string;
  pinned?: boolean;
  ctx: CTXEnum;
}

// ─── Greeting Generator ───────────────────────────────────────────────────────

const GREETING_LINES: Record<CTXEnum, { overnight: string; critical: string; invite: string; chips: string[] }> = {
  CTX_CS: {
    overnight: "I ran Renewal Watchdog and scanned 47 accounts. FinanceFlow came back critical — David Park has been silent 12 days and there's a $84K renewal in 29 days. I've drafted a recovery sequence and it's waiting for your call.",
    critical: "The one that can't wait: FinanceFlow.",
    invite: "Want to start there, or should I walk you through the full at-risk list?",
    chips: ["FinanceFlow recovery plan", "Show at-risk accounts", "What renewals are due this month?"],
  },
  CTX_SALES: {
    overnight: "Pipeline Scout ran at 8 AM. Coverage is at 3.1x against a 4x target — 5 deals slipped from Q2 and 3 are going cold right now with no activity in 14 days. I flagged the ones worth saving before quarter close.",
    critical: "Three deals need a touch today or they're gone.",
    invite: "Want me to prioritise which ones to call first?",
    chips: ["Which deals are going cold?", "Show pipeline gaps", "Help me prep for 3pm review"],
  },
  CTX_MARKETING: {
    overnight: "12 MQLs from yesterday's APAC webinar are unrouted — SLA breach in 2 hours. I also flagged your LinkedIn spend efficiency dropped 15%, creative fatigue signal. The bounce rate on Thursday's campaign is above threshold.",
    critical: "Route those 12 MQLs before the SLA clock runs out.",
    invite: "Want me to suggest the best 3 to fast-track to Sales?",
    chips: ["Route hot MQLs to Sales", "Show campaign performance", "What's the APAC webinar ROI?"],
  },
  CTX_BIZOPS: {
    overnight: "3 AI proposals have been in the governance queue since yesterday — oldest is 18 hours old. Schema AI proposed a Jira connector update overnight and it needs your sign-off. Q3 OKR alignment between Sales and CS is still unresolved.",
    critical: "Governance queue is aging. Proposals expire if not reviewed.",
    invite: "Want to start with approvals or the Schema AI drift?",
    chips: ["Review pending proposals", "Show Schema AI drift", "Q3 OKR alignment"],
  },
  CTX_SUPPORT: {
    overnight: "P1 ticket #4821 for FinanceFlow is now 72 hours unresolved — that's a renewal customer. 5 tickets are approaching SLA breach in the next 2 hours. Maria is at 120% capacity and I've flagged the redistribution.",
    critical: "#4821 is the one that could cost us a renewal.",
    invite: "Want me to draft the escalation to Engineering right now?",
    chips: ["Escalate #4821", "Show SLA breaches", "Redistribute Maria's load"],
  },
  CTX_PM: {
    overnight: "Sprint 6 demo is in 2 hours and 3 features don't have demo notes. I tracked 2 slipped milestones that need re-planning before the stakeholder update. The API blocker has been sitting 3 days without resolution.",
    critical: "Demo in 2 hours — let's get that deck ready.",
    invite: "Want me to pull the feature status and draft talking points?",
    chips: ["Prep sprint 6 demo notes", "Show slipped milestones", "What's blocking the API?"],
  },
  CTX_TECH: {
    overnight: "P1 incident: FinanceFlow bulk export has been timing out in production. I correlated it with the deploy from Tuesday — rollback candidate is ready. Also, Jira connector Schema AI proposed v1.1.0 with 2 new fields, confidence 0.88.",
    critical: "P1 is active and a renewal customer is affected.",
    invite: "Want me to pull the trace logs and suggest a root cause?",
    chips: ["Diagnose the P1", "Review Schema AI v1.1.0", "Show deploy candidates"],
  },
  CTX_HR: {
    overnight: "6 managers haven't submitted Q2 performance reviews — deadline is today. 3 final-round candidates are waiting on decisions. The engagement model flagged 2 senior engineers as flight risk based on signals from the past 30 days.",
    critical: "Flight risk signal needs a human conversation, not a form.",
    invite: "Want me to pull the engagement signals for those two engineers?",
    chips: ["Flight risk signals", "Performance review status", "Final round decisions"],
  },
  CTX_FINANCE: {
    overnight: "FinanceFlow's $84K invoice failed twice on Stripe — payment method expired. Marketing is at 89% of Q3 budget with 6 weeks to go. 8 expense reports above threshold are still in your queue.",
    critical: "That Stripe failure could block the renewal conversation.",
    invite: "Want me to draft the outreach to their finance team?",
    chips: ["Draft FinanceFlow payment outreach", "Budget variance report", "Clear expense queue"],
  },
  CTX_LEGAL: {
    overnight: "NovaTech MSA needs your sign-off — Sales is waiting and the deal is at risk of slipping the quarter. 3 vendor contracts expire in 30 days. GDPR DPA amendment is due next month and it hasn't started.",
    critical: "NovaTech is the deal blocker right now.",
    invite: "Want me to summarise the key MSA risk clauses for your review?",
    chips: ["Summarise NovaTech MSA risks", "Show expiring contracts", "GDPR DPA timeline"],
  },
};

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ─── Greeting Card Component ──────────────────────────────────────────────────

function TwinGreeting({
  name, ctx, onChipClick,
}: {
  name: string; ctx: CTXEnum; onChipClick: (text: string) => void;
}) {
  const time = getTimeOfDay();
  const salutation = time === "morning" ? "Good morning" : time === "afternoon" ? "Good afternoon" : "Good evening";
  const g = GREETING_LINES[ctx] || GREETING_LINES.CTX_BIZOPS;
  const firstName = name.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
        style={{ background: "linear-gradient(135deg, var(--iw-blue), var(--iw-blue-light))" }}>
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Greeting bubble */}
        <div className="rounded-2xl rounded-tl-sm px-5 py-4 space-y-3"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>

          <div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)", fontWeight: 500 }}>
              {salutation}, <span style={{ color: "var(--iw-blue)", fontWeight: 700 }}>{firstName}</span>.
            </p>
          </div>

          {/* Overnight summary */}
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            {g.overnight}
          </p>

          {/* Critical callout */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(220,74,74,0.06)", border: "1px solid rgba(220,74,74,0.18)" }}>
            <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 animate-pulse"
              style={{ background: "var(--iw-danger)" }} />
            <p className="text-xs" style={{ color: "var(--iw-danger)", fontWeight: 600 }}>
              {g.critical}
            </p>
          </div>

          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {g.invite}
          </p>
        </div>

        {/* Quick reply chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {g.chips.map((chip) => (
            <button
              key={chip}
              onClick={() => onChipClick(chip)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
                fontWeight: 500,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--iw-blue)";
                (e.currentTarget as HTMLElement).style.color = "var(--iw-blue)";
                (e.currentTarget as HTMLElement).style.background = "var(--iw-blue-50)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                (e.currentTarget as HTMLElement).style.background = "var(--card)";
              }}
            >
              {chip}
              <ArrowRight className="w-3 h-3 opacity-50" />
            </button>
          ))}
        </div>

        <p className="text-[9px] mt-1.5 ml-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
          Just now · Grounded in Spine + Memory
        </p>
      </div>
    </motion.div>
  );
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MODELS = [
  { id: "iw-pro", label: "IW Pro", provider: "IntegrateWise", description: "Spine-grounded, context-aware", badge: "Recommended" },
  { id: "claude-3-7", label: "Claude 3.7 Sonnet", provider: "Anthropic", description: "Strong reasoning" },
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI", description: "Versatile general-purpose" },
  { id: "gemini-2-flash", label: "Gemini 2.0 Flash", provider: "Google", description: "Fast, multimodal" },
];

const CONVERSATIONS: Conversation[] = [
  { id: "c1", title: "APAC Renewal Risk Analysis", preview: "What's the renewal risk profile...", time: "Just now", pinned: true, ctx: "CTX_SALES" },
  { id: "c2", title: "Q2 Pipeline Health Check", preview: "Pipeline coverage is at 3.1x target...", time: "2h ago", ctx: "CTX_SALES" },
  { id: "c3", title: "FinanceFlow Recovery Plan", preview: "Three P1 tickets unresolved...", time: "Yesterday", ctx: "CTX_CS" },
  { id: "c4", title: "HubSpot Schema Drift Review", preview: "Two fields changed upstream...", time: "Yesterday", ctx: "CTX_SALES" },
  { id: "c5", title: "Q1 Retrospective Insights", preview: "NRR came in at 112%...", time: "3 days ago", ctx: "CTX_BIZOPS" },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m1", role: "user",
    content: "What's the renewal risk profile for our APAC accounts going into Q3?",
    timestamp: "10:42 AM",
  },
  {
    id: "m2", role: "assistant",
    content: "APAC renewal risk snapshot",
    timestamp: "10:42 AM",
    evidence: [
      { source: "Salesforce", type: "crm", detail: "4 accounts" },
      { source: "Zendesk", type: "support", detail: "3 open P1s" },
      { source: "Stripe", type: "billing", detail: "payment signals" },
      { source: "Memory", type: "memory", detail: "6 refs" },
    ],
    blocks: [
      { t: "p", text: "Pulled renewal data from Spine across your APAC segment. One account needs immediate attention." },
      { t: "callout", variant: "critical", emoji: "🚨", title: "Critical — act within 24h", text: "FinanceFlow Solutions renewal in 29 days. Champion David Park silent for 12 days. Risk score 92/100." },
      { t: "card", emoji: "💰", title: "FinanceFlow Solutions", subtitle: "Mid-Market · APAC", id: "ACC-2041", fields: [
        { k: "ARR", v: "$84K" },
        { k: "Renewal", v: "29 days", color: "var(--iw-danger)" },
        { k: "Health", v: "⚠️ Critical" },
        { k: "Risk factor", v: "Silent champion + 3 P1s" },
      ]},
      { t: "card", emoji: "🏢", title: "TechServe Asia", subtitle: "Enterprise · APAC", id: "ACC-1872", fields: [
        { k: "ARR", v: "$62K" },
        { k: "Renewal", v: "47 days", color: "var(--iw-warning)" },
        { k: "Health", v: "🟡 Moderate" },
        { k: "Risk factor", v: "Low adoption Q2" },
      ]},
      { t: "callout", variant: "success", emoji: "🟢", text: "CloudBridge APAC and DataSynth Ltd are healthy — expanding usage, NPS positive, no immediate action needed." },
    ],
    memoryRefs: ["APAC renewal playbook v3", "Q2 health baseline"],
    actions: [
      { label: "View All Accounts", type: "view" },
      { label: "Create HITL Proposal", type: "approve" },
    ],
  },
  {
    id: "m3", role: "user",
    content: "Focus on FinanceFlow — what specific actions should I take in the next 48 hours?",
    timestamp: "10:43 AM",
  },
  {
    id: "m4", role: "assistant",
    content: "FinanceFlow 48h action plan",
    timestamp: "10:43 AM",
    evidence: [
      { source: "Salesforce", type: "crm", detail: "Account record" },
      { source: "Zendesk", type: "support", detail: "P1 #4821" },
      { source: "Slack", type: "comms", detail: "Last DM May 8" },
      { source: "Stripe", type: "billing", detail: "2 failed payments" },
      { source: "Memory", type: "memory", detail: "Playbook v3" },
    ],
    entity: {
      name: "FinanceFlow Solutions",
      type: "Account",
      status: "critical",
      metrics: [
        { label: "ARR", value: "$84K" },
        { label: "Renewal", value: "29 days" },
        { label: "Risk", value: "92/100" },
        { label: "Champion", value: "Silent 12d" },
      ],
    },
    blocks: [
      { t: "p", text: "Based on the FinanceFlow Spine record, engagement log, and renewal playbook — here's the prioritised action plan." },
      { t: "sep", label: "🔴 Today — Immediate" },
      { t: "list", items: [
        { text: "Executive ping — reach out to David Park (VP Product) directly. Last signal: Slack DM May 8 re API latency.", id: "TASK-001", link: "slack://dm/david.park" },
        { text: "Escalate P1 #4821 — 'bulk export timeout' blocking weekly reporting. Engineering queued, push to priority lane.", id: "ZD-4821", link: "#" },
      ]},
      { t: "callout", variant: "warning", emoji: "⏰", text: "Window is closing — 29 days to renewal with no executive contact. Every day of silence increases churn probability by ~4%." },
      { t: "sep", label: "🟡 Tomorrow" },
      { t: "list", items: [
        { text: "Schedule EBR — emergency business review before renewal. Frame around Q3 roadmap alignment, not the contract.", id: "TASK-002" },
        { text: "Offer credit — 2 failed Stripe payments ($7K) attributable to our billing bug. Proactively offer 30-day extension.", id: "TASK-003" },
      ]},
      { t: "callout", variant: "memory", emoji: "🧠", text: "This action sequence matches Renewal Recovery Motion v2 from your playbook. I've referenced it in the proposal." },
      { t: "refs", label: "References used", items: [
        { text: "Renewal Playbook v3", id: "KB-0091", source: "Knowledge" },
        { text: "Champion silence threshold (10d)", id: "MEM-0412", source: "Memory" },
        { text: "FinanceFlow EBR history (Q1 2026)", id: "MEM-0309", source: "Memory" },
        { text: "P1 ticket #4821", id: "ZD-4821", source: "Zendesk" },
      ]},
    ],
    memoryRefs: ["Renewal Playbook v3", "Champion silence threshold 10d", "FinanceFlow EBR history"],
    memoryCommit: "48h action sequence committed to org memory",
    actions: [
      { label: "Approve & Log to Memory", type: "approve" },
      { label: "Create Tasks in Jira", type: "link" },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModelPill({ model, onSelect }: { model: typeof MODELS[0]; onSelect: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-lg text-xs font-medium transition-all" style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
      >
        <Brain className="w-3 h-3" style={{ color: "var(--iw-blue)" }} />
        {model.label}
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full mt-1.5 left-0 z-50 rounded-xl shadow-xl w-72 overflow-hidden py-1" style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { onSelect(); setOpen(false); }}
                  className="w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors" style={{ background: m.id === model.id ? "var(--secondary)" : "transparent" }}
                  onMouseEnter={e => { if (m.id !== model.id) (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
                  onMouseLeave={e => { if (m.id !== model.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--iw-blue-50)" }}>
                    <Brain className="w-3.5 h-3.5" style={{ color: "var(--iw-blue)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">{m.label}</span>
                      {m.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(61,139,110,0.1)", color: "var(--iw-success)" }}>{m.badge}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">{m.provider} — {m.description}</div>
                  </div>
                  {m.id === model.id && <Check className="w-3.5 h-3.5 text-[var(--iw-blue)] mt-1 shrink-0" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const EVIDENCE_COLORS: Record<EvidenceSource["type"], { bg: string; text: string; border: string }> = {
  crm:       { bg: "rgba(66,86,171,0.08)",  text: "var(--iw-blue)",    border: "rgba(66,86,171,0.2)" },
  support:   { bg: "rgba(212,103,128,0.08)", text: "var(--iw-pink)",    border: "rgba(212,103,128,0.2)" },
  memory:    { bg: "rgba(123,94,167,0.08)",  text: "var(--iw-purple)",  border: "rgba(123,94,167,0.2)" },
  spine:     { bg: "rgba(61,139,110,0.08)",  text: "var(--iw-success)", border: "rgba(61,139,110,0.2)" },
  billing:   { bg: "rgba(212,136,62,0.08)",  text: "var(--iw-warning)", border: "rgba(212,136,62,0.2)" },
  comms:     { bg: "rgba(66,86,171,0.06)",   text: "var(--iw-blue)",    border: "rgba(66,86,171,0.15)" },
  analytics: { bg: "rgba(61,139,110,0.06)",  text: "var(--iw-success)", border: "rgba(61,139,110,0.15)" },
};

const ENTITY_STATUS_COLOR = {
  critical: "var(--iw-danger)",
  warning:  "var(--iw-warning)",
  healthy:  "var(--iw-success)",
  info:     "var(--iw-blue)",
};

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── User bubble ──
  if (msg.role === "user") {
    return (
      <div className="flex justify-end gap-2 group">
        <div className="max-w-[70%]">
          <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed"
            style={{ background: "var(--iw-blue)", color: "white" }}>
            {msg.content}
          </div>
          <div className="text-[10px] text-right mt-1" style={{ color: "var(--muted-foreground)" }}>{msg.timestamp}</div>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 mt-0.5"
          style={{ background: "var(--iw-pink)", fontWeight: 700 }}>A</div>
      </div>
    );
  }

  // ── Assistant answer card ──
  return (
    <div className="flex gap-2.5 group">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm"
        style={{ background: "linear-gradient(135deg, var(--iw-blue), var(--iw-blue-light))" }}>
        <Sparkles className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Main answer card */}
        <div className="rounded-2xl rounded-tl-sm overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--card)" }}>

          {/* Entity snapshot — shown when an entity is referenced */}
          {msg.entity && (
            <div className="px-4 py-3 border-b flex items-center gap-3"
              style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                style={{ background: ENTITY_STATUS_COLOR[msg.entity.status] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{msg.entity.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                    {msg.entity.type}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold capitalize"
                    style={{ color: ENTITY_STATUS_COLOR[msg.entity.status], background: `${ENTITY_STATUS_COLOR[msg.entity.status]}15` }}>
                    {msg.entity.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {msg.entity.metrics.map((m, i) => (
                  <div key={i} className="text-right">
                    <div className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{m.value}</div>
                    <div className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rich block content */}
          <div className="px-4 pt-3 pb-2 space-y-2.5">
            {(msg.blocks ?? [{ t: "p" as const, text: msg.content }]).map((block, bi) => {
              if (block.t === "p") {
                return (
                  <p key={bi} className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {block.text}
                  </p>
                );
              }

              if (block.t === "sep") {
                return (
                  <div key={bi} className="flex items-center gap-2 py-1">
                    <span className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{block.label}</span>
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  </div>
                );
              }

              if (block.t === "callout") {
                const styles = {
                  critical: { bg: "rgba(220,74,74,0.07)", border: "rgba(220,74,74,0.25)", text: "var(--iw-danger)" },
                  warning:  { bg: "rgba(212,136,62,0.07)", border: "rgba(212,136,62,0.25)", text: "var(--iw-warning)" },
                  info:     { bg: "rgba(66,86,171,0.07)", border: "rgba(66,86,171,0.2)", text: "var(--iw-blue)" },
                  success:  { bg: "rgba(61,139,110,0.07)", border: "rgba(61,139,110,0.2)", text: "var(--iw-success)" },
                  memory:   { bg: "rgba(123,94,167,0.07)", border: "rgba(123,94,167,0.2)", text: "var(--iw-purple)" },
                }[block.variant];
                return (
                  <div key={bi} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                    style={{ background: styles.bg, border: `1px solid ${styles.border}` }}>
                    <span className="text-base leading-none shrink-0 mt-0.5">{block.emoji}</span>
                    <div className="flex-1 min-w-0">
                      {block.title && (
                        <p className="text-xs mb-0.5" style={{ fontWeight: 700, color: styles.text }}>{block.title}</p>
                      )}
                      <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{block.text}</p>
                    </div>
                  </div>
                );
              }

              if (block.t === "card") {
                return (
                  <div key={bi} className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5"
                      style={{ borderBottom: "1px solid var(--border)", background: "var(--secondary)" }}>
                      {block.emoji && <span className="text-base leading-none">{block.emoji}</span>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{block.title}</span>
                          {block.id && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono cursor-pointer"
                              style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                              {block.id}
                            </span>
                          )}
                        </div>
                        {block.subtitle && (
                          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{block.subtitle}</p>
                        )}
                      </div>
                    </div>
                    {block.fields && (
                      <div className="grid grid-cols-2 gap-0">
                        {block.fields.map((f, fi) => (
                          <div key={fi} className="px-3 py-2"
                            style={{ borderBottom: fi < block.fields!.length - 2 ? "1px solid var(--border)" : "none",
                                     borderRight: fi % 2 === 0 ? "1px solid var(--border)" : "none" }}>
                            <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{f.k}</p>
                            <p className="text-xs mt-0.5" style={{ fontWeight: 600, color: f.color || "var(--foreground)" }}>{f.v}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              if (block.t === "list") {
                return (
                  <div key={bi} className="space-y-1.5">
                    {block.label && (
                      <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{block.label}</p>
                    )}
                    {block.items.map((item, ii) => (
                      <div key={ii} className="flex items-start gap-2.5 px-3 py-2 rounded-xl"
                        style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                        <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: item.done ? "var(--iw-success)" : "var(--iw-blue-50)", border: `1px solid ${item.done ? "var(--iw-success)" : "var(--border)"}` }}>
                          {item.done
                            ? <Check className="w-2.5 h-2.5 text-white" />
                            : <span className="text-[8px]" style={{ color: "var(--iw-blue)", fontWeight: 700 }}>{ii + 1}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-snug" style={{ color: "var(--foreground)" }}>{item.text}</p>
                        </div>
                        {item.id && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 cursor-pointer transition-all"
                            style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontWeight: 600 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--iw-blue)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
                            {item.id}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }

              if (block.t === "refs") {
                return (
                  <div key={bi} className="pt-1">
                    <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
                      {block.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {block.items.map((ref, ri) => (
                        <span key={ri}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg cursor-pointer transition-all"
                          style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 500 }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--iw-blue)";
                            (e.currentTarget as HTMLElement).style.color = "var(--iw-blue)";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                            (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
                          }}>
                          {ref.text}
                          {ref.id && (
                            <span className="text-[8px] font-mono opacity-60">{ref.id}</span>
                          )}
                          {ref.source && (
                            <span className="text-[8px] opacity-50">· {ref.source}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })}

            {/* Legacy table fallback */}
            {msg.table && (
              <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: "var(--secondary)" }}>
                      {msg.table.headers.map(h => (
                        <th key={h} className="text-left py-2 px-3"
                          style={{ fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {msg.table.rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: i < msg.table!.rows.length - 1 ? "1px solid var(--border)" : "none" }}>
                        {row.map((cell, j) => (
                          <td key={j} className="py-2 px-3" style={{ color: "var(--foreground)" }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Evidence chain */}
          {msg.evidence && (
            <div className="px-4 py-2.5 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setShowEvidence(v => !v)}
                className="flex items-center gap-2 w-full text-left"
              >
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
                  Evidence
                </span>
                <div className="flex items-center gap-1 flex-1 flex-wrap">
                  {msg.evidence.map((ev, i) => {
                    const c = EVIDENCE_COLORS[ev.type];
                    return (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                        {ev.source}{ev.detail ? ` · ${ev.detail}` : ""}
                      </span>
                    );
                  })}
                </div>
                <ChevronDown className="w-3 h-3 shrink-0 transition-transform"
                  style={{ color: "var(--muted-foreground)", transform: showEvidence ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>

              {/* Expanded evidence + memory refs */}
              {showEvidence && msg.memoryRefs && (
                <div className="mt-2 pt-2 border-t space-y-1.5" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
                    Memory Referenced
                  </p>
                  {msg.memoryRefs.map((ref, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--iw-purple)" }} />
                      <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{ref}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {msg.actions && (
            <div className="px-4 pb-3 pt-1 flex flex-wrap gap-2">
              {msg.actions.map(action => (
                <button key={action.label}
                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    fontWeight: 600,
                    background: action.type === "approve" ? "rgba(61,139,110,0.1)" : "var(--iw-blue-50)",
                    color: action.type === "approve" ? "var(--iw-success)" : "var(--iw-blue)",
                    border: `1px solid ${action.type === "approve" ? "rgba(61,139,110,0.2)" : "rgba(66,86,171,0.2)"}`,
                  }}>
                  {action.type === "approve" ? <Check className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Memory commit footer */}
          {msg.memoryCommit && (
            <div className="px-4 py-2 border-t flex items-center gap-2"
              style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--iw-success)" }} />
              <span className="text-[9px]" style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>
                {msg.memoryCommit}
              </span>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleCopy} className="p-1 rounded transition-colors"
            style={{ color: "var(--muted-foreground)" }}>
            {copied ? <Check className="w-3 h-3" style={{ color: "var(--iw-success)" }} /> : <Copy className="w-3 h-3" />}
          </button>
          <button className="p-1 rounded transition-colors" style={{ color: "var(--muted-foreground)" }}>
            <ThumbsUp className="w-3 h-3" />
          </button>
          <button className="p-1 rounded transition-colors" style={{ color: "var(--muted-foreground)" }}>
            <ThumbsDown className="w-3 h-3" />
          </button>
          <button className="p-1 rounded transition-colors" style={{ color: "var(--muted-foreground)" }}>
            <RefreshCw className="w-3 h-3" />
          </button>
          <span className="text-[9px] ml-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>{msg.timestamp}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TwinChat({ activeCtx }: { activeCtx: CTXEnum }) {
  const spine = useSpine();
  const userName = spine.userName || "there";
  const [activeConv, setActiveConv] = useState<string>("c1");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModel, setActiveModel] = useState(MODELS[0]);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceTranscript("");
  }, []);

  const startVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setVoiceTranscript(interim);
      if (final) setInput(prev => (prev + " " + final).trim());
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceTranscript("");
    };

    recognition.start();
    setIsListening(true);
  }, []);

  const toggleVoice = () => isListening ? stopVoice() : startVoice();

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: `m${Date.now()}`, role: "user", content: input.trim(), timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    const aiMsg: Message = {
      id: `m${Date.now() + 1}`, role: "assistant",
      content: "Based on the current Spine data and memory context, I'm analyzing your query. The relevant entities have been cross-referenced with your goal framework (DG_SALES_001: Pipeline Health) and here's what I found…\n\nThis insight has been logged to memory for continuity across future sessions.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actions: [{ label: "Save to Memory", type: "approve" }],
    };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleChipClick = (text: string) => {
    setInput(text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const filteredConvs = CONVERSATIONS.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-white">
      {/* Conversation List */}
      <div className="w-52 shrink-0 flex flex-col border-r" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
        {/* Header */}
        <div className="p-3 border-b" style={{ borderColor: "var(--border)" }}>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-colors shadow-sm" style={{ background: "var(--iw-blue)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--iw-blue-dark)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--iw-blue)"; }}>
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-2.5 py-2 border-b border-[var(--border)]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-white border border-[var(--border)] rounded-lg pl-7 pr-3 py-1.5 text-xs outline-none focus:border-[var(--iw-blue)]/40 transition-colors"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {filteredConvs.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConv(conv.id)}
              className={`w-full text-left px-2.5 py-2 rounded-xl transition-all ${
                activeConv === conv.id
                  ? "bg-[var(--iw-blue)]/8 border border-[var(--iw-blue)]/15"
                  : "hover:bg-white hover:shadow-sm border border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-1.5 mb-0.5">
                <span className={`text-[11px] font-semibold leading-tight ${activeConv === conv.id ? "text-[var(--iw-blue)]" : "text-slate-700"} line-clamp-1`}>
                  {conv.pinned && <Star className="w-2.5 h-2.5 inline mr-1 text-[#D46780] fill-[#D46780]" />}
                  {conv.title}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 line-clamp-1">{conv.preview}</div>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-2.5 h-2.5 text-slate-300" />
                <span className="text-[9px] text-slate-300">{conv.time}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Top Bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-white shrink-0 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#3F5185] to-[#4256AB] flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Twin</span>
                {isListening ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                    style={{ background: "rgba(220,74,74,0.12)", color: "var(--iw-danger)" }}>
                    <Radio className="w-2.5 h-2.5" /> LIVE
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--iw-blue-50)", color: "var(--iw-blue)" }}>
                    AI Agent
                  </span>
                )}
              </div>
              <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>Model-agnostic</p>
            </div>
          </div>

          {/* Context chips matching screenshot */}
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { label: "Org Memory", icon: BookOpen, color: "var(--iw-blue)" },
              { label: "Proposals", icon: FileCheck, color: "var(--iw-pink)" },
              { label: "Workbench", icon: Layers, color: "var(--iw-purple)" },
            ].map(chip => (
              <div key={chip.label}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                <chip.icon className="w-3 h-3" style={{ color: chip.color }} />
                {chip.label}
              </div>
            ))}
            <ModelPill model={activeModel} onSelect={() => {}} />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Memory</span>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--iw-success)" }} />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Twin greeting — always first */}
          <TwinGreeting
            name={userName}
            ctx={activeCtx}
            onChipClick={handleChipClick}
          />

          {/* Divider between greeting and conversation history */}
          {messages.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-[9px] uppercase tracking-widest px-2"
                style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
                Conversation
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3F5185] to-[#4256AB] flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="bg-[var(--secondary)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-[var(--iw-blue)] animate-spin" />
                  <span className="text-xs text-slate-400">Querying Spine and grounding response…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 pb-4 pt-2 shrink-0 border-t bg-white" style={{ borderColor: "var(--border)" }}>

          {/* Voice active state */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: "rgba(220,74,74,0.06)", border: "1px solid rgba(220,74,74,0.2)" }}
              >
                {/* Waveform bars */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 rounded-full"
                      style={{ background: "var(--iw-danger)" }}
                      animate={{ scaleY: [h, 1, h * 0.6, 1, h] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                      initial={{ height: 16 * h }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold" style={{ color: "var(--iw-danger)" }}>
                    Listening… speak now
                  </p>
                  {voiceTranscript && (
                    <p className="text-xs mt-0.5 italic" style={{ color: "var(--muted-foreground)" }}>
                      "{voiceTranscript}"
                    </p>
                  )}
                </div>
                <button onClick={stopVoice}
                  className="text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all"
                  style={{ background: "rgba(220,74,74,0.15)", color: "var(--iw-danger)" }}>
                  Stop
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative rounded-2xl overflow-hidden transition-all"
            style={{
              background: "var(--input-background)",
              border: isListening ? "1.5px solid var(--iw-danger)" : "1px solid var(--border)",
              boxShadow: isListening ? "0 0 0 3px rgba(220,74,74,0.08)" : "none",
            }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Speaking… or type to override" : "Ask anything — grounded in your Spine data and memory…"}
              rows={3}
              className="w-full bg-transparent px-4 pt-3 pb-1 text-sm outline-none resize-none"
              style={{ color: "var(--foreground)" }}
            />
            <div className="flex items-center justify-between px-3 pb-2.5">
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--muted-foreground)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--card)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors"
                  style={{ color: "var(--muted-foreground)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--card)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <Zap className="w-3 h-3" />
                  Tools
                </button>

                {/* Mic button */}
                <button
                  onClick={toggleVoice}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={{
                    background: isListening ? "rgba(220,74,74,0.12)" : "transparent",
                    color: isListening ? "var(--iw-danger)" : "var(--muted-foreground)",
                    border: isListening ? "1px solid rgba(220,74,74,0.3)" : "1px solid transparent",
                  }}>
                  {isListening
                    ? <><MicOff className="w-3.5 h-3.5" /> Stop</>
                    : <><Mic className="w-3.5 h-3.5" /> Voice</>
                  }
                </button>
              </div>

              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-all"
                style={{
                  background: input.trim() && !loading ? "var(--iw-blue)" : "var(--muted)",
                  color: "white",
                  cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                  opacity: !input.trim() || loading ? 0.5 : 1,
                }}>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-[9px] text-center mt-2" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
            Responses grounded in Spine · Memory compounds across sessions
          </p>
        </div>
      </div>
    </div>
  );
}
