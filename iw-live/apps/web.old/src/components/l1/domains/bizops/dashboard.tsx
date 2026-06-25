/**
 * BizOps Home Dashboard — 14-Module Overview
 * Today's focus, cross-module KPIs, AI signals, HITL approval queue, quick nav.
 * Data: useHydrateProjection("bizops") + useWorkspaceEntities per entity type.
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Briefcase,
  CheckCircle,
  GitBranch,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Target,
  TrendingUp,
  Zap,
  Calendar,
  AlertTriangle,
  BarChart3,
  Globe,
  BookOpen,
  Database,
  Loader2,
  ChevronRight,
  Plus,
  ShoppingBag,
  Headphones,
  Brain,
  Megaphone,
  Sparkles,
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
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import { ReadinessBar } from "@/components/l2/spine/readiness-bar";
import { useSpine } from "@/components/l2/spine/spine-client";
import { useAuth } from "@/components/core/auth/auth-provider";
import { useL2Recommendations, useL2Decide } from "@/hooks/use-l2";
import { PendingApprovalsCard } from "@/components/_deprecated/l2-removed/approvals/pending-approvals-card";
import { ApprovalModal } from "@/components/_deprecated/l2-removed/approvals/approval-modal";
import type { PendingApproval } from "@/components/_deprecated/l2-removed/approvals/pending-approvals-card";
import type { L2Recommendation } from "@/lib/l2-client";
import {
  formatCurrency,
  healthColor,
  type Client,
  type Deal,
  type BizMetric,
  type AIBusinessInsight,
} from "./bizops-data";

/** Map L2 recommendation to PendingApproval shape. */
function recToApproval(rec: L2Recommendation): PendingApproval {
  const entity = rec.entity ?? { id: "", name: "Unknown", type: "account" };
  return {
    id: rec.id,
    type: "follow_up",
    title: rec.title,
    description: rec.description,
    entity: {
      id: entity.id,
      name: entity.name,
      type: (entity.type as "account" | "contact" | "deal" | "ticket") || "account",
    },
    urgency: "medium",
    confidence: 80,
    proposedAt: rec.createdAt,
    evidence: rec.evidenceSummary
      ? [{ type: "signal" as const, summary: rec.evidenceSummary }]
      : [],
    suggestedAction: rec.suggestedAction ?? rec.title,
    impact: rec.description,
  };
}

// ─── Module nav cards ────────────────────────────────────────────────────────
const MODULES = [
  { id: "strategic-hub", label: "Strategic Hub", icon: Target, color: "var(--iw-gold)" },
  { id: "metrics", label: "Metrics", icon: BarChart3, color: "var(--iw-forest-mid)" },
  { id: "brainstorm", label: "Brainstorm", icon: Brain, color: "#b8943f" },
  { id: "website", label: "Website", icon: Globe, color: "var(--iw-teal)" },
  { id: "crm", label: "CRM", icon: Users, color: "var(--iw-warning)" },
  { id: "marketing", label: "Marketing", icon: Megaphone, color: "var(--iw-pink)" },
  { id: "products", label: "Products", icon: ShoppingBag, color: "var(--iw-forest-mid)" },
  { id: "services", label: "Services", icon: Headphones, color: "var(--iw-gold)" },
  { id: "sales-hub", label: "Sales Hub", icon: TrendingUp, color: "var(--iw-success)" },
  { id: "clients", label: "Clients", icon: Briefcase, color: "var(--iw-forest-mid)" },
  { id: "tasks", label: "Tasks", icon: CheckCircle, color: "var(--iw-warning)" },
  { id: "knowledge-hub", label: "Knowledge", icon: BookOpen, color: "#b8943f" },
  { id: "integrations", label: "Integrations", icon: Database, color: "var(--iw-success)" },
  { id: "ops-command-center", label: "Command Center", icon: Zap, color: "var(--iw-danger)" },
];

interface BizOpsProjection {
  summary?: {
    mrr?: number;
    mrrChange?: number;
    pipelineValue?: number;
    activeClients?: number;
    clientsAtRisk?: number;
    openDeals?: number;
    tasksDueToday?: number;
    tasksOverdue?: number;
    workflowsRunning?: number;
    pageViewsToday?: number;
  };
  revenueTimeline?: { month: string; mrr: number; pipeline: number }[];
  dealsByStage?: { stage: string; count: number; value: number }[];
}

export function BizOpsDashboard() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { data: projection, loading } = useHydrateProjection<BizOpsProjection>("bizops");
  const { data: batch } = useWorkspaceEntitiesBatch([
    "account",
    "opportunity",
    "ops_metric",
    "generated_insight",
  ]);
  const spine = useSpine();
  const clients = (batch.account ?? []) as Client[];
  const deals = (batch.opportunity ?? []) as Deal[];
  const metrics = (batch.ops_metric ?? []) as BizMetric[];
  const insights = (batch.generated_insight ?? []) as AIBusinessInsight[];

  // HITL approval queue
  const l2Ctx = auth.user?.id
    ? { userId: auth.user.id, domain: "BIZOPS", viewId: "bizops-dashboard" }
    : null;
  const { data: recs = [] } = useL2Recommendations(l2Ctx, { status: "pending" });
  const decide = useL2Decide(l2Ctx);
  const approvals: PendingApproval[] = useMemo(() => recs.map(recToApproval), [recs]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);

  const handleApprove = async (approval: PendingApproval, feedback?: string) => {
    const rec = recs.find((r) => r.id === approval.id);
    if (rec) {
      await decide.mutateAsync({
        recommendationId: rec.id,
        decision: { decision: "approve", reason: feedback },
      });
    }
    setSelectedApproval(null);
  };
  const handleReject = async (approval: PendingApproval, reason: string) => {
    const rec = recs.find((r) => r.id === approval.id);
    if (rec) {
      await decide.mutateAsync({
        recommendationId: rec.id,
        decision: { decision: "reject", reason },
      });
    }
    setSelectedApproval(null);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const s = projection?.summary || {};
  const mrr = s.mrr ?? 0;
  const mrrChange = s.mrrChange ?? 0;
  const pipelineValue = s.pipelineValue ?? 0;
  const activeClients = s.activeClients ?? clients.length;
  const clientsAtRisk = s.clientsAtRisk ?? clients.filter((c) => c.health !== "healthy").length;
  const openDeals = s.openDeals ?? deals.filter((d) => !["won", "lost"].includes(d.stage)).length;
  const tasksDueToday = s.tasksDueToday ?? 0;
  const tasksOverdue = s.tasksOverdue ?? 0;
  const workflowsRunning = s.workflowsRunning ?? 0;

  const revenueTimeline = projection?.revenueTimeline || [];
  const dealsByStage = projection?.dealsByStage || [];

  const STAGE_COLORS = [
    "var(--iw-forest-mid)",
    "var(--iw-gold)",
    "var(--iw-warning)",
    "#b8943f",
    "var(--iw-success)",
  ];

  const newInsights = insights.filter((i) => i.status === "new").slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="bizops" />

      {/* Today header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{today}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Business Operations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your 14-module command center</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Quick Add
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          {
            label: "MRR",
            value: formatCurrency(mrr),
            sub: `${mrrChange >= 0 ? "+" : ""}${mrrChange}%`,
            positive: mrrChange >= 0,
            color: "var(--iw-success)",
            icon: DollarSign,
          },
          {
            label: "Pipeline",
            value: formatCurrency(pipelineValue),
            sub: `${openDeals} open deals`,
            positive: true,
            color: "var(--iw-forest-mid)",
            icon: TrendingUp,
          },
          {
            label: "Clients",
            value: String(activeClients),
            sub: `${clientsAtRisk} at risk`,
            positive: clientsAtRisk === 0,
            color: "var(--iw-gold)",
            icon: Briefcase,
          },
          {
            label: "Tasks Due",
            value: String(tasksDueToday),
            sub: `${tasksOverdue} overdue`,
            positive: tasksOverdue === 0,
            color: tasksOverdue > 0 ? "var(--iw-danger)" : "var(--iw-warning)",
            icon: CheckCircle,
          },
          {
            label: "Workflows",
            value: String(workflowsRunning),
            sub: "running now",
            positive: workflowsRunning > 0,
            color: "var(--iw-teal)",
            icon: GitBranch,
          },
          {
            label: "AI Signals",
            value: String(newInsights.length),
            sub: "need review",
            positive: newInsights.length === 0,
            color: "var(--iw-pink)",
            icon: Zap,
          },
          {
            label: "Integrations",
            value: String(spine.connectedApps.length),
            sub: "connected",
            positive: spine.connectedApps.length > 0,
            color: "var(--iw-success)",
            icon: Database,
          },
        ].map(({ label, value, sub, positive, color, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {label}
              </span>
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: `${color}15`, color }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold" style={{ color }}>
              {value}
            </div>
            <div className="flex items-center gap-0.5 mt-0.5">
              {positive ? (
                <ArrowUpRight className="w-3 h-3 text-[var(--iw-success)]" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-[var(--iw-danger)]" />
              )}
              <span className="text-[10px] text-muted-foreground">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Revenue & Pipeline Trend</h3>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--iw-success)]" />
                MRR
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--iw-forest-mid)]" />
                Pipeline
              </span>
            </div>
          </div>
          {revenueTimeline.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTimeline}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--iw-success)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--iw-success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    stroke="var(--iw-success)"
                    fill="url(#mrrGrad)"
                    strokeWidth={2}
                    name="MRR"
                  />
                  <Area
                    type="monotone"
                    dataKey="pipeline"
                    stroke="var(--iw-forest-mid)"
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    name="Pipeline"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              Connect billing & CRM to see revenue trends
            </div>
          )}
        </div>

        {/* Deals by stage */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Pipeline by Stage</h3>
          {dealsByStage.length > 0 ? (
            <>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dealsByStage}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {dealsByStage.map((_, i) => (
                        <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {dealsByStage.map((d, i) => (
                  <div key={d.stage} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }}
                      />
                      <span className="capitalize">{d.stage}</span>
                    </span>
                    <span className="font-medium">
                      {d.count} · {formatCurrency(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
              Connect CRM to see pipeline
            </div>
          )}
        </div>
      </div>

      {/* AI Signals + At-risk clients + Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Signals */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--iw-pink)]" /> AI Business Signals
            </h3>
            <span className="text-[10px] text-muted-foreground">{newInsights.length} new</span>
          </div>
          {newInsights.length > 0 ? (
            <div className="space-y-2">
              {newInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{insight.signal}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {insight.recommendation}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                        insight.priority === "high"
                          ? "bg-[var(--iw-danger)]/10 text-[var(--iw-danger)]"
                          : insight.priority === "medium"
                            ? "bg-[var(--iw-warning)]/10 text-[var(--iw-warning)]"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {insight.priority}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {insight.module}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No new signals. AI insights appear as data flows through the Spine.
            </p>
          )}
        </div>

        {/* At-risk clients */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--iw-warning)]" /> Client Health
            </h3>
            <span className="text-[10px] text-muted-foreground">{clients.length} total</span>
          </div>
          {clients.length > 0 ? (
            <div className="space-y-2">
              {[...clients]
                .sort((a, b) => a.healthScore - b.healthScore)
                .slice(0, 5)
                .map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: healthColor(client.health) }}
                    >
                      {client.healthScore}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(client.arr)} ARR · {client.csm}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${
                        client.health === "healthy"
                          ? "bg-[var(--iw-success)]/10 text-[var(--iw-success)]"
                          : client.health === "at-risk"
                            ? "bg-[var(--iw-warning)]/10 text-[var(--iw-warning)]"
                            : "bg-[var(--iw-danger)]/10 text-[var(--iw-danger)]"
                      }`}
                    >
                      {client.health}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Connect CRM to see client health
            </p>
          )}
        </div>

        {/* Action Queue — HITL queue */}
        <PendingApprovalsCard
          approvals={approvals}
          onApprovalClick={setSelectedApproval}
          onQuickApprove={(a) => handleApprove(a)}
          onQuickReject={(a) => handleReject(a, "Quick rejected from queue")}
        />
      </div>

      {/* Approval Modal */}
      {selectedApproval && (
        <ApprovalModal
          approval={selectedApproval}
          isOpen={!!selectedApproval}
          onClose={() => setSelectedApproval(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Module quick nav */}
      <div>
        <h3 className="text-sm font-semibold mb-3">All Modules</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {MODULES.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => navigate(`/app/work/${id}`, { replace: true })}
              className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-lg hover:shadow-sm hover:border-primary/30 transition-all group"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}15`, color }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BizOpsDashboard;
