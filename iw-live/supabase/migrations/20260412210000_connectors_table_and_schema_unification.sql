-- Migration 079: Create connectors table + Unify schema config onto tenant_spine_config
--
-- FIXES TWO CRITICAL GAPS:
-- 1. The `connectors` table (Schema A) was never applied to production.
--    Without it, OAuth token storage and connector state tracking fail.
-- 2. The `tenant_schema_configs` table was never created. Three services
--    (loader, connector-sync, connector) query it but it doesn't exist.
--    Instead of creating it, we CONVERGE onto `tenant_spine_config` (which
--    already exists) by adding the missing columns.
--
-- ARCHITECTURAL RULE (post-migration):
--   tenant_spine_config = SSOT for tenant schema
--     - domains, industry, org_type, schema_version (existing)
--     - allowed_entity_types (NEW) — materialized from domains+industry via getSpineConfig()
--     - connector_configs (NEW) — per-connector settings (provider, flow, entities)
--   connectors = OAuth token storage + connector state
--     - One row per tenant+user+provider+workspace
--     - Tokens encrypted with AES-256-GCM (TOKEN_ENCRYPTION_KEY)
--
-- The old `tenant_schema_configs` table is NOT created. All references in code
-- will be updated to use `tenant_spine_config` instead.
--

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: Create connectors table (Schema A — production design)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID,
  provider VARCHAR(50) NOT NULL,

  -- Connection status
  status VARCHAR(20) DEFAULT 'pending_auth'
    CHECK (status IN (
      'pending_auth',
      'connected',
      'initializing',
      'syncing_creamy',
      'healthy',
      'syncing_delta',
      'syncing_full',
      'degraded',
      'reauth_required',
      'paused',
      'failed',
      -- Legacy values (still accepted for backward compat)
      'disconnected',
      'error',
      'pending'
    )),

  -- OAuth tokens (encrypted with AES-256-GCM in production)
  access_token TEXT,
  refresh_token TEXT,
  token_type VARCHAR(50),
  expires_at TIMESTAMPTZ,

  -- Provider-specific identifiers
  provider_user_id TEXT,
  provider_workspace_id TEXT,
  provider_workspace_name TEXT,

  -- Metadata
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',

  -- Sync settings
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Multi-org unique constraint: one connector per tenant+user+provider+workspace
  CONSTRAINT connectors_tenant_user_provider_workspace_key
    UNIQUE (tenant_id, user_id, provider, provider_workspace_id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_connectors_user ON connectors(user_id);
CREATE INDEX IF NOT EXISTS idx_connectors_tenant ON connectors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connectors_provider ON connectors(provider);
CREATE INDEX IF NOT EXISTS idx_connectors_status ON connectors(status);
CREATE INDEX IF NOT EXISTS idx_connectors_tenant_status ON connectors(tenant_id, status)
  WHERE status IN ('connected', 'healthy', 'syncing_creamy', 'syncing_delta', 'syncing_full');

-- Enable RLS
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own connectors" ON connectors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connectors" ON connectors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connectors" ON connectors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connectors" ON connectors
  FOR DELETE USING (auth.uid() = user_id);

-- Service-role policy for backend workers (tenants service, loader, connector-sync)
CREATE POLICY "Service role full access on connectors" ON connectors
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_connectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS connectors_updated_at ON connectors;
CREATE TRIGGER connectors_updated_at
  BEFORE UPDATE ON connectors
  FOR EACH ROW
  EXECUTE FUNCTION update_connectors_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: Extend tenant_spine_config with connector pipeline columns
-- ═══════════════════════════════════════════════════════════════════════════════

-- allowed_entity_types: Materialized entity type list.
-- Written at onboarding time from getSpineConfig(industry, department) + connector entity types.
-- Read by loader + connector-sync for schema-driven extraction.
ALTER TABLE tenant_spine_config
  ADD COLUMN IF NOT EXISTS allowed_entity_types TEXT[] DEFAULT '{}';

-- connector_configs: Per-connector settings.
-- Shape: { "hubspot": { "entityTypes": ["contact","account","deal"], "flowType": "A", "enabled": true }, ... }
-- Written by initialize-spine. Read by loader + connector-sync.
ALTER TABLE tenant_spine_config
  ADD COLUMN IF NOT EXISTS connector_configs JSONB DEFAULT '{}';

COMMENT ON COLUMN tenant_spine_config.allowed_entity_types IS
  'Materialized entity type allowlist. Union of all domain entity types + connector entity types. '
  'Schema SSOT — if a type is not here, it does not get extracted, normalized, or stored.';

COMMENT ON COLUMN tenant_spine_config.connector_configs IS
  'Per-connector settings: { provider: { entityTypes[], flowType, enabled } }. '
  'Written by initialize-spine, read by loader and connector-sync.';


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 3: Add quarantine table for pipeline rejects
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pipeline_quarantine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  entity_type TEXT,
  source_id TEXT,
  stage TEXT NOT NULL,           -- which pipeline stage rejected it (S3, S6, S7, etc.)
  reason_code TEXT NOT NULL,     -- 'schema_filtered', 'validation_failed', 'sanity_low_score', etc.
  reason_detail TEXT,            -- human-readable explanation
  payload JSONB NOT NULL,        -- the original record
  metadata JSONB DEFAULT '{}',   -- trace_id, job_id, attempt, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT                -- 'discarded', 'reprocessed', 'manual_fix'
);

CREATE INDEX IF NOT EXISTS idx_quarantine_tenant ON pipeline_quarantine(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quarantine_stage ON pipeline_quarantine(stage);
CREATE INDEX IF NOT EXISTS idx_quarantine_reason ON pipeline_quarantine(reason_code);
CREATE INDEX IF NOT EXISTS idx_quarantine_created ON pipeline_quarantine(created_at DESC);

ALTER TABLE pipeline_quarantine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on quarantine" ON pipeline_quarantine
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE pipeline_quarantine IS
  'Records rejected by the 8-stage pipeline. Never silently dropped — always quarantined with reason.';


-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 4: Add sync_checkpoints table for durable cursor tracking
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  
  -- Cursor state
  cursor_value TEXT,              -- provider-specific cursor (page token, offset, etc.)
  source_updated_at TIMESTAMPTZ,  -- latest source record timestamp seen
  
  -- Sync metadata
  phase TEXT NOT NULL DEFAULT 'delta'
    CHECK (phase IN ('creamy', 'full', 'delta')),
  records_processed INT DEFAULT 0,
  records_written INT DEFAULT 0,
  records_quarantined INT DEFAULT 0,
  
  -- Job tracking
  job_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'failed', 'partial')),
  error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One active checkpoint per tenant+provider+entity_type+phase
  CONSTRAINT sync_checkpoints_unique_active
    UNIQUE (tenant_id, provider, entity_type, phase)
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_tenant ON sync_checkpoints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_status ON sync_checkpoints(status);

ALTER TABLE sync_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on checkpoints" ON sync_checkpoints
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE sync_checkpoints IS
  'Durable cursor checkpoints for long-running syncs (24-48h full syncs). '
  'Enables recovery after worker restart without re-fetching everything.';

COMMIT;
