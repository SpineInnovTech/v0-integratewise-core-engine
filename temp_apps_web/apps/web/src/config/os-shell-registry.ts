export type EntitlementTier = "personal" | "free" | "starter" | "growth" | "enterprise";
export type OsViewId = string;

export interface NavItemConfig {
  id: string;
  label: string;
  icon: string;
  path?: string;
  route?: string;
  view?: string;
  badge?: number;
  section?: string;
  description?: string;
}

export interface ShellModule {
  id: string;
  label: string;
  icon: string;
  domain: string;
  path: string;
  enabled: boolean;
  tier?: EntitlementTier;
  defaultItemId?: string;
}

export const OS_SHELL_REGISTRY: ShellModule[] = [
  {
    id: "inbox",
    label: "Inbox",
    icon: "inbox",
    domain: "workspace",
    path: "/workspace/inbox",
    enabled: true,
    tier: "free",
  },
  {
    id: "today",
    label: "Today",
    icon: "calendar",
    domain: "workspace",
    path: "/workspace/today",
    enabled: true,
    tier: "free",
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: "building",
    domain: "workspace",
    path: "/workspace/accounts",
    enabled: true,
    tier: "starter",
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: "users",
    domain: "workspace",
    path: "/workspace/contacts",
    enabled: true,
    tier: "starter",
  },
  {
    id: "deals",
    label: "Deals",
    icon: "dollar-sign",
    domain: "workspace",
    path: "/workspace/deals",
    enabled: true,
    tier: "starter",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: "check-square",
    domain: "workspace",
    path: "/workspace/tasks",
    enabled: true,
    tier: "free",
  },
  {
    id: "connectors",
    label: "Connectors",
    icon: "plug",
    domain: "workspace",
    path: "/workspace/connectors",
    enabled: true,
    tier: "starter",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    icon: "book",
    domain: "workspace",
    path: "/workspace/knowledge",
    enabled: true,
    tier: "starter",
  },
  {
    id: "brainstorm",
    label: "Brainstorm",
    icon: "lightbulb",
    domain: "workspace",
    path: "/workspace/brainstorm",
    enabled: true,
    tier: "free",
  },
  {
    id: "goals",
    label: "Goals",
    icon: "target",
    domain: "workspace",
    path: "/workspace/goals",
    enabled: true,
    tier: "growth",
  },
  {
    id: "accelerators",
    label: "Accelerators",
    icon: "zap",
    domain: "workspace",
    path: "/workspace/accelerators",
    enabled: true,
    tier: "growth",
  },
  {
    id: "reports",
    label: "Reports",
    icon: "bar-chart",
    domain: "workspace",
    path: "/workspace/reports",
    enabled: true,
    tier: "growth",
  },
  {
    id: "workflows",
    label: "Workflows",
    icon: "git-branch",
    domain: "workspace",
    path: "/workspace/workflows",
    enabled: true,
    tier: "growth",
  },
  {
    id: "admin",
    label: "Admin",
    icon: "settings",
    domain: "workspace",
    path: "/workspace/admin",
    enabled: true,
    tier: "starter",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: "link",
    domain: "workspace",
    path: "/workspace/integrations",
    enabled: true,
    tier: "starter",
  },
];

export function getShellModule(id: string): ShellModule | undefined {
  return OS_SHELL_REGISTRY.find((m) => m.id === id);
}

export function getEnabledModules(): ShellModule[] {
  return OS_SHELL_REGISTRY.filter((m) => m.enabled);
}

export function getModulesByTier(tier: EntitlementTier): ShellModule[] {
  const tiers: Record<EntitlementTier, number> = {
    personal: 0,
    free: 1,
    starter: 2,
    growth: 3,
    enterprise: 4,
  };

  const tierLevel = tiers[tier];
  const tierLevels: Record<EntitlementTier, number> = {
    personal: 0,
    free: 1,
    starter: 2,
    growth: 3,
    enterprise: 4,
  };

  return OS_SHELL_REGISTRY.filter((m) => {
    if (!m.tier) return true;
    return tierLevels[m.tier] <= tierLevel;
  });
}

