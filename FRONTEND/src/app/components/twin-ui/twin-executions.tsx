import { useState } from "react";
import { Play, CheckCircle2, XCircle, Clock, ChevronRight, Search, Zap, Wrench, DollarSign, Timer } from "lucide-react";

type ExecStatus = "success" | "failed" | "running";

interface Execution {
  id: string;
  workflowName: string;
  startedAt: string;
  endedAt: string;
  duration: string;
  status: ExecStatus;
  toolsUsed: string[];
  cost: string;
  tokenCount: number;
  outcome: string;
  steps: { label: string; status: "done" | "failed" | "skipped"; tool?: string; duration?: string }[];
}

const EXECUTIONS: Execution[] = [
  {
    id: "exec-0842",
    workflowName: "Renewal Risk Escalation",
    startedAt: "Today 10:45 AM",
    endedAt: "Today 10:45 AM",
    duration: "3.2s",
    status: "success",
    toolsUsed: ["HubSpot Search", "Zendesk Query", "Memory Commit"],
    cost: "$0.04",
    tokenCount: 2100,
    outcome: "Risk score 92/100 computed. 2 HITL proposals created. Memory committed.",
    steps: [
      { label: "Read Spine renewal_risk index", status: "done", tool: "Spine Query", duration: "0.3s" },
      { label: "Detect threshold breach (> 75)", status: "done", duration: "0.1s" },
      { label: "Query HubSpot for champion engagement", status: "done", tool: "HubSpot Search", duration: "0.8s" },
      { label: "Query Zendesk for open P1 tickets", status: "done", tool: "Zendesk Query", duration: "0.6s" },
      { label: "Compute risk score", status: "done", duration: "0.2s" },
      { label: "Create HITL proposals", status: "done", duration: "0.4s" },
      { label: "Commit to memory", status: "done", tool: "Memory Commit", duration: "0.5s" },
    ],
  },
  {
    id: "exec-0841",
    workflowName: "CRM Sync & Reconcile",
    startedAt: "Today 08:32 AM",
    endedAt: "Today 08:32 AM",
    duration: "1.8s",
    status: "success",
    toolsUsed: ["Salesforce Search", "HubSpot Update"],
    cost: "$0.02",
    tokenCount: 1400,
    outcome: "4 lifecycle mismatches found. 3 auto-corrected. 1 high-value ($84K) sent to governance.",
    steps: [
      { label: "Fetch Salesforce closed-won deals", status: "done", tool: "Salesforce Search", duration: "0.9s" },
      { label: "Compare HubSpot lifecycle stages", status: "done", duration: "0.2s" },
      { label: "Propose low-risk corrections", status: "done", tool: "HubSpot Update", duration: "0.4s" },
      { label: "Flag high-value for governance", status: "done", duration: "0.2s" },
    ],
  },
  {
    id: "exec-0840",
    workflowName: "Schema Drift Detector",
    startedAt: "Today 06:10 AM",
    endedAt: "Today 06:10 AM",
    duration: "0.4s",
    status: "failed",
    toolsUsed: ["Jira Webhook"],
    cost: "$0.00",
    tokenCount: 0,
    outcome: "Failed: malformed webhook payload from Jira. Retry scheduled in 15 min.",
    steps: [
      { label: "Receive drift event", status: "done", duration: "0.1s" },
      { label: "Parse changed fields", status: "failed", tool: "Jira Webhook", duration: "0.3s" },
    ],
  },
  {
    id: "exec-0839",
    workflowName: "Pipeline Scout Daily Brief",
    startedAt: "Today 08:00 AM",
    endedAt: "Today 08:00 AM",
    duration: "5.1s",
    status: "success",
    toolsUsed: ["Salesforce Search", "Memory Commit", "Insight Engine"],
    cost: "$0.07",
    tokenCount: 4800,
    outcome: "Coverage 3.1x vs 4x. 3 deals stalled. Insight surfaced to L2 overlay.",
    steps: [
      { label: "Fetch open pipeline from Spine", status: "done", tool: "Salesforce Search", duration: "1.2s" },
      { label: "Identify stall signals", status: "done", duration: "0.8s" },
      { label: "Compute coverage ratio", status: "done", duration: "0.3s" },
      { label: "Generate insight", status: "done", tool: "Insight Engine", duration: "1.8s" },
      { label: "Surface to L2 overlay", status: "done", duration: "0.4s" },
      { label: "Commit memory snapshot", status: "done", tool: "Memory Commit", duration: "0.6s" },
    ],
  },
];

