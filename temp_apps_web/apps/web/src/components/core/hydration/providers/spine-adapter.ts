/**
 * Spine Adapter — Routes through Gateway Worker → BFF → Supabase/KV
 *
 * Uses apiFetch so JWT + tenant + view-context headers are injected automatically.
 * Endpoint format: any /api/v1/* path served by the Gateway.
 *
 * Data flow:
 *   SpineAdapter.fetch() → apiFetch() → Gateway Worker → BFF Worker → Supabase / KV
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

class SpineAdapter implements DataProvider {
  readonly type = "spine" as const;

  constructor(private config: ProviderConfig) {}

  async fetch<T = any>(
    binding: SlotBinding,
    context: HydrationContext
  ): Promise<ProviderResult<T>> {
    const startMs = performance.now();

    // Dynamically import apiFetch to avoid circular deps at module load time
    const { apiFetch } = await import("@/lib/api-client");

    // Resolve endpoint — replace context placeholders
    let endpoint = binding.endpoint;
    endpoint = endpoint.replace(/\{domain\}/g, context.domain.toLowerCase());
    endpoint = endpoint.replace(/\{tenantId\}/g, context.tenantId);
    endpoint = endpoint.replace(/\{role\}/g, context.role);

    // Spine endpoints are always GET projections through the BFF
    const data = await apiFetch<T>(endpoint, {}, `Spine(${binding.slotId})`);

    return {
      data,
      provenance: {
        provider: "spine",
        endpoint,
        fetchedAt: new Date().toISOString(),
        sourceSystem: "gateway→bff→supabase",
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
      await apiFetch("/health", { timeout: 3000 }, "SpineHealth");
      return {
        provider: "spine",
        healthy: true,
        latencyMs: performance.now() - start,
        lastChecked: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        provider: "spine",
        healthy: false,
        latencyMs: performance.now() - start,
        lastChecked: new Date().toISOString(),
        errorMessage: err.message,
      };
    }
  }
}

export const createSpineAdapter: ProviderFactory = (config: ProviderConfig) => {
  return new SpineAdapter(config);
};
