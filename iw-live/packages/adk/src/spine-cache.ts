/**
 * ADK Local Spine Cache
 *
 * KV-backed hot cache for frequently accessed Spine data.
 * Sub-10ms reads. TTL-managed. Never canonical truth.
 *
 * Cache hierarchy:
 *   KV (hot, 60-300s TTL) → D1 (edge, structured) → Vault (encrypted)
 *
 * The cache NEVER bypasses the Spine. It accelerates reads.
 * On cache miss: read from D1/Vault, populate cache, return.
 * On write: invalidate cache, write goes through Pipeline only.
 */

export interface CacheEntry<T = unknown> {
  data: T;
  cached_at: string;
  ttl_seconds: number;
  source: "d1" | "vault" | "vectorize" | "computed";
}

export interface SpineCacheConfig {
  /** Default TTL for entity cache entries (seconds) */
  entity_ttl: number;
  /** TTL for signal cache entries (seconds) */
  signal_ttl: number;
  /** TTL for connector status entries (seconds) */
  connector_ttl: number;
  /** TTL for tenant config entries (seconds) */
  tenant_config_ttl: number;
  /** TTL for ADK routing entries (seconds) */
  routing_ttl: number;
}

const DEFAULT_CONFIG: SpineCacheConfig = {
  entity_ttl: 120, // 2 minutes
  signal_ttl: 30, // 30 seconds (signals change fast)
  connector_ttl: 30, // 30 seconds
  tenant_config_ttl: 300, // 5 minutes
  routing_ttl: 86400, // 24 hours (capabilities rarely change)
};

/**
 * Local Spine Cache — KV-backed acceleration layer
 */
export class SpineCache {
  private kv: KVNamespace;
  private config: SpineCacheConfig;
  private readonly PREFIX = "cache:";

  constructor(kv: KVNamespace, config: Partial<SpineCacheConfig> = {}) {
    this.kv = kv;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─── Entity Cache ──────────────────────────────────────────────────

  /** Cache an entity (after reading from D1/Vault) */
  async putEntity(tenantId: string, entityId: string, data: unknown): Promise<void> {
    const key = `${this.PREFIX}entity:${tenantId}:${entityId}`;
    const entry: CacheEntry = {
      data,
      cached_at: new Date().toISOString(),
      ttl_seconds: this.config.entity_ttl,
      source: "vault",
    };
    await this.kv.put(key, JSON.stringify(entry), { expirationTtl: this.config.entity_ttl });
  }

  /** Get a cached entity */
  async getEntity(tenantId: string, entityId: string): Promise<unknown | null> {
    const key = `${this.PREFIX}entity:${tenantId}:${entityId}`;
    const raw = await this.kv.get(key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    return entry.data;
  }

  /** Invalidate entity cache (called after Pipeline writes) */
  async invalidateEntity(tenantId: string, entityId: string): Promise<void> {
    await this.kv.delete(`${this.PREFIX}entity:${tenantId}:${entityId}`);
  }

  // ─── Signal Cache ──────────────────────────────────────────────────

  /** Cache signals for a tenant */
  async putSignals(tenantId: string, signals: unknown[]): Promise<void> {
    const key = `${this.PREFIX}signals:${tenantId}`;
    const entry: CacheEntry = {
      data: signals,
      cached_at: new Date().toISOString(),
      ttl_seconds: this.config.signal_ttl,
      source: "d1",
    };
    await this.kv.put(key, JSON.stringify(entry), { expirationTtl: this.config.signal_ttl });
  }

  /** Get cached signals */
  async getSignals(tenantId: string): Promise<unknown[] | null> {
    const key = `${this.PREFIX}signals:${tenantId}`;
    const raw = await this.kv.get(key);
    if (!raw) return null;
    const entry: CacheEntry<unknown[]> = JSON.parse(raw);
    return entry.data;
  }

  // ─── Connector Status Cache ────────────────────────────────────────

  /** Cache connector status */
  async putConnectorStatus(tenantId: string, provider: string, status: unknown): Promise<void> {
    const key = `${this.PREFIX}connector:${tenantId}:${provider}`;
    await this.kv.put(key, JSON.stringify(status), { expirationTtl: this.config.connector_ttl });
  }

  /** Get cached connector status */
  async getConnectorStatus(tenantId: string, provider: string): Promise<unknown | null> {
    const raw = await this.kv.get(`${this.PREFIX}connector:${tenantId}:${provider}`);
    return raw ? JSON.parse(raw) : null;
  }

  // ─── Tenant Config Cache ───────────────────────────────────────────

  /** Cache tenant config */
  async putTenantConfig(tenantId: string, config: unknown): Promise<void> {
    const key = `${this.PREFIX}tenant:${tenantId}`;
    await this.kv.put(key, JSON.stringify(config), {
      expirationTtl: this.config.tenant_config_ttl,
    });
  }

  /** Get cached tenant config */
  async getTenantConfig(tenantId: string): Promise<unknown | null> {
    const raw = await this.kv.get(`${this.PREFIX}tenant:${tenantId}`);
    return raw ? JSON.parse(raw) : null;
  }

  // ─── Bulk Operations ───────────────────────────────────────────────

  /** Invalidate all cache for a tenant (after major state change) */
  async invalidateTenant(tenantId: string): Promise<void> {
    // KV doesn't support prefix delete, so we invalidate known keys
    const keys = [`${this.PREFIX}signals:${tenantId}`, `${this.PREFIX}tenant:${tenantId}`];
    await Promise.all(keys.map((k) => this.kv.delete(k)));
  }

  /** Get cache stats (for monitoring) */
  async getStats(): Promise<{ prefix: string; note: string }> {
    return {
      prefix: this.PREFIX,
      note: "KV does not expose count. Monitor via CF analytics.",
    };
  }
}
