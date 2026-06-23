/**
 * BizOps — Analytics & Reports View
 * Cross-domain aggregation from Spine SSOT bizops projection.
 */
import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Plug,
  Users,
  DollarSign,
  Activity,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { formatCurrency, healthColor } from "../spine-projection";

export function OpsAnalyticsView() {
  const { data: proj } = useHydrateProjection<any>("bizops");
  const revenueTrend = proj?.revenueTrend || proj?.revenue_trend || [];
  const integrationVolume = proj?.integrationVolume || proj?.integration_volume || [];
  const healthDistribution = proj?.healthDistribution || proj?.health_distribution || [];
  const regionBreakdown = proj?.regionBreakdown || proj?.region_breakdown || [];
  const summary = proj?.summary || {};

  const [period, setPeriod] = useState("6m");

  const totalArr = summary.totalArr ?? summary.total_arr ?? "—";
  const avgHealth = summary.avgHealthScore ?? summary.avg_health_score ?? "—";
  const apiCalls = summary.apiCalls24h ?? summary.api_calls_24h ?? "—";
  const activeUsers = summary.activeUsers ?? summary.active_users ?? "—";

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg" style={{ fontWeight: 600 }}>
            Analytics & Reports
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-system data aggregation and operational metrics
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex p-0.5 bg-secondary rounded-md">
            {["1m", "3m", "6m", "1y"].map((p) => (
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
          <button className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-md text-sm hover:bg-accent transition-colors">
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPI
          title="Total ARR"
          value={
            totalArr !== "—"
              ? typeof totalArr === "number"
                ? formatCurrency(totalArr, true)
                : totalArr
              : "—"
          }
          change={summary.arrChange ?? "—"}
          positive={(summary.arrChange ?? "").toString().includes("+")}
          icon={<DollarSign className="w-4 h-4" />}
          color="var(--iw-forest-mid)"
        />
        <KPI
          title="Avg Health Score"
          value={avgHealth !== "—" ? `${avgHealth}` : "—"}
          change={summary.healthChange ?? "—"}
          positive={(summary.healthChange ?? "").toString().includes("+")}
          icon={<Activity className="w-4 h-4" />}
          color="var(--iw-success)"
        />
        <KPI
          title="API Calls (24h)"
          value={
            apiCalls !== "—"
              ? typeof apiCalls === "number"
                ? apiCalls.toLocaleString()
                : apiCalls
              : "—"
          }
          change={summary.apiCallsChange ?? "—"}
          positive={(summary.apiCallsChange ?? "").toString().includes("+")}
          icon={<Plug className="w-4 h-4" />}
          color="var(--iw-gold)"
        />
        <KPI
          title="Active Users"
          value={activeUsers !== "—" ? `${activeUsers}` : "—"}
          change={summary.activeUsersChange ?? "—"}
          positive={(summary.activeUsersChange ?? "").toString().includes("+")}
          icon={<Users className="w-4 h-4" />}
          color="var(--iw-warning)"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm" style={{ fontWeight: 600 }}>
              Revenue vs Target ($K)
            </h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--iw-forest-mid)]" /> Revenue
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--iw-gold)]" /> Target
              </span>
            </div>
          </div>
          <div className="h-[240px]">
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="bizopsRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--iw-forest-mid)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--iw-forest-mid)" stopOpacity={0} />
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
                    dataKey="revenue"
                    stroke="var(--iw-forest-mid)"
                    fill="url(#bizopsRevGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="var(--iw-gold)"
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No revenue trend data yet. Connect your tools to populate.
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Account Health
          </h3>
          {healthDistribution.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {healthDistribution.map((entry: any) => (
                        <Cell key={entry.name} fill={entry.color || "var(--iw-forest-mid)"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {healthDistribution.map((h: any) => (
                  <div key={h.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: h.color || "var(--iw-forest-mid)" }}
                      />{" "}
                      {h.name}
                    </span>
                    <span style={{ fontWeight: 500 }}>{h.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              No health data yet
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Integration API Volume (24h)
          </h3>
          <div className="h-[220px]">
            {integrationVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={integrationVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
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
                    dataKey="calls"
                    fill="var(--iw-forest-mid)"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No integration data yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Revenue by Region ($K)
          </h3>
          {regionBreakdown.length > 0 ? (
            <div className="space-y-4">
              {regionBreakdown.map((r: any) => {
                const maxArr = Math.max(
                  ...regionBreakdown.map((reg: any) => reg.arr || reg.revenue || 0),
                  1
                );
                const arr = r.arr || r.revenue || 0;
                return (
                  <div key={r.region}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ fontWeight: 500 }}>
                        {r.region}
                      </span>
                      <span className="text-sm" style={{ fontWeight: 600 }}>
                        {formatCurrency(arr * 1000, true)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--iw-forest-mid)]"
                        style={{ width: `${(arr / maxArr) * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {r.accounts} account{r.accounts !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              No region data yet. Connect your tools to populate.
            </div>
          )}
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
  positive: boolean;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl mb-1" style={{ fontWeight: 600 }}>
        {value}
      </div>
      {change !== "—" && (
        <span
          className={`text-[11px] flex items-center gap-0.5 ${positive ? "text-[var(--iw-success)]" : "text-[var(--iw-danger)]"}`}
          style={{ fontWeight: 500 }}
        >
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{" "}
          {change}
        </span>
      )}
    </div>
  );
}

export default OpsAnalyticsView;
