/**
 * useKnowledgeRegistry — Reads from D1 via Intelligence Worker
 *
 * Edge-fast knowledge reads from Cloudflare D1.
 * Gateway → Intelligence Worker → D1 org_memory table.
 *
 * Board → category mapping:
 *   Governance  → 'doctrine', 'policy', 'decision'
 *   Operations  → 'workflow'
 *   Content     → 'insight', 'pattern'
 *   Public Docs → 'architecture' (published only)
 *   Internal    → 'lesson_learned', 'architecture'
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OrgMemoryItem {
  id: string;
  tenant_id: string;
  topic: string;
  category: string;
  content: string;
  source_session_id?: string;
  source_decision_id?: string;
  evidence_refs: string;
  governance_state: "staging" | "approved" | "published" | "archived";
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  version: number;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export type BoardId = "governance" | "operations" | "content" | "public" | "internal";

export const BOARD_CATEGORIES: Record<BoardId, string[]> = {
  governance: ["doctrine", "policy", "decision"],
  operations: ["workflow"],
  content: ["insight", "pattern"],
  public: ["architecture"],
  internal: ["lesson_learned", "architecture"],
};

export const BOARD_GOVERNANCE_FILTER: Record<BoardId, string | undefined> = {
  governance: undefined,
  operations: undefined,
  content: undefined,
  public: "published",
  internal: undefined,
};

// ─── Hook: Fetch items for a board ──────────────────────────────────────────

export function useKnowledgeRegistry(boardId: BoardId) {
  const categories = BOARD_CATEGORIES[boardId];
  const govFilter = BOARD_GOVERNANCE_FILTER[boardId];

  return useQuery({
    queryKey: ["knowledge", boardId, categories, govFilter],
    queryFn: async () => {
      const results: OrgMemoryItem[] = [];

      for (const category of categories) {
        const params = new URLSearchParams({ category, limit: "100" });
        if (govFilter) params.set("governance_state", govFilter);

        try {
          const result = await apiFetch<{ success: boolean; data: OrgMemoryItem[]; count: number }>(
            `/api/v1/intelligence/knowledge/org-memory?${params.toString()}`
          );

          if (result?.data) {
            results.push(...result.data);
          }
        } catch {
          // Skip failed category fetches
        }
      }

      return results;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ─── Hook: Board stats ──────────────────────────────────────────────────────

export function useBoardStats(boardId: BoardId) {
  const { data: items, isLoading } = useKnowledgeRegistry(boardId);

  const stats = {
    total: items?.length ?? 0,
    staging: items?.filter((i) => i.governance_state === "staging").length ?? 0,
    approved: items?.filter((i) => i.governance_state === "approved").length ?? 0,
    published: items?.filter((i) => i.governance_state === "published").length ?? 0,
    archived: items?.filter((i) => i.governance_state === "archived").length ?? 0,
  };

  return { stats, isLoading };
}

// ─── Hook: Approve item ─────────────────────────────────────────────────────

export function useApproveKnowledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, approvedBy }: { id: string; approvedBy: string }) => {
      return apiFetch("/api/v1/connector/invoke", {
        method: "POST",
        body: JSON.stringify({
          tool: {
            name: "memory.approve_org",
            arguments: { id, approved_by: approvedBy },
          },
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });
}

// ─── Hook: Publish item ─────────────────────────────────────────────────────

export function usePublishKnowledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return apiFetch("/api/v1/connector/invoke", {
        method: "POST",
        body: JSON.stringify({
          tool: {
            name: "memory.publish_org",
            arguments: { id },
          },
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });
}
