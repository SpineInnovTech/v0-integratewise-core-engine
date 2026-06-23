/**
 * Doppler Adapter — Reads config/data from Doppler via Gateway proxy
 *
 * Doppler serves as a config store. The Gateway Worker proxies requests
 * to Doppler server-side (keeping the token out of the browser).
 *
 * Data flow:
 *   DopplerAdapter.fetch() → apiFetch() → Gateway Worker → Doppler API
 *
 * Endpoint format: "/api/v1/workspace/config/<variable-name>"
 * Note: Doppler is disabled by default in the manifest (enabled: false).
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

class DopplerAdapter implements DataProvider {
  readonly type = "doppler" as const;

  constructor(private config: ProviderConfig) {}

  async fetch<T = any>(
    binding: SlotBinding,
    context: HydrationContext
  ): Promise<ProviderResult<T>> {
    const startMs = performance.now();
    const { apiFetch } = await import("@/lib/api-client");

    let endpoint = binding.endpoint;
    endpoint = endpoint.replace(/\{domain\}/g, context.domain.toLowerCase());
    endpoint = endpoint.replace(/\{tenantId\}/g, context.tenantId);

    const data = await apiFetch<T>(endpoint, {}, `Doppler(${binding.slotId})`);

    return {
      data,
      provenance: {
        provider: "doppler",
        endpoint,
        fetchedAt: new Date().toISOString(),
        sourceSystem: "gateway→doppler",
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
    return {
      provider: "doppler",
      healthy: true,
      latencyMs: 0,
      lastChecked: new Date().toISOString(),
      errorMessage: "Doppler disabled — not used in current manifest",
    };
  }
}

export const createDopplerAdapter: ProviderFactory = (config: ProviderConfig) => {
  return new DopplerAdapter(config);
};
