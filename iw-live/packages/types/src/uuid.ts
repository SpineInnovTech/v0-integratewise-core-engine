/**
 * IntegrateWise - UUID Type System
 *
 * This module provides branded UUID types for compile-time type safety.
 * All entity IDs in the system should use these branded types to ensure
 * type-safe ID handling across services, APIs, and UI components.
 *
 * @module @integratewise/types/uuid
 */

// ============================================
// BRANDED TYPE FOUNDATION
// ============================================

declare const __brand: unique symbol;

/**
 * Brand utility type for creating nominal types
 */
type Brand<T, B extends string> = T & { readonly [__brand]: B };

// ============================================
// CORE UUID TYPES
// ============================================

/**
 * Generic UUID type - use for untyped UUIDs or when entity type is unknown
 */
export type UUID = Brand<string, "UUID">;

/**
 * Tenant identifier - root entity for multi-tenancy
 */
export type TenantId = Brand<string, "TenantId">;

/**
 * User identifier - authenticated user
 */
export type UserId = Brand<string, "UserId">;

/**
 * Workspace identifier - user's workspace
 */
export type WorkspaceId = Brand<string, "WorkspaceId">;

// ============================================
// ENTITY UUID TYPES
// ============================================

/**
 * Account identifier - customer/account in the system
 */
export type AccountId = Brand<string, "AccountId">;

/**
 * Stakeholder identifier - contact/person at an account
 */
export type StakeholderId = Brand<string, "StakeholderId">;

/**
 * Deal/Opportunity identifier
 */
export type DealId = Brand<string, "DealId">;

/**
 * Project identifier
 */
export type ProjectId = Brand<string, "ProjectId">;

/**
 * Spine Entity identifier - unified entity in spine
 */
export type SpineEntityId = Brand<string, "SpineEntityId">;

/**
 * Canonical Entity identifier - resolved/merged entity
 */
export type CanonicalEntityId = Brand<string, "CanonicalEntityId">;

// ============================================
// FLOW & SIGNAL UUID TYPES
// ============================================

/**
 * Signal identifier - detected signal/event
 */
export type SignalId = Brand<string, "SignalId">;

/**
 * Situation identifier - aggregated context
 */
export type SituationId = Brand<string, "SituationId">;

/**
 * Evidence identifier - supporting evidence item
 */
export type EvidenceId = Brand<string, "EvidenceId">;

/**
 * Insight identifier - AI-generated insight
 */
export type InsightId = Brand<string, "InsightId">;

// ============================================
// EXECUTION UUID TYPES
// ============================================

/**
 * Proposal identifier - proposed action
 */
export type ProposalId = Brand<string, "ProposalId">;

/**
 * Execution identifier - execution attempt
 */
export type ExecutionId = Brand<string, "ExecutionId">;

/**
 * Action identifier - action template
 */
export type ActionId = Brand<string, "ActionId">;

/**
 * Approval identifier - approval request
 */
export type ApprovalId = Brand<string, "ApprovalId">;

/**
 * Policy identifier - governance policy
 */
export type PolicyId = Brand<string, "PolicyId">;

// ============================================
// SESSION & MEMORY UUID TYPES
// ============================================

/**
 * Session identifier - user session
 */
export type SessionId = Brand<string, "SessionId">;

/**
 * MCP Session identifier - MCP connection session
 */
export type MCPSessionId = Brand<string, "MCPSessionId">;

/**
 * Memory identifier - memory object
 */
export type MemoryId = Brand<string, "MemoryId">;

/**
 * Summary identifier - aggregated summary
 */
export type SummaryId = Brand<string, "SummaryId">;

// ============================================
// KNOWLEDGE UUID TYPES
// ============================================

/**
 * Document identifier - knowledge document
 */
export type DocumentId = Brand<string, "DocumentId">;

/**
 * Chunk identifier - document chunk for embedding
 */
export type ChunkId = Brand<string, "ChunkId">;

/**
 * Topic identifier - knowledge topic
 */
export type TopicId = Brand<string, "TopicId">;

// ============================================
// INTEGRATION UUID TYPES
// ============================================

/**
 * Connector identifier - integration connector instance
 */
export type ConnectorId = Brand<string, "ConnectorId">;

/**
 * Webhook identifier - webhook registration
 */
export type WebhookId = Brand<string, "WebhookId">;

/**
 * Sync identifier - sync job
 */
export type SyncId = Brand<string, "SyncId">;

/**
 * Event identifier - raw event
 */
export type EventId = Brand<string, "EventId">;

// ============================================
// CORRECTION & LEARNING UUID TYPES
// ============================================

