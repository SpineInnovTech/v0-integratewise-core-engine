-- AI Loader Two-Stage Architecture Schema
-- Stage 1: Creamy Layer (60-second preview)
-- Stage 2: Full Implementation (background processing)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- INPUT SOURCE CANONICAL
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE input_source_type AS ENUM (
  'file_upload',
  'folder_upload',
  'email_export',
  'api_connect',
  'clipboard_paste',
  'url_import',
  'database_connect'
);

CREATE TYPE input_source_status AS ENUM (
  'pending',
  'validating',
  'stage1_running',
  'stage1_complete',
  'stage1_failed',
  'awaiting_review',
  'stage2_queued',
  'stage2_running',
  'stage2_complete',
  'stage2_failed',
  'cancelled',
  'expired'
);

CREATE TABLE IF NOT EXISTS input_sources (
  input_source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Source Type
  source_type input_source_type NOT NULL,
  source_name TEXT NOT NULL CHECK (length(source_name) <= 500),
  source_uri TEXT CHECK (length(source_uri) <= 2000),
  source_metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Processing Status
  status input_source_status DEFAULT 'pending',
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  stage1_started_at TIMESTAMPTZ,
  stage1_completed_at TIMESTAMPTZ,
  stage2_started_at TIMESTAMPTZ,
  stage2_completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Error Handling
  error_code VARCHAR(50),
  error_message TEXT,
  
  -- Stats
  stats JSONB DEFAULT '{}'::JSONB,
  
  -- Foreign Keys
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_input_sources_workspace_status ON input_sources(workspace_id, status);
CREATE INDEX idx_input_sources_user_submitted ON input_sources(user_id, submitted_at);
CREATE INDEX idx_input_sources_status_submitted ON input_sources(status, submitted_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CREAMY EXTRACT CANONICAL
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE llm_provider_type AS ENUM ('openai', 'anthropic', 'deepseek', 'local');

CREATE TABLE IF NOT EXISTS creamy_extracts (
  creamy_extract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_source_id UUID NOT NULL UNIQUE,
  workspace_id UUID NOT NULL,
  
  -- Processing Metadata
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  extraction_time_ms INTEGER,
  extraction_version VARCHAR(50) DEFAULT 'v1.0.0',
  
  -- LLM Usage
  llm_provider llm_provider_type,
  llm_model VARCHAR(100),
  llm_tokens_used INTEGER,
  llm_cost_usd NUMERIC(10, 6),
  
  -- Source Analysis
  source_summary JSONB DEFAULT '{}'::JSONB,
  
  -- Extracted Entities (Preview)
  entities_preview JSONB DEFAULT '{}'::JSONB,
  
  -- Extracted Tasks (Preview)
  tasks_preview JSONB DEFAULT '{}'::JSONB,
  
  -- Key Threads
  threads_preview JSONB DEFAULT '{}'::JSONB,
  
  -- Highlights
  highlights JSONB DEFAULT '{}'::JSONB,
  
  -- Provenance
  provenance JSONB DEFAULT '{}'::JSONB,
  
  -- User Feedback
  user_review JSONB DEFAULT '{}'::JSONB,
  
  -- Stage 2 Configuration
  stage2_config JSONB DEFAULT '{}'::JSONB,
  
  -- Foreign Keys
  FOREIGN KEY (input_source_id) REFERENCES input_sources(input_source_id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_creamy_extracts_input_source ON creamy_extracts(input_source_id);
CREATE INDEX idx_creamy_extracts_workspace_extracted ON creamy_extracts(workspace_id, extracted_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- EXTRACTION JOB CANONICAL
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE extraction_job_type AS ENUM ('initial', 'incremental', 'full_resync', 'scheduled');
CREATE TYPE extraction_job_status AS ENUM (
  'queued',
  'initializing',
  'extracting',
  'mapping_identities',
  'applying_governance',
  'rendering',
  'syncing_byot',
  'completed',
  'failed',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS extraction_jobs (
  extraction_job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_source_id UUID NOT NULL,
  creamy_extract_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  
  -- Job Type
  job_type extraction_job_type DEFAULT 'initial',
  
  -- Configuration
  extraction_config JSONB DEFAULT '{}'::JSONB,
  
  -- Status
  status extraction_job_status DEFAULT 'queued',
  
  -- Progress Tracking
  progress JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Results
  results JSONB DEFAULT '{}'::JSONB,
  
  -- Error Info
  errors JSONB DEFAULT '[]'::JSONB,
  
  -- Scheduling
  schedule JSONB DEFAULT '{}'::JSONB,
  
  -- Foreign Keys
  FOREIGN KEY (input_source_id) REFERENCES input_sources(input_source_id) ON DELETE CASCADE,
  FOREIGN KEY (creamy_extract_id) REFERENCES creamy_extracts(creamy_extract_id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_extraction_jobs_workspace_status ON extraction_jobs(workspace_id, status);
CREATE INDEX idx_extraction_jobs_input_source ON extraction_jobs(input_source_id);
CREATE INDEX idx_extraction_jobs_status_queued ON extraction_jobs(status, queued_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- IDENTITY MAP CANONICAL
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE entity_type AS ENUM ('account', 'contact', 'deal', 'task', 'event', 'note');
CREATE TYPE mapping_action_type AS ENUM (
  'created_new',
  'matched_exact',
  'matched_fuzzy',
  'merged',
  'skipped',
  'pending_review'
);
CREATE TYPE review_decision_type AS ENUM ('approved', 'rejected', 'merged_manual', 'created_new');

CREATE TABLE IF NOT EXISTS identity_maps (
  identity_map_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_job_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  
  -- Source (Extracted)
  source_entity_type entity_type NOT NULL,
  source_entity_data JSONB NOT NULL,
  source_signature TEXT NOT NULL,
  
  -- Target (Canonical)
  target_spine_type VARCHAR(100),
  target_spine_id VARCHAR(255),
  
  -- Mapping Details
  mapping_action mapping_action_type DEFAULT 'pending_review',
  confidence NUMERIC(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  match_details JSONB DEFAULT '{}'::JSONB,
  
  -- Review
  requires_review BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  review_decision review_decision_type,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  FOREIGN KEY (extraction_job_id) REFERENCES extraction_jobs(extraction_job_id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_identity_maps_extraction_job ON identity_maps(extraction_job_id);
CREATE INDEX idx_identity_maps_workspace_spine ON identity_maps(workspace_id, target_spine_id);
CREATE INDEX idx_identity_maps_source_signature ON identity_maps(source_signature);
CREATE INDEX idx_identity_maps_requires_review ON identity_maps(requires_review, workspace_id) WHERE requires_review = true;

-- ═══════════════════════════════════════════════════════════════════════════════
-- GOVERNANCE RULE CANONICAL
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE governance_rule_type AS ENUM (
  'pii_detection',
  'data_quality',
  'field_validation',
  'entity_validation',
  'keyword_filter',
  'pattern_match'
);
CREATE TYPE governance_action_type AS ENUM (
  'allow',
  'redact',
  'mask',
  'flag',
  'reject',
  'transform',
  'notify'
);
CREATE TYPE governance_rule_status AS ENUM ('draft', 'active', 'deprecated');

CREATE TABLE IF NOT EXISTS governance_rules (
  governance_rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  
  -- Rule Definition
  rule_name VARCHAR(255) NOT NULL,
  rule_type governance_rule_type NOT NULL,
  entity_types JSONB DEFAULT '[]'::JSONB,
  
  -- Rule Logic
  rule_config JSONB NOT NULL,
  
  -- Action on Match
  action governance_action_type NOT NULL,
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  status governance_rule_status DEFAULT 'active',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_governance_rules_workspace_enabled ON governance_rules(workspace_id, enabled) WHERE enabled = true;
CREATE INDEX idx_governance_rules_priority ON governance_rules(priority, enabled) WHERE enabled = true;

-- Insert system default rules
INSERT INTO governance_rules (workspace_id, rule_name, rule_type, entity_types, rule_config, action, priority, status)
VALUES
  (NULL, 'PII - Social Security Number', 'pii_detection', '["contact", "account"]', 
   '{"patterns": [{"type": "ssn", "regex": "\\d{3}-\\d{2}-\\d{4}"}]}', 'redact', 10, 'active'),
  (NULL, 'PII - Credit Card', 'pii_detection', '["contact", "account"]',
   '{"patterns": [{"type": "credit_card", "regex": "\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}"}]}', 'redact', 10, 'active'),
  (NULL, 'Quality - Contact Email Required', 'field_validation', '["contact"]',
   '{"entity": "contact", "field": "email", "validation": {"type": "required"}}', 'flag', 50, 'active'),
  (NULL, 'Quality - Account Name Required', 'field_validation', '["account"]',
   '{"entity": "account", "field": "account_name", "validation": {"type": "required", "min_length": 2}}', 'reject', 50, 'active')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BYOT TEMPLATE CANONICAL
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE product_type AS ENUM ('os', 'cs', 'business');
CREATE TYPE tier_type AS ENUM ('starter', 'growth', 'scale', 'enterprise');
CREATE TYPE platform_type AS ENUM ('notion', 'coda', 'airtable', 'sheets', 'monday', 'api');
CREATE TYPE template_status_type AS ENUM ('draft', 'active', 'deprecated');

CREATE TABLE IF NOT EXISTS byot_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  
  -- Template Identity
  template_name VARCHAR(255) NOT NULL,
  template_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Template Type
  product product_type NOT NULL,
  tier tier_type NOT NULL,
  platform platform_type NOT NULL,
  
  -- Schema Definition
  schema JSONB NOT NULL,
  
  -- Relations
  relations JSONB DEFAULT '[]'::JSONB,
  
  -- Views
  views JSONB DEFAULT '[]'::JSONB,
  
  -- Version
  version VARCHAR(50) DEFAULT '1.0.0',
  
  -- Status
  status template_status_type DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_byot_templates_code ON byot_templates(template_code);
CREATE INDEX idx_byot_templates_product_tier_platform ON byot_templates(product, tier, platform);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SYNC SCHEDULE CANONICAL
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE schedule_type AS ENUM ('manual', 'hourly', 'daily', 'weekly', 'monthly');
CREATE TYPE sync_status_type AS ENUM ('success', 'partial', 'failed', 'skipped');
CREATE TYPE membership_tier_type AS ENUM ('free', 'starter', 'growth', 'scale', 'enterprise');

CREATE TABLE IF NOT EXISTS sync_schedules (
  sync_schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  connector_id UUID NOT NULL,
  
  -- Schedule Configuration
  schedule_type schedule_type DEFAULT 'manual',
  schedule_time TIME,
  schedule_day INTEGER CHECK (schedule_day >= 0 AND schedule_day <= 31),
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Sync Settings
  sync_config JSONB DEFAULT '{}'::JSONB,
  
  -- Membership Limits
  membership_tier membership_tier_type DEFAULT 'free',
  allowed_frequencies JSONB DEFAULT '[]'::JSONB,
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  
  -- Execution Tracking
  last_run_at TIMESTAMPTZ,
  last_run_status sync_status_type,
  last_run_job_id UUID,
  next_run_at TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  max_consecutive_failures INTEGER DEFAULT 3,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Keys
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
  -- Note: connector_id references connectors table (to be created)
);

CREATE INDEX idx_sync_schedules_workspace_enabled ON sync_schedules(workspace_id, enabled) WHERE enabled = true;
CREATE INDEX idx_sync_schedules_next_run ON sync_schedules(next_run_at, enabled) WHERE enabled = true AND next_run_at IS NOT NULL;
CREATE INDEX idx_sync_schedules_connector ON sync_schedules(connector_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CONNECTOR CANONICAL (for API connections)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE connector_type AS ENUM ('gmail', 'slack', 'notion', 'hubspot', 'asana', 'discord', 'sheets', 'custom');
CREATE TYPE connector_status_type AS ENUM ('active', 'paused', 'error', 'disconnected');

CREATE TABLE IF NOT EXISTS connectors (
  connector_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  
  -- Connector Identity
  connector_type connector_type NOT NULL,
  connector_name VARCHAR(255) NOT NULL,
  
  -- Authentication
  auth_config JSONB NOT NULL,
  
  -- Status
  status connector_status_type DEFAULT 'active',
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  
  -- Foreign Keys
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_connectors_workspace_status ON connectors(workspace_id, status);
CREATE INDEX idx_connectors_type ON connectors(connector_type);

-- Add foreign key constraint for sync_schedules
ALTER TABLE sync_schedules
ADD CONSTRAINT fk_sync_schedules_connector
FOREIGN KEY (connector_id) REFERENCES connectors(connector_id) ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_governance_rules_updated_at BEFORE UPDATE ON governance_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_byot_templates_updated_at BEFORE UPDATE ON byot_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_schedules_updated_at BEFORE UPDATE ON sync_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connectors_updated_at BEFORE UPDATE ON connectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to set expires_at for creamy extracts (24 hours after stage1 complete)
CREATE OR REPLACE FUNCTION set_creamy_extract_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage1_completed_at IS NOT NULL AND OLD.stage1_completed_at IS NULL THEN
    UPDATE input_sources
    SET expires_at = NEW.stage1_completed_at + INTERVAL '24 hours'
    WHERE input_source_id = NEW.input_source_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_input_source_expires_at AFTER UPDATE ON input_sources
  FOR EACH ROW EXECUTE FUNCTION set_creamy_extract_expires_at();
