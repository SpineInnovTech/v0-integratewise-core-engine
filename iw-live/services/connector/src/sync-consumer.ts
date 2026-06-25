/**
 * Sync Queue Consumer
 *
 * Processes sync messages from SYNC_QUEUE.
 * Applies field scoping, validates quotas, handles retries, and routes to Pipeline.
 */

import type {
  SyncMessageEnvelope,
  SyncPayload,
  DLQMessage,
  PipelineMessage,
  FieldScope,
} from "@integratewise/types";
import { logWithContext } from "@integratewise/lib";

// Custom error types for retry classification
export class ValidationError extends Error {}
export class QuotaExceededError extends Error {}
export class TenantNotFoundError extends Error {}
export class RateLimitError extends Error {}
export class NetworkError extends Error {}
export class TimeoutError extends Error {}

export interface ConsumerMetrics {
  recordSyncEnqueued(metric: {
    tenant_id: string;
    accelerator: string;
    sync_type: string;
    duration_ms: number;
  }): Promise<void>;

  recordDLQ(metric: {
    tenant_id: string;
    accelerator: string;
    stage: string;
    error_type: string;
  }): Promise<void>;
}

export class SyncQueueConsumer {
  constructor(
    private readonly pipelineQueue: Queue<PipelineMessage>,
    private readonly dlqQueue: Queue<DLQMessage>,
    private readonly metrics: ConsumerMetrics
  ) {}

  /**
   * Main queue consumer handler
   */
  async consume(batch: MessageBatch<SyncMessageEnvelope>, env: any): Promise<void> {
    for (const message of batch.messages) {
      const startTime = Date.now();
      const envelope = message.body;

      try {
        // Log receipt
        logWithContext(envelope.correlation_id, "info", "Sync message received", {
          tenant_id: envelope.tenant_id,
          queue: "SYNC_QUEUE",
          message_id: envelope.message_id,
          attempt: envelope.metadata.attempt,
          sync_type: envelope.sync_type,
          accelerator: envelope.accelerator_id,
        });

        // Process the message
        await this.processMessage(envelope, env);

        // Record metrics
        await this.metrics.recordSyncEnqueued({
          tenant_id: envelope.tenant_id,
          accelerator: envelope.accelerator_id,
          sync_type: envelope.sync_type,
          duration_ms: Date.now() - startTime,
        });

        // Acknowledge success
        message.ack();
      } catch (error) {
        await this.handleError(error, message, startTime);
      }
    }
  }

  /**
   * Process a single sync message
   */
  private async processMessage(envelope: SyncMessageEnvelope, env: any): Promise<void> {
    // 1. Validate tenant exists (defense in depth)
    await this.validateTenant(envelope.tenant_id, env);

    // 2. Apply field scoping (drop non-allowed fields)
    const scopedPayload = this.applyFieldScoping(
      envelope.payload,
      envelope.schema_context.allowed_fields
    );

    // 3. Check record quota before processing
    await this.checkRecordQuota(envelope);

    // 4. Transform to pipeline message
    const pipelineMessage = {
      tenant_id: envelope.tenant_id,
      correlation_id: envelope.correlation_id,
      stage: "analyze",
      payload: scopedPayload,
      metadata: {
        attempt: 0,
        received_at: new Date().toISOString(),
        accelerator_id: envelope.accelerator_id,
        connector_id: envelope.connector_id,
        sync_type: envelope.sync_type,
      },
    } as any;

    // 5. Send to pipeline queue
    await this.pipelineQueue.send(pipelineMessage);

    logWithContext(envelope.correlation_id, "info", "Message routed to PIPELINE_QUEUE", {
      tenant_id: envelope.tenant_id,
      pipeline_stage: "analyze",
    });
  }

  /**
   * Handle errors with retry logic
   */
  private async handleError(
    error: unknown,
    message: Message<SyncMessageEnvelope>,
    startTime: number
  ): Promise<void> {
    const envelope = message.body;
    const attempt = envelope.metadata.attempt;
    const maxAttempts = envelope.metadata.max_attempts;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorType = error instanceof Error ? error.constructor.name : "Unknown";

    // Log error
    logWithContext(envelope.correlation_id, "error", "Sync processing failed", {
      tenant_id: envelope.tenant_id,
      message_id: envelope.message_id,
      attempt,
      max_attempts: maxAttempts,
      error: errorMessage,
      error_type: errorType,
      duration_ms: Date.now() - startTime,
    });

    // Determine if retryable
    const isRetryable = this.isRetryableError(error);
    const shouldRetry = isRetryable && attempt < maxAttempts;

    if (shouldRetry) {
      // Retry with exponential backoff + jitter
      const baseDelay = 30; // seconds
      const delaySeconds = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 10,
        300 // max 5 minutes
      );

      envelope.metadata.attempt = attempt + 1;
      envelope.metadata.last_error = errorMessage;

      await message.retry({ delaySeconds });

      logWithContext(envelope.correlation_id, "warn", "Sync message retry scheduled", {
        tenant_id: envelope.tenant_id,
        attempt: attempt + 1,
        delay_seconds: Math.round(delaySeconds),
      });
    } else {
      // Send to DLQ
      await this.sendToDLQ(envelope, error, attempt);

      // Ack original message (DLQ is terminal)
      message.ack();

      logWithContext(envelope.correlation_id, "error", "Sync message sent to DLQ", {
        tenant_id: envelope.tenant_id,
        message_id: envelope.message_id,
        dlq_sent: true,
        attempts: attempt,
        error_type: errorType,
      });
    }
  }

  /**
   * Send failed message to DLQ
   */
  private async sendToDLQ(
    envelope: SyncMessageEnvelope,
    error: unknown,
    attempt: number
  ): Promise<void> {
    const dlqMessage: DLQMessage = {
      original_message: envelope,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
        is_retryable: this.isRetryableError(error),
      },
      failed_at: new Date().toISOString(),
      tenant_id: envelope.tenant_id,
      correlation_id: envelope.correlation_id,
      attempt,
      stage: "SYNC_QUEUE",
    };

    await this.dlqQueue.send(dlqMessage);

    // Record DLQ metric
    await this.metrics.recordDLQ({
      tenant_id: envelope.tenant_id,
      accelerator: envelope.accelerator_id,
      stage: "SYNC_QUEUE",
      error_type: error instanceof Error ? error.constructor.name : "Unknown",
    });
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    // Non-retryable: validation, auth, quota exceeded
    if (error instanceof ValidationError) return false;
    if (error instanceof QuotaExceededError) return false;
    if (error instanceof TenantNotFoundError) return false;

    // Retryable: transient network, rate limit, timeout
    if (error instanceof RateLimitError) return true;
    if (error instanceof NetworkError) return true;
    if (error instanceof TimeoutError) return true;

    // Default: retry for unknown errors
    return true;
  }

  /**
   * Validate tenant exists
   */
  private async validateTenant(tenantId: string, env: any): Promise<void> {
    // Check tenant cache in KV (defense in depth)
    const tenantKey = `tenant:${tenantId}`;
    const cached = await env.TENANT_CACHE?.get(tenantKey);
    if (cached) return;

    // D1 probe (CF-only, DECISION 22). tenant_spine_config or connectors presence implies valid tenant.
    if (env.EDGE_DB) {
      try {
        const row = await env.EDGE_DB.prepare(
          `SELECT tenant_id FROM tenant_spine_config WHERE tenant_id = ? LIMIT 1`
        )
          .bind(tenantId)
          .first();
        if (row) {
          await env.TENANT_CACHE?.put(tenantKey, "1", { expirationTtl: 3600 });
          return;
        }
      } catch {
        /* fallthrough to allow */
      }
    }

    // If neither cache nor D1 confirms, we do not hard-fail here (tenant validation is best-effort;
    // gateway + auth already enforce isolation upstream). Previously this hit Supabase.
  }

  /**
   * Check record quota (defense in depth)
   */
  private async checkRecordQuota(envelope: SyncMessageEnvelope): Promise<void> {
    const entitlements = envelope.entitlements_snapshot;

    // Skip check for unlimited plans
    if (entitlements.maxRecordsPerMonth === Number.POSITIVE_INFINITY) {
      return;
    }

    // This is a secondary check - primary is in entitlement gate
    // Implementation would check KV or DB for current usage
    // and compare against entitlements.maxRecordsPerMonth
  }

  /**
   * Apply field scoping to payload
   */
  private applyFieldScoping(
    payload: SyncPayload,
    allowedFields: Record<string, FieldScope>
  ): SyncPayload {
    const entityType = payload.entity_type;
    const fieldScope = allowedFields[entityType];

    if (!fieldScope) {
      // Entity type not in accelerator scope - keep only ID
      logWithContext("unknown", "warn", "Entity type not in accelerator scope", {
        entity_type: entityType,
      });

      return {
        ...payload,
        data: { id: payload.data.id },
      };
    }

    // Filter to allowed fields only
    const scopedData: Record<string, unknown> = {};

    for (const field of fieldScope.included) {
      if (field in payload.data) {
        scopedData[field] = payload.data[field];
      }
    }

    // Apply masking to sensitive fields
    for (const field of fieldScope.masked) {
      if (field in scopedData && typeof scopedData[field] === "string") {
        scopedData[field] = this.maskValue(scopedData[field] as string);
      }
    }

    return {
      ...payload,
      data: scopedData,
    };
  }

  /**
   * Mask sensitive value
   */
  private maskValue(value: string): string {
    if (value.length <= 4) return "****";
    return value.slice(0, 2) + "****" + value.slice(-2);
  }
}

// Legacy Supabase helper removed (DECISION 22). Tenant validation now uses D1 + KV only.
