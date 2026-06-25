/**
 * @integratewise/rbac
 *
 * Role-Based Access Control (RBAC) engine for IntegrateWise
 *
 * Features:
 * - Fine-grained permission system
 * - Default roles: Admin, Manager, Member, Viewer
 * - Wildcard permission matching
 * - Multi-tenant support
 * - System roles and custom roles
 */

// Export types
export * from "./types";

// Export engine functions
export {
  // Permission matching
  matchesPermission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,

  // Role CRUD
  listRoles,
  getRole,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,

  // User role assignments
  getUserWithRoles,
  assignRole,
  revokeRole,
  getUsersByRole,

  // Permission checks
  checkPermission,
  checkAllPermissions,
  checkAnyPermission,

  // Seeding
  seedDefaultRoles,
} from "./engine";

// Export utilities
export { createPermissionMiddleware } from "./middleware";
