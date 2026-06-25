-- IntegrateWise OS - SaaS Tenant Schema (Phase 1)
-- Comprehensive multi-tenant foundation with billing, RBAC, and feature gating
-- Extends existing tenants table with full SaaS capabilities

-- =====================================================
-- 1. TENANTS (Enhanced from existing basic table)
-- =====================================================
-- Drop and recreate with full schema if needed, or ALTER existing
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'slug') THEN
    ALTER TABLE tenants ADD COLUMN slug TEXT UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'trial_ends_at') THEN
    ALTER TABLE tenants ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'settings') THEN
    ALTER TABLE tenants ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'metadata') THEN
    ALTER TABLE tenants ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'data_region') THEN
    ALTER TABLE tenants ADD COLUMN data_region TEXT DEFAULT 'us-east-1';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'demo_mode') THEN
    ALTER TABLE tenants ADD COLUMN demo_mode BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Ensure plan column supports the right values
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_plan_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_plan_check 
  CHECK (plan IN ('personal', 'team', 'org', 'enterprise'));

-- Ensure status column supports the right values  
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_status_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_status_check 
  CHECK (status IN ('active', 'trial', 'suspended', 'churned'));

-- =====================================================
-- 2. WORKSPACES (Per-tenant isolated spaces)
-- =====================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'production' CHECK (type IN ('production', 'staging', 'development')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON workspaces(type);

-- =====================================================
-- 3. USERS (Tenant-scoped users)
-- =====================================================
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  last_seen_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);
CREATE INDEX IF NOT EXISTS idx_tenant_users_status ON tenant_users(status);

-- =====================================================
-- 4. ROLES (RBAC - Role definitions)
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for system roles
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  inherits_from UUID[], -- Role hierarchy
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_system ON roles(is_system);

-- =====================================================
-- 5. USER ROLES (User-Role assignments)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  scope JSONB DEFAULT '{}'::jsonb, -- { worlds: [], departments: [], accounts: [] }
  granted_by UUID REFERENCES tenant_users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- =====================================================
-- 6. SUBSCRIPTIONS (Stripe integration)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('personal', 'team', 'org', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- 7. TENANT USAGE (Usage tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL, -- ai_sessions, connectors, storage_gb, etc.
  usage_count NUMERIC DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, metric_key, period_start)
);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_lookup ON tenant_usage(tenant_id, metric_key, period_start);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_period ON tenant_usage(period_start DESC);

-- =====================================================
-- 8. FEATURE GATES (Feature flag definitions)
-- =====================================================
CREATE TABLE IF NOT EXISTS feature_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  
  -- Plan gating
  required_plans TEXT[], -- ['team', 'org', 'enterprise']
  
  -- Usage gating
  usage_metric TEXT,
  usage_limit_personal INTEGER,
  usage_limit_team INTEGER,
  usage_limit_org INTEGER,
  usage_limit_enterprise INTEGER,
  usage_period TEXT DEFAULT 'monthly',
  
  -- Role gating
  required_roles TEXT[],
  
  -- Progressive rollout
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  rollout_cohorts TEXT[],
  
  -- Time-based
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  -- Dependencies
  required_features TEXT[],
  
  -- Kill switch
  force_disabled BOOLEAN DEFAULT FALSE,
  
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_gates_key ON feature_gates(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_gates_disabled ON feature_gates(force_disabled);

-- =====================================================
-- 9. SEED DEFAULT ROLES
-- =====================================================
INSERT INTO roles (tenant_id, name, description, permissions, is_system) VALUES
(NULL, 'Admin', 'Full access to all resources', '[
  {"resource": "*", "action": "*", "scope": {}}
]'::jsonb, true),
(NULL, 'Manager', 'Department manager with approval rights', '[
  {"resource": "accounts", "action": "view", "scope": {"departments": ["*"]}},
  {"resource": "accounts", "action": "edit", "scope": {"departments": ["own"]}},
  {"resource": "actions", "action": "approve", "scope": {"departments": ["own"]}}
]'::jsonb, true),
(NULL, 'Member', 'Team member with basic access', '[
  {"resource": "accounts", "action": "view", "scope": {}, "conditions": [{"type": "assigned"}]},
  {"resource": "signals", "action": "view", "scope": {}},
  {"resource": "actions", "action": "create", "scope": {}}
]'::jsonb, true),
(NULL, 'Viewer', 'Read-only access', '[
  {"resource": "*", "action": "view", "scope": {}}
]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. SEED FEATURE GATES
-- =====================================================
INSERT INTO feature_gates (feature_key, required_plans, description) VALUES
('worlds.work', ARRAY['team', 'org', 'enterprise'], 'Access to Work World'),
('worlds.accounts', ARRAY['org', 'enterprise'], 'Access to Accounts World'),
('ai.copilot', ARRAY['org', 'enterprise'], 'AI Copilot assistant'),
('ai.situation_detection', ARRAY['team', 'org', 'enterprise'], 'Automatic situation detection'),
('ai.action_proposals', ARRAY['org', 'enterprise'], 'AI-generated action proposals'),
('governance.workflows', ARRAY['org', 'enterprise'], 'Custom governance workflows'),
('admin.sso', ARRAY['org', 'enterprise'], 'Single Sign-On'),
('admin.custom_roles', ARRAY['org', 'enterprise'], 'Custom role creation'),
('compliance.frameworks', ARRAY['enterprise'], 'Compliance frameworks (SOC2, HIPAA)'),
('api.unlimited', ARRAY['org', 'enterprise'], 'Unlimited API access')
ON CONFLICT (feature_key) DO NOTHING;

-- =====================================================
-- 11. TRIGGERS FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY['workspaces', 'tenant_users', 'roles', 'subscriptions', 'feature_gates'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s 
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- =====================================================
-- 12. COMMENTS
-- =====================================================
COMMENT ON TABLE tenants IS 'Multi-tenant root table with plan, status, and settings';
COMMENT ON TABLE workspaces IS 'Per-tenant isolated workspaces (production/staging/dev)';
COMMENT ON TABLE tenant_users IS 'Users scoped to tenants with status tracking';
COMMENT ON TABLE roles IS 'RBAC role definitions (system and custom)';
COMMENT ON TABLE user_roles IS 'User-role assignments with scope and conditions';
COMMENT ON TABLE subscriptions IS 'Stripe subscription tracking per tenant';
COMMENT ON TABLE tenant_usage IS 'Usage metrics tracking for billing and limits';
COMMENT ON TABLE feature_gates IS 'Feature flag definitions with plan/usage/role gating';
