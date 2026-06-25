-- Migration: 031_rbac_system.sql
-- Description: Comprehensive RBAC system with roles, permissions, and assignments
-- Created: 2026-01-31
-- Dependencies: Users and Organizations tables must exist

-- =============================================================================
-- RBAC TABLES
-- =============================================================================

-- Roles table (supports both system-wide and tenant-specific roles)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NULL, -- NULL for system roles, set for custom tenant roles
  name TEXT NOT NULL,
  description TEXT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}', -- Array of permission strings
  is_system_role BOOLEAN DEFAULT false, -- System roles cannot be deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique role names per tenant (system roles have NULL tenant_id)
  CONSTRAINT unique_role_per_tenant UNIQUE (name, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- User roles junction table (many-to-many between users and roles)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID NULL, -- Who assigned this role
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

-- Permission audit log (track all permission checks for compliance)
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  permission TEXT NOT NULL,
  resource_type TEXT NULL,
  resource_id UUID NULL,
  allowed BOOLEAN NOT NULL,
  matched_role TEXT NULL,
  ip_address INET NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Roles indexes
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles(is_system_role) WHERE is_system_role = true;
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles(assigned_by) WHERE assigned_by IS NOT NULL;

-- Permission audit log indexes
CREATE INDEX IF NOT EXISTS idx_permission_audit_tenant_id ON permission_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_user_id ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_created_at ON permission_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_audit_permission ON permission_audit_log(permission);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

/**
 * Check if a user has a specific permission
 * 
 * @param p_user_id - The user ID to check
 * @param p_tenant_id - The tenant ID context
 * @param p_permission - The permission to check (e.g., 'account:read')
 * @returns Boolean indicating if user has permission
 */
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_tenant_id UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  -- Check if user has a role with the exact permission or a wildcard permission
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND (r.tenant_id = p_tenant_id OR r.is_system_role = true)
      AND (
        p_permission = ANY(r.permissions)  -- Exact match
        OR '*:*' = ANY(r.permissions)      -- Super admin wildcard
        OR (
          -- Resource wildcard (e.g., 'account:*' matches 'account:read')
          split_part(p_permission, ':', 1) || ':*' = ANY(r.permissions)
        )
        OR (
          -- Operation wildcard (e.g., '*:read' matches 'account:read')
          '*:' || split_part(p_permission, ':', 2) = ANY(r.permissions)
        )
      )
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get all permissions for a user
 * 
 * @param p_user_id - The user ID
 * @param p_tenant_id - The tenant ID context
 * @returns Array of permission strings
 */
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_tenant_id UUID
) RETURNS TEXT[] AS $$
DECLARE
  v_permissions TEXT[];
BEGIN
  -- Aggregate all permissions from all roles assigned to the user
  SELECT ARRAY_AGG(DISTINCT perm)
  INTO v_permissions
  FROM (
    SELECT unnest(r.permissions) as perm
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND (r.tenant_id = p_tenant_id OR r.is_system_role = true)
  ) permissions;
  
  RETURN COALESCE(v_permissions, '{}');
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get all roles for a user
 * 
 * @param p_user_id - The user ID
 * @param p_tenant_id - The tenant ID context
 * @returns Array of role names
 */
CREATE OR REPLACE FUNCTION get_user_roles(
  p_user_id UUID,
  p_tenant_id UUID
) RETURNS TEXT[] AS $$
DECLARE
  v_roles TEXT[];
BEGIN
  SELECT ARRAY_AGG(r.name)
  INTO v_roles
  FROM user_roles ur
  INNER JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
    AND (r.tenant_id = p_tenant_id OR r.is_system_role = true);
  
  RETURN COALESCE(v_roles, '{}');
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- SEED DEFAULT SYSTEM ROLES
-- =============================================================================

-- Insert default system roles with comprehensive permissions
INSERT INTO roles (name, description, permissions, is_system_role, tenant_id) VALUES
  (
    'Admin',
    'Full system access with all permissions including user management, billing, and system configuration',
    ARRAY['*:*'],
    true,
    NULL
  ),
  (
    'Manager',
    'Can manage teams, connectors, and workflows. Can approve actions and create policies',
    ARRAY[
      'user:read', 'user:create', 'user:update',
      'role:read', 'role:create', 'role:update',
      'account:read', 'account:create', 'account:update',
      'connector:read', 'connector:create', 'connector:update',
      'action:read', 'action:execute', 'action:approve',
      'workflow:read', 'workflow:create', 'workflow:update',
      'policy:read', 'policy:create', 'policy:update',
      'governance:read', 'governance:approve',
      'knowledge:read', 'knowledge:create', 'knowledge:update',
      'execution:read',
      'billing:read',
      'audit:read',
      'view:read', 'hub:read', 'module:read'
    ],
    true,
    NULL
  ),
  (
    'Member',
    'Can create and execute workflows, manage own accounts, and contribute knowledge',
    ARRAY[
      'user:read',
      'role:read',
      'account:read', 'account:update',
      'connector:read',
      'action:read', 'action:execute',
      'workflow:read', 'workflow:create',
      'knowledge:read', 'knowledge:create',
      'execution:read',
      'governance:read',
      'policy:read',
      'view:read', 'hub:read', 'module:read'
    ],
    true,
    NULL
  ),
  (
    'Viewer',
    'Read-only access to all resources without modification privileges',
    ARRAY[
      'user:read',
      'role:read',
      'account:read',
      'connector:read',
      'action:read',
      'workflow:read',
      'policy:read',
      'governance:read',
      'knowledge:read',
      'execution:read',
      'view:read', 'hub:read', 'module:read'
    ],
    true,
    NULL
  )
ON CONFLICT (name, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid))
DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE roles FORCE ROW LEVEL SECURITY;
ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log FORCE ROW LEVEL SECURITY;

-- Roles: users can read system roles + their tenant's custom roles
CREATE POLICY roles_select_policy ON roles
  FOR SELECT
  USING (
    is_system_role = true
    OR tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

-- Roles: only service role can mutate (INSERT/UPDATE/DELETE denied to clients)
CREATE POLICY roles_mutate_policy ON roles
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- User roles: users can read their own assignments
CREATE POLICY user_roles_select_policy ON user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- User roles: only service role can assign/remove roles
CREATE POLICY user_roles_mutate_policy ON user_roles
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Permission audit log: users can read their own audit entries
CREATE POLICY audit_log_select_policy ON permission_audit_log
  FOR SELECT
  USING (user_id = auth.uid());

-- Permission audit log: only service role can insert
CREATE POLICY audit_log_insert_policy ON permission_audit_log
  FOR INSERT
  WITH CHECK (false);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp for roles
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roles_updated_at_trigger
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_updated_at();

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

COMMENT ON TABLE roles IS 'Role definitions with permissions (system-wide or tenant-specific)';
COMMENT ON TABLE user_roles IS 'User-role assignments (many-to-many junction table)';
COMMENT ON TABLE permission_audit_log IS 'Audit trail for all permission checks';
COMMENT ON FUNCTION user_has_permission(UUID, UUID, TEXT) IS 'Check if a user has a specific permission';
COMMENT ON FUNCTION get_user_permissions(UUID, UUID) IS 'Get all permissions for a user';
COMMENT ON FUNCTION get_user_roles(UUID, UUID) IS 'Get all role names for a user';
