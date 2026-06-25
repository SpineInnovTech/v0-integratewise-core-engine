-- =============================================================================
-- Seed tenant_spine_config for IntegrateWise workspaces (same spine for both)
-- integratewise-business: manage IntegrateWise business (dogfooding)
-- integratewise-ai-workspace-temp: IntegrateWise AI Workspace (treasure — explore)
-- Same level of detail: CUSTOMER_SUCCESS, SALES, REVOPS, etc.; industry SAAS_TECH
-- =============================================================================

INSERT INTO tenant_spine_config (
    tenant_id,
    domains,
    active_ctx,
    org_type,
    schema_version,
    depth_matrix_snapshot,
    connected_connectors,
    industry,
    company_size,
    user_type,
    updated_at
) VALUES
(
    'integratewise-business',
    ARRAY['CUSTOMER_SUCCESS', 'SALES', 'REVOPS', 'MARKETING', 'FINANCE', 'SUPPORT', 'ENGINEERING', 'PRODUCT', 'LEGAL', 'HR', 'SUPPLY_CHAIN', 'SERVICE_OPS'],
    'CTX_CS',
    'business',
    '1',
    '{"domains": ["CUSTOMER_SUCCESS", "SALES", "REVOPS"], "version": 2}'::jsonb,
    ARRAY[]::TEXT[],
    'SAAS_TECH',
    'startup',
    'business',
    now()
),
(
    'integratewise-ai-workspace-temp',
    ARRAY['CUSTOMER_SUCCESS', 'SALES', 'REVOPS', 'MARKETING', 'FINANCE', 'SUPPORT', 'ENGINEERING', 'PRODUCT', 'LEGAL', 'HR', 'SUPPLY_CHAIN', 'SERVICE_OPS'],
    'CTX_CS',
    'business',
    '1',
    '{"domains": ["CUSTOMER_SUCCESS", "SALES", "REVOPS"], "version": 2}'::jsonb,
    ARRAY[]::TEXT[],
    'SAAS_TECH',
    'startup',
    'business',
    now()
)
ON CONFLICT (tenant_id) DO UPDATE SET
    domains = EXCLUDED.domains,
    active_ctx = EXCLUDED.active_ctx,
    org_type = EXCLUDED.org_type,
    schema_version = EXCLUDED.schema_version,
    depth_matrix_snapshot = EXCLUDED.depth_matrix_snapshot,
    industry = EXCLUDED.industry,
    company_size = EXCLUDED.company_size,
    user_type = EXCLUDED.user_type,
    updated_at = now();

COMMENT ON TABLE tenant_spine_config IS
    'Per-tenant Spine schema + Depth Matrix. Seeded: integratewise-business, integratewise-ai-workspace-temp (same spine).';
