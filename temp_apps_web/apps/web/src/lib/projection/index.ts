/**
 * Projection Engine — Canonical exports
 *
 * Doctrine: No Workbench component may query raw tables directly.
 * Every read must go through the Projection Layer.
 */

export {
  useProjection,
  type UserContext,
  type TenantContext,
  type ProjectedModule,
  type ProjectedEntityType,
  type ProjectedMetric,
  type ProjectionResult,
} from "./use-projection";

export {
  resolveModules,
  resolveViews,
  getRenderMode,
  type RenderMode,
  type ViewModules,
  type RawProduct,
  type RawNavItem,
} from "./module-resolver";

export {
  applyFieldPolicy,
  mergeFieldPolicies,
  getVisibleFields,
  getEditableFields,
  getRequiredFields,
  getAiReadableFields,
  type FieldPolicy,
  type ResolvedFieldPolicy,
  type FieldPolicyContext,
} from "./field-policy";

export {
  projectRole,
  canonicalizeRole,
  projectCapabilities,
  projectEntitlements,
  projectDepartment,
  type CanonicalRole,
  type ProjectedRole,
  type RoleCapabilities,
  type EntitlementProjection,
  type DepartmentProjection,
} from "./rbac-projection";

export {
  buildWorkNavSections,
  buildPersonalNavSections,
  buildNavFromProjection,
  getCrossDeptVisibility,
  type BuildNavOptions,
  type CrossDeptVisibility,
} from "./nav-builder";
