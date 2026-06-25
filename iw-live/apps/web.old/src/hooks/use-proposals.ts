"use client";

/**
 * useProposals — D1 Governance Queue Hook
 *
 * Fetches proposals from the Intelligence Engine's D1 governance queue
 * and provides approve/reject mutations with cache invalidation.
 *
 * Used by: At-Risk Brief, Command Center, Workbench Governance Panel.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProposals, approveProposal, rejectProposal } from "@/lib/proposals-api";
import type { ProposalsFilters } from "@/lib/proposals-api";
import type { ProposalOpsProjection } from "@integratewise/types";
import type { ProposalActionResponse } from "@/lib/proposals-api";

const PROPOSALS_KEY = ["intelligence", "proposals"];

export interface UseProposalsResult {
  proposals: ProposalOpsProjection[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  approve: (id: string, notes?: string) => Promise<ProposalActionResponse>;
  reject: (id: string, reason: string) => Promise<ProposalActionResponse>;
  isApproving: boolean;
  isRejecting: boolean;
}

export function useProposals(filters?: ProposalsFilters): UseProposalsResult {
  const queryClient = useQueryClient();

  const {
    data: proposals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...PROPOSALS_KEY, filters ?? {}],
    queryFn: () => listProposals(filters),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => approveProposal(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSALS_KEY });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectProposal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSALS_KEY });
    },
  });

  return {
    proposals,
    isLoading,
    error: error?.message || null,
    refetch: async () => {
      await refetch();
    },
    approve: (id, notes) => approveMutation.mutateAsync({ id, notes }),
    reject: (id, reason) => rejectMutation.mutateAsync({ id, reason }),
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
