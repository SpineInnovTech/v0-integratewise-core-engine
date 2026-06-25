-- IntegrateWise OS: Admin Dashboard Tables
-- Creates tables for platform administration, tenant management, and release control

-- ============================================================================
-- PLATFORM STATS (Overview Tab)
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tenant_count INTEGER NOT NULL DEFAULT 0,
  active_tenant_count INTEGER NOT NULL DEFAULT 0,
  active_user_count INTEGER NOT NULL DEFAULT 0,
  ai_event_count INTEGER NOT NULL DEFAULT 0,
  brain_event_count INTEGER NOT NULL DEFAULT 0,
  error_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS platform_stats_date_idx ON platform_stats(date DESC);

-- ============================================================================
-- TENANTS (Tenants Tab)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'free', -- free/starter/pro/team/enterprise
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active/trial/suspended
  country VARCHAR(2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  user_count INTEGER NOT NULL DEFAULT 0,
  lens_mix JSONB, -- { personal: 0.5, business: 0.3, cs: 0.2 }
  ai_events_last_30d INTEGER NOT NULL DEFAULT 0,
  storage_used_mb INTEGER NOT NULL DEFAULT 0,
  risk_score DECIMAL(5, 2), -- 0-100 internal churn/health score
  metadata JSONB,
  UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS tenants_status_idx ON tenants(status);
CREATE INDEX IF NOT EXISTS tenants_plan_idx ON tenants(plan);
CREATE INDEX IF NOT EXISTS tenants_last_active_idx ON tenants(last_active_at DESC);

-- ============================================================================
-- RELEASE BATCHES (Release Control Board)
-- ============================================================================

CREATE TABLE IF NOT EXISTS release_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- backend/frontend/infra/config/flags
  status VARCHAR(50) NOT NULL DEFAULT 'planned', -- planned/in_progress/completed/cancelled
  env VARCHAR(50) NOT NULL, -- dev/staging/prod
  start_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  jira_ticket VARCHAR(255),
  linear_issue VARCHAR(255),
  link TEXT,
  risk_level VARCHAR(50) NOT NULL DEFAULT 'low', -- low/medium/high
  rollback_plan TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS release_batches_status_idx ON release_batches(status);
CREATE INDEX IF NOT EXISTS release_batches_env_idx ON release_batches(env);
CREATE INDEX IF NOT EXISTS release_batches_start_at_idx ON release_batches(start_at DESC);

-- ============================================================================
-- RELEASE CHANGES (Atomic items inside a batch)
-- ============================================================================

CREATE TABLE IF NOT EXISTS release_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES release_batches(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL, -- feature/fix/migration/flag/config
  area VARCHAR(100) NOT NULL, -- os_shell/iq_hub/spine/ai_relay/slack_triage/billing/etc
  summary TEXT NOT NULL,
  breaking BOOLEAN NOT NULL DEFAULT FALSE,
  requires_migration BOOLEAN NOT NULL DEFAULT FALSE,
  requires_support_playbook BOOLEAN NOT NULL DEFAULT FALSE,
  linked_tenants JSONB, -- Array of tenant IDs or segments
  qa_status VARCHAR(50) NOT NULL DEFAULT 'not_required', -- not_required/pending/pass/fail
  owner_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS release_changes_release_id_idx ON release_changes(release_id);
CREATE INDEX IF NOT EXISTS release_changes_area_idx ON release_changes(area);
CREATE INDEX IF NOT EXISTS release_changes_qa_status_idx ON release_changes(qa_status);

-- ============================================================================
-- RELEASE APPROVALS (Who signed off)
-- ============================================================================

CREATE TABLE IF NOT EXISTS release_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES release_batches(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL, -- engineering/product/cs/ops
  decision VARCHAR(50) NOT NULL, -- approved/rejected/waived
  comment TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(release_id, actor_id, role)
);

CREATE INDEX IF NOT EXISTS release_approvals_release_id_idx ON release_approvals(release_id);
CREATE INDEX IF NOT EXISTS release_approvals_actor_id_idx ON release_approvals(actor_id);

-- ============================================================================
-- RELEASE IMPACTS (Tenant/segment impact tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS release_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES release_batches(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  segment VARCHAR(100), -- e.g., "enterprise", "trial", "all"
  impact_type VARCHAR(50) NOT NULL DEFAULT 'none', -- none/possible/certain
  impact_description TEXT,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS release_impacts_release_id_idx ON release_impacts(release_id);
CREATE INDEX IF NOT EXISTS release_impacts_tenant_id_idx ON release_impacts(tenant_id);

-- ============================================================================
-- FEATURE FLAGS (Feature Flags & Rollouts Tab)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'off', -- on/off/gradual
  rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_segment VARCHAR(100) DEFAULT 'all', -- all/internal/selected_tenants
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feature_flags_status_idx ON feature_flags(status);
CREATE INDEX IF NOT EXISTS feature_flags_key_idx ON feature_flags(flag_key);

-- Feature flag allowlist (selected tenants)
CREATE TABLE IF NOT EXISTS feature_flag_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(flag_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS feature_flag_allowlist_flag_id_idx ON feature_flag_allowlist(flag_id);
CREATE INDEX IF NOT EXISTS feature_flag_allowlist_tenant_id_idx ON feature_flag_allowlist(tenant_id);

-- Feature flag change history
CREATE TABLE IF NOT EXISTS feature_flag_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feature_flag_history_flag_id_idx ON feature_flag_history(flag_id);
CREATE INDEX IF NOT EXISTS feature_flag_history_changed_at_idx ON feature_flag_history(changed_at DESC);

-- ============================================================================
-- ADMIN AUDIT LOG (Audit & Security Tab)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_type VARCHAR(50) NOT NULL, -- user/system
  actor_id UUID,
  actor_email VARCHAR(255),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- e.g., USER_IMPERSONATE_START, TENANT_SUSPEND, FLAG_CHANGE, MEMORY_PURGE
  entity_type VARCHAR(100),
  entity_id UUID,
  ip VARCHAR(45),
  user_agent TEXT,
  details_json JSONB,
  risk_level VARCHAR(50) DEFAULT 'low' -- low/medium/high
);

CREATE INDEX IF NOT EXISTS admin_audit_log_timestamp_idx ON admin_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_id_idx ON admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_tenant_id_idx ON admin_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS admin_audit_log_risk_level_idx ON admin_audit_log(risk_level);

-- ============================================================================
-- USAGE & BILLING (Usage & Billing Tab)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  ai_tokens_month INTEGER NOT NULL DEFAULT 0,
  events_month INTEGER NOT NULL DEFAULT 0,
  storage_mb INTEGER NOT NULL DEFAULT 0,
  overage_flags JSONB, -- Array of overage types
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, period_start)
);

CREATE INDEX IF NOT EXISTS usage_metrics_tenant_id_idx ON usage_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS usage_metrics_period_start_idx ON usage_metrics(period_start DESC);

-- ============================================================================
-- INTEGRATIONS & WEBHOOKS HEALTH (Integrations & Webhooks Tab)
-- ============================================================================

CREATE TABLE IF NOT EXISTS connector_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id VARCHAR(100) NOT NULL, -- slack, hubspot, notion, etc.
  connector_name VARCHAR(255) NOT NULL,
  tenant_count INTEGER NOT NULL DEFAULT 0,
  active_connections INTEGER NOT NULL DEFAULT 0,
  error_rate_24h DECIMAL(5, 4) NOT NULL DEFAULT 0.0,
  last_outage_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(connector_id)
);

CREATE INDEX IF NOT EXISTS connector_health_connector_id_idx ON connector_health(connector_id);
CREATE INDEX IF NOT EXISTS connector_health_error_rate_idx ON connector_health(error_rate_24h DESC);

CREATE TABLE IF NOT EXISTS webhook_endpoint_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL, -- /api/relay/intake, /api/webhooks/slack, etc.
  requests_1h INTEGER NOT NULL DEFAULT 0,
  errors_1h INTEGER NOT NULL DEFAULT 0,
  p95_latency_ms INTEGER NOT NULL DEFAULT 0,
  last_error_message TEXT,
  rate_limit_seen BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(endpoint)
);

