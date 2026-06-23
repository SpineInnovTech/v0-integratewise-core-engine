/**
 * useMorningContext — Returning user hydration hook
 *
 * Fetches the morning-context projection on authenticated page load, pre-populates
 * granular TanStack Query cache keys (signals, entities, connectors), and fires a
 * background delta-sync check to invalidate stale data without blocking initial render.
 *
 * Performance target: workspace visible within 2 seconds of page load.
 * Strategy:
 * - Aggressive caching (staleTime: 5 min) to serve instantly from cache on revisit
 * - placeholderData from previous session (sessionStorage) while fresh data loads
 * - Morning context query only fires when authenticated (enabled: isAuthenticated)
 * - Delta sync is non-blocking — fires after initial morning-context resolves
 *
 * Requirements: R7 (Returning User Fast Hydration)
 *
 * @example
 * ```tsx
 * function WorkspaceShell() {
 *   const { morningContext, isLoading, isHydrated } = useMorningContext();
 *   if (isLoading && !morningContext) return <WorkspaceSkeleton />;
 *   return <Workspace context={morningContext} />;
 * }
 * ```
 */

import { useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gatewayClient } from "@/lib/gateway-client";
import { queryKeys } from "@/lib/query-client";
import { useAuth } from "@/hooks/use-auth";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Signal {
  id: string;
  type: string;
  severity: string;
  entity_id?: string;
  entity_name?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

interface ConnectorStatus {
  provider: string;
  status: "connected" | "disconnected" | "error" | "syncing";
  last_sync?: string;
}

interface MemoryEntry {
  category: string;
  content: string;
  source_signal_id?: string;
}

/**
 * MorningContext payload from GET /api/v1/projections/morning-context.
 * Pre-assembled by the gateway from D1/KV for sub-200ms response time.
 */
export interface MorningContextResponse {
  tenant_id: string;
  generated_at: string;
  signals: Signal[];
  entities_summary: { type: string; count: number }[];
  pending_proposals: number;
  recent_memory: MemoryEntry[];
  connector_status: ConnectorStatus[];
}

interface DeltaStatus {
  available: boolean;
  affected_keys?: string[];
  affected_entities?: string[];
  affected_connectors?: string[];
  last_delta_at?: string;
}

export interface UseMorningContextReturn {
  /** The morning context data, or undefined if not yet loaded */
  morningContext: MorningContextResponse | undefined;
  /** Whether the initial morning-context fetch is in progress */
  isLoading: boolean;
  /** Whether cache has been pre-populated from morning-context data */
  isHydrated: boolean;
  /** Error from the morning-context fetch, if any */
  error: Error | null;
}

export interface UseDeltaSyncReturn {
  /** Whether a delta is available (stale data detected) */
  deltaAvailable: boolean;
  /** Whether the delta-status check is in progress */
  isChecking: boolean;
  /** Last delta check timestamp */
  lastDeltaAt: string | undefined;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** sessionStorage key for persisting morning-context across page reloads */
const MORNING_CONTEXT_STORAGE_KEY = "iw_morning_context_cache";

/**
 * 5 minutes staleTime — aggressive caching so returning users get instant
 * workspace render from cache while background revalidation occurs.
 * This directly supports the 2-second workspace visibility target.
 */
const MORNING_CONTEXT_STALE_TIME = 5 * 60_000;

/** gcTime: keep data available for 10 minutes after last usage */
const MORNING_CONTEXT_GC_TIME = 10 * 60_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Attempt to read a previous morning-context from sessionStorage.
 * Used as placeholderData to render workspace immediately while fresh data loads.
 */
function getPersistedMorningContext(): MorningContextResponse | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const stored = sessionStorage.getItem(MORNING_CONTEXT_STORAGE_KEY);
    if (!stored) return undefined;
    return JSON.parse(stored) as MorningContextResponse;
  } catch {
    return undefined;
  }
}

/**
 * Persist morning-context to sessionStorage for use as placeholderData on next load.
 */
function persistMorningContext(data: MorningContextResponse): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(MORNING_CONTEXT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage full or unavailable — non-critical, skip
  }
}

// ─── useMorningContext ───────────────────────────────────────────────────────

/**
 * Fetches morning-context on authenticated page load and pre-populates
 * the TanStack Query cache with granular data (signals, entities, connectors).
 *
 * Task 10.1: On authenticated page load, fetch GET /api/v1/projections/morning-context
 * Task 10.2: Pre-populate TanStack Query cache with morning-context data
 * Task 10.4: Target workspace visible within 2s of page load
 */
