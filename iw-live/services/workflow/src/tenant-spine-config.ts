/**
 * Shared tenant Spine config — single source for resolving tenant_id → Spine config.
 * Used by BFF (dashboard, projection, readiness) and views (Entity 360) for tenant-scoped behaviour.
 */

export interface TenantSpineConfigEnv {
  /** D1 (integratewise-spine-cache) — the single source for tenant Spine config (DECISION 22). */
  DB?: D1Database;
}

export interface TenantSpineConfigJson {
  domains: string[];
  active_ctx: string;
  schema_version: string;
  depth_matrix_snapshot: Record<string, unknown>;
  connected_connectors: string[];
  industry?: string | null;
  company_size?: string | null;
  user_type?: string | null;
}

export interface TenantKnowledgeReadPolicy {
  linkKnowledgeUI: boolean;
  approvedOnly: boolean;
}

const DEFAULT: TenantSpineConfigJson = {
  domains: [],
  active_ctx: "CTX_BIZOPS",
  schema_version: "1",
  depth_matrix_snapshot: {},
  connected_connectors: [],
};

function readBooleanFlag(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "") return defaultValue;
  return normalized === "true" || normalized === "yes" || normalized === "1" || normalized === "on";
}

/** Returns tenant Spine config as JSON. When D1/Supabase is not set or tenant missing, returns default (empty domains). */
export async function getTenantSpineConfigJson(
  env: TenantSpineConfigEnv,
  tenantId: string
): Promise<TenantSpineConfigJson> {
  if (!tenantId) return { ...DEFAULT, domains: [], connected_connectors: [] };

  // 1. D1 Database Cache First
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT domains, industry, schema_version, allowed_entity_types, connector_configs, connected_connectors, depth_matrix_snapshot FROM tenant_spine_config WHERE tenant_id = ?"
      )
        .bind(tenantId)
        .first<{
          domains: string;
          industry: string | null;
          schema_version: string;
          allowed_entity_types: string;
          connector_configs: string;
          connected_connectors: string;
          depth_matrix_snapshot: string | null;
        }>();

      if (row) {
        let domains: string[] = [];
        try {
          domains = JSON.parse(row.domains) ?? [];
        } catch {}

        let connected_connectors: string[] = [];
        try {
          connected_connectors = JSON.parse(row.connected_connectors) ?? [];
        } catch {}

        let depth_matrix_snapshot: Record<string, unknown> = {};
        if (row.depth_matrix_snapshot) {
          try {
            depth_matrix_snapshot = JSON.parse(row.depth_matrix_snapshot) ?? {};
          } catch {}
        }

        // D1 table lacks active_ctx; resolve it from depth_matrix_snapshot or default to CTX_BIZOPS
        const active_ctx = (depth_matrix_snapshot.active_ctx ||
          depth_matrix_snapshot.activeCtx ||
          "CTX_BIZOPS") as string;

        return {
          domains,
          active_ctx,
          schema_version: row.schema_version ?? "1",
          depth_matrix_snapshot,
          connected_connectors,
          industry: row.industry ?? undefined,
          company_size: undefined, // D1 lacks it
          user_type: undefined, // D1 lacks it
        };
      }
    } catch (err) {
      console.warn("[tenant-spine-config] D1 query failed:", err);
    }
  }

  // D1 is the single source of truth (DECISION 22). No Supabase fallback.
  return { ...DEFAULT };
}

/**
 * Returns whether Entity 360 and Twin may read Knowledge UI (compounding space).
 * From onboarding: depth_matrix_snapshot.link_knowledge_ui_to_entity360.
 * Default true for backward compatibility.
 */
export async function getTenantLinkKnowledgeToEntity360(
  env: TenantSpineConfigEnv,
  tenantId: string
): Promise<boolean> {
  const policy = await getTenantKnowledgeReadPolicy(env, tenantId);
  return policy.linkKnowledgeUI;
}

export async function getTenantKnowledgeReadPolicy(
  env: TenantSpineConfigEnv,
  tenantId: string
): Promise<TenantKnowledgeReadPolicy> {
  const config = await getTenantSpineConfigJson(env, tenantId);
  const snapshot = config.depth_matrix_snapshot ?? {};
  const approvedOnlyValue =
    snapshot.limit_flow_c_to_approved_memory ??
    snapshot.flow_c_approved_only ??
    snapshot.approved_compounding_only ??
    snapshot.compounding_memory_approved_only ??
    snapshot.knowledge_ui_approved_only;

  return {
    linkKnowledgeUI: readBooleanFlag(snapshot.link_knowledge_ui_to_entity360, true),
    approvedOnly: readBooleanFlag(approvedOnlyValue, false),
  };
}
