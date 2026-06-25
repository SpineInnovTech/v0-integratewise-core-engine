-- Migration: 0004_customer_zero
-- Enable Customer Zero tenant, founder users, twin session tables, awareness columns.

-- Extend tenant_users for L2/L3 provisioning (SQLite: ignore if column exists on re-run via fresh DB)
ALTER TABLE tenant_users ADD COLUMN department TEXT DEFAULT 'bizops';
ALTER TABLE tenant_users ADD COLUMN awareness_profile_id TEXT;
ALTER TABLE tenant_users ADD COLUMN plan TEXT;

CREATE TABLE IF NOT EXISTS twin_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  context_key TEXT NOT NULL,
  source TEXT NOT NULL,
  domain TEXT NOT NULL,
  entity_id TEXT,
  entity_type TEXT,
  entity_name TEXT,
  insight_id TEXT,
  insight_title TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  opened_at TEXT,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_twin_sessions_tenant ON twin_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_twin_sessions_user ON twin_sessions(user_id);

CREATE TABLE IF NOT EXISTS twin_audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_twin_audit_tenant ON twin_audit_events(tenant_id);

CREATE TABLE IF NOT EXISTS awareness_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  signal_threshold REAL NOT NULL,
  signal_entitlements TEXT NOT NULL,
  panel_entitlements TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Customer Zero tenant (enterprise, all layers, promoted)
INSERT OR IGNORE INTO tenants (
  id, name, slug, plan, status, settings, metadata, created_at, updated_at
) VALUES (
  'iw-customer-zero',
  'IntegrateWise (Customer Zero)',
  'iw-customer-zero',
  'enterprise',
  'active',
  '{"customer_zero":true,"promoted":true,"twin_enabled":true,"all_layers":true,"mcp_external":true}',
  '{"owner":"nirmal@integratewise.ai","description":"IW operating on IW — founder dogfood"}',
  datetime('now'),
  datetime('now')
);

-- Default workspace
INSERT OR IGNORE INTO workspaces (id, tenant_id, name, type, settings, created_at, updated_at)
VALUES (
  'ws-iw-customer-zero',
  'iw-customer-zero',
  'Customer Zero',
  'production',
  '{}',
  datetime('now'),
  datetime('now')
);

-- Founder awareness profile (weak-signal threshold 0.65)
INSERT OR IGNORE INTO awareness_profiles (
  id, tenant_id, role, department, signal_threshold, signal_entitlements, panel_entitlements, created_at, updated_at
) VALUES (
  'awareness-cz-founder',
  'iw-customer-zero',
  'founder',
  'bizops',
  0.65,
  '["renewal_risk","health_drop","deal_stalled","pipeline_risk","revenue_risk","strategic_escalation","escalation","engagement_drop"]',
  '["spine","context"]',
  datetime('now'),
  datetime('now')
);

-- Founder users
INSERT OR IGNORE INTO tenant_users (
  id, tenant_id, email, name, role, status, department, awareness_profile_id, plan, metadata, created_at, updated_at
) VALUES
  (
    'user-nirmal-cz',
    'iw-customer-zero',
    'nirmal@integratewise.ai',
    'Nirmal Prince',
    'owner',
    'active',
    'bizops',
    'awareness-cz-founder',
    'enterprise',
    '{"customer_zero":true,"founder":true}',
    datetime('now'),
    datetime('now')
  ),
  (
    'user-connect-cz',
    'iw-customer-zero',
    'connect@integratewise.ai',
    'IntegrateWise Connect',
    'owner',
    'active',
    'bizops',
    'awareness-cz-founder',
    'enterprise',
    '{"customer_zero":true}',
    datetime('now'),
    datetime('now')
  );

-- Spine config: all domains for founder dogfood
INSERT OR IGNORE INTO tenant_spine_config (
  tenant_id, domains, industry, schema_version, allowed_entity_types, connector_configs,
  connected_connectors, subscription_tier, created_at, updated_at
) VALUES (
  'iw-customer-zero',
  '["BIZOPS","CUSTOMER_SUCCESS","SALES","PERSONAL"]',
  'SaaS',
  'v1',
  '[]',
  '{}',
  '[]',
  'enterprise',
  datetime('now'),
  datetime('now')
);