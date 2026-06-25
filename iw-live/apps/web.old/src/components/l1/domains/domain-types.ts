/**
 * Domain Types — Each domain is a completely independent workspace.
 *
 * Domains are projections of the same Spine SSOT, but with
 * different sidebar nav, dashboards, and views per team context.
 */

export type DomainId =
  | "integratewise-apac"
  | "personal"
  | "account-success"
  | "revops"
  | "salesops"
  | "bizops"
  | "finance"
  | "procurement"
  | "it-admin"
  | "marketing"
  | "product-engineering"
  | "sales"
  | "service";

export interface DomainConfig {
  id: DomainId;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  gradient: string;
  accentColor: string;
  spineProjection: string; // which Spine projection to use
  suggestedConnectors: string[];
  defaultRole: string;
}

export const domainConfigs: Record<DomainId, DomainConfig> = {
  "integratewise-apac": {
    id: "integratewise-apac",
    label: "IntegrateWise APAC",
    shortLabel: "IW Console",
    description:
      "Full platform console — manage integrations, workflows, users, and all modules across your organization",
    icon: "🌏",
    gradient: "from-[var(--iw-forest)] to-[var(--iw-gold)]",
    accentColor: "var(--iw-forest-mid)",
    spineProjection: "bizops",
    suggestedConnectors: ["salesforce", "slack", "jira", "stripe", "google-workspace"],
    defaultRole: "admin",
  },
  personal: {
    id: "personal",
    label: "Personal Workspace",
    shortLabel: "Personal",
    description:
      "Your individual productivity hub — tasks, calendar, notes, goals, and personal knowledge base",
    icon: "👤",
    gradient: "from-[var(--iw-forest)] to-[var(--iw-gold)]",
    accentColor: "var(--iw-gold)",
    spineProjection: "bizops",
    suggestedConnectors: ["google-workspace", "slack", "calendly", "github"],
    defaultRole: "developer",
  },
  "account-success": {
    id: "account-success",
    label: "Account Success",
    shortLabel: "CS",
    description:
      "Customer health monitoring — account health scores, renewals, ticket tracking, and risk management",
    icon: "💚",
    gradient: "from-emerald-500 to-green-600",
    accentColor: "var(--iw-success)",
    spineProjection: "bizops",
    suggestedConnectors: ["salesforce", "zendesk", "intercom", "slack", "hubspot"],
    defaultRole: "business-ops",
  },
  revops: {
    id: "revops",
    label: "Revenue Operations",
    shortLabel: "RevOps",
    description:
      "Revenue intelligence — pipeline visibility, forecasting, quota tracking, and revenue analytics across the org",
    icon: "📈",
    gradient: "from-[var(--iw-forest)] to-[var(--iw-gold)]",
    accentColor: "var(--iw-forest-mid)",
    spineProjection: "sales",
    suggestedConnectors: ["salesforce", "hubspot", "stripe", "quickbooks", "linkedin"],
    defaultRole: "business-ops",
  },
  salesops: {
    id: "salesops",
    label: "Sales Operations",
    shortLabel: "SalesOps",
    description:
      "Sales execution hub — pipeline management, deal rooms, activity tracking, lead management, and rep performance",
    icon: "🎯",
    gradient: "from-green-500 to-emerald-600",
    accentColor: "var(--iw-sales)",
    spineProjection: "sales",
    suggestedConnectors: ["salesforce", "linkedin", "calendly", "slack", "hubspot"],
    defaultRole: "sales",
  },
  bizops: {
    id: "bizops",
    label: "Business Operations",
    shortLabel: "BizOps",
    description:
      "Cross-functional business operations — project management, workflows, and team coordination",
    icon: "⚙️",
    gradient: "from-[var(--iw-forest)] to-[var(--iw-gold)]",
    accentColor: "var(--iw-forest-mid)",
    spineProjection: "bizops",
    suggestedConnectors: ["salesforce", "slack", "jira", "notion", "google-workspace"],
    defaultRole: "business-ops",
  },
  finance: {
    id: "finance",
    label: "Finance",
    shortLabel: "Finance",
    description:
      "Financial operations — budgeting, forecasting, expense management, and financial reporting",
    icon: "💰",
    gradient: "from-emerald-500 to-green-600",
    accentColor: "var(--iw-success)",
    spineProjection: "bizops",
    suggestedConnectors: ["quickbooks", "stripe", "salesforce", "excel", "sap"],
    defaultRole: "business-ops",
  },
  procurement: {
    id: "procurement",
    label: "Procurement",
    shortLabel: "Procurement",
    description:
      "Procurement operations — vendor management, purchase orders, contracts, and sourcing",
    icon: "📦",
    gradient: "from-orange-500 to-amber-600",
    accentColor: "var(--iw-warning)",
    spineProjection: "bizops",
    suggestedConnectors: ["sap", "oracle", "salesforce", "slack", "excel"],
    defaultRole: "business-ops",
  },
  "it-admin": {
    id: "it-admin",
    label: "IT Administration",
    shortLabel: "IT Admin",
    description:
      "IT operations — asset management, access control, security, and system administration",
    icon: "🔧",
    gradient: "from-slate-500 to-gray-600",
    accentColor: "var(--iw-gray)",
    spineProjection: "bizops",
    suggestedConnectors: ["okta", "azure", "jira", "servicenow", "slack"],
    defaultRole: "admin",
  },
  marketing: {
    id: "marketing",
    label: "Marketing",
    shortLabel: "Marketing",
    description:
      "Marketing operations — campaign management, lead generation, and marketing analytics",
    icon: "📢",
    gradient: "from-pink-500 to-rose-600",
    accentColor: "var(--iw-pink)",
    spineProjection: "sales",
    suggestedConnectors: ["hubspot", "salesforce", "mailchimp", "google-ads", "slack"],
    defaultRole: "business-ops",
  },
  "product-engineering": {
    id: "product-engineering",
    label: "Product & Engineering",
    shortLabel: "Product/Eng",
    description:
      "Product and engineering operations — roadmap planning, sprint management, and development workflows",
    icon: "💻",
    gradient: "from-[var(--iw-forest)] to-[var(--iw-gold)]",
    accentColor: "var(--iw-gold)",
    spineProjection: "bizops",
    suggestedConnectors: ["jira", "github", "slack", "notion", "figma"],
    defaultRole: "developer",
  },
  sales: {
    id: "sales",
    label: "Sales",
    shortLabel: "Sales",
    description: "Sales execution — deal management, prospecting, and customer acquisition",
    icon: "🤝",
    gradient: "from-[var(--iw-forest)] to-[var(--iw-gold)]",
    accentColor: "var(--iw-forest-mid)",
    spineProjection: "sales",
    suggestedConnectors: ["salesforce", "linkedin", "calendly", "slack", "hubspot"],
    defaultRole: "sales",
  },
  service: {
    id: "service",
    label: "Customer Service",
    shortLabel: "Service",
    description:
      "Customer service operations — ticket management, support workflows, and customer satisfaction",
    icon: "🎧",
    gradient: "from-teal-500 to-cyan-600",
    accentColor: "var(--iw-teal)",
    spineProjection: "bizops",
    suggestedConnectors: ["zendesk", "intercom", "slack", "salesforce", "freshdesk"],
    defaultRole: "business-ops",
  },
};

export const domainOrder: DomainId[] = [
  "integratewise-apac",
  "personal",
  "account-success",
  "revops",
  "salesops",
  "bizops",
  "finance",
  "procurement",
  "it-admin",
  "marketing",
  "product-engineering",
  "sales",
  "service",
];

export interface DomainNavItem {
  id: string;
  label: string;
  icon: string; // lucide icon name or emoji
  badge?: string;
}
