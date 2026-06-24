import { useState } from "react";
import { Timer, Search, ChevronRight, Brain, Database, Wrench, CheckCircle2, Activity } from "lucide-react";

interface Session {
  id: string;
  startedAt: string;
  endedAt: string;
  duration: string;
  entityCount: number;
  memoryCount: number;
  toolCount: number;
  modelUsed: string;
  tokenCount: number;
  outcome: string;
  status: "complete" | "active" | "failed";
}

const SESSIONS: Session[] = [
  { id: "ses-1024", startedAt: "10:42 AM", endedAt: "11:00 AM", duration: "18 min", entityCount: 5, memoryCount: 14, toolCount: 3, modelUsed: "IW Pro", tokenCount: 12400, outcome: "Renewal Proposal — FinanceFlow recovery plan with 48h action sequence", status: "complete" },
  { id: "ses-1023", startedAt: "09:00 AM", endedAt: "09:12 AM", duration: "12 min", entityCount: 8, memoryCount: 6, toolCount: 2, modelUsed: "IW Pro", tokenCount: 8200, outcome: "Pipeline Brief — Q2 coverage gap analysis, 3 deals flagged", status: "complete" },
  { id: "ses-1022", startedAt: "Yesterday 3:15 PM", endedAt: "Yesterday 3:37 PM", duration: "22 min", entityCount: 2, memoryCount: 18, toolCount: 4, modelUsed: "Claude 3.7", tokenCount: 19600, outcome: "FinanceFlow Recovery — full 48h plan, EBR scheduled, credit extension drafted", status: "complete" },
  { id: "ses-1021", startedAt: "Yesterday 11:30 AM", endedAt: "Yesterday 11:36 AM", duration: "6 min", entityCount: 1, memoryCount: 3, toolCount: 1, modelUsed: "IW Pro", tokenCount: 3100, outcome: "Schema Drift — HubSpot connector v1.1.0 review, reconciler queued", status: "complete" },
  { id: "ses-1020", startedAt: "Now", endedAt: "—", duration: "active", entityCount: 0, memoryCount: 0, toolCount: 0, modelUsed: "IW Pro", tokenCount: 0, outcome: "In progress…", status: "active" },
];

const STATUS_CONFIG = {
  complete: { color: "var(--iw-success)", label: "Complete" },
  active:   { color: "var(--iw-blue)",    label: "Active" },
  failed:   { color: "var(--iw-danger)",  label: "Failed" },
};

export function TwinSessions() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Session | null>(null);

  const filtered = SESSIONS.filter(s =>
    s.id.includes(search) || s.outcome.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    const sc = STATUS_CONFIG[selected.status];
    return (
      <div className="flex flex-col h-full" style={{ background: "var(--card)" }}>
        <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <button onClick={() => setSelected(null)} className="text-xs font-semibold mb-1" style={{ color: "var(--iw-blue)" }}>← Back</button>
          <div className="flex items-center gap-2">
            <h2 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>Session {selected.id}</h2>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${sc.color}15`, color: sc.color }}>{sc.label}</span>
          </div>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{selected.startedAt} → {selected.endedAt} · {selected.duration}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Reasoning window stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Database, label: "Entities", value: selected.entityCount, color: "var(--iw-blue)" },
              { icon: Brain,    label: "Memories",  value: selected.memoryCount, color: "var(--iw-purple)" },
              { icon: Wrench,   label: "Tool Calls", value: selected.toolCount,  color: "var(--iw-warning)" },
              { icon: Activity, label: "Tokens",    value: selected.tokenCount.toLocaleString(), color: "var(--iw-success)" },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl text-center" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
                <div className="text-lg" style={{ fontWeight: 700, color: s.color }}>{s.value}</div>
                <div className="text-[9px]" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Reasoning Outcome</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{selected.outcome}</p>
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span>Model: <strong style={{ color: "var(--foreground)" }}>{selected.modelUsed}</strong></span>
            <span>{selected.tokenCount.toLocaleString()} tokens</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--card)" }}>
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm mb-0.5" style={{ fontWeight: 700, color: "var(--foreground)" }}>Sessions</h2>
        <p className="text-[10px] mb-3" style={{ color: "var(--muted-foreground)" }}>
          Reasoning windows — entities, memories, tools, continuity
        </p>
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
        {filtered.map(s => {
          const sc = STATUS_CONFIG[s.status];
          return (
            <button key={s.id} onClick={() => setSelected(s)}
              className="w-full text-left px-4 py-3 transition-all group"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${sc.color}15` }}>
                  <Timer className="w-3.5 h-3.5" style={{ color: sc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono" style={{ fontWeight: 700, color: "var(--foreground)" }}>{s.id}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${sc.color}15`, color: sc.color }}>{sc.label}</span>
                  </div>
                  <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>{s.outcome}</p>
                  <div className="flex items-center gap-3 mt-1 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                    <span>{s.startedAt}</span>
                    <span>{s.duration}</span>
                    <span>{s.entityCount} entities</span>
                    <span>{s.memoryCount} memories</span>
                    <span>{s.toolCount} tools</span>
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
