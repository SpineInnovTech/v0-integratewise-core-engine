/**
 * BizOps — Metrics Dashboard
 * MRR, Pipeline, Revenue YTD, Active Projects, Web Analytics, AI Insights.
 */
import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Globe,
  Zap,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
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
} from "recharts";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { formatCurrency, type BizMetric, type AIBusinessInsight } from "./bizops-data";

const METRIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mrr: DollarSign,
  pipeline: TrendingUp,
  revenue_ytd: DollarSign,
  active_projects: BarChart3,
  page_views: Globe,
  visitors: Users,
  conversions: TrendingUp,
};

export function MetricsView() {
  const { data: metrics, isLoading, refetch } = useWorkspaceEntities<BizMetric>("ops_metric");
  const { data: insights } = useWorkspaceEntities<AIBusinessInsight>("generated_insight");
  const { data: projection } = useHydrateProjection<any>("bizops");
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const trendData = projection?.metricsTrend || [];

  const keyMetrics = [
    { id: "mrr", label: "MRR", source: "Razorpay / Stripe" },
    { id: "pipeline", label: "Pipeline Value", source: "CRM" },
    { id: "revenue_ytd", label: "Revenue YTD", source: "Billing" },
    { id: "active_projects", label: "Active Projects", source: "Task system" },
    { id: "page_views", label: "Page Views", source: "Google Analytics" },
    { id: "visitors", label: "Visitors", source: "Google Analytics" },
    { id: "conversions", label: "Conversions", source: "Analytics + CRM" },
  ];

  const getMetric = (id: string) =>
    metrics.find((m) => m.id === id || m.name.toLowerCase().replace(/\s+/g, "_") === id);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--iw-forest-mid)]" /> Metrics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live business metrics from all connected sources
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-0.5 bg-secondary rounded-md">
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-xs transition-all ${period === p ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                style={{ fontWeight: period === p ? 500 : 400 }}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={refetch}
            className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {keyMetrics.map(({ id, label, source }) => {
          const m = getMetric(id);
          const Icon = METRIC_ICONS[id] || BarChart3;
          const value = m
            ? m.unit === "currency"
              ? formatCurrency(m.value)
              : m.unit === "percentage"
                ? `${m.value}%`
                : m.value.toLocaleString()
            : "—";
          const change = m?.change ?? 0;
          const positive = m ? m.changeDirection !== "down" : true;
          return (
            <div key={id} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">{label}</span>
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="text-xl font-bold">{value}</div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {positive ? (
                  <ArrowUpRight className="w-3 h-3 text-[var(--iw-success)]" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-[var(--iw-danger)]" />
                )}
                <span className="text-[10px] text-muted-foreground">
                  {change !== 0 ? `${change > 0 ? "+" : ""}${change}%` : source}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend chart */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Metrics Trend ({period})</h3>
        {trendData.length > 0 ? (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="mrrG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--iw-success)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--iw-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="var(--iw-success)"
                  fill="url(#mrrG)"
                  strokeWidth={2}
                  name="MRR"
                />
                <Area
                  type="monotone"
                  dataKey="pipeline"
                  stroke="var(--iw-forest-mid)"
                  fill="transparent"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  name="Pipeline"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
            Connect billing and CRM to see metric trends
          </div>
        )}
      </div>

      {/* AI Business Insights */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[var(--iw-pink)]" /> AI Business Insights
          <span className="text-[10px] text-muted-foreground font-normal ml-auto">
            Twin-generated signals
          </span>
        </h3>
        {insights.length > 0 ? (
          <div className="space-y-2">
            {insights.slice(0, 6).map((insight) => (
              <div
                key={insight.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${insight.priority === "high" ? "bg-[var(--iw-danger)]" : insight.priority === "medium" ? "bg-[var(--iw-warning)]" : "bg-[var(--iw-forest-mid)]"}`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{insight.signal}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{insight.recommendation}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {insight.module} · {insight.generatedAt}
                  </span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${insight.status === "new" ? "bg-[var(--iw-forest-mid)]/10 text-[var(--iw-forest-mid)]" : "bg-secondary text-muted-foreground"}`}
                >
                  {insight.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            AI insights appear once data flows through the Spine
          </p>
        )}
      </div>
    </div>
  );
}

export default MetricsView;
