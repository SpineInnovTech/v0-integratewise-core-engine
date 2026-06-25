/**
 * IntegrateWise - Enterprise Event Bus
 *
 * Best Practices Implemented:
 * - UUID-based correlation tracking (x-request-id, x-correlation-id)
 * - Message persistence and durability
 * - Dead Letter Queue (DLQ) with exponential backoff
 * - Exactly-once processing with idempotency keys
 * - Event sourcing pattern for audit trail
 * - Schema validation at ingestion
 * - Circuit breaker pattern for external calls
 * - Backpressure handling
 */

import { z } from "zod";

// =============================================================================
// UUID-BASED CORRELATION TRACKING
// =============================================================================

export interface CorrelationContext {
  /** Unique request ID (generated at edge/Gateway) */
  requestId: string;
  /** Correlation ID (flows across all services) */
  correlationId: string;
  /** Parent span ID for distributed tracing */
  parentSpanId?: string;
  /** Trace ID (OpenTelemetry compatible) */
  traceId: string;
  /** Tenant context */
  tenantId: string;
  userId: string;
  /** Flow type: A (structured), B (context), C (AI) */
  flowType: "A" | "B" | "C";
  /** Connector provider */
  source: string;
  /** Timestamp at origin */
  originTimestamp: string;
}

export function generateCorrelationContext(
  tenantId: string,
  userId: string,
  flowType: "A" | "B" | "C",
  source: string,
  parentContext?: Partial<CorrelationContext>
): CorrelationContext {
  const now = new Date().toISOString();
  return {
    requestId: parentContext?.requestId || crypto.randomUUID(),
    correlationId: parentContext?.correlationId || crypto.randomUUID(),
    parentSpanId: parentContext?.requestId,
    traceId: parentContext?.traceId || crypto.randomUUID(),
    tenantId,
    userId,
    flowType,
    source,
    originTimestamp: parentContext?.originTimestamp || now,
  };
}

// =============================================================================
// EVENT SCHEMA (Validated at ingestion)
// =============================================================================

export const EventMetadataSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.enum([
    // Flow events
    "oauth.connected",
    "oauth.failed",
    "sync.started",
    "sync.completed",
    "sync.failed",
    // Pipeline events
    "pipeline.stage.started",
    "pipeline.stage.completed",
    "pipeline.stage.failed",
    "pipeline.filtered",
    // Spine events
    "spine.write.succeeded",
    "spine.write.conflict",
    "spine.write.failed",
    // Entity 360 events
    "entity360.fusion.completed",
    "entity360.fusion.failed",
    // Think events
    "think.analysis.completed",
    "think.proposal.created",
    // Governance events
    "govern.policy.passed",
    "govern.policy.blocked",
    "hitl.approved",
    "hitl.denied",
    // Act events
    "act.execution.succeeded",
    "act.execution.failed",
    "act.writeback.completed",
  ]),
  timestamp: z.string().datetime(),
  version: z.string().default("1.0"),
  correlationContext: z.object({
    requestId: z.string().uuid(),
    correlationId: z.string().uuid(),
    traceId: z.string().uuid(),
    tenantId: z.string(),
    userId: z.string(),
    flowType: z.enum(["A", "B", "C"]),
    source: z.string(),
    originTimestamp: z.string().datetime(),
  }),
  // Idempotency for exactly-once processing
  idempotencyKey: z.string(),
  // Partitioning for ordered processing
  partitionKey: z.string(),
  // Priority for queue ordering
  priority: z.number().min(1).max(10).default(5),
  // Retry tracking
  attempt: z.number().min(0).default(0),
  maxAttempts: z.number().min(1).default(3),
  // Circuit breaker state
  circuitBreakerState: z.enum(["closed", "open", "half-open"]).default("closed"),
});

export type EventMetadata = z.infer<typeof EventMetadataSchema>;

export interface IntegrateWiseEvent<T = unknown> {
  metadata: EventMetadata;
  payload: T;
  // Encrypted at rest
  encrypted: boolean;
  // Compression for large payloads
  compression?: "gzip" | "none";
  // TTL for ephemeral events
  ttl?: number;
}

// =============================================================================
// MESSAGE PERSISTENCE LAYER
// =============================================================================

export interface PersistedMessage {
  // Primary key
  messageId: string;
  // Correlation tracking
  correlationId: string;
  requestId: string;
  traceId: string;
  // Content
  eventType: string;
  payload: string; // JSON serialized
  // State machine
  status: "pending" | "processing" | "completed" | "failed" | "dlq";
  // Processing
  service: string;
  stage: string;
  attempt: number;
  maxAttempts: number;
  // Timing
  createdAt: string;
  scheduledAt: string;
  processedAt?: string;
  completedAt?: string;
  // Error tracking
  lastError?: string;
  errorStack?: string;
  // Backoff
  nextRetryAt?: string;
  // Partitioning
  partitionKey: string;
  tenantId: string;
  // Schema version for migrations
  schemaVersion: string;
}

// =============================================================================
// DEAD LETTER QUEUE (DLQ) WITH EXPONENTIAL BACKOFF
// =============================================================================

export interface DLQMessage {
  originalMessage: PersistedMessage;
  // Why it failed
  failureReason: string;
  failureCategory:
    | "validation_error"
    | "processing_error"
    | "timeout"
    | "circuit_breaker"
    | "external_service_error"
    | "schema_mismatch";
  // Retry history
  retryHistory: Array<{
    attemptedAt: string;
    error: string;
    service: string;
  }>;
  // Dead letter timestamp
  deadLetteredAt: string;
  // Manual review flag
  requiresManualReview: boolean;
  // Replay tracking
  replayedAt?: string;
  replayedBy?: string;
  replayResult?: "success" | "failed";
}

// Exponential backoff calculation
export function calculateBackoff(
  attempt: number,
  baseMs: number = 1000,
  maxMs: number = 300000
): number {
  const backoff = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * backoff;
  return Math.floor(backoff + jitter);
}

// =============================================================================
// CIRCUIT BREAKER PATTERN
// =============================================================================

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  halfOpenMaxCalls: number;
}

export interface CircuitBreakerState {
  service: string;
  state: "closed" | "open" | "half-open";
  failureCount: number;
  successCount: number;
  lastFailureTime?: string;
  nextRetryTime?: string;
  totalCalls: number;
  failedCalls: number;
}

// =============================================================================
// STREAMING SUPPORT
// =============================================================================

export interface StreamConfig {
  // Chunking for large datasets
  chunkSize: number;
  // Backpressure: pause after N unacknowledged chunks
  maxInflightChunks: number;
  // Timeout per chunk
  chunkTimeoutMs: number;
  // Resume capability
  resumable: boolean;
  checkpointInterval: number;
}

export interface StreamCheckpoint {
  streamId: string;
  correlationId: string;
  tenantId: string;
  // Progress tracking
  totalItems: number;
  processedItems: number;
  lastItemId?: string;
  lastItemTimestamp?: string;
  // State
  status: "running" | "paused" | "completed" | "failed";
  // Resume token
  resumeToken: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// DYNAMIC LOADING PATTERNS
// =============================================================================

export interface DynamicLoaderConfig {
  // Lazy loading triggers
  lazyLoadOn: ("scroll" | "search" | "filter" | "expand")[];
  // Pagination
  pageSize: number;
  prefetchPages: number;
  // Cache strategy
  cacheTtlMs: number;
  staleWhileRevalidate: boolean;
  // Real-time updates
  subscribeToChanges: boolean;
  webhooks?: string[];
}

export interface LoadedEntity {
  // Core entity
  entityId: string;
  entityType: string;
  // Loading state
  loadingStatus: "idle" | "loading" | "loaded" | "error" | "partial";
  // Progress for large entities
  loadProgress?: {
    totalFields: number;
    loadedFields: number;
    pendingRelations: number;
  };
  // Cache metadata
  cachedAt?: string;
  staleAt?: string;
  // Source tracking
  sources: Array<{
    connector: string;
    loadedAt: string;
    fieldCount: number;
  }>;
}

// =============================================================================
// COMPREHENSIVE LOGGING STRUCTURE
// =============================================================================

export interface LogEntry {
  // Identification
  logId: string;
  timestamp: string;
  level: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  // Correlation (links all logs across services)
  correlationId: string;
  requestId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  // Context
  tenantId: string;
  userId: string;
  service: string;
  stage: string;
  flowType: "A" | "B" | "C";
  // Message
  message: string;
  // Structured data
  context: Record<string, unknown>;
  // Performance
  durationMs?: number;
  memoryMB?: number;
  // Error details
  error?: {
    type: string;
    message: string;
    stack?: string;
    code?: string;
  };
  // Security
  sanitized: boolean;
  piiRedacted: boolean;
}

// =============================================================================
// ROUTING TABLE (Dynamic service discovery)
// =============================================================================

export interface ServiceRoute {
  service: string;
  host: string;
  port: number;
  protocol: "http" | "https" | "grpc";
  // Health
  healthCheckPath: string;
  healthy: boolean;
  lastHealthCheck: string;
  // Load balancing
  weight: number;
  currentConnections: number;
  // Circuit breaker
  circuitBreaker: CircuitBreakerState;
  // Version for blue/green deploys
  version: string;
}

export interface RoutingTable {
  version: string;
  updatedAt: string;
  routes: Record<string, ServiceRoute[]>;
  // Global config
  defaultTimeoutMs: number;
  defaultRetries: number;
  // Rate limiting
  globalRateLimit: {
    requestsPerSecond: number;
    burstSize: number;
  };
}

// =============================================================================
// SECURITY LAYER
// =============================================================================

export interface SecurityContext {
  // Authentication
  authType: "jwt" | "api_key" | "oauth" | "mcp";
  tokenId: string;
  tokenExpiry: string;
  // Authorization
  permissions: string[];
  role: string;
  // Encryption
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  keyRotationId: string;
  // Validation
  schemaValidated: boolean;
  inputSanitized: boolean;
  // Rate limiting
  rateLimitQuota: number;
  rateLimitRemaining: number;
  rateLimitResetAt: string;
}

// Payload encryption helper
export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
  algorithm: "aes-256-gcm";
}

// =============================================================================
// EVENT BUS INTERFACE
// =============================================================================

export interface EventBus {
  // Publishing
  publish<T>(
    event: Omit<IntegrateWiseEvent<T>, "metadata"> & { metadata: Partial<EventMetadata> }
  ): Promise<void>;

  // Subscribing with auto-retry and DLQ
  subscribe<T>(
    eventType: string,
    handler: (event: IntegrateWiseEvent<T>, context: CorrelationContext) => Promise<void>,
    options: {
      consumerGroup: string;
      maxRetries: number;
      dlqEnabled: boolean;
      concurrency: number;
    }
  ): Promise<void>;

  // Replay from DLQ
  replayDlq(messageId: string, options?: { withModifications?: boolean }): Promise<void>;

  // Stream processing
  createStream<T>(config: StreamConfig): StreamProcessor<T>;

  // Health
  health(): Promise<{ status: "healthy" | "degraded" | "unhealthy"; lag: number }>;
}

export interface StreamProcessor<T> {
  streamId: string;
  process(generator: AsyncGenerator<T>): Promise<void>;
  pause(): Promise<void>;
  resume(checkpointToken: string): Promise<void>;
  getCheckpoint(): Promise<StreamCheckpoint>;
}

// =============================================================================
// REPROCESSING & REPLAY
// =============================================================================

export interface ReprocessRequest {
  // What to reprocess
  correlationId?: string;
  timeRange?: { start: string; end: string };
  eventTypes?: string[];
  tenantId?: string;
  stage?: string;
  // How to reprocess
  strategy: "replay" | "retry" | "patch";
  // For patch strategy
  patchFn?: (original: PersistedMessage) => PersistedMessage;
  // Safety
  dryRun: boolean;
  maxMessages: number;
  // Approval
  approvedBy: string;
  approvalReason: string;
}

export interface ReprocessResult {
  totalFound: number;
  processed: number;
  succeeded: number;
  failed: number;
  dlq: number;
  skipped: number;
  errors: Array<{ messageId: string; error: string }>;
  dryRun: boolean;
}

// =============================================================================
// IDEMPOTENCY (Exactly-Once Processing)
// =============================================================================

export interface IdempotencyConfig {
  // Key generation strategy
  keySource: "payload_hash" | "client_provided" | "auto_uuid";
  // Storage backend
  storage: "redis" | "d1" | "memory";
  // TTL for idempotency records
  ttlSeconds: number;
  // Conflict resolution
  onConflict: "return_cached" | "error" | "replace";
}

export interface IdempotencyRecord {
  // The idempotency key (client-provided or computed)
  idempotencyKey: string;
  // Scope (prevents cross-tenant key collisions)
  scope: string; // "{tenantId}:{resourceType}"
  // Request fingerprint
  requestHash: string;
  // Response storage for replay
  responseStatus: number;
  responseBody: string;
  responseHeaders: Record<string, string>;
  // Timing
  createdAt: string;
  expiresAt: string;
  // Processing metadata
  correlationId: string;
  requestId: string;
  processedBy: string; // service:instance
}

// Idempotency key generation strategies
export function generateIdempotencyKey(
  strategy: "payload_hash" | "auto_uuid",
  payload: unknown,
  correlationContext: CorrelationContext
): string {
  if (strategy === "auto_uuid") {
    return `${correlationContext.tenantId}:${correlationContext.requestId}`;
  }

  // Payload hash strategy
  const payloadStr = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(payloadStr + correlationContext.tenantId);

  // Simple hash for example (use crypto.subtle in production)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `${correlationContext.tenantId}:${Math.abs(hash).toString(16)}`;
}

// Idempotency checker interface
export interface IdempotencyStore {
  check(key: string, scope: string): Promise<IdempotencyRecord | null>;
  store(record: IdempotencyRecord): Promise<void>;
  delete(key: string, scope: string): Promise<void>;
  cleanup(expiredBefore: string): Promise<number>;
}

// =============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// =============================================================================

export interface WebhookConfig {
  // Provider identifier
  provider: string;
  // Signature algorithm
  signatureAlgorithm: "hmac-sha256" | "hmac-sha512" | "ed25519" | "rsa-sha256";
  // Secret or public key
  secret?: string; // For HMAC
  publicKey?: string; // For asymmetric
  // Header names (vary by provider)
  signatureHeader: string;
  timestampHeader?: string;
  // Replay protection
  maxAgeSeconds: number;
  // Retry configuration
  retryEnabled: boolean;
  retryCount: number;
  retryDelayMs: number;
}

export interface VerifiedWebhook {
  // Original payload
  payload: string;
  parsedPayload: unknown;
  // Verification metadata
  verified: boolean;
  signature: string;
  timestamp?: string;
  // Replay protection
  timestampValid: boolean;
  ageSeconds: number;
  // Provider
  provider: string;
  webhookId: string;
  // For logging/audit
  verificationTime: string;
}

// Webhook signature verification utilities
export class WebhookVerifier {
  private config: WebhookConfig;
  private processedWebhooks: Set<string>; // For replay protection

  constructor(config: WebhookConfig) {
    this.config = config;
    this.processedWebhooks = new Set();
  }

  async verify(payload: string, headers: Record<string, string>): Promise<VerifiedWebhook> {
    const signature = headers[this.config.signatureHeader.toLowerCase()];
    const timestamp = this.config.timestampHeader
      ? headers[this.config.timestampHeader.toLowerCase()]
      : undefined;

    const now = Math.floor(Date.now() / 1000);
    const webhookTimestamp = timestamp ? parseInt(timestamp, 10) : now;
    const ageSeconds = now - webhookTimestamp;

    let verified = false;

    switch (this.config.signatureAlgorithm) {
      case "hmac-sha256":
        verified = await this.verifyHmacSha256(payload, signature);
        break;
      case "hmac-sha512":
        verified = await this.verifyHmacSha512(payload, signature);
        break;
      case "ed25519":
        verified = await this.verifyEd25519(payload, signature);
        break;
      case "rsa-sha256":
        verified = await this.verifyRsaSha256(payload, signature);
        break;
    }

    // Replay protection: check if we've seen this signature before
    const webhookId = `${this.config.provider}:${signature}`;
    if (this.processedWebhooks.has(webhookId)) {
      verified = false;
    }

    // Timestamp validation (prevent replay attacks)
    const timestampValid = ageSeconds <= this.config.maxAgeSeconds;

    if (verified && timestampValid) {
      this.processedWebhooks.add(webhookId);
    }

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      parsedPayload = null;
    }

    return {
      payload,
      parsedPayload,
      verified,
      signature,
      timestamp,
      timestampValid,
      ageSeconds,
      provider: this.config.provider,
      webhookId,
      verificationTime: new Date().toISOString(),
    };
  }

  private async verifyHmacSha256(payload: string, signature: string): Promise<boolean> {
    if (!this.config.secret) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.config.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison to prevent timing attacks
    return this.constantTimeCompare(computedSignature, signature.replace(/^v0=/, ""));
  }

  private async verifyHmacSha512(payload: string, signature: string): Promise<boolean> {
    if (!this.config.secret) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.config.secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return this.constantTimeCompare(computedSignature, signature);
  }

  private async verifyEd25519(_payload: string, _signature: string): Promise<boolean> {
    // Ed25519 verification using Web Crypto (if available) or external library
    // This is a placeholder - implement based on your crypto library
    if (!this.config.publicKey) return false;
    // Implementation depends on Web Crypto support or libsodium
    return false; // Placeholder
  }

  private async verifyRsaSha256(payload: string, signature: string): Promise<boolean> {
    if (!this.config.publicKey) return false;

    const encoder = new TextEncoder();

    try {
      const publicKey = await crypto.subtle.importKey(
        "spki",
        this.pemToArrayBuffer(this.config.publicKey),
        { name: "RSA-PSS", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const signatureBuffer = this.base64ToArrayBuffer(signature);

      return await crypto.subtle.verify(
        { name: "RSA-PSS", saltLength: 32 },
        publicKey,
        signatureBuffer,
        encoder.encode(payload)
      );
    } catch {
      return false;
    }
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  private pemToArrayBuffer(pem: string): ArrayBuffer {
    const base64 = pem
      .replace(/-----BEGIN PUBLIC KEY-----/, "")
      .replace(/-----END PUBLIC KEY-----/, "")
      .replace(/\n/g, "");
    return this.base64ToArrayBuffer(base64);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Provider-specific webhook configurations
export const WEBHOOK_PROVIDER_CONFIGS: Record<string, WebhookConfig> = {
  stripe: {
    provider: "stripe",
    signatureAlgorithm: "hmac-sha256",
    signatureHeader: "Stripe-Signature",
    timestampHeader: "t", // Parsed from Stripe-Signature header
    maxAgeSeconds: 300,
    retryEnabled: true,
    retryCount: 3,
    retryDelayMs: 1000,
  },
  slack: {
    provider: "slack",
    signatureAlgorithm: "hmac-sha256",
    signatureHeader: "X-Slack-Signature",
    timestampHeader: "X-Slack-Request-Timestamp",
    maxAgeSeconds: 300,
    retryEnabled: false,
    retryCount: 0,
    retryDelayMs: 0,
  },
  github: {
    provider: "github",
    signatureAlgorithm: "hmac-sha256",
    signatureHeader: "X-Hub-Signature-256",
    maxAgeSeconds: 300,
    retryEnabled: true,
    retryCount: 3,
    retryDelayMs: 1000,
  },
  hubspot: {
    provider: "hubspot",
    signatureAlgorithm: "hmac-sha256",
    signatureHeader: "X-HubSpot-Signature",
    maxAgeSeconds: 300,
    retryEnabled: true,
    retryCount: 3,
    retryDelayMs: 1000,
  },
  zendesk: {
    provider: "zendesk",
    signatureAlgorithm: "hmac-sha256",
    signatureHeader: "X-Zendesk-Webhook-Signature",
    maxAgeSeconds: 300,
    retryEnabled: true,
    retryCount: 3,
    retryDelayMs: 1000,
  },
  intercom: {
    provider: "intercom",
    signatureAlgorithm: "hmac-sha256",
    signatureHeader: "X-Intercom-Signature",
    maxAgeSeconds: 300,
    retryEnabled: true,
    retryCount: 3,
    retryDelayMs: 1000,
  },
  "whatsapp-business": {
    provider: "whatsapp-business",
    signatureAlgorithm: "hmac-sha256",
    signatureHeader: "X-Hub-Signature-256", // Meta/Facebook signature
    maxAgeSeconds: 300,
    retryEnabled: true,
    retryCount: 3,
    retryDelayMs: 1000,
  },
};

// =============================================================================
// WEBHOOK INGESTION WITH VERIFICATION
// =============================================================================

export interface WebhookIngestionRequest {
  // Raw request
  provider: string;
  payload: string;
  headers: Record<string, string>;
  // Context
  tenantId?: string; // May be derived from payload
  correlationContext?: Partial<CorrelationContext>;
  // Options
  skipVerification?: boolean; // For testing only
  idempotencyKey?: string;
}

export interface WebhookIngestionResult {
  success: boolean;
  webhookId: string;
  verification: VerifiedWebhook;
  // If accepted
  accepted: boolean;
  eventId?: string;
  correlationId: string;
  // If rejected
  rejectedReason?:
    | "invalid_signature"
    | "timestamp_expired"
    | "replay_detected"
    | "invalid_payload"
    | "tenant_not_found"
    | "idempotency_conflict";
  // Processing
  enqueuedTo?: string;
  processingStartedAt?: string;
}

// Unified webhook handler interface
export interface WebhookHandler {
  // Verify and ingest
  ingest(request: WebhookIngestionRequest): Promise<WebhookIngestionResult>;

  // Get provider config
  getProviderConfig(provider: string): WebhookConfig;

  // Register webhook endpoint for a tenant
  registerEndpoint(
    tenantId: string,
    provider: string,
    endpointUrl: string,
    secret: string
  ): Promise<void>;

  // Rotate webhook secret
  rotateSecret(tenantId: string, provider: string): Promise<{ newSecret: string }>;
}
