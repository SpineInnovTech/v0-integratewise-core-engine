/**
 * BizOps — Complete 14-Module Data Types
 * Mirrors the V0 schema. All data fetched via useWorkspaceEntities / useHydrateProjection.
 */

// ─── 1. HOME / DASHBOARD ────────────────────────────────────────────────────
export interface BizOpsActivity {
  id: string;
  action: string;
  entity: string;
  module: string;
  timestamp: string;
  user: string;
}

// ─── 2. STRATEGIC HUB ───────────────────────────────────────────────────────
export interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  progress: number; // 0-100
  status: "on-track" | "at-risk" | "behind" | "completed";
  owner: string;
  dueDate: string;
  linkedModules: string[];
}

export interface CompanyValue {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ConnectedTool {
  id: string;
  name: string;
  category: string;
  status: "connected" | "error" | "paused" | "pending";
  lastSync: string;
  recordCount: number;
}

export interface MarketingStrategy {
  icp: string;
  positioning: string;
  messaging: string;
  channels: string[];
  updatedAt: string;
}

export interface ROIMapping {
  initiative: string;
  investment: number;
  revenue: number;
  effort: "low" | "medium" | "high";
  roi: number;
  status: "active" | "planned" | "completed";
}

// ─── 3. METRICS DASHBOARD ───────────────────────────────────────────────────
export interface BizMetric {
  id: string;
  name: string;
  value: number;
  unit: "currency" | "count" | "percentage" | "text";
  change: number; // % change
  changeDirection: "up" | "down" | "flat";
  source: string;
  updatedAt: string;
}

export interface AIBusinessInsight {
  id: string;
  signal: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
  module: string;
  generatedAt: string;
  status: "new" | "acknowledged" | "actioned" | "dismissed";
}

// ─── 4. BRAINSTORMING ───────────────────────────────────────────────────────
export interface BrainstormSession {
  id: string;
  title: string;
  createdAt: string;
  participants: string[];
  aiProviders: ("claude" | "gpt" | "grok")[];
  insightCount: number;
  actionCount: number;
  status: "active" | "archived";
}

export interface BrainstormThread {
  id: string;
  sessionId: string;
  provider: "claude" | "gpt" | "grok";
  messages: { role: "user" | "assistant"; content: string; timestamp: string }[];
}

export interface SignalDecisionLink {
  signalId: string;
  signalTitle: string;
  decisionId: string;
  decisionTitle: string;
  taskIds: string[];
  createdAt: string;
}

// ─── 5. WEBSITE MANAGER ─────────────────────────────────────────────────────
export interface WebPage {
  id: string;
  name: string;
  url: string;
  status: "published" | "draft" | "archived";
  visitors: number;
  conversions: number;
  conversionRate: number;
  updatedAt: string;
}

export interface WebForm {
  id: string;
  name: string;
  page: string;
  submissions: number;
  conversionRate: number;
  lastSubmission: string;
}

export interface SEOData {
  organicVisitors: number;
  topKeywords: { keyword: string; position: number; volume: number }[];
  backlinks: number;
  domainAuthority: number;
}

// ─── 6. CRM ─────────────────────────────────────────────────────────────────
export type LeadStage = "new" | "contacted" | "qualified" | "converted" | "lost";
export type LeadSource = "linkedin" | "website" | "referral" | "inbound" | "outbound" | "other";

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  source: LeadSource;
  stage: LeadStage;
  score: number; // 0-100
  value: number;
  assignedTo: string;
  createdAt: string;
  lastActivity: string;
  activities: CRMActivity[];
}

export interface CRMActivity {
  id: string;
  leadId: string;
  type: "call" | "email" | "meeting" | "note";
  summary: string;
  timestamp: string;
  user: string;
}

// ─── 7. MARKETING ───────────────────────────────────────────────────────────
export type ContentType = "article" | "video" | "ebook" | "guide" | "case-study" | "social";
export type ContentStatus = "draft" | "review" | "published" | "archived";

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  publishDate: string;
  channel: string;
  views: number;
  conversions: number;
  author: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: string;
  budget: number;
  spent: number;
  leads: number;
  revenue: number;
  roi: number;
  status: "active" | "paused" | "completed" | "draft";
  startDate: string;
  endDate: string;
}

