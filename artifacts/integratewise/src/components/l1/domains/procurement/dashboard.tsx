/**
 * Procurement Dashboard — Total spend, pending orders, savings, vendor management
 * Data from Spine Procurement projection.
 */
import {
  ShoppingCart,
  Building2,
  TrendingDown,
  Clock,
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

export function ProcurementDashboard() {
  const { data: projection, loading } = useHydrateProjection<any>("procurement");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = projection?.summary || {};
  const totalSpend = summary.totalSpend ?? 0;
  const pendingOrders = summary.pendingOrders ?? 0;
  const costSavings = summary.costSavings ?? 0;
  const vendorCount = summary.vendorCount ?? 0;

  // Monthly spend trend
  // Monthly spend trend — from projection or empty
  const spendTrend = projection?.spendTrend || [];

  // Top vendors — from projection or empty
  const topVendors = projection?.topVendors || [];

  // Spend by category — from projection or empty
  const categorySpend = projection?.categorySpend || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="procurement" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          title="Total Spend (YTD)"
          value={`$${(totalSpend / 1000000).toFixed(2)}M`}
          change="-2.3% vs last year"
          positive
          icon={<ShoppingCart className="w-4 h-4" />}
          color="var(--iw-forest-mid)"
        />
        <KPI
          title="Pending Orders"
          value={String(pendingOrders)}
          change="Awaiting delivery"
          positive={pendingOrders < 20}
          icon={<Clock className="w-4 h-4" />}
          color="var(--iw-warning)"
        />
        <KPI
          title="Cost Savings"
          value={`$${(costSavings / 1000).toFixed(0)}K`}
          change="YTD negotiated"
          positive
          icon={<TrendingDown className="w-4 h-4" />}
          color="var(--iw-success)"
        />
        <KPI
          title="Active Vendors"
          value={String(vendorCount)}
          change="4 under review"
          positive
          icon={<Building2 className="w-4 h-4" />}
          color="var(--iw-teal)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spend Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Monthly Spend & Savings</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
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
                  formatter={(val: number) => `$${(val / 1000).toFixed(0)}K`}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="var(--iw-forest-mid)"
                  fill="var(--iw-forest-mid)"
                  fillOpacity={0.1}
                  name="Spend"
                />
                <Area
                  type="monotone"
                  dataKey="savings"
                  stroke="var(--iw-success)"
                  fill="var(--iw-success)"
                  fillOpacity={0.1}
                  name="Savings"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vendors */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Top Vendors</h3>
          <div className="space-y-3">
            {topVendors.map((v: any) => {
              const pct = Math.round((v.spend / totalSpend) * 100);
              return (
                <div key={v.vendor}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ fontWeight: 500 }}>{v.vendor}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-secondary relative">
                    <div
                      className="h-full rounded-full bg-[var(--iw-forest-mid)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spend by Category */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-4">Spend by Category</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categorySpend} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
              />
              <YAxis
                dataKey="category"
                type="category"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(val: number) => `$${(val / 1000000).toFixed(2)}M`}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {categorySpend.map((cat: any, i: number) => (
                  <Cell key={i} fill={cat.fill} />
                ))}
              </Bar>
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
