/**
 * useHydration — Authenticated workspace hydration hook
 *
 * Called on authenticated page load to pre-populate the TanStack Query cache
 * with morning-context data, then background-checks for delta updates.
 *
 * Flow:
 * 1. Fetch GET /api/v1/projections/morning-context from the gateway
 * 2. Split response into signals, entities, connectors query keys in cache
 * 3. Background-check GET /api/v1/pipeline/delta-status for incremental updates
 * 4. If delta available, invalidate + refetch affected query keys
 *
 * Target: workspace visible within 2s of page load.
 *
 * Requirements: R7 (Returning User Fast Hydration)
 */

import { useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gatewayClient } from "@/lib/gateway-client";
import { queryKeys } from "@/lib/query-client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Signal {
  id: string;
  type: string;
  severity: string;
  entityId?: string;
  entity_id?: string;
  entityName?: string;
  entity_name?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  created_at?: string;
}

interface ConnectorStatus {
  provider: string;
  status: "connected" | "disconnected" | "error" | "syncing";
  lastSync?: string;
  last_sync?: string;
}

interface MemoryEntry {
  category: string;
  content: string;
  source_signal_id?: string;
}

/**
 * MorningContext as returned by the gateway projection endpoint.
 * This is the assembled shape from GET /api/v1/projections/morning-context.
 */
export interface MorningContext {
  signals: Signal[];
  agenda: unknown[];
  commitments: unknown[];
  renewals: {
    entityId?: string;
    entityName?: string;
    renewalDate?: string;
    daysRemaining?: number;
    healthScore?: number;
    arr?: number;
  }[];
  proposalsPending: number;
  proposalsPreview: unknown[];
  generatedAt: string;
  /** Optional fields populated by extended projections */
  entities_summary?: { type: string; count: number }[];
  connector_status?: ConnectorStatus[];
  recent_memory?: MemoryEntry[];
  tenant_id?: string;
}

interface DeltaStatus {
  available: boolean;
  affected_keys?: string[];
  affected_entities?: string[];
  affected_connectors?: string[];
  last_delta_at?: string;
}

export interface UseHydrationReturn {
  morningContext: MorningContext | undefined;
  isLoading: boolean;
  isHydrated: boolean;
  deltaStatus: DeltaStatus | undefined;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Pre-populates the workspace cache on authenticated page load.
 *
 * @example
 * ```tsx
 * function DashboardLayout() {
 *   const { morningContext, isLoading, isHydrated } = useHydration();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (isHydrated) return <Workspace context={morningContext} />;
 * }
 * ```
 */
export function useHydration(): UseHydrationReturn {
  const queryClient = useQueryClient();
  const hasSplitCache = useRef(false);

  // ── Step 1: Fetch morning-context projection ──────────────────────────────
  const {
    data: morningContext,
    isLoading,
    isSuccess,
  } = useQuery<MorningContext>({
    queryKey: queryKeys.morningContext(),
    queryFn: () => gatewayClient.get<MorningContext>("/api/v1/projections/morning-context"),
    staleTime: 60_000, // 1 min — aggressive caching for fast hydration
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false, // Don't refetch on tab switch during initial load
  });

  // ── Step 2: Split morning-context into granular cache keys ────────────────
  useEffect(() => {
    if (!morningContext || hasSplitCache.current) return;

    // Pre-populate signals cache
    if (morningContext.signals?.length) {
      queryClient.setQueryData(queryKeys.signals.all, morningContext.signals);
    }

    // Pre-populate entities summary if present
    if (morningContext.entities_summary?.length) {
      queryClient.setQueryData(queryKeys.entities.all, morningContext.entities_summary);
    }

    // Pre-populate connector status if present
    if (morningContext.connector_status?.length) {
      queryClient.setQueryData(queryKeys.connectors.all, morningContext.connector_status);
    }

    hasSplitCache.current = true;
  }, [morningContext, queryClient]);

  // ── Step 3: Background delta check after morning-context settles ──────────
  const { data: deltaStatus } = useQuery<DeltaStatus>({
    queryKey: queryKeys.pipeline.delta(),
    queryFn: () => gatewayClient.get<DeltaStatus>("/api/v1/pipeline/delta-status"),
    enabled: isSuccess, // Only fire once morning-context is loaded
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // ── Step 4: Invalidate affected keys if delta is available ────────────────
  const invalidateFromDelta = useCallback(
    (delta: DeltaStatus) => {
      if (!delta.available) return;

      const keysToInvalidate: (readonly unknown[])[] = [];

      // Invalidate signals if affected
      if (delta.affected_keys?.includes("signals") || delta.affected_keys?.includes("all")) {
        keysToInvalidate.push(queryKeys.signals.all);
      }

      // Invalidate specific entity types
      if (delta.affected_entities?.length) {
        for (const entityType of delta.affected_entities) {
          keysToInvalidate.push(queryKeys.entities.byType(entityType));
        }
      } else if (
        delta.affected_keys?.includes("entities") ||
        delta.affected_keys?.includes("all")
      ) {
        keysToInvalidate.push(queryKeys.entities.all);
      }

      // Invalidate specific connectors
      if (delta.affected_connectors?.length) {
        for (const connector of delta.affected_connectors) {
          keysToInvalidate.push(queryKeys.connectors.byProvider(connector));
        }
      } else if (
        delta.affected_keys?.includes("connectors") ||
        delta.affected_keys?.includes("all")
      ) {
        keysToInvalidate.push(queryKeys.connectors.all);
      }

      // Perform invalidations (triggers refetch for active queries)
      for (const key of keysToInvalidate) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
    [queryClient]
  );

  useEffect(() => {
    if (deltaStatus?.available) {
      invalidateFromDelta(deltaStatus);
    }
  }, [deltaStatus, invalidateFromDelta]);

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    morningContext,
    isLoading,
    isHydrated: isSuccess && hasSplitCache.current,
    deltaStatus,
  };
}
