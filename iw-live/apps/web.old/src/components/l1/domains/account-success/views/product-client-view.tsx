/**
 * Product-Client Intelligence View
 * Executive Lens 1: "How is our product being used by clients? How does it help them? Is it growing WITH them?"
 *
 * Aggregates: Account Master, Capabilities, Value Streams, API Portfolio, Platform Health,
 *             Strategic Objectives, Stakeholder Outcomes, Initiatives
 */
import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Layers,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronDown,
  ChevronRight,
  Target,
  Heart,
  Wifi,
  BarChart3,
  Sparkles,
} from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  type AccountMaster,
  type MuleSoftCapability,
  type ValueStream,
  type APIPortfolio,
  type PlatformHealthMetric,
  type StrategicObjective,
  type StakeholderOutcome,
  type Initiative,
} from "../csm-intelligence-data";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";

// ─── Derived aggregations ────────────────────────────────────────────────────

function useProductMetrics() {
  const { data: batch } = useWorkspaceEntitiesBatch([
    "account_master",
    "capability",
    "value_stream",
    "api_portfolio",
    "platform_health",
    "strategic_objective",
    "stakeholder_outcome",
    "initiative",
  ]);
  const accountMasterData = (batch.account_master ?? []) as AccountMaster[];
  const capabilitiesData = (batch.capability ?? []) as MuleSoftCapability[];
  const valueStreamsData = (batch.value_stream ?? []) as ValueStream[];
  const apiPortfolioData = (batch.api_portfolio ?? []) as APIPortfolio[];
  const platformHealthData = (batch.platform_health ?? []) as PlatformHealthMetric[];
  const strategicObjectivesData = (batch.strategic_objective ?? []) as StrategicObjective[];
  const stakeholderOutcomesData = (batch.stakeholder_outcome ?? []) as StakeholderOutcome[];
  const initiativesData = (batch.initiative ?? []) as Initiative[];

  return useMemo(() => {
    const accounts = accountMasterData;
    const totalARR = accounts.reduce((s, a) => s + a.arr, 0);
    const avgHealth =
      accounts.length > 0
        ? Math.round(accounts.reduce((s, a) => s + a.healthScore, 0) / accounts.length)
        : 0;
    const totalAPIs = apiPortfolioData.length;
    const totalTxns = apiPortfolioData.reduce((s, a) => s + a.monthlyTransactions, 0);
    const healthyAPIs = apiPortfolioData.filter((a) => a.healthStatus === "Healthy").length;
    const totalValueDelivered = valueStreamsData.reduce((s, v) => s + v.totalBusinessValueUsd, 0);
    const totalCapabilities = capabilitiesData.length;
    const avgMaturity =
      capabilitiesData.length > 0
        ? +(
            capabilitiesData.reduce((s, c) => s + c.currentMaturityNum, 0) / capabilitiesData.length
          ).toFixed(1)
        : 0;
    const totalOutcomesOnTrack = stakeholderOutcomesData.filter(
      (o) => o.status === "On Track" || o.status === "Achieved"
    ).length;
    const totalOutcomes = stakeholderOutcomesData.length;
    const expansionReady = accounts.filter(
      (a) => a.healthScore >= 85 && a.healthScoreTrend3M === "Improving"
    ).length;
    const atRisk = accounts.filter((a) => a.healthScore < 60).length;

    return {
      totalARR,
      avgHealth,
      totalAPIs,
      totalTxns,
      healthyAPIs,
      totalValueDelivered,
      totalCapabilities,
      avgMaturity,
      totalOutcomesOnTrack,
      totalOutcomes,
      expansionReady,
      atRisk,
      accounts,
      capabilitiesData,
      apiPortfolioData,
      valueStreamsData,
      platformHealthData,
      strategicObjectivesData,
      stakeholderOutcomesData,
      initiativesData,
      accountMasterData,
    };
  }, [
    accountMasterData,
    capabilitiesData,
    valueStreamsData,
    apiPortfolioData,
    platformHealthData,
    strategicObjectivesData,
    stakeholderOutcomesData,
    initiativesData,
  ]);
}

// ─── Client adoption depth per account ──────────────────────────────────────

