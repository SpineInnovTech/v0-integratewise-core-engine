export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export interface RoleDefinition {
  name: RoleName;
  level: number;
  permissions: string[];
  title: string;
  shell: string;
  defaultModules: string[];
}

export const ROLE_HIERARCHY: RoleDefinition[] = [
  {
    name: "owner",
    level: 100,
    permissions: ["*"],
    title: "Owner",
    shell: "owner-shell",
    defaultModules: ["workspace", "connectors", "knowledge", "goals", "workflows", "admin"],
  },
  {
    name: "admin",
    level: 80,
    permissions: ["admin.*", "write.*", "read.*"],
    title: "Admin",
    shell: "admin-shell",
    defaultModules: ["workspace", "connectors", "knowledge", "goals", "workflows", "admin"],
  },
  {
    name: "manager",
    level: 60,
    permissions: ["write.*", "read.*", "approve.*"],
    title: "Manager",
    shell: "manager-shell",
    defaultModules: ["workspace", "connectors", "knowledge", "goals", "workflows"],
  },
  {
    name: "member",
    level: 40,
    permissions: ["write.own", "read.*"],
    title: "Member",
    shell: "member-shell",
    defaultModules: ["workspace", "connectors", "knowledge", "goals"],
  },
  {
    name: "viewer",
    level: 20,
    permissions: ["read.*"],
    title: "Viewer",
    shell: "viewer-shell",
    defaultModules: ["workspace", "knowledge"],
  },
];

export function hasPermission(role: string, permission: string): boolean {
  const def = ROLE_HIERARCHY.find((r) => r.name === (role as RoleName));
  if (!def) return false;
  return def.permissions.includes("*") || def.permissions.includes(permission);
}

export function getRoleConfig(role: string): RoleDefinition {
  const def = ROLE_HIERARCHY.find((r) => r.name === role);
  return def || ROLE_HIERARCHY[ROLE_HIERARCHY.length - 1];
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    manager: "Manager",
    member: "Member",
    viewer: "Viewer",
  };
  return labels[role] || role;
}
