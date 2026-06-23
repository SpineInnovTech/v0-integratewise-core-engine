/**
 * IntegrateWise Architecture Contracts
 *
 * Every entity, view, and metric traces to org growth or client outcomes.
 * Org Types: PRODUCT (product-led growth) | SERVICES (service delivery excellence) | HYBRID
 */

export type OrgType = "PRODUCT" | "SERVICES" | "HYBRID";

export type CTXEnum =
  | "CTX_CS"
  | "CTX_SALES"
  | "CTX_SUPPORT"
  | "CTX_PM"
  | "CTX_MARKETING"
  | "CTX_BIZOPS"
  | "CTX_TECH"
  | "CTX_HR"
  | "CTX_FINANCE"
  | "CTX_LEGAL"
  | "CTX_PERSONAL";

export type L1Module =
  | "Home"
  | "Hub Home"
  | "Today"
  | "Projects"
  | "Accounts"
  | "Account Health"
  | "Account Team"
  | "Contacts"
  | "Meetings"
  | "Docs"
  | "Tasks"
  | "Tasks & Actions"
  | "Calendar"
  | "Notes"
  | "Knowledge Space"
  | "Knowledge Hub"
  | "Team"
  | "Pipeline"
  | "Risks"
  | "Expansion"
  | "Analytics"
  | "Integrations"
  | "AI Chat"
  | "Settings"
  | "Subscriptions"
  | "Profile"
  | "Campaigns"
  | "Workflows"
  | "Deals"
  | "Forecasting"
  | "Activities"
  | "Quotes"
  | "Attribution"
  | "Forms"
  | "Social"
  | "Email Studio"
  | "Blog"
  | "SEO"
  | "Media Library"
  | "Pages"
  | "Theme"
  | "Website"
  | "RBAC"
  | "Approvals"
  | "Admin";

export type L2Component =
  | "SpineUI"
  | "ContextUI"
  | "KnowledgeUI"
  | "Evidence Drawer"
  | "Signals"
  | "Think"
  | "Act"
  | "HITL"
  | "Govern"
  | "Adjust"
  | "Repeat"
  | "Audit Trail"
  | "Agent Config"
  | "Digital Twin";

export interface GoalRef {
  id: string;
  type: "CLIENT" | "BUSINESS" | "USER";
  label: string;
  weight: number;
  orgType?: OrgType;
  impact?: "HIGH" | "MEDIUM" | "LOW";
  alignmentScore?: number;
}

export interface ApprovalToken {
  token: string;
  issuedAt: string;
  expiresAt: string;
  scope: string[];
  governId: string;
}

export interface HITLProposal {
  id: string;
  action: string;
  reasoning: string;
  confidence: number;
  goalImpact: number;
  status: "PENDING" | "APPROVED" | "DENIED" | "REVISED";
  token?: ApprovalToken;
}

export interface SpineEntity {
  id: string;
  type: string;
  goal_refs: string[];
  provenance: any;
  data: Record<string, any>;
}

export interface ViewContext {
  activeCtx: CTXEnum;
  viewMode: "PERSONAL" | "ACCOUNT" | "BUSINESS";
  activeGoalId?: string;
  inheritancePath: string[];
  orgType?: OrgType;
  activeLens?: "PROVIDER" | "CLIENT";
}

export type ViewMode = "personal" | "work" | "project";

export interface IntelligenceAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  source: string;
  timestamp: string;
  actionLabel?: string;
  dismissed?: boolean;
}