function getClientAdoption(accountId: string, data: ReturnType<typeof useProductMetrics>) {
  const caps = data.capabilitiesData.filter((c) => c.account === accountId);
  const apis = data.apiPortfolioData.filter((a) => a.account === accountId);
  const streams = data.valueStreamsData.filter((v) => v.account === accountId);
  const metrics = data.platformHealthData.filter((m) => m.account === accountId);
  const objectives = data.strategicObjectivesData.filter((o) => o.account === accountId);
  const outcomes = data.stakeholderOutcomesData.filter((o) => o.account === accountId);
  const initiatives = data.initiativesData.filter((i) => i.account === accountId);
  const account = data.accountMasterData.find((a) => a.accountId === accountId)!;

  const avgMaturity =
    caps.length > 0
      ? +(caps.reduce((s, c) => s + c.currentMaturityNum, 0) / caps.length).toFixed(1)
      : 0;
  const targetMaturity =
    caps.length > 0
      ? +(caps.reduce((s, c) => s + c.targetMaturityNum, 0) / caps.length).toFixed(1)
      : 0;
  const txnVolume = apis.reduce((s, a) => s + a.monthlyTransactions, 0);
  const valueDelivered = streams.reduce((s, v) => s + v.totalBusinessValueUsd, 0);
  const healthyMetrics = metrics.filter((m) => m.healthStatus === "Healthy").length;
  const objProgress =
    objectives.length > 0
      ? Math.round(objectives.reduce((s, o) => s + o.progressPercent, 0) / objectives.length)
      : 0;
  const outcomeRate =
    outcomes.length > 0
      ? Math.round(
          (outcomes.filter((o) => o.status === "On Track" || o.status === "Achieved").length /
            outcomes.length) *
            100
        )
      : 0;

  return {
    account,
    caps,
    apis,
    streams,
    metrics,
    objectives,
    outcomes,
    initiatives,
    avgMaturity,
    targetMaturity,
    txnVolume,
    valueDelivered,
    healthyMetrics,
    totalMetrics: metrics.length,
    objProgress,
    outcomeRate,
    adoptionDepth: apis.length * 10 + caps.length * 15 + streams.length * 10 + avgMaturity * 10,
  };
}

// ─── Trend icon helper ─────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "Improving") return <TrendingUp className="w-3.5 h-3.5 text-iw-forest-bright" />;
  if (trend === "Declining") return <TrendingDown className="w-3.5 h-3.5 text-iw-red" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

// ─── Maturity bar ──────────────────────────────────────────────────────────

