/**
 * Real-time Provider
 *
 * Manages SSE connections for live updates:
 * - Pipeline status changes
 * - New signals from intelligence
 * - HITL proposal updates
 * - Document ingestion progress
 *
 * Uses Server-Sent Events via the Gateway /stream/* endpoints.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getStreamUrl } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

interface RealtimeEvent {
  channel: string;
  type: string;
  data: any;
  timestamp: number;
}

type EventHandler = (event: RealtimeEvent) => void;

interface RealtimeContextValue {
  connected: boolean;
  subscribe: (channel: string, handler: EventHandler) => () => void;
  lastEvent: RealtimeEvent | null;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  subscribe: () => () => {},
  lastEvent: null,
});

// ─── Provider ───────────────────────────────────────────────────────────────

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    const streamUrl = getStreamUrl();
    if (!streamUrl) return;

    try {
      const es = new EventSource(`${streamUrl}/stream/events`, {
        withCredentials: true,
      });

      es.onopen = () => {
        setConnected(true);
        console.log("[Realtime] Connected");
      };

      es.onmessage = (event) => {
        try {
          const parsed: RealtimeEvent = JSON.parse(event.data);
          setLastEvent(parsed);

          const handlers = handlersRef.current.get(parsed.channel);
          if (handlers) {
            handlers.forEach((handler) => handler(parsed));
          }

          // Auto-invalidate relevant React Query caches
          if (parsed.channel === "signals") {
            queryClient.invalidateQueries({ queryKey: ["signals"] });
          } else if (parsed.channel === "pipeline") {
            queryClient.invalidateQueries({ queryKey: ["pipeline-status"] });
            queryClient.invalidateQueries({ queryKey: ["entities"] });
          } else if (parsed.channel === "hitl") {
            queryClient.invalidateQueries({ queryKey: ["hitl-queue"] });
          }
        } catch {
          // Non-JSON event — ignore
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();

        // Reconnect with exponential backoff (max 30s)
        const delay = Math.min((reconnectTimeoutRef.current ? 2 : 1) * 5000, 30000);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      eventSourceRef.current = es;
    } catch {
      console.warn("[Realtime] Failed to connect — SSE not available");
    }
  }, [queryClient]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  const subscribe = useCallback((channel: string, handler: EventHandler) => {
    if (!handlersRef.current.has(channel)) {
      handlersRef.current.set(channel, new Set());
    }
    handlersRef.current.get(channel)!.add(handler);

    return () => {
      handlersRef.current.get(channel)?.delete(handler);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ connected, subscribe, lastEvent }}>
      {children}
    </RealtimeContext.Provider>
  );
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useRealtime() {
  return useContext(RealtimeContext);
}

export function useRealtimeChannel(channel: string, handler: EventHandler) {
  const { subscribe } = useRealtime();

  useEffect(() => {
    return subscribe(channel, handler);
  }, [channel, handler, subscribe]);
}

export function useSignalsRealtime() {
  const [signals, setSignals] = useState<any[]>([]);

  useRealtimeChannel(
    "signals",
    useCallback((event) => {
      if (event.type === "new" || event.type === "updated") {
        setSignals((prev) => {
          const idx = prev.findIndex((s) => s.id === event.data.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = event.data;
            return next;
          }
          return [event.data, ...prev];
        });
      }
    }, [])
  );

  return signals;
}

export function useIngestionRealtime(documentId: string) {
  const [progress, setProgress] = useState<{
    status: string;
    percent: number;
    stage?: string;
  }>({ status: "pending", percent: 0 });

  useRealtimeChannel(
    `ingestion:${documentId}`,
    useCallback((event) => {
      setProgress({
        status: event.data.status || event.type,
        percent: event.data.percent ?? 0,
        stage: event.data.stage,
      });
    }, [])
  );

  return progress;
}

export function useHITLRealtime() {
  const [proposals, setProposals] = useState<any[]>([]);

  useRealtimeChannel(
    "hitl",
    useCallback((event) => {
      if (event.type === "new_proposal") {
        setProposals((prev) => [event.data, ...prev]);
      } else if (event.type === "resolved") {
        setProposals((prev) => prev.filter((p) => p.id !== event.data.id));
      }
    }, [])
  );

  return proposals;
}
