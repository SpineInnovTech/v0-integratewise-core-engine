/**
 * Module Guard — Projection-based entitlement check
 *
 * Guards module access based on user projection.
 * Falls back to allowing all modules if projection is not available.
 */

import type { ProjectedModule } from "./use-projection";

export interface ModuleGuardContext {
  projectedModules: ProjectedModule[];
  userRole: string;
  canAdmin: boolean;
}

/**
 * Check if a module is accessible to the user based on projection.
 */
export function canAccessModule(
  moduleId: string,
  domain: string,
  context: ModuleGuardContext
): boolean {
  // Admins and owners can access everything
  if (context.canAdmin) return true;

  // If no projection data, allow all (graceful fallback)
  if (context.projectedModules.length === 0) return true;

  // Check if module is in the projected list
  const modulePath = `/work/${moduleId}`;
  const isProjected = context.projectedModules.some(
    (m) => m.id === moduleId || m.path === modulePath || m.path.includes(moduleId)
  );

  return isProjected;
}

/**
 * Filter a list of module IDs to only those accessible to the user.
 */
export function filterAccessibleModules(
  moduleIds: string[],
  domain: string,
  context: ModuleGuardContext
): string[] {
  return moduleIds.filter((id) => canAccessModule(id, domain, context));
}
