-- Migration: Onboarding and Schema Configuration Tables
-- Clean Architecture Implementation

-- Tenant Onboarding State
-- Tracks onboarding progress through the 6-step flow
CREATE TABLE IF NOT EXISTS tenant_onboarding_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  current_step TEXT NOT NULL,
  completed_steps TEXT[] DEFAULT '{}',
  connectors_config JSONB DEFAULT '[]',
  creamy_job_id TEXT,
  normalizer_job_id TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id)
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_tenant_id 
  ON tenant_onboarding_state(tenant_id);

-- Sync Jobs
-- Tracks background sync jobs for Creamy, Needed, and Delta phases
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector TEXT NOT NULL,
  flow_type TEXT NOT NULL CHECK (flow_type IN ('A', 'B', 'C')),
  phase TEXT NOT NULL CHECK (phase IN ('creamy', 'needed', 'delta')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress JSONB DEFAULT '{}',
  payload JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

-- Indexes for sync jobs
CREATE INDEX IF NOT EXISTS idx_sync_jobs_tenant_id 
  ON sync_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status 
  ON sync_jobs(status) 
  WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_sync_jobs_connector 
  ON sync_jobs(tenant_id, connector);

-- Tenant Schema Configuration
-- Stores the schema configuration for each tenant
CREATE TABLE IF NOT EXISTS tenant_schema_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  industry TEXT,
  department TEXT,
  allowed_entity_types TEXT[] DEFAULT '{}',
  connector_configs JSONB DEFAULT '{}',
  depth_matrix JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_tenant_schema_configs_tenant_id 
  ON tenant_schema_configs(tenant_id);

-- Update tenant_profiles to track onboarding completion
ALTER TABLE tenant_profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- RLS Policies

-- Enable RLS
ALTER TABLE tenant_onboarding_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_schema_configs ENABLE ROW LEVEL SECURITY;

-- Tenant Onboarding State Policies
CREATE POLICY tenant_onboarding_state_select_policy 
  ON tenant_onboarding_state 
  FOR SELECT 
  USING (tenant_id = auth.uid());

CREATE POLICY tenant_onboarding_state_insert_policy 
  ON tenant_onboarding_state 
  FOR INSERT 
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY tenant_onboarding_state_update_policy 
  ON tenant_onboarding_state 
  FOR UPDATE 
  USING (tenant_id = auth.uid());

-- Sync Jobs Policies
CREATE POLICY sync_jobs_select_policy 
  ON sync_jobs 
  FOR SELECT 
  USING (tenant_id = auth.uid());

CREATE POLICY sync_jobs_insert_policy 
  ON sync_jobs 
  FOR INSERT 
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY sync_jobs_update_policy 
  ON sync_jobs 
  FOR UPDATE 
  USING (tenant_id = auth.uid());

-- Tenant Schema Configs Policies
CREATE POLICY tenant_schema_configs_select_policy 
  ON tenant_schema_configs 
  FOR SELECT 
  USING (tenant_id = auth.uid());

CREATE POLICY tenant_schema_configs_insert_policy 
  ON tenant_schema_configs 
  FOR INSERT 
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY tenant_schema_configs_update_policy 
  ON tenant_schema_configs 
  FOR UPDATE 
  USING (tenant_id = auth.uid());

-- Functions

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_tenant_onboarding_state_updated_at
  BEFORE UPDATE ON tenant_onboarding_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_schema_configs_updated_at
  BEFORE UPDATE ON tenant_schema_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE tenant_onboarding_state IS 'Tracks onboarding progress through the 6-step flow';
COMMENT ON TABLE sync_jobs IS 'Tracks background sync jobs for Creamy, Needed, and Delta phases';
COMMENT ON TABLE tenant_schema_configs IS 'Stores the schema configuration for each tenant';
