import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Layers, UserCircle, Activity, X, Sparkles, ChevronRight,
  AlertTriangle, TrendingUp, Eye, CheckCircle2, Clock, Shield,
  Database, RefreshCw, ArrowRight, Check, PackageCheck, Plug,
  GitMerge, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { type CTXEnum } from "./spine/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type CognitiveTab = "Signals" | "Insights" | "Evidence" | "Approvals" | "Handoff" | "Sync" | "Pulse";

interface CognitiveTabDef {
  id: CognitiveTab;
  label: string;
  icon: any;
  badge?: number;
}

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const TABS: CognitiveTabDef[] = [
  { id: "Signals",   label: "Signals",   icon: Zap,          badge: 3 },
  { id: "Insights",  label: "Insights",  icon: TrendingUp,   badge: 5 },
  { id: "Evidence",  label: "Evidence",  icon: Layers },
  { id: "Approvals", label: "Approvals", icon: UserCircle,   badge: 2 },
  { id: "Handoff",   label: "Handoff",   icon: PackageCheck, badge: 1 },
  { id: "Sync",      label: "Sync",      icon: Plug },
  { id: "Pulse",     label: "Pulse",     icon: Activity },
];

// ─── Tab Content ──────────────────────────────────────────────────────────────

function SignalsView({ ctx }: { ctx: string }) {
  const signals = [
    { severity: "critical", title: "Champion Silent — FinanceFlow Solutions", detail: "David Park (VP Product) has not responded in 12 days. Last touch: Slack DM on 2026-05-08.", source: "Slack + CRM", time: "2 min ago" },
    { severity: "warning",  title: "Schema Drift — Jira Connector",          detail: "Fields `issue_type` and `reporter_email` changed type upstream. Auto-correction queued, pending HITL.", source: "Jira → Spine", time: "8 min ago" },
    { severity: "warning",  title: "Usage Drop — TechServe Asia",             detail: "Feature adoption down 18% in past 30 days across core modules. Renewal 47 days away.", source: "Product Analytics", time: "1h ago" },
    { severity: "info",     title: "APAC Expansion Signal — CloudBridge",     detail: "2 new teams invited internally to the platform. Usage up 34% MoM. Potential for upsell.", source: "Stripe + Product", time: "3h ago" },
  ];

  const sv = {
    critical: { dot: "bg-red-500",   text: "text-red-700",   bg: "bg-red-50 border-red-200",   label: "Critical" },
    warning:  { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Warning" },
    info:     { dot: "bg-[#3F5185]", text: "text-[#3F5185]", bg: "bg-blue-50 border-blue-200",  label: "Info" },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">Real-time signals detected across your connected Spine sources.</p>
        <button className="text-xs text-[#3F5185] font-semibold flex items-center gap-1 hover:underline">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      {signals.map((s, i) => {
        const c = sv[s.severity as keyof typeof sv];
        return (
          <div key={i} className={`p-4 rounded-xl border ${c.bg} flex gap-3`}>
            <div className={`w-2 h-2 rounded-full ${c.dot} mt-1.5 shrink-0 ${s.severity === "critical" ? "animate-pulse" : ""}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase ${c.text}`}>{c.label}</span>
                <span className="text-[10px] text-slate-400">{s.time}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">{s.title}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{s.detail}</p>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">source: {s.source}</p>
            </div>
            <button className="shrink-0 p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function InsightsView() {
  const insights = [
    { type: "Opportunity", title: "CloudBridge Expansion Window", body: "Usage up 34% MoM and 2 new internal teams onboarded. Propose upsell to Enterprise tier before Q3 QBR.", impact: "HIGH", goal: "DG_CS_004" },
    { type: "Risk", title: "Q3 Pipeline Coverage Gap", body: "Current pipeline coverage is 3.1x against a 4x target. 5 deals worth $340K slipped from Q2. Recommend accelerating 3 late-stage deals.", impact: "HIGH", goal: "DG_SALES_002" },
    { type: "Action", title: "FinanceFlow Recovery — 48h Window", body: "Direct exec outreach + P1 escalation + proactive credit offer can recover this $84K renewal. Window closes in 29 days.", impact: "CRITICAL", goal: "DG_CS_003" },
    { type: "Pattern", title: "APAC Accounts Show Higher NPS", body: "APAC accounts average NPS of 68 vs 54 globally. Higher satisfaction correlates with >3 integrations connected.", impact: "MEDIUM", goal: "DG_CS_001" },
    { type: "Trend", title: "Memory Compound Rate", body: "AI has logged 47 stable facts and 12 playbooks this week. Memory compound velocity is increasing as more context is established.", impact: "MEDIUM", goal: "NS_PROD_001" },
  ];

  const typeConfig = {
    Opportunity: { color: "text-[#10B981]", bg: "bg-[#10B981]/8" },
    Risk:        { color: "text-red-600",   bg: "bg-red-50" },
    Action:      { color: "text-[#D46780]", bg: "bg-[#D46780]/8" },
    Pattern:     { color: "text-[#4256AB]", bg: "bg-[#4256AB]/8" },
    Trend:       { color: "text-slate-600", bg: "bg-slate-50" },
  };
  const impactColor = { HIGH: "text-red-600", CRITICAL: "text-red-700 font-bold", MEDIUM: "text-amber-600", LOW: "text-slate-400" };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 mb-4">AI-generated insights grounded in your Spine data and goal framework.</p>
      {insights.map((ins, i) => {
        const tc = typeConfig[ins.type as keyof typeof typeConfig];
        return (
          <div key={i} className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:shadow-sm transition-all cursor-pointer">
            <div className="flex items-start gap-3">
              <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${tc.bg} ${tc.color} shrink-0 mt-0.5`}>{ins.type}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 mb-1">{ins.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{ins.body}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-[10px] font-bold ${impactColor[ins.impact as keyof typeof impactColor]}`}>
                    Impact: {ins.impact}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">→ {ins.goal}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EvidenceView() {
  const evidence = [
    {
      entity: "FinanceFlow Solutions",
      field: "renewal_risk_score",
      value: "92 / 100 (Critical)",
      sources: ["Zendesk: 3 open P1 tickets", "Stripe: 2 payment failures", "Slack: No response 12 days", "Salesforce: Champion silent"],
      confidence: 98,
      computed: "2 min ago",
    },
    {
      entity: "TechServe Asia",
      field: "feature_adoption_rate",
      value: "28% (↓18% MoM)",
      sources: ["Product Analytics: 2/7 modules active", "Salesforce: No QBR scheduled", "Spine: Usage trend vector"],
      confidence: 91,
      computed: "1h ago",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 mb-4">Data provenance and lineage for key computed values in your Spine.</p>
      {evidence.map((ev, i) => (
        <div key={i} className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-[#3F5185]">{ev.entity}</p>
              <p className="text-sm font-semibold text-slate-800 font-mono">{ev.field}</p>
              <p className="text-sm text-[#D46780] font-semibold mt-0.5">{ev.value}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-[#10B981]">{ev.confidence}%</div>
              <div className="text-[9px] text-slate-400">confidence</div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Source Chain</p>
            <div className="space-y-1.5">
              {ev.sources.map((src, j) => (
                <div key={j} className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3F5185]/40 shrink-0" />
                  {src}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]">
            <Database className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-400">Computed {ev.computed} · Spine v3</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ApprovalsView() {
  const [approved, setApproved] = useState<string[]>([]);
  const [denied, setDenied] = useState<string[]>([]);

  const proposals = [
    {
      id: "h1",
      action: "Update HubSpot Lifecycle Stage → Customer for FinanceFlow Solutions",
      reasoning: "Opportunity closed-won in Salesforce 14 days ago. HubSpot still shows 'Opportunity'. Reconciling cross-tool state.",
      confidence: 94,
      goalImpact: 0.82,
      goal: "DG_SALES_001",
      source: "CRM Reconciler Agent",
    },
    {
      id: "h2",
      action: "Send Slack message to @alex — 'FinanceFlow champion silent alert, recommend direct outreach'",
      reasoning: "Champion silence exceeds 10-day threshold per renewal playbook. Renewal Watchdog agent triggered this notification.",
      confidence: 96,
      goalImpact: 0.91,
      goal: "DG_CS_003",
      source: "Renewal Watchdog Agent",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 mb-4">AI action proposals awaiting your review before execution.</p>
      {proposals.map(p => {
        const isApproved = approved.includes(p.id);
        const isDenied   = denied.includes(p.id);
        return (
          <div key={p.id} className={`p-4 rounded-xl border transition-all ${isApproved ? "border-[#10B981]/30 bg-[#10B981]/5" : isDenied ? "border-red-200 bg-red-50 opacity-60" : "border-[#E5E7EB] bg-white"}`}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#D46780]/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-[#D46780]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{p.action}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{p.source}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">{p.reasoning}</p>
            <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-3">
              <span>Confidence: <strong className="text-[#10B981]">{p.confidence}%</strong></span>
              <span>·</span>
              <span>Goal Impact: <strong className="text-[#D46780]">{(p.goalImpact * 100).toFixed(0)}%</strong></span>
              <span>·</span>
              <span className="font-mono text-[#3F5185]">{p.goal}</span>
            </div>
            {!isApproved && !isDenied && (
              <div className="flex gap-2">
                <button onClick={() => setDenied(prev => [...prev, p.id])}
                  className="flex-1 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-slate-500 hover:bg-[#F8F9FA] transition-colors">
                  Deny
                </button>
                <button onClick={() => setApproved(prev => [...prev, p.id])}
                  className="flex-1 py-1.5 rounded-lg bg-[#3F5185] text-white text-xs font-semibold hover:bg-[#354775] transition-colors shadow-sm">
                  Approve & Execute
                </button>
              </div>
            )}
            {isApproved && (
              <div className="flex items-center gap-2 text-[#10B981] text-xs font-semibold">
                <Check className="w-4 h-4" /> Approved — executing now
              </div>
            )}
            {isDenied && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-semibold">
                <X className="w-4 h-4" /> Denied — action blocked
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HandoffView() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const handoffs = [
    {
      id: "hf1",
      action: "Update HubSpot lifecycle → Customer for FinanceFlow Solutions",
      approvedBy: "Alex Rivera",
      approvedAt: "10:44 AM",
      targetSystem: "HubSpot",
      status: "complete",
      package: {
        entity: "FinanceFlow Solutions",
        mutation: "lifecycle_stage: 'opportunity' → 'customer'",
        evidence: "Closed-won in Salesforce 14 days ago",
        governanceStamp: "APR-2041 · Alex Rivera · 10:44 AM",
      },
      outcome: "HubSpot updated successfully. Entity synced back to Spine.",
    },
    {
      id: "hf2",
      action: "Send Slack alert to @alex — FinanceFlow champion silence",
      approvedBy: "Alex Rivera",
      approvedAt: "10:44 AM",
      targetSystem: "Slack",
      status: "complete",
      package: {
        entity: "David Park (FinanceFlow)",
        mutation: "notify: #cs-team · message drafted by Renewal Watchdog",
        evidence: "Champion silent 12 days, renewal 29 days",
        governanceStamp: "APR-2042 · Alex Rivera · 10:44 AM",
      },
      outcome: "Slack message delivered to #cs-team.",
    },
    {
      id: "hf3",
      action: "Create Jira task — resolve P1 #4821 bulk export timeout",
      approvedBy: "Pending",
      approvedAt: "—",
      targetSystem: "Jira",
      status: "pending",
      package: {
        entity: "P1 Ticket #4821",
        mutation: "create: priority=CRITICAL, assignee=engineering-lead",
        evidence: "Unresolved 72h, renewal customer impacted",
        governanceStamp: "Awaiting approval",
      },
      outcome: "—",
    },
  ];

  const statusCfg = {
    complete: { color: "var(--iw-success)", label: "Delivered" },
    pending:  { color: "var(--iw-warning)", label: "Pending" },
    failed:   { color: "var(--iw-danger)",  label: "Failed" },
  };

  const systemEmoji: Record<string, string> = { HubSpot: "🧡", Slack: "💬", Jira: "🔵", Salesforce: "☁️" };

  return (
    <div className="space-y-3">
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        Approved actions handed off to external systems. Each carries a canonical package — context, evidence, governance stamp.
      </p>
      {handoffs.map(hf => {
        const sc = statusCfg[hf.status as keyof typeof statusCfg];
        const isOpen = expanded === hf.id;
        return (
          <div key={hf.id} className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <button onClick={() => setExpanded(isOpen ? null : hf.id)}
              className="w-full text-left px-4 py-3 flex items-start gap-3"
              style={{ background: "var(--secondary)" }}>
              <span className="text-lg shrink-0 leading-none mt-0.5">{systemEmoji[hf.targetSystem] || "🔌"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{hf.action}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  {hf.targetSystem} · {hf.approvedAt}
                </p>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-bold"
                style={{ background: `${sc.color}15`, color: sc.color }}>
                {sc.label}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 py-3 space-y-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Canonical Package</p>
                {[
                  { k: "Entity", v: hf.package.entity },
                  { k: "Mutation", v: hf.package.mutation },
                  { k: "Evidence", v: hf.package.evidence },
                  { k: "Governance stamp", v: hf.package.governanceStamp },
                ].map((row, i) => (
                  <div key={i}>
                    <p className="text-[9px]" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{row.k}</p>
                    <p className="text-xs font-mono" style={{ color: "var(--foreground)" }}>{row.v}</p>
                  </div>
                ))}
                {hf.outcome !== "—" && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--iw-success)" }} />
                    <p className="text-[10px]" style={{ color: "var(--iw-success)", fontWeight: 600 }}>{hf.outcome}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SyncView() {
  const connectors = [
    { name: "Salesforce",  emoji: "☁️", status: "live",    lastSync: "2 min ago",  entities: 12847, version: "v1.2.0", drift: 0 },
    { name: "HubSpot",     emoji: "🧡", status: "live",    lastSync: "5 min ago",  entities: 8432,  version: "v1.1.0", drift: 0 },
    { name: "Zendesk",     emoji: "🎧", status: "live",    lastSync: "8 min ago",  entities: 5672,  version: "v2.0.0", drift: 0 },
    { name: "Stripe",      emoji: "💳", status: "live",    lastSync: "1 min ago",  entities: 2891,  version: "v1.0.0", drift: 0 },
    { name: "Jira",        emoji: "🔵", status: "drift",   lastSync: "Syncing…",   entities: 4123,  version: "v1.1.0", drift: 2 },
    { name: "Gmail",       emoji: "📧", status: "error",   lastSync: "2h ago",     entities: 892,   version: "v1.0.0", drift: 0 },
    { name: "Notion",      emoji: "📝", status: "pending", lastSync: "Not synced", entities: 0,     version: "—", drift: 0 },
  ];

  const statusCfg = {
    live:    { color: "var(--iw-success)", label: "Live",    dot: true  },
    drift:   { color: "var(--iw-warning)", label: "Drift",   dot: false },
    error:   { color: "var(--iw-danger)",  label: "Error",   dot: false },
    pending: { color: "var(--muted-foreground)", label: "Pending", dot: false },
  };

  const liveCount  = connectors.filter(c => c.status === "live").length;
  const driftCount = connectors.filter(c => c.drift > 0).length;
  const errorCount = connectors.filter(c => c.status === "error").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Live", value: liveCount, color: "var(--iw-success)" },
          { label: "Drift", value: driftCount, color: "var(--iw-warning)" },
          { label: "Errors", value: errorCount, color: "var(--iw-danger)" },
        ].map((s, i) => (
          <div key={i} className="p-3 rounded-xl text-center"
            style={{ background: `${s.color}10`, border: `1px solid ${s.color}30` }}>
            <div className="text-xl" style={{ fontWeight: 700, color: s.color }}>{s.value}</div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: s.color, fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Connector list */}
      <div className="space-y-2">
        {connectors.map((c, i) => {
          const sc = statusCfg[c.status as keyof typeof statusCfg];
          return (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--card)", border: `1px solid ${c.drift > 0 ? "rgba(212,136,62,0.3)" : c.status === "error" ? "rgba(220,74,74,0.2)" : "var(--border)"}` }}>
              <span className="text-base leading-none shrink-0">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{c.name}</span>
                  {c.drift > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: "rgba(212,136,62,0.15)", color: "var(--iw-warning)" }}>
                      {c.drift} field{c.drift > 1 ? "s" : ""} drifted
                    </span>
                  )}
                </div>
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                  {c.lastSync} · {c.entities > 0 ? `${c.entities.toLocaleString()} entities` : "—"} · {c.version}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {sc.dot && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sc.color }} />}
                <span className="text-[9px] font-bold" style={{ color: sc.color }}>{sc.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] pt-1" style={{ color: "var(--muted-foreground)" }}>
        <span>Total entities synced: <strong style={{ color: "var(--foreground)" }}>34,857</strong></span>
        <button className="flex items-center gap-1 hover:underline" style={{ color: "var(--iw-blue)" }}>
          <RefreshCw className="w-3 h-3" /> Force resync all
        </button>
      </div>
    </div>
  );
}

function PulseView() {
  const domains = [
    { name: "Sales", score: 91, state: "live",   trend: "+3%", entities: 847, last: "2 min ago" },
    { name: "CS",    score: 87, state: "live",   trend: "+1%", entities: 623, last: "14 min ago" },
    { name: "RevOps",score: 74, state: "seeded", trend: "-2%", entities: 291, last: "1h ago" },
    { name: "BizOps",score: 68, state: "seeded", trend: "0%",  entities: 412, last: "2h ago" },
    { name: "Mktg",  score: 45, state: "adding", trend: "+8%", entities: 134, last: "3h ago" },
  ];

  const stateColor = {
    live:   { text: "text-[#10B981]", bg: "bg-[#10B981]/10" },
    seeded: { text: "text-[#4256AB]", bg: "bg-[#4256AB]/10" },
    adding: { text: "text-amber-600", bg: "bg-amber-50" },
    off:    { text: "text-slate-400", bg: "bg-slate-100" },
  };

  return (
    <div className="space-y-4">
      {/* Overall health */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 text-center">
          <div className="text-[9px] font-bold uppercase tracking-widest text-[#10B981] mb-1">Spine Health</div>
          <div className="text-2xl font-bold text-[#10B981]">98.4%</div>
          <div className="text-[9px] text-slate-400 mt-0.5">Normalization</div>
        </div>
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] text-center">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Entities</div>
          <div className="text-2xl font-bold text-[#3F5185]">2,307</div>
          <div className="text-[9px] text-slate-400 mt-0.5">Across domains</div>
        </div>
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] text-center">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Audit Score</div>
          <div className="text-2xl font-bold text-[#10B981]">A+</div>
          <div className="text-[9px] text-slate-400 mt-0.5">892 policies</div>
        </div>
      </div>

      {/* Domain readiness */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Domain Readiness</p>
        <div className="space-y-2">
          {domains.map(d => {
            const sc = stateColor[d.state as keyof typeof stateColor];
            return (
              <div key={d.name} className="flex items-center gap-4 p-3 rounded-xl border border-[#E5E7EB] bg-white">
                <div className="w-10 text-xs font-bold text-slate-600">{d.name}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{d.score}%</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{d.state}</span>
                  </div>
                  <div className="h-1.5 bg-[#F8F9FA] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${d.score}%`,
                        background: d.score > 85 ? "#10B981" : d.score > 60 ? "#4256AB" : "#D46780",
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-600 font-semibold">{d.entities.toLocaleString()}</div>
                  <div className="text-[9px] text-slate-400">{d.last}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface IntelligenceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeCtx: CTXEnum;
}

export function IntelligenceOverlay({ isOpen, onClose, activeCtx }: IntelligenceOverlayProps) {
  const [activeTab, setActiveTab] = useState<CognitiveTab>("Signals");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-[60] backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 h-[70vh] bg-white border-t border-[#E5E7EB] shadow-2xl z-[70] flex flex-col rounded-t-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E5E7EB] bg-[#F8F9FA] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-[#D46780]/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#D46780]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Cognitive Overlay
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#3F5185]/10 text-[#3F5185]">
                      {activeCtx.replace("CTX_", "")}
                    </span>
                  </h2>
                  <p className="text-[10px] text-slate-400">Signals · Insights · Evidence · Approvals · Pulse  ·  ⌘J to close</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-[#E5E7EB]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0 border-b border-[#E5E7EB] px-4 bg-white shrink-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all relative ${
                    activeTab === tab.id
                      ? "border-[#3F5185] text-[#3F5185]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id ? "bg-[#3F5185] text-white" : "bg-[#F8F9FA] text-slate-500"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {activeTab === "Signals"   && <SignalsView ctx={activeCtx} />}
              {activeTab === "Insights"  && <InsightsView />}
              {activeTab === "Evidence"  && <EvidenceView />}
              {activeTab === "Approvals" && <ApprovalsView />}
              {activeTab === "Handoff"   && <HandoffView />}
              {activeTab === "Sync"      && <SyncView />}
              {activeTab === "Pulse"     && <PulseView />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
