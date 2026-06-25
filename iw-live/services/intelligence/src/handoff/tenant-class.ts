/**
 * Tenant Class Lookup — resolves tenant_class (customer_zero | external)
 * from D1 tenant_config with KV cache (TTL 60s).
 *
 * Default for any unknown/missing tenant: "external" (fail-safe deny on S11 entry).
 */

export type TenantClass = "customer_zero" | "external";

export async function getTenantClass(
  db: D1Database,
  cache: KVNamespace | undefined,
  tenantId: string
): Promise<TenantClass> {
  const cacheKey = `tenant_class:${tenantId}`;

  // 1. Check KV cache (60s TTL)
  if (cache) {
    const cached = await cache.get(cacheKey);
    if (cached === "customer_zero" || cached === "external") {
      return cached;
    }
  }

  // 2. Query D1
  try {
    const row = await db
      .prepare(`SELECT tenant_class FROM tenant_config WHERE tenant_id = ? LIMIT 1`)
      .bind(tenantId)
      .first<{ tenant_class: string }>();

    const tenantClass: TenantClass =
      row?.tenant_class === "customer_zero" ? "customer_zero" : "external";

    // 3. Cache result
    if (cache) {
      await cache.put(cacheKey, tenantClass, { expirationTtl: 60 });
    }

    return tenantClass;
  } catch {
    // Fail-safe: default to external (Requirement 8.3)
    return "external";
  }
}
