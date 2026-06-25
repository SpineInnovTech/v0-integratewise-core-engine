/**
 * At-Risk Accounts View — Real account data, no mocks
 *
 * Surfaces accounts from account_master that are flagged as at-risk
 * via health score, status, or renewal risk level. Each card is
 * actionable: view 360, contact CSM, or schedule engagement.
 */
import { useState, useMemo } from "react";
import {
  AlertTriangle,
  TrendingDown,
  Calendar,
  DollarSign,
  HeartPulse,
  Phone,
  Mail,
  ArrowRight,
  Filter,
  Search,
  Loader2,
  Building2,
  Clock,
  User,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import { useProposals } from "@/hooks/use-proposals";
import { useSignals } from "@/hooks/use-signals";
import type { AccountMaster } from "../csm-intelligence-data";
import { formatCurrency, healthColor, riskColor, getHealthLabel } from "../csm-intelligence-data";
import type { ProposalOpsProjection } from "@integratewise/types";

type RiskFilter = "all" | "critical" | "high" | "medium" | "low";
type SortBy = "health" | "arr" | "renewal" | "last-engagement";

function isAtRisk(account: AccountMaster): boolean {
  return (
    account.accountStatus === "At Risk" ||
    account.healthScore < 70 ||
    account.renewalRiskLevel === "Critical" ||
    account.renewalRiskLevel === "High" ||
    account.healthScoreTrend3M === "Declining"
  );
}

function riskPriority(account: AccountMaster): number {
  if (account.renewalRiskLevel === "Critical" || account.healthScore < 50) return 4;
  if (account.renewalRiskLevel === "High" || account.healthScore < 70) return 3;
  if (account.accountStatus === "At Risk" || account.healthScore < 80) return 2;
  return 1;
}

function riskLabel(account: AccountMaster): string {
  if (account.renewalRiskLevel === "Critical" || account.healthScore < 50) return "Critical";
  if (account.renewalRiskLevel === "High" || account.healthScore < 70) return "High";
  if (account.accountStatus === "At Risk") return "At Risk";
  if (account.healthScoreTrend3M === "Declining") return "Declining";
  return "Medium";
}

function riskReasons(account: AccountMaster): string[] {
  const reasons: string[] = [];
  if (account.healthScore < 60) reasons.push("Health score critically low");
  else if (account.healthScore < 75) reasons.push("Health score below target");
  if (account.renewalRiskLevel === "Critical") reasons.push("Critical renewal risk");
  else if (account.renewalRiskLevel === "High") reasons.push("High renewal risk");
  if (account.accountStatus === "At Risk") reasons.push("Account flagged at-risk");
  if (account.healthScoreTrend3M === "Declining") reasons.push("Health declining (3M)");
  if (account.daysToRenewal <= 90 && account.daysToRenewal > 0)
    reasons.push(`Renewal in ${account.daysToRenewal} days`);
  if (account.daysToRenewal <= 0) reasons.push("Renewal overdue");
  if (!account.lastEngagementDate || account.lastEngagementDate === "")
    reasons.push("No recent engagement");
  return reasons.length > 0 ? reasons : ["Monitored for risk factors"];
}

function proposalRiskColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#b8943f";
    case "medium":
      return "#b8943f";
    default:
      return "#6b665f";
  }
}