/**
 * Correction identifier - correction event
 */
export type CorrectionId = Brand<string, "CorrectionId">;

/**
 * Learning Signal identifier
 */
export type LearningSignalId = Brand<string, "LearningSignalId">;

// ============================================
// AUDIT UUID TYPES
// ============================================

/**
 * Audit Log Entry identifier
 */
export type AuditLogId = Brand<string, "AuditLogId">;

/**
 * Risk Registry Entry identifier
 */
export type RiskId = Brand<string, "RiskId">;

/**
 * Decision identifier - for audit trail of decisions
 */
export type DecisionId = Brand<string, "DecisionId">;

/**
 * Correlation identifier - links between evidence/entities
 */
export type CorrelationId = Brand<string, "CorrelationId">;

// ============================================
// VALIDATION & UTILITIES
// ============================================

/**
 * UUID v4 regex pattern
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * UUID v7 regex pattern (time-sortable)
 */
const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Generic UUID regex pattern (v1-v7)
 */
const UUID_GENERIC_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID (any version)
 */
export function isUUID(value: unknown): value is UUID {
  return typeof value === "string" && UUID_GENERIC_REGEX.test(value);
}

/**
 * Check if a string is a valid UUID v4
 */
export function isUUIDv4(value: unknown): value is UUID {
  return typeof value === "string" && UUID_V4_REGEX.test(value);
}

/**
 * Check if a string is a valid UUID v7
 */
export function isUUIDv7(value: unknown): value is UUID {
  return typeof value === "string" && UUID_V7_REGEX.test(value);
}

/**
 * Convert a string to a generic UUID with validation
 * @throws Error if the string is not a valid UUID
 */
export function toUUID(value: string): UUID {
  if (!isUUID(value)) {
    throw new Error(`Invalid UUID: ${value}`);
  }
  return value as UUID;
}

/**
 * Convert a string to a UUID, returning null if invalid
 */
export function tryToUUID(value: string | null | undefined): UUID | null {
  if (value == null || !isUUID(value)) {
    return null;
  }
  return value as UUID;
}

// ============================================
// TYPED CONVERSION FUNCTIONS
// ============================================

/**
 * Create typed conversion functions for specific entity types
 */
function createTypedConverter<T extends string>(typeName: string) {
  return {
    /**
     * Convert string to typed ID with validation
     */
    to: (value: string): T => {
      if (!isUUID(value)) {
        throw new Error(`Invalid ${typeName}: ${value}`);
      }
      return value as unknown as T;
    },
    /**
     * Try to convert, return null if invalid
     */
    tryTo: (value: string | null | undefined): T | null => {
      if (value == null || !isUUID(value)) {
        return null;
      }
      return value as unknown as T;
    },
    /**
     * Check if value is valid
     */
    is: (value: unknown): value is T => isUUID(value),
  };
}

// Export typed converters for each entity type
export const TenantIdUtils = createTypedConverter<TenantId>("TenantId");
export const UserIdUtils = createTypedConverter<UserId>("UserId");
export const AccountIdUtils = createTypedConverter<AccountId>("AccountId");
export const SessionIdUtils = createTypedConverter<SessionId>("SessionId");
export const SignalIdUtils = createTypedConverter<SignalId>("SignalId");
export const ExecutionIdUtils = createTypedConverter<ExecutionId>("ExecutionId");
export const ProposalIdUtils = createTypedConverter<ProposalId>("ProposalId");
export const SpineEntityIdUtils = createTypedConverter<SpineEntityId>("SpineEntityId");
export const DocumentIdUtils = createTypedConverter<DocumentId>("DocumentId");
export const ConnectorIdUtils = createTypedConverter<ConnectorId>("ConnectorId");

// ============================================
// UUID GENERATION
// ============================================

/**
 * Generate a UUID v4 (random)
 * Use for general-purpose IDs where time-ordering is not needed
 */
export function generateUUID(): UUID {
  return crypto.randomUUID() as UUID;
}

/**
 * Generate a typed UUID v4
 */
export function generateTypedUUID<T extends UUID>(): T {
  return crypto.randomUUID() as T;
}

/**
 * Generate a UUID v7 (time-sortable)
 * Use for IDs where chronological ordering is beneficial (signals, events, logs)
 *
 * Format: TTTTTTTT-TTTT-7RRR-RRRR-RRRRRRRRRRRR
 * Where T = timestamp bits, R = random bits
 */
