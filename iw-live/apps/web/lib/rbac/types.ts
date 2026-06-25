/**
 * RBAC (Role-Based Access Control) Types
 * Defines roles, permissions, and access control structures
 */

export type Role = "owner" | "admin" | "manager" | "member" | "viewer" | "guest"

export type Department = "personal" | "sales" | "marketing" | "product" | "cs" | "engineering" | "finance" | "hr"

export type Permission =
  | "read:accounts"
  | "write:accounts"
  | "delete:accounts"
  | "read:contacts"
  | "write:contacts"
  | "delete:contacts"
  | "read:meetings"
  | "write:meetings"
  | "delete:meetings"
  | "read:pipeline"
  | "write:pipeline"
  | "read:campaigns"
  | "write:campaigns"
  | "read:products"
  | "write:products"
  | "read:iq-hub"
  | "write:iq-hub"
  | "read:admin"
  | "write:admin"
  | "read:governance"
  | "write:governance"
  | "read:settings"
  | "write:settings"
  | "read:reports"
  | "write:reports"
  | "manage:users"
  | "manage:integrations"
  | "manage:billing"

export interface RolePermissions {
  role: Role
  permissions: Permission[]
  departments: Department[]
}

/**
 * Role definitions with their permissions
 */
export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  owner: {
    role: "owner",
    permissions: [
      "read:accounts",
      "write:accounts",
      "delete:accounts",
      "read:contacts",
      "write:contacts",
      "delete:contacts",
      "read:meetings",
      "write:meetings",
      "delete:meetings",
      "read:pipeline",
      "write:pipeline",
      "read:campaigns",
      "write:campaigns",
      "read:products",
      "write:products",
      "read:iq-hub",
      "write:iq-hub",
      "read:admin",
      "write:admin",
      "read:governance",
      "write:governance",
      "read:settings",
      "write:settings",
      "read:reports",
      "write:reports",
      "manage:users",
      "manage:integrations",
      "manage:billing",
    ],
    departments: ["personal", "sales", "marketing", "product", "cs", "engineering", "finance", "hr"],
  },
  admin: {
    role: "admin",
    permissions: [
      "read:accounts",
      "write:accounts",
      "read:contacts",
      "write:contacts",
      "read:meetings",
      "write:meetings",
      "read:pipeline",
      "write:pipeline",
      "read:campaigns",
      "write:campaigns",
      "read:products",
      "write:products",
      "read:iq-hub",
      "write:iq-hub",
      "read:admin",
      "write:admin",
      "read:governance",
      "read:settings",
      "write:settings",
      "read:reports",
      "write:reports",
      "manage:users",
      "manage:integrations",
    ],
    departments: ["personal", "sales", "marketing", "product", "cs", "engineering"],
  },
  manager: {
    role: "manager",
    permissions: [
      "read:accounts",
      "write:accounts",
      "read:contacts",
      "write:contacts",
      "read:meetings",
      "write:meetings",
      "read:pipeline",
      "write:pipeline",
      "read:campaigns",
      "write:campaigns",
      "read:products",
      "read:iq-hub",
      "write:iq-hub",
      "read:settings",
      "read:reports",
      "write:reports",
    ],
    departments: ["personal", "sales", "marketing", "product", "cs"],
  },
  member: {
    role: "member",
    permissions: [
      "read:accounts",
      "read:contacts",
      "read:meetings",
      "write:meetings",
      "read:pipeline",
      "read:campaigns",
      "read:products",
      "read:iq-hub",
      "write:iq-hub",
      "read:settings",
    ],
    departments: ["personal"],
  },
  viewer: {
    role: "viewer",
    permissions: [
      "read:accounts",
      "read:contacts",
      "read:meetings",
      "read:pipeline",
      "read:campaigns",
      "read:products",
      "read:iq-hub",
    ],
    departments: ["personal"],
  },
  guest: {
    role: "guest",
    permissions: ["read:accounts", "read:contacts", "read:meetings"],
    departments: ["personal"],
  },
}

/**
 * Department-specific route mappings
 */
export const DEPARTMENT_ROUTES: Record<Department, string[]> = {
  personal: ["/today", "/tasks", "/iq-hub", "/integrations"],
  sales: ["/pipeline", "/deals", "/leads"],
  marketing: ["/campaigns", "/content", "/leads"],
  product: ["/products", "/projects", "/strategy"],
  cs: ["/cs/accounts", "/cs/contacts", "/cs/meetings"],
  engineering: ["/projects", "/integrations", "/data-sources"],
  finance: ["/metrics", "/reports"],
  hr: ["/clients", "/settings"],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.permissions.includes(permission) ?? false
}

/**
 * Check if a role has access to a department
 */
export function hasDepartmentAccess(role: Role, department: Department): boolean {
  return ROLE_PERMISSIONS[role]?.departments.includes(department) ?? false
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role]?.permissions ?? []
}

/**
 * Get all departments for a role
 */
export function getRoleDepartments(role: Role): Department[] {
  return ROLE_PERMISSIONS[role]?.departments ?? []
}
