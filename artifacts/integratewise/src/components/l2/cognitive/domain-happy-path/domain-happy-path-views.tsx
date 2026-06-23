/**
 * Domain Happy Path — Generic L2 views for all 12 domains
 *
 * Each domain gets: Today (insights), Queue (recommendations), Decisions (audit log).
 * Wired via role-domain modules and content-router.
 */

import { useState, useMemo } from "react";
import { useAuth } from "@/components/core/auth/auth-provider";
import {
  PendingApprovalsCard,
  mockApprovals,
} from "@/components/_deprecated/l2-removed/approvals/pending-approvals-card";
import { ApprovalModal } from "@/components/_deprecated/l2-removed/approvals/approval-modal";
import type { PendingApproval } from "@/components/_deprecated/l2-removed/approvals/pending-approvals-card";
import {
  useL2Insights,
  useL2DismissInsight,
  useL2Recommendations,
  useL2Decide,
  useL2Decisions,
} from "@/hooks/use-l2";
import type { L2Insight, L2Recommendation } from "@/lib/l2-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ThumbsUp, X, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Domain } from "@/components/l1/workspace/workspace-config";

// ─── Generic Today View (L2 Insights) ───────────────────────────────────────

interface DomainTodayProps {
  domain: Domain;
  viewId: string;
  title: string;
  description: string;
}

