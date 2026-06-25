/**
 * Public data loading hooks — no authentication required.
 *
 * Uses direct fetch (NOT gatewayClient) to avoid injecting Authorization headers.
 * Each hook returns hardcoded defaults on error for graceful degradation.
 */

import { useQuery } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PublicFlags {
  features: Record<string, boolean>;
  maintenance: boolean;
}

export interface PublicPricing {
  plans: Array<{
    id: string;
    name: string;
    price?: number;
    interval?: string;
    features?: string[];
    [key: string]: unknown;
  }>;
}

export interface PublicStatus {
  operational: boolean;
  services: Array<{
    name: string;
    status: string;
    [key: string]: unknown;
  }>;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_FLAGS: PublicFlags = { features: {}, maintenance: false };
const DEFAULT_PRICING: PublicPricing = { plans: [] };
const DEFAULT_STATUS: PublicStatus = { operational: true, services: [] };

// ─── Fetcher (no auth) ───────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function publicFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.warn(`[usePublicData] ${path} returned ${res.status}, using fallback`);
      return fallback;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[usePublicData] ${path} failed, using fallback`, err);
    return fallback;
  }
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Fetches public feature flags. No auth required.
 * Falls back to `{ features: {}, maintenance: false }` on error.
 */
export function usePublicFlags() {
  return useQuery<PublicFlags>({
    queryKey: ["public", "flags"],
    queryFn: () => publicFetch("/api/v1/public/flags", DEFAULT_FLAGS),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/**
 * Fetches public pricing data. No auth required.
 * Falls back to `{ plans: [] }` on error.
 */
export function usePublicPricing() {
  return useQuery<PublicPricing>({
    queryKey: ["public", "pricing"],
    queryFn: () => publicFetch("/api/v1/public/pricing", DEFAULT_PRICING),
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

/**
 * Fetches public system status. No auth required.
 * Falls back to `{ operational: true, services: [] }` on error.
 */
export function usePublicStatus() {
  return useQuery<PublicStatus>({
    queryKey: ["public", "status"],
    queryFn: () => publicFetch("/api/v1/public/status", DEFAULT_STATUS),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
