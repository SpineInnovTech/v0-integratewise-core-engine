/**
 * Success Plan Tracker View — Executive success plans with QBR dates.
 * Entity: Success_Plan_Tracker
 */
import { useState } from "react";
import { Search, FileText, Calendar, AlertTriangle } from "lucide-react";
import { successPlanData, getAccountName, statusColor } from "../csm-intelligence-data";

export function SuccessPlansView() {
  const [search, setSearch] = useState("");

  const filtered = successPlanData.filter(s =>
    !search || getAccountName(s.account).toLowerCase().includes(search.toLowerCase()) || s.executiveSummary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>Success Plans</h2>
          <p className="text-xs text-muted-foreground">{successPlanData.length} active success plans</p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-48" />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(s => (
          <div key={s.successPlanId} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>{getAccountName(s.account)}</p>
                  <p className="text-[10px] text-muted-foreground">{s.successPlanId} · {s.planPeriod} · Created: {s.creationDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, color: statusColor(s.planStatus === "Active" ? "On Track" : "In Progress"), background: `${statusColor(s.planStatus === "Active" ? "On Track" : "In Progress")}15` }}>{s.planStatus}</span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  QBR: {s.nextQbrDate}
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-4">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1" style={{ fontWeight: 600 }}>Executive Summary</p>
              <p className="text-xs text-foreground leading-relaxed">{s.executiveSummary}</p>
            </div>

            {/* Key Info */}
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5" style={{ fontWeight: 600 }}>Key Initiatives ({s.keyInitiatives.length})</p>
                <div className="space-y-1">
                  {s.keyInitiatives.map((k, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      {k}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <p className="text-[9px] uppercase tracking-wider text-red-500 mb-1.5" style={{ fontWeight: 600 }}>Top 3 Risks</p>
                <div className="space-y-1">
                  {s.top3Risks.map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                      <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/20 border border-border/50 space-y-2">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground" style={{ fontWeight: 600 }}>Exec Sponsor (Customer)</p>
                  <p className="text-xs text-foreground" style={{ fontWeight: 500 }}>{s.executiveSponsorCustomer}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground" style={{ fontWeight: 600 }}>Exec Sponsor (MuleSoft)</p>
                  <p className="text-xs text-foreground" style={{ fontWeight: 500 }}>{s.executiveSponsorMuleSoft}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground" style={{ fontWeight: 600 }}>Strategic Objectives</p>
                  <p className="text-xs text-foreground" style={{ fontWeight: 500 }}>{s.strategicObjectivesCount} objectives tracked</p>
                </div>
              </div>
            </div>

            <div className="px-4 pb-3 text-[10px] text-muted-foreground">
              Last updated: {s.lastUpdated}
            </div>

            {/* Linkage Badges */}
            <div className="px-4 pb-4 flex flex-wrap items-center gap-1.5 text-[10px] border-t border-border/50 pt-3">
              <span className="text-muted-foreground">Entity Links:</span>
              {s.linkedStrategicObjectives.map(o => <span key={o} className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600" style={{ fontWeight: 500 }}>{o}</span>)}
              {s.linkedInitiatives.map(i => <span key={i} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700" style={{ fontWeight: 500 }}>{i}</span>)}
              {s.linkedMetrics.map(m => <span key={m} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700" style={{ fontWeight: 500 }}>{m}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}