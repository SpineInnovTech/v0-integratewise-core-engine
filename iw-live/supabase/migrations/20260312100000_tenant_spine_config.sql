-- =============================================================================
-- Tenant Spine config (051 + 054). Required by 20260312200000 and later.
-- Per-tenant Spine schema + Depth Matrix; industry/departments for 12×11.
-- =============================================================================

CREATE TABLE IF NOT EXISTS tenant_spine_config (
    tenant_id             TEXT NOT NULL PRIMARY KEY,
    domains               TEXT[] NOT NULL DEFAULT '{}',
    active_ctx            TEXT,
    org_type              TEXT,
    schema_version        TEXT NOT NULL DEFAULT '1',
    depth_matrix_snapshot JSONB DEFAULT '{}',
    connected_connectors  TEXT[] DEFAULT '{}',
    industry              TEXT,
    company_size          TEXT,
    user_type             TEXT,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_spine_config_domains
    ON tenant_spine_config USING GIN (domains);
CREATE INDEX IF NOT EXISTS idx_tenant_spine_config_updated
    ON tenant_spine_config (updated_at DESC);

COMMENT ON TABLE tenant_spine_config IS
    'Per-tenant Spine schema + Depth Matrix. Decided at onboarding; all stages look up by tenant_id.';
COMMENT ON COLUMN tenant_spine_config.domains IS
    'Departments (functional areas). e.g. [SALES, CUSTOMER_SUCCESS, FINANCE].';
COMMENT ON COLUMN tenant_spine_config.industry IS
    'Industry vertical (e.g. SAAS_TECH, HEALTHCARE). Composes with departments for spine shape.';
COMMENT ON COLUMN tenant_spine_config.company_size IS
    'Company size tier (e.g. 51-200, enterprise).';
COMMENT ON COLUMN tenant_spine_config.user_type IS
    'User type: personal | work | business | executive.';
