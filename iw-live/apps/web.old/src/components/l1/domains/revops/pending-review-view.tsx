/**
 * RevOps — Pending review (approval queue)
 * Work-scoped approval queue for AI recommendations (Think → Govern → Act → Audit).
 * L2: getRecommendations(pending) + decideOnRecommendation; fallback to mock when empty.
 */
import { useState, useMemo } from "react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { PendingApprovalsCard } from "@/components/_deprecated/l2-removed/approvals/pending-approvals-card";
import { ApprovalModal } from "@/components/_deprecated/l2-removed/approvals/approval-modal";
import type { PendingApproval } from "@/components/_deprecated/l2-removed/approvals/pending-approvals-card";
import { useL2Recommendations, useL2Decide } from "@/hooks/use-l2";
import type { L2Recommendation } from "@/lib/l2-client";

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

export function RevOpsPendingReviewView() {
  const auth = useAuth();
  const userId = auth?.user?.id ?? "";
  const ctx = useMemo(
    () => (userId ? { userId, domain: "REVOPS" as const, viewId: "pending-review" } : null),
    [userId]
  );
  const { data: recs = [], isLoading } = useL2Recommendations(ctx, {
    status: "pending",
  });
  const decide = useL2Decide(ctx);
  const approvals: PendingApproval[] = useMemo(() => recs.map(l2RecToPendingApproval), [recs]);
  const [selected, setSelected] = useState<PendingApproval | null>(null);

  const handleApprove = async (approval: PendingApproval, feedback?: string) => {
    const rec = recs.find((r) => r.id === approval.id);
    if (rec) {
      await decide.mutateAsync({
        recommendationId: rec.id,
        decision: { decision: "approve", reason: feedback },
      });
    }
    setSelected(null);
  };
  const handleReject = async (approval: PendingApproval, reason: string) => {
    const rec = recs.find((r) => r.id === approval.id);
    if (rec) {
      await decide.mutateAsync({
        recommendationId: rec.id,
        decision: { decision: "reject", reason },
      });
    }
    setSelected(null);
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Pending review</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          AI recommendations for at-risk deals, escalations, and outreach. Approve or reject with
          evidence; decisions are logged for audit.
        </p>
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
