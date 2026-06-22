/**
 * Strategic Objectives View — Objectives linked to capabilities, value streams, initiatives.
 * Entity: Strategic_Objectives
 */
import { useState } from "react";
import { Search, Target, ArrowRight } from "lucide-react";
import { strategicObjectivesData, getAccountName, formatCurrency, statusColor } from "../csm-intelligence-data";

export function StrategicObjectivesView() {
  const [search, setSearch] = useState("");
  const [pillarFilter, setPillarFilter] = useState("all");

  const pillars = [...new Set(strategicObjectivesData.map(o => o.strategicPillar))];

  const filtered = strategicObjectivesData.filter(o => {
    if (search && !o.objectiveName.toLowerCase().includes(search.toLowerCase()) && !getAccountName(o.account).toLowerCase().includes(search.toLowerCase())) return false;
    if (pillarFilter !== "all" && o.strategicPillar !== pillarFilter) return false;
    return true;
  });

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>Strategic Objectives</h2>
          <p className="text-xs text-muted-foreground">{strategicObjectivesData.length} objectives across {new Set(strategicObjectivesData.map(o => o.account)).size} accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-44" />
          </div>
          <select value={pillarFilter} onChange={e => setPillarFilter(e.target.value)} className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none">
            <option value="all">All Pillars</option>
            {pillars.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(o => (
          <div key={o.objectiveId} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${statusColor(o.healthIndicator === "Green" ? "On Track" : o.healthIndicator === "Amber" ? "At Risk" : "Critical")}15` }}>
                  <Target className="w-4 h-4" style={{ color: statusColor(o.healthIndicator === "Green" ? "On Track" : o.healthIndicator === "Amber" ? "At Risk" : "Critical") }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>{o.objectiveName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{getAccountName(o.account)} · {o.strategicPillar}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{o.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, color: statusColor(o.status), background: `${statusColor(o.status)}15` }}>{o.status}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, color: statusColor(o.healthIndicator === "Green" ? "On Track" : o.healthIndicator === "Amber" ? "At Risk" : "Critical"), background: `${statusColor(o.healthIndicator === "Green" ? "On Track" : o.healthIndicator === "Amber" ? "At Risk" : "Critical")}15` }}>
                  {o.healthIndicator}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Progress</span>
                <span className="text-[10px] text-foreground" style={{ fontWeight: 600 }}>{o.progressPercent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${o.progressPercent}%`, background: statusColor(o.healthIndicator === "Green" ? "On Track" : o.healthIndicator === "Amber" ? "At Risk" : "Critical") }} />
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Business Value</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>{formatCurrency(o.businessValueUsd)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Target Date</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 500 }}>{o.targetDate}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Business Driver</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 500 }}>{o.businessDriver}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">MuleSoft Relevance</p>
                <p className="text-xs" style={{ fontWeight: 600, color: o.muleSoftRelevance === "High" ? "#22c55e" : o.muleSoftRelevance === "Medium" ? "#f59e0b" : "#6b7280" }}>{o.muleSoftRelevance}</p>
              </div>
            </div>

            {/* Linkages */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-muted-foreground">Links:</span>
              {o.linkedCapabilities.map(c => <span key={c} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600" style={{ fontWeight: 500 }}>{c}</span>)}
              {o.linkedValueStreams.map(v => <span key={v} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600" style={{ fontWeight: 500 }}>{v}</span>)}
              {o.linkedInitiatives.map(i => <span key={i} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700" style={{ fontWeight: 500 }}>{i}</span>)}
              {o.linkedMetrics.map(m => <span key={m} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700" style={{ fontWeight: 500 }}>{m}</span>)}
            </div>

            {o.notes && (
              <p className="text-[10px] text-muted-foreground italic border-t border-border/50 pt-2">{o.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}