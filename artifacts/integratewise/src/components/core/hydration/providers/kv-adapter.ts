/**
 * KV Adapter — Reads from Cloudflare KV via Gateway Worker proxy
 *
 * Cloudflare KV is the operational SSOT layer — stores Spine projections,
 * readiness scores, and normalized entity cache per tenant.
 *
 * Data flow:
 *   KVAdapter.fetch() → apiFetch() → Gateway Worker → KV namespace
 *
 * Endpoint format: "/api/v1/workspace/kv/<key>" or any KV-backed endpoint.
 * The Gateway Worker resolves the tenant-scoped KV key server-side.
 */

import type {
  DataProvider,
  ProviderConfig,
  ProviderResult,
  ProviderFactory,
  SlotBinding,
  HydrationContext,
  HealthStatus,
} from "../types";

class KVAdapter implements DataProvider {
  readonly type = "kv" as const;

  constructor(private config: ProviderConfig) {}

  async fetch<T = any>(
    binding: SlotBinding,
    context: HydrationContext
  ): Promise<ProviderResult<T>> {
    const startMs = performance.now();

    const { apiFetch } = await import("@/lib/api-client");

    // Resolve endpoint placeholders
    let endpoint = binding.endpoint;
    endpoint = endpoint.replace(/\{domain\}/g, context.domain.toLowerCase());
    endpoint = endpoint.replace(/\{tenantId\}/g, context.tenantId);
    endpoint = endpoint.replace(/\{role\}/g, context.role);

    // KV reads are always GET — the Gateway resolves the tenant-scoped key
    const data = await apiFetch<T>(endpoint, {}, `KV(${binding.slotId})`);

    return {
      data,
      provenance: {
        provider: "kv",
        endpoint,
        fetchedAt: new Date().toISOString(),
        sourceSystem: "gateway→cloudflare-kv",
        confidence: 1.0,
        transformApplied: binding.transform,
      },
      freshness: 1.0,
      cached: false,
      partial: false,
      fetchDuration: performance.now() - startMs,
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = performance.now();
    try {
      const { apiFetch } = await import("@/lib/api-client");
      await apiFetch("/api/v1/workspace/readiness", { timeout: 3000 }, "KVHealth");
      return {
        provider: "kv",
        healthy: true,
        latencyMs: performance.now() - start,
        lastChecked: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        provider: "kv",
        healthy: false,
        latencyMs: performance.now() - start,
        lastChecked: new Date().toISOString(),
        errorMessage: err.message,
      };
    }
  }
}

export const createKVAdapter: ProviderFactory = (config: ProviderConfig) => {
  return new KVAdapter(config);
};
