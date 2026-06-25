/**
 * L2 Cognitive Layer — React hooks
 *
 * Thin adapter: each view declares its L2ViewContext and pulls insights/recommendations.
 * Backed by l2-client; when API returns empty, views still render (e.g. empty sidebar).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { L2ViewContext, L2Insight, L2Recommendation, L2Decision } from "@/lib/l2-client";
import {
  getInsights,
  getRecommendations,
  listDecisions,
  decideOnRecommendation,
  recordEvent,
} from "@/lib/l2-client";

const L2_QUERY_KEY = "l2";

function contextKey(ctx: L2ViewContext): string {
  return `${ctx.domain}:${ctx.viewId}:${ctx.userId}`;
}

/** Insights for this view (AI signals). */
export function useL2Insights(ctx: L2ViewContext | null) {
  return useQuery({
    queryKey: [L2_QUERY_KEY, "insights", ctx ? contextKey(ctx) : null],
    queryFn: () => (ctx ? getInsights(ctx) : Promise.resolve([])),
    enabled: !!ctx?.userId && !!ctx?.domain && !!ctx?.viewId,
    staleTime: 60_000,
  });
}

/** Pending recommendations (approval queue). */
export function useL2Recommendations(
  ctx: L2ViewContext | null,
  options?: { status?: "pending" | "approved" | "rejected" }
) {
  return useQuery({
    queryKey: [
      L2_QUERY_KEY,
      "recommendations",
      ctx ? contextKey(ctx) : null,
      options?.status ?? "pending",
    ],
    queryFn: () => (ctx ? getRecommendations(ctx, options) : Promise.resolve([])),
    enabled: !!ctx?.userId && !!ctx?.domain && !!ctx?.viewId,
    staleTime: 30_000,
  });
}

/** Decided recommendations (decision log / audit). */
export function useL2Decisions(ctx: L2ViewContext | null, filters?: { limit?: number }) {
  return useQuery({
    queryKey: [L2_QUERY_KEY, "decisions", ctx ? contextKey(ctx) : null, filters?.limit],
    queryFn: () => (ctx ? listDecisions(ctx, filters) : Promise.resolve([])),
    enabled: !!ctx?.userId && !!ctx?.domain && !!ctx?.viewId,
    staleTime: 60_000,
  });
}

/** Mutate: dismiss an insight (e.g. from Personal Today card). */
export function useL2DismissInsight(ctx: L2ViewContext | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (insightId: string) =>
      ctx
        ? recordEvent({
            type: "user_action",
            source: ctx.viewId,
            payload: { action: "dismiss", insightId, userId: ctx.userId },
          })
        : Promise.reject(new Error("No L2 context")),
    onSuccess: () => {
      if (!ctx) return;
      queryClient.invalidateQueries({
        queryKey: [L2_QUERY_KEY, "insights", contextKey(ctx)],
      });
    },
    onError: (error) => {
      console.error("[L2] Failed to dismiss insight:", error);
      // Don't throw - just log for non-critical operation
    },
  });
}

/** Mutate: approve or reject a recommendation; invalidates recs + decisions. */
export function useL2Decide(ctx: L2ViewContext | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      recommendationId,
      decision,
    }: {
      recommendationId: string;
      decision: L2Decision;
    }) =>
      ctx
        ? decideOnRecommendation(ctx, recommendationId, decision)
        : Promise.reject(new Error("No L2 context")),
    onSuccess: () => {
      if (!ctx) return;
      const key = contextKey(ctx);
      queryClient.invalidateQueries({
        queryKey: [L2_QUERY_KEY, "recommendations", key],
      });
      queryClient.invalidateQueries({
        queryKey: [L2_QUERY_KEY, "decisions", key],
      });
    },
    onError: (error) => {
      console.error("[L2] Failed to record decision:", error);
      // Show user feedback for failed decisions
      if (typeof window !== "undefined") {
        window.alert?.("Failed to save decision. Please try again.");
      }
    },
  });
}
