/**
 * MuleSoft Capabilities View — Capability maturity assessment with gap analysis.
 * Entity: MuleSoft_Capabilities
 */
import { useState } from "react";
import { Search, Layers } from "lucide-react";
import { capabilitiesData, getAccountName, formatCurrency, statusColor, riskColor } from "../csm-intelligence-data";

const maturityLabels = ["", "Ad Hoc", "Initial", "Defined", "Advanced", "Optimized"];

export function CapabilitiesView() {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");

  const domains = [...new Set(capabilitiesData.map(c => c.capabilityDomain))];

  const filtered = capabilitiesData.filter(c => {
    if (search && !c.capabilityName.toLowerCase().includes(search.toLowerCase()) && !getAccountName(c.account).toLowerCase().includes(search.toLowerCase())) return false;
    if (domainFilter !== "all" && c.capabilityDomain !== domainFilter) return false;
    return true;
  });

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>MuleSoft Capabilities</h2>
          <p className="text-xs text-muted-foreground">{capabilitiesData.length} capabilities assessed · Maturity gap analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-44" />
          </div>
          <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none">
            <option value="all">All Domains</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.capabilityId} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>{c.capabilityName}</p>
                  <p className="text-[10px] text-muted-foreground">{getAccountName(c.account)} · {c.capabilityDomain} · {c.capabilityId}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600, color: riskColor(c.gapStatus === "Closed" ? "Low" : c.gapStatus === "Minor" ? "Low" : c.gapStatus === "Moderate" ? "Medium" : c.gapStatus === "Significant" ? "High" : "Critical"), background: `${riskColor(c.gapStatus === "Closed" ? "Low" : c.gapStatus === "Minor" ? "Low" : c.gapStatus === "Moderate" ? "Medium" : c.gapStatus === "Significant" ? "High" : "Critical")}15` }}>
                  Gap: {c.gapStatus}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground" style={{ fontWeight: 500 }}>{c.priority}</span>
              </div>
            </div>

            {/* Maturity Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground">Maturity: {c.currentMaturity} → {c.targetMaturity}</span>
                <span className="text-[10px] text-foreground" style={{ fontWeight: 600 }}>Gap: {c.maturityGap}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <div key={level} className="flex-1 h-3 rounded-sm relative" style={{
                    background: level <= c.currentMaturityNum ? "#3b82f6" : level <= c.targetMaturityNum ? "#3b82f620" : "#e5e7eb20",
                    border: level === c.targetMaturityNum ? "2px solid #3b82f6" : "1px solid transparent"
                  }}>
                    {level === c.currentMaturityNum && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-blue-500" style={{ fontWeight: 700 }}>Now</div>}
                    {level === c.targetMaturityNum && c.targetMaturityNum !== c.currentMaturityNum && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-blue-400" style={{ fontWeight: 700 }}>Target</div>}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                {maturityLabels.slice(1).map((l, i) => (
                  <span key={i} className="text-[7px] text-muted-foreground/60 flex-1 text-center">{l}</span>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Investment</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>{formatCurrency(c.investmentRequiredUsd)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Status</p>
                <p className="text-xs" style={{ fontWeight: 600, color: statusColor(c.implementationStatus) }}>{c.implementationStatus}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Tech Owner</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 500 }}>{c.technicalOwnerCustomer}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Last Assessment</p>
                <p className="text-xs text-foreground" style={{ fontWeight: 500 }}>{c.lastAssessmentDate}</p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground italic">{c.businessImpactStatement}</p>

            {/* Linkages */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Links:</span>
              {c.linkedStrategicObjectives.map(o => <span key={o} className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600" style={{ fontWeight: 500 }}>{o}</span>)}
              {c.supportingValueStreams.map(v => <span key={v} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600" style={{ fontWeight: 500 }}>{v}</span>)}
              {c.linkedMetrics.map(m => <span key={m} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700" style={{ fontWeight: 500 }}>{m}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}