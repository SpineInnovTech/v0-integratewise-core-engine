-- =============================================================================
-- 054_tenant_spine_config_industry_columns.sql
-- Departments × Industries model: add industry, company_size, user_type.
-- domains[] is interpreted as departments (e.g. SALES, CUSTOMER_SUCCESS).
-- =============================================================================

-- Add industry (vertical) and workspace-model columns
ALTER TABLE tenant_spine_config
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT,
  ADD COLUMN IF NOT EXISTS user_type TEXT;

COMMENT ON COLUMN tenant_spine_config.industry IS
  'Industry vertical (e.g. SAAS_TECH, HEALTHCARE). Composes with departments for spine shape.';
COMMENT ON COLUMN tenant_spine_config.company_size IS
  'Company size tier (e.g. 51-200, enterprise). Drives connector suggestions.';
COMMENT ON COLUMN tenant_spine_config.user_type IS
  'User type: personal | work | business | executive. Determines workspace model.';
COMMENT ON COLUMN tenant_spine_config.domains IS
  'Departments (functional areas). e.g. [SALES, CUSTOMER_SUCCESS, FINANCE].';
