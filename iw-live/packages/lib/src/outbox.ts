/**
 * Outbox Pattern Implementation
 *
 * Reliable event delivery with transactional outbox pattern.
 * Events are stored in a table and processed asynchronously
 * with retries and backoff.
 *
 * @integratewise/lib
 */

import { ResilientApiClient, ApiClientFactory } from "./api-client";
import { withApiResilience, createAppError } from "./error-handling";

export interface OutboxEvent {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  destinationUrl?: string;
  tenantId: string;
  createdAt: Date;
  processedAt?: Date;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  lastError?: string;
  status: "pending" | "processing" | "completed" | "failed" | "dead_letter";
}

export interface OutboxOptions {
  /** Default max retry attempts */
  maxAttempts: number;
  /** Base delay for exponential backoff (ms) */
  baseDelayMs: number;
  /** Maximum delay between retries (ms) */
  maxDelayMs: number;
  /** Batch size for processing */
  batchSize: number;
}

const DEFAULT_OPTIONS: OutboxOptions = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 300_000, // 5 minutes
  batchSize: 50,
};

export type EventHandler = (event: OutboxEvent) => Promise<void>;

export interface OutboxProcessor {
  handlers: Map<string, EventHandler>;
  registerHandler(eventType: string, handler: EventHandler): void;
  processEvent(event: OutboxEvent): Promise<boolean>;
}

/**
 * SQL migrations for outbox tables
 */
export const OUTBOX_MIGRATIONS = `
-- Outbox Events Table
CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  destination_url TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter'))
);

-- Indexes for efficient processing
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_events(status, next_retry_at) 
  WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_outbox_tenant ON outbox_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_outbox_type ON outbox_events(event_type);

-- Dead letter queue view
CREATE OR REPLACE VIEW outbox_dead_letters AS
SELECT * FROM outbox_events WHERE status = 'dead_letter';
`;

/**
 * Calculate next retry time with exponential backoff
 */
export function calculateNextRetry(
  attempts: number,
  options: OutboxOptions = DEFAULT_OPTIONS
): Date {
  const delay = Math.min(options.baseDelayMs * Math.pow(2, attempts), options.maxDelayMs);
  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return new Date(Date.now() + delay + jitter);
}

/**
 * Create an outbox event record
 */
export function createOutboxEvent(
  eventType: string,
  payload: Record<string, unknown>,
  tenantId: string,
  options?: { destinationUrl?: string; maxAttempts?: number }
): Omit<OutboxEvent, "id" | "createdAt"> {
  return {
    eventType,
    payload,
    tenantId,
    destinationUrl: options?.destinationUrl,
    attempts: 0,
    maxAttempts: options?.maxAttempts ?? DEFAULT_OPTIONS.maxAttempts,
    status: "pending",
  };
}

/**
 * SQL queries for outbox operations
 */
export const outboxQueries = {
  /** Insert new event */
  insert: `
    INSERT INTO outbox_events (event_type, payload, destination_url, tenant_id, max_attempts)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,

  /** Get pending events for processing */
  getPending: `
    SELECT * FROM outbox_events
    WHERE status IN ('pending', 'failed')
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    ORDER BY created_at ASC
    LIMIT $1
    FOR UPDATE SKIP LOCKED
  `,

  /** Mark event as processing */
  markProcessing: `
    UPDATE outbox_events
    SET status = 'processing', attempts = attempts + 1
    WHERE id = $1
    RETURNING *
  `,

  /** Mark event as completed */
  markCompleted: `
    UPDATE outbox_events
    SET status = 'completed', processed_at = NOW()
    WHERE id = $1
  `,

  /** Mark event as failed with retry */
  markFailed: `
    UPDATE outbox_events
    SET status = CASE 
      WHEN attempts >= max_attempts THEN 'dead_letter'
      ELSE 'failed'
    END,
    last_error = $2,
    next_retry_at = $3
    WHERE id = $1
  `,

  /** Move to dead letter */
  moveToDeadLetter: `
    UPDATE outbox_events
    SET status = 'dead_letter', last_error = $2
    WHERE id = $1
  `,

  /** Retry dead letter event */
  retryDeadLetter: `
    UPDATE outbox_events
    SET status = 'pending', attempts = 0, next_retry_at = NULL
    WHERE id = $1 AND status = 'dead_letter'
  `,

  /** Cleanup old completed events */
  cleanup: `
    DELETE FROM outbox_events
    WHERE status = 'completed'
      AND processed_at < NOW() - INTERVAL '7 days'
  `,

  /** Get stats */
  getStats: `
    SELECT 
      status,
      event_type,
      COUNT(*) as count,
      AVG(attempts) as avg_attempts
    FROM outbox_events
    GROUP BY status, event_type
  `,
};

/**
 * Create an outbox processor with handlers
 */
export function createOutboxProcessor(): OutboxProcessor {
  const handlers = new Map<string, EventHandler>();

  return {
    handlers,

    registerHandler(eventType: string, handler: EventHandler) {
      handlers.set(eventType, handler);
    },

    async processEvent(event: OutboxEvent): Promise<boolean> {
      const handler = handlers.get(event.eventType);
      if (!handler) {
        console.warn(`No handler for event type: ${event.eventType}`);
        return false;
      }

      try {
        await handler(event);
        return true;
      } catch (error) {
        console.error(`Failed to process event ${event.id}:`, error);
        throw error;
      }
    },
  };
}

/**
 * Enhanced webhook delivery handler factory with resilience patterns
 */
export function createWebhookHandler(options?: {
  timeoutMs?: number;
  headers?: Record<string, string>;
  rateLimitType?: "token-bucket" | "sliding-window" | "adaptive";
  rateLimitConfig?: {
    capacity?: number;
    refillRate?: number;
    windowSize?: number;
    maxRequests?: number;
    baseRate?: number;
  };
  retryConfig?: {
    connectionMaxAttempts?: number;
    rateLimitMaxAttempts?: number;
    governorMaxAttempts?: number;
  };
}): EventHandler {
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const defaultHeaders = options?.headers ?? {};

  // Create a resilient API client for webhook delivery
  const apiClient = new ResilientApiClient({
    baseURL: "", // Will be set per request
    timeout: timeoutMs,
    rateLimitType: options?.rateLimitType || "adaptive",
    rateLimitConfig: options?.rateLimitConfig || { baseRate: 10 }, // 10 requests per second default
    retryConfig: options?.retryConfig || {
      connectionMaxAttempts: 10,
      rateLimitMaxAttempts: 5,
      governorMaxAttempts: 3,
    },
    headers: defaultHeaders,
  });

  return async (event: OutboxEvent) => {
    if (!event.destinationUrl) {
      throw createAppError("VALIDATION_ERROR", "No destination URL for webhook delivery");
    }

    try {
      // Use the resilient API client for webhook delivery
      await apiClient.request({
        method: "POST",
        path: event.destinationUrl, // Use full URL as path since baseURL is empty
        data: event.payload,
        headers: {
          "X-Event-Type": event.eventType,
          "X-Event-Id": event.id,
          "X-Attempt": String(event.attempts),
          "X-Tenant-Id": event.tenantId,
          "X-Created-At": event.createdAt.toISOString(),
        },
        correlationId: event.id, // Use event ID as correlation ID
      });

      // Record success for adaptive rate limiter
      apiClient.recordSuccess();
    } catch (error) {
      // Record error for adaptive rate limiter
      apiClient.recordError();

      // Re-throw with more context
      throw createAppError(
        "WEBHOOK_DELIVERY_FAILED",
        `Webhook delivery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        {
          operation: "webhook_delivery",
          eventId: event.id,
          eventType: event.eventType,
          destinationUrl: event.destinationUrl,
          attempt: event.attempts,
        },
        error instanceof Error ? error : undefined
      );
    }
  };
}

/**
 * Event types used in the system
 */
export const EventTypes = {
  // User events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",

  // Integration events
  INTEGRATION_CONNECTED: "integration.connected",
  INTEGRATION_DISCONNECTED: "integration.disconnected",
  INTEGRATION_SYNCED: "integration.synced",
  INTEGRATION_FAILED: "integration.failed",

  // Data events
  DATA_INGESTED: "data.ingested",
  DATA_PROCESSED: "data.processed",
  DATA_NORMALIZED: "data.normalized",

  // Signal events
  SIGNAL_DETECTED: "signal.detected",
  SIGNAL_ESCALATED: "signal.escalated",

  // Billing events
  SUBSCRIPTION_CREATED: "billing.subscription.created",
  SUBSCRIPTION_UPDATED: "billing.subscription.updated",
  SUBSCRIPTION_CANCELLED: "billing.subscription.cancelled",
  INVOICE_CREATED: "billing.invoice.created",
  INVOICE_PAID: "billing.invoice.paid",
  INVOICE_FAILED: "billing.invoice.failed",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];
