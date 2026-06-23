/**
 * Account Health View — Per-account health scores from real data
 *
 * Shows aggregate health metrics and a detailed breakdown of every account's
 * health score, trend, risk level, and contributing factors. No hardcoded values.
 */
import { useState, useMemo } from "react";
import {
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Loader2,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import type { AccountMaster } from "../csm-intelligence-data";
import { formatCurrency, healthColor, getHealthLabel } from "../csm-intelligence-data";

type HealthFilter = "all" | "healthy" | "at-risk" | "critical";
type SortBy = "health" | "name" | "arr" | "trend";

export function AccountHealthView() {
  const navigate = useNavigate();
  const {
    data: accounts,
    isLoading,
    error,
  } = useWorkspaceEntities<AccountMaster>("account_master");
  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("health");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...accounts];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.accountName.toLowerCase().includes(q) ||
          a.customerSuccessManager.toLowerCase().includes(q) ||
          a.industryVertical.toLowerCase().includes(q)
      );
    }

    if (healthFilter !== "all") {
      result = result.filter((a) => {
        if (healthFilter === "healthy") return a.healthScore >= 80;
        if (healthFilter === "at-risk") return a.healthScore >= 60 && a.healthScore < 80;
        if (healthFilter === "critical") return a.healthScore < 60;
        return true;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "health":
          return a.healthScore - b.healthScore;
        case "name":
          return a.accountName.localeCompare(b.accountName);
        case "arr":
          return b.arr - a.arr;
        case "trend":
          const trendOrder = { Declining: -1, Stable: 0, Improving: 1 };
          return (trendOrder[a.healthScoreTrend3M] ?? 0) - (trendOrder[b.healthScoreTrend3M] ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [accounts, search, healthFilter, sortBy]);

  const summary = useMemo(() => {
    const total = accounts.length;
    const healthy = accounts.filter((a) => a.healthScore >= 80).length;
    const atRisk = accounts.filter((a) => a.healthScore >= 60 && a.healthScore < 80).length;
    const critical = accounts.filter((a) => a.healthScore < 60).length;
    const avgHealth =
      total > 0 ? Math.round(accounts.reduce((s, a) => s + a.healthScore, 0) / total) : 0;
    const declining = accounts.filter((a) => a.healthScoreTrend3M === "Declining").length;
    const totalArr = accounts.reduce((s, a) => s + a.arr, 0);
    const atRiskArr = accounts.filter((a) => a.healthScore < 80).reduce((s, a) => s + a.arr, 0);
    return { total, healthy, atRisk, critical, avgHealth, declining, totalArr, atRiskArr };
  }, [accounts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading account health…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-iw-red mx-auto mb-2" />
          <p className="text-sm text-iw-red">Failed to load health data</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <HeartPulse className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-lg font-medium">No accounts yet</p>
        <p className="text-sm mt-1">Connect a CRM to import accounts and see health scores.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HeartPulse className="w-5 h-5" style={{ color: "var(--iw-domain-cs)" }} />
          <h1 className="text-xl font-semibold">Account Health</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Health scores, trends, and risk factors for every account. {summary.total} account
          {summary.total !== 1 ? "s" : ""} tracked.
        </p>
      </div>

      {/* Hero — Real Aggregate Stats */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--iw-domain-cs) 0%, #2d5a3d 50%, #1a3a2a 100%)",
          boxShadow: "0 4px 20px rgba(16, 185, 129, 0.2)",
        }}
      >
        <div className="p-6 text-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <HeartPulse size={28} className="text-white/90" />
                <h1 className="text-2xl font-bold">Health Overview</h1>
              </div>
              <p className="text-sm text-white/70">
                Aggregate health across all tracked accounts — updated from live CRM data
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{summary.avgHealth}</div>
              <div className="text-xs text-white/60">avg health score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/15">
              <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">
                Health Distribution
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1">
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-iw-forest-bright/80"
                      style={{
                        width: `${summary.total > 0 ? (summary.healthy / summary.total) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="h-full bg-iw-gold-light"
                      style={{
                        width: `${summary.total > 0 ? (summary.atRisk / summary.total) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="h-full bg-iw-red/60"
                      style={{
                        width: `${summary.total > 0 ? (summary.critical / summary.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-2 text-[11px]">
                <span className="text-iw-forest-bright">{summary.healthy} Healthy</span>
                <span className="text-iw-gold-pale">{summary.atRisk} At-Risk</span>
                <span className="text-red-200">{summary.critical} Critical</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/15">
              <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">
                Declining Trend
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{summary.declining}</span>
                <span className="text-sm text-white/60 pb-1">accounts</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-iw-gold-pale">
                <TrendingDown size={12} />
                <span>Health score dropped in last 3 months</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/15">
              <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">
                ARR Under Risk
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{formatCurrency(summary.atRiskArr)}</span>
              </div>
              <div className="text-xs text-white/60 mt-2">
                {Math.round((summary.atRiskArr / Math.max(summary.totalArr, 1)) * 100)}% of{" "}
                {formatCurrency(summary.totalArr)} total ARR
              </div>
              <div className="text-xs text-white/60 mt-0.5">
                {summary.atRisk + summary.critical} accounts below 80 health
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts, CSM, industry…"
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-56"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value as HealthFilter)}
            className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Health Levels</option>
            <option value="healthy">Healthy (≥80)</option>
            <option value="at-risk">At-Risk (60-79)</option>
            <option value="critical">Critical (&lt;60)</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none"
          >
            <option value="health">Health Score</option>
            <option value="name">Name</option>
            <option value="arr">ARR</option>
            <option value="trend">Trend</option>
          </select>
        </div>
      </div>

      {/* Account Health Grid */}
      <div className="space-y-3">
        {filtered.map((account) => {
          const isExpanded = expandedId === account.accountId;
          const hColor = healthColor(account.healthScore);
          const hLabel = getHealthLabel(account.healthScore);
          const trendIcon =
            account.healthScoreTrend3M === "Improving" ? (
              <TrendingUp size={13} className="text-iw-forest-bright" />
            ) : account.healthScoreTrend3M === "Declining" ? (
              <TrendingDown size={13} className="text-iw-red" />
            ) : (
              <Minus size={13} className="text-iw-gold" />
            );

          return (
            <div
              key={account.accountId}
              className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : account.accountId)}
            >
              {/* Row Header */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${hColor}15` }}
                    >
                      <Building2 className="w-5 h-5" style={{ color: hColor }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {account.accountName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {account.industryVertical} · {account.geography} · CSM:{" "}
                        {account.customerSuccessManager || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        ARR
                      </div>
                      <div className="text-sm font-semibold">{formatCurrency(account.arr)}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Renewal
                      </div>
                      <div className="text-sm font-semibold">
                        {account.daysToRenewal > 0 ? `${account.daysToRenewal}d` : "Overdue"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold leading-none" style={{ color: hColor }}>
                          {account.healthScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{hLabel}</div>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        {trendIcon}
                        <span className="text-[9px] text-muted-foreground">
                          {account.healthScoreChange > 0
                            ? `+${account.healthScoreChange}`
                            : account.healthScoreChange}
                        </span>
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-0 border-t bg-muted/20">
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-card border border-border p-3">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Contract
                      </div>
                      <div className="text-xs font-medium">{account.contractType}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {account.contractStartDate} → {account.contractEndDate}
                      </div>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-3">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Engagement
                      </div>
                      <div className="text-xs font-medium">{account.engagementCadence}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Last: {account.lastEngagementDate || "—"} · Next:{" "}
                        {account.nextEngagementDue || "—"}
                      </div>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-3">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Primary Contact
                      </div>
                      <div className="text-xs font-medium">{account.primaryContactName || "—"}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {account.primaryContactRole || "—"}
                      </div>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-3">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Renewal Risk
                      </div>
                      <div
                        className="text-xs font-semibold"
                        style={{
                          color:
                            account.renewalRiskLevel === "Critical"
                              ? "#ef4444"
                              : account.renewalRiskLevel === "High"
                                ? "#b8943f"
                                : account.renewalRiskLevel === "Medium"
                                  ? "#b8943f"
                                  : "#22c55e",
                        }}
                      >
                        {account.renewalRiskLevel}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {account.daysToRenewal > 0
                          ? `${account.daysToRenewal} days remaining`
                          : "Overdue"}
                      </div>
                    </div>
                  </div>

                  {/* Health Score Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Health Score
                      </span>
                      <span className="text-xs font-semibold" style={{ color: hColor }}>
                        {account.healthScore}/100
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${account.healthScore}%`, backgroundColor: hColor }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/work/entity/${account.accountId}`);
                      }}
                      className="flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      View 360 <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/work/entity/${account.accountId}?tab=health`);
                      }}
                      className="flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <Activity className="w-3 h-3" /> Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && accounts.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Activity className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No accounts match the current filters</p>
        </div>
      )}
    </div>
  );
}
