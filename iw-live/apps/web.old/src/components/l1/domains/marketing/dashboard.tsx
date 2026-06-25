/**
 * Marketing Dashboard — MQLs, SQLs, campaign ROI, pipeline generated
 * Data from Spine Marketing projection.
 */
import {
  Target,
  Users,
  TrendingUp,
  BarChart3,
  Loader2,
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
  Cell,
} from "recharts";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { ReadinessBar } from "@/components/l2/spine/readiness-bar";

export function MarketingDashboard() {
  const { data: projection, loading } = useHydrateProjection<any>("marketing");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = projection?.summary || {};
  const campaigns = projection?.campaigns || [];
  const leads = projection?.leads || [];

  const mqls = summary.mqls ?? 0;
  const sqlConversionRate = summary.sqlConversionRate ?? 0;
  const campaignRoi = summary.campaignRoi ?? 0;
  const pipelineGenerated = summary.pipelineGenerated ?? 0;

  // Monthly trend — from projection or empty
  const monthlyTrend = projection?.monthlyTrend || [];

  // Campaign performance — from projection or campaigns
  const campaignPerformance =
    projection?.campaignPerformance ||
    campaigns.slice(0, 4).map((c: any) => ({
      name: c.name || "Campaign",
      leads: c.leads || 0,
      roi: c.roi || 0,
    }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="marketing" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          title="MQLs (Month)"
          value={String(mqls)}
          icon={<Target className="w-4 h-4" />}
          color="var(--iw-pink)"
        />
        <KPI
          title="MQL → SQL Rate"
          value={`${sqlConversionRate}%`}
          icon={<Users className="w-4 h-4" />}
          color="var(--iw-forest-mid)"
        />
        <KPI
          title="Campaign ROI"
          value={`${campaignRoi}%`}
          icon={<BarChart3 className="w-4 h-4" />}
          color="var(--iw-success)"
        />
        <KPI
          title="Pipeline Generated"
          value={`$${(pipelineGenerated / 1000000).toFixed(2)}M`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="var(--iw-warning)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MQL & SQL Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Lead Generation Trend</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
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
                  dataKey="mql"
                  stroke="var(--iw-pink)"
                  fill="var(--iw-pink)"
                  fillOpacity={0.1}
                  name="MQL"
                />
                <Area
                  type="monotone"
                  dataKey="sql"
                  stroke="var(--iw-forest-mid)"
                  fill="var(--iw-forest-mid)"
                  fillOpacity={0.1}
                  name="SQL"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Campaigns by ROI */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Top Campaigns</h3>
          <div className="space-y-3">
            {campaignPerformance.map((camp: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ fontWeight: 500 }}>{camp.name}</span>
                  <span className="text-muted-foreground">{camp.roi}% ROI</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-secondary relative">
                  <div
                    className="h-full rounded-full bg-[var(--iw-pink)]"
                    style={{ width: `${Math.min((camp.roi / 400) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-4">Campaign Performance</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={campaignPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="leads"
                fill="var(--iw-forest-mid)"
                radius={[4, 4, 0, 0]}
              />
              <Bar yAxisId="right" dataKey="roi" fill="var(--iw-pink)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KPI({
  title,
  value,
  change,
  positive,
  icon,
  color,
}: {
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <p className="text-xl" style={{ fontWeight: 700, color }}>
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {positive ? (
                <ArrowUpRight className="w-3 h-3 text-[var(--iw-success)]" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-[var(--iw-danger)]" />
              )}
              <p className="text-xs text-muted-foreground">{change}</p>
            </div>
          )}
        </div>
        <div className="p-2 rounded-lg bg-secondary" style={{ color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