function DomainTodayView({ domain, viewId, title, description }: DomainTodayProps) {
  const auth = useAuth();
  const l2Ctx = auth.user?.id ? { userId: auth.user.id, domain, viewId } : null;
  const { data: insights = [] } = useL2Insights(l2Ctx);
  const dismissMutation = useL2DismissInsight(l2Ctx);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const visibleInsights = insights.filter((i) => !dismissedIds.has(i.id));

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      {visibleInsights.length > 0 ? (
        <div className="space-y-4">
          {visibleInsights.map((insight: L2Insight) => (
            <div key={insight.id} className="l2-suggested-card rounded-xl p-6 border">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-amber-400/90 uppercase tracking-wide">
                    Suggested by IntegrateWise
                  </span>
                  <h2 className="text-lg font-bold text-white mt-2 mb-2">{insight.title}</h2>
                  {insight.whyItMatters && (
                    <p className="text-sm text-white/80 mb-4">{insight.whyItMatters}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("open-cognitive-layer", {
                            detail: { insightId: insight.id },
                          })
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[var(--iw-purple)] rounded-lg font-semibold hover:shadow-lg transition-shadow text-sm"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Show me the path
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDismissedIds((prev) => new Set(prev).add(insight.id));
                        dismissMutation.mutate(insight.id);
                      }}
                      disabled={dismissMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white/90 rounded-lg font-medium hover:bg-white/15 transition-colors text-sm border border-white/20"
                    >
                      <X className="w-4 h-4" />
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No insights right now. Check back after your connectors sync.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Generic Queue View (L2 Recommendations) ─────────────────────────────────

function l2RecToPendingApproval(rec: L2Recommendation): PendingApproval {
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

interface DomainQueueProps {
  domain: Domain;
  viewId: string;
  title: string;
  description: string;
}

function DomainQueueView({ domain, viewId, title, description }: DomainQueueProps) {
  const auth = useAuth();
  const userId = auth?.user?.id ?? "";
  const ctx = useMemo(() => (userId ? { userId, domain, viewId } : null), [userId, domain, viewId]);
  const { data: recs = [], isLoading } = useL2Recommendations(ctx, { status: "pending" });
  const decide = useL2Decide(ctx);
  const approvals: PendingApproval[] = useMemo(
    () => (recs.length > 0 ? recs.map(l2RecToPendingApproval) : mockApprovals),
    [recs]
  );
  const [selected, setSelected] = useState<PendingApproval | null>(null);

  const handleApprove = async (approval: PendingApproval, feedback?: string) => {
    const rec = recs.find((r) => r.id === approval.id);
    if (rec)
      await decide.mutateAsync({
        recommendationId: rec.id,
        decision: { decision: "approve", reason: feedback },
      });
    setSelected(null);
  };
  const handleReject = async (approval: PendingApproval, reason: string) => {
    const rec = recs.find((r) => r.id === approval.id);
    if (rec)
      await decide.mutateAsync({
        recommendationId: rec.id,
        decision: { decision: "reject", reason },
      });
    setSelected(null);
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="max-w-2xl">
        {isLoading ? (
          <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground text-sm">
            Loading…
          </div>
        ) : (
          <PendingApprovalsCard
            approvals={approvals}
            onApprovalClick={setSelected}
            className="rounded-lg border border-border bg-card"
          />
        )}
      </div>
      {selected && (
        <ApprovalModal
          approval={selected}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

// ─── Generic Decisions View (L2 Decision Log) ──────────────────────────────────

interface DomainDecisionsProps {
  domain: Domain;
  viewId: string;
  title: string;
  description: string;
  emptyMessage: string;
}

function DomainDecisionsView({
  domain,
  viewId,
  title,
  description,
  emptyMessage,
}: DomainDecisionsProps) {
  const auth = useAuth();
  const userId = auth?.user?.id ?? "";
  const ctx = useMemo(() => (userId ? { userId, domain, viewId } : null), [userId, domain, viewId]);
  const { data: decisions = [], isLoading } = useL2Decisions(ctx, { limit: 50 });

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : decisions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <Card key={d.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
                <CardTitle className="text-sm font-medium">{d.title}</CardTitle>
                <Badge
                  variant={d.status === "approved" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {d.status === "approved" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {d.status === "approved" ? "Approved" : "Rejected"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground">
                {d.description && <p>{d.description}</p>}
                {d.decidedAt && (
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(d.decidedAt).toLocaleString()}
                    {d.decidedBy && ` · ${d.decidedBy}`}
                  </p>
                )}
                {d.reason && <p className="italic">Reason: {d.reason}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Domain-specific exports (for lazy loading) ───────────────────────────────

export function SalesTodayView() {
  return (
    <DomainTodayView
      domain="SALES"
      viewId="sales-today"
      title="Sales today"
      description="AI insights for deals, follow-ups, and pipeline priorities."
    />
  );
}
export function SalesQueueView() {
  return (
    <DomainQueueView
      domain="SALES"
      viewId="sales-queue"
      title="Sales recommendations"
      description="AI recommendations for deals, outreach, and pipeline actions."
    />
  );
}
export function SalesDecisionsView() {
  return (
    <DomainDecisionsView
      domain="SALES"
      viewId="sales-decisions"
      title="Sales decision log"
      description="Audit trail of approved and rejected sales recommendations."
      emptyMessage="No decisions yet. Approve or reject items from Sales recommendations to see them here."
    />
  );
}

export function MarketingTodayView() {
  return (
    <DomainTodayView
      domain="MARKETING"
      viewId="marketing-today"
      title="Marketing today"
      description="AI insights for campaigns, leads, and attribution."
    />
  );
}
export function MarketingQueueView() {
  return (
    <DomainQueueView
      domain="MARKETING"
      viewId="marketing-queue"
      title="Marketing recommendations"
      description="AI recommendations for campaigns, content, and lead actions."
    />
  );
}
export function MarketingDecisionsView() {
  return (
    <DomainDecisionsView
      domain="MARKETING"
      viewId="marketing-decisions"
      title="Marketing decision log"
      description="Audit trail of approved and rejected marketing recommendations."
      emptyMessage="No decisions yet. Approve or reject items from Marketing recommendations to see them here."
    />
  );
}

export function ProductEngineeringTodayView() {
  return (
    <DomainTodayView
      domain="PRODUCT_ENGINEERING"
      viewId="incident-ops"
      title="Incident & ops today"
      description="AI insights for incidents, deploys, and operational priorities."
    />
  );
}
export function ProductEngineeringQueueView() {
  return (
    <DomainQueueView
      domain="PRODUCT_ENGINEERING"
      viewId="devops-queue"
      title="DevOps recommendations"
      description="AI recommendations for incidents, runbooks, and operational actions."
    />
  );
}
export function ProductEngineeringDecisionsView() {
  return (
    <DomainDecisionsView
      domain="PRODUCT_ENGINEERING"
      viewId="devops-decisions"
      title="DevOps decision log"
      description="Audit trail of approved and rejected DevOps recommendations."
      emptyMessage="No decisions yet. Approve or reject items from DevOps recommendations to see them here."
    />
  );
}

export function FinanceTodayView() {
  return (
    <DomainTodayView
      domain="FINANCE"
      viewId="finance-today"
      title="Finance today"
      description="AI insights for revenue, renewals, and financial priorities."
    />
  );
}
export function FinanceStrategyView() {
  return (
    <DomainQueueView
      domain="FINANCE"
      viewId="strategy"
      title="Strategic actions"
      description="Board-level recommendations for renewals, pricing, and financial moves."
    />
  );
}
export function FinanceDecisionsView() {
  return (
    <DomainDecisionsView
      domain="FINANCE"
      viewId="finance-decisions"
      title="Finance decision log"
      description="Audit trail of approved and rejected financial recommendations."
      emptyMessage="No decisions yet. Approve or reject items from Strategic actions to see them here."
    />
  );
}

export function ServiceTodayView() {
  return (
    <DomainTodayView
      domain="SERVICE"
      viewId="service-today"
      title="Service today"
      description="AI insights for tickets, SLAs, and customer support priorities."
    />
  );
}
export function ServiceQueueView() {
  return (
    <DomainQueueView
      domain="SERVICE"
      viewId="service-queue"
      title="Service recommendations"
      description="AI recommendations for tickets, escalations, and support actions."
    />
  );
}
export function ServiceDecisionsView() {
  return (
    <DomainDecisionsView
      domain="SERVICE"
      viewId="service-decisions"
      title="Service decision log"
      description="Audit trail of approved and rejected service recommendations."
      emptyMessage="No decisions yet. Approve or reject items from Service recommendations to see them here."
    />
  );
}

export function ProcurementTodayView() {
  return (
    <DomainTodayView
      domain="PROCUREMENT"
      viewId="procurement-today"
      title="Procurement today"
      description="AI insights for renewals, vendors, and procurement priorities."
    />
  );
}
export function ProcurementQueueView() {
  return (
    <DomainQueueView
      domain="PROCUREMENT"
      viewId="procurement-queue"
      title="Procurement recommendations"
      description="AI recommendations for renewals, contracts, and vendor actions."
    />
  );
}
export function ProcurementDecisionsView() {
  return (
    <DomainDecisionsView
      domain="PROCUREMENT"
      viewId="procurement-decisions"
      title="Procurement decision log"
      description="Audit trail of approved and rejected procurement recommendations."
      emptyMessage="No decisions yet. Approve or reject items from Procurement recommendations to see them here."
    />
  );
}

export function ItAdminTodayView() {
  return (
    <DomainTodayView
      domain="IT_ADMIN"
      viewId="it-today"
      title="IT & governance today"
      description="AI insights for security, compliance, and governance priorities."
    />
  );
}
export function ItAdminQueueView() {
  return (
    <DomainQueueView
      domain="IT_ADMIN"
      viewId="it-queue"
      title="IT recommendations"
      description="AI recommendations for security, compliance, and policy actions."
    />
  );
}
export function ItAdminDecisionsView() {
  return (
    <DomainDecisionsView
      domain="IT_ADMIN"
      viewId="it-decisions"
      title="IT decision log"
      description="Audit trail of approved and rejected IT recommendations."
      emptyMessage="No decisions yet. Approve or reject items from IT recommendations to see them here."
    />
  );
}

export function StudentTeacherTodayView() {
  return (
    <DomainTodayView
      domain="STUDENT_TEACHER"
      viewId="student-today"
      title="Education today"
      description="AI insights for at-risk students, assignments, and teaching priorities."
    />
  );
}
export function StudentTeacherQueueView() {
  return (
    <DomainQueueView
      domain="STUDENT_TEACHER"
      viewId="student-queue"
      title="Education action queue"
      description="AI-prioritized actions for students, assignments, and coursework."
    />
  );
}
export function StudentTeacherDecisionsView() {
  return (
    <DomainDecisionsView
      domain="STUDENT_TEACHER"
      viewId="student-decisions"
      title="Education decision log"
      description="Audit trail of approved and rejected education recommendations."
      emptyMessage="No decisions yet. Approve or reject items from At-risk students to see them here."
    />
  );
}

export function BizopsTodayView() {
  return (
    <DomainTodayView
      domain="BIZOPS"
      viewId="bizops-today"
      title="BizOps today"
      description="AI insights for projects, workflows, and operational priorities."
    />
  );
}
export function BizopsQueueView() {
  return (
    <DomainQueueView
      domain="BIZOPS"
      viewId="bizops-queue"
      title="BizOps recommendations"
      description="AI recommendations for projects, workflows, and operational actions."
    />
  );
}
export function BizopsDecisionsView() {
  return (
    <DomainDecisionsView
      domain="BIZOPS"
      viewId="bizops-decisions"
      title="BizOps decision log"
      description="Audit trail of approved and rejected BizOps recommendations."
      emptyMessage="No decisions yet. Approve or reject items from BizOps recommendations to see them here."
    />
  );
}

/* ═══════════════ RevOps ═══════════════ */
export function RevopsTodayView() {
  return (
    <DomainTodayView
      domain="REVOPS"
      viewId="revops-today"
      title="RevOps today"
      description="AI insights for revenue, pipeline, quota, and forecasting priorities."
    />
  );
}
export function RevopsQueueView() {
  return (
    <DomainQueueView
      domain="REVOPS"
      viewId="revops-queue"
      title="RevOps recommendations"
      description="AI recommendations for revenue operations and pipeline actions."
    />
  );
}
export function RevopsDecisionsView() {
  return (
    <DomainDecisionsView
      domain="REVOPS"
      viewId="revops-decisions"
      title="RevOps decision log"
      description="Audit trail of approved and rejected RevOps recommendations."
      emptyMessage="No decisions yet. Approve or reject items from RevOps recommendations to see them here."
    />
  );
}
