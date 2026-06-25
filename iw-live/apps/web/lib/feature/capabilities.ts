/**
 * Role-Based Access Control (RBAC) System
 * 
 * Defines roles, capabilities, and default permissions for IntegrateWise OS
 * Defense-in-depth: enforced both client-side and server-side
 */

export type Role = 
  | "super_admin" 
  | "org_admin" 
  | "billing_admin" 
  | "ops_manager" 
  | "member" 
  | "viewer";

export type Capability =
  | "view.overview"
  | "view.tasks"
  | "view.ai_insights"
  | "view.normalize"
  | "view.os_pages"
  | "integrations.calendar.read"
  | "integrations.memory.read";

export const DEFAULT_CAPS: Record<Role, Capability[]> = {
  super_admin: [
    "view.overview",
    "view.tasks",
    "view.ai_insights",
    "view.normalize",
    "view.os_pages",
    "integrations.calendar.read",
    "integrations.memory.read"
  ],
  org_admin: [
    "view.overview",
    "view.tasks",
    "view.ai_insights",
    "view.normalize",
    "view.os_pages",
    "integrations.calendar.read",
    "integrations.memory.read"
  ],
  billing_admin: [
    "view.overview",
    "view.os_pages"
  ],
  ops_manager: [
    "view.overview",
    "view.tasks",
    "view.os_pages"
  ],
  member: [
    "view.overview",
    "view.tasks",
    "view.ai_insights"
  ],
  viewer: [
    "view.overview"
  ],
};

/**
 * Check if a role has a specific capability
 */
export function hasCapability(role: Role, capability: Capability): boolean {
  return DEFAULT_CAPS[role]?.includes(capability) ?? false;
}

/**
 * Get all capabilities for a role
 */
export function getCapabilities(role: Role): Capability[] {
  return DEFAULT_CAPS[role] ?? [];
}

/**
 * Check if a role has any of the specified capabilities
 */
export function hasAnyCapability(role: Role, capabilities: Capability[]): boolean {
  const roleCaps = getCapabilities(role);
  return capabilities.some(cap => roleCaps.includes(cap));
}

/**
 * Check if a role has all of the specified capabilities
 */
export function hasAllCapabilities(role: Role, capabilities: Capability[]): boolean {
  const roleCaps = getCapabilities(role);
  return capabilities.every(cap => roleCaps.includes(cap));
}
