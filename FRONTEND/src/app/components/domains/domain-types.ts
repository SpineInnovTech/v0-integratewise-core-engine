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
  | "salesops";

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
    gradient: "from-blue-500 to-indigo-600",
    accentColor: "var(--iw-blue)",
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
    gradient: "from-violet-500 to-purple-600",
    accentColor: "var(--iw-purple)",
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
    gradient: "from-cyan-500 to-blue-600",
    accentColor: "var(--iw-blue)",
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
};

export const domainOrder: DomainId[] = [
  "integratewise-apac",
  "personal",
  "account-success",
  "revops",
  "salesops",
];

export interface DomainNavItem {
  id: string;
  label: string;
  icon: string; // lucide icon name or emoji
  badge?: string;
}
