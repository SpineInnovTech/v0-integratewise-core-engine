/**
 * Tenant Class Lookup — fail-safe to 'external'
 *
 * Reads tenant_class from KV cache (TTL 60s), falls back to D1 tenant_config.
 * Any failure defaults to 'external' (deny native execution).
 */

export type TenantClass = "customer_zero" | "external";

interface TenantEnv {
  D1: D1Database;
  CACHE?: KVNamespace;
}

const TENANT_CLASS_TTL = 60; // seconds

export async function getTenantClass(
  tenantId: string,
  env: TenantEnv
): Promise<TenantClass> {
  if (!tenantId) return "external";

  // 1. Try KV cache
  const cacheKey = `tenant_class:${tenantId}`;
  try {
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached === "customer_zero" || cached === "external") {
        return cached;
      }
    }
  } catch (err) {
    console.warn(`[getTenantClass] KV cache read failed for ${tenantId}:`, err);
    // Continue to D1 fallback
  }

  // 2. Query D1
  try {
    const result = await env.D1.prepare(
      "SELECT tenant_class FROM tenant_config WHERE tenant_id = ?"
    )
      .bind(tenantId)
      .first<{ tenant_class: string }>();

    const tenantClass: TenantClass =
      result?.tenant_class === "customer_zero" ? "customer_zero" : "external";

    // 3. Cache the result
    try {
      if (env.CACHE) {
        await env.CACHE.put(cacheKey, tenantClass, { expirationTtl: TENANT_CLASS_TTL });
      }
    } catch (err) {
      console.warn(`[getTenantClass] KV cache write failed for ${tenantId}:`, err);
    }

    return tenantClass;
  } catch (err) {
    console.error(`[getTenantClass] D1 lookup failed for ${tenantId}, defaulting to 'external':`, err);
    return "external"; // Fail-safe: deny native execution
  }
}
