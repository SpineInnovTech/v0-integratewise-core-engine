/**
 * RBAC Projection Layer
 *
 * Doctrine: Workbench never consumes raw canonical enums directly.
 * All canonical operational semantics pass through projection adapters.
 *
 * Database layer preserves stable operational roles (owner, admin, practitioner, readonly).
 * Projection layer maps to human-operable contextual roles (owner, admin, member, viewer).
 * Workbench consumes only projected roles.
 */

// ─── Canonical Roles (DB / Spine) ────────────────────────────────────────────

export type CanonicalRole = "owner" | "admin" | "practitioner" | "readonly";

export const CANONICAL_ROLES = {
  OWNER: "owner" as const,
  ADMIN: "admin" as const,
  PRACTITIONER: "practitioner" as const,
  READONLY: "readonly" as const,
};

// ─── Projected Roles (Workbench / UX) ────────────────────────────────────────

export type ProjectedRole = "owner" | "admin" | "manager" | "member" | "viewer";

export const PROJECTED_ROLES = {
  OWNER: "owner" as const,
  ADMIN: "admin" as const,
  MANAGER: "manager" as const,
  MEMBER: "member" as const,
  VIEWER: "viewer" as const,
};

// ─── Canonical → Projected Mapping ───────────────────────────────────────────

export const ROLE_PROJECTION: Record<CanonicalRole, ProjectedRole> = {
  owner: "owner",
  admin: "admin",
  practitioner: "member",
  readonly: "viewer",
};

// ─── Projection Function ─────────────────────────────────────────────────────

export function projectRole(canonicalRole: string): ProjectedRole {
  const projected = ROLE_PROJECTION[canonicalRole as CanonicalRole];
  if (!projected) {
    console.warn(
      `[RBAC Projection] Unknown canonical role: ${canonicalRole}. Falling back to viewer.`
    );
    return "viewer";
  }
  return projected;
}

// ─── Reverse Mapping (for write operations back to canonical) ─────────────────

export const REVERSE_ROLE_PROJECTION: Record<ProjectedRole, CanonicalRole> = {
  owner: "owner",
  admin: "admin",
  manager: "practitioner", // manager projects to practitioner in canonical
  member: "practitioner",
  viewer: "readonly",
};

export function canonicalizeRole(projectedRole: ProjectedRole): CanonicalRole {
  return REVERSE_ROLE_PROJECTION[projectedRole] || "readonly";
}

// ─── Capability Projection ───────────────────────────────────────────────────

export interface RoleCapabilities {
  canRead: boolean;
  canWrite: boolean;
  canApprove: boolean;
  canAdmin: boolean;
  canDelete: boolean;
  canExport: boolean;
  canInvite: boolean;
  canConfigure: boolean;
}

const CAPABILITY_MATRIX: Record<ProjectedRole, RoleCapabilities> = {
  owner: {
    canRead: true,
    canWrite: true,
    canApprove: true,
    canAdmin: true,
    canDelete: true,
    canExport: true,
    canInvite: true,
    canConfigure: true,
  },
  admin: {
    canRead: true,
    canWrite: true,
    canApprove: true,
    canAdmin: true,
    canDelete: true,
    canExport: true,
    canInvite: true,
    canConfigure: true,
  },
  manager: {
    canRead: true,
    canWrite: true,
    canApprove: true,
    canAdmin: false,
    canDelete: false,
    canExport: true,
    canInvite: true,
    canConfigure: false,
  },
  member: {
    canRead: true,
    canWrite: true,
    canApprove: false,
    canAdmin: false,
    canDelete: false,
    canExport: false,
    canInvite: false,
    canConfigure: false,
  },
  viewer: {
    canRead: true,
    canWrite: false,
    canApprove: false,
    canAdmin: false,
    canDelete: false,
    canExport: false,
    canInvite: false,
    canConfigure: false,
  },
};

export function projectCapabilities(role: ProjectedRole): RoleCapabilities {
  return CAPABILITY_MATRIX[role] || CAPABILITY_MATRIX.viewer;
}

// ─── Entitlement Projection ──────────────────────────────────────────────────

export interface EntitlementProjection {
  maxModules: number;
  maxEntities: number;
  canUseTwin: boolean;
  canUseWorkflows: boolean;
  canUseAdvancedAnalytics: boolean;
  canExportData: boolean;
  canManageConnectors: boolean;
}

