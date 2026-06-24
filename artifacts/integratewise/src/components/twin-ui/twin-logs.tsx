import { useState } from "react";
import { Bot, MessageSquare, Search, ChevronRight, Clock, CheckCircle2, XCircle, AlertTriangle, Activity, RefreshCw, Terminal, Database, Zap, Brain } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LogType = "agent" | "session";
type RunStatus = "success" | "failed" | "running" | "partial";

interface AgentLog {
  id: string;
  agentName: string;
  trigger: string;
  status: RunStatus;
  startedAt: string;
  duration: string;
  steps: { label: string; status: "done" | "failed" | "skipped"; detail?: string }[];
  outcome: string;
  memoryCommits: number;
  proposalsCreated: number;
  ctx: string;
}

interface SessionLog {
  id: string;
  title: string;
  model: string;
  startedAt: string;
  duration: string;
  messageCount: number;
  memoryCommits: number;
  ctx: string;
  summary: string;
  tags: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const AGENT_LOGS: AgentLog[] = [
  {
    id: "al1",
    agentName: "Twin → Renewal Watchdog",
    trigger: "Twin detected: risk_score > 75 AND champion_silence > 10d",
    status: "success",
    startedAt: "Today 10:42 AM",
    duration: "3.2s",
    steps: [
      { label: "Read Spine — renewal_risk index", status: "done", detail: "47 accounts scanned" },
      { label: "Detect threshold breach (>80 risk)", status: "done", detail: "2 accounts flagged" },
      { label: "Cross-ref champion engagement", status: "done", detail: "Slack + CRM checked" },
      { label: "Create HITL proposals", status: "done", detail: "2 proposals → governance queue" },
      { label: "Commit to agent memory", status: "done", detail: "stable_fact logged" },
    ],
    outcome: "2 renewal risk proposals created for FinanceFlow and TechServe Asia",
    memoryCommits: 2,
    proposalsCreated: 2,
    ctx: "CTX_CS",
  },
  {
    id: "al2",
    agentName: "Twin → CRM Reconciler",
    trigger: "Twin detected: lifecycle_stage mismatch in Spine vs HubSpot",
    status: "partial",
    startedAt: "Today 09:18 AM",
    duration: "1.8s",
    steps: [
      { label: "Read Salesforce — opportunity stage", status: "done", detail: "Closed-won confirmed" },
      { label: "Read HubSpot — lifecycle stage", status: "done", detail: "Still shows Opportunity" },
      { label: "Propose lifecycle update", status: "done", detail: "Proposal h1 created" },
      { label: "Auto-apply low-risk fields", status: "skipped", detail: "Governance required" },
    ],
    outcome: "1 lifecycle mismatch proposed for human approval. Auto-apply skipped — governance gate active.",
    memoryCommits: 1,
    proposalsCreated: 1,
    ctx: "CTX_SALES",
  },
  {
    id: "al3",
    agentName: "Twin → Pipeline Scout",
    trigger: "Twin scheduled: daily 08:00 — pipeline health analysis",
    status: "success",
    startedAt: "Today 08:00 AM",
    duration: "5.1s",
    steps: [
      { label: "Fetch open pipeline from Spine", status: "done", detail: "$2.3M total pipeline" },
      { label: "Identify slippage signals", status: "done", detail: "3 deals overdue on stage" },
      { label: "Compute coverage ratio", status: "done", detail: "3.1x vs 4x target" },
      { label: "Generate insight", status: "done", detail: "Insight logged to L2 Overlay" },
      { label: "Commit memory", status: "done", detail: "Pipeline snapshot stored" },
    ],
    outcome: "Pipeline coverage at 3.1x. 3 deals flagged for acceleration. Insight surfaced to L2.",
    memoryCommits: 3,
    proposalsCreated: 0,
    ctx: "CTX_SALES",
  },
  {
    id: "al4",
    agentName: "Twin → Schema Drift Detector",
    trigger: "Twin received: Jira upstream field change webhook",
    status: "failed",
    startedAt: "Yesterday 6:23 PM",
    duration: "0.4s",
    steps: [
      { label: "Receive drift event", status: "done" },
      { label: "Parse changed fields", status: "failed", detail: "Malformed webhook payload" },
    ],
    outcome: "Failed to parse Jira webhook. Retry scheduled in 15 min.",
    memoryCommits: 0,
    proposalsCreated: 0,
    ctx: "CTX_TECH",
  },
];

const SESSION_LOGS: SessionLog[] = [
  {
    id: "sl1",
    title: "APAC Renewal Risk Analysis",
    model: "IW Pro",
    startedAt: "Today 10:42 AM",
    duration: "8 min",
    messageCount: 6,
    memoryCommits: 2,
    ctx: "CTX_SALES",
    summary: "Analysed APAC renewal risk profile. Identified FinanceFlow as critical (92/100 risk). Drafted 48h action plan for exec outreach.",
    tags: ["renewal", "apac", "financeflow"],
  },
  {
    id: "sl2",
    title: "Q2 Pipeline Health Check",
    model: "Claude 3.7",
    startedAt: "Today 09:00 AM",
    duration: "12 min",
    messageCount: 9,
    memoryCommits: 1,
    ctx: "CTX_SALES",
    summary: "Coverage at 3.1x vs 4x target. 5 deals slipped from Q2. Recommendations for 3 late-stage deals surfaced.",
    tags: ["pipeline", "q2", "forecast"],
  },
  {
    id: "sl3",
    title: "FinanceFlow Recovery Plan",
    model: "IW Pro",
    startedAt: "Yesterday 3:15 PM",
    duration: "18 min",
    messageCount: 14,
    memoryCommits: 3,
    ctx: "CTX_CS",
    summary: "Full recovery playbook drafted. P1 escalation, EBR scheduling, credit extension of $7K. Approved and committed to Memory.",
    tags: ["financeflow", "recovery", "playbook"],
  },
  {
    id: "sl4",
    title: "HubSpot Schema Drift Review",
    model: "GPT-4o",
    startedAt: "Yesterday 11:30 AM",
    duration: "6 min",
    messageCount: 4,
    memoryCommits: 0,
    ctx: "CTX_SALES",
    summary: "Reviewed 2 field changes in HubSpot upstream. CRM Reconciler agent queued for correction.",
    tags: ["hubspot", "schema", "drift"],
  },
];

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS = {
  success: { icon: CheckCircle2, color: "text-[#10B981]", bg: "bg-[#10B981]/10", label: "Success" },
  failed:  { icon: XCircle,      color: "text-red-500",   bg: "bg-red-50",        label: "Failed" },
  running: { icon: Activity,     color: "text-[#3F5185]", bg: "bg-[#3F5185]/10",  label: "Running" },
  partial: { icon: AlertTriangle,color: "text-amber-500", bg: "bg-amber-50",      label: "Partial" },
};

// ─── Agent Log Detail ──────────────────────────────────────────────────────────

function AgentLogDetail({ log, onBack }: { log: AgentLog; onBack: () => void }) {
  const s = STATUS[log.status];
  const SIcon = s.icon;
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2 shrink-0">
        <button onClick={onBack} className="text-[#3F5185] text-xs font-semibold hover:underline">← Back</button>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-semibold text-slate-600">{log.agentName}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3F5185]/10 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#3F5185]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-slate-800">{log.agentName}</span>
              <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                <SIcon className="w-3 h-3" /> {s.label}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">{log.trigger} · {log.startedAt} · {log.duration}</p>
          </div>
        </div>

        {/* Steps */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Execution Steps</p>
          <div className="space-y-1.5">
            {log.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  step.status === "done" ? "bg-[#10B981]/15" : step.status === "failed" ? "bg-red-50" : "bg-slate-100"
                }`}>
                  {step.status === "done" && <CheckCircle2 className="w-2.5 h-2.5 text-[#10B981]" />}
                  {step.status === "failed" && <XCircle className="w-2.5 h-2.5 text-red-500" />}
                  {step.status === "skipped" && <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-700">{step.label}</p>
                  {step.detail && <p className="text-[10px] text-slate-400 font-mono">{step.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outcome */}
        <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Outcome</p>
          <p className="text-xs text-slate-700">{log.outcome}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Brain, label: "Memory commits", value: log.memoryCommits },
            { icon: Zap, label: "Proposals", value: log.proposalsCreated },
            { icon: Clock, label: "Duration", value: log.duration },
          ].map((stat, i) => (
            <div key={i} className="p-3 rounded-xl border border-[#E5E7EB] text-center">
              <stat.icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <div className="text-sm font-bold text-slate-800">{stat.value}</div>
              <div className="text-[9px] text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function TwinLogs() {
  const [tab, setTab] = useState<LogType>("agent");
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentLog | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionLog | null>(null);

  if (selectedAgent) return <AgentLogDetail log={selectedAgent} onBack={() => setSelectedAgent(null)} />;

  const filteredAgents = AGENT_LOGS.filter(l =>
    l.agentName.toLowerCase().includes(search.toLowerCase()) ||
    l.outcome.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSessions = SESSION_LOGS.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Logs</h2>
            <p className="text-[10px] text-slate-400">Agent runs · AI chat sessions · Memory commits</p>
          </div>
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-[#3F5185] hover:bg-[#F8F9FA] transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#E5E7EB] -mb-[1px]">
          {([
            { id: "agent" as const, label: "Agent Runs", icon: Bot, count: AGENT_LOGS.length },
            { id: "session" as const, label: "Chat Sessions", icon: MessageSquare, count: SESSION_LOGS.length },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold border-b-2 transition-all ${
                tab === t.id ? "border-[#3F5185] text-[#3F5185]" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? "bg-[#3F5185] text-white" : "bg-[#F8F9FA] text-slate-400"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-[#E5E7EB] shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg outline-none focus:border-[#3F5185]/40"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "agent" && (
          <div className="divide-y divide-[#E5E7EB]">
            {filteredAgents.map(log => {
              const s = STATUS[log.status];
              const SIcon = s.icon;
              return (
                <button
                  key={log.id}
                  onClick={() => setSelectedAgent(log)}
                  className="w-full text-left px-4 py-3 hover:bg-[#F8F9FA] transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${s.bg}`}>
                      <SIcon className={`w-3.5 h-3.5 ${s.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-slate-800">{log.agentName}</span>
                        <span className="text-[9px] text-slate-400">{log.ctx.replace("CTX_", "")}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{log.outcome}</p>
                      <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{log.startedAt}</span>
                        <span>{log.duration}</span>
                        <span>{log.steps.length} steps</span>
                        {log.memoryCommits > 0 && <span className="text-[#10B981] font-semibold">{log.memoryCommits} mem</span>}
                        {log.proposalsCreated > 0 && <span className="text-[#D46780] font-semibold">{log.proposalsCreated} proposals</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 mt-1 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {tab === "session" && (
          <div className="divide-y divide-[#E5E7EB]">
            {filteredSessions.map(log => (
              <button
                key={log.id}
                onClick={() => setSelectedSession(log === selectedSession ? null : log)}
                className="w-full text-left px-4 py-3 hover:bg-[#F8F9FA] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#3F5185]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#3F5185]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-slate-800">{log.title}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F8F9FA] text-slate-400 font-mono">{log.model}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{log.summary}</p>
                    <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{log.startedAt}</span>
                      <span>{log.messageCount} messages</span>
                      <span>{log.duration}</span>
                      {log.memoryCommits > 0 && <span className="text-[#10B981] font-semibold">{log.memoryCommits} mem</span>}
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      {log.tags.map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[#3F5185]/8 text-[#3F5185] font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