export const OS_VIEW_CONFIGS: Record<string, ShellModule> = {
  personal: {
    id: "personal",
    label: "Personal",
    icon: "user",
    domain: "personal",
    path: "/personal",
    enabled: true,
    defaultItemId: "home",
  },
  work: {
    id: "work",
    label: "Work",
    icon: "briefcase",
    domain: "work",
    path: "/work",
    enabled: true,
    defaultItemId: "home",
  },
  accounts: {
    id: "accounts",
    label: "Accounts",
    icon: "building",
    domain: "accounts",
    path: "/accounts",
    enabled: true,
    defaultItemId: "home",
  },
  admin: {
    id: "admin",
    label: "Admin",
    icon: "settings",
    domain: "admin",
    path: "/admin",
    enabled: true,
    defaultItemId: "home",
  },
  ops: {
    id: "ops",
    label: "Operations",
    icon: "zap",
    domain: "ops",
    path: "/ops",
    enabled: true,
    defaultItemId: "home",
  },
  sales: {
    id: "sales",
    label: "Sales",
    icon: "briefcase",
    domain: "sales",
    path: "/sales",
    enabled: true,
    defaultItemId: "home",
  },
  marketing: {
    id: "marketing",
    label: "Marketing",
    icon: "megaphone",
    domain: "marketing",
    path: "/marketing",
    enabled: true,
    defaultItemId: "home",
  },
  cs: {
    id: "cs",
    label: "Customer Success",
    icon: "users",
    domain: "cs",
    path: "/cs",
    enabled: true,
    defaultItemId: "home",
  },
  projects: {
    id: "projects",
    label: "Projects",
    icon: "folder",
    domain: "projects",
    path: "/projects",
    enabled: true,
    defaultItemId: "home",
  },
};

export const OS_VIEW_ORDER: string[] = Object.keys(OS_VIEW_CONFIGS);

export const OS_NAV_ITEM_REGISTRY: NavItemConfig[] = [
  {
    id: "home",
    label: "Dashboard",
    icon: "home",
    section: "core",
    route: "/admin/home",
    view: "admin",
  },
  {
    id: "today",
    label: "Today",
    icon: "calendar",
    section: "core",
    route: "/admin/today",
    view: "admin",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: "check-square",
    section: "core",
    route: "/admin/tasks",
    view: "admin",
  },
  {
    id: "goals",
    label: "Goals",
    icon: "target",
    section: "core",
    route: "/admin/goals",
    view: "admin",
  },
  {
    id: "spine",
    label: "Spine",
    icon: "database",
    section: "intelligence",
    route: "/admin/spine",
    view: "admin",
  },
  {
    id: "context",
    label: "Context",
    icon: "file-text",
    section: "intelligence",
    route: "/admin/context",
    view: "admin",
  },
  {
    id: "brainstorming",
    label: "Brainstorming",
    icon: "book",
    section: "intelligence",
    route: "/admin/brainstorming",
    view: "admin",
  },
  {
    id: "workflows",
    label: "Workflows",
    icon: "workflow",
    section: "act",
    route: "/admin/workflows",
    view: "admin",
  },
  {
    id: "approvals",
    label: "Approvals",
    icon: "check-square",
    section: "act",
    route: "/admin/approvals",
    view: "admin",
  },
  {
    id: "audit",
    label: "Audit Trail",
    icon: "history",
    section: "govern",
    route: "/admin/audit",
    view: "admin",
  },
  {
    id: "policies",
    label: "Policies",
    icon: "shield",
    section: "govern",
    route: "/admin/policies",
    view: "admin",
  },
];

export function getNavItemByRoute(path: string): NavItemConfig | undefined {
  return OS_NAV_ITEM_REGISTRY.find((item) => path.includes(item.id));
}

export function getViewByPath(path: string): OsViewId | undefined {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return undefined;
  const firstPart = parts[0];
  if (OS_VIEW_CONFIGS[firstPart]) {
    return firstPart as OsViewId;
  }
  return undefined;
}