export function generateUUIDv7(): UUID {
  const timestamp = BigInt(Date.now());
  const timestampHex = timestamp.toString(16).padStart(12, "0");

  // Get random bytes
  const randomBytes = crypto.getRandomValues(new Uint8Array(10));

  // Build UUID v7 structure
  const timeLow = timestampHex.slice(0, 8);
  const timeMid = timestampHex.slice(8, 12);
  const timeHiAndVersion =
    "7" +
    randomBytes[0].toString(16).padStart(2, "0").slice(1) +
    randomBytes[1].toString(16).padStart(2, "0").slice(0, 2);
  const clockSeqHiAndReserved = (0x80 | (randomBytes[2] & 0x3f)).toString(16).padStart(2, "0");
  const clockSeqLow = randomBytes[3].toString(16).padStart(2, "0");
  const node = Array.from(randomBytes.slice(4, 10))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeqHiAndReserved}${clockSeqLow}-${node}` as UUID;
}

/**
 * Generate a typed UUID v7
 */
export function generateTypedUUIDv7<T extends UUID>(): T {
  return generateUUIDv7() as T;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Extract timestamp from UUID v7
 * Returns null if not a v7 UUID
 */
export function extractTimestampFromUUIDv7(uuid: UUID): Date | null {
  if (!isUUIDv7(uuid)) return null;

  const hex = uuid.replace(/-/g, "").slice(0, 12);
  const timestamp = parseInt(hex, 16);
  return new Date(timestamp);
}

/**
 * Compare two UUIDs for sorting
 * Works best with UUID v7 (time-sortable)
 */
export function compareUUIDs(a: UUID, b: UUID): number {
  return a.localeCompare(b);
}

/**
 * Create a nil UUID (all zeros)
 */
export function nilUUID(): UUID {
  return "00000000-0000-0000-0000-000000000000" as UUID;
}

/**
 * Check if a UUID is nil
 */
export function isNilUUID(uuid: UUID): boolean {
  return uuid === "00000000-0000-0000-0000-000000000000";
}

// ============================================
// CONTEXT & CHAIN TYPES
// ============================================

/**
 * Execution context with full UUID chain
 */
export interface ExecutionContext {
  correlationId: UUID;
  tenantId: TenantId;
  userId: UserId;
  sessionId?: SessionId;
  executionId?: ExecutionId;
  parentExecutionId?: ExecutionId;
  spanId?: UUID;
}

/**
 * Entity reference with UUID
 */
export interface EntityRef<T extends UUID = UUID> {
  id: T;
  type: string;
  version?: number;
}

/**
 * Audit context for mutations
 */
export interface AuditContext {
  tenantId: TenantId;
  userId: UserId;
  action: string;
  entityType: string;
  entityId: UUID;
  executionId?: ExecutionId;
  timestamp: Date;
}

// ============================================
// ZOD SCHEMA HELPERS
// ============================================

/**
 * Helper to create Zod UUID refinement for branded types
 * Usage: z.string().uuid().transform(toTenantId)
 */
export const toTenantId = (value: string): TenantId => value as TenantId;
export const toUserId = (value: string): UserId => value as UserId;
export const toAccountId = (value: string): AccountId => value as AccountId;
export const toSessionId = (value: string): SessionId => value as SessionId;
export const toSignalId = (value: string): SignalId => value as SignalId;
export const toExecutionId = (value: string): ExecutionId => value as ExecutionId;
export const toProposalId = (value: string): ProposalId => value as ProposalId;
export const toSpineEntityId = (value: string): SpineEntityId => value as SpineEntityId;
export const toDocumentId = (value: string): DocumentId => value as DocumentId;
export const toConnectorId = (value: string): ConnectorId => value as ConnectorId;
export const toSituationId = (value: string): SituationId => value as SituationId;
export const toEvidenceId = (value: string): EvidenceId => value as EvidenceId;
export const toInsightId = (value: string): InsightId => value as InsightId;
export const toPolicyId = (value: string): PolicyId => value as PolicyId;
export const toApprovalId = (value: string): ApprovalId => value as ApprovalId;
export const toMemoryId = (value: string): MemoryId => value as MemoryId;
export const toSummaryId = (value: string): SummaryId => value as SummaryId;
export const toTopicId = (value: string): TopicId => value as TopicId;
export const toChunkId = (value: string): ChunkId => value as ChunkId;
export const toWebhookId = (value: string): WebhookId => value as WebhookId;
export const toSyncId = (value: string): SyncId => value as SyncId;
export const toEventId = (value: string): EventId => value as EventId;
export const toCorrectionId = (value: string): CorrectionId => value as CorrectionId;
export const toAuditLogId = (value: string): AuditLogId => value as AuditLogId;
export const toRiskId = (value: string): RiskId => value as RiskId;
