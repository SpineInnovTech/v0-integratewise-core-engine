/**
 * useSignals — Fetches intelligence signals from the Gateway → Intelligence Engine.
 * v3.6 §22.2 → Service ④ (integratewise-cognitive-brain)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api-client";

export interface Signal {
  id: string;
  type?: string;
  source?: string;
  payload?: any;
  created_at?: string;
  processed?: boolean;
  band?: "red" | "yellow" | "green";
  title?: string;
  computed_at?: string;
}

export interface UseSignalsResult {
  signals: Signal[];
  isLoading: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/** Response envelope from Think service GET /v1/signals */
interface SignalsEnvelope {
  data?: Signal[];
  recent_signals?: Signal[];
  signal_count?: number;
  unread_count?: number;
  active_situations?: number;
}

export function useSignals(filters?: string | Record<string, any>): UseSignalsResult {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      // Build query string from filters
      let qs = "";
      if (typeof filters === "string" && filters) {
        qs = `?domain=${encodeURIComponent(filters)}`;
      } else if (typeof filters === "object" && filters) {
        qs = "?" + new URLSearchParams(filters as any).toString();
      }

      const envelope = await apiFetch<SignalsEnvelope>(
        `/api/v1/intelligence/signals${qs}`,
        { signal: controller.signal },
        "Signals"
      );
      if (!controller.signal.aborted) {
        // Unwrap envelope — API returns { data: Signal[], ... }
        const rows = envelope.data || envelope.recent_signals || [];
        setSignals(Array.isArray(rows) ? rows : []);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.warn("[useSignals] fetch failed:", err?.message);
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    refetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [refetch]);

  return { signals, isLoading, loading: isLoading, error, refetch };
}

export default useSignals;
