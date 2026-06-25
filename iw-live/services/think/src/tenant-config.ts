/**
 * Tenant Spine config helpers for THINK (optional tenant check).
 * Resolves tenant_id → allowed entity types from tenant_spine_config (Adaptive Spine).
 * See HARDENING_AND_WIRING.md §7: THINK tenant check.
 *
 * IMPORTANT: Entity type validation derives from DOMAIN_SPINE_CONFIG in
 * packages/types/src/schema.ts — the SINGLE SOURCE OF TRUTH.
 * Do NOT maintain a separate entity type list here.
 */
import { resolveTenantAdaptiveSchema, getTenantCanonicalEntityTypes } from "@integratewise/types";

export type ThinkEnv = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
};

/**
 * Fetch allowed entity types for tenant from tenant_spine_config.
 * Returns null when no config or no Supabase (allow-all behaviour).
 *
 * Resolution order:
 * 1. resolveTenantAdaptiveSchema() — full schema with registry-grown types
 * 2. Direct REST query → getTenantCanonicalEntityTypes() from DOMAIN_SPINE_CONFIG
 */
export async function getTenantAllowedEntityTypes(
  env: ThinkEnv,
  tenantId: string
): Promise<Set<string> | null> {
  if (!tenantId || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  try {
    const resolved = await resolveTenantAdaptiveSchema({
      supabaseUrl: env.SUPABASE_URL,
      serviceRoleKey: env.SUPABASE_SERVICE_KEY,
      tenantId,
    });
    if (resolved?.allowedEntityTypes?.length) {
      return new Set(resolved.allowedEntityTypes);
    }

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/tenant_spine_config?tenant_id=eq.${encodeURIComponent(tenantId)}&select=domains,industry`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { domains: string[]; industry?: string | null }[];
    const row = rows?.[0];
    const domains = row?.domains;
    if (!Array.isArray(domains) || domains.length === 0) return null;
    // Derive from canonical DOMAIN_SPINE_CONFIG — single source of truth
    const allowed = getTenantCanonicalEntityTypes(domains, row?.industry ?? null);
    return allowed.size > 0 ? allowed : null;
  } catch {
    return null;
  }
}