function MaturityBar({ current, target }: { current: number; target: number }) {
  const levels = ["Ad Hoc", "Initial", "Defined", "Advanced", "Optimized"];
  return (
    <div className="flex items-center gap-0.5">
      {levels.map((l, i) => (
        <div key={l} className="flex flex-col items-center gap-0.5">
          <div
            className="w-8 h-2 rounded-sm"
            style={{
              background:
                i + 1 <= current
                  ? "#3d7a50"
                  : i + 1 <= target
                    ? "rgba(61,122,80,0.15)"
                    : "rgba(0,0,0,0.05)",
              border: i + 1 === Math.ceil(target) ? "1px dashed #3d7a50" : "none",
            }}
          />
          <span className="text-[7px] text-muted-foreground">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function ProductClientView() {
  const m = useProductMetrics();
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Build per-client adoption data
  const clientAdoptions = useMemo(() => {
    const uniqueAccounts = [
      ...new Set([
        ...m.capabilitiesData.map((c) => c.account),
        ...m.apiPortfolioData.map((a) => a.account),
        ...m.valueStreamsData.map((v) => v.account),
      ]),
    ];
    return uniqueAccounts
      .map((id) => getClientAdoption(id, m))
      .sort((a, b) => b.adoptionDepth - a.adoptionDepth);
  }, [m]);

  const capabilityDomains = useMemo(() => {
    const domains: Record<string, { count: number; avgMaturity: number; accounts: string[] }> = {};
    m.capabilitiesData.forEach((c) => {
      if (!domains[c.capabilityDomain])
        domains[c.capabilityDomain] = { count: 0, avgMaturity: 0, accounts: [] };
      domains[c.capabilityDomain].count++;
      domains[c.capabilityDomain].avgMaturity += c.currentMaturityNum;
      if (!domains[c.capabilityDomain].accounts.includes(c.account))
        domains[c.capabilityDomain].accounts.push(c.account);
    });
    return Object.entries(domains)
      .map(([domain, d]) => ({
        domain,
        count: d.count,
        avgMaturity: +(d.avgMaturity / d.count).toFixed(1),
        clientCount: d.accounts.length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [m]);

  return (
    <div className="h-full overflow-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl text-foreground flex items-center gap-2" style={{ fontWeight: 700 }}>
          <Sparkles className="w-5 h-5 text-iw-slate-mid" /> Product-Client Intelligence
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          How our product is being used, how it helps clients grow, and where co-growth
          opportunities exist
        </p>
      </div>

      {/* ─── Top-Level KPIs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Total Client ARR",
            value: formatCurrency(m.totalARR),
            sub: `${m.accounts.length} accounts`,
            color: "#3d7a50",
            icon: <BarChart3 className="w-4 h-4" />,
          },
          {
            label: "Avg Health Score",
            value: m.avgHealth.toString(),
            sub: m.avgHealth >= 75 ? "Portfolio Healthy" : "Needs Attention",
            color: m.avgHealth >= 75 ? "#22c55e" : "#b8943f",
            icon: <Heart className="w-4 h-4" />,
          },
          {
            label: "APIs in Production",
            value: m.totalAPIs.toString(),
            sub: `${m.healthyAPIs}/${m.totalAPIs} healthy`,
            color: "#b8943f",
            icon: <Wifi className="w-4 h-4" />,
          },
          {
            label: "Monthly Transactions",
            value: formatNumber(m.totalTxns),
            sub: "Across all clients",
            color: "#3d7a50",
            icon: <Activity className="w-4 h-4" />,
          },
          {
            label: "Value Delivered",
            value: formatCurrency(m.totalValueDelivered),
            sub: `${m.totalCapabilities} capabilities`,
            color: "#3d7a50",
            icon: <Zap className="w-4 h-4" />,
          },
          {
            label: "Avg Maturity",
            value: `${m.avgMaturity}/5`,
            sub: "Platform adoption depth",
            color: "#b8943f",
            icon: <Layers className="w-4 h-4" />,
          },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {k.icon}
              <span className="text-[10px] uppercase tracking-wider">{k.label}</span>
            </div>
            <p className="text-xl" style={{ fontWeight: 700, color: k.color }}>
              {k.value}
            </p>
            <p className="text-[10px] text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Growth Signals Strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-green-500/20 bg-iw-forest-bright/5 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-iw-forest-bright/10 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-iw-forest-bright" />
          </div>
          <div>
            <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>
              {m.expansionReady} Expansion Ready
            </p>
            <p className="text-[10px] text-muted-foreground">
              Health 85+ & improving — upsell opportunity
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-iw-gold/20 bg-iw-gold/5 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-iw-gold/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-iw-gold" />
          </div>
          <div>
            <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>
              {m.totalOutcomesOnTrack}/{m.totalOutcomes} Outcomes On Track
            </p>
            <p className="text-[10px] text-muted-foreground">
              Stakeholder success metrics tracking
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-iw-red/10 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5 text-iw-red" />
          </div>
          <div>
            <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>
              {m.atRisk} At-Risk Product Fit
            </p>
            <p className="text-[10px] text-muted-foreground">
              Health under 60 — product not delivering value
            </p>
          </div>
        </div>
      </div>

      {/* ─── Client Adoption Depth ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm text-foreground" style={{ fontWeight: 600 }}>
              Client Adoption Depth
            </h2>
            <p className="text-[10px] text-muted-foreground">
              How deeply each client uses the product — capabilities, APIs, value streams, maturity
              progression
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2 py-1 rounded ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2 py-1 rounded ${viewMode === "table" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
            >
              Table
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {clientAdoptions.map((ca) => {
              const isExpanded = expandedClient === ca.account.accountId;
              return (
                <div
                  key={ca.account.accountId}
                  className="rounded-xl border border-border bg-card overflow-hidden transition-all"
                >
                  {/* Client Header */}
                  <button
                    onClick={() => setExpandedClient(isExpanded ? null : ca.account.accountId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            ca.account.healthScore >= 80
                              ? "rgba(34,197,94,0.1)"
                              : ca.account.healthScore >= 60
                                ? "rgba(245,158,11,0.1)"
                                : "rgba(239,68,68,0.1)",
                        }}
                      >
                        <span
                          className="text-lg"
                          style={{
                            fontWeight: 700,
                            color:
                              ca.account.healthScore >= 80
                                ? "#22c55e"
                                : ca.account.healthScore >= 60
                                  ? "#b8943f"
                                  : "#ef4444",
                          }}
                        >
                          {ca.account.healthScore}
                        </span>
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm text-foreground truncate" style={{ fontWeight: 600 }}>
                          {ca.account.accountName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {ca.account.industryVertical} · {formatCurrency(ca.account.arr)} ARR
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <TrendIcon trend={ca.account.healthScoreTrend3M} />
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">
                          {ca.apis.length} APIs · {ca.caps.length} Caps
                        </p>
                        <p className="text-[10px]" style={{ fontWeight: 500, color: "#b8943f" }}>
                          {formatNumber(ca.txnVolume)} txns/mo
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Adoption Depth Bar */}
                  <div className="px-4 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, ca.adoptionDepth)}%`,
                            background:
                              ca.adoptionDepth >= 80
                                ? "#22c55e"
                                : ca.adoptionDepth >= 50
                                  ? "#3d7a50"
                                  : "#b8943f",
                          }}
                        />
                      </div>
                      <span
                        className="text-[9px] text-muted-foreground"
                        style={{ fontWeight: 600 }}
                      >
                        {Math.min(100, ca.adoptionDepth)}%
                      </span>
                    </div>
                  </div>

                  {/* Quick Metrics Strip */}
                  <div className="grid grid-cols-4 gap-px bg-border/50 border-t border-border">
                    {[
                      { label: "Maturity", value: `${ca.avgMaturity}/${ca.targetMaturity}` },
                      { label: "Value", value: formatCurrency(ca.valueDelivered) },
                      { label: "Obj Progress", value: `${ca.objProgress}%` },
                      { label: "Outcomes", value: `${ca.outcomeRate}%` },
                    ].map((q) => (
                      <div key={q.label} className="bg-card px-3 py-2 text-center">
                        <p className="text-[8px] uppercase tracking-wider text-muted-foreground">
                          {q.label}
                        </p>
                        <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>
                          {q.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4 bg-secondary/10">
                      {/* Capability Maturity */}
                      {ca.caps.length > 0 && (
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2"
                            style={{ fontWeight: 600 }}
                          >
                            Capability Maturity Progression
                          </p>
                          <div className="space-y-2">
                            {ca.caps.map((c) => (
                              <div
                                key={c.capabilityId}
                                className="flex items-center justify-between gap-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="text-xs text-foreground truncate"
                                    style={{ fontWeight: 500 }}
                                  >
                                    {c.capabilityName}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground">
                                    {c.capabilityDomain} · {c.implementationStatus}
                                  </p>
                                </div>
                                <MaturityBar
                                  current={c.currentMaturityNum}
                                  target={c.targetMaturityNum}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* API Health */}
                      {ca.apis.length > 0 && (
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2"
                            style={{ fontWeight: 600 }}
                          >
                            API Usage & Health
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ca.apis.map((a) => (
                              <div
                                key={a.apiId}
                                className="flex items-center gap-2 rounded-lg bg-card border border-border/50 p-2"
                              >
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{
                                    background:
                                      a.healthStatus === "Healthy"
                                        ? "#22c55e"
                                        : a.healthStatus === "Warning"
                                          ? "#b8943f"
                                          : "#ef4444",
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="text-[10px] text-foreground truncate"
                                    style={{ fontWeight: 500 }}
                                  >
                                    {a.apiName}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground">
                                    {formatNumber(a.monthlyTransactions)} txns ·{" "}
                                    {a.avgResponseTimeMs}ms · {a.uptimePercent}% up
                                  </p>
                                </div>
                                <span
                                  className="text-[8px] px-1.5 py-0.5 rounded text-white flex-shrink-0"
                                  style={{
                                    fontWeight: 600,
                                    background:
                                      a.apiType === "System"
                                        ? "#3d7a50"
                                        : a.apiType === "Process"
                                          ? "#b8943f"
                                          : "#3d7a50",
                                  }}
                                >
                                  {a.apiType}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Value Streams */}
                      {ca.streams.length > 0 && (
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2"
                            style={{ fontWeight: 600 }}
                          >
                            Value Streams — Business Impact
                          </p>
                          {ca.streams.map((v) => (
                            <div
                              key={v.streamId}
                              className="flex items-center justify-between bg-card border border-border/50 rounded-lg p-2 mb-1.5"
                            >
                              <div>
                                <p
                                  className="text-[10px] text-foreground"
                                  style={{ fontWeight: 500 }}
                                >
                                  {v.valueStreamName}
                                </p>
                                <p className="text-[9px] text-muted-foreground">
                                  {v.businessProcess}
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className="text-[10px]"
                                  style={{ fontWeight: 600, color: "#3d7a50" }}
                                >
                                  {formatCurrency(v.totalBusinessValueUsd)}
                                </p>
                                <p className="text-[9px] text-muted-foreground">
                                  Cycle time: {v.cycleTimeReductionPercent}% reduced
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Objectives & Outcomes */}
                      {ca.objectives.length > 0 && (
                        <div>
                          <p
                            className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2"
                            style={{ fontWeight: 600 }}
                          >
                            Strategic Objective Alignment
                          </p>
                          {ca.objectives.map((o) => (
                            <div key={o.objectiveId} className="flex items-center gap-3 mb-1.5">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
                                style={{
                                  fontWeight: 700,
                                  background:
                                    o.healthIndicator === "Green"
                                      ? "rgba(34,197,94,0.1)"
                                      : o.healthIndicator === "Amber"
                                        ? "rgba(245,158,11,0.1)"
                                        : "rgba(239,68,68,0.1)",
                                  color:
                                    o.healthIndicator === "Green"
                                      ? "#22c55e"
                                      : o.healthIndicator === "Amber"
                                        ? "#b8943f"
                                        : "#ef4444",
                                }}
                              >
                                {o.progressPercent}%
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-[10px] text-foreground truncate"
                                  style={{ fontWeight: 500 }}
                                >
                                  {o.objectiveName}
                                </p>
                                <p className="text-[9px] text-muted-foreground">
                                  {o.strategicPillar} · {formatCurrency(o.businessValueUsd)} value
                                </p>
                              </div>
                              <div className="flex gap-1">
                                {o.linkedMetrics.map((mId) => (
                                  <span
                                    key={mId}
                                    className="text-[8px] px-1 py-0.5 rounded bg-iw-forest-bright/10 text-iw-forest-mid"
                                    style={{ fontWeight: 500 }}
                                  >
                                    {mId}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Table view */
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {[
                      "Client",
                      "Health",
                      "Trend",
                      "ARR",
                      "APIs",
                      "Txns/mo",
                      "Maturity",
                      "Value Delivered",
                      "Obj %",
                      "Outcome %",
                      "Depth",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                        style={{ fontWeight: 600 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientAdoptions.map((ca) => (
                    <tr
                      key={ca.account.accountId}
                      className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-3 py-2.5">
                        <p className="text-foreground" style={{ fontWeight: 600 }}>
                          {ca.account.accountName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {ca.account.industryVertical}
                        </p>
                      </td>
                      <td
                        className="px-3 py-2.5"
                        style={{
                          fontWeight: 700,
                          color:
                            ca.account.healthScore >= 80
                              ? "#22c55e"
                              : ca.account.healthScore >= 60
                                ? "#b8943f"
                                : "#ef4444",
                        }}
                      >
                        {ca.account.healthScore}
                      </td>
                      <td className="px-3 py-2.5">
                        <TrendIcon trend={ca.account.healthScoreTrend3M} />
                      </td>
                      <td className="px-3 py-2.5" style={{ fontWeight: 600 }}>
                        {formatCurrency(ca.account.arr)}
                      </td>
                      <td className="px-3 py-2.5">{ca.apis.length}</td>
                      <td className="px-3 py-2.5">{formatNumber(ca.txnVolume)}</td>
                      <td className="px-3 py-2.5">
                        {ca.avgMaturity}/{ca.targetMaturity}
                      </td>
                      <td className="px-3 py-2.5" style={{ fontWeight: 600, color: "#3d7a50" }}>
                        {formatCurrency(ca.valueDelivered)}
                      </td>
                      <td
                        className="px-3 py-2.5"
                        style={{
                          fontWeight: 600,
                          color: ca.objProgress >= 60 ? "#22c55e" : "#b8943f",
                        }}
                      >
                        {ca.objProgress}%
                      </td>
                      <td
                        className="px-3 py-2.5"
                        style={{
                          fontWeight: 600,
                          color: ca.outcomeRate >= 60 ? "#22c55e" : "#b8943f",
                        }}
                      >
                        {ca.outcomeRate}%
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, ca.adoptionDepth)}%`,
                                background: "#3d7a50",
                              }}
                            />
                          </div>
                          <span className="text-[9px]" style={{ fontWeight: 600 }}>
                            {Math.min(100, ca.adoptionDepth)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── Capability Category Breakdown ──────────────────────────────── */}
      <div>
        <h2 className="text-sm text-foreground mb-3" style={{ fontWeight: 600 }}>
          Product Capability Categories
        </h2>
        <p className="text-[10px] text-muted-foreground mb-3">
          Which product capabilities are clients adopting most? Where is the product growing?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {capabilityDomains.map((cd) => (
            <div key={cd.domain} className="rounded-xl border border-border bg-card p-3 space-y-2">
              <p
                className="text-[10px] uppercase tracking-wider text-muted-foreground"
                style={{ fontWeight: 600 }}
              >
                {cd.domain}
              </p>
              <p className="text-lg text-foreground" style={{ fontWeight: 700 }}>
                {cd.count}
              </p>
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span>
                  {cd.clientCount} client{cd.clientCount > 1 ? "s" : ""}
                </span>
                <span>Avg {cd.avgMaturity}/5</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-iw-slate-mid"
                  style={{ width: `${(cd.avgMaturity / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Co-Growth Matrix ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm text-foreground mb-1" style={{ fontWeight: 600 }}>
          Co-Growth Matrix
        </h2>
        <p className="text-[10px] text-muted-foreground mb-3">
          Is the product growing WITH the client? Compares client health trajectory with product
          adoption depth.
        </p>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Quadrant labels */}
            {[
              {
                label: "Growing Together",
                desc: "Health improving + deep adoption",
                color: "#22c55e",
                clients: clientAdoptions.filter(
                  (c) => c.account.healthScoreTrend3M === "Improving" && c.adoptionDepth >= 50
                ),
              },
              {
                label: "Underutilized",
                desc: "Health improving + shallow adoption",
                color: "#3d7a50",
                clients: clientAdoptions.filter(
                  (c) => c.account.healthScoreTrend3M === "Improving" && c.adoptionDepth < 50
                ),
              },
              {
                label: "At Risk",
                desc: "Health declining + deep adoption",
                color: "#b8943f",
                clients: clientAdoptions.filter(
                  (c) => c.account.healthScoreTrend3M === "Declining" && c.adoptionDepth >= 50
                ),
              },
              {
                label: "Churning",
                desc: "Health declining + shallow adoption",
                color: "#ef4444",
                clients: clientAdoptions.filter(
                  (c) => c.account.healthScoreTrend3M === "Declining" && c.adoptionDepth < 50
                ),
              },
            ].map((q) => (
              <div
                key={q.label}
                className="rounded-lg border border-border/50 p-3"
                style={{ borderColor: `${q.color}30` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: q.color }} />
                  <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>
                    {q.label}
                  </p>
                </div>
                <p className="text-[9px] text-muted-foreground mb-2">{q.desc}</p>
                {q.clients.length > 0 ? (
                  <div className="space-y-1">
                    {q.clients.map((c) => (
                      <div
                        key={c.account.accountId}
                        className="flex items-center justify-between text-[10px]"
                      >
                        <span className="text-foreground truncate" style={{ fontWeight: 500 }}>
                          {c.account.accountName}
                        </span>
                        <span style={{ fontWeight: 600, color: q.color }}>
                          {c.account.healthScore}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">No clients</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
