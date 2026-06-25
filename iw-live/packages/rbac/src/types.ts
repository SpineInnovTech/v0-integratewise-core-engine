import { z } from "zod";

// ============================================================================
// Permission & Role Types
// ============================================================================

/**
 * Resource types in the system
 */
export type ResourceType =
  | "account"
  | "connector"
  | "action"
  | "signal"
  | "policy"
  | "role"
  | "user"
  | "tenant"
  | "audit"
  | "billing"
  | "knowledge"
  | "governance"
  | "execution"
  | "workflow"
  | "view"
  | "hub"
  | "module";

/**
 * Standard CRUD + administrative operations
 */
export type Operation =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "execute"
  | "approve"
  | "reject"
  | "admin"
  | "export"
  | "import";

/**
 * Permission string format: resource:operation
 * Examples: 'account:read', 'action:execute', 'policy:admin'
 */
export type Permission = `${ResourceType}:${Operation}` | "*:*";

/**
 * Role definition
 */
export const RoleSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()),
  is_system_role: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Role = z.infer<typeof RoleSchema>;

/**
 * User with roles
 */
export const UserWithRolesSchema = z.object({
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  roles: z.array(RoleSchema),
  permissions: z.array(z.string()),
});

export type UserWithRoles = z.infer<typeof UserWithRolesSchema>;

/**
 * Permission check request
 */
export const PermissionCheckSchema = z.object({
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  permission: z.string(),
  resource_id: z.string().uuid().optional(),
});

export type PermissionCheck = z.infer<typeof PermissionCheckSchema>;

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  matched_role?: string;
}

/**
 * Create role request
 */
export const CreateRoleSchema = RoleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CreateRole = z.infer<typeof CreateRoleSchema>;

/**
 * Update role request
 */
export const UpdateRoleSchema = RoleSchema.partial().omit({
  id: true,
  tenant_id: true,
  is_system_role: true,
  created_at: true,
  updated_at: true,
});

export type UpdateRole = z.infer<typeof UpdateRoleSchema>;

/**
 * Assign role request
 */
export const AssignRoleSchema = z.object({
  user_id: z.string().uuid(),
  role_id: z.string().uuid(),
  assigned_by: z.string().uuid().optional(),
});

export type AssignRole = z.infer<typeof AssignRoleSchema>;

// ============================================================================
// Default Roles & Permissions
// ============================================================================

/**
 * Default system roles
 */
export const DEFAULT_ROLES = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
  VIEWER: "Viewer",
} as const;

/**
 * Permission sets for default roles
 */
export const DEFAULT_PERMISSIONS = {
  Admin: [
    "*:*", // Full access to everything
  ],
  Manager: [
    // User & Team Management
    "user:read",
    "user:create",
    "user:update",
    "role:read",
    "role:create",
    "role:update",

    // Account & Connector Management
    "account:read",
    "account:create",
    "account:update",
    "connector:read",
    "connector:create",
    "connector:update",

    // Action & Workflow Management
    "action:read",
    "action:execute",
    "action:approve",
    "workflow:read",
    "workflow:create",
    "workflow:update",

    // Policy Management
    "policy:read",
    "policy:create",
    "policy:update",
    "governance:read",
    "governance:approve",

    // Knowledge & Execution
    "knowledge:read",
    "knowledge:create",
    "knowledge:update",
    "execution:read",

    // Billing & Audit (read-only)
    "billing:read",
    "audit:read",

    // Views & Hubs
    "view:read",
    "hub:read",
    "module:read",
  ],
  Member: [
    // Read-only user access
    "user:read",
    "role:read",

    // Account & Connector (read + limited write)
    "account:read",
    "account:update",
    "connector:read",

    // Actions (execute with approval)
    "action:read",
    "action:execute",
    "workflow:read",
    "workflow:create",

    // Knowledge
    "knowledge:read",
    "knowledge:create",

    // Execution & Governance (read-only)
    "execution:read",
    "governance:read",
    "policy:read",

    // Views & Hubs
    "view:read",
    "hub:read",
    "module:read",
  ],
  Viewer: [
    // Read-only access
    "user:read",
    "role:read",
    "account:read",
    "connector:read",
    "action:read",
    "workflow:read",
    "policy:read",
    "governance:read",
    "knowledge:read",
    "execution:read",
    "view:read",
    "hub:read",
    "module:read",
  ],
} as const;

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS = {
  Admin:
    "Full system access with all permissions including user management, billing, and system configuration",
  Manager: "Can manage teams, connectors, and workflows. Can approve actions and create policies",
  Member: "Can create and execute workflows, manage own accounts, and contribute knowledge",
  Viewer: "Read-only access to all resources without modification privileges",
} as const;
