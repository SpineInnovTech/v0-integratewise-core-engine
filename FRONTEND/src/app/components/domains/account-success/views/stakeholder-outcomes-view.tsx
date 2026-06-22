/**
 * Stakeholder Outcomes View — Outcome tracking per stakeholder.
 * Entity: Stakeholder_Outcomes
 */
import { Search, Target } from "lucide-react";
import { useState } from "react";
import { stakeholderOutcomesData, getAccountName, statusColor } from "../csm-intelligence-data";

export function StakeholderOutcomesView() {
  const [search, setSearch] = useState("");

  const filtered = stakeholderOutcomesData.filter(o =>
    !search || o.stakeholderName.toLowerCase().includes(search.toLowerCase()) || o.outcomeStatement.toLowerCase().includes(search.toLowerCase()) || getAccountName(o.account).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>Stakeholder Outcomes</h2>
          <p className="text-xs text-muted-foreground">{stakeholderOutcomesData.length} outcomes tracked across stakeholders</p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-48" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(o => (
          <div key={o.outcomeId} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
                  {o.stakeholderName.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>{o.stakeholderName}</p>
                  <p className="text-[10px] text-muted-foreground">{o.stakeholderType} · {getAccountName(o.account)}</p>
                  <p className="text-xs text-foreground mt-1.5 leading-relaxed">"{o.outcomeStatement}"</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ fontWeight: 600, color: statusColor(o.status), background: `${statusColor(o.status)}15` }}>{o.status}</span>
            </div>

            {/* Metric Progress */}
            <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] text-foreground" style={{ fontWeight: 600 }}>{o.successMetricName}</span>
                </div>
                <span className="text-xs" style={{ fontWeight: 700, color: statusColor(o.status) }}>{o.targetAchievementPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, o.targetAchievementPercent)}%`, background: statusColor(o.status) }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Baseline: {o.baselineValue} {o.unit}</span>
                <span style={{ fontWeight: 600, color: "var(--foreground)" }}>Current: {o.currentValue} {o.unit}</span>
                <span>Target: {o.targetValue} {o.unit}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>Method: {o.measurementMethod}</span>
              <div className="flex items-center gap-1">
                <span>Links:</span>
                {o.linkedStrategicObjectives.map(s => <span key={s} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600" style={{ fontWeight: 500 }}>{s}</span>)}
                {o.linkedValueStreams.map(v => <span key={v} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600" style={{ fontWeight: 500 }}>{v}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
