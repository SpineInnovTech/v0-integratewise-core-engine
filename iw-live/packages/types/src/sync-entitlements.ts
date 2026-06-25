/**
 * Sync Entitlements & Paywall Types
 *
 * Defines plan-based sync limitations and accelerator scoping
 * for the Three-Layer Architecture.
 */

import type { SkuTier } from "./billing.js";

// ============================================================================
// Entitlement Configuration
// ============================================================================

export interface SyncEntitlements {
  /** Minimum minutes between syncs */
  minSyncIntervalMinutes: number;

  /** Supports real-time webhooks */
  supportsRealtimeWebhooks: boolean;

  /** Supports scheduled/cron syncs */
  supportsScheduledSync: boolean;

  /** Maximum records per single sync operation */
  maxRecordsPerSync: number;

  /** Monthly record quota */
  maxRecordsPerMonth: number;

  /** How many days of historical data to fetch */
  maxHistoricalDays: number;

  /** Maximum number of active connectors */
  maxConnectors: number;

  /** Allowed accelerator IDs ('*' = all) */
  allowedAccelerators: string[];

  /** Allowed entity types ('*' = all schema-defined) */
  allowedEntityTypes: string[];

  /** Supports incremental delta sync */
  supportsDeltaSync: boolean;

  /** Supports full refresh/rebuild */
  supportsFullRefresh: boolean;

  /** Supports bi-directional sync */
  supportsTwoWaySync: boolean;
}

/** Plan-specific sync entitlements */
export const PLAN_SYNC_ENTITLEMENTS: Record<SkuTier, SyncEntitlements> = {
  free: {
    minSyncIntervalMinutes: 24 * 60, // Daily
    supportsRealtimeWebhooks: false,
    supportsScheduledSync: true,
    maxRecordsPerSync: 1_000,
    maxRecordsPerMonth: 10_000,
    maxHistoricalDays: 30,
    maxConnectors: 3, // increased (nango dev + connector paths)
    allowedAccelerators: ["foundation"],
    allowedEntityTypes: ["account", "contact", "task"],
    supportsDeltaSync: true,
    supportsFullRefresh: false,
    supportsTwoWaySync: false,
  },

  starter: {
    minSyncIntervalMinutes: 4 * 60, // 4 hours
    supportsRealtimeWebhooks: false,
    supportsScheduledSync: true,
    maxRecordsPerSync: 5_000,
    maxRecordsPerMonth: 50_000,
    maxHistoricalDays: 90,
    maxConnectors: 10, // increased (nango dev + connector paths)
    allowedAccelerators: ["foundation", "saas_vertical", "cs_growth"],
    allowedEntityTypes: ["account", "contact", "task", "risk", "opportunity", "ticket"],
    supportsDeltaSync: true,
    supportsFullRefresh: true,
    supportsTwoWaySync: false,
  },

  professional: {
    minSyncIntervalMinutes: 60, // 1 hour
    supportsRealtimeWebhooks: true,
    supportsScheduledSync: true,
    maxRecordsPerSync: 25_000,
    maxRecordsPerMonth: 500_000,
    maxHistoricalDays: 365,
    maxConnectors: 25, // increased (nango dev + connector paths)
    allowedAccelerators: ["*"], // All standard accelerators
    allowedEntityTypes: ["*"], // All schema-defined entities
    supportsDeltaSync: true,
    supportsFullRefresh: true,
    supportsTwoWaySync: true,
  },

  enterprise: {
    minSyncIntervalMinutes: 15, // 15 minutes
    supportsRealtimeWebhooks: true,
    supportsScheduledSync: true,
    maxRecordsPerSync: 100_000,
    maxRecordsPerMonth: Number.POSITIVE_INFINITY,
    maxHistoricalDays: Number.POSITIVE_INFINITY,
    maxConnectors: Number.POSITIVE_INFINITY,
    allowedAccelerators: ["*", "custom"],
    allowedEntityTypes: ["*"],
    supportsDeltaSync: true,
    supportsFullRefresh: true,
    supportsTwoWaySync: true,
  },

  addon: {
    minSyncIntervalMinutes: 60,
    supportsRealtimeWebhooks: false,
    supportsScheduledSync: true,
    maxRecordsPerSync: 5_000,
    maxRecordsPerMonth: 50_000,
    maxHistoricalDays: 30,
    maxConnectors: 1,
    allowedAccelerators: [],
    allowedEntityTypes: [],
    supportsDeltaSync: true,
    supportsFullRefresh: false,
    supportsTwoWaySync: false,
  },
};

// ============================================================================
// Entitlement Validation
// ============================================================================

export interface EntitlementResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  retryAfterMinutes?: number;
  entitlements?: SyncEntitlements;
  allowedEntities?: string[];
}

export interface SyncRequest {
  connectorId: string;
  acceleratorId: string;
  syncType: "creamy" | "full" | "delta" | "webhook";
  planTier: SkuTier;
  entityTypes?: string[];
  payload: SyncPayload;
  source: "cron" | "webhook" | "manual" | "retry";
}

export interface SyncPayload {
  entity_type: string;
  external_id: string;
  action: "create" | "update" | "delete";
  data: Record<string, unknown>;
  raw_source_data?: Record<string, unknown>;
  checksum: string;
  timestamp: string;
}

// ============================================================================
// Domain Accelerator Sync Scoping
// ============================================================================

export interface AcceleratorSyncScope {
  acceleratorId: string;
  version: string;

  /** Core entities that must be synced */
  primaryEntities: string[];

  /** Secondary entities synced if available */
  secondaryEntities: string[];

  /** Derived/computed entities */
  computedEntities: string[];

  /** Field scoping per entity type */
  fieldScopes: Record<string, FieldScope>;

  /** Sync behavior configuration */
  syncBehavior: SyncBehavior;

  /** Intelligence signals enabled */
  signals: string[];

  /** Data governance policies */
  policies: SyncPolicies;
}

export interface FieldScope {
  /** Fields to include in sync */
  included: string[];

  /** Fields to explicitly exclude */
  excluded: string[];

  /** Fields to mask/anonymize */
  masked: string[];

  /** Fields computed post-sync */
  computed: string[];
}

export interface SyncBehavior {
  /** Days of data for creamy/quick load */
  creamyLoadDays: number;

  /** Months of historical data for full load */
  fullLoadMonths: number;

  /** Sync priority for queue ordering */
  priority: "critical" | "high" | "normal" | "low";

  /** Fields that trigger real-time sync */
  realTimeFields: string[];
}

export interface SyncPolicies {
  /** Data retention period in days */
  dataRetentionDays: number;

  /** Whether actions require approval */
  requiresApproval: boolean;

  /** PII field paths for masking */
  piiFields: string[];
}

// ============================================================================
// Queue Message Envelopes
// ============================================================================

export interface SyncMessageEnvelope {
  tenant_id: string;
  correlation_id: string;
  message_id: string;
  sync_type: "creamy" | "full" | "delta" | "webhook" | "retry";
  accelerator_id: string;
  connector_id: string;
  plan_tier: SkuTier;
  entitlements_snapshot: SyncEntitlements;
  payload: SyncPayload;
  metadata: SyncMetadata;
  schema_context: SchemaContext;
}

export interface SyncMetadata {
  attempt: number;
  max_attempts: number;
  received_at: string;
  scheduled_at?: string;
  priority: "critical" | "high" | "normal" | "low";
  source: "cron" | "webhook" | "manual" | "retry" | "reprocess";
  last_error?: string;
  reprocess_reason?: string;
}

export interface SchemaContext {
  allowed_entity_types: string[];
  allowed_fields: Record<string, FieldScope>;
  computed_fields: string[];
}

// ============================================================================
// DLQ (Dead Letter Queue)
// ============================================================================

export interface DLQMessage {
  original_message: SyncMessageEnvelope;
  error: {
    message: string;
    type: string;
    stack?: string;
    is_retryable: boolean;
  };
  failed_at: string;
  tenant_id: string;
  correlation_id: string;
  attempt: number;
  stage: string;
}

export interface DLQEntry {
  id: string;
  tenant_id: string;
  correlation_id: string;
  original_payload: SyncMessageEnvelope;
  error_type: string;
  error_message: string;
  error_stack?: string;
  stage: string;
  attempt_count: number;
  status: "pending_reprocess" | "reprocessing" | "archived" | "discarded";
  failed_at: string;
  reprocessed_at?: string;
}

// ============================================================================
// Enqueue/Processing Results
// ============================================================================

export interface EnqueueResult {
  success: boolean;
  error?: string;
  upgradeRequired?: boolean;
  deduplicated?: boolean;
  retryAfterMinutes?: number;
  correlation_id: string;
  message_id?: string;
}

export interface ReprocessResult {
  success: number;
  failed: number;
  skipped: number;
}

export interface ReprocessFilter {
  tenantId?: string;
  errorType?: string;
  since?: string;
}

export interface ReprocessOptions {
  batchSize?: number;
  rateLimitMs?: number;
  requireFixVerification?: boolean;
  fixVersion?: string;
}

// ============================================================================
// Real-time Signals
// ============================================================================

export interface RealtimeSignal {
  channel: string;
  tenant_id: string;
  entity_type?: string;
  entity_id?: string;
  signal_type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

// ============================================================================
// Data Retention
// ============================================================================

export interface DataRetentionPolicy {
  spine_entity_days: number;
  audit_log_days: number;
  events_log_days: number;
  signal_history_days: number;
  raw_data_days: number;
  backup_retention_days: number;
  archive_to_cold_storage: boolean;
}

export const RETENTION_POLICIES: Record<SkuTier, DataRetentionPolicy> = {
  free: {
    spine_entity_days: 90,
    audit_log_days: 30,
    events_log_days: 7,
    signal_history_days: 30,
    raw_data_days: 7,
    backup_retention_days: 7,
    archive_to_cold_storage: false,
  },
  starter: {
    spine_entity_days: 365,
    audit_log_days: 90,
    events_log_days: 30,
    signal_history_days: 90,
    raw_data_days: 30,
    backup_retention_days: 30,
    archive_to_cold_storage: false,
  },
  professional: {
    spine_entity_days: 1095, // 3 years
    audit_log_days: 365,
    events_log_days: 90,
    signal_history_days: 365,
    raw_data_days: 90,
    backup_retention_days: 90,
    archive_to_cold_storage: true,
  },
  enterprise: {
    spine_entity_days: 2555, // 7 years
    audit_log_days: 2555,
    events_log_days: 365,
    signal_history_days: 1095,
    raw_data_days: 365,
    backup_retention_days: 365,
    archive_to_cold_storage: true,
  },
  addon: {
    spine_entity_days: 30,
    audit_log_days: 30,
    events_log_days: 7,
    signal_history_days: 30,
    raw_data_days: 7,
    backup_retention_days: 7,
    archive_to_cold_storage: false,
  },
};

// ============================================================================
// Metrics & Monitoring
// ============================================================================

export interface SyncMetrics {
  tenant_id: string;
  accelerator: string;
  sync_type: string;
  records_processed: number;
  records_failed: number;
  duration_ms: number;
  queue_depth?: number;
}

export interface TenantMetrics {
  total_syncs: number;
  avg_duration_ms: number;
  success_rate: number;
}
