-- =====================================================
-- Auth Schema: Users, Identities, Sessions, Roles, RBAC
-- Version: 027
-- Description: JWT-based authentication with RBAC
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Organizations table (multi-tenant support)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  soft_deleted_at TIMESTAMPTZ NULL
);

-- Users table with org isolation
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NULL, -- NULL for OAuth-only users
  full_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  soft_deleted_at TIMESTAMPTZ NULL,
  CONSTRAINT users_email_lower CHECK (email = lower(email))
);

-- Identities table for OAuth providers
CREATE TABLE IF NOT EXISTS identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'github', 'email', etc.
  provider_user_id TEXT NOT NULL,
  email CITEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, provider_user_id)
);

-- Sessions table with JWT tracking
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jwt_id TEXT UNIQUE NOT NULL, -- jti claim for revocation
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  ip_address INET NULL,
  user_agent TEXT NULL,
  refresh_token_hash TEXT NULL, -- for refresh token rotation
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NULL,
  permissions JSONB DEFAULT '[]', -- Array of permission strings
  is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

-- User roles mapping
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, role_id)
);

-- Audit log for auth events
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'signup', 'password_change', 'role_change'
  ip_address INET NULL,
  user_agent TEXT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_versions (
  version INT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT now(),
  checksum TEXT NOT NULL,
  description TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id) WHERE soft_deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE soft_deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_jwt_id ON sessions(jwt_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_identities_user_id ON identities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON auth_audit_log(created_at);

-- Insert schema version
INSERT INTO schema_versions (version, checksum, description)
VALUES (27, 'auth_schema_v1', 'JWT-based authentication with RBAC')
ON CONFLICT (version) DO NOTHING;
