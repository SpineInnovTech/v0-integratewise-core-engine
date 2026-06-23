/**
 * Static Adapter — Embedded / Mock / Default Data Provider
 *
 * Returns data baked into the manifest itself (via SlotBinding.params.data)
 * or from a registered static data store. Used for:
 *   - Fallback data when other providers fail
 *   - Default/placeholder data during skeleton phase
 *   - Mock data for development/demo mode
 *   - Configuration values that don't need a remote fetch
 *
 * Endpoint format: "static/<key>" where <key> maps to registered static datasets
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

/** In-memory store for static datasets */
const staticStore = new Map<string, any>();

class StaticAdapter implements DataProvider {
  readonly type = "static" as const;

  constructor(private config: ProviderConfig) {
    // Pre-populate from config.meta if provided
    if (config.meta?.datasets) {
      for (const [key, value] of Object.entries(config.meta.datasets)) {
        staticStore.set(key, value);
      }
    }
  }

  async fetch<T = any>(
    binding: SlotBinding,
    _context: HydrationContext
  ): Promise<ProviderResult<T>> {
    const startMs = performance.now();

    // Priority 1: Data embedded directly in the slot binding params
    if (binding.params?.data !== undefined) {
      return this.wrapResult(binding.params.data as T, binding, startMs);
    }

    // Priority 2: Look up in static store by endpoint key
    const key = binding.endpoint.replace(/^static\//, "");
    const stored = staticStore.get(key);
    if (stored !== undefined) {
      return this.wrapResult(stored as T, binding, startMs);
    }

    // Priority 3: Return empty but valid result
    console.warn(`[StaticAdapter] No data found for key '${key}', returning empty object`);
    return this.wrapResult({} as T, binding, startMs);
  }

  async healthCheck(): Promise<HealthStatus> {
    return {
      provider: "static",
      healthy: true,
      latencyMs: 0,
      lastChecked: new Date().toISOString(),
    };
  }

  private wrapResult<T>(data: T, binding: SlotBinding, startMs: number): ProviderResult<T> {
    return {
      data,
      provenance: {
        provider: "static",
        endpoint: binding.endpoint,
        fetchedAt: new Date().toISOString(),
        sourceSystem: "embedded",
        confidence: 0.5,
        transformApplied: binding.transform,
      },
      freshness: 1.0,
      cached: false,
      partial: false,
      fetchDuration: performance.now() - startMs,
    };
  }
}

// ── Public API: register/read static datasets ────────────────────────────────

export function registerStaticData(key: string, data: any): void {
  staticStore.set(key, data);
}

export function getStaticData<T = any>(key: string): T | undefined {
  return staticStore.get(key) as T | undefined;
}

export function clearStaticData(): void {
  staticStore.clear();
}

// ── Factory ──────────────────────────────────────────────────────────────────

export const createStaticAdapter: ProviderFactory = (config: ProviderConfig) => {
  return new StaticAdapter(config);
};
