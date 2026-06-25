/**
 * Provider Bus — Dynamic Provider Registry & Instantiation
 *
 * Provider-agnostic: the bus doesn't know what providers exist at compile time.
 * Providers self-register via factories. The bus instantiates them on first use.
 *
 * "Any system in backend can wire data to UI" — the bus is the universal bridge.
 */

import type {
  DataProvider,
  ProviderFactory,
  ProviderConfig,
  ProviderType,
  ProviderResult,
  HealthStatus,
  SlotBinding,
  HydrationContext,
} from "./types";

// ─── In-Memory Cache ─────────────────────────────────────────────────────────

interface CacheEntry<T = any> {
  data: T;
  fetchedAt: number;
  ttl: number;
  provenance: ProviderResult<T>["provenance"];
}

class FabricCache {
  private store = new Map<string, CacheEntry>();
  private maxEntries = 500;

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check TTL
    if (entry.ttl > 0 && Date.now() - entry.fetchedAt > entry.ttl) {
      // Don't delete — return as stale so caller can serve stale-while-revalidate
      return { ...entry, data: entry.data as T };
    }
    return entry as CacheEntry<T>;
  }

  isStale(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry || entry.ttl === 0) return true;
    return Date.now() - entry.fetchedAt > entry.ttl;
  }

  set<T>(key: string, result: ProviderResult<T>, ttl: number): void {
    // Evict oldest if at capacity
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }

    this.store.set(key, {
      data: result.data,
      fetchedAt: Date.now(),
      ttl,
      provenance: result.provenance,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

// ─── Provider Bus ────────────────────────────────────────────────────────────

export class ProviderBus {
  /** Registered factories (not yet instantiated) */
  private factories = new Map<ProviderType, ProviderFactory>();

  /** Instantiated providers (created on first use) */
  private instances = new Map<ProviderType, DataProvider>();

  /** Per-provider config */
  private configs = new Map<ProviderType, ProviderConfig>();

  /** In-flight requests to prevent duplicate concurrent fetches */
  private inflight = new Map<string, Promise<ProviderResult<any>>>();

  /** Cache layer */
  readonly cache = new FabricCache();

  // ── Registration ──────────────────────────────────────────────────────────

  /**
   * Register a provider factory. The actual provider instance is NOT created
   * until the first fetch request targets this provider type.
   */
  register(type: ProviderType, factory: ProviderFactory, config: ProviderConfig): void {
    this.factories.set(type, factory);
    this.configs.set(type, config);

    // If there's an existing instance, dispose it (hot-swap)
    const existing = this.instances.get(type);
    if (existing?.dispose) {
      existing.dispose();
    }
    this.instances.delete(type);

    console.log(`[ProviderBus] Registered provider: ${type} (enabled=${config.enabled})`);
  }

  /** Unregister a provider and dispose its instance */
  unregister(type: ProviderType): void {
    const instance = this.instances.get(type);
    if (instance?.dispose) instance.dispose();
    this.instances.delete(type);
    this.factories.delete(type);
    this.configs.delete(type);
    console.log(`[ProviderBus] Unregistered provider: ${type}`);
  }

  // ── Dynamic Instantiation ─────────────────────────────────────────────────

  /** Get or create a provider instance. Lazy — only created when first needed. */
  private getInstance(type: ProviderType): DataProvider {
    // Return cached instance
    let instance = this.instances.get(type);
    if (instance) return instance;

    // Instantiate from factory
    const factory = this.factories.get(type);
    const config = this.configs.get(type);
    if (!factory || !config) {
      throw new Error(`[ProviderBus] No registered factory for provider type: ${type}`);
    }
    if (!config.enabled) {
      throw new Error(`[ProviderBus] Provider ${type} is registered but disabled`);
    }

    instance = factory(config);
    this.instances.set(type, instance);
    console.log(`[ProviderBus] Instantiated provider: ${type}`);
    return instance;
  }

  // ── Fetch (with cache, dedup, fallback) ────────────────────────────────────

  /**
   * Fetch data for a slot binding. Handles:
   * 1. Cache hit (return immediately)
   * 2. In-flight dedup (return existing promise)
   * 3. Provider fetch
   * 4. Fallback provider on error
   * 5. Cache write
   */
  async fetch<T = any>(
    binding: SlotBinding,
    context: HydrationContext
  ): Promise<ProviderResult<T>> {
    const cacheKey = this.buildCacheKey(binding, context);

    // 1. Check cache
    const cached = this.cache.get<T>(cacheKey);
    if (cached && !this.cache.isStale(cacheKey)) {
      return {
        data: cached.data,
        provenance: cached.provenance,
        freshness: 1 - (Date.now() - cached.fetchedAt) / (binding.ttl || 30000),
        cached: true,
        partial: false,
        fetchDuration: 0,
      };
    }

    // 2. Check in-flight dedup
    const inflightKey = cacheKey;
    if (this.inflight.has(inflightKey)) {
      return this.inflight.get(inflightKey)! as Promise<ProviderResult<T>>;
    }

    // 3. Execute fetch
    const fetchPromise = this.executeFetch<T>(binding, context, cacheKey);
    this.inflight.set(inflightKey, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      this.inflight.delete(inflightKey);
    }
  }

  /**
   * Fetch with stale-while-revalidate: returns stale cache immediately,
   * triggers background refresh, calls onRefresh when new data arrives.
   */
  async fetchWithSWR<T = any>(
    binding: SlotBinding,
    context: HydrationContext,
    onRefresh: (result: ProviderResult<T>) => void
  ): Promise<ProviderResult<T> | null> {
    const cacheKey = this.buildCacheKey(binding, context);
    const cached = this.cache.get<T>(cacheKey);

    if (cached) {
      const isStale = this.cache.isStale(cacheKey);
      if (isStale) {
        // Return stale data, trigger background refresh
        this.executeFetch<T>(binding, context, cacheKey).then(onRefresh).catch(console.error);
      }
      return {
        data: cached.data,
        provenance: cached.provenance,
        freshness: isStale ? 0 : 1 - (Date.now() - cached.fetchedAt) / (binding.ttl || 30000),
        cached: true,
        partial: isStale,
        fetchDuration: 0,
      };
    }

    // No cache at all — do a full fetch
    return this.fetch<T>(binding, context);
  }

  private async executeFetch<T>(
    binding: SlotBinding,
    context: HydrationContext,
    cacheKey: string
  ): Promise<ProviderResult<T>> {
    const startMs = performance.now();
    let lastError: Error | null = null;

    const retryPolicy = binding.retryPolicy || {
      maxRetries: 1,
      backoffMs: 500,
      backoffMultiplier: 2,
    };

    // Try primary provider with retries
    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        const provider = this.getInstance(binding.provider);
        const result = await provider.fetch<T>(binding, context);
        const duration = performance.now() - startMs;

        const enriched: ProviderResult<T> = {
          ...result,
          fetchDuration: duration,
          cached: false,
        };

        // Write to cache
        if (binding.ttl > 0) {
          this.cache.set(cacheKey, enriched, binding.ttl);
        }

        return enriched;
      } catch (err: any) {
        lastError = err;
        console.warn(
          `[ProviderBus] Fetch attempt ${attempt + 1}/${retryPolicy.maxRetries + 1} failed for ${binding.slotId}:`,
          err.message
        );

        if (attempt < retryPolicy.maxRetries) {
          const delay = retryPolicy.backoffMs * Math.pow(retryPolicy.backoffMultiplier, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    // Try fallback provider if specified
    if (binding.fallbackProvider) {
      try {
        console.log(
          `[ProviderBus] Trying fallback provider: ${binding.fallbackProvider} for ${binding.slotId}`
        );
        const fallbackBinding: SlotBinding = { ...binding, provider: binding.fallbackProvider };
        const fallback = this.getInstance(binding.fallbackProvider);
        const result = await fallback.fetch<T>(fallbackBinding, context);
        return {
          ...result,
          fetchDuration: performance.now() - startMs,
          cached: false,
          partial: true,
        };
      } catch (fallbackErr: any) {
        console.error(
          `[ProviderBus] Fallback also failed for ${binding.slotId}:`,
          fallbackErr.message
        );
      }
    }

    throw (
      lastError || new Error(`[ProviderBus] All fetch attempts failed for slot: ${binding.slotId}`)
    );
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async healthCheck(): Promise<Record<string, HealthStatus>> {
    const results: Record<string, HealthStatus> = {};

    for (const [type, config] of this.configs.entries()) {
      if (!config.enabled) {
        results[type] = {
          provider: type,
          healthy: false,
          latencyMs: 0,
          lastChecked: new Date().toISOString(),
          errorMessage: "Provider disabled",
        };
        continue;
      }

      try {
        const instance = this.getInstance(type);
        if (instance.healthCheck) {
          results[type] = await instance.healthCheck();
        } else {
          results[type] = {
            provider: type,
            healthy: true,
            latencyMs: 0,
            lastChecked: new Date().toISOString(),
          };
        }
      } catch (err: any) {
        results[type] = {
          provider: type,
          healthy: false,
          latencyMs: 0,
          lastChecked: new Date().toISOString(),
          errorMessage: err.message,
        };
      }
    }

    return results;
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  private buildCacheKey(binding: SlotBinding, context: HydrationContext): string {
    const paramStr = binding.params ? JSON.stringify(binding.params) : "";
    return `${context.tenantId}:${context.domain}:${context.role}:${binding.slotId}:${paramStr}`;
  }

  getRegisteredProviders(): ProviderType[] {
    return [...this.factories.keys()];
  }

  getActiveProviders(): ProviderType[] {
    return [...this.instances.keys()];
  }

  isProviderRegistered(type: ProviderType): boolean {
    return this.factories.has(type);
  }

  dispose(): void {
    for (const [type, instance] of this.instances.entries()) {
      if (instance.dispose) {
        instance.dispose();
        console.log(`[ProviderBus] Disposed provider: ${type}`);
      }
    }
    this.instances.clear();
    this.cache.clear();
    this.inflight.clear();
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let _busInstance: ProviderBus | null = null;

export function getProviderBus(): ProviderBus {
  if (!_busInstance) {
    _busInstance = new ProviderBus();
  }
  return _busInstance;
}

export function resetProviderBus(): void {
  if (_busInstance) {
    _busInstance.dispose();
    _busInstance = null;
  }
}