export function CSAtRiskView() {
  const navigate = useNavigate();
  const {
    data: accounts,
    isLoading: accountsLoading,
    error: accountsError,
  } = useWorkspaceEntities<AccountMaster>("account_master");
  const {
    proposals,
    isLoading: proposalsLoading,
    approve,
    reject,
    isApproving,
    isRejecting,
  } = useProposals({
    status: ["pending_review", "approved"],
    entity_type: "account",
  });
  const { signals, isLoading: signalsLoading } = useSignals("account-success");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("health");
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const isLoading = accountsLoading || proposalsLoading || signalsLoading;
  const error = accountsError ? String(accountsError) : null;

  const atRiskAccounts = useMemo(() => {
    return accounts.filter(isAtRisk);
  }, [accounts]);

  // Map proposals to accounts
  const proposalsByAccount = useMemo(() => {
    const map = new Map<string, ProposalOpsProjection[]>();
    for (const p of proposals) {
      const list = map.get(p.entity_id) || [];
      list.push(p);
      map.set(p.entity_id, list);
    }
    return map;
  }, [proposals]);

  const pendingProposalCount = useMemo(() => {
    return proposals.filter((p) => p.status === "pending_review").length;
  }, [proposals]);

  const filtered = useMemo(() => {
    let result = atRiskAccounts;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.accountName.toLowerCase().includes(q) ||
          a.customerSuccessManager.toLowerCase().includes(q) ||
          a.industryVertical.toLowerCase().includes(q)
      );
    }

    if (riskFilter !== "all") {
      result = result.filter((a) => riskLabel(a).toLowerCase() === riskFilter);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "health":
          return a.healthScore - b.healthScore;
        case "arr":
          return b.arr - a.arr;
        case "renewal":
          return a.daysToRenewal - b.daysToRenewal;
        case "last-engagement":
          return (a.lastEngagementDate || "").localeCompare(b.lastEngagementDate || "");
        default:
          return 0;
      }
    });

    return result;
  }, [atRiskAccounts, search, riskFilter, sortBy]);

  const summary = useMemo(() => {
    const critical = atRiskAccounts.filter((a) => riskPriority(a) === 4).length;
    const high = atRiskAccounts.filter((a) => riskPriority(a) === 3).length;
    const medium = atRiskAccounts.filter((a) => riskPriority(a) === 2).length;
    const low = atRiskAccounts.filter((a) => riskPriority(a) === 1).length;
    const totalArr = atRiskAccounts.reduce((s, a) => s + a.arr, 0);
    const avgHealth =
      atRiskAccounts.length > 0
        ? Math.round(atRiskAccounts.reduce((s, a) => s + a.healthScore, 0) / atRiskAccounts.length)
        : 0;
    return {
      critical,
      high,
      medium,
      low,
      totalArr,
      avgHealth,
      total: atRiskAccounts.length,
      pendingProposals: pendingProposalCount,
    };
  }, [atRiskAccounts, pendingProposalCount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading at-risk accounts…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ShieldAlert className="w-8 h-8 text-iw-red mx-auto mb-2" />
          <p className="text-sm text-iw-red">Failed to load account data</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-5 h-5" style={{ color: "var(--iw-signal-critical)" }} />
          <h1 className="text-xl font-semibold">At-Risk Accounts</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Accounts flagged by health score, renewal risk, or declining trend. {summary.total}{" "}
          account{summary.total !== 1 ? "s" : ""} require attention.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Total At-Risk",
            value: summary.total.toString(),
            color: "#6b665f",
            icon: AlertTriangle,
          },
          {
            label: "Critical",
            value: summary.critical.toString(),
            color: "#ef4444",
            icon: ShieldAlert,
          },
          { label: "High", value: summary.high.toString(), color: "#b8943f", icon: TrendingDown },
          { label: "Medium", value: summary.medium.toString(), color: "#b8943f", icon: HeartPulse },
          { label: "Low", value: summary.low.toString(), color: "#22c55e", icon: HeartPulse },
          {
            label: "ARR at Risk",
            value: formatCurrency(summary.totalArr),
            color: "#3d7a50",
            icon: DollarSign,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {card.label}
              </span>
            </div>
            <p className="text-xl font-bold" style={{ color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
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
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
            className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
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
            <option value="arr">ARR (high→low)</option>
            <option value="renewal">Renewal (soonest)</option>
            <option value="last-engagement">Last Engagement</option>
          </select>
        </div>
      </div>

      {/* Account Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <HeartPulse className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-lg font-medium">No at-risk accounts found</p>
          <p className="text-sm mt-1">
            All accounts are currently healthy. Adjust filters to see more.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((account) => {
            const riskLvl = riskLabel(account);
            const rColor = riskColor(riskLvl === "At Risk" ? "High" : riskLvl);
            const reasons = riskReasons(account);
            return (
              <div
                key={account.accountId}
                className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="px-5 py-4 border-b border-border/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${rColor}15` }}
                      >
                        <Building2 className="w-4 h-4" style={{ color: rColor }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {account.accountName}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          {account.industryVertical} · {account.geography}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: `${rColor}15`, color: rColor }}
                      >
                        {riskLvl}
                      </span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                        style={{
                          backgroundColor: `${healthColor(account.healthScore)}15`,
                          color: healthColor(account.healthScore),
                        }}
                      >
                        {account.healthScore}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-5 py-4 space-y-3">
                  {/* Risk Reasons */}
                  <div className="flex flex-wrap gap-1.5">
                    {reasons.map((reason, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#8b2020" }}
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Key Metrics Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <div className="flex items-center gap-1 mb-0.5">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          ARR
                        </span>
                      </div>
                      <p className="text-sm font-semibold">{formatCurrency(account.arr)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Renewal
                        </span>
                      </div>
                      <p className="text-sm font-semibold">
                        {account.daysToRenewal > 0 ? `${account.daysToRenewal}d` : "Overdue"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Last Touch
                        </span>
                      </div>
                      <p className="text-sm font-semibold">{account.lastEngagementDate || "—"}</p>
                    </div>
                  </div>

                  {/* CSM & Trend */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">CSM:</span>
                      <span className="font-medium">
                        {account.customerSuccessManager || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Trend:</span>
                      <span
                        className="font-medium"
                        style={{
                          color:
                            account.healthScoreTrend3M === "Declining"
                              ? "#ef4444"
                              : account.healthScoreTrend3M === "Improving"
                                ? "#22c55e"
                                : "#6b665f",
                        }}
                      >
                        {account.healthScoreTrend3M}
                        {account.healthScoreChange !== 0 &&
                          ` (${account.healthScoreChange > 0 ? "+" : ""}${account.healthScoreChange})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                {/* Proposals for this account */}
                {(() => {
                  const accountProposals = proposalsByAccount.get(account.accountId) || [];
                  if (accountProposals.length === 0) return null;
                  return (
                    <div className="px-5 py-3 border-t border-border/50 bg-muted/10">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                        Twin Proposals
                      </p>
                      <div className="space-y-2">
                        {accountProposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="rounded-lg border border-border/60 bg-card p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {proposal.action_description}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                    style={{
                                      backgroundColor: `${proposalRiskColor(proposal.signal_severity)}15`,
                                      color: proposalRiskColor(proposal.signal_severity),
                                    }}
                                  >
                                    {proposal.signal_severity}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {Math.round(proposal.confidence * 100)}% confidence
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {proposal.action_type}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                                  {proposal.reasoning_summary}
                                </p>
                              </div>
                            </div>
                            {proposal.status === "pending_review" && (
                              <div className="flex items-center gap-2 mt-2">
                                {activeProposalId === proposal.id ? (
                                  <div className="flex items-center gap-2 w-full">
                                    <input
                                      type="text"
                                      placeholder="Reason for rejection (required)"
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                      className="flex-1 text-[11px] px-2 py-1 rounded border border-border bg-background focus:outline-none"
                                    />
                                    <button
                                      onClick={async () => {
                                        if (!rejectReason.trim()) return;
                                        await reject(proposal.id, rejectReason);
                                        setActiveProposalId(null);
                                        setRejectReason("");
                                      }}
                                      disabled={isRejecting || !rejectReason.trim()}
                                      className="text-[11px] px-2 py-1 rounded bg-iw-red text-white hover:bg-iw-red disabled:opacity-50"
                                    >
                                      {isRejecting ? "..." : "Confirm Reject"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveProposalId(null);
                                        setRejectReason("");
                                      }}
                                      className="text-[11px] px-2 py-1 rounded border border-border hover:bg-muted"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={async () => {
                                        await approve(proposal.id);
                                      }}
                                      disabled={isApproving}
                                      className="text-[11px] px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                    >
                                      {isApproving ? "..." : "Approve"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveProposalId(proposal.id);
                                        setRejectReason("");
                                      }}
                                      className="text-[11px] px-2.5 py-1 rounded border border-border hover:bg-muted"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            {proposal.status === "approved" && (
                              <span className="inline-block mt-2 text-[10px] font-medium text-iw-forest-mid bg-iw-forest/5 px-2 py-0.5 rounded">
                                Approved — awaiting execution
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Card Footer Actions */}
                <div className="px-5 py-3 border-t border-border/50 bg-muted/20 flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/work/entity/${account.accountId}`)}
                    className="flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    View 360 <ArrowRight className="w-3 h-3" />
                  </button>
                  {account.primaryContactEmail && (
                    <a
                      href={`mailto:${account.primaryContactEmail}`}
                      className="flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <Mail className="w-3 h-3" /> Contact
                    </a>
                  )}
                  <button
                    onClick={() => navigate(`/work/entity/${account.accountId}?tab=meetings`)}
                    className="flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Phone className="w-3 h-3" /> Schedule
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
