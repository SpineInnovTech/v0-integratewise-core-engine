import type { CTXEnum, Industry, ModuleId, RoleProfile, IndustryProfile } from "./types";
import { DEPT_PROFILE } from "./role-registry";
import { INDUSTRIES } from "./industry-registry";
import { MODULE_REGISTRY, NAV_GROUP_ORDER, type ModuleDef } from "./module-registry";
import { isSchemaAvailable, type SchemaMap } from "./schema-availability";

export interface DerivedWorkspace {
  role: CTXEnum;
  profile: RoleProfile;
  industry: Industry;
  industryProfile: IndustryProfile;
  /** Modules the role grants AND whose schema is available, ordered & emphasis-sorted. */
  modules: ModuleDef[];
  /** Module ids the role grants but whose schema is entirely off. */
  unavailableModules: ModuleDef[];
  topics: string[];
}

/**
 * The single resolver: (role × industry × schema availability) →
 * { module set, role profile, industry topics }.
 *
 * The sidebar and L1 content render from the result; they never branch
 * per-role/industry themselves.
 */
export function deriveWorkspace(args: {
  role: CTXEnum;
  industry: Industry;
  schema: SchemaMap;
}): DerivedWorkspace {
  const { role, industry, schema } = args;
  const profile = DEPT_PROFILE[role];
  const industryProfile = INDUSTRIES[industry];

  const granted: ModuleId[] = profile.modules;
  const grantedDefs = granted
    .map((id) => MODULE_REGISTRY[id])
    .filter((m): m is ModuleDef => Boolean(m));

  const modules = grantedDefs.filter((m) => isSchemaAvailable(schema, m.requiredSchema));
  const unavailableModules = grantedDefs.filter((m) => !isSchemaAvailable(schema, m.requiredSchema));

  // Industry emphasis floats matching modules toward the top within their group.
  const emphasis = new Set<ModuleId>(industryProfile.emphasis);
  const ordered = [...modules].sort((a, b) => {
    const ga = NAV_GROUP_ORDER.indexOf(a.group);
    const gb = NAV_GROUP_ORDER.indexOf(b.group);
    if (ga !== gb) return ga - gb;
    const ea = emphasis.has(a.id) ? 0 : 1;
    const eb = emphasis.has(b.id) ? 0 : 1;
    return ea - eb;
  });

  return {
    role,
    profile,
    industry,
    industryProfile,
    modules: ordered,
    unavailableModules,
    topics: industryProfile.topics,
  };
}

/** Group derived modules by nav group, preserving group order. */
export function groupModules(modules: ModuleDef[]): { group: string; items: ModuleDef[] }[] {
  const byGroup = new Map<string, ModuleDef[]>();
  for (const m of modules) {
    if (!byGroup.has(m.group)) byGroup.set(m.group, []);
    byGroup.get(m.group)!.push(m);
  }
  return NAV_GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({ group: g, items: byGroup.get(g)! }));
}
