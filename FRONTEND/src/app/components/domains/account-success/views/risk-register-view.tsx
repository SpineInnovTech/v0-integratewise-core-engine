/**
 * Technical Debt & Risk Register View — Risk tracking with impact/probability matrix.
 * Entity: Technical_Debt_&_Risk_Register
 */
import { useState } from "react";
import { Search, ShieldAlert } from "lucide-react";
import { riskRegisterData, getAccountName, riskColor, statusColor } from "../csm-intelligence-data";

export function RiskRegisterView() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const filtered = riskRegisterData.filter(r => {
    if (search && !r.riskTitle.toLowerCase().includes(search.toLowerCase()) && !getAccountName(r.account).toLowerCase().includes(search.toLowerCase())) return false;
    if (levelFilter !== "all" && r.riskLevel !== levelFilter) return false;
    return true;
  }).sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>Risk Register</h2>
          <p className="text-xs text-muted-foreground">{riskRegisterData.length} risks tracked · Sorted by risk score</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-44" />
          </div>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none">
            <option value="all">All Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Risk Score Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        {["Critical", "High", "Medium", "Low"].map(level => {
          const count = riskRegisterData.filter(r => r.riskLevel === level).length;
          if (count === 0) return null;
          return (
            <div key={level} className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-card" style={{ borderColor: `${riskColor(level)}40` }}>
              <div className="w-3 h-3 rounded-full" style={{ background: riskColor(level) }} />
              <span className="text-xs" style={{ fontWeight: 600, color: riskColor(level) }}>{count}</span>
              <span className="text-[10px] text-muted-foreground">{level}</span>
            </div>
          );
        })}
      </div>

      {/* Risk Cards */}
      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.riskId} className="rounded-xl border bg-card p-4 space-y-3" style={{ borderColor: `${riskColor(r.riskLevel)}30` }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${riskColor(r.riskLevel)}15` }}>
                  <ShieldAlert className="w-4 h-4" style={{ color: riskColor(r.riskLevel) }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>{r.riskTitle}</p>
                  <p className="text-[10px] text-muted-foreground">{getAccountName(r.account)} · {r.riskCategory} · {r.riskId}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ fontWeight: 700, color: riskColor(r.riskLevel), background: `${riskColor(r.riskLevel)}15` }}>
                  Score: {r.riskScore}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, color: statusColor(r.status), background: `${statusColor(r.status)}15` }}>
                  {r.status}
                </span>
              </div>
            </div>

            {/* Impact × Probability */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Impact</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>{r.impact} ({r.impactScore}/5)</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Probability</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>{r.probability} ({r.probabilityScore}/5)</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Owner</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 500 }}>{r.mitigationOwner}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Target Resolution</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 500 }}>{r.targetResolutionDate}</p>
              </div>
            </div>

            {/* Mitigation */}
            <div className="p-2.5 rounded-lg bg-secondary/20 border border-border/50">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1" style={{ fontWeight: 600 }}>Mitigation Strategy</p>
              <p className="text-xs text-foreground">{r.mitigationStrategy}</p>
            </div>

            {/* Affected Assets */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {r.affectedCapability && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600" style={{ fontWeight: 500 }}>{r.affectedCapability}</span>}
              {r.affectedApis.map(a => <span key={a} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600" style={{ fontWeight: 500 }}>{a}</span>)}
              <span className="text-muted-foreground ml-1">Identified: {r.dateIdentified}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
