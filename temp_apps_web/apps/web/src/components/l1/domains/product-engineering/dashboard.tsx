/**
 * Product Dashboard — Sprint velocity, open bugs, cycle time, deployments
 * Data from Spine Engineering projection.
 */
import {
  Zap,
  AlertTriangle,
  Clock,
  TrendingUp,
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

export function ProductDashboard() {
  const { data: projection, loading } = useHydrateProjection<any>("product");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = projection?.summary || {};
  const sprints = projection?.sprints || [];
  const bugs = projection?.bugs || [];

  const velocity = summary.velocity ?? 0;
  const openBugs = summary.openBugs ?? 0;
  const cycleTime = summary.cycleTime ?? 0;
  const deploymentFreq = summary.deploymentFreq ?? 0;

  // Sprint trend — from projection or empty
  const sprintTrend = projection?.sprintTrend || [];

  // Bug severity distribution — from projection or empty
  const bugSeverity = projection?.bugSeverity || [];

  // Deployment frequency — from projection or empty
  const deploymentTrend = projection?.deploymentTrend || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="engineering" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          title="Sprint Velocity"
          value={String(velocity)}
          change="story points/sprint"
          positive
          icon={<Zap className="w-4 h-4" />}
          color="var(--iw-forest-mid)"
        />
        <KPI
          title="Open Bugs"
          value={String(openBugs)}
          change="2 critical"
          positive={openBugs < 15}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="var(--iw-danger)"
        />
        <KPI
          title="Cycle Time"
          value={`${cycleTime}d`}
          change="-1d improvement"
          positive
          icon={<Clock className="w-4 h-4" />}
          color="var(--iw-success)"
        />
        <KPI
          title="Deployment Freq"
          value={`${deploymentFreq}x/w`}
          change="Per week"
          positive
          icon={<TrendingUp className="w-4 h-4" />}
          color="var(--iw-purple)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sprint Velocity */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Sprint Velocity Trend</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sprintTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="sprint" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="planned"
                  fill="var(--iw-forest-mid)"
                  radius={[4, 4, 0, 0]}
                  name="Planned"
                />
                <Bar
                  dataKey="completed"
                  fill="var(--iw-success)"
                  radius={[4, 4, 0, 0]}
                  name="Completed"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bug Severity */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Bug Severity</h3>
          <div className="space-y-3">
            {bugSeverity.map((bug: any) => {
              const total = bugSeverity.reduce((s: any, b: any) => s + b.count, 0);
              const pct = Math.round((bug.count / total) * 100);
              return (
                <div key={bug.severity}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ fontWeight: 500 }}>{bug.severity}</span>
                    <span className="text-muted-foreground">
                      {bug.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-secondary relative">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: bug.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Deployment Frequency */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-4">Deployment Frequency</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={deploymentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
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
                dataKey="deployments"
                stroke="var(--iw-forest-mid)"
                fill="var(--iw-forest-mid)"
                fillOpacity={0.1}
              />
            </AreaChart>
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
