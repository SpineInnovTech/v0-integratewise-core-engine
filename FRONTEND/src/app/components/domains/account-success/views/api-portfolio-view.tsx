/**
 * API Portfolio View — API inventory with performance, SLA, and health metrics.
 * Entity: API_Portfolio
 */
import { useState } from "react";
import { Search, Activity, Wifi, WifiOff } from "lucide-react";
import { apiPortfolioData, getAccountName, formatNumber, statusColor } from "../csm-intelligence-data";

const typeColors: Record<string, string> = { System: "#3b82f6", Process: "#8b5cf6", Experience: "#10b981" };

export function ApiPortfolioView() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");

  const filtered = apiPortfolioData.filter(a => {
    if (search && !a.apiName.toLowerCase().includes(search.toLowerCase()) && !getAccountName(a.account).toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && a.apiType !== typeFilter) return false;
    if (healthFilter !== "all" && a.healthStatus !== healthFilter) return false;
    return true;
  });

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>API Portfolio</h2>
          <p className="text-xs text-muted-foreground">{apiPortfolioData.length} APIs tracked · Performance & health monitoring</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search APIs..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-44" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none">
            <option value="all">All Types</option>
            <option value="System">System</option>
            <option value="Process">Process</option>
            <option value="Experience">Experience</option>
          </select>
          <select value={healthFilter} onChange={e => setHealthFilter(e.target.value)} className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none">
            <option value="all">All Health</option>
            <option value="Healthy">Healthy</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total APIs", value: apiPortfolioData.length.toString(), color: "#3b82f6" },
          { label: "Healthy", value: apiPortfolioData.filter(a => a.healthStatus === "Healthy").length.toString(), color: "#22c55e" },
          { label: "Warning", value: apiPortfolioData.filter(a => a.healthStatus === "Warning").length.toString(), color: "#f59e0b" },
          { label: "Critical", value: apiPortfolioData.filter(a => a.healthStatus === "Critical").length.toString(), color: "#ef4444" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="text-xl mt-1" style={{ fontWeight: 700, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["API Name", "Account", "Type", "Txns/mo", "Resp (ms)", "SLA %", "Error %", "Uptime", "Health", "Linked Objectives & Metrics"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.apiId} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-3 py-2.5">
                    <div>
                      <span className="text-foreground" style={{ fontWeight: 600 }}>{a.apiName}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">{a.apiVersion}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{a.businessCapability} · {a.ownerTeam}</p>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{getAccountName(a.account)}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{ fontWeight: 600, background: typeColors[a.apiType] }}>{a.apiType}</span>
                  </td>
                  <td className="px-3 py-2.5 text-foreground" style={{ fontWeight: 500 }}>{formatNumber(a.monthlyTransactions)}</td>
                  <td className="px-3 py-2.5">
                    <span style={{ fontWeight: 600, color: a.avgResponseTimeMs > a.slaTargetMs ? "#ef4444" : "#22c55e" }}>{a.avgResponseTimeMs}</span>
                    <span className="text-muted-foreground">/{a.slaTargetMs}</span>
                  </td>
                  <td className="px-3 py-2.5" style={{ fontWeight: 600, color: a.slaCompliancePercent >= 99 ? "#22c55e" : a.slaCompliancePercent >= 95 ? "#f59e0b" : "#ef4444" }}>
                    {a.slaCompliancePercent}%
                  </td>
                  <td className="px-3 py-2.5" style={{ fontWeight: 600, color: a.errorRatePercent > 0.5 ? "#ef4444" : a.errorRatePercent > 0.1 ? "#f59e0b" : "#22c55e" }}>
                    {a.errorRatePercent}%
                  </td>
                  <td className="px-3 py-2.5" style={{ fontWeight: 600, color: a.uptimePercent >= 99.9 ? "#22c55e" : "#f59e0b" }}>
                    {a.uptimePercent}%
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {a.healthStatus === "Healthy" ? <Wifi className="w-3.5 h-3.5 text-green-500" /> :
                       a.healthStatus === "Warning" ? <Activity className="w-3.5 h-3.5 text-amber-500" /> :
                       <WifiOff className="w-3.5 h-3.5 text-red-500" />}
                      <span className="text-[10px]" style={{ fontWeight: 600, color: statusColor(a.healthStatus) }}>{a.healthStatus}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      {a.linkedStrategicObjectives.map(o => <span key={o} className="text-[8px] px-1 py-0.5 rounded bg-green-500/10 text-green-600" style={{ fontWeight: 500 }}>{o}</span>)}
                      {a.linkedMetrics.map(m => <span key={m} className="text-[8px] px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-700" style={{ fontWeight: 500 }}>{m}</span>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}