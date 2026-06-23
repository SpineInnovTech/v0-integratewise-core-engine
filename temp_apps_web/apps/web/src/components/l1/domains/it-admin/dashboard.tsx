/**
 * IT Admin Dashboard — Active users, connected apps, API health, security incidents, uptime
 * Data from Spine IT projection.
 */
import {
  Users,
  Plug,
  Activity,
  AlertTriangle,
  BarChart3,
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
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { ReadinessBar } from "@/components/l2/spine/readiness-bar";

export function ITAdminDashboard() {
  const { data: projection, loading } = useHydrateProjection<any>("it_admin");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = projection?.summary || {};
  const activeUsers = summary.activeUsers ?? 0;
  const connectedApps = summary.connectedApps ?? 0;
  const apiHealth = summary.apiHealth ?? 0;
  const securityIncidents = summary.securityIncidents ?? 0;

  // Daily active users — from projection or empty
  const usersTrend = projection?.usersTrend || [];

  // API uptime by region — from projection or empty
  const uptimeTrend = projection?.uptimeTrend || [];

  // Connected app status — from projection or empty
  const appStatus = projection?.appStatus || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="it_admin" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          title="Active Users"
          value={String(activeUsers)}
          change="18 offline"
          positive
          icon={<Users className="w-4 h-4" />}
          color="var(--iw-forest-mid)"
        />
        <KPI
          title="Connected Apps"
          value={String(connectedApps)}
          change="2 in maintenance"
          positive
          icon={<Plug className="w-4 h-4" />}
          color="var(--iw-success)"
        />
        <KPI
          title="API Health"
          value={`${apiHealth}%`}
          change="Global uptime"
          positive={apiHealth > 99}
          icon={<Activity className="w-4 h-4" />}
          color="var(--iw-teal)"
        />
        <KPI
          title="Security Incidents"
          value={String(securityIncidents)}
          change="This month"
          positive={securityIncidents < 5}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="var(--iw-warning)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Users Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Daily Active Users</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usersTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
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
                  dataKey="active"
                  stroke="var(--iw-forest-mid)"
                  fill="var(--iw-forest-mid)"
                  fillOpacity={0.1}
                  name="Active"
                />
                <Area
                  type="monotone"
                  dataKey="inactive"
                  stroke="var(--iw-muted)"
                  fill="var(--iw-muted)"
                  fillOpacity={0.05}
                  name="Inactive"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* App Status */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Connected Apps Status</h3>
          <div className="space-y-3">
            {appStatus.map((stat: any) => (
              <div key={stat.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ fontWeight: 500 }}>{stat.name}</span>
                  <span className="text-muted-foreground">{stat.count}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-secondary relative">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((stat.count / connectedApps) * 100)}%`,
                      background: stat.fill,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API Uptime by Region */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-4">API Uptime by Region</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={uptimeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="region" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis
                domain={[99, 100]}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `${v}%`}
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
              <Bar dataKey="uptime" fill="var(--iw-forest-mid)" radius={[4, 4, 0, 0]} />
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
  change: string;
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
          <div className="flex items-center gap-1 mt-2">
            {positive ? (
              <ArrowUpRight className="w-3 h-3 text-[var(--iw-success)]" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-[var(--iw-danger)]" />
            )}
            <p className="text-xs text-muted-foreground">{change}</p>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-secondary" style={{ color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
