/**
 * Module Resolver — Dynamic Navigation Resolution
 *
 * Replaces hardcoded DOMAIN_CONTENT_MAP with dynamic resolution from:
 *   tenant_spine_config x product_catalog x user role/permissions
 *
 * Ensures each user sees 8-15 modules, never 132 domain x industry combinations.
 */

import type { UserContext, TenantContext, ProjectedModule } from "./use-projection";

// ─── Role-Based Module Filtering ───────────────────────────────────────────────

const ROLE_MODULE_PERMISSIONS: Record<string, string[]> = {
  owner: ["*"],
  admin: ["*"],
  manager: ["workspace", "connectors", "knowledge", "goals", "workflows", "analytics"],
  member: ["workspace", "connectors", "knowledge", "goals"],
  viewer: ["workspace", "knowledge"],
};

function roleCanAccessModule(role: string, moduleCategory: string): boolean {
  const perms = ROLE_MODULE_PERMISSIONS[role] || [];
  if (perms.includes("*")) return true;
  return perms.includes(moduleCategory);
}

// ─── Depth-Based Rendering Mode ────────────────────────────────────────────────

export type RenderMode = "tile" | "card" | "table" | "canvas";

export function getRenderMode(depth: number): RenderMode {
  if (depth <= 1) return "tile";
  if (depth <= 2) return "card";
  if (depth <= 3) return "table";
  return "canvas";
}

// ─── Three Views Resolution ────────────────────────────────────────────────────

export interface ViewModules {
  work: ProjectedModule[];
  org: ProjectedModule[];
  personal: ProjectedModule[];
}

export function resolveViews(
  projectedModules: ProjectedModule[],
  user: UserContext,
  tenant: TenantContext
): ViewModules {
  const workModules: ProjectedModule[] = [];
  const orgModules: ProjectedModule[] = [];
  const personalModules: ProjectedModule[] = [];

  for (const mod of projectedModules) {
    // Work view: modules matching user's primary department
    if (
      mod.entityTypes.some((et) => et.startsWith(user.department)) ||
      mod.id.includes(user.department)
    ) {
      workModules.push(mod);
      continue;
    }

    // Org view: cross-department modules for elevated roles
    if (["owner", "admin", "manager"].includes(user.role)) {
      orgModules.push(mod);
      continue;
    }

    // Personal view: user-scoped modules (not tied to department)
    if (mod.id.includes("personal") || mod.id.includes("task") || mod.id.includes("calendar")) {
      personalModules.push(mod);
    }
  }

  // Fallback: if work is empty, show all personal
  if (workModules.length === 0 && personalModules.length === 0) {
    for (const mod of projectedModules) {
      if (!orgModules.includes(mod)) {
        workModules.push(mod);
      }
    }
  }

  return { work: workModules, org: orgModules, personal: personalModules };
}

// ─── Module Resolver from Raw Data ─────────────────────────────────────────────

export interface RawProduct {
  id: string;
  name: string;
  surface: string;
  twin_tier: number;
  entity_types?: string[];
  nav_items?: RawNavItem[];
}

export interface RawNavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  category?: string;
  min_depth?: number;
  max_depth?: number;
}

export function resolveModules(
  products: RawProduct[],
  entitledProductIds: Set<string>,
  user: UserContext,
  tenant: TenantContext
): ProjectedModule[] {
  const modules: ProjectedModule[] = [];
  const seen = new Set<string>();

  const depth = tenant.depthMatrix[tenant.industryVertical]?.[user.department] || 1;

  for (const product of products) {
    if (!entitledProductIds.has(product.id)) continue;

    // Twin tier check
    const userTwinLevel =
      tenant.twinTier === "full_twin" ? 3 : tenant.twinTier === "basic_twin" ? 2 : 1;
    if (product.twin_tier > userTwinLevel) continue;

    for (const nav of product.nav_items || []) {
      // Deduplicate
      if (seen.has(nav.id)) continue;
      seen.add(nav.id);

      // Depth filter
      if ((nav.min_depth || 1) > depth) continue;
      if (nav.max_depth && depth > nav.max_depth) continue;

      // Role filter
      if (nav.category && !roleCanAccessModule(user.role, nav.category)) continue;

      modules.push({
        id: nav.id,
        label: nav.label,
        path: nav.path,
        icon: nav.icon || "box",
        entityTypes: product.entity_types || [],
        depth,
      });
    }
  }

  // Sort by depth (shallow first), then label
  modules.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    return a.label.localeCompare(b.label);
  });

  // Cap at 15 modules
  return modules.slice(0, 15);
}
