-- Clerk Authentication Schema
-- Aligns with Clerk SSO and webhook events
-- Uses IF NOT EXISTS for idempotent execution (safe for re-runs)

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('Admin', 'Manager', 'Analyst', 'Viewer')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users table (aligned with Clerk)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  email CITEXT UNIQUE NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  soft_deleted_at TIMESTAMPTZ
);

-- Identities table (stores Clerk provider data)
CREATE TABLE IF NOT EXISTS identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider = 'clerk'),
  provider_user_id TEXT NOT NULL,
  email CITEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, provider_user_id)
);

-- Sessions table (tracks Clerk JWT sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jwt_id TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip INET,
  ua TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_identities_user_id ON identities(user_id);
CREATE INDEX IF NOT EXISTS idx_identities_provider_user_id ON identities(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_jwt_id ON sessions(jwt_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Seed roles
INSERT INTO roles (name, description) VALUES
  ('Admin', 'Full system access and management'),
  ('Manager', 'Can manage teams and view reports'),
  ('Analyst', 'Can view and analyze data'),
  ('Viewer', 'Read-only access')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: scope by org_id, deny soft-deleted users
DROP POLICY IF EXISTS users_org_policy ON users;
CREATE POLICY users_org_policy ON users
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::UUID AND soft_deleted_at IS NULL);

DROP POLICY IF EXISTS identities_org_policy ON identities;
CREATE POLICY identities_org_policy ON identities
  FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE org_id = current_setting('app.current_org_id')::UUID));

DROP POLICY IF EXISTS sessions_org_policy ON sessions;
CREATE POLICY sessions_org_policy ON sessions
  FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE org_id = current_setting('app.current_org_id')::UUID));

DROP POLICY IF EXISTS user_roles_org_policy ON user_roles;
CREATE POLICY user_roles_org_policy ON user_roles
  FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE org_id = current_setting('app.current_org_id')::UUID));
