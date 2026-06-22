import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Sliders } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const forecastData = [
  { category: "Closed Won", value: 65000, count: 1, color: "#00C853" },
  { category: "Commit", value: 120000, count: 1, color: "#0066FF" },
  { category: "Best Case", value: 85000, count: 1, color: "#7C4DFF" },
  { category: "Pipeline", value: 123000, count: 2, color: "#FF9800" },
  { category: "Early Stage", value: 28000, count: 1, color: "#9E9E9E" },
];

const monthlyForecast = [
  { month: "Feb", closed: 65, commit: 120, bestCase: 85, pipeline: 60, quota: 300 },
  { month: "Mar", closed: 0, commit: 52, bestCase: 95, pipeline: 123, quota: 300 },
  { month: "Apr", closed: 0, commit: 0, bestCase: 95, pipeline: 80, quota: 300 },
];

const repForecast = [
  { rep: "Vikram R.", quota: 200, closed: 0, commit: 120, pipeline: 28, gap: 52, onTrack: true },
  { rep: "Arun K.", quota: 250, closed: 0, commit: 85, pipeline: 95, gap: 70, onTrack: false },
  { rep: "Anjali P.", quota: 150, closed: 65, commit: 0, pipeline: 95, gap: -10, onTrack: true },
  { rep: "Priya S.", quota: 200, closed: 65, commit: 0, pipeline: 0, gap: 135, onTrack: false },
  { rep: "Rajesh M.", quota: 150, closed: 0, commit: 52, pipeline: 0, gap: 98, onTrack: false },
];

const riskFlags = [
  { deal: "FinanceFlow Renewal", risk: "Account health at 54, declining engagement", severity: "high" },
  { deal: "RetailNest Basic Setup", risk: "Budget not confirmed, competitor (Zapier) active", severity: "medium" },
  { deal: "CloudBridge Deployment", risk: "Stuck in Proposal for 5 days without response", severity: "low" },
];

