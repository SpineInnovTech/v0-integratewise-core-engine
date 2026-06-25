-- =====================================================
-- Seed Auth Data: Default org, roles, demo user
-- Version: 028
-- =====================================================

-- Create default organization
INSERT INTO organizations (id, name, slug, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'IntegrateWise',
  'integratewise',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create system roles
INSERT INTO roles (id, org_id, name, description, permissions, is_system_role)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Admin',
    'Full system access',
    '["*"]'::jsonb,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Manager',
    'Manage users, view reports, edit content',
    '["users:read", "users:write", "reports:read", "content:write", "clients:*", "tasks:*"]'::jsonb,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Analyst',
    'View analytics and reports',
    '["reports:read", "analytics:read", "tasks:read"]'::jsonb,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Viewer',
    'Read-only access',
    '["*:read"]'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Create demo user (password: Demo@123456)
-- Hashed with bcrypt rounds=10
INSERT INTO users (id, org_id, email, password_hash, full_name, is_active, email_verified)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'demo@integratewise.ai',
  '$2a$10$rN7YKvVXJ3xJ3xJ3xJ3xJOZKvVXJ3xJ3xJ3xJ3xJ3xJ3xJ3xJ3xJ3x', -- Demo@123456
  'Demo User',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Assign Admin role to demo user
INSERT INTO user_roles (user_id, role_id)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001'
) ON CONFLICT (user_id, role_id) DO NOTHING;

-- Insert schema version
INSERT INTO schema_versions (version, checksum, description)
VALUES (28, 'auth_seed_v1', 'Seed default org, roles, and demo user')
ON CONFLICT (version) DO NOTHING;
