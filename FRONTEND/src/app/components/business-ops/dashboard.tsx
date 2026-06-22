/**
 * Ops Dashboard — L1 Workspace Surface
 * 
 * Rule: All data comes from SSOT (Spine) projections only.
 * No tool-specific schemas. Everything speaks canonical Spine language.
 */
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Plug,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  Zap,
  Database,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useSpineProjection } from "../spine/spine-client";
import { ReadinessBar, ProvenanceBadge } from "../spine/readiness-bar";

// Type for the BizOps projection from Spine
interface BizOpsProjection {
  department: string;
  readiness: any;
  summary: {
    totalARR: number;
    arrGrowth: number;
    operationalHealth: number;
    activeIntegrations: number;
    totalIntegrations: number;
    teamUtilization: number;
  };
  accounts: any[];
  revenueTimeline: { month: string; arr: number; mrr: number }[];
  teamCapacity: { name: string; utilization: number }[];
  actionItems: { id: number; title: string; priority: string; type: string; due: string; source?: string }[];
  recentActivity: { id: number; action: string; entity: string; entityId: string; time: string; icon: string; source: string }[];
  connectorStatuses: { id: string; name: string; icon: string; status: string; entitiesNormalized: number; confidence: number }[];
}

const priorityColors: Record<string, string> = {
  urgent: "bg-[var(--iw-danger)]/10 text-[var(--iw-danger)]",
  high: "bg-[var(--iw-warning)]/10 text-[var(--iw-warning)]",
  medium: "bg-[var(--iw-blue)]/10 text-[var(--iw-blue)]",
  low: "bg-[var(--iw-success)]/10 text-[var(--iw-success)]",
};

export function OpsDashboard() {
  const { data: projection, loading, error } = useSpineProjection<BizOpsProjection>("ops");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading SSOT projection...</span>
        </div>
      </div>
    );
  }

  if (error || !projection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Database className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Spine not ready. Complete onboarding to populate SSOT.</p>
          {error && <p className="text-xs text-[var(--iw-danger)]">{error}</p>}
        </div>
      </div>
    );
  }

  const { summary, revenueTimeline, teamCapacity, actionItems, recentActivity, connectorStatuses } = projection;

  // Derive chart data — all values from Spine, scaled for display
  const chartData = revenueTimeline.map((d) => ({
    month: d.month,
    arr: Math.round(d.arr / 1000000 * 10) / 10,
    mrr: Math.round(d.mrr / 1000000 * 100) / 100,
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* SSOT Readiness Bar */}
      <ReadinessBar department="ops" />

      {/* KPI Cards Row — All values derived from Spine */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Annual Recurring Revenue"
          value={`$${(summary.totalARR / 1000000).toFixed(1)}M`}
          change={`${summary.arrGrowth > 0 ? "+" : ""}${summary.arrGrowth.toFixed(1)}%`}
          positive={summary.arrGrowth > 0}
          subtitle={`MRR: $${Math.round(summary.totalARR / 12 / 1000)}K`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="var(--iw-blue)"
        />
        <KPICard
          title="Operational Health"
          value={`${summary.operationalHealth}%`}
          change={summary.operationalHealth >= 90 ? "Healthy" : "Needs attention"}
          positive={summary.operationalHealth >= 80}
          subtitle="SLA Compliance"
          icon={<Activity className="w-4 h-4" />}
          color="var(--iw-success)"
        />
        <KPICard
          title="Active Integrations"
          value={`${summary.activeIntegrations}/${summary.totalIntegrations}`}
          change={`${summary.activeIntegrations} normalized`}
          positive={summary.activeIntegrations > 0}
          subtitle={`${Math.round((summary.activeIntegrations / summary.totalIntegrations) * 100)}% connected`}
          icon={<Plug className="w-4 h-4" />}
          color={summary.activeIntegrations > 0 ? "var(--iw-success)" : "var(--iw-warning)"}
        />
        <KPICard
          title="Team Utilization"
          value={`${summary.teamUtilization}%`}
          change={summary.teamUtilization > 80 ? "High load" : "Normal"}
          positive={summary.teamUtilization <= 85}
          subtitle={`${teamCapacity.length} active members`}
          icon={<Users className="w-4 h-4" />}
          color="var(--iw-purple)"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend - from Spine accounts */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3>Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">ARR & MRR from normalized account data</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--iw-blue)]" />
                ARR ($M)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--iw-purple)]" />
                MRR ($M)
              </span>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="arrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--iw-blue)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--iw-blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
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
                  dataKey="arr"
                  stroke="var(--iw-blue)"
                  fill="url(#arrGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="var(--iw-purple)"
                  fill="transparent"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Capacity */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3>Team Capacity</h3>
            <span className="text-[10px] text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">IST</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamCapacity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  width={65}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(val: number) => `${val}%`}
                />
                <Bar
                  dataKey="utilization"
                  fill="var(--iw-purple)"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row — Action Items + Activity (derived from Spine entities) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Items — Derived from at-risk accounts, expiring renewals, SLA breaches */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3>Today's Action Items</h3>
            <span className="text-xs text-muted-foreground">{actionItems.length} items</span>
          </div>
          <div className="space-y-2">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition-colors group"
              >
                <div className="flex-shrink-0">
                  {item.type === "escalation" ? (
                    <AlertTriangle className="w-4 h-4 text-[var(--iw-warning)]" />
                  ) : item.type === "approval" ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--iw-blue)]" />
                  ) : (
                    <Zap className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.title}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityColors[item.priority] || ""}`} style={{ fontWeight: 500 }}>
                  {item.priority}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.due}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity — From normalized canonical activities */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3>Recent Activity</h3>
            <button className="text-xs text-primary flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition-colors"
              >
                <span className="text-sm">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.action}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                  {item.entity}
                </span>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">{item.time}</span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Connect tools to see normalized activity data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Spine Connector Status — Shows which connectors feed the SSOT */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3>Spine Data Sources</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">SSOT</span>
          </div>
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--iw-success)]" /> Connected ({connectorStatuses.length})
            </span>
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" /> Entities: {projection.accounts.length + (projection as any).recentActivity?.length || 0}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {connectorStatuses.map((cs) => (
            <div
              key={cs.id}
              className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <span className="text-sm">{cs.icon}</span>
              <div className="min-w-0 flex-1">
                <span className="text-xs truncate block">{cs.name}</span>
                <span className="text-[9px] text-muted-foreground">{cs.entitiesNormalized} entities</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[var(--iw-success)] flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  change,
  positive,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl mb-1" style={{ fontWeight: 600, color }}>{value}</div>
      <div className="flex items-center gap-2">
        <span
          className={`text-[11px] flex items-center gap-0.5 ${
            positive ? "text-[var(--iw-success)]" : "text-[var(--iw-warning)]"
          }`}
          style={{ fontWeight: 500 }}
        >
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
        <span className="text-[11px] text-muted-foreground">{subtitle}</span>
      </div>
    </div>
  );
}
