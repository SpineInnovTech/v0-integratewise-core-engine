"use client";

/**
 * useGovernanceQueue — HITL Queue Hook
 *
 * Fetches pending approvals from Workflow HITL queue and maps them
 * to GovernanceItem shape for the Governance Panel primitive.
 *
 * Doctrine: The Workbench is the only place where AI proposals cross
 * from cognition to action. No invisible execution is allowed.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPendingApprovals,
  approveAction,
  rejectAction,
} from "@/components/_deprecated/l2-removed/approvals/approvals-api";
import type { PendingApproval } from "@/components/_deprecated/l2-removed/approvals/pending-approvals-card";
import type { GovernanceItem } from "@/components/workbench/primitives";

// ─── Mapping: PendingApproval → GovernanceItem ─────────────────────────────────

function mapApprovalToGovernanceItem(approval: PendingApproval): GovernanceItem {
  return {
    id: approval.id,
    continuityType: approval.type,
    governanceState: "proposed", // Workflow queue items are always proposed
    title: approval.title,
    description: approval.description,
    evidence: approval.evidence.map((e) => e.summary),
    confidence: approval.confidence,
    hitlRequired: true,
    createdAt: approval.proposedAt,
  };
}

// ─── Query Key ─────────────────────────────────────────────────────────────────

const GOVERNANCE_QUEUE_KEY = ["governance", "hitl-queue"];

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useGovernanceQueue() {
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: GOVERNANCE_QUEUE_KEY,
    queryFn: async () => {
      const approvals = await listPendingApprovals();
      return approvals.map(mapApprovalToGovernanceItem);
    },
    staleTime: 10_000, // 10 seconds
    refetchInterval: 30_000, // Auto-refresh every 30s
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: string; feedback?: string }) => {
      // Find the original approval by id
      const approvals = await listPendingApprovals();
      const approval = approvals.find((a) => a.id === id);
      if (!approval) throw new Error("Approval not found");
      return approveAction(approval, feedback);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOVERNANCE_QUEUE_KEY });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const approvals = await listPendingApprovals();
      const approval = approvals.find((a) => a.id === id);
      if (!approval) throw new Error("Approval not found");
      return rejectAction(approval, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOVERNANCE_QUEUE_KEY });
    },
  });

  return {
    items,
    isLoading,
    error: error?.message || null,
    refetch,
    approve: approveMutation.mutateAsync,
    reject: rejectMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
