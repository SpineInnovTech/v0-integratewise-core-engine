/**
 * Hermes Spine Memory — Core Types
 *
 * Types for:
 * - CouchDB connection configuration
 * - Namespace isolation (personal vs org)
 * - Continuity Object schemas (Understanding Objects)
 * - Twin memory context switching
 */

import { z } from "zod";

// ─── CouchDB Connection ─────────────────────────────────────────────────────

export interface CouchDbConfig {
  url: string;
  username: string;
  password: string;
}

export interface CouchDbResponse {
  ok: boolean;
  id: string;
  rev: string;
}

// ─── Namespace Isolation ────────────────────────────────────────────────────

export type MemoryScope = "personal" | "org";

export interface Namespace {
  scope: MemoryScope;
  /** e.g. user UUID for personal, tenant UUID for org */
  subjectId: string;
  /** Full namespace string: `personal:user:{id}` or `org:{tenant_id}` */
  path: string;
  /** Database name derived from namespace */
  dbName: string;
}

// ─── Core Document (all CouchDB docs inherit) ───────────────────────────────

export interface SpineDocument {
  _id: string;
  _rev?: string;
  _deleted?: boolean;
  _exp?: number; // TTL timestamp (seconds since epoch)
  type: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Continuity Object Types ────────────────────────────────────────────────

export type ContinuityObjectType =
  | "operational-realization"
  | "governance-outcome"
  | "deployment-lineage"
  | "customer-continuity-state"
  | "organizational-synthesis"
  | "continuity-transition";

export const ContinuityObjectTypeSchema = z.enum([
  "operational-realization",
  "governance-outcome",
  "deployment-lineage",
  "customer-continuity-state",
  "organizational-synthesis",
  "continuity-transition",
]);

// ─── Lineage & References ───────────────────────────────────────────────────

export interface LineageEntry {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  /** Optional: how this entry contributed to the object */
  contribution?: string;
}

export interface ObjectReference {
  refType: "entity" | "document" | "session" | "task" | "decision" | "signal";
  refId: string;
  /** Optional human-readable label */
  label?: string;
}

// ─── Continuity Object (Understanding Object) ───────────────────────────────

export interface ContinuityObject extends SpineDocument {
  type: ContinuityObjectType;
  /** Domain classification (e.g. "revenue", "product", "cs", "governance") */
  domain: string;
  /** Primary content payload — shape varies by type */
  content: unknown;
  /** Audit trail of events that formed this object */
  lineage: LineageEntry[];
  /** Cross-references to Spine entities, sessions, tasks, etc. */
  references: ObjectReference[];
  /** Namespace scope */
  scope: MemoryScope;
  /** User who owns or created this object */
  userId: string;
  /** Tenant/org identifier (always present for org scope, optional for personal) */
  tenantId?: string;
  /** Semantic version of the object schema */
  schemaVersion: string;
  /** Free-form tags for discovery */
  tags?: string[];
}

// ─── Object Type-Specific Content Shapes (documentary, not enforced at runtime) ─

export interface OperationalRealizationContent {
  realization: string; // What was learned / achieved
  capability: string; // Which capability this advances
  evidence: string[]; // Supporting data points
  confidence: number; // 0.0–1.0
}

export interface GovernanceOutcomeContent {
  decision: string;
  rationale: string;
  approvedBy?: string;
  effectiveDate?: string;
  expirationDate?: string;
  status: "proposed" | "approved" | "rejected" | "superseded";
}

export interface DeploymentLineageContent {
  artifact: string; // What was deployed
  version: string;
  environment: string;
  deployedBy: string;
  rollbackHash?: string;
  verificationResults?: Record<string, unknown>;
}

export interface CustomerContinuityStateContent {
  customerId: string;
  healthScore: number;
  lastTouchpoint: string;
  activeRisks: string[];
  openOpportunities: string[];
  nextBestAction?: string;
}

export interface OrganizationalSynthesisContent {
  theme: string;
  insights: string[];
  recommendedActions: string[];
  stakeholderIds: string[];
  timeframe: { from: string; to: string };
}

export interface ContinuityTransitionContent {
  fromState: string;
  toState: string;
  trigger: string;
  impactedEntities: string[];
  handoffNotes?: string;
}

// ─── Mango Query Types ──────────────────────────────────────────────────────

export interface MangoSelector {
  [key: string]: unknown;
}

export interface MangoQueryOptions {
  sort?: Record<string, "asc" | "desc">[];
  limit?: number;
  skip?: number;
  use_index?: string;
  fields?: string[];
  bookmark?: string;
}

export interface MangoQueryResult<T> {
  docs: T[];
  bookmark?: string;
  warning?: string;
}

// ─── View Query Types ───────────────────────────────────────────────────────

export interface ViewQueryOptions {
  startkey?: unknown;
  endkey?: unknown;
  key?: unknown;
  keys?: unknown[];
  descending?: boolean;
  limit?: number;
  skip?: number;
  include_docs?: boolean;
}

export interface ViewQueryResult<T> {
  rows: Array<{
    id: string;
    key: unknown;
    value: unknown;
    doc?: T;
  }>;
  total_rows?: number;
  offset?: number;
}

// ─── Twin Memory Context ────────────────────────────────────────────────────

export interface TwinMemoryContext {
  /** Which memory namespace to query */
  scope: MemoryScope;
  /** User ID (always required) */
  userId: string;
  /** Tenant ID (required for org scope) */
  tenantId?: string;
  /** Optional entity to scope within */
  entityId?: string;
  /** Optional domain filter */
  domain?: string;
  /** Maximum memories to load */
  limit?: number;
}

export interface TwinMemoryPayload {
  memories: ContinuityObject[];
  total: number;
  scope: MemoryScope;
  /** Whether a context switch occurred */
  switched: boolean;
  /** Previous scope if switched */
  previousScope?: MemoryScope;
}

// ─── Namespace Resolution Input ─────────────────────────────────────────────

export interface ResolveNamespaceInput {
  scope: MemoryScope;
  userId: string;
  tenantId?: string;
}
