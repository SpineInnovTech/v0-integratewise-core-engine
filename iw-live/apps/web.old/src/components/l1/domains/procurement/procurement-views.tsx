/**
 * Procurement Inner Views — Vendors, Purchase Orders, Contracts, Spend Analysis, Savings
 * All data from Spine SSOT procurement projection.
 */
import { useState, useMemo } from "react";
import {
  Building2,
  FileText,
  ShoppingCart,
  PieChart,
  TrendingDown,
  Search,
  Filter,
  Plus,
  ChevronRight,
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  DollarSign,
} from "lucide-react";
import {
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
import { formatCurrency } from "../spine-projection";

/* ═══════════ Vendor Directory ═══════════ */
export function VendorsView() {
  const { data: proj } = useHydrateProjection<any>("procurement");
  const vendors = proj?.vendors || [];
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const filtered = useMemo(() => {
    let list = vendors;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (v: any) =>
          v.vendor_name?.toLowerCase().includes(q) || v.category?.toLowerCase().includes(q)
      );
    }
    if (tierFilter !== "all") {
      list = list.filter((v: any) => v.tier === tierFilter);
    }
    return list;
  }, [vendors, search, tierFilter]);

  const tiers = ["all", "strategic", "preferred", "approved", "under_review"];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Vendors
            </h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
            {tiers.map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-2.5 py-1 text-xs rounded-full capitalize ${tierFilter === t ? "bg-[var(--iw-forest-bright)]/15 text-[var(--iw-forest-bright)]" : "bg-secondary text-muted-foreground"}`}
                style={{ fontWeight: tierFilter === t ? 600 : 400 }}
              >
                {t === "all" ? "All" : t.replace("_", " ")}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-forest-bright)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Add Vendor
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v: any) => (
            <div
              key={v.vendor_id || v.id}
              onClick={() => setSelectedVendor(v)}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full bg-[var(--iw-forest-bright)]/10 flex items-center justify-center text-sm"
                  style={{ fontWeight: 600, color: "var(--iw-forest-bright)" }}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm truncate" style={{ fontWeight: 600 }}>
                    {v.vendor_name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">{v.category}</p>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor:
                      v.tier === "strategic"
                        ? "rgba(61, 122, 80,0.1)"
                        : v.tier === "preferred"
                          ? "rgba(0,200,83,0.1)"
                          : "rgba(189,189,189,0.1)",
                    color:
                      v.tier === "strategic"
                        ? "var(--iw-forest-bright)"
                        : v.tier === "preferred"
                          ? "var(--iw-success)"
                          : "var(--muted-foreground)",
                    fontWeight: 600,
                  }}
                >
                  {v.tier}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Score: {v.performance_score ?? "—"}</span>
                <span>{v.contract_value ? formatCurrency(v.contract_value, true) : "—"}</span>
              </div>
              {v.risk_level === "high" && (
                <div
                  className="mt-2 text-[10px] px-1.5 py-0.5 rounded bg-[var(--iw-danger)]/10 text-[var(--iw-danger)] inline-flex items-center gap-1"
                  style={{ fontWeight: 500 }}
                >
                  <AlertTriangle className="w-3 h-3" /> High Risk
                </div>
              )}
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            {vendors.length === 0
              ? "No vendors yet. Connect your procurement tools to populate."
              : "No vendors match your filters"}
          </p>
        )}
      </div>
      {selectedVendor && (
        <VendorDrawer vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />
      )}
    </div>
  );
}

/* ═══════════ Purchase Orders ═══════════ */
export function OrdersView() {
  const { data: proj } = useHydrateProjection<any>("procurement");
  const orders = proj?.purchaseOrders || proj?.purchase_orders || [];
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o: any) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const statuses = ["all", "draft", "pending", "approved", "delivered", "cancelled"];
  const statusColor: Record<string, string> = {
    draft: "var(--muted-foreground)",
    pending: "var(--iw-warning)",
    approved: "var(--iw-success)",
    delivered: "var(--iw-forest-bright)",
    cancelled: "var(--iw-danger)",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Purchase Orders
            </h2>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-full capitalize ${statusFilter === s ? "bg-[var(--iw-forest-bright)]/15 text-[var(--iw-forest-bright)]" : "bg-secondary text-muted-foreground"}`}
                style={{ fontWeight: statusFilter === s ? 600 : 400 }}
              >
                {s === "all" ? `All (${orders.length})` : s}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-forest-bright)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Create PO
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>PO Number</span>
            <span>Vendor</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Requested By</span>
            <span>Delivery</span>
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {orders.length === 0 ? "No purchase orders yet" : "No orders match this filter"}
            </p>
          )}
          {filtered.map((o: any) => (
            <div
              key={o.po_number || o.id}
              className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
            >
              <span className="text-sm" style={{ fontWeight: 600 }}>
                {o.po_number}
              </span>
              <span className="text-sm truncate">{o.vendor_name || o.vendor_id}</span>
              <span className="text-sm" style={{ fontWeight: 600 }}>
                {o.amount ? formatCurrency(o.amount, true) : "—"}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full capitalize w-fit"
                style={{
                  backgroundColor: `${statusColor[o.status] || "var(--muted-foreground)"}15`,
                  color: statusColor[o.status] || "var(--muted-foreground)",
                  fontWeight: 600,
                }}
              >
                {o.status}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {o.requested_by || "—"}
              </span>
              <span className="text-xs text-muted-foreground">{o.delivery_date || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Contracts ═══════════ */
export function ContractsView() {
  const { data: proj } = useHydrateProjection<any>("procurement");
  const contracts = proj?.contracts || [];
  const [search, setSearch] = useState("");

  const filtered = contracts.filter(
    (c: any) =>
      !search ||
      c.contract_type?.toLowerCase().includes(search.toLowerCase()) ||
      c.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.owner?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Contracts
            </h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-forest-bright)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> New Contract
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>Contract</span>
            <span>Type</span>
            <span>Value</span>
            <span>End Date</span>
            <span>Auto-Renew</span>
            <span>Owner</span>
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {contracts.length === 0
                ? "No contracts tracked yet"
                : "No contracts match your search"}
            </p>
          )}
          {filtered.map((c: any) => {
            const endDate = c.end_date ? new Date(c.end_date) : null;
            const daysToEnd = endDate
              ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const expiringSoon = daysToEnd !== null && daysToEnd <= 90 && daysToEnd > 0;
            return (
              <div
                key={c.contract_id || c.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                    {c.contract_type || c.name || "Untitled"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{c.vendor_name || "—"}</p>
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {c.contract_type || "—"}
                </span>
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  {c.value ? formatCurrency(c.value, true) : "—"}
                </span>
                <div>
                  <span className="text-xs">{c.end_date || "—"}</span>
                  {expiringSoon && (
                    <span
                      className="block text-[9px] text-[var(--iw-warning)]"
                      style={{ fontWeight: 500 }}
                    >
                      {daysToEnd}d remaining
                    </span>
                  )}
                </div>
                <span className="text-xs">
                  {c.auto_renew ? (
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--iw-success)]" />
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground truncate">{c.owner || "—"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Spend Analysis ═══════════ */
export function SpendView() {
  const { data: proj } = useHydrateProjection<any>("procurement");
  const categories = proj?.spendCategories || proj?.spend_categories || [];
  const summary = proj?.summary || {};

  const totalBudget = categories.reduce((s: number, c: any) => s + (c.budget_allocated || 0), 0);
  const totalActual = categories.reduce((s: number, c: any) => s + (c.actual_spend || 0), 0);
  const totalVariance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;

  const chartData = categories.map((c: any) => ({
    name: c.category_name || "Unknown",
    budget: c.budget_allocated || 0,
    actual: c.actual_spend || 0,
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg" style={{ fontWeight: 600 }}>
          Spend Analysis
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Total Budget"
          value={totalBudget > 0 ? formatCurrency(totalBudget, true) : "—"}
          color="var(--iw-forest-bright)"
        />
        <MetricCard
          label="Actual Spend"
          value={totalActual > 0 ? formatCurrency(totalActual, true) : "—"}
          color={totalActual > totalBudget ? "var(--iw-danger)" : "var(--iw-success)"}
        />
        <MetricCard
          label="Variance"
          value={
            totalBudget > 0 ? `${totalVariance > 0 ? "+" : ""}${totalVariance.toFixed(1)}%` : "—"
          }
          color={totalVariance > 0 ? "var(--iw-danger)" : "var(--iw-success)"}
        />
      </div>

      {chartData.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Budget vs Actual by Category
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
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
                  formatter={(val: number) => formatCurrency(val, true)}
                />
                <Bar
                  dataKey="budget"
                  fill="var(--iw-forest-bright)"
                  radius={[3, 3, 0, 0]}
                  barSize={14}
                  name="Budget"
                />
                <Bar
                  dataKey="actual"
                  fill="var(--iw-warning)"
                  radius={[3, 3, 0, 0]}
                  barSize={14}
                  name="Actual"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {[
              { l: "Budget", c: "var(--iw-forest-bright)" },
              { l: "Actual", c: "var(--iw-warning)" },
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
          Connect your procurement tools to see spend analysis
        </div>
      )}

      {/* Category Breakdown Table */}
      {categories.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>Category</span>
            <span>Budget</span>
            <span>Actual</span>
            <span>Variance</span>
            <span>Vendors</span>
          </div>
          {categories.map((c: any) => {
            const variance =
              c.budget_allocated > 0
                ? ((c.actual_spend - c.budget_allocated) / c.budget_allocated) * 100
                : 0;
            return (
              <div
                key={c.category_name || c.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 items-center"
              >
                <span className="text-sm" style={{ fontWeight: 500 }}>
                  {c.category_name}
                </span>
                <span className="text-sm">
                  {c.budget_allocated ? formatCurrency(c.budget_allocated, true) : "—"}
                </span>
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  {c.actual_spend ? formatCurrency(c.actual_spend, true) : "—"}
                </span>
                <span
                  className="text-sm"
                  style={{
                    fontWeight: 600,
                    color: variance > 0 ? "var(--iw-danger)" : "var(--iw-success)",
                  }}
                >
                  {c.budget_allocated > 0
                    ? `${variance > 0 ? "+" : ""}${variance.toFixed(1)}%`
                    : "—"}
                </span>
                <span className="text-xs text-muted-foreground">{c.vendor_count ?? "—"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════ Savings Initiatives ═══════════ */
export function SavingsView() {
  const { data: proj } = useHydrateProjection<any>("procurement");
  const initiatives = proj?.savingsInitiatives || proj?.savings_initiatives || [];
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return initiatives;
    return initiatives.filter((i: any) => i.status === statusFilter);
  }, [initiatives, statusFilter]);

  const totalTarget = initiatives.reduce((s: number, i: any) => s + (i.target_savings || 0), 0);
  const totalRealized = initiatives.reduce((s: number, i: any) => s + (i.realized_savings || 0), 0);
  const realization = totalTarget > 0 ? Math.round((totalRealized / totalTarget) * 100) : 0;

  const statusColor: Record<string, string> = {
    active: "var(--iw-success)",
    planned: "var(--iw-forest-bright)",
    completed: "var(--iw-gold)",
    on_hold: "var(--iw-warning)",
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg" style={{ fontWeight: 600 }}>
            Savings Initiatives
          </h2>
          {["all", "active", "planned", "completed", "on_hold"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-full capitalize ${statusFilter === s ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground"}`}
              style={{ fontWeight: statusFilter === s ? 600 : 400 }}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-success)] text-white hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> New Initiative
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Target Savings"
          value={totalTarget > 0 ? formatCurrency(totalTarget, true) : "—"}
          color="var(--iw-forest-bright)"
        />
        <MetricCard
          label="Realized Savings"
          value={totalRealized > 0 ? formatCurrency(totalRealized, true) : "—"}
          color="var(--iw-success)"
        />
        <MetricCard
          label="Realization Rate"
          value={totalTarget > 0 ? `${realization}%` : "—"}
          color={
            realization >= 80
              ? "var(--iw-success)"
              : realization >= 50
                ? "var(--iw-warning)"
                : "var(--iw-danger)"
          }
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div
          className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
          style={{ fontWeight: 600 }}
        >
          <span>Initiative</span>
          <span>Category</span>
          <span>Target</span>
          <span>Realized</span>
          <span>Status</span>
          <span>Owner</span>
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {initiatives.length === 0
              ? "No savings initiatives tracked yet"
              : "No initiatives match this filter"}
          </p>
        )}
        {filtered.map((i: any) => {
          const pct =
            i.target_savings > 0 ? Math.round((i.realized_savings / i.target_savings) * 100) : 0;
          return (
            <div
              key={i.initiative_id || i.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
            >
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                  {i.initiative_name}
                </p>
                <p className="text-[10px] text-muted-foreground">{i.timeline || "—"}</p>
              </div>
              <span className="text-xs text-muted-foreground">{i.category || "—"}</span>
              <span className="text-sm">
                {i.target_savings ? formatCurrency(i.target_savings, true) : "—"}
              </span>
              <div>
                <span className="text-sm" style={{ fontWeight: 600, color: "var(--iw-success)" }}>
                  {i.realized_savings ? formatCurrency(i.realized_savings, true) : "—"}
                </span>
                {i.target_savings > 0 && (
                  <span className="block text-[9px] text-muted-foreground">{pct}% realized</span>
                )}
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full capitalize w-fit"
                style={{
                  backgroundColor: `${statusColor[i.status] || "var(--muted-foreground)"}15`,
                  color: statusColor[i.status] || "var(--muted-foreground)",
                  fontWeight: 600,
                }}
              >
                {i.status?.replace("_", " ") || "—"}
              </span>
              <span className="text-xs text-muted-foreground truncate">{i.owner || "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Vendor Drawer ─── */
function VendorDrawer({ vendor, onClose }: { vendor: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                {vendor.vendor_name}
              </h3>
              <p className="text-xs text-muted-foreground capitalize">
                {vendor.category} · {vendor.tier}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Contract Value</p>
              <p className="text-lg" style={{ fontWeight: 700 }}>
                {vendor.contract_value ? formatCurrency(vendor.contract_value, true) : "—"}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Performance</p>
              <p className="text-lg" style={{ fontWeight: 700, color: "var(--iw-success)" }}>
                {vendor.performance_score ?? "—"}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Row label="Tier" value={vendor.tier || "—"} />
            <Row label="Payment Terms" value={vendor.payment_terms || "—"} />
            <Row label="Risk Level" value={vendor.risk_level || "—"} />
            <Row label="Diversity Status" value={vendor.diversity_status || "—"} />
            <Row
              label="SLA Compliance"
              value={vendor.sla_compliance ? `${vendor.sla_compliance}%` : "—"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared Helpers ─── */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm capitalize" style={{ fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

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
