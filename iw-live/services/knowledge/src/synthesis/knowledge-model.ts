/**
 * Knowledge Model — Domain Structure
 *
 * Defines the canonical knowledge organization for IntegrateWise.
 *
 * Hierarchy:
 *   /{domain}/triage              → Working area (UnderstandingObject drafts)
 *   /{domain}/knowledge-persisted → Canonical approved knowledge
 *   /{domain}/references          → Cross-domain links and citations
 *
 * Domains (12 total):
 *   executive, product, engineering, design, ai-operations,
 *   business-operations, sales, marketing, customer-success,
 *   finance, research-and-continuity, infrastructure-and-security
 */

import type { KnowledgeDomain } from "./triage-bot";

// ─── Domain Registry ────────────────────────────────────────────────────────

export const KNOWLEDGE_DOMAINS: KnowledgeDomain[] = [
  "executive",
  "product",
  "engineering",
  "design",
  "ai-operations",
  "business-operations",
  "sales",
  "marketing",
  "customer-success",
  "finance",
  "research-and-continuity",
  "infrastructure-and-security",
];

export const DOMAIN_DISPLAY_NAMES: Record<KnowledgeDomain, string> = {
  executive: "Executive",
  product: "Product",
  engineering: "Engineering",
  design: "Design",
  "ai-operations": "AI Operations",
  "business-operations": "Business Operations",
  sales: "Sales",
  marketing: "Marketing",
  "customer-success": "Customer Success",
  finance: "Finance",
  "research-and-continuity": "Research & Continuity",
  "infrastructure-and-security": "Infrastructure & Security",
};

// ─── Path Builders ──────────────────────────────────────────────────────────

export function triagePath(domain: KnowledgeDomain, objectId: string): string {
  return `/${domain}/triage/${objectId}`;
}

export function knowledgePersistedPath(domain: KnowledgeDomain, objectId: string): string {
  return `/${domain}/knowledge-persisted/${objectId}`;
}

export function referencesPath(domain: KnowledgeDomain, referenceId: string): string {
  return `/${domain}/references/${referenceId}`;
}

export function domainPath(domain: KnowledgeDomain): string {
  return `/${domain}`;
}

// ─── Domain Guards ──────────────────────────────────────────────────────────

export function isValidDomain(domain: string): domain is KnowledgeDomain {
  return KNOWLEDGE_DOMAINS.includes(domain as KnowledgeDomain);
}

export function assertValidDomain(domain: string): KnowledgeDomain {
  if (!isValidDomain(domain)) {
    throw new Error(`Invalid knowledge domain: ${domain}`);
  }
  return domain;
}

// ─── Domain Metadata ────────────────────────────────────────────────────────

export interface DomainMetadata {
  domain: KnowledgeDomain;
  displayName: string;
  requiresGovernance: boolean;
  autoApproveEnabled: boolean;
  defaultTtlDays: number;
  color: string; // For UI theming
}

export const DOMAIN_METADATA: Record<KnowledgeDomain, DomainMetadata> = {
  executive: {
    domain: "executive",
    displayName: "Executive",
    requiresGovernance: true,
    autoApproveEnabled: false,
    defaultTtlDays: 365,
    color: "#8B5CF6",
  },
  product: {
    domain: "product",
    displayName: "Product",
    requiresGovernance: false,
    autoApproveEnabled: true,
    defaultTtlDays: 180,
    color: "#F59E0B",
  },
  engineering: {
    domain: "engineering",
    displayName: "Engineering",
    requiresGovernance: false,
    autoApproveEnabled: true,
    defaultTtlDays: 180,
    color: "#3B82F6",
  },
  design: {
    domain: "design",
    displayName: "Design",
    requiresGovernance: false,
    autoApproveEnabled: true,
    defaultTtlDays: 180,
    color: "#EC4899",
  },
  "ai-operations": {
    domain: "ai-operations",
    displayName: "AI Operations",
    requiresGovernance: true,
    autoApproveEnabled: false,
    defaultTtlDays: 90,
    color: "#10B981",
  },
  "business-operations": {
    domain: "business-operations",
    displayName: "Business Operations",
    requiresGovernance: false,
    autoApproveEnabled: true,
    defaultTtlDays: 180,
    color: "#6366F1",
  },
  sales: {
    domain: "sales",
    displayName: "Sales",
    requiresGovernance: false,
    autoApproveEnabled: true,
    defaultTtlDays: 180,
    color: "#EF4444",
  },
  marketing: {
    domain: "marketing",
    displayName: "Marketing",
    requiresGovernance: false,
    autoApproveEnabled: true,
    defaultTtlDays: 180,
    color: "#F97316",
  },
  "customer-success": {
    domain: "customer-success",
    displayName: "Customer Success",
    requiresGovernance: false,
    autoApproveEnabled: true,
    defaultTtlDays: 180,
    color: "#06B6D4",
  },
  finance: {
    domain: "finance",
    displayName: "Finance",
    requiresGovernance: true,
    autoApproveEnabled: false,
    defaultTtlDays: 365,
    color: "#14B8A6",
  },
  "research-and-continuity": {
    domain: "research-and-continuity",
    displayName: "Research & Continuity",
    requiresGovernance: true,
    autoApproveEnabled: false,
    defaultTtlDays: 365,
    color: "#64748B",
  },
  "infrastructure-and-security": {
    domain: "infrastructure-and-security",
    displayName: "Infrastructure & Security",
    requiresGovernance: true,
    autoApproveEnabled: false,
    defaultTtlDays: 365,
    color: "#1E293B",
  },
};

// ─── Storage Interface (to be implemented by backend) ───────────────────────

export interface KnowledgeStore {
  // Triage working area
  saveTriageDraft(domain: KnowledgeDomain, object: unknown): Promise<string>;
  getTriageDraft(domain: KnowledgeDomain, objectId: string): Promise<unknown | null>;
  listTriageDrafts(
    domain: KnowledgeDomain,
    opts?: { status?: string; limit?: number }
  ): Promise<unknown[]>;

  // Persisted knowledge
  savePersisted(domain: KnowledgeDomain, object: unknown): Promise<string>;
  getPersisted(domain: KnowledgeDomain, objectId: string): Promise<unknown | null>;
  searchPersisted(domain: KnowledgeDomain, query: string): Promise<unknown[]>;

  // References
  saveReference(domain: KnowledgeDomain, reference: unknown): Promise<string>;
  getReferences(domain: KnowledgeDomain, objectId: string): Promise<unknown[]>;

  // Cross-domain
  listDomains(): Promise<KnowledgeDomain[]>;
  getDomainStats(domain: KnowledgeDomain): Promise<DomainStats>;
}

export interface DomainStats {
  domain: KnowledgeDomain;
  triageCount: number;
  persistedCount: number;
  referenceCount: number;
  lastUpdatedAt: string;
}
