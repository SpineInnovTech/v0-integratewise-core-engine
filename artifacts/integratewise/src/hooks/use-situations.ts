/**
 * useSituations — Fetches intelligence situations from Gateway → Intelligence Engine.
 * v3.6 §22.2 → Service ④ (integratewise-cognitive-brain)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api-client";

export interface Situation {
  id: string;
  type?: string;
  severity: string;
  description?: string;
  created_at?: string;
  resolved?: boolean;
  title?: string;
  status?: "open" | "closed" | "pending";
  recommendations?: string[];
  domain?: string;
  confidence?: number;
  narrative?: string;
  whyItMatters?: string;
  evidence?: Array<{ type: string; content?: string }>;
  proposedActions?: Array<{
    id: string;
    title: string;
    status: string;
    requiresApproval?: boolean;
  }>;
  createdAt?: string;
}

export interface UseSituationsResult {
  situations: Situation[];
  isLoading?: boolean;
  loading?: boolean;
  error?: Error | null;
  refetch?: () => Promise<void>;
}

export function useSituations(filters?: string | Record<string, any>): UseSituationsResult {
  const [situations, setSituations] = useState<Situation[]>([]);
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
      let qs = "";
      if (typeof filters === "string" && filters) {
        qs = `?domain=${encodeURIComponent(filters)}`;
      } else if (typeof filters === "object" && filters) {
        qs = "?" + new URLSearchParams(filters as any).toString();
      }

      const data = await apiFetch<Situation[]>(
        `/api/v1/intelligence/situations${qs}`,
        { signal: controller.signal },
        "Situations"
      );
      if (!controller.signal.aborted) {
        setSituations(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.warn("[useSituations] fetch failed:", err?.message);
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

  return { situations, isLoading, loading: isLoading, error, refetch };
}

export default useSituations;
