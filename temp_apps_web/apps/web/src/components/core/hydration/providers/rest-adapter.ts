/**
 * REST Adapter — Generic REST API Provider
 *
 * For relative paths (/api/v1/*): uses apiFetch so JWT + tenant + view-context
 * headers are injected automatically → routes through Gateway Worker.
 *
 * For absolute URLs (https://...): uses raw fetch for external APIs.
 *
 * Data flow (relative):
 *   RestAdapter.fetch() → apiFetch() → Gateway Worker → downstream service
 *
 * Data flow (absolute):
 *   RestAdapter.fetch() → fetch() → external API directly
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

class RestAdapter implements DataProvider {
  readonly type = "rest" as const;
  private baseUrl: string;
  private timeout: number;

  constructor(private config: ProviderConfig) {
    this.baseUrl = config.baseUrl || "";
    this.timeout = config.timeout || 15000;
  }

  async fetch<T = any>(
    binding: SlotBinding,
    context: HydrationContext
  ): Promise<ProviderResult<T>> {
    const startMs = performance.now();

    // Resolve endpoint placeholders
    let endpoint = binding.endpoint;
    endpoint = endpoint.replace(/\{domain\}/g, context.domain.toLowerCase());
    endpoint = endpoint.replace(/\{tenantId\}/g, context.tenantId);
    endpoint = endpoint.replace(/\{role\}/g, context.role);
    endpoint = endpoint.replace(/\{userName\}/g, encodeURIComponent(context.userName));

    const isAbsolute = endpoint.startsWith("http://") || endpoint.startsWith("https://");
    const method = (binding.method || "GET") as "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

    let data: T;

    if (isAbsolute) {
      // External URL — raw fetch, no auth headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      try {
        const opts: RequestInit = {
          method,
          headers: { "Content-Type": "application/json", ...(binding.headers || {}) },
          signal: controller.signal,
        };
        if (method === "POST" && binding.params) {
          opts.body = JSON.stringify(binding.params);
        }
        const res = await fetch(endpoint, opts);
        if (!res.ok) throw new Error(`${method} ${endpoint} → ${res.status}`);
        data = await res.json();
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      // Relative path — use apiFetch (injects JWT + tenant + view-context)
      const { apiFetch } = await import("@/lib/api-client");

      // Build full path with base if needed
      const path = this.baseUrl
        ? `${this.baseUrl.replace(/\/$/, "")}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
        : endpoint;

      data = await apiFetch<T>(
        path,
        {
          method,
          body: method !== "GET" && binding.params ? binding.params : undefined,
          timeout: this.timeout,
        },
        `REST(${binding.slotId})`
      );
    }

    return {
      data,
      provenance: {
        provider: "rest",
        endpoint,
        fetchedAt: new Date().toISOString(),
        sourceSystem: isAbsolute ? new URL(endpoint).hostname : "gateway",
        confidence: 0.95,
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
    if (!this.baseUrl) {
      return {
        provider: "rest",
        healthy: true,
        latencyMs: 0,
        lastChecked: new Date().toISOString(),
        errorMessage: "No baseUrl — endpoint-specific mode",
      };
    }
    try {
      const { apiFetch } = await import("@/lib/api-client");
      await apiFetch("/health", { timeout: 3000 }, "RestHealth");
      return {
        provider: "rest",
        healthy: true,
        latencyMs: performance.now() - start,
        lastChecked: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        provider: "rest",
        healthy: false,
        latencyMs: performance.now() - start,
        lastChecked: new Date().toISOString(),
        errorMessage: err.message,
      };
    }
  }
}

export const createRestAdapter: ProviderFactory = (config: ProviderConfig) => {
  return new RestAdapter(config);
};
