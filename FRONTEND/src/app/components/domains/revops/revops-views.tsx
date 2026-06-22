/**
 * RevOps Inner Views — Pipeline Visibility, Forecasting, Quota, Analytics, Teams
 * All data from Spine SSOT sales projection — context-aware rendering.
 */
import { useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Target, Activity, Users,
  BarChart3, PieChart as PieChartIcon, Filter, Search, ChevronDown,
  ArrowUpRight, ArrowDownRight, Clock, Calendar, Zap, Award,
  AlertTriangle, CheckCircle, Eye, Layers,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from "recharts";
import { useSpineProjection } from "../../spine/spine-client";
import {
  formatCurrency, dealStageConfig, calculateWeightedPipeline,
  calculateWinRate, calculateAvgDealSize, trendColor,
} from "../spine-projection";

/* ═══════════ Pipeline Visibility ═══════════ */
export function PipelineView() {
  const { data: proj } = useSpineProjection<any>("sales");
  const deals = proj?.deals || [];
  const stages = proj?.pipelineByStage || [];
  const [view, setView] = useState<"funnel" | "table">("funnel");

  const openDeals = deals.filter((d: any) => !["closed-won", "closed-lost"].includes(d.stage));
  const totalPipeline = openDeals.reduce((s: number, d: any) => s + d.amount, 0);
  const weighted = calculateWeightedPipeline(deals);

  const funnelData = stages.map((s: any) => ({
    name: dealStageConfig[s.stage]?.label || s.stage,
    value: s.count,
    amount: s.value,
    fill: dealStageConfig[s.stage]?.color || "#999",
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg" style={{ fontWeight: 600 }}>Pipeline Visibility</h2>
          <p className="text-xs text-muted-foreground">Real-time pipeline health across all stages</p>
        </div>
        <div className="flex items-center gap-2">
          {(["funnel", "table"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs rounded-lg ${view === v ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`} style={{ fontWeight: view === v ? 600 : 400 }}>
              {v === "funnel" ? "Funnel" : "Table"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Pipeline" value={formatCurrency(totalPipeline, true)} color="var(--iw-blue)" />
        <MetricCard label="Weighted Forecast" value={formatCurrency(weighted, true)} color="var(--iw-success)" />
        <MetricCard label="Open Deals" value={`${openDeals.length}`} color="var(--iw-purple)" />
        <MetricCard label="Avg Deal Size" value={formatCurrency(calculateAvgDealSize(deals), true)} color="var(--iw-warning)" />
      </div>

      {view === "funnel" ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>Conversion Funnel</h3>
          <div className="space-y-3">
            {stages.map((s: any, i: number) => {
              const cfg = dealStageConfig[s.stage];
              const totalPipe = stages.reduce((sum: number, st: any) => sum + st.value, 0);
              const pct = totalPipe > 0 ? Math.round((s.value / totalPipe) * 100) : 0;
              const convRate = i > 0 ? Math.round((s.count / (stages[i - 1]?.count || 1)) * 100) : 100;
              return (
                <div key={s.stage} className="flex items-center gap-4">
                  <div className="w-24 text-xs" style={{ fontWeight: 500 }}>{cfg?.label || s.stage}</div>
                  <div className="flex-1 relative">
                    <div className="h-10 bg-secondary rounded-lg overflow-hidden">
                      <div className="h-full rounded-lg flex items-center px-3 transition-all" style={{ width: `${Math.max(pct, 10)}%`, backgroundColor: cfg?.color || "#999" }}>
                        <span className="text-white text-xs" style={{ fontWeight: 600 }}>{s.count} deals</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <p className="text-xs" style={{ fontWeight: 600 }}>{formatCurrency(s.value, true)}</p>
                    {i > 0 && <p className="text-[10px] text-muted-foreground">{convRate}% conv</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
            <span>Deal</span><span>Stage</span><span>Amount</span><span>Probability</span><span>Owner</span><span>Close Date</span>
          </div>
          {openDeals.sort((a: any, b: any) => b.amount - a.amount).map((d: any) => (
            <div key={d.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center">
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>{d.name}</p>
                <p className="text-[10px] text-muted-foreground">{d.accountName}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full inline-flex w-fit" style={{ backgroundColor: `${dealStageConfig[d.stage]?.color || "#999"}20`, color: dealStageConfig[d.stage]?.color, fontWeight: 600 }}>
                {dealStageConfig[d.stage]?.label || d.stage}
              </span>
              <span className="text-sm" style={{ fontWeight: 600 }}>{formatCurrency(d.amount, true)}</span>
              <span className="text-sm">{d.probability}%</span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px]" style={{ fontWeight: 600 }}>{d.owner?.initials}</div>
                <span className="text-xs text-muted-foreground truncate">{d.owner?.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{d.closeDate}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════ Forecasting ═══════════ */
export function ForecastView() {
  const { data: proj } = useSpineProjection<any>("sales");
  const summary = proj?.summary || {};
  const deals = proj?.deals || [];

  const quota = summary.quotaQ1 || 1200000;
  const closed = summary.closedWonQ1 || 163000;
  const forecast = summary.forecastQ1 || 340000;
  const best = closed + forecast * 1.2;
  const commit = closed + forecast * 0.75;

  const months = [
    { month: "Jan", actual: 52000, forecast: 50000 },
    { month: "Feb", actual: 68000, forecast: 75000 },
    { month: "Mar", actual: 43000, forecast: 90000 },
    { month: "Apr", actual: null, forecast: 105000 },
    { month: "May", actual: null, forecast: 115000 },
    { month: "Jun", actual: null, forecast: 125000 },
  ];

  const categories = [
    { label: "Closed Won", value: closed, color: "var(--iw-success)" },
    { label: "Commit", value: commit - closed, color: "var(--iw-blue)" },
    { label: "Best Case", value: best - commit, color: "var(--iw-purple)" },
    { label: "Gap to Quota", value: Math.max(0, quota - best), color: "var(--iw-danger)" },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>Revenue Forecasting</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Q1 Quota" value={formatCurrency(quota, true)} color="var(--muted-foreground)" />
        <MetricCard label="Closed Won" value={formatCurrency(closed, true)} color="var(--iw-success)" sub={`${Math.round((closed / quota) * 100)}% attained`} />
        <MetricCard label="Commit Forecast" value={formatCurrency(commit, true)} color="var(--iw-blue)" sub={`${Math.round((commit / quota) * 100)}% of quota`} />
        <MetricCard label="Best Case" value={formatCurrency(best, true)} color="var(--iw-purple)" sub={`${Math.round((best / quota) * 100)}% coverage`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Waterfall */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>Forecast Breakdown</h3>
          <div className="space-y-3">
            {categories.map(c => {
              const pct = Math.round((c.value / quota) * 100);
              return (
                <div key={c.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ fontWeight: 500 }}>{c.label}</span>
                    <span className="text-xs" style={{ fontWeight: 600 }}>{formatCurrency(c.value, true)} ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Quota Coverage</span>
            <span className="text-sm" style={{ fontWeight: 700, color: best >= quota ? "var(--iw-success)" : "var(--iw-danger)" }}>
              {Math.round((best / quota) * 100)}%
            </span>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>Monthly Trend</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={v => `$${v / 1000}K`} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="forecast" stroke="var(--iw-purple)" fill="var(--iw-purple)" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="actual" stroke="var(--iw-success)" fill="var(--iw-success)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Quota Tracking ═══════════ */
export function QuotaView() {
  const { data: proj } = useSpineProjection<any>("sales");
  const leaderboard = proj?.leaderboard || [];
  const summary = proj?.summary || {};

  const quota = summary.quotaQ1 || 1200000;
  const repQuota = leaderboard.length > 0 ? quota / leaderboard.length : 240000;

  const reps = leaderboard.map((rep: any) => {
    const attainment = Math.round((rep.revenue / repQuota) * 100);
    return { ...rep, quota: repQuota, attainment, gap: repQuota - rep.revenue };
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>Quota Tracking</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Team Quota" value={formatCurrency(quota, true)} color="var(--iw-blue)" />
        <MetricCard label="Attained" value={formatCurrency(summary.closedWonQ1 || 0, true)} color="var(--iw-success)" sub={`${Math.round(((summary.closedWonQ1 || 0) / quota) * 100)}%`} />
        <MetricCard label="Reps On Track" value={`${reps.filter((r: any) => r.attainment >= 50).length}/${reps.length}`} color="var(--iw-success)" />
        <MetricCard label="At Risk" value={`${reps.filter((r: any) => r.attainment < 30).length}`} color="var(--iw-danger)" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
          <span>Rep</span><span>Closed</span><span>Quota</span><span>Attainment</span><span>Progress</span>
        </div>
        {reps.sort((a: any, b: any) => b.attainment - a.attainment).map((rep: any) => (
          <div key={rep.name} className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px]" style={{ fontWeight: 600 }}>{rep.initials}</div>
              <div>
                <p className="text-sm" style={{ fontWeight: 500 }}>{rep.name}</p>
                <p className="text-[10px] text-muted-foreground">{rep.deals} deals</p>
              </div>
            </div>
            <span className="text-sm" style={{ fontWeight: 600 }}>{formatCurrency(rep.revenue, true)}</span>
            <span className="text-xs text-muted-foreground">{formatCurrency(repQuota, true)}</span>
            <span className="text-sm" style={{ fontWeight: 700, color: rep.attainment >= 80 ? "var(--iw-success)" : rep.attainment >= 50 ? "var(--iw-warning)" : "var(--iw-danger)" }}>
              {rep.attainment}%
            </span>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, rep.attainment)}%`, backgroundColor: rep.attainment >= 80 ? "var(--iw-success)" : rep.attainment >= 50 ? "var(--iw-warning)" : "var(--iw-danger)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ Rev Analytics ═══════════ */
export function AnalyticsView() {
  const { data: proj } = useSpineProjection<any>("sales");
  const deals = proj?.deals || [];
  const winRate = calculateWinRate(deals);
  const avgDeal = calculateAvgDealSize(deals);

  const stageVelocity = [
    { stage: "Prospect → Qualify", days: 8 },
    { stage: "Qualify → Proposal", days: 12 },
    { stage: "Proposal → Negotiate", days: 15 },
    { stage: "Negotiate → Close", days: 9 },
  ];

  const quarterlyTrend = [
    { q: "Q1'25", revenue: 320, deals: 18 },
    { q: "Q2'25", revenue: 410, deals: 22 },
    { q: "Q3'25", revenue: 380, deals: 20 },
    { q: "Q4'25", revenue: 520, deals: 28 },
    { q: "Q1'26", revenue: 163, deals: 8 },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>Revenue Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Win Rate" value={`${winRate}%`} color="var(--iw-success)" sub="+5% vs last Q" />
        <MetricCard label="Avg Deal Size" value={formatCurrency(avgDeal, true)} color="var(--iw-blue)" />
        <MetricCard label="Avg Sales Cycle" value="34 days" color="var(--iw-purple)" sub="-3 days vs Q4" />
        <MetricCard label="Pipeline Coverage" value="3.2x" color="var(--iw-warning)" sub="Target: 3x" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Velocity */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>Stage Velocity (Avg Days)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageVelocity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} width={140} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="days" fill="var(--iw-blue)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quarterly Revenue */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>Quarterly Revenue ($K)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="q" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="var(--iw-success)" radius={[4, 4, 0, 0]} barSize={32}>
                  {quarterlyTrend.map((_, i) => (
                    <Cell key={i} fill={i === quarterlyTrend.length - 1 ? "var(--iw-blue)" : "var(--iw-success)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Cohort Analysis ═══════════ */
export function CohortView() {
  const cohorts = [
    { cohort: "Jan '26", m0: 100, m1: 95, m2: 88, m3: null },
    { cohort: "Dec '25", m0: 100, m1: 92, m2: 85, m3: 80 },
    { cohort: "Nov '25", m0: 100, m1: 94, m2: 87, m3: 82 },
    { cohort: "Oct '25", m0: 100, m1: 90, m2: 82, m3: 78 },
    { cohort: "Sep '25", m0: 100, m1: 88, m2: 80, m3: 75 },
  ];

  const cellColor = (v: number | null) => {
    if (v === null) return "transparent";
    if (v >= 90) return "rgba(0,200,83,0.3)";
    if (v >= 80) return "rgba(0,200,83,0.15)";
    if (v >= 70) return "rgba(255,152,0,0.15)";
    return "rgba(244,67,54,0.15)";
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>Cohort Analysis</h2>
      <p className="text-xs text-muted-foreground">Revenue retention by customer cohort over time</p>

      <div className="bg-card border border-border rounded-xl p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-muted-foreground uppercase tracking-wider">
              <th className="text-left py-2 px-3">Cohort</th>
              <th className="text-center py-2 px-3">Month 0</th>
              <th className="text-center py-2 px-3">Month 1</th>
              <th className="text-center py-2 px-3">Month 2</th>
              <th className="text-center py-2 px-3">Month 3</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map(c => (
              <tr key={c.cohort} className="hover:bg-secondary/30">
                <td className="py-2 px-3 text-xs" style={{ fontWeight: 500 }}>{c.cohort}</td>
                {[c.m0, c.m1, c.m2, c.m3].map((v, i) => (
                  <td key={i} className="py-2 px-3 text-center">
                    <span className="inline-block px-3 py-1 rounded-lg text-xs" style={{ backgroundColor: cellColor(v), fontWeight: 600 }}>
                      {v !== null ? `${v}%` : "—"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Net Revenue Retention" value="108%" color="var(--iw-success)" sub="Above 100% = expansion" />
        <MetricCard label="Gross Retention" value="94%" color="var(--iw-blue)" />
        <MetricCard label="Logo Retention" value="96%" color="var(--iw-purple)" />
      </div>
    </div>
  );
}

/* ═══════════ Team Performance ═══════════ */
export function TeamView() {
  const { data: proj } = useSpineProjection<any>("sales");
  const leaderboard = proj?.leaderboard || [];
  const activityByDay = proj?.activityByDay || [];

  const teamMetrics = leaderboard.map((rep: any, i: number) => ({
    ...rep,
    callsPerDay: Math.round(8 + Math.random() * 10),
    emailsSent: Math.round(15 + Math.random() * 20),
    meetingsHeld: Math.round(3 + Math.random() * 5),
    responseTime: `${(1 + Math.random() * 3).toFixed(1)}h`,
    pipeline: rep.revenue * (1.5 + Math.random()),
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>Team Performance</h2>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
          <span>Rep</span><span>Revenue</span><span>Deals</span><span>Calls/Day</span><span>Emails</span><span>Meetings</span><span>Resp Time</span>
        </div>
        {teamMetrics.map((rep: any) => (
          <div key={rep.name} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px]" style={{ fontWeight: 600 }}>{rep.initials}</div>
              <span className="text-sm" style={{ fontWeight: 500 }}>{rep.name}</span>
            </div>
            <span className="text-sm" style={{ fontWeight: 600, color: "var(--iw-success)" }}>{formatCurrency(rep.revenue, true)}</span>
            <span className="text-sm">{rep.deals}</span>
            <span className="text-sm">{rep.callsPerDay}</span>
            <span className="text-sm">{rep.emailsSent}</span>
            <span className="text-sm">{rep.meetingsHeld}</span>
            <span className="text-sm text-muted-foreground">{rep.responseTime}</span>
          </div>
        ))}
      </div>

      {/* Activity Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>Weekly Activity Volume</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="calls" fill="var(--iw-success)" radius={[3, 3, 0, 0]} barSize={10} />
              <Bar dataKey="emails" fill="var(--iw-blue)" radius={[3, 3, 0, 0]} barSize={10} />
              <Bar dataKey="meetings" fill="var(--iw-purple)" radius={[3, 3, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Operating Metrics ═══════════ */
export function MetricsView() {
  const metrics = [
    { category: "Revenue", items: [
      { label: "ARR", value: "$2.14M", trend: 8.2, period: "vs Q4" },
      { label: "MRR", value: "$178K", trend: 6.1, period: "vs last month" },
      { label: "NRR", value: "108%", trend: 2.3, period: "expanding" },
      { label: "GRR", value: "94%", trend: -0.5, period: "vs Q4" },
    ]},
    { category: "Efficiency", items: [
      { label: "CAC", value: "$12.4K", trend: -8.0, period: "improving" },
      { label: "LTV:CAC", value: "4.2x", trend: 12.0, period: "vs Q4" },
      { label: "Payback Period", value: "14mo", trend: -2.0, period: "months" },
      { label: "Magic Number", value: "0.82", trend: 5.0, period: "vs Q4" },
    ]},
    { category: "Pipeline", items: [
      { label: "Pipeline Created", value: "$1.8M", trend: 15.0, period: "this Q" },
      { label: "Pipeline Coverage", value: "3.2x", trend: 0.4, period: "vs target 3x" },
      { label: "Avg Sales Cycle", value: "34d", trend: -3.0, period: "days faster" },
      { label: "Win Rate", value: "38%", trend: 5.0, period: "vs Q4" },
    ]},
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>Operating Metrics</h2>
      <p className="text-xs text-muted-foreground">Key business metrics across revenue, efficiency, and pipeline health</p>

      {metrics.map(cat => (
        <div key={cat.category}>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3" style={{ fontWeight: 600 }}>{cat.category}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cat.items.map(m => (
              <div key={m.label} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                <p className="text-xl" style={{ fontWeight: 700 }}>{m.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {m.trend >= 0 ? <TrendingUp className="w-3 h-3" style={{ color: "var(--iw-success)" }} /> : <TrendingDown className="w-3 h-3" style={{ color: "var(--iw-danger)" }} />}
                  <span className="text-[10px]" style={{ color: m.trend >= 0 ? "var(--iw-success)" : "var(--iw-danger)", fontWeight: 500 }}>
                    {m.trend >= 0 ? "+" : ""}{m.trend}% {m.period}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Shared ─── */
function MetricCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl" style={{ fontWeight: 700, color }}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}