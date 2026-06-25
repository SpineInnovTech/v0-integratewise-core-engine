-- =============================================================================
-- 051_tenant_spine_config.sql
-- Tenant Spine config: category/domains + schema decided at onboarding.
-- Every screen/stage resolves (tenant_id, user_id) → look up this config →
-- drive which entities, fields, metrics, modules apply.
-- =============================================================================

-- Tenant Spine config (created/updated at onboarding; read by all stages)
CREATE TABLE IF NOT EXISTS tenant_spine_config (
    tenant_id TEXT NOT NULL PRIMARY KEY,
    -- Domains/category this tenant cares about (e.g. ["SALES", "CSM", "FINANCE"])
    domains TEXT[] NOT NULL DEFAULT '{}',
    -- View context / initial domain from onboarding (e.g. CTX_SALES, CTX_CS)
    active_ctx TEXT,
    org_type TEXT,
    -- Schema version for this tenant (e.g. "1", "adaptive-v1")
    schema_version TEXT NOT NULL DEFAULT '1',
    -- Snapshot of Depth Matrix state for this tenant (connectors → fields → features).
    -- Updated when tenant connects more tools; used for "what is unlocked?"
    depth_matrix_snapshot JSONB DEFAULT '{}',
    -- Optional: which connectors are connected (Loader uses this + Depth Matrix)
    connected_connectors TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_spine_config_domains
    ON tenant_spine_config USING GIN (domains);
CREATE INDEX IF NOT EXISTS idx_tenant_spine_config_updated
    ON tenant_spine_config (updated_at DESC);

COMMENT ON TABLE tenant_spine_config IS
    'Per-tenant Spine schema + Depth Matrix. Decided at onboarding; all stages look up by tenant_id to drive behavior.';