CREATE INDEX IF NOT EXISTS webhook_endpoint_health_endpoint_idx ON webhook_endpoint_health(endpoint);
CREATE INDEX IF NOT EXISTS webhook_endpoint_health_errors_idx ON webhook_endpoint_health(errors_1h DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE platform_stats IS 'Daily aggregated platform statistics for admin overview';
COMMENT ON TABLE tenants IS 'Tenant/workspace information for admin management';
COMMENT ON TABLE release_batches IS 'Release deployment batches for release control board';
COMMENT ON TABLE release_changes IS 'Atomic changes within a release batch';
COMMENT ON TABLE release_approvals IS 'Approval records for releases';
COMMENT ON TABLE release_impacts IS 'Tenant/segment impact tracking for releases';
COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollouts';
COMMENT ON TABLE feature_flag_allowlist IS 'Tenant allowlist for feature flags';
COMMENT ON TABLE feature_flag_history IS 'Change history for feature flags';
COMMENT ON TABLE admin_audit_log IS 'Comprehensive audit log for all admin actions';
COMMENT ON TABLE usage_metrics IS 'Usage metrics per tenant for billing';
COMMENT ON TABLE connector_health IS 'Health metrics for connectors/integrations';
COMMENT ON TABLE webhook_endpoint_health IS 'Health metrics for webhook endpoints';
