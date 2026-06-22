/**
 * RevOps Dashboard — Revenue intelligence: pipeline, forecast, quota, waterfall
 * Data from Spine Sales projection.
 */
import {
  DollarSign,
  TrendingUp,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useSpineProjection } from "../../spine/spine-client";
import { ReadinessBar } from "../../spine/readiness-bar";

export function RevOpsDashboard() {
  const { data: projection, loading } = useSpineProjection<any>("sales");

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const summary = projection?.summary || {};
  const pipelineByStage = projection?.pipelineByStage || [];
  const leaderboard = projection?.leaderboard || [];
  const deals = projection?.deals || [];

  const quotaAttainment = summary.quotaQ1 > 0 ? Math.round((summary.closedWonQ1 / summary.quotaQ1) * 100) : 0;
  const forecastAttainment = summary.quotaQ1 > 0 ? Math.round(((summary.closedWonQ1 + summary.forecastQ1) / summary.quotaQ1) * 100) : 0;

  // Revenue waterfall
  const waterfall = [
    { name: "Start ARR", value: 1480000 },
    { name: "Expansion", value: 245000 },
    { name: "New Biz", value: summary.closedWonQ1 || 163000 },
    { name: "Contraction", value: -42000 },
    { name: "Churn", value: -65000 },
    { name: "End ARR", value: 1781000 },
  ];

  const stageColors = ["#0066FF", "#7C4DFF", "#FF9800", "#FF4081"];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="sales" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Total Pipeline" value={`$${(summary.pipelineValue / 1000000 || 0).toFixed(2)}M`} change={`${pipelineByStage.length} stages`} positive icon={<DollarSign className="w-4 h-4" />} color="var(--iw-blue)" />
        <KPI title="Weighted Forecast" value={`$${Math.round((summary.forecastQ1 || 0) / 1000)}K`} change={`${forecastAttainment}% of quota`} positive={forecastAttainment >= 80} icon={<TrendingUp className="w-4 h-4" />} color="var(--iw-success)" />
        <KPI title="Quota Attainment" value={`${quotaAttainment}%`} change={`$${Math.round((summary.closedWonQ1 || 0) / 1000)}K closed`} positive={quotaAttainment >= 50} icon={<Target className="w-4 h-4" />} color="var(--iw-purple)" />
        <KPI title="Win Rate" value={`${summary.winRate || 0}%`} change="+5% vs last Q" positive icon={<Activity className="w-4 h-4" />} color="var(--iw-warning)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Waterfall */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Revenue Waterfall (Q1)</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfall}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(val: number) => `$${(Math.abs(val) / 1000).toFixed(0)}K`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {waterfall.map((entry, i) => (
                    <Cell key={i} fill={entry.value >= 0 ? (i === 0 || i === waterfall.length - 1 ? "var(--iw-blue)" : "var(--iw-success)") : "var(--iw-danger)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline by Stage */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Pipeline by Stage</h3>
          <div className="space-y-3">
            {pipelineByStage.map((stage: any, i: number) => {
              const totalPipeline = pipelineByStage.reduce((s: number, st: any) => s + st.value, 0);
              const pct = totalPipeline > 0 ? Math.round((stage.value / totalPipeline) * 100) : 0;
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ fontWeight: 500 }}>{stage.stage}</span>
                    <span className="text-muted-foreground">${(stage.value / 1000).toFixed(0)}K ({stage.count})</span>
                  </div>
                  <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: stageColors[i] || "var(--muted-foreground)" }} />
                  </div>
                </div>
              );
            })}
          </div>
          {pipelineByStage.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Connect a CRM to see pipeline data</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quota Tracking */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Q1 Quota Tracking</h3>
          <div className="space-y-4">
            {leaderboard.map((rep: any, i: number) => {
              const repQuota = (summary.quotaQ1 || 1200000) / leaderboard.length;
              const pct = Math.round((rep.revenue / repQuota) * 100);
              return (
                <div key={rep.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[var(--iw-blue)] flex items-center justify-center text-white text-[8px]" style={{ fontWeight: 600 }}>{rep.initials}</div>
                      <span style={{ fontWeight: 500 }}>{rep.name}</span>
                    </div>
                    <span className="text-muted-foreground">${(rep.revenue / 1000).toFixed(0)}K / ${(repQuota / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: pct >= 80 ? "var(--iw-success)" : pct >= 50 ? "var(--iw-warning)" : "var(--iw-danger)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Deals */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-3">Top Open Deals</h3>
          <div className="space-y-2">
            {deals
              .filter((d: any) => !["closed-won", "closed-lost"].includes(d.stage))
              .sort((a: any, b: any) => b.amount - a.amount)
              .slice(0, 5)
              .map((deal: any) => (
                <div key={deal.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-[var(--iw-blue)]/10 flex items-center justify-center text-xs font-semibold text-[var(--iw-blue)]">
                    {deal.owner?.initials || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ fontWeight: 500 }}>{deal.name}</div>
                    <div className="text-[10px] text-muted-foreground">{deal.accountName} · {deal.stage} · {deal.probability}%</div>
                  </div>
                  <span className="text-sm" style={{ fontWeight: 600 }}>${(deal.amount / 1000).toFixed(0)}K</span>
                </div>
              ))}
            {deals.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No deal data in SSOT</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ title, value, change, positive, icon, color }: { title: string; value: string; change: string; positive: boolean; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
      </div>
      <div className="text-2xl mb-0.5" style={{ fontWeight: 600, color }}>{value}</div>
      <div className={`text-[11px] flex items-center gap-0.5 ${positive ? "text-[var(--iw-success)]" : "text-[var(--iw-warning)]"}`}>
        {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {change}
      </div>
    </div>
  );
}