export interface LinkedInMetrics {
  followers: number;
  followerGrowth: number;
  avgEngagement: number;
  topPost: { content: string; likes: number; comments: number; shares: number };
}

// ─── 8. PRODUCTS ────────────────────────────────────────────────────────────
export type ProductTier = "professional" | "recurring" | "scalable" | "saas" | "digital";

export interface Product {
  id: string;
  name: string;
  tier: ProductTier;
  price: number;
  billingCycle: "one-time" | "monthly" | "annual";
  status: "active" | "beta" | "deprecated" | "coming-soon";
  description: string;
  features: string[];
  activeSubscriptions: number;
  mrr: number;
}

// ─── 9. SERVICES ────────────────────────────────────────────────────────────
export type ServiceTier =
  | "assessment"
  | "implementation-s"
  | "implementation-m"
  | "implementation-l"
  | "retainer-bronze"
  | "retainer-silver"
  | "retainer-gold"
  | "retainer-platinum";

export interface Service {
  id: string;
  name: string;
  tier: ServiceTier;
  price: number;
  duration: string;
  deliverables: string[];
  sla: string;
  status: "active" | "draft" | "deprecated";
  activeEngagements: number;
  revenue: number;
}

// ─── 10. SALES HUB ──────────────────────────────────────────────────────────
export type DealStage = "discovery" | "qualification" | "proposal" | "negotiation" | "won" | "lost";

export interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: DealStage;
  probability: number;
  closeDate: string;
  owner: string;
  createdAt: string;
  lastActivity: string;
  linkedLeadId?: string;
}

export interface SalesMetrics {
  winRate: number;
  avgDealSize: number;
  salesVelocity: number; // deals × winRate × ACV / cycleDays
  pipelineValue: number;
  closedWonMTD: number;
  avgCycleDays: number;
}

// ─── 11. CLIENTS ────────────────────────────────────────────────────────────
export type ClientHealth = "healthy" | "at-risk" | "critical";

export interface Client {
  id: string;
  name: string;
  industry: string;
  arr: number;
  mrr: number;
  healthScore: number;
  health: ClientHealth;
  contractStart: string;
  contractEnd: string;
  csm: string;
  activeProjects: number;
  openTickets: number;
  lastEngagement: string;
  nps: number | null;
}

// ─── 12. TASKS ──────────────────────────────────────────────────────────────
// Already in tasks-view.tsx — reuse Task interface

// ─── 13. KNOWLEDGE HUB ──────────────────────────────────────────────────────
export type KnowledgeCategory = "branding" | "legal" | "credentials" | "support" | "it" | "finance";

export interface KnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  type: "file" | "link" | "note" | "template";
  description: string;
  url?: string;
  tags: string[];
  updatedAt: string;
  updatedBy: string;
  access: "public" | "team" | "private";
}

// ─── 14. DATA SOURCES ───────────────────────────────────────────────────────
export interface DataSource {
  id: string;
  name: string;
  type:
    | "communication"
    | "crm"
    | "billing"
    | "data"
    | "social"
    | "analytics"
    | "ai"
    | "email"
    | "knowledge";
  status: "connected" | "error" | "paused" | "pending";
  lastSync: string;
  recordCount: number;
  webhookEnabled: boolean;
  mcpEnabled: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

export function healthColor(h: ClientHealth | string): string {
  if (h === "healthy") return "var(--iw-success)";
  if (h === "at-risk") return "var(--iw-warning)";
  return "var(--iw-danger)";
}

export function stageColor(stage: DealStage | LeadStage): string {
  const map: Record<string, string> = {
    new: "var(--iw-forest-mid)",
    contacted: "var(--iw-purple)",
    qualified: "var(--iw-warning)",
    converted: "var(--iw-success)",
    won: "var(--iw-success)",
    lost: "var(--iw-danger)",
    discovery: "var(--iw-forest-mid)",
    qualification: "var(--iw-purple)",
    proposal: "var(--iw-warning)",
    negotiation: "#b8943f",
  };
  return map[stage] || "var(--muted-foreground)";
}