export function useMorningContext(): UseMorningContextReturn {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const hasSplitCache = useRef(false);

  // ── Task 10.1: Fetch morning-context (only when authenticated) ────────────
  const {
    data: morningContext,
    isLoading,
    isSuccess,
    error,
  } = useQuery<MorningContextResponse>({
    queryKey: queryKeys.morningContext(),
    queryFn: () => gatewayClient.get<MorningContextResponse>("/api/v1/projections/morning-context"),
    // Only run when user is authenticated (R7 — returning user flow)
    enabled: isAuthenticated,
    // 5-min staleTime: serve cached response instantly, revalidate in background
    staleTime: MORNING_CONTEXT_STALE_TIME,
    gcTime: MORNING_CONTEXT_GC_TIME,
    // Use previous session data as placeholder for instant render (2s target)
    placeholderData: getPersistedMorningContext(),
    // Don't refetch on window focus during initial load — delta-sync handles freshness
    refetchOnWindowFocus: false,
  });

  // ── Task 10.2: Pre-populate granular cache keys from morning-context ──────
  useEffect(() => {
    if (!morningContext || hasSplitCache.current) return;

    // Signals → queryKeys.signals.all
    if (morningContext.signals?.length) {
      queryClient.setQueryData(queryKeys.signals.all, morningContext.signals);
    }

    // Entities summary → queryKeys.entities.all
    if (morningContext.entities_summary?.length) {
      queryClient.setQueryData(queryKeys.entities.all, morningContext.entities_summary);
    }

    // Connector status → queryKeys.connectors.all
    if (morningContext.connector_status?.length) {
      queryClient.setQueryData(queryKeys.connectors.all, morningContext.connector_status);
    }

    // Persist for next page load (placeholderData source)
    persistMorningContext(morningContext);

    hasSplitCache.current = true;
  }, [morningContext, queryClient]);

  return {
    morningContext,
    isLoading: isLoading && !morningContext,
    isHydrated: isSuccess && hasSplitCache.current,
    error: error as Error | null,
  };
}

// ─── useDeltaSync ────────────────────────────────────────────────────────────

/**
 * Background delta-sync check. Fires after morning-context loads to detect
 * if any data has changed since the cached projection was built.
 * If delta is available, invalidates affected query keys → triggers refetch
 * for active subscribers without blocking initial render.
 *
 * Task 10.3: Background check GET /api/v1/pipeline/delta-status,
 *            invalidate + refetch affected query keys if delta available
 */
export function useDeltaSync(morningContextLoaded: boolean): UseDeltaSyncReturn {
  const queryClient = useQueryClient();

  // ── Fetch delta-status only after morning-context is ready ────────────────
  const { data: deltaStatus, isLoading: isChecking } = useQuery<DeltaStatus>({
    queryKey: queryKeys.pipeline.delta(),
    queryFn: () => gatewayClient.get<DeltaStatus>("/api/v1/pipeline/delta-status"),
    // Non-blocking: only fires once morning-context has loaded
    enabled: morningContextLoaded,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // ── Invalidate affected keys when delta is detected ───────────────────────
  const invalidateFromDelta = useCallback(
    (delta: DeltaStatus) => {
      if (!delta.available) return;

      const keysToInvalidate: (readonly unknown[])[] = [];

      // Signals changed
      if (delta.affected_keys?.includes("signals") || delta.affected_keys?.includes("all")) {
        keysToInvalidate.push(queryKeys.signals.all);
      }

      // Entities changed (specific types or all)
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

      // Connectors changed (specific providers or all)
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

      // Perform invalidations (triggers refetch for active queries — non-blocking)
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

  return {
    deltaAvailable: deltaStatus?.available ?? false,
    isChecking,
    lastDeltaAt: deltaStatus?.last_delta_at,
  };
}

// ─── Combined convenience hook ───────────────────────────────────────────────

/**
 * Combined hook that orchestrates the full returning-user hydration flow:
 * morning-context fetch → cache split → delta-sync → invalidation.
 *
 * Use this as a single entry point in workspace layouts.
 */
export function useReturningUserHydration() {
  const { morningContext, isLoading, isHydrated, error } = useMorningContext();
  const { deltaAvailable, isChecking, lastDeltaAt } = useDeltaSync(isHydrated);

  return {
    morningContext,
    isLoading,
    isHydrated,
    error,
    deltaAvailable,
    isDeltaChecking: isChecking,
    lastDeltaAt,
  };
}
