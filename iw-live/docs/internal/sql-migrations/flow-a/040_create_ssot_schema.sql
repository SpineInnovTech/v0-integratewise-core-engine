-- IntegrateWise SSOT Schema (Atlas Spine)
-- Multi-tenant foundation with organizations, workspaces, and RBAC

-- =====================================================
-- ORGANIZATIONS (Multi-tenant root)
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT organizations_name_unique UNIQUE (name)
);

-- =====================================================
-- WORKSPACES (Per-org isolated spaces)
-- =====================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT workspaces_org_name_unique UNIQUE (org_id, name)
);

-- =====================================================
-- USER ROLES (RBAC)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, org_id)
);

-- =====================================================
-- ONBOARDING STATE (Per-user per-org)
-- =====================================================
CREATE TABLE IF NOT EXISTS onboarding_state (
  user_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  step TEXT DEFAULT 'welcome',
  completed BOOLEAN DEFAULT false,
  persona TEXT,
  selected_tools TEXT[],
  workspace_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, org_id)
);

-- =====================================================
-- ACCOUNTS (Canonical SSOT for external entities)
-- =====================================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('customer', 'prospect', 'partner', 'vendor')),
  status TEXT DEFAULT 'active',
  domain TEXT,
  industry TEXT,
  size TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT accounts_org_name_unique UNIQUE (org_id, name)
);

-- =====================================================
-- CONVERSATIONS (Unified comms with pgvector)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('email', 'slack', 'discord', 'ticket', 'call', 'meeting', 'chat')),
  subject TEXT,
  content TEXT,
  participants TEXT[],
  thread_id TEXT,
  external_id TEXT,
  vector vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vector index for RAG
CREATE INDEX IF NOT EXISTS conversations_vector_idx 
  ON conversations USING ivfflat (vector vector_cosine_ops) 
  WITH (lists = 100);

-- =====================================================
-- TEMPLATES (BYOT - Bring Your Own Templates)
-- =====================================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'doc', 'prompt', 'workflow', 'report', 'notification')),
  description TEXT,
  body TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT templates_org_key_unique UNIQUE (org_id, key)
);

-- =====================================================
-- CONNECTIONS (Integration settings per workspace)
-- =====================================================
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('connected', 'error', 'disconnected', 'pending')),
  credentials_ref TEXT, -- Reference to secure vault, never store secrets here
  settings JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT connections_workspace_provider_unique UNIQUE (workspace_id, provider)
);

-- =====================================================
-- AUDIT LOGS (Compliance and tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx ON audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_user_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- For now, allow all authenticated users (refine with proper policies later)
CREATE POLICY "organizations_all" ON organizations FOR ALL USING (true);
CREATE POLICY "workspaces_all" ON workspaces FOR ALL USING (true);
CREATE POLICY "user_roles_all" ON user_roles FOR ALL USING (true);
CREATE POLICY "onboarding_state_all" ON onboarding_state FOR ALL USING (true);
CREATE POLICY "accounts_all" ON accounts FOR ALL USING (true);
CREATE POLICY "conversations_all" ON conversations FOR ALL USING (true);
CREATE POLICY "templates_all" ON templates FOR ALL USING (true);
CREATE POLICY "connections_all" ON connections FOR ALL USING (true);
CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL USING (true);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY['organizations', 'workspaces', 'user_roles', 'onboarding_state', 
                         'accounts', 'conversations', 'templates', 'connections'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s 
                    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END $$;
