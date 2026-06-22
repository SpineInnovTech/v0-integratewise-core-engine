/**
 * Platform Health Metrics View — KPIs, SLAs, operational metrics with thresholds.
 * Entity: Platform_Health_Metrics
 */
import { useState } from "react";
import { Search, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { platformHealthData, getAccountName, statusColor } from "../csm-intelligence-data";

export function PlatformHealthView() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const categories = [...new Set(platformHealthData.map(m => m.metricCategory))];
  const filtered = platformHealthData.filter(m => {
    if (search && !m.metricName.toLowerCase().includes(search.toLowerCase()) && !getAccountName(m.account).toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter !== "all" && m.metricCategory !== catFilter) return false;
    return true;
  });

  const healthCounts = { Healthy: platformHealthData.filter(m => m.healthStatus === "Healthy").length, Warning: platformHealthData.filter(m => m.healthStatus === "Warning").length, Critical: platformHealthData.filter(m => m.healthStatus === "Critical").length };

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>Platform Health Metrics</h2>
          <p className="text-xs text-muted-foreground">{platformHealthData.length} metrics tracked · SLA & KPI monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-44" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Health Summary */}
      <div className="flex items-center gap-3">
        {[
          { label: "Healthy", count: healthCounts.Healthy, color: "#22c55e" },
          { label: "Warning", count: healthCounts.Warning, color: "#f59e0b" },
          { label: "Critical", count: healthCounts.Critical, color: "#ef4444" },
        ].map(h => (
          <div key={h.label} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card">
            <div className="w-3 h-3 rounded-full" style={{ background: h.color }} />
            <span className="text-xs text-foreground" style={{ fontWeight: 600 }}>{h.count}</span>
            <span className="text-[10px] text-muted-foreground">{h.label}</span>
          </div>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(m => {
          const pct = m.targetValue !== 0 ? Math.min(100, (m.currentValue / m.targetValue) * 100) : 0;
          const isInverse = m.metricName.includes("Error") || m.metricName.includes("Threat"); // lower is better
          return (
            <div key={m.metricId} className="rounded-xl border bg-card p-4 space-y-3" style={{ borderColor: statusColor(m.healthStatus) + "40" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>{m.metricName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{getAccountName(m.account)} · {m.metricCategory} · {m.metricType}</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: `${statusColor(m.healthStatus)}15`, color: statusColor(m.healthStatus) }}>
                  <Activity className="w-3 h-3" />
                  <span className="text-[10px]" style={{ fontWeight: 600 }}>{m.healthStatus}</span>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl text-foreground" style={{ fontWeight: 700 }}>{m.currentValue}{m.unit !== "ms" && m.unit !== "apps" && m.unit !== "hospitals" && m.unit !== "events/day" ? "" : ""}<span className="text-sm text-muted-foreground ml-1">{m.unit}</span></p>
                  <p className="text-[10px] text-muted-foreground">Target: {m.targetValue} {m.unit}</p>
                </div>
                <div className="flex items-center gap-1">
                  {m.trendIsGood ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                </div>
              </div>

              {/* Threshold Visual */}
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-secondary overflow-hidden relative">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: statusColor(m.healthStatus) }} />
                </div>
                <div className="flex items-center justify-between text-[8px] text-muted-foreground">
                  <span>0</span>
                  <span>⚠ {m.thresholdWarning}</span>
                  <span>🔴 {m.thresholdCritical}</span>
                  <span>Target: {m.targetValue}</span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground italic pt-1 border-t border-border/50">{m.businessImpactStatement}</p>
              <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                <span>Source: {m.dataSource}</span>
                <span>Freq: {m.measurementFrequency}</span>
              </div>
              {/* Linkages */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Links:</span>
                {m.linkedStrategicObjectives.map(s => <span key={s} className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600" style={{ fontWeight: 500 }}>{s}</span>)}
                {m.linkedCapability && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600" style={{ fontWeight: 500 }}>{m.linkedCapability}</span>}
                {m.linkedValueStream && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600" style={{ fontWeight: 500 }}>{m.linkedValueStream}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}