/**
 * Customer Success — Today view with L2 insights + HITL action queue
 * CS happy path: Today's overview with AI insights, pending approvals, and execution status.
 * L2: useL2Insights(CUSTOMER_SUCCESS, cs-today) + useL2Recommendations + dismiss functionality.
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity,
  Heart,
  Zap,
  X,
  ThumbsUp,
  Loader2,
  RefreshCw,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useL2Insights,
  useL2DismissInsight,
  useL2Recommendations,
  useL2Decide,
} from "@/hooks/use-l2";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import { PendingApprovalsCard } from "@/components/_deprecated/l2-removed/approvals/pending-approvals-card";
import { ApprovalModal } from "@/components/_deprecated/l2-removed/approvals/approval-modal";
import { ExecutionStatusCard } from "@/components/_deprecated/l2-removed/approvals/execution-status-card";
import { useExecutionStatus } from "@/hooks/use-api";
import type { PendingApproval } from "@/components/_deprecated/l2-removed/approvals/pending-approvals-card";
import type { L2Insight, L2Recommendation } from "@/lib/l2-client";
import type {
  AccountMaster,
  TaskItem,
  TechnicalRisk,
  EngagementLog,
} from "../csm-intelligence-data";

/** Map L2 recommendation to PendingApproval shape for the card/modal. */
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

function CSInsightCard({
  insight,
  onDismiss,
  isLoading,
}: {
  insight: L2Insight;
  onDismiss: () => void;
  isLoading: boolean;
}) {
  return (
    <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/10 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-iw-gold/10 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-iw-gold" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-1 text-xs">
                Suggested by IntegrateWise
              </Badge>
              <CardTitle className="text-sm font-semibold">{insight.title}</CardTitle>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insight.whyItMatters && (
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Why it matters
            </h4>
            <p className="text-sm text-gray-700">{insight.whyItMatters}</p>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          {new Date(insight.createdAt).toLocaleDateString()}
          {insight.severity && (
            <Badge
              variant={
                insight.severity === "high"
                  ? "destructive"
                  : insight.severity === "medium"
                    ? "default"
                    : "secondary"
              }
              className="ml-auto"
            >
              {insight.severity} priority
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CSTodayView() {
  const auth = useAuth();
  const navigate = useNavigate();
  const l2Ctx = auth.user?.id
    ? { userId: auth.user.id, domain: "CUSTOMER_SUCCESS", viewId: "cs-today" }
    : null;
  const { data: insights = [], isLoading } = useL2Insights(l2Ctx);
  const dismissMutation = useL2DismissInsight(l2Ctx);

  // HITL approval queue — pending recommendations from the Cognitive Layer
  const { data: recs = [] } = useL2Recommendations(l2Ctx, { status: "pending" });
  const decide = useL2Decide(l2Ctx);
  const approvals: PendingApproval[] = useMemo(() => recs.map(recToApproval), [recs]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);

  // Execution status — live polling from actions table
  const { data: executions = [] } = useExecutionStatus(10);

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

  const { data: batch, isLoading: loadingEntities } = useWorkspaceEntitiesBatch([
    "account_master",
    "task_item",
    "risk",
    "engagement_log",
  ]);
  const accounts = (batch.account_master ?? []) as AccountMaster[];
  const tasks = (batch.task_item ?? []) as TaskItem[];
  const risks = (batch.risk ?? []) as TechnicalRisk[];
  const engagements = (batch.engagement_log ?? []) as EngagementLog[];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Computed metrics from real entity data
  const activeAccounts = accounts.filter((a) => a.accountStatus === "Active").length;
  const atRiskAccounts = accounts.filter(
    (a) => a.healthScore < 60 || a.accountStatus === "At Risk"
  ).length;
  const avgHealth =
    accounts.length > 0
      ? Math.round(accounts.reduce((s, a) => s + a.healthScore, 0) / accounts.length)
      : 0;
  const openTasks = tasks.filter((t) => t.status === "Open" || t.status === "In Progress").length;
  const renewalsThisMonth = accounts.filter((a) => a.daysToRenewal <= 30).length;
  const criticalAccounts = accounts.filter((a) => a.healthScore < 60);
  const upcomingRenewals = accounts.filter((a) => a.daysToRenewal <= 14);
  const positiveEngagements = engagements.filter(
    (e) => e.sentiment === "Very Positive" || e.sentiment === "Positive"
  ).length;
  const sentimentRate =
    engagements.length > 0 ? Math.round((positiveEngagements / engagements.length) * 100) : 0;

  if (loadingEntities) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{today}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Success Today</h1>
        <p className="text-sm text-gray-600">
          Account health overview, risk signals, and AI-powered insights for your customer
          portfolio.
        </p>
      </div>

      {/* AI Insights Section */}
      {insights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-iw-gold" />
            AI Insights for Today
          </h2>
          <div className="space-y-4">
            {insights.map((insight: L2Insight) => (
              <CSInsightCard
                key={insight.id}
                insight={insight}
                onDismiss={() => dismissMutation.mutate(insight.id)}
                isLoading={dismissMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* HITL Action Queue — actions awaiting your decision */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-iw-gold" />
          Action Queue
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PendingApprovalsCard
            approvals={approvals}
            onApprovalClick={setSelectedApproval}
            onQuickApprove={(a) => handleApprove(a)}
            onQuickReject={(a) => handleReject(a, "Quick rejected from queue")}
          />
          <ExecutionStatusCard executions={executions} />
        </div>
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

      {/* CS Metrics Dashboard */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Health Overview</h2>
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No accounts yet</p>
            <p className="text-xs mt-1">
              Connect a CRM or add accounts to see health metrics here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-iw-slate-mid mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{activeAccounts}</div>
                <div className="text-sm text-gray-600">Active Accounts</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="w-8 h-8 text-iw-red mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{atRiskAccounts}</div>
                <div className="text-sm text-gray-600">At Risk</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Heart className="w-8 h-8 text-iw-forest-bright mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {avgHealth > 0 ? `${avgHealth}%` : "\u2014"}
                </div>
                <div className="text-sm text-gray-600">Avg Health Score</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <ClipboardList className="w-8 h-8 text-iw-gold-light mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{openTasks}</div>
                <div className="text-sm text-gray-600">Open Tasks</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <RefreshCw className="w-8 h-8 text-iw-slate-mid mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{renewalsThisMonth}</div>
                <div className="text-sm text-gray-600">Renewals (30d)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <ThumbsUp className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {engagements.length > 0 ? `${sentimentRate}%` : "\u2014"}
                </div>
                <div className="text-sm text-gray-600">Positive Sentiment</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Priority Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Priority Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criticalAccounts.length > 0 ? (
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-iw-red" />
                  <span className="text-sm font-semibold text-iw-red">
                    Critical: {criticalAccounts.length} account
                    {criticalAccounts.length !== 1 ? "s" : ""} need
                    {criticalAccounts.length === 1 ? "s" : ""} immediate attention
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {criticalAccounts
                    .slice(0, 3)
                    .map((a) => a.accountName)
                    .join(", ")}
                  {criticalAccounts.length > 3 ? ` and ${criticalAccounts.length - 3} more` : ""}
                  {" \u2014 health scores below 60."}
                </p>
                <button
                  onClick={() => navigate("/app/work/at-risk", { replace: true })}
                  className="text-sm font-medium text-iw-red hover:text-iw-red"
                >
                  Review Now →
                </button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-iw-forest-bright" />
                  <span className="text-sm font-semibold text-iw-forest">No critical accounts</span>
                </div>
                <p className="text-sm text-gray-600">
                  All accounts are above the critical health threshold.
                </p>
              </CardContent>
            </Card>
          )}

          {upcomingRenewals.length > 0 ? (
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-iw-gold" />
                  <span className="text-sm font-semibold text-iw-gold">
                    {upcomingRenewals.length} renewal{upcomingRenewals.length !== 1 ? "s" : ""} due
                    in next 14 days
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {upcomingRenewals
                    .slice(0, 3)
                    .map((a) => a.accountName)
                    .join(", ")}
                  {upcomingRenewals.length > 3 ? ` and ${upcomingRenewals.length - 3} more` : ""}
                  {" \u2014 proactive outreach needed."}
                </p>
                <button
                  onClick={() => navigate("/app/work/renewals", { replace: true })}
                  className="text-sm font-medium text-iw-gold hover:text-iw-gold"
                >
                  View Renewals →
                </button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-iw-forest-bright" />
                  <span className="text-sm font-semibold text-iw-forest">No imminent renewals</span>
                </div>
                <p className="text-sm text-gray-600">No renewals due within the next 14 days.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
