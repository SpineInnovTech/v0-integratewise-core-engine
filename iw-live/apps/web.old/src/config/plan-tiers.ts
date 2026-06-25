export interface PlanTier {
  id: string;
  name: string;
  price?: number;
  priceMonthly?: number | null;
  priceAnnual?: number | null;
  seats?: number;
  connectors?: number;
  aiTokens?: number;
  features: Record<string, boolean | string>;
  limits?: {
    users?: number | null;
    integrations?: number | null;
    aiSessions?: number | null;
    storageGb?: number | null;
  };
  highlighted?: boolean;
  tagline?: string;
}

export const PLAN_TIERS: PlanTier[] = [
  {
    id: "personal",
    name: "Personal",
    priceMonthly: 0,
    priceAnnual: 0,
    seats: 1,
    connectors: 1,
    aiTokens: 1000,
    tagline: "Just for you",
    highlighted: false,
    limits: {
      users: 1,
      integrations: 1,
      aiSessions: 3,
      storageGb: 0.5,
    },
    features: {
      workspace: true,
      brainstorm: true,
      connectors: false,
      knowledge: false,
      accelerators: false,
      goals: false,
      workflows: false,
      admin: false,
      roles: false,
      "audit-logs": false,
    },
  },
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    seats: 1,
    connectors: 1,
    aiTokens: 5000,
    tagline: "Get started",
    highlighted: false,
    limits: {
      users: 1,
      integrations: 1,
      aiSessions: 5,
      storageGb: 1,
    },
    features: {
      workspace: true,
      brainstorm: true,
      connectors: false,
      knowledge: false,
      accelerators: false,
      goals: false,
      workflows: false,
      admin: false,
      roles: false,
      "audit-logs": false,
    },
  },
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 29,
    priceAnnual: 319,
    seats: 5,
    connectors: 3,
    aiTokens: 50000,
    tagline: "For growing teams",
    highlighted: true,
    limits: {
      users: 5,
      integrations: 3,
      aiSessions: 50,
      storageGb: 10,
    },
    features: {
      workspace: true,
      brainstorm: true,
      connectors: true,
      knowledge: true,
      accelerators: true,
      goals: "basic",
      workflows: false,
      admin: true,
      roles: false,
      "audit-logs": false,
    },
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 79,
    priceAnnual: 869,
    seats: 20,
    connectors: 10,
    aiTokens: 200000,
    tagline: "Scale your operations",
    highlighted: false,
    limits: {
      users: 20,
      integrations: 10,
      aiSessions: 200,
      storageGb: 100,
    },
    features: {
      workspace: true,
      brainstorm: true,
      connectors: true,
      knowledge: true,
      accelerators: true,
      goals: true,
      workflows: true,
      admin: true,
      roles: true,
      "audit-logs": true,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: null,
    priceAnnual: null,
    tagline: "Custom solutions",
    highlighted: false,
    limits: {
      users: null,
      integrations: null,
      aiSessions: null,
      storageGb: null,
    },
    features: {
      workspace: true,
      brainstorm: true,
      connectors: true,
      knowledge: true,
      accelerators: true,
      goals: true,
      workflows: true,
      admin: "governed",
      roles: true,
      "audit-logs": true,
    },
  },
];

export interface FeatureCategory {
  label?: string;
  name?: string;
  key?: string;
  features: string[];
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    label: "Core",
    key: "core",
    features: ["workspace", "brainstorm"],
  },
  {
    label: "Integrations",
    key: "integrations",
    features: ["connectors", "integrations"],
  },
  {
    label: "Intelligence",
    key: "intelligence",
    features: ["knowledge", "accelerators", "goals", "workflows"],
  },
  {
    label: "Admin",
    key: "admin",
    features: ["admin", "roles", "audit-logs"],
  },
];

export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  workspace: "Personal workspace and team collaboration",
  brainstorm: "AI-powered brainstorming and ideation",
  connectors: "Connect external tools and data sources",
  knowledge: "Knowledge base and document management",
  integrations: "Pre-built integrations with popular apps",
  accelerators: "Workflow automation and acceleration",
  goals: "Goal setting and tracking",
  workflows: "Custom workflow builder",
  admin: "Advanced admin controls",
  roles: "Custom role and permission management",
  "audit-logs": "Comprehensive audit logging",
};

export function getPlanTier(id: string): PlanTier | undefined {
  return PLAN_TIERS.find((t) => t.id === id);
}

export function getPlanLimits(tierId: string) {
  const tier = getPlanTier(tierId);
  return tier || PLAN_TIERS[0];
}

export function hasFeature(tierId: string, feature: string): boolean {
  const tier = getPlanTier(tierId);
  if (!tier) return false;
  return tier.features["*"] === true || tier.features[feature] === true;
}