export function ForecastingView() {
  const [scenario, setScenario] = useState(100);
  const totalQuota = 300; // Q1 quota in $K
  const totalClosed = forecastData[0].value / 1000;
  const totalCommit = forecastData[1].value / 1000;
  const totalBestCase = forecastData[2].value / 1000;
  const gapToQuota = totalQuota - totalClosed - totalCommit;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Forecasting</h2>
          <p className="text-sm text-muted-foreground mt-1">Sales forecasting with confidence weighting and scenario planning</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Q1 Quota</div><div className="text-lg" style={{ fontWeight: 600 }}>${totalQuota}K</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Closed Won</div><div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-success)" }}>${totalClosed}K</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Commit</div><div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-blue)" }}>${totalCommit}K</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Best Case</div><div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-purple)" }}>${totalBestCase}K</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Gap to Quota</div><div className="text-lg" style={{ fontWeight: 600, color: gapToQuota > 0 ? "var(--iw-danger)" : "var(--iw-success)" }}>{gapToQuota > 0 ? `$${gapToQuota}K` : "On Track"}</div></div>
      </div>

      {/* Quota Progress */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3>Quota Attainment</h3>
          <span className="text-xs text-muted-foreground">{Math.round((totalClosed + totalCommit) / totalQuota * 100)}% of quota</span>
        </div>
        <div className="w-full h-4 bg-secondary rounded-full overflow-hidden flex">
          <div className="h-full bg-[var(--iw-success)]" style={{ width: `${(totalClosed / totalQuota) * 100}%` }} title={`Closed: $${totalClosed}K`} />
          <div className="h-full bg-[var(--iw-blue)]" style={{ width: `${(totalCommit / totalQuota) * 100}%` }} title={`Commit: $${totalCommit}K`} />
          <div className="h-full bg-[var(--iw-purple)]/50" style={{ width: `${(totalBestCase / totalQuota) * 100}%` }} title={`Best Case: $${totalBestCase}K`} />
        </div>
        <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-success)]" /> Closed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-blue)]" /> Commit</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-purple)]/50" /> Best Case</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> Gap</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Forecast Chart */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Monthly Forecast ($K)</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="closed" stackId="a" fill="#00C853" name="Closed" radius={[0, 0, 0, 0]} />
                <Bar dataKey="commit" stackId="a" fill="#0066FF" name="Commit" />
                <Bar dataKey="bestCase" stackId="a" fill="#7C4DFF" name="Best Case" />
                <Bar dataKey="pipeline" stackId="a" fill="#FF9800" name="Pipeline" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scenario Planning */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4 flex items-center gap-2"><Sliders className="w-4 h-4" /> Scenario Planning</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Win Rate Adjustment</span>
                <span style={{ fontWeight: 500 }}>{scenario}%</span>
              </div>
              <input type="range" min={50} max={150} value={scenario} onChange={(e) => setScenario(parseInt(e.target.value))} className="w-full accent-[var(--iw-blue)]" />
              <div className="flex justify-between text-[10px] text-muted-foreground"><span>Pessimistic</span><span>Optimistic</span></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded bg-secondary/50 text-center">
                <div className="text-[9px] text-muted-foreground">Low Scenario</div>
                <div className="text-sm" style={{ fontWeight: 600 }}>${Math.round((totalClosed + totalCommit * 0.5 + totalBestCase * 0.2) * scenario / 100)}K</div>
              </div>
              <div className="p-2 rounded bg-primary/5 border border-primary/20 text-center">
                <div className="text-[9px] text-primary">Expected</div>
                <div className="text-sm" style={{ fontWeight: 600 }}>${Math.round((totalClosed + totalCommit * 0.8 + totalBestCase * 0.5) * scenario / 100)}K</div>
              </div>
              <div className="p-2 rounded bg-secondary/50 text-center">
                <div className="text-[9px] text-muted-foreground">High Scenario</div>
                <div className="text-sm" style={{ fontWeight: 600 }}>${Math.round((totalClosed + totalCommit + totalBestCase * 0.8) * scenario / 100)}K</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rep Forecast */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border"><h3>Rep Forecast ($K)</h3></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left py-2 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Rep</th>
              <th className="text-right py-2 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Quota</th>
              <th className="text-right py-2 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Closed</th>
              <th className="text-right py-2 px-4 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 500 }}>Commit</th>
              <th className="text-right py-2 px-4 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 500 }}>Pipeline</th>
              <th className="text-right py-2 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Gap</th>
              <th className="text-center py-2 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {repForecast.map((rep) => (
              <tr key={rep.rep} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="py-2.5 px-4" style={{ fontWeight: 500 }}>{rep.rep}</td>
                <td className="py-2.5 px-4 text-right text-xs">${rep.quota}K</td>
                <td className="py-2.5 px-4 text-right text-xs" style={{ color: rep.closed > 0 ? "var(--iw-success)" : undefined }}>${rep.closed}K</td>
                <td className="py-2.5 px-4 text-right text-xs hidden sm:table-cell">${rep.commit}K</td>
                <td className="py-2.5 px-4 text-right text-xs hidden md:table-cell">${rep.pipeline}K</td>
                <td className="py-2.5 px-4 text-right text-xs" style={{ color: rep.gap > 0 ? "var(--iw-danger)" : "var(--iw-success)", fontWeight: 500 }}>{rep.gap > 0 ? `$${rep.gap}K` : "Covered"}</td>
                <td className="py-2.5 px-4 text-center">{rep.onTrack ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--iw-success)]/10 text-[var(--iw-success)]" style={{ fontWeight: 500 }}>On Track</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--iw-danger)]/10 text-[var(--iw-danger)]" style={{ fontWeight: 500 }}>At Risk</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Risk Flags */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[var(--iw-warning)]" /> ChurnShield Risk Flags</h3>
        <div className="space-y-2">
          {riskFlags.map((rf, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded bg-secondary/50">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: rf.severity === "high" ? "var(--iw-danger)" : rf.severity === "medium" ? "var(--iw-warning)" : "var(--iw-blue)" }} />
              <div className="flex-1">
                <div className="text-xs" style={{ fontWeight: 500 }}>{rf.deal}</div>
                <div className="text-[10px] text-muted-foreground">{rf.risk}</div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: rf.severity === "high" ? "rgba(244,67,54,0.1)" : rf.severity === "medium" ? "rgba(255,152,0,0.1)" : "rgba(0,102,255,0.1)", color: rf.severity === "high" ? "var(--iw-danger)" : rf.severity === "medium" ? "var(--iw-warning)" : "var(--iw-blue)", fontWeight: 500 }}>{rf.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
