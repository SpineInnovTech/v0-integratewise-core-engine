/**
 * Company Growth & Operations View
 * Executive Lens 2: "How is MY company doing? Revenue, growth categories, team ops, market position."
 *
 * Aggregates: Account Master, People & Team, Tasks, Engagement Log, Risk Register,
 *             Initiatives, Insights, Capabilities, Platform Health
 */
import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Globe, Shield,
  Clock, CheckCircle, AlertTriangle, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, Calendar, MessageSquare, Briefcase, Star,
  Building2, Minus,
} from "lucide-react";
import {
  accountMasterData, peopleTeamData as teamData, taskManagerData, engagementLogData,
  riskRegisterData, initiativesData, generatedInsightsData,
  capabilitiesData, platformHealthData, valueStreamsData,
  formatCurrency, formatNumber, getAccountName,
} from "../csm-intelligence-data";

// ─── Revenue & growth calculations ──────────────────────────────────────────

function useCompanyMetrics() {
  return useMemo(() => {
    const accounts = accountMasterData;
    const totalARR = accounts.reduce((s, a) => s + a.arr, 0);
    const totalACV = accounts.reduce((s, a) => s + a.acv, 0);
    const activeAccounts = accounts.filter(a => a.accountStatus === "Active").length;
    const atRiskAccounts = accounts.filter(a => a.accountStatus === "At Risk").length;
    const avgHealthScore = Math.round(accounts.reduce((s, a) => s + a.healthScore, 0) / accounts.length);

    // Segment by tier
    const byTier: Record<string, { count: number; arr: number; avgHealth: number }> = {};
    accounts.forEach(a => {
      if (!byTier[a.contractType]) byTier[a.contractType] = { count: 0, arr: 0, avgHealth: 0 };
      byTier[a.contractType].count++;
      byTier[a.contractType].arr += a.arr;
      byTier[a.contractType].avgHealth += a.healthScore;
    });
    Object.values(byTier).forEach(t => { t.avgHealth = Math.round(t.avgHealth / t.count); });

    // Segment by vertical
    const byVertical: Record<string, { count: number; arr: number; avgHealth: number }> = {};
    accounts.forEach(a => {
      if (!byVertical[a.industryVertical]) byVertical[a.industryVertical] = { count: 0, arr: 0, avgHealth: 0 };
      byVertical[a.industryVertical].count++;
      byVertical[a.industryVertical].arr += a.arr;
      byVertical[a.industryVertical].avgHealth += a.healthScore;
    });
    Object.values(byVertical).forEach(v => { v.avgHealth = Math.round(v.avgHealth / v.count); });

    // Segment by geography
    const byGeo: Record<string, { count: number; arr: number }> = {};
    accounts.forEach(a => {
      if (!byGeo[a.geography]) byGeo[a.geography] = { count: 0, arr: 0 };
      byGeo[a.geography].count++;
      byGeo[a.geography].arr += a.arr;
    });

    // Renewal pipeline
    const renewalsNext30 = accounts.filter(a => a.daysToRenewal <= 30);
    const renewalsNext90 = accounts.filter(a => a.daysToRenewal <= 90);
    const renewalARRNext30 = renewalsNext30.reduce((s, a) => s + a.arr, 0);
    const renewalARRNext90 = renewalsNext90.reduce((s, a) => s + a.arr, 0);
    const criticalRenewals = renewalsNext30.filter(a => a.renewalRiskLevel === "Critical");

    // Tasks
    const totalTasks = taskManagerData.length;
    const overdueTasks = taskManagerData.filter(t => t.status === "Overdue").length;
    const criticalTasks = taskManagerData.filter(t => t.priority === "Critical").length;
    const completedTasks = taskManagerData.filter(t => t.status === "Done").length;

    // Engagements
    const totalEngagements = engagementLogData.length;
    const avgSentiment = engagementLogData.reduce((s, e) => {
      const scores: Record<string, number> = { "Very Positive": 5, "Positive": 4, "Neutral": 3, "Negative": 2, "Concerning": 1 };
      return s + (scores[e.sentiment] || 3);
    }, 0) / engagementLogData.length;

    // Risks
    const openRisks = riskRegisterData.filter(r => r.status !== "Resolved").length;
    const criticalRisks = riskRegisterData.filter(r => r.riskLevel === "Critical").length;

    // Initiatives
    const totalInitiatives = initiativesData.length;
    const onTrackInit = initiativesData.filter(i => i.status === "On Track").length;
    const blockedInit = initiativesData.filter(i => i.status === "Blocked").length;
    const totalInvestment = initiativesData.reduce((s, i) => s + i.investmentAmountUsd, 0);
    const totalExpectedBenefit = initiativesData.reduce((s, i) => s + i.expectedAnnualBenefitUsd, 0);
    const totalRealizedBenefit = initiativesData.reduce((s, i) => s + i.realizedAnnualBenefitUsd, 0);

    // Insights
    const newInsights = generatedInsightsData.filter(i => i.status === "New").length;
    const actionedInsights = generatedInsightsData.filter(i => i.status === "Actioned").length;

    // Team
    const activeCSMs = teamData.filter(t => t.activeStatus === "Active" && t.accountCount > 0).length;
    const avgAccPerCSM = Math.round(accounts.length / Math.max(activeCSMs, 1));
    const avgARRPerCSM = Math.round(totalARR / Math.max(activeCSMs, 1));

    // Value delivered
    const totalValueDelivered = valueStreamsData.reduce((s, v) => s + v.totalBusinessValueUsd, 0);

    return {
      totalARR, totalACV, activeAccounts, atRiskAccounts, avgHealthScore,
      byTier, byVertical, byGeo,
      renewalsNext30, renewalsNext90, renewalARRNext30, renewalARRNext90, criticalRenewals,
      totalTasks, overdueTasks, criticalTasks, completedTasks,
      totalEngagements, avgSentiment,
      openRisks, criticalRisks,
      totalInitiatives, onTrackInit, blockedInit,
      totalInvestment, totalExpectedBenefit, totalRealizedBenefit,
      newInsights, actionedInsights,
      activeCSMs, avgAccPerCSM, avgARRPerCSM,
      totalValueDelivered,
      accounts,
    };
  }, []);
}

