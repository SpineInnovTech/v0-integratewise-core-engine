export type DocumentStatus = "locked" | "drafted" | "inprogress" | "pending" | "na";
export type DocumentPriority = "critical" | "high" | "medium" | "low";
export type DocumentCategory = "public" | "internal" | "strategy";

export interface DocumentRegistryEntry {
  doc_id: string;
  title: string;
  category: DocumentCategory;
  subcategory: string;
  description: string;
  status: DocumentStatus;
  priority: DocumentPriority;
  tags: string[];
  linked?: string;
  owner?: string;
  schema_version?: number;
  content: string;
}

export interface DocumentOverrides {
  status?: DocumentStatus;
  priority?: DocumentPriority;
  notes?: string;
  linked?: string;
  content?: string;
}

export type DocumentViewId =
  | "all"
  | "public"
  | "public-product"
  | "public-docs"
  | "public-gtm"
  | "public-support"
  | "internal"
  | "internal-arch"
  | "internal-ops"
  | "internal-ai"
  | "internal-org"
  | "strategy"
  | "strategy-vision"
  | "strategy-market"
  | "strategy-platform"
  | "status-locked"
  | "status-drafted"
  | "status-inprogress"
  | "status-pending";

export interface SidebarNavItem {
  id: DocumentViewId;
  label: string;
  section: string;
  icon?: string;
  dotColor?: string;
}

export const DOCUMENT_VIEWS: Record<DocumentViewId, { title: string; description: string }> = {
  all: {
    title: "All Documents",
    description: "Complete document governance across public, internal, and strategy",
  },
  public: {
    title: "Public Docs",
    description: "Customer-facing and ecosystem-visible information",
  },
  "public-product": {
    title: "Product & Website",
    description: "Product overview, website, features, pricing",
  },
  "public-docs": { title: "Documentation", description: "API docs, integration guides, tutorials" },
  "public-gtm": {
    title: "GTM & Sales",
    description: "Sales collateral, case studies, brand assets",
  },
  "public-support": {
    title: "Support & Community",
    description: "Security, compliance, FAQ, knowledge base",
  },
  internal: { title: "Internal Docs", description: "Operational and proprietary knowledge" },
  "internal-arch": {
    title: "Architecture & Engineering",
    description: "System architecture, data models, infrastructure",
  },
  "internal-ops": { title: "Operations & DevOps", description: "Deployment, runbooks, monitoring" },
  "internal-ai": {
    title: "AI & Cognition",
    description: "Cognitive layer, governance, agent orchestration",
  },
  "internal-org": { title: "Organizational", description: "SOPs, onboarding, org structure" },
  strategy: { title: "Strategy Docs", description: "Decision-making and competitive thinking" },
  "strategy-vision": {
    title: "Vision & Direction",
    description: "Vision, founder thesis, messaging",
  },
  "strategy-market": {
    title: "Market & GTM Strategy",
    description: "Product strategy, monetization, positioning",
  },
  "strategy-platform": {
    title: "Platform & Technical Strategy",
    description: "AI, platform, memory, continuity strategies",
  },
  "status-locked": {
    title: "Locked Documents",
    description: "Finalized and approved — source of truth",
  },
  "status-drafted": { title: "Drafted Documents", description: "Written but not yet finalized" },
  "status-inprogress": { title: "In Progress", description: "Actively being worked on" },
  "status-pending": {
    title: "Pending Documents",
    description: "Not yet created — awaiting prioritization",
  },
};

export const SUBCATEGORY_LABELS: Record<string, string> = {
  "public-product": "Product & Website",
  "public-docs": "Documentation",
  "public-gtm": "GTM & Sales",
  "public-support": "Support & Community",
  "internal-arch": "Architecture & Engineering",
  "internal-ops": "Operations & DevOps",
  "internal-ai": "AI & Cognition",
  "internal-org": "Organizational",
  "strategy-vision": "Vision & Direction",
  "strategy-market": "Market & GTM Strategy",
  "strategy-platform": "Platform & Technical Strategy",
};