const STATUS_CFG = {
  success: { icon: CheckCircle2, color: "var(--iw-success)", label: "Success" },
  failed:  { icon: XCircle,      color: "var(--iw-danger)",  label: "Failed" },
  running: { icon: Clock,        color: "var(--iw-blue)",    label: "Running" },
};

export function TwinExecutions() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Execution | null>(null);

  if (selected) {
    const sc = STATUS_CFG[selected.status];
    const SIcon = sc.icon;
    return (
      <div className="flex flex-col h-full" style={{ background: "var(--card)" }}>
        <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <button onClick={() => setSelected(null)} className="text-xs font-semibold mb-1" style={{ color: "var(--iw-blue)" }}>← Back</button>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-mono" style={{ fontWeight: 700, color: "var(--foreground)" }}>#{selected.id}</h2>
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${sc.color}15`, color: sc.color }}>
              <SIcon className="w-2.5 h-2.5" /> {sc.label}
            </span>
          </div>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{selected.workflowName} · {selected.startedAt} · {selected.duration}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Timer,      label: "Duration",  value: selected.duration,                         color: "var(--iw-blue)" },
              { icon: Wrench,     label: "Tools",     value: String(selected.toolsUsed.length),         color: "var(--iw-warning)" },
              { icon: DollarSign, label: "Cost",      value: selected.cost,                             color: "var(--iw-success)" },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl text-center" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                <s.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: s.color }} />
                <div className="text-sm" style={{ fontWeight: 700, color: s.color }}>{s.value}</div>
                <div className="text-[9px]" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Outcome */}
          <div className="p-3 rounded-xl" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Outcome</p>
            <p className="text-xs" style={{ color: "var(--foreground)" }}>{selected.outcome}</p>
          </div>

          {/* Steps */}
          <div>
            <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Execution Steps</p>
            <div className="space-y-1.5 relative">
              <div className="absolute left-[10px] top-3 bottom-3 w-px" style={{ background: "var(--border)" }} />
              {selected.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 relative">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{ background: step.status === "done" ? "var(--iw-success)" : step.status === "failed" ? "var(--iw-danger)" : "var(--muted)" }}>
                    {step.status === "done" && <CheckCircle2 className="w-3 h-3 text-white" />}
                    {step.status === "failed" && <XCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 py-0.5">
                    <p className="text-xs" style={{ color: "var(--foreground)", fontWeight: 500 }}>{step.label}</p>
                    {step.tool && <span className="text-[9px] font-mono" style={{ color: "var(--muted-foreground)" }}>{step.tool}</span>}
                  </div>
                  {step.duration && <span className="text-[9px] font-mono shrink-0" style={{ color: "var(--muted-foreground)" }}>{step.duration}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="flex flex-wrap gap-1.5">
            {selected.toolsUsed.map((t, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)", fontWeight: 500 }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filtered = EXECUTIONS.filter(e =>
    e.workflowName.toLowerCase().includes(search.toLowerCase()) ||
    e.id.includes(search) ||
    e.outcome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--card)" }}>
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm mb-0.5" style={{ fontWeight: 700, color: "var(--foreground)" }}>Executions</h2>
        <p className="text-[10px] mb-3" style={{ color: "var(--muted-foreground)" }}>
          Actual workflow runs — steps, tools, cost, outcome
        </p>
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search executions…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
        {filtered.map(exec => {
          const sc = STATUS_CFG[exec.status];
          const SIcon = sc.icon;
          return (
            <button key={exec.id} onClick={() => setSelected(exec)}
              className="w-full text-left px-4 py-3 transition-all group"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${sc.color}12` }}>
                  <SIcon className="w-3.5 h-3.5" style={{ color: sc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono" style={{ fontWeight: 700, color: "var(--foreground)" }}>#{exec.id}</span>
                    <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{exec.workflowName}</span>
                  </div>
                  <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>{exec.outcome}</p>
                  <div className="flex items-center gap-2 mt-1 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                    <span>{exec.startedAt}</span>
                    <span>{exec.duration}</span>
                    <span>{exec.steps.length} steps</span>
                    <span>{exec.cost}</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 shrink-0 mt-1 transition-opacity" style={{ color: "var(--muted-foreground)" }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