// ─── Color helpers ─────────────────────────────────────────────────────────

const tierColors: Record<string, string> = {
  Enterprise: "#3b82f6", Growth: "#10b981", Standard: "#f59e0b",
};
const vertColors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

// ─── Component ─────────────────────────────────────────────────────────────

export function CompanyGrowthView() {
  const m = useCompanyMetrics();
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "operations" | "team">("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: "revenue" as const, label: "Revenue & Clients", icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: "operations" as const, label: "Daily Operations", icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "team" as const, label: "Team & Capacity", icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="h-full overflow-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl text-foreground flex items-center gap-2" style={{ fontWeight: 700 }}>
          <Building2 className="w-5 h-5 text-emerald-500" /> Company Growth & Operations
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Revenue health, client portfolio, category growth, team productivity, and daily operations pulse
        </p>
      </div>

      {/* Tab Nav */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
              activeTab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontWeight: activeTab === t.id ? 600 : 400 }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab m={m} />}
      {activeTab === "revenue" && <RevenueTab m={m} />}
      {activeTab === "operations" && <OperationsTab m={m} />}
      {activeTab === "team" && <TeamTab m={m} />}
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────

function OverviewTab({ m }: { m: ReturnType<typeof useCompanyMetrics> }) {
  return (
    <div className="space-y-6">
      {/* Hero KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total ARR", value: formatCurrency(m.totalARR), icon: <DollarSign className="w-4 h-4" />, color: "#3b82f6", sub: `${m.accounts.length} accounts` },
          { label: "Avg Health", value: m.avgHealthScore.toString(), icon: <Star className="w-4 h-4" />, color: m.avgHealthScore >= 75 ? "#22c55e" : "#f59e0b", sub: `${m.atRiskAccounts} at risk` },
          { label: "Value Delivered", value: formatCurrency(m.totalValueDelivered), icon: <TrendingUp className="w-4 h-4" />, color: "#10b981", sub: "To all clients" },
          { label: "ROI Realized", value: formatCurrency(m.totalRealizedBenefit), icon: <ArrowUpRight className="w-4 h-4" />, color: "#8b5cf6", sub: `of ${formatCurrency(m.totalExpectedBenefit)} expected` },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">{k.icon}<span className="text-[10px] uppercase tracking-wider">{k.label}</span></div>
            <p className="text-2xl" style={{ fontWeight: 700, color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Renewal Pipeline + Risk Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Renewal Pipeline */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm text-foreground" style={{ fontWeight: 600 }}>Renewal Pipeline</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-lg" style={{ fontWeight: 700, color: "#ef4444" }}>{m.criticalRenewals.length}</p>
              <p className="text-[9px] text-muted-foreground uppercase">Critical</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-lg" style={{ fontWeight: 700, color: "#f59e0b" }}>{formatCurrency(m.renewalARRNext30)}</p>
              <p className="text-[9px] text-muted-foreground uppercase">ARR due 30d</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <p className="text-lg" style={{ fontWeight: 700, color: "#3b82f6" }}>{formatCurrency(m.renewalARRNext90)}</p>
              <p className="text-[9px] text-muted-foreground uppercase">ARR due 90d</p>
            </div>
          </div>
          {m.renewalsNext30.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontWeight: 600 }}>Next 30 Days</p>
              {m.renewalsNext30.map(a => (
                <div key={a.accountId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: a.renewalRiskLevel === "Critical" ? "#ef4444" : a.renewalRiskLevel === "Medium" ? "#f59e0b" : "#22c55e" }} />
                    <span style={{ fontWeight: 500 }}>{a.accountName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{a.daysToRenewal}d</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(a.arr)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risk & Initiatives Summary */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm text-foreground" style={{ fontWeight: 600 }}>Risk & Execution Posture</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontWeight: 600 }}>Risks</p>
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-red-500/60" />
                <div>
                  <p className="text-lg" style={{ fontWeight: 700, color: "#ef4444" }}>{m.criticalRisks}</p>
                  <p className="text-[10px] text-muted-foreground">Critical / {m.openRisks} open</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontWeight: 600 }}>Initiatives</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-500/60" />
                <div>
                  <p className="text-lg" style={{ fontWeight: 700, color: "#22c55e" }}>{m.onTrackInit}/{m.totalInitiatives}</p>
                  <p className="text-[10px] text-muted-foreground">On Track · {m.blockedInit} blocked</p>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2" style={{ fontWeight: 600 }}>Investment vs Return</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Invested</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(m.totalInvestment)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: "100%" }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Realized</span>
                  <span style={{ fontWeight: 600, color: "#10b981" }}>{formatCurrency(m.totalRealizedBenefit)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round(m.totalRealizedBenefit / m.totalExpectedBenefit * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{m.newInsights} new AI insights · {m.actionedInsights} actioned</span>
          </div>
        </div>
      </div>

      {/* Category Growth */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm text-foreground" style={{ fontWeight: 600 }}>Category & Vertical Growth</h3>
        <p className="text-[10px] text-muted-foreground">Which verticals and contract tiers are driving company growth?</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* By Vertical */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2" style={{ fontWeight: 600 }}>By Industry Vertical</p>
            <div className="space-y-2">
              {Object.entries(m.byVertical).sort(([, a], [, b]) => b.arr - a.arr).map(([vert, data], i) => (
                <div key={vert} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: vertColors[i % vertColors.length] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground truncate" style={{ fontWeight: 500 }}>{vert}</span>
                      <span className="text-xs flex-shrink-0" style={{ fontWeight: 600 }}>{formatCurrency(data.arr)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1">
                      <div className="h-full rounded-full" style={{ width: `${(data.arr / m.totalARR) * 100}%`, background: vertColors[i % vertColors.length] }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>{data.count} account{data.count > 1 ? "s" : ""}</span>
                      <span>Avg health: {data.avgHealth}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Tier */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2" style={{ fontWeight: 600 }}>By Contract Tier</p>
            <div className="space-y-2">
              {Object.entries(m.byTier).sort(([, a], [, b]) => b.arr - a.arr).map(([tier, data]) => (
                <div key={tier} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: tierColors[tier] || "#64748b" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground" style={{ fontWeight: 500 }}>{tier}</span>
                      <span className="text-xs" style={{ fontWeight: 600 }}>{formatCurrency(data.arr)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1">
                      <div className="h-full rounded-full" style={{ width: `${(data.arr / m.totalARR) * 100}%`, background: tierColors[tier] || "#64748b" }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>{data.count} account{data.count > 1 ? "s" : ""} · {Math.round(data.arr / m.totalARR * 100)}% of ARR</span>
                      <span>Avg health: {data.avgHealth}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Geo Distribution */}
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-4 mb-2" style={{ fontWeight: 600 }}>By Geography</p>
            <div className="space-y-1.5">
              {Object.entries(m.byGeo).sort(([, a], [, b]) => b.arr - a.arr).map(([geo, data]) => (
                <div key={geo} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-muted-foreground" />
                    <span style={{ fontWeight: 500 }}>{geo}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{data.count} acct{data.count > 1 ? "s" : ""}</span>
                    <span style={{ fontWeight: 600, color: "#3b82f6" }}>{formatCurrency(data.arr)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Revenue Tab ───────────────────────────────────────────────────────────

function RevenueTab({ m }: { m: ReturnType<typeof useCompanyMetrics> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total ARR", value: formatCurrency(m.totalARR), color: "#3b82f6" },
          { label: "Total ACV", value: formatCurrency(m.totalACV), color: "#8b5cf6" },
          { label: "Active Accounts", value: m.activeAccounts.toString(), color: "#22c55e" },
          { label: "At Risk", value: m.atRiskAccounts.toString(), color: "#ef4444" },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className="text-xl mt-1" style={{ fontWeight: 700, color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Full Account Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["Account", "Industry", "Contract", "ARR", "ACV", "Health", "Trend", "SP Rating", "Renewal", "Risk", "Status"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.accounts.sort((a, b) => b.arr - a.arr).map(a => (
                <tr key={a.accountId} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="text-foreground" style={{ fontWeight: 600 }}>{a.accountName}</span>
                    <p className="text-[10px] text-muted-foreground">{a.country}</p>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.industryVertical}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] text-white" style={{ fontWeight: 600, background: tierColors[a.contractType] || "#64748b" }}>{a.contractType}</span>
                  </td>
                  <td className="px-3 py-2.5" style={{ fontWeight: 600 }}>{formatCurrency(a.arr)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{formatCurrency(a.acv)}</td>
                  <td className="px-3 py-2.5" style={{ fontWeight: 700, color: a.healthScore >= 80 ? "#22c55e" : a.healthScore >= 60 ? "#f59e0b" : "#ef4444" }}>{a.healthScore}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {a.healthScoreTrend3M === "Improving" ? <TrendingUp className="w-3 h-3 text-green-500" /> : a.healthScoreTrend3M === "Declining" ? <TrendingDown className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
                      <span className="text-[10px]" style={{ color: a.healthScoreChange > 0 ? "#22c55e" : a.healthScoreChange < 0 ? "#ef4444" : undefined }}>{a.healthScoreChange > 0 ? "+" : ""}{a.healthScoreChange}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5" style={{ fontWeight: 600 }}>{a.spRating}</td>
                  <td className="px-3 py-2.5">
                    <span style={{ fontWeight: 600, color: a.daysToRenewal <= 30 ? "#ef4444" : a.daysToRenewal <= 90 ? "#f59e0b" : "#22c55e" }}>{a.daysToRenewal}d</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                      fontWeight: 600,
                      background: a.renewalRiskLevel === "Critical" ? "rgba(239,68,68,0.1)" : a.renewalRiskLevel === "Medium" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)",
                      color: a.renewalRiskLevel === "Critical" ? "#ef4444" : a.renewalRiskLevel === "Medium" ? "#f59e0b" : "#22c55e",
                    }}>{a.renewalRiskLevel}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                      fontWeight: 600,
                      background: a.accountStatus === "Active" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: a.accountStatus === "Active" ? "#22c55e" : "#ef4444",
                    }}>{a.accountStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Operations Tab ────────────────────────────────────────────────────────

function OperationsTab({ m }: { m: ReturnType<typeof useCompanyMetrics> }) {
  return (
    <div className="space-y-4">
      {/* Ops KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tasks", value: m.totalTasks.toString(), color: "#3b82f6", sub: `${m.completedTasks} done` },
          { label: "Overdue", value: m.overdueTasks.toString(), color: "#ef4444", sub: `${m.criticalTasks} critical` },
          { label: "Engagements", value: m.totalEngagements.toString(), color: "#8b5cf6", sub: `Avg sentiment ${m.avgSentiment.toFixed(1)}/5` },
          { label: "Open Risks", value: m.openRisks.toString(), color: "#f59e0b", sub: `${m.criticalRisks} critical` },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className="text-xl mt-1" style={{ fontWeight: 700, color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task Feed */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm text-foreground" style={{ fontWeight: 600 }}>Active Task Stream</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {taskManagerData.sort((a, b) => {
              const priorityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
              return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
            }).map(t => (
              <div key={t.taskId} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/20 transition-colors">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{
                  background: t.status === "Overdue" ? "#ef4444" : t.status === "In Progress" ? "#3b82f6" : t.status === "Done" ? "#22c55e" : "#64748b",
                }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground" style={{ fontWeight: 500 }}>{t.taskName}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>{t.owner}</span>
                    <span>·</span>
                    <span>{getAccountName(t.account)}</span>
                    <span>·</span>
                    <span style={{ color: t.status === "Overdue" ? "#ef4444" : undefined, fontWeight: t.status === "Overdue" ? 600 : 400 }}>{t.status}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    <span className="text-[8px] px-1 py-0.5 rounded" style={{
                      fontWeight: 600,
                      background: t.priority === "Critical" ? "rgba(239,68,68,0.1)" : t.priority === "High" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
                      color: t.priority === "Critical" ? "#ef4444" : t.priority === "High" ? "#f59e0b" : "#3b82f6",
                    }}>{t.priority}</span>
                    {t.linkedObjective && <span className="text-[8px] px-1 py-0.5 rounded bg-green-500/10 text-green-600" style={{ fontWeight: 500 }}>{t.linkedObjective}</span>}
                    {t.linkedMetric && <span className="text-[8px] px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-700" style={{ fontWeight: 500 }}>{t.linkedMetric}</span>}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{t.dueDate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Feed */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm text-foreground" style={{ fontWeight: 600 }}>Recent Engagements</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {engagementLogData.sort((a, b) => b.engagementDate.localeCompare(a.engagementDate)).map(e => {
              const sentimentColors: Record<string, string> = { "Very Positive": "#22c55e", "Positive": "#10b981", "Neutral": "#64748b", "Negative": "#f59e0b", "Concerning": "#ef4444" };
              return (
                <div key={e.engagementId} className="p-3 rounded-lg border border-border/50 hover:bg-secondary/20 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-foreground" style={{ fontWeight: 600 }}>{getAccountName(e.account)}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{e.engagementDate}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{e.engagementType} · {e.customerSeniority}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ fontWeight: 600, background: `${sentimentColors[e.sentiment]}15`, color: sentimentColors[e.sentiment] }}>{e.sentiment}</span>
                    <span className="text-[9px] text-muted-foreground">Score: {e.relationshipDepthScore}/10</span>
                    {e.linkedStrategicObjectives.map(s => <span key={s} className="text-[8px] px-1 py-0.5 rounded bg-green-500/10 text-green-600" style={{ fontWeight: 500 }}>{s}</span>)}
                  </div>
                  {e.actionItems.length > 0 && (
                    <p className="text-[9px] text-muted-foreground italic">{e.actionItems.length} action items · Next: {e.nextEngagementDate}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm text-foreground" style={{ fontWeight: 600 }}>AI-Generated Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {generatedInsightsData.map(ins => {
            const statusColors: Record<string, string> = { New: "#3b82f6", Acknowledged: "#f59e0b", Actioned: "#22c55e", Dismissed: "#64748b" };
            return (
              <div key={ins.insightId} className="p-3 rounded-lg border border-border/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ fontWeight: 600 }}>{getAccountName(ins.account)}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ fontWeight: 600, background: `${statusColors[ins.status]}15`, color: statusColors[ins.status] }}>{ins.status}</span>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{ins.insightText}</p>
                <div className="flex gap-1 flex-wrap">
                  {ins.linkedObjective && <span className="text-[8px] px-1 py-0.5 rounded bg-green-500/10 text-green-600" style={{ fontWeight: 500 }}>{ins.linkedObjective}</span>}
                  {ins.linkedMetric && <span className="text-[8px] px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-700" style={{ fontWeight: 500 }}>{ins.linkedMetric}</span>}
                  {ins.linkedRisk && <span className="text-[8px] px-1 py-0.5 rounded bg-red-500/10 text-red-600" style={{ fontWeight: 500 }}>{ins.linkedRisk}</span>}
                  {ins.linkedInitiative && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-700" style={{ fontWeight: 500 }}>{ins.linkedInitiative}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Team Tab ──────────────────────────────────────────────────────────────

function TeamTab({ m }: { m: ReturnType<typeof useCompanyMetrics> }) {
  // CSM workload analysis
  const csmWorkload = useMemo(() => {
    return teamData
      .filter(t => t.activeStatus === "Active" && t.accountCount > 0)
      .map(csm => {
        const tasks = taskManagerData.filter(t => t.owner === csm.fullName);
        const overdue = tasks.filter(t => t.status === "Overdue").length;
        const engagements = engagementLogData.filter(e => e.attendeesMuleSoft.includes(csm.fullName));
        const risks = riskRegisterData.filter(r => r.mitigationOwner === csm.fullName);
        return {
          ...csm,
          taskCount: tasks.length,
          overdueCount: overdue,
          engagementCount: engagements.length,
          riskCount: risks.length,
          workloadScore: tasks.length * 10 + overdue * 20 + risks.length * 15,
        };
      })
      .sort((a, b) => b.workloadScore - a.workloadScore);
  }, []);

  return (
    <div className="space-y-4">
      {/* Team KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active CSMs", value: m.activeCSMs.toString(), color: "#3b82f6" },
          { label: "Avg Accounts/CSM", value: m.avgAccPerCSM.toString(), color: "#8b5cf6" },
          { label: "Avg ARR/CSM", value: formatCurrency(m.avgARRPerCSM), color: "#10b981" },
          { label: "Portfolio Health", value: m.avgHealthScore.toString(), color: m.avgHealthScore >= 75 ? "#22c55e" : "#f59e0b" },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className="text-xl mt-1" style={{ fontWeight: 700, color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* CSM Workload Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {csmWorkload.map(csm => (
          <div key={csm.personId} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>{csm.fullName}</p>
                <p className="text-[10px] text-muted-foreground">{csm.role} · {csm.region}</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ fontWeight: 600 }}>{csm.accountCount} accounts</p>
                <p className="text-[10px] text-muted-foreground">{formatCurrency(csm.totalArrManaged)} ARR</p>
              </div>
            </div>

            {/* Workload bar */}
            <div>
              <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
                <span>Workload Score</span>
                <span style={{ fontWeight: 600, color: csm.workloadScore > 80 ? "#ef4444" : csm.workloadScore > 50 ? "#f59e0b" : "#22c55e" }}>{csm.workloadScore}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${Math.min(100, csm.workloadScore)}%`,
                  background: csm.workloadScore > 80 ? "#ef4444" : csm.workloadScore > 50 ? "#f59e0b" : "#22c55e",
                }} />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <p className="text-sm" style={{ fontWeight: 700 }}>{csm.taskCount}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-sm" style={{ fontWeight: 700, color: csm.overdueCount > 0 ? "#ef4444" : "#22c55e" }}>{csm.overdueCount}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Overdue</p>
              </div>
              <div className="text-center">
                <p className="text-sm" style={{ fontWeight: 700 }}>{csm.engagementCount}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Meetings</p>
              </div>
              <div className="text-center">
                <p className="text-sm" style={{ fontWeight: 700, color: csm.riskCount > 0 ? "#f59e0b" : "#22c55e" }}>{csm.riskCount}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Risks</p>
              </div>
            </div>

            {/* Account health */}
            <div className="pt-2 border-t border-border">
              <p className="text-[9px] text-muted-foreground mb-1.5" style={{ fontWeight: 600 }}>Account Health</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {csm.accountsAssigned.map(accId => {
                  const acc = accountMasterData.find(a => a.accountId === accId);
                  if (!acc) return null;
                  return (
                    <div key={accId} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border/50 text-[10px]">
                      <div className="w-2 h-2 rounded-full" style={{ background: acc.healthScore >= 80 ? "#22c55e" : acc.healthScore >= 60 ? "#f59e0b" : "#ef4444" }} />
                      <span style={{ fontWeight: 500 }}>{acc.accountName.split(" ")[0]}</span>
                      <span style={{ fontWeight: 700, color: acc.healthScore >= 80 ? "#22c55e" : acc.healthScore >= 60 ? "#f59e0b" : "#ef4444" }}>{acc.healthScore}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}