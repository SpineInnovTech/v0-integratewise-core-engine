/**
 * useSSE — React hook for real-time Server-Sent Events via CF Gateway
 *
 * Connects to an SSE endpoint on mount, disconnects on unmount.
 * On signal events, invalidates TanStack Query cache for ['signals'].
 *
 * Requirements: R12 (Real-Time Signal and Event Delivery)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { sseClient, type SSEConnectionStatus, type SSEEventHandler } from "@/lib/sse-client";
import { queryClient, queryKeys } from "@/lib/query-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UseSSEOptions {
  /** SSE endpoint path (e.g., "/stream/signals") */
  path: string;
  /** Event handlers keyed by event name. Use "*" for all events. */
  events?: Record<string, SSEEventHandler>;
  /** Whether to connect immediately (default: true) */
  enabled?: boolean;
  /** Whether to auto-invalidate signals cache on signal events (default: true) */
  invalidateSignals?: boolean;
}

export interface UseSSEReturn {
  /** Current connection status */
  status: SSEConnectionStatus;
  /** Manually connect */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * React hook for SSE real-time event delivery.
 *
 * Connects to the specified SSE path on mount (when enabled),
 * registers event handlers, and disconnects on unmount.
 *
 * By default, any signal event received will invalidate the TanStack Query
 * cache for `queryKeys.signals.all`, triggering a refetch in any component
 * using that query key.
 *
 * @example
 * ```tsx
 * function WorkspaceView() {
 *   const { status } = useSSE({
 *     path: "/stream/signals",
 *     events: {
 *       signal: (data) => console.log("New signal:", data),
 *     },
 *   });
 *
 *   return <div>SSE: {status}</div>;
 * }
 * ```
 */
export function useSSE(options: UseSSEOptions): UseSSEReturn {
  const { path, events, enabled = true, invalidateSignals = true } = options;
  const [status, setStatus] = useState<SSEConnectionStatus>(sseClient.status);

  // Ref to track mounted state for async safety
  const mountedRef = useRef(true);
  // Ref to hold cleanup functions from event subscriptions
  const unsubscribesRef = useRef<Array<() => void>>([]);

  // Invalidate signals cache when a signal event is received
  const handleSignalEvent: SSEEventHandler = useCallback(() => {
    if (invalidateSignals) {
      queryClient.invalidateQueries({ queryKey: queryKeys.signals.all });
    }
  }, [invalidateSignals]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      return;
    }

    // Subscribe to status changes
    const unsubStatus = (sseClient as any).onStatusChange
      ? (sseClient as any).onStatusChange((newStatus: SSEConnectionStatus) => {
          if (mountedRef.current) {
            setStatus(newStatus);
          }
        })
      : undefined;

    // Register signal handler for cache invalidation
    const unsubSignal = sseClient.on("signal", handleSignalEvent);
    unsubscribesRef.current.push(unsubSignal);

    // Also listen on "message" (default SSE event type) for cache invalidation
    const unsubMessage = sseClient.on("message", handleSignalEvent);
    unsubscribesRef.current.push(unsubMessage);

    // Register user-provided event handlers
    if (events) {
      for (const [eventName, handler] of Object.entries(events)) {
        const unsub = sseClient.on(eventName, handler);
        unsubscribesRef.current.push(unsub);
      }
    }

    // Connect to the SSE endpoint
    sseClient.connect(path);

    return () => {
      mountedRef.current = false;

      // Unsubscribe from all event handlers
      for (const unsub of unsubscribesRef.current) {
        unsub();
      }
      unsubscribesRef.current = [];

      // Unsubscribe from status changes
      if (unsubStatus) {
        unsubStatus();
      }

      // Disconnect from SSE
      sseClient.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled]);

  const connect = useCallback(() => {
    if (path) {
      sseClient.connect(path);
    }
  }, [path]);

  const disconnect = useCallback(() => {
    sseClient.disconnect();
  }, []);

  return {
    status,
    connect,
    disconnect,
  };
}
