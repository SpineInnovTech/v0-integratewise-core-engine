/**
 * Projection-Native Navigation Builder
 *
 * Builds sidebar navigation sections directly from projected modules.
 * Replaces hardcoded domain configs with projection-driven nav.
 *
 * Three Doors enforced:
 *   - My Department: primary department modules
 *   - My Organization: cross-department modules (depth_matrix gated)
 *   - My Self: personal modules
 *
 * Doctrine: Navigation is a projection of capability, not a static menu.
 */

import type { ProjectionResult, ProjectedModule } from "./use-projection";
import { resolveViews, type ViewModules } from "./module-resolver";
import { canAccessModule, type ModuleGuardContext } from "./module-guard";
import type { NavSection } from "@/components/l1/workspace/workspace-config";

// ─── Section Labels ──────────────────────────────────────────────────────────

const SECTION_LABELS = {
  primary: "My Department",
  crossDept: "Organization",
  system: "System",
  personal: "Personal",
  intelligence: "Intelligence",
} as const;

// ─── Module Categorization ───────────────────────────────────────────────────

const SYSTEM_MODULE_IDS = new Set([
  "settings",
  "fabric-admin",
  "admin",
  "users",
  "permissions",
  "rbac",
  "billing",
  "integrations",
  "connectors",
]);

const INTELLIGENCE_MODULE_IDS = new Set([
  "ai-chat",
  "twin",
  "intelligence",
  "signals",
  "insights",
  "analytics",
]);

function categorizeModule(
  mod: ProjectedModule,
  userDept: string
): "primary" | "crossDept" | "system" | "intelligence" | "personal" {
  if (mod.id.includes("personal") || mod.path.startsWith("/personal")) return "personal";
  if (SYSTEM_MODULE_IDS.has(mod.id)) return "system";
  if (INTELLIGENCE_MODULE_IDS.has(mod.id)) return "intelligence";
  if (mod.entityTypes.some((et) => et.startsWith(userDept)) || mod.id.includes(userDept))
    return "primary";
  return "crossDept";
}

// ─── Depth Badge Generator ───────────────────────────────────────────────────

function getDepthBadge(depth: number): string | undefined {
  if (depth >= 3) return "deep";
  if (depth >= 2) return "cross";
  return undefined;
}

// ─── Nav Item Builder ────────────────────────────────────────────────────────

function buildNavItem(
  mod: ProjectedModule,
  userDept: string
): {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: string;
} {
  const category = categorizeModule(mod, userDept);
  const depthBadge = category === "crossDept" ? getDepthBadge(mod.depth) : undefined;

  return {
    id: mod.id,
    label: mod.label,
    path: mod.path,
    icon: mod.icon,
    badge: mod.badge || depthBadge,
  };
}

// ─── Section Builder ─────────────────────────────────────────────────────────

export interface BuildNavOptions {
  /** If true, include system modules (settings, admin, etc.) */
  includeSystem?: boolean;
  /** If true, include intelligence modules (AI chat, signals) */
  includeIntelligence?: boolean;
  /** If true, include cross-department modules */
  includeCrossDept?: boolean;
  /** Max depth level for cross-department modules */
  maxCrossDepth?: number;
}

export function buildWorkNavSections(
  projection: ProjectionResult,
  opts: BuildNavOptions = {}
): NavSection[] {
  const {
    includeSystem = true,
    includeIntelligence = true,
    includeCrossDept = true,
    maxCrossDepth = 3,
  } = opts;

  const { modules, user } = projection;
  const sections: NavSection[] = [];

  // Guard context for access checking
  const guardContext: ModuleGuardContext = {
    projectedModules: modules,
    userRole: user.role,
    canAdmin: projection.canAdmin,
  };

  // Group modules by category
  const primary: ProjectedModule[] = [];
  const crossDept: ProjectedModule[] = [];
  const system: ProjectedModule[] = [];
  const intelligence: ProjectedModule[] = [];

  for (const mod of modules) {
    // Skip if module is not accessible
    const domain = mod.path.startsWith("/personal") ? "PERSONAL" : "BIZOPS";
    if (!canAccessModule(mod.id, domain, guardContext)) continue;

    const category = categorizeModule(mod, user.department);
    switch (category) {
      case "primary":
        primary.push(mod);
        break;
      case "crossDept":
        if (includeCrossDept && mod.depth <= maxCrossDepth) {
          crossDept.push(mod);
        }
        break;
      case "system":
        if (includeSystem) system.push(mod);
        break;
      case "intelligence":
        if (includeIntelligence) intelligence.push(mod);
        break;
      case "personal":
        // Personal modules don't appear in work nav
        break;
    }
  }

  // Build sections in order
  if (primary.length > 0) {
    sections.push({
      label: SECTION_LABELS.primary,
      items: primary.map((m) => buildNavItem(m, user.department)),
    });
  }

  if (crossDept.length > 0) {
    sections.push({
      label: SECTION_LABELS.crossDept,
      items: crossDept.map((m) => buildNavItem(m, user.department)),
    });
  }

  if (intelligence.length > 0) {
    sections.push({
      label: SECTION_LABELS.intelligence,
      items: intelligence.map((m) => buildNavItem(m, user.department)),
    });
  }

  if (system.length > 0) {
    sections.push({
      label: SECTION_LABELS.system,
      items: system.map((m) => buildNavItem(m, user.department)),
    });
  }

  return sections;
}

/**
 * Build personal navigation sections from projection.
 */
export function buildPersonalNavSections(projection: ProjectionResult): NavSection[] {
  const { modules, user } = projection;

  const personalModules = modules.filter(
    (m) =>
      m.id.includes("personal") ||
      m.path.startsWith("/personal") ||
      categorizeModule(m, user.department) === "personal"
  );

  if (personalModules.length === 0) return [];

  return [
    {
      label: SECTION_LABELS.personal,
      items: personalModules.map((m) => buildNavItem(m, user.department)),
    },
  ];
}

/**
 * Build unified navigation from projection.
 * Returns work or personal sections based on active view.
 */
export function buildNavFromProjection(
  projection: ProjectionResult,
  activeView: "WORK" | "PERSONAL",
  opts?: BuildNavOptions
): NavSection[] {
  if (activeView === "PERSONAL") {
    return buildPersonalNavSections(projection);
  }
  return buildWorkNavSections(projection, opts);
}

// ─── Cross-Department Visibility Helper ──────────────────────────────────────

export interface CrossDeptVisibility {
  department: string;
  depth: number;
  modules: ProjectedModule[];
}

/**
 * Get cross-department visibility summary for the Org View.
 */
export function getCrossDeptVisibility(projection: ProjectionResult): CrossDeptVisibility[] {
  const { modules, user, tenant } = projection;
  const result: CrossDeptVisibility[] = [];

  const depthMap = tenant.depthMatrix[tenant.industryVertical] || {};

  for (const [dept, depth] of Object.entries(depthMap)) {
    if (dept === user.department) continue;
    if (depth <= 1) continue;

    const deptModules = modules.filter(
      (m) =>
        m.entityTypes.some((et) => et.startsWith(dept)) ||
        m.id.includes(dept) ||
        categorizeModule(m, user.department) === "crossDept"
    );

    if (deptModules.length > 0) {
      result.push({ department: dept, depth, modules: deptModules });
    }
  }

  return result.sort((a, b) => b.depth - a.depth);
}
