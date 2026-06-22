import { useState } from "react";
import { Play, Pause, Plus, Search, ChevronRight, Clock, CheckCircle2, AlertTriangle,
  Zap, Bot, Database, Mail, MessageSquare, FileText, GitBranch, Settings,
  MoreHorizontal, Edit2, Trash2, Copy, RefreshCw, Activity, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkflowStatus = "active" | "paused" | "draft" | "error";
type TriggerType = "schedule" | "signal" | "manual" | "webhook";
type StepType = "condition" | "action" | "agent" | "memory" | "notify" | "wait";

interface WorkflowStep {
  id: string;
  type: StepType;
  label: string;
  config: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: { type: TriggerType; label: string };
  steps: WorkflowStep[];
  lastRun?: string;
  runCount: number;
  successRate: number;
  tags: string[];
  ctx: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const WORKFLOWS: Workflow[] = [
  {
    id: "wf1",
    name: "Renewal Risk Escalation",
    description: "When a renewal risk score exceeds 80, notify the account owner and create a HITL proposal for executive outreach.",
    status: "active",
    trigger: { type: "signal", label: "Signal · renewal_risk_score > 80" },
    steps: [
      { id: "s1", type: "condition", label: "Check risk score", config: "renewal_risk_score > 80" },
      { id: "s2", type: "agent",     label: "Run Renewal Watchdog", config: "agent: renewal-watchdog" },
      { id: "s3", type: "notify",    label: "Slack alert to account owner", config: "channel: #cs-alerts" },
      { id: "s4", type: "action",    label: "Create HITL proposal", config: "governance: manual" },
      { id: "s5", type: "memory",    label: "Log to agent memory", config: "type: stable_fact" },
    ],
    lastRun: "10 min ago",
    runCount: 47,
    successRate: 96,
    tags: ["renewal", "cs", "hitl"],
    ctx: "CTX_CS",
  },
  {
    id: "wf2",
    name: "CRM Sync & Reconcile",
    description: "Detect lifecycle mismatches between Salesforce and HubSpot. Propose corrections through governance.",
    status: "active",
    trigger: { type: "schedule", label: "Schedule · every 2h" },
    steps: [
      { id: "s1", type: "agent",     label: "Run CRM Reconciler", config: "agent: crm-reconciler" },
      { id: "s2", type: "condition", label: "Mismatch detected?", config: "if mismatch count > 0" },
      { id: "s3", type: "action",    label: "Propose corrections", config: "governance: auto-low-risk" },
      { id: "s4", type: "memory",    label: "Update reconciliation log", config: "type: decision" },
    ],
    lastRun: "2h ago",
    runCount: 312,
    successRate: 99,
    tags: ["crm", "reconcile", "salesforce", "hubspot"],
    ctx: "CTX_SALES",
  },
  {
    id: "wf3",
    name: "Pipeline Scout Daily Brief",
    description: "Every morning, analyse pipeline health and surface insights to L2 Cognitive Overlay.",
    status: "active",
    trigger: { type: "schedule", label: "Schedule · daily 8:00 AM" },
    steps: [
      { id: "s1", type: "agent",  label: "Run Pipeline Scout", config: "agent: pipeline-scout" },
      { id: "s2", type: "action", label: "Surface to L2 Overlay", config: "layer: L2 · type: insight" },
      { id: "s3", type: "notify", label: "Email digest to team", config: "template: pipeline-brief" },
    ],
    lastRun: "8h ago",
    runCount: 89,
    successRate: 100,
    tags: ["pipeline", "brief", "sales"],
    ctx: "CTX_SALES",
  },
  {
    id: "wf4",
    name: "New Connector Onboard",
    description: "When a new integration is connected, trigger the 8-stage normalisation pipeline and seed domain data.",
    status: "paused",
    trigger: { type: "webhook", label: "Webhook · connector.connected" },
    steps: [
      { id: "s1", type: "action",    label: "Trigger Loader (S2)", config: "stage: load" },
      { id: "s2", type: "action",    label: "Run Normalizer (S3)", config: "stage: normalize" },
      { id: "s3", type: "action",    label: "Entity Resolution (S4)", config: "stage: dedupe" },
      { id: "s4", type: "action",    label: "Spine Write (S5)", config: "stage: spine-write" },
      { id: "s5", type: "memory",    label: "Seed domain memory", config: "type: org_memory" },
      { id: "s6", type: "notify",    label: "Notify workspace owner", config: "channel: in-app" },
    ],
    lastRun: "3 days ago",
    runCount: 12,
    successRate: 83,
    tags: ["onboard", "connector", "spine"],
    ctx: "CTX_BIZOPS",
  },
  {
    id: "wf5",
    name: "Champion Silence Alert",
    description: "If a key contact goes silent for 10+ days near renewal, auto-draft recovery outreach for approval.",
    status: "draft",
    trigger: { type: "signal", label: "Signal · champion_last_touch_days > 10" },
    steps: [
      { id: "s1", type: "condition", label: "Days since last touch > 10", config: "AND renewal_days < 60" },
      { id: "s2", type: "agent",     label: "Draft recovery email", config: "model: iw-pro · tone: warm" },
      { id: "s3", type: "action",    label: "Queue for human approval", config: "governance: manual" },
    ],
    lastRun: undefined,
    runCount: 0,
    successRate: 0,
    tags: ["champion", "silence", "outreach"],
    ctx: "CTX_CS",
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<WorkflowStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:  { label: "Active",  color: "text-[#10B981]", bg: "bg-[#10B981]/10", dot: "bg-[#10B981]" },
  paused:  { label: "Paused",  color: "text-amber-600", bg: "bg-amber-50",     dot: "bg-amber-400" },
  draft:   { label: "Draft",   color: "text-slate-500", bg: "bg-slate-100",    dot: "bg-slate-300" },
  error:   { label: "Error",   color: "text-red-600",   bg: "bg-red-50",       dot: "bg-red-500" },
};

const TRIGGER_ICONS: Record<TriggerType, any> = {
  schedule: Clock,
  signal:   Zap,
  manual:   Play,
  webhook:  GitBranch,
};

const STEP_ICONS: Record<StepType, any> = {
  condition: GitBranch,
  action:    Zap,
  agent:     Bot,
  memory:    Database,
  notify:    MessageSquare,
  wait:      Clock,
};

const STEP_COLORS: Record<StepType, string> = {
  condition: "bg-amber-50 text-amber-600 border-amber-200",
  action:    "bg-[#3F5185]/8 text-[#3F5185] border-[#3F5185]/20",
  agent:     "bg-[#D46780]/8 text-[#D46780] border-[#D46780]/20",
  memory:    "bg-[#10B981]/8 text-[#10B981] border-[#10B981]/20",
  notify:    "bg-purple-50 text-purple-600 border-purple-200",
  wait:      "bg-slate-50 text-slate-500 border-slate-200",
};

// ─── Workflow Detail ───────────────────────────────────────────────────────────

function WorkflowDetail({ wf, onBack, onToggle }: { wf: Workflow; onBack: () => void; onToggle: () => void }) {
  const st = STATUS_CONFIG[wf.status];
  const TIcon = TRIGGER_ICONS[wf.trigger.type];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2 shrink-0">
        <button onClick={onBack} className="text-[#3F5185] text-xs font-semibold hover:underline">← Back</button>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-semibold text-slate-600 truncate">{wf.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-bold text-slate-800">{wf.name}</h2>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{wf.description}</p>
          </div>
          <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              wf.status === "active"
                ? "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                : "bg-[#10B981] text-white hover:bg-[#059669]"
            }`}
          >
            {wf.status === "active" ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Activate</>}
          </button>
        </div>

        {/* Trigger */}
        <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0">
            <TIcon className="w-3.5 h-3.5 text-[#3F5185]" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Trigger</p>
            <p className="text-xs font-semibold text-slate-700">{wf.trigger.label}</p>
          </div>
        </div>

        {/* Steps */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Steps ({wf.steps.length})</p>
          <div className="space-y-1.5 relative">
            <div className="absolute left-[13px] top-3 bottom-3 w-px bg-[#E5E7EB]" />
            {wf.steps.map((step, i) => {
              const SIcon = STEP_ICONS[step.type];
              return (
                <div key={step.id} className="flex items-start gap-2.5 relative">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 z-10 bg-white ${STEP_COLORS[step.type]}`}>
                    <SIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 py-1">
                    <p className="text-xs font-semibold text-slate-700">{step.label}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{step.config}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total runs", value: wf.runCount },
            { label: "Success rate", value: wf.runCount > 0 ? `${wf.successRate}%` : "—" },
            { label: "Last run", value: wf.lastRun || "Never" },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-xl border border-[#E5E7EB] text-center">
              <div className="text-sm font-bold text-slate-800">{s.value}</div>
              <div className="text-[9px] text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {wf.tags.map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[#3F5185]/8 text-[#3F5185] font-mono">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function TwinWorkflows() {
  const [workflows, setWorkflows] = useState(WORKFLOWS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [filter, setFilter] = useState<"all" | WorkflowStatus>("all");

  const toggleStatus = (id: string) => {
    setWorkflows(prev => prev.map(w =>
      w.id === id
        ? { ...w, status: w.status === "active" ? "paused" : "active" }
        : w
    ));
    if (selected?.id === id) {
      setSelected(prev => prev ? { ...prev, status: prev.status === "active" ? "paused" : "active" } : prev);
    }
  };

  if (selected) {
    return (
      <WorkflowDetail
        wf={selected}
        onBack={() => setSelected(null)}
        onToggle={() => toggleStatus(selected.id)}
      />
    );
  }

  const filtered = workflows.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || w.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = { active: workflows.filter(w => w.status === "active").length, paused: workflows.filter(w => w.status === "paused").length, draft: workflows.filter(w => w.status === "draft").length };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Workflows</h2>
            <p className="text-[10px] text-slate-400">{counts.active} active · {counts.paused} paused · {counts.draft} draft</p>
          </div>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#3F5185] text-white text-[11px] font-semibold hover:bg-[#354775] transition-colors">
            <Plus className="w-3 h-3" /> New
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1">
          {(["all", "active", "paused", "draft"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all capitalize ${
                filter === f ? "bg-[#3F5185] text-white" : "bg-[#F8F9FA] text-slate-500 hover:bg-[#E5E7EB]"
              }`}
            >
              {f}
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
            placeholder="Search workflows..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg outline-none focus:border-[#3F5185]/40"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
        {filtered.map(wf => {
          const st = STATUS_CONFIG[wf.status];
          const TIcon = TRIGGER_ICONS[wf.trigger.type];
          return (
            <div key={wf.id} className="px-4 py-3 hover:bg-[#F8F9FA] transition-colors group">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelected(wf)}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-slate-800">{wf.name}</span>
                    <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                      <div className={`w-1 h-1 rounded-full ${st.dot} ${wf.status === "active" ? "animate-pulse" : ""}`} />
                      {st.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-1">{wf.description}</p>
                  <div className="flex items-center gap-3 text-[9px] text-slate-400">
                    <span className="flex items-center gap-1"><TIcon className="w-2.5 h-2.5" />{wf.trigger.label}</span>
                    {wf.lastRun && <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{wf.lastRun}</span>}
                    <span>{wf.steps.length} steps</span>
                    {wf.runCount > 0 && <span className="text-[#10B981] font-semibold">{wf.successRate}% success</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleStatus(wf.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      wf.status === "active"
                        ? "text-amber-500 hover:bg-amber-50"
                        : "text-[#10B981] hover:bg-[#10B981]/10"
                    }`}
                    title={wf.status === "active" ? "Pause" : "Activate"}
                  >
                    {wf.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setSelected(wf)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-[#F8F9FA] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No workflows match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
