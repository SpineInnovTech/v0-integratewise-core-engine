/**
 * Finance Dashboard — Total revenue, expenses, profit margin, cash flow, burn rate
 * Data from Spine Finance projection.
 */
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { ReadinessBar } from "@/components/l2/spine/readiness-bar";

export function FinanceDashboard() {
  const { data: projection, loading } = useHydrateProjection<any>("finance");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = projection?.summary || {};
  const totalRevenue = summary.totalRevenue ?? 0;
  const totalExpenses = summary.totalExpenses ?? 0;
  const profitMargin = summary.profitMargin ?? 0;
  const cashFlow = totalRevenue - totalExpenses;

  // Monthly P&L — from projection or empty
  const monthlyPnL = projection?.monthlyPnL || [];

  // Cash flow trend — from projection or empty
  const cashFlowTrend = projection?.cashFlowTrend || [];

  // Expense breakdown — from projection or empty
  const expenseBreakdown = projection?.expenseBreakdown || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="finance" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          title="Total Revenue"
          value={`$${(totalRevenue / 1000000).toFixed(2)}M`}
          icon={<DollarSign className="w-4 h-4" />}
          color="var(--iw-success)"
        />
        <KPI
          title="Total Expenses"
          value={`$${(totalExpenses / 1000000).toFixed(2)}M`}
          icon={<CreditCard className="w-4 h-4" />}
          color="var(--iw-danger)"
        />
        <KPI
          title="Profit Margin"
          value={`${profitMargin}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="var(--iw-teal)"
        />
        <KPI
          title="Cash Flow"
          value={`$${(cashFlow / 1000000).toFixed(2)}M`}
          positive={cashFlow > 0}
          icon={<TrendingUp className="w-4 h-4" />}
          color="var(--iw-forest-mid)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Expenses Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">P&L Trend</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyPnL}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--iw-success)"
                  fill="var(--iw-success)"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="var(--iw-danger)"
                  fill="var(--iw-danger)"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            {expenseBreakdown.map((exp: any) => {
              const pct = Math.round((exp.value / totalExpenses) * 100);
              return (
                <div key={exp.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ fontWeight: 500 }}>{exp.category}</span>
                    <span className="text-muted-foreground">
                      ${(exp.value / 1000000).toFixed(2)}M ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-secondary relative">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: exp.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cash Flow Trend */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-4">Cash Flow Trend</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
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
              <Line
                type="monotone"
                dataKey="cash"
                stroke="var(--iw-forest-mid)"
                strokeWidth={2}
                dot={{ fill: "var(--iw-forest-mid)" }}
              />
            </LineChart>
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
