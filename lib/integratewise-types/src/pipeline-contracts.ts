/**
 * Connector Pipeline Contracts
 *
 * Canonical type definitions for:
 * 1. Connector State Machine — formal states and transitions
 * 2. Idempotency Model — durable record identity
 * 3. Queue Contracts — versioned message schemas for SYNC_QUEUE and PIPELINE_QUEUE
 * 4. Sync Checkpoint — durable cursor tracking for long-running syncs
 * 5. Quarantine Record — pipeline reject with reason codes
 *
 * These contracts are the formal specification for the connector data
 * ingestion pipeline. All services (loader, connector-sync, pipeline,
 * normalizer, spine-v2) must conform to these types.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CONNECTOR STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Formal connector status states.
 * Stored in `connectors.status` (VARCHAR(20) with CHECK constraint).
 *
 * State transitions:
 *
 *   pending_auth ──→ connected ──→ initializing ──→ syncing_creamy ──→ healthy
 *                                                                       │
 *                                                          ┌────────────┤
 *                                                          ↓            ↓
 *                                                   syncing_delta  syncing_full
 *                                                          │            │
 *                                                          └────────────┘
 *                                                                │
 *                                                                ↓
 *                                                             healthy
 *
 *   Any state ──→ degraded (transient errors, auto-retry)
 *   Any state ──→ reauth_required (token expired/revoked)
 *   Any state ──→ failed (unrecoverable error)
 *   Any state ──→ paused (user-initiated)
 *
 * Legacy compat: 'disconnected', 'error', 'pending' are accepted but
 * should be migrated to the formal states above.
 */
export type ConnectorStatus =
  | "pending_auth" // OAuth flow initiated, waiting for callback
  | "connected" // OAuth complete, tokens stored, not yet synced
  | "initializing" // Schema config being written (initialize-spine)
  | "syncing_creamy" // Creamy layer sync in progress
  | "healthy" // Fully operational, last sync succeeded
  | "syncing_delta" // Delta sync in progress (6h cron)
  | "syncing_full" // Full historical sync in progress (24-48h)
  | "degraded" // Transient errors, auto-retrying
  | "reauth_required" // Token expired or revoked, user must re-authenticate
  | "paused" // User-initiated pause
  | "failed"; // Unrecoverable error, requires manual intervention

/** Valid state transitions */
export const CONNECTOR_STATE_TRANSITIONS: Record<ConnectorStatus, ConnectorStatus[]> = {
  pending_auth: ["connected", "failed"],
  connected: ["initializing", "syncing_creamy", "paused", "failed"],
  initializing: ["syncing_creamy", "connected", "failed"],
  syncing_creamy: ["healthy", "degraded", "reauth_required", "failed"],
  healthy: ["syncing_delta", "syncing_full", "paused", "reauth_required", "degraded"],
  syncing_delta: ["healthy", "degraded", "reauth_required", "failed"],
  syncing_full: ["healthy", "degraded", "reauth_required", "failed"],
  degraded: ["healthy", "syncing_delta", "syncing_full", "reauth_required", "failed"],
  reauth_required: ["connected", "pending_auth"],
  paused: ["healthy", "connected", "syncing_delta"],
  failed: ["connected", "pending_auth"],
};

/**
 * Check if a state transition is valid.
 */
export function isValidConnectorTransition(from: ConnectorStatus, to: ConnectorStatus): boolean {
  return CONNECTOR_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. IDEMPOTENCY MODEL — Record Identity
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Durable identity for a record entering the pipeline.
 * This determines whether a record is new, an update, a duplicate, or stale.
 *
 * The composite key is: (tenant_id, provider, entity_type, provider_record_id)
 *
 * Dedup logic:
 *   1. Same composite key + same content_hash = DUPLICATE → skip
 *   2. Same composite key + different content_hash + newer source_updated_at = UPDATE → process
 *   3. Same composite key + different content_hash + older source_updated_at = STALE → skip
 *   4. New composite key = NEW → process
 */
export interface RecordIdentity {
  tenant_id: string;
  provider: string;
  provider_account_id?: string; // e.g., HubSpot portal ID
  entity_type: string;
  provider_record_id: string; // e.g., HubSpot contact ID
  source_updated_at?: string; // ISO 8601 — when the source record was last modified
  content_hash?: string; // SHA-256 of canonical payload (for dedup)
}

export type RecordDisposition = "new" | "update" | "duplicate" | "stale" | "replayed";

// ═══════════════════════════════════════════════════════════════════════════════
// 3. QUEUE CONTRACTS — Versioned Message Schemas
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SYNC_QUEUE message — sent by loader/connector to connector-sync.
 * Triggers sync for a specific tenant+provider+entity combination.
 */
export interface SyncQueueMessage {
  /** Message schema version — increment when shape changes */
  message_version: 1;
  /** Unique message ID for dedup */
  message_id: string;
  /** Tenant context */
  tenant_id: string;
  /** Connector provider */
  provider: string;
  /** Connector instance ID (provider-tenantId) */
  connector_instance_id: string;
  /** Entity types to sync */
  entity_types: string[];
  /** Sync phase */
  phase: "creamy" | "full" | "delta";
  /** Delta cursor — only fetch records after this */
  since?: string;
  /** Full sync cursor — resume from this page */
  cursor?: string;
  /** Record limit (creamy = 100 default) */
  limit?: number;
  /** Job ID for tracking */
  job_id: string;
  /** Retry attempt number */
  attempt: number;
  /** When the message was enqueued */
  enqueued_at: string;
  /** Trace ID for observability */
  trace_id: string;
}

/**
 * PIPELINE_QUEUE message — sent by loader/connector-sync to the 8-stage pipeline.
 * Each message is one record to be processed.
 */
export interface PipelineQueueMessage {
  /** Message schema version */
  message_version: 1;
  /** Which pipeline stage to start at (normally "analyze" for S1) */
  stage:
    | "analyze"
    | "classify"
    | "filter"
    | "refine"
    | "extract"
    | "validate"
    | "sanity"
    | "sectorize";
  /** Source connector provider */
  source: string;
  /** How this record entered the pipeline */
  source_type: "loader_creamy" | "loader_delta" | "loader_full" | "webhook" | "manual";
  /** Tenant context */
  tenant_id: string;
  /** The record payload */
  payload: {
    /** Entity type (resolved or to-be-classified) */
    _entity_type: string;
    /** Provider record ID */
    _source_id: string;
    /** Tenant ID (redundant but useful for pipeline stages) */
    _tenant_id: string;
    /** All other fields from the provider */
    [key: string]: unknown;
  };
  /** Pipeline metadata */
  metadata: {
    /** End-to-end trace ID */
    trace_id: string;
    /** Retry attempt number */
    attempt: number;
    /** When the record was received by the loader */
    received_at: string;
    /** When the record was extracted from the provider */
    extracted_at: string;
    /** Loader job ID */
    loader_job_id?: string;
    /** Sync phase */
    phase?: "creamy" | "delta" | "full";
    /** When the sync happened */
    synced_at?: string;
    /** Record identity for dedup */
    identity?: RecordIdentity;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SYNC CHECKPOINT — Durable Cursor Tracking
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Matches the `sync_checkpoints` table schema (migration 079).
 * One row per tenant+provider+entity_type+phase.
 */
export interface SyncCheckpoint {
  id: string;
  tenant_id: string;
  provider: string;
  entity_type: string;
  /** Provider-specific cursor (page token, offset, etc.) */
  cursor_value?: string;
  /** Latest source record timestamp seen */
  source_updated_at?: string;
  /** Sync phase */
  phase: "creamy" | "full" | "delta";
  /** Records processed in this checkpoint */
  records_processed: number;
  /** Records successfully written to Spine */
  records_written: number;
  /** Records sent to quarantine */
  records_quarantined: number;
  /** Job ID */
  job_id?: string;
  started_at?: string;
  completed_at?: string;
  status: "in_progress" | "completed" | "failed" | "partial";
  error?: string;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. QUARANTINE RECORD — Pipeline Rejects
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Matches the `pipeline_quarantine` table schema (migration 079).
 * Records that fail validation, sanity, or schema checks are quarantined
 * — never silently dropped.
 */
export interface QuarantineRecord {
  id: string;
  tenant_id: string;
  provider: string;
  entity_type?: string;
  source_id?: string;
  /** Which pipeline stage rejected it */
  stage: "S3_filter" | "S5_extract" | "S6_validate" | "S7_sanity" | "S8_sectorize";
  /** Machine-readable reason code */
  reason_code: QuarantineReasonCode;
  /** Human-readable explanation */
  reason_detail?: string;
  /** The original record payload */
  payload: Record<string, unknown>;
  /** Trace/job metadata */
  metadata: Record<string, unknown>;
  created_at: string;
  reviewed_at?: string;
  /** What happened to this record after review */
  resolution?: "discarded" | "reprocessed" | "manual_fix";
}

export type QuarantineReasonCode =
  | "schema_entity_type_not_allowed" // S3: entity type not in tenant schema
  | "schema_field_missing_required" // S5: required field missing
  | "validation_type_mismatch" // S6: field value wrong type
  | "validation_range_exceeded" // S6: value out of expected range
  | "sanity_low_confidence" // S7: AI sanity score below threshold
  | "sanity_anomaly_detected" // S7: statistical anomaly flagged
  | "sectorize_write_failed" // S8: Spine write failure
  | "duplicate_record" // S3: idempotency check — exact duplicate
  | "stale_record" // S3: idempotency check — older than existing
  | "mapping_incomplete"; // S5: canonical mapping could not resolve

// ═══════════════════════════════════════════════════════════════════════════════
// 6. PIPELINE STAGE METRICS — Observability Thread
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Per-stage metrics emitted by the 8-stage pipeline.
 * Each stage reports what it received, passed, pruned, and failed.
 */
export interface PipelineStageMetrics {
  tenant_id: string;
  provider: string;
  job_id: string;
  trace_id: string;
  stage: string;
  entity_type: string;
  /** Records entering this stage */
  records_in: number;
  /** Records passing to the next stage */
  records_out: number;
  /** Records pruned (filtered, deduped) */
  records_pruned: number;
  /** Records quarantined */
  records_quarantined: number;
  /** Records that errored */
  records_errored: number;
  /** Stage latency in milliseconds */
  latency_ms: number;
  /** Timestamp */
  timestamp: string;
}
