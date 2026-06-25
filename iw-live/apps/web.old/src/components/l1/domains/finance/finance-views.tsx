/**
 * Finance Inner Views — Revenue, Expenses, Invoices, Reports, Forecasting, Budget
 * All data from Spine SSOT finance projection.
 */
import { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  PieChart,
  Target,
  Search,
  Plus,
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { formatCurrency } from "../spine-projection";

/* ═══════════ Revenue ═══════════ */
export function FinanceRevenueView() {
  const { data: proj } = useHydrateProjection<any>("finance");
  const revenue = proj?.revenue || [];
  const summary = proj?.summary || {};

  const totalRevenue = revenue.reduce((s: number, r: any) => s + (r.amount || r.value || 0), 0);
  const chartData = revenue.map((r: any) => ({
    period: r.period || r.month || r.name,
    value: r.amount || r.value || 0,
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>
        Revenue
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Revenue"
          value={totalRevenue > 0 ? formatCurrency(totalRevenue, true) : "—"}
          color="var(--iw-success)"
        />
        <MetricCard
          label="MRR"
          value={summary.mrr ? formatCurrency(summary.mrr, true) : "—"}
          color="var(--iw-forest-mid)"
        />
        <MetricCard
          label="ARR"
          value={summary.arr ? formatCurrency(summary.arr, true) : "—"}
          color="var(--iw-gold)"
        />
        <MetricCard
          label="Growth Rate"
          value={summary.growthRate != null ? `${summary.growthRate}%` : "—"}
          color="var(--iw-warning)"
          sub={
            summary.growthDelta
              ? `${summary.growthDelta > 0 ? "+" : ""}${summary.growthDelta}% vs prior`
              : undefined
          }
        />
      </div>

      {chartData.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Revenue Trend
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--iw-success)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--iw-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => formatCurrency(v, true)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(val: number) => formatCurrency(val, true)}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--iw-success)"
                  fill="url(#revGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          No revenue data yet. Connect your finance tools to populate.
        </div>
      )}

      {/* Revenue Breakdown */}
      {revenue.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>Period</span>
            <span>Amount</span>
            <span>Change</span>
          </div>
          {revenue.map((r: any, i: number) => {
            const prev = i > 0 ? revenue[i - 1].amount || revenue[i - 1].value || 0 : 0;
            const current = r.amount || r.value || 0;
            const change = prev > 0 ? ((current - prev) / prev) * 100 : 0;
            return (
              <div
                key={r.id || r.period || i}
                className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 items-center"
              >
                <span className="text-sm" style={{ fontWeight: 500 }}>
                  {r.period || r.month || r.name}
                </span>
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  {formatCurrency(current, true)}
                </span>
                <span
                  className="text-xs flex items-center gap-0.5"
                  style={{
                    color:
                      change > 0
                        ? "var(--iw-success)"
                        : change < 0
                          ? "var(--iw-danger)"
                          : "var(--muted-foreground)",
                  }}
                >
                  {change > 0 && <TrendingUp className="w-3 h-3" />}
                  {change < 0 && <TrendingDown className="w-3 h-3" />}
                  {i > 0 ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════ Expenses ═══════════ */
export function FinanceExpensesView() {
  const { data: proj } = useHydrateProjection<any>("finance");
  const expenses = proj?.expenses || [];
  const summary = proj?.summary || {};

  const totalExpenses = expenses.reduce((s: number, e: any) => s + (e.amount || e.value || 0), 0);
  const chartData = expenses.map((e: any) => ({
    name: e.category || e.name || "Other",
    value: e.amount || e.value || 0,
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>
        Expenses
      </h2>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Total Expenses"
          value={totalExpenses > 0 ? formatCurrency(totalExpenses, true) : "—"}
          color="var(--iw-danger)"
        />
        <MetricCard
          label="Burn Rate"
          value={summary.burnRate ? formatCurrency(summary.burnRate, true) + "/mo" : "—"}
          color="var(--iw-warning)"
        />
        <MetricCard
          label="Runway"
          value={summary.runway ? `${summary.runway} months` : "—"}
          color="var(--iw-forest-mid)"
        />
      </div>

      {chartData.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Expense Breakdown
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => formatCurrency(v, true)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(val: number) => formatCurrency(val, true)}
                />
                <Bar dataKey="value" fill="var(--iw-warning)" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          No expense data yet. Connect your finance tools to populate.
        </div>
      )}

      {/* Category Table */}
      {expenses.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>Category</span>
            <span>Amount</span>
            <span>% of Total</span>
          </div>
          {expenses.map((e: any) => {
            const amount = e.amount || e.value || 0;
            const pct = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : "0";
            return (
              <div
                key={e.id || e.category || e.name}
                className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 items-center"
              >
                <span className="text-sm" style={{ fontWeight: 500 }}>
                  {e.category || e.name}
                </span>
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  {formatCurrency(amount, true)}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--iw-warning)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════ Invoices ═══════════ */
export function FinanceInvoicesView() {
  const { data: proj } = useHydrateProjection<any>("finance");
  const invoices = proj?.invoices || [];
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = invoices;
    if (statusFilter !== "all") {
      list = list.filter((inv: any) => inv.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (inv: any) =>
          inv.invoice_number?.toLowerCase().includes(q) ||
          inv.customer_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, statusFilter, search]);

  const statuses = ["all", "draft", "sent", "paid", "overdue", "cancelled"];
  const statusColor: Record<string, string> = {
    draft: "var(--muted-foreground)",
    sent: "var(--iw-forest-mid)",
    paid: "var(--iw-success)",
    overdue: "var(--iw-danger)",
    cancelled: "var(--muted-foreground)",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Invoices
            </h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-forest-mid)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> New Invoice
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-full capitalize ${statusFilter === s ? "bg-[var(--iw-forest-mid)]/15 text-[var(--iw-forest-mid)]" : "bg-secondary text-muted-foreground"}`}
              style={{ fontWeight: statusFilter === s ? 600 : 400 }}
            >
              {s === "all" ? `All (${invoices.length})` : s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>Invoice</span>
            <span>Customer</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Due Date</span>
            <span>Issued</span>
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {invoices.length === 0
                ? "No invoices yet. Connect your finance tools to populate."
                : "No invoices match your filters"}
            </p>
          )}
          {filtered.map((inv: any) => (
            <div
              key={inv.invoice_number || inv.id}
              className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
            >
              <span className="text-xs" style={{ fontWeight: 600 }}>
                {inv.invoice_number || inv.id}
              </span>
              <span className="text-sm truncate">{inv.customer_name || "—"}</span>
              <span className="text-sm" style={{ fontWeight: 600 }}>
                {inv.amount ? formatCurrency(inv.amount, true) : "—"}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full capitalize w-fit"
                style={{
                  backgroundColor: `${statusColor[inv.status] || "var(--muted-foreground)"}15`,
                  color: statusColor[inv.status] || "var(--muted-foreground)",
                  fontWeight: 600,
                }}
              >
                {inv.status}
              </span>
              <span className="text-xs text-muted-foreground">{inv.due_date || "—"}</span>
              <span className="text-xs text-muted-foreground">{inv.issue_date || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Financial Reports ═══════════ */
export function FinanceReportsView() {
  const { data: proj } = useHydrateProjection<any>("finance");
  const reports = proj?.financialReports || proj?.financial_reports || [];
  const summary = proj?.summary || {};

  const grossMargin = summary.grossMargin ?? "—";
  const netMargin = summary.netMargin ?? "—";
  const collectionsRate = summary.collectionsRate ?? "—";
  const cashflow = summary.operatingCashflow ?? "—";

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>
        Financial Reports
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Gross Margin"
          value={grossMargin !== "—" ? `${grossMargin}%` : "—"}
          color="var(--iw-success)"
        />
        <MetricCard
          label="Net Margin"
          value={netMargin !== "—" ? `${netMargin}%` : "—"}
          color="var(--iw-forest-mid)"
        />
        <MetricCard
          label="Collections Rate"
          value={collectionsRate !== "—" ? `${collectionsRate}%` : "—"}
          color="var(--iw-gold)"
        />
        <MetricCard
          label="Operating Cashflow"
          value={cashflow !== "—" ? formatCurrency(cashflow, true) : "—"}
          color="var(--iw-warning)"
        />
      </div>

      {reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <div
              key={r.report_id || r.id}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--iw-forest-mid)]" />
                  <h4 className="text-sm" style={{ fontWeight: 600 }}>
                    {r.title || r.name || "Untitled Report"}
                  </h4>
                </div>
                <span className="text-[10px] text-muted-foreground">{r.period || "—"}</span>
              </div>
              {r.summary && <p className="text-[11px] text-muted-foreground mb-2">{r.summary}</p>}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="capitalize">{r.type || "general"}</span>
                <span>·</span>
                <span>{r.generated_at || r.created_at || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          No financial reports available yet. Connect your finance tools to populate.
        </div>
      )}
    </div>
  );
}

/* ═══════════ Forecasting ═══════════ */
export function FinanceForecastingView() {
  const { data: proj } = useHydrateProjection<any>("finance");
  const forecasts = proj?.forecasts || [];
  const summary = proj?.summary || {};

  const bestCase = summary.forecastBestCase ?? "—";
  const committed = summary.forecastCommitted ?? "—";
  const conservative = summary.forecastConservative ?? "—";
  const planPct = summary.forecastPlanPct ?? "—";

  const chartData = forecasts.map((f: any) => ({
    period: f.period || f.month || f.name,
    forecast: f.forecast_amount || f.amount || 0,
    actual: f.actual_amount || 0,
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>
        Forecasting
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Best Case"
          value={bestCase !== "—" ? formatCurrency(bestCase, true) : "—"}
          color="var(--iw-success)"
        />
        <MetricCard
          label="Committed"
          value={committed !== "—" ? formatCurrency(committed, true) : "—"}
          color="var(--iw-forest-mid)"
        />
        <MetricCard
          label="Conservative"
          value={conservative !== "—" ? formatCurrency(conservative, true) : "—"}
          color="var(--iw-warning)"
        />
        <MetricCard
          label="Plan Attainment"
          value={planPct !== "—" ? `${planPct}%` : "—"}
          color="var(--iw-gold)"
        />
      </div>

      {chartData.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Forecast vs Actual
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => formatCurrency(v, true)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(val: number) => formatCurrency(val, true)}
                />
                <Bar
                  dataKey="forecast"
                  fill="var(--iw-forest-mid)"
                  radius={[3, 3, 0, 0]}
                  barSize={14}
                  name="Forecast"
                />
                <Bar
                  dataKey="actual"
                  fill="var(--iw-success)"
                  radius={[3, 3, 0, 0]}
                  barSize={14}
                  name="Actual"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {[
              { l: "Forecast", c: "var(--iw-forest-mid)" },
              { l: "Actual", c: "var(--iw-success)" },
            ].map((i) => (
              <span
                key={i.l}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: i.c }} />
                {i.l}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          No forecast data yet. Connect your finance tools to populate.
        </div>
      )}
    </div>
  );
}

/* ═══════════ Budget ═══════════ */
export function FinanceBudgetView() {
  const { data: proj } = useHydrateProjection<any>("finance");
  const budgets = proj?.budgets || [];

  const totalAllocated = budgets.reduce(
    (s: number, b: any) => s + (b.allocated || b.budget_allocated || 0),
    0
  );
  const totalSpent = budgets.reduce((s: number, b: any) => s + (b.spent || b.actual_spent || 0), 0);
  const utilization = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>
        Budget Allocation
      </h2>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Total Allocated"
          value={totalAllocated > 0 ? formatCurrency(totalAllocated, true) : "—"}
          color="var(--iw-forest-mid)"
        />
        <MetricCard
          label="Total Spent"
          value={totalSpent > 0 ? formatCurrency(totalSpent, true) : "—"}
          color={
            utilization > 90
              ? "var(--iw-danger)"
              : utilization > 75
                ? "var(--iw-warning)"
                : "var(--iw-success)"
          }
        />
        <MetricCard
          label="Utilization"
          value={totalAllocated > 0 ? `${utilization}%` : "—"}
          color={
            utilization > 90
              ? "var(--iw-danger)"
              : utilization > 75
                ? "var(--iw-warning)"
                : "var(--iw-success)"
          }
        />
      </div>

      {budgets.length > 0 ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>Team / Department</span>
            <span>Allocated</span>
            <span>Spent</span>
            <span>Remaining</span>
            <span>Utilization</span>
          </div>
          {budgets.map((b: any) => {
            const allocated = b.allocated || b.budget_allocated || 0;
            const spent = b.spent || b.actual_spent || 0;
            const remaining = allocated - spent;
            const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
            return (
              <div
                key={b.budget_id || b.id || b.team}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 items-center"
              >
                <span className="text-sm" style={{ fontWeight: 500 }}>
                  {b.team || b.department || b.name}
                </span>
                <span className="text-sm">{formatCurrency(allocated, true)}</span>
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  {formatCurrency(spent, true)}
                </span>
                <span
                  className="text-sm"
                  style={{
                    fontWeight: 500,
                    color: remaining < 0 ? "var(--iw-danger)" : "var(--iw-success)",
                  }}
                >
                  {formatCurrency(Math.abs(remaining), true)}
                  {remaining < 0 ? " over" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor:
                          pct > 90
                            ? "var(--iw-danger)"
                            : pct > 75
                              ? "var(--iw-warning)"
                              : "var(--iw-success)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          No budget data yet. Connect your finance tools to populate.
        </div>
      )}
    </div>
  );
}

/* ─── Shared Helpers ─── */
function MetricCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl" style={{ fontWeight: 700, color }}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