const ENTITLEMENT_MATRIX: Record<ProjectedRole, EntitlementProjection> = {
  owner: {
    maxModules: Number.MAX_SAFE_INTEGER,
    maxEntities: Number.MAX_SAFE_INTEGER,
    canUseTwin: true,
    canUseWorkflows: true,
    canUseAdvancedAnalytics: true,
    canExportData: true,
    canManageConnectors: true,
  },
  admin: {
    maxModules: Number.MAX_SAFE_INTEGER,
    maxEntities: Number.MAX_SAFE_INTEGER,
    canUseTwin: true,
    canUseWorkflows: true,
    canUseAdvancedAnalytics: true,
    canExportData: true,
    canManageConnectors: true,
  },
  manager: {
    maxModules: 20,
    maxEntities: 10000,
    canUseTwin: true,
    canUseWorkflows: true,
    canUseAdvancedAnalytics: true,
    canExportData: true,
    canManageConnectors: false,
  },
  member: {
    maxModules: 10,
    maxEntities: 5000,
    canUseTwin: true,
    canUseWorkflows: false,
    canUseAdvancedAnalytics: false,
    canExportData: false,
    canManageConnectors: false,
  },
  viewer: {
    maxModules: 5,
    maxEntities: 1000,
    canUseTwin: false,
    canUseWorkflows: false,
    canUseAdvancedAnalytics: false,
    canExportData: false,
    canManageConnectors: false,
  },
};

export function projectEntitlements(role: ProjectedRole): EntitlementProjection {
  return ENTITLEMENT_MATRIX[role] || ENTITLEMENT_MATRIX.viewer;
}

// ─── Department Projection ───────────────────────────────────────────────────

export interface DepartmentProjection {
  label: string;
  shortLabel: string;
  icon: string;
  primaryEntityTypes: string[];
  suggestedConnectors: string[];
}

const DEPARTMENT_PROJECTION: Record<string, DepartmentProjection> = {
  business_ops: {
    label: "Business Operations",
    shortLabel: "BizOps",
    icon: "⚙️",
    primaryEntityTypes: ["account", "opportunity", "task", "workflow"],
    suggestedConnectors: ["salesforce", "slack", "jira", "notion"],
  },
  customer_success: {
    label: "Account Success",
    shortLabel: "CS",
    icon: "💚",
    primaryEntityTypes: ["account", "contact", "success_plan", "risk"],
    suggestedConnectors: ["salesforce", "zendesk", "intercom", "slack"],
  },
  sales: {
    label: "Sales",
    shortLabel: "Sales",
    icon: "🤝",
    primaryEntityTypes: ["opportunity", "lead", "quote", "sequence"],
    suggestedConnectors: ["salesforce", "linkedin", "calendly", "hubspot"],
  },
  marketing: {
    label: "Marketing",
    shortLabel: "Marketing",
    icon: "📢",
    primaryEntityTypes: ["campaign", "lead", "email", "social_post"],
    suggestedConnectors: ["hubspot", "mailchimp", "google-ads", "slack"],
  },
  revops: {
    label: "Revenue Operations",
    shortLabel: "RevOps",
    icon: "📈",
    primaryEntityTypes: ["pipeline", "forecast", "quota", "cohort"],
    suggestedConnectors: ["salesforce", "stripe", "quickbooks", "linkedin"],
  },
  finance: {
    label: "Finance",
    shortLabel: "Finance",
    icon: "💰",
    primaryEntityTypes: ["invoice", "budget", "expense", "report"],
    suggestedConnectors: ["quickbooks", "stripe", "sap", "excel"],
  },
  service: {
    label: "Customer Service",
    shortLabel: "Service",
    icon: "🎧",
    primaryEntityTypes: ["ticket", "sla", "knowledge_article", "satisfaction"],
    suggestedConnectors: ["zendesk", "intercom", "slack", "freshdesk"],
  },
  procurement: {
    label: "Procurement",
    shortLabel: "Procurement",
    icon: "📦",
    primaryEntityTypes: ["vendor", "purchase_order", "contract", "renewal"],
    suggestedConnectors: ["sap", "oracle", "salesforce", "excel"],
  },
  it_admin: {
    label: "IT Administration",
    shortLabel: "IT",
    icon: "🔧",
    primaryEntityTypes: ["system", "incident", "vulnerability", "certificate"],
    suggestedConnectors: ["okta", "azure", "jira", "servicenow"],
  },
  product_engineering: {
    label: "Product & Engineering",
    shortLabel: "Product/Eng",
    icon: "💻",
    primaryEntityTypes: ["feature", "bug", "sprint", "release"],
    suggestedConnectors: ["jira", "github", "slack", "figma"],
  },
  student_teacher: {
    label: "Education",
    shortLabel: "Edu",
    icon: "🎓",
    primaryEntityTypes: ["student", "course", "assignment", "grade"],
    suggestedConnectors: ["google-classroom", "canvas", "slack"],
  },
};

export function projectDepartment(canonicalDept: string): DepartmentProjection {
  return (
    DEPARTMENT_PROJECTION[canonicalDept] || {
      label: canonicalDept,
      shortLabel: canonicalDept,
      icon: "📋",
      primaryEntityTypes: [],
      suggestedConnectors: [],
    }
  );
}

// ─── Export Barrel ───────────────────────────────────────────────────────────
// ROLE_PROJECTION and REVERSE_ROLE_PROJECTION are already exported above
