/**
 * useSyncProgress — React hook for Creamy Layer sync progress tracking
 *
 * Polls GET /api/v1/pipeline/status?connector={provider} every 2 seconds
 * while a sync is active. Stops polling on terminal states (completed, failed, stalled).
 * Optionally upgrades to SSE via /stream/pipeline-progress when available.
 *
 * Exposes: currentStage (1-8), totalStages, recordsProcessed, recordsWritten,
 *          recordsQuarantined, eta, status, error, retry
 *
 * Requirements: R6 (Creamy Layer First-Sync Progress)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gatewayClient } from "@/lib/gateway-client";
import { queryKeys } from "@/lib/query-client";
import { sseClient } from "@/lib/sse-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PipelineStatus {
  connector: string;
  status: "pending" | "syncing" | "completed" | "failed" | "stalled";
  currentStage: number; // 1-8
  totalStages: 8;
  recordsProcessed: number;
  recordsWritten: number;
  recordsQuarantined: number;
  eta?: string; // ISO duration or human-readable
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface UseSyncProgressOptions {
  /** Callback fired once when sync completes successfully */
  onComplete?: () => void;
  /** Whether polling/tracking is enabled (default: true) */
  enabled?: boolean;
  /** Attempt SSE upgrade via /stream/pipeline-progress (default: false) */
  useSSE?: boolean;
}

export interface UseSyncProgressReturn {
  /** Current pipeline stage (1-8) */
  stage: number;
  /** Total number of pipeline stages (always 8) */
  totalStages: 8;
  /** Total records processed so far */
  recordsProcessed: number;
  /** Records successfully written to Spine */
  recordsWritten: number;
  /** Records quarantined due to validation failures */
  recordsQuarantined: number;
  /** Estimated time remaining (ISO duration or human-readable) */
  eta: string | null;
  /** Current sync status */
  status: PipelineStatus["status"] | "idle";
  /** Error message if status is 'failed' or 'stalled' */
  error: string | null;
  /** Retry action — invalidates cache and restarts polling */
  retry: () => void;
  /** Whether SSE is actively providing updates (polling disabled) */
  isSSEActive: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2_000;
const SSE_STREAM_PATH = "/stream/pipeline-progress";

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Track Creamy Layer sync progress for a given connector provider.
 *
 * Polls the pipeline status endpoint every 2 seconds while syncing.
 * Automatically stops polling when status is 'completed', 'failed', or 'stalled'.
 * When `useSSE: true`, attempts SSE connection for real-time updates; falls back
 * to polling if SSE connection fails.
 *
 * @param provider - The connector provider identifier (e.g., "hubspot", "jira")
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function SyncPanel({ provider }: { provider: string }) {
 *   const { stage, totalStages, status, recordsProcessed, error, retry } = useSyncProgress(provider, {
 *     onComplete: () => toast.success('Sync complete!'),
 *     useSSE: true,
 *   });
 *
 *   if (status === 'failed') return <ErrorBanner message={error} onRetry={retry} />;
 *   return <ProgressBar current={stage} total={totalStages} count={recordsProcessed} />;
 * }
 * ```
 */
export function useSyncProgress(
  provider: string,
  options: UseSyncProgressOptions = {}
): UseSyncProgressReturn {
  const { onComplete, enabled = true, useSSE = false } = options;
  const queryClient = useQueryClient();

  // Track whether onComplete has already fired to prevent duplicate calls
  const completeFiredRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // SSE active state — when true, polling is disabled
  const [isSSEActive, setIsSSEActive] = useState(false);

  // ─── TanStack Query with 2s polling (task 9.1) ───────────────────────────

  const { data } = useQuery<PipelineStatus>({
    queryKey: queryKeys.pipeline.byConnector(provider),
    queryFn: () =>
      gatewayClient.get<PipelineStatus>("/api/v1/pipeline/status", {
        connector: provider,
      }),
    enabled,
    refetchInterval: (query) => {
      // Disable polling if SSE is providing updates (task 9.4)
      if (isSSEActive) return false;

      const status = query.state.data?.status;
      // Stop polling on terminal states (task 9.3)
      if (status === "completed" || status === "failed" || status === "stalled") {
        return false;
      }
      return POLL_INTERVAL_MS;
    },
    // Keep data fresh — no stale time for active polling
    staleTime: 0,
  });

  // ─── SSE upgrade (task 9.4) ──────────────────────────────────────────────
  // Attempts SSE connection to /stream/pipeline-progress?connector={provider}.
  // If SSE connects and delivers data, disables polling.
  // If SSE fails or disconnects, falls back to polling automatically.

  useEffect(() => {
    if (!enabled || !useSSE) return;

    const ssePath = `${SSE_STREAM_PATH}?connector=${encodeURIComponent(provider)}`;
    let sseReceivedData = false;

    const unsubscribe = sseClient.on("pipeline-progress", (event: unknown) => {
      const payload = event as Partial<PipelineStatus> & { connector?: string };

      // Only process events for our provider
      if (payload.connector && payload.connector !== provider) return;

      // SSE is delivering data — mark as active (disables polling)
      if (!sseReceivedData) {
        sseReceivedData = true;
        setIsSSEActive(true);
      }

      // Update the query cache with SSE data
      queryClient.setQueryData<PipelineStatus>(queryKeys.pipeline.byConnector(provider), (prev) => {
        if (!prev) {
          // First SSE event — construct full state from payload
          return {
            connector: provider,
            status: payload.status ?? "syncing",
            currentStage: payload.currentStage ?? 1,
            totalStages: 8 as const,
            recordsProcessed: payload.recordsProcessed ?? 0,
            recordsWritten: payload.recordsWritten ?? 0,
            recordsQuarantined: payload.recordsQuarantined ?? 0,
            eta: payload.eta,
            error: payload.error,
            startedAt: payload.startedAt,
            completedAt: payload.completedAt,
          };
        }
        return { ...prev, ...payload, connector: provider };
      });
    });

    // Monitor SSE connection status — fall back to polling if disconnected.
    // onStatusChange exists on the SSEClient class but not the ISSEClient interface.
    const sseClientWithStatus = sseClient as typeof sseClient & {
      onStatusChange?: (cb: (status: string) => void) => () => void;
    };

    const unsubscribeStatus = sseClientWithStatus.onStatusChange?.((status) => {
      if (status === "connected" && sseReceivedData) {
        setIsSSEActive(true);
      } else if (status === "disconnected") {
        // SSE dropped — revert to polling
        setIsSSEActive(false);
      }
    });

    // Attempt SSE connection if not already connected
    if (sseClient.status !== "connected") {
      sseClient.connect(ssePath);
    }

    return () => {
      unsubscribe();
      unsubscribeStatus?.();
      setIsSSEActive(false);
    };
  }, [provider, enabled, useSSE, queryClient]);

  // ─── Completion callback — emit event on 'completed' (task 9.3) ──────────

  useEffect(() => {
    if (data?.status === "completed" && !completeFiredRef.current) {
      completeFiredRef.current = true;
      onCompleteRef.current?.();
    }
  }, [data?.status]);

  // ─── Retry action — for 'failed'/'stalled' states (task 9.3) ─────────────

  const retry = useCallback(() => {
    completeFiredRef.current = false;
    // Invalidate to restart polling from scratch
    queryClient.invalidateQueries({
      queryKey: queryKeys.pipeline.byConnector(provider),
    });
  }, [provider, queryClient]);

  // ─── Return (task 9.2) ───────────────────────────────────────────────────

  return {
    stage: data?.currentStage ?? 0,
    totalStages: 8 as const,
    recordsProcessed: data?.recordsProcessed ?? 0,
    recordsWritten: data?.recordsWritten ?? 0,
    recordsQuarantined: data?.recordsQuarantined ?? 0,
    eta: data?.eta ?? null,
    status: data?.status ?? "idle",
    error: data?.error ?? null,
    retry,
    isSSEActive,
  };
}
