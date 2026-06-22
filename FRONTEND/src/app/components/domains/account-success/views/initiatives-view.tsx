/**
 * Initiatives View — Project/initiative tracking with budgets, phases, and outcomes.
 * Entity: Initiatives
 */
import { useState } from "react";
import { Search, Rocket, AlertTriangle, Clock } from "lucide-react";
import { initiativesData, getAccountName, formatCurrency, statusColor } from "../csm-intelligence-data";

const phaseOrder = ["Ideation", "Planning", "Execution", "Monitoring", "Completed", "Cancelled"];

export function InitiativesView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = initiativesData.filter(i => {
    if (search && !i.initiativeName.toLowerCase().includes(search.toLowerCase()) && !getAccountName(i.account).toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  });

  const totalInvestment = initiativesData.reduce((s, i) => s + i.investmentAmountUsd, 0);
  const totalExpectedBenefit = initiativesData.reduce((s, i) => s + i.expectedAnnualBenefitUsd, 0);
  const totalRealized = initiativesData.reduce((s, i) => s + i.realizedAnnualBenefitUsd, 0);

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>Initiatives</h2>
          <p className="text-xs text-muted-foreground">{initiativesData.length} active initiatives · Investment & value tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-44" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none">
            <option value="all">All Status</option>
            <option value="On Track">On Track</option>
            <option value="At Risk">At Risk</option>
            <option value="Blocked">Blocked</option>
            <option value="Delayed">Delayed</option>
          </select>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Investment</p>
          <p className="text-xl mt-1 text-foreground" style={{ fontWeight: 700 }}>{formatCurrency(totalInvestment)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expected Annual Benefit</p>
          <p className="text-xl mt-1 text-green-500" style={{ fontWeight: 700 }}>{formatCurrency(totalExpectedBenefit)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Realized Value</p>
          <p className="text-xl mt-1 text-blue-500" style={{ fontWeight: 700 }}>{formatCurrency(totalRealized)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Payback</p>
          <p className="text-xl mt-1 text-foreground" style={{ fontWeight: 700 }}>{Math.round(initiativesData.reduce((s, i) => s + i.expectedPaybackMonths, 0) / initiativesData.length)}mo</p>
        </div>
      </div>

      {/* Initiative Cards */}
      <div className="space-y-3">
        {filtered.map(ini => (
          <div key={ini.initiativeId} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${statusColor(ini.status)}15` }}>
                  <Rocket className="w-4 h-4" style={{ color: statusColor(ini.status) }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>{ini.initiativeName}</p>
                  <p className="text-[10px] text-muted-foreground">{getAccountName(ini.account)} · {ini.initiativeType} · {ini.priority}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, color: statusColor(ini.status), background: `${statusColor(ini.status)}15` }}>{ini.status}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground" style={{ fontWeight: 500 }}>{ini.phase}</span>
              </div>
            </div>

            {/* Phase Progress */}
            <div className="flex items-center gap-1">
              {phaseOrder.slice(0, -1).map((phase, i) => {
                const idx = phaseOrder.indexOf(ini.phase);
                const isActive = i === idx;
                const isPast = i < idx;
                return (
                  <div key={phase} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className={`h-1.5 w-full rounded-full ${isPast ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-secondary"}`} />
                    <span className={`text-[7px] ${isActive ? "text-blue-500 font-semibold" : "text-muted-foreground/50"}`}>{phase}</span>
                  </div>
                );
              })}
            </div>

            {/* Financial Detail */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-border/50">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Investment</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>{formatCurrency(ini.investmentAmountUsd)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">MuleSoft Services</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>{formatCurrency(ini.muleSoftServicesUsd)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Expected Benefit</p>
                <p className="text-xs text-green-500" style={{ fontWeight: 600 }}>{formatCurrency(ini.expectedAnnualBenefitUsd)}/yr</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Realized</p>
                <p className="text-xs text-blue-500" style={{ fontWeight: 600 }}>{formatCurrency(ini.realizedAnnualBenefitUsd)}/yr</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Payback</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>{ini.expectedPaybackMonths}mo</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ini.startDate} → {ini.targetCompletionDate}</span>
              <span>Owner: {ini.ownerMuleSoft} / {ini.ownerCustomer}</span>
            </div>

            {/* Linkages */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Links:</span>
              {ini.linkedStrategicObjectives.map(o => <span key={o} className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600" style={{ fontWeight: 500 }}>{o}</span>)}
              {ini.linkedCapabilities.map(c => <span key={c} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600" style={{ fontWeight: 500 }}>{c}</span>)}
              {ini.linkedMetrics.map(m => <span key={m} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700" style={{ fontWeight: 500 }}>{m}</span>)}
            </div>

            {ini.blockers && (
              <div className="flex items-start gap-1.5 text-[10px] text-red-500 bg-red-500/5 px-2 py-1.5 rounded-lg">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{ini.blockers}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}