/**
 * Proposals API — D1 Governance Queue
 *
 * Routes through Gateway → Intelligence Worker → Govern (D1).
 * Returns ProposalOpsProjection shapes (stripped governance internals).
 *
 * Doctrine: Twin proposes → Triage scores → HITL approves → Operator executes.
 */

import { apiFetch } from "@/lib/api-client";
import type { ProposalOpsProjection } from "@integratewise/types";

export interface ProposalsListResponse {
  success: boolean;
  data: ProposalOpsProjection[];
  count: number;
}

export interface ProposalResponse {
  success: boolean;
  data: ProposalOpsProjection;
}

export interface ProposalActionResponse {
  success: boolean;
  data?: ProposalOpsProjection;
  message?: string;
  error?: string;
}

export interface ProposalsFilters {
  status?: string | string[];
  ops_surface?: string;
  entity_type?: string;
  limit?: number;
  offset?: number;
  workspace?: string; // for domain-scoped L5/L6/L7
  domain?: string;
}

/**
 * List proposals from the D1 governance queue.
 * Default: pending_review + approved proposals.
 */
export async function listProposals(filters?: ProposalsFilters): Promise<ProposalOpsProjection[]> {
  const qs = new URLSearchParams();
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach((s) => qs.append("status", s));
    } else {
      qs.set("status", filters.status);
    }
  }
  if (filters?.ops_surface) qs.set("ops_surface", filters.ops_surface);
  if (filters?.entity_type) qs.set("entity_type", filters.entity_type);
  if (filters?.limit) qs.set("limit", String(filters.limit));
  if (filters?.offset) qs.set("offset", String(filters.offset));
  if (filters?.workspace) qs.set("workspace", filters.workspace);
  if (filters?.domain) qs.set("workspace", filters.domain);

  const query = qs.toString();
  const res = await apiFetch<ProposalsListResponse>(
    `/api/v1/intelligence/proposals${query ? "?" + query : ""}`,
    {},
    "Proposals"
  );
  return res.data || [];
}

/**
 * Approve a proposal (HITL approval).
 */
export async function approveProposal(
  proposalId: string,
  reviewNotes?: string
): Promise<ProposalActionResponse> {
  return apiFetch<ProposalActionResponse>(
    `/api/v1/intelligence/proposals/${proposalId}/approve`,
    {
      method: "POST",
      body: reviewNotes ? { review_notes: reviewNotes } : {},
    },
    "Proposals"
  );
}

/**
 * Reject a proposal (HITL rejection — requires reason).
 */
export async function rejectProposal(
  proposalId: string,
  reviewNotes: string
): Promise<ProposalActionResponse> {
  return apiFetch<ProposalActionResponse>(
    `/api/v1/intelligence/proposals/${proposalId}/reject`,
    {
      method: "POST",
      body: { review_notes: reviewNotes },
    },
    "Proposals"
  );
}
