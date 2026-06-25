/**
 * Sync Queue Producer
 *
 * Enqueues sync requests after entitlement validation.
 * Handles idempotency, correlation tracking, and field scoping.
 */

import type {
  SyncMessageEnvelope,
  SyncRequest,
  EnqueueResult,
  SyncMetadata,
  SchemaContext,
  FieldScope,
} from "@integratewise/types";
import { ACCELERATOR_SYNC_REGISTRY } from "@integratewise/accelerators";
import { SyncEntitlementGate } from "./entitlement-gate";
import { generateCorrelationId, generateMessageId, logWithContext } from "@integratewise/lib";

export interface QueueProducerConfig {
  idempotencyTtlSeconds: number;
}

export class SyncQueueProducer {
  constructor(
    private readonly queue: Queue<SyncMessageEnvelope>,
    private readonly entitlementGate: SyncEntitlementGate,
    private readonly kv: KVNamespace,
    private readonly config: QueueProducerConfig = { idempotencyTtlSeconds: 3600 }
  ) {}

  /**
   * Enqueue a sync request after validation
   */
  async enqueueSync(tenantId: string, request: SyncRequest): Promise<EnqueueResult> {
    const correlationId = generateCorrelationId();

    try {
      // 1. Validate entitlements
      const entitlementCheck = await this.entitlementGate.validateSyncRequest(tenantId, request);

      if (!entitlementCheck.allowed) {
        logWithContext(correlationId, "warn", "Sync request blocked by entitlement", {
          tenant_id: tenantId,
          reason: entitlementCheck.reason,
          upgrade_required: entitlementCheck.upgradeRequired,
        });

        return {
          success: false,
          error: entitlementCheck.reason,
          upgradeRequired: entitlementCheck.upgradeRequired,
          retryAfterMinutes: entitlementCheck.retryAfterMinutes,
          correlation_id: correlationId,
        };
      }

      // 2. Resolve accelerator
      const accelerator = ACCELERATOR_SYNC_REGISTRY[request.acceleratorId];
      if (!accelerator) {
        logWithContext(correlationId, "error", "Unknown accelerator", {
          tenant_id: tenantId,
          accelerator_id: request.acceleratorId,
        });

        return {
          success: false,
          error: `Unknown accelerator: ${request.acceleratorId}`,
          correlation_id: correlationId,
        };
      }

      // 3. Build schema context for field scoping
      const schemaContext = this.buildSchemaContext(
        accelerator.syncScope,
        entitlementCheck.entitlements!
      );

      // 4. Check idempotency
      const idempotencyKey = this.buildIdempotencyKey(tenantId, request);
      const existing = await this.kv.get(idempotencyKey);

      if (existing) {
        logWithContext(correlationId, "info", "Duplicate sync request deduplicated", {
          tenant_id: tenantId,
          idempotency_key: idempotencyKey,
        });

        return {
          success: true,
          deduplicated: true,
          correlation_id: correlationId,
          error: "Duplicate sync request detected",
        };
      }

      // 5. Build message envelope
      const messageId = generateMessageId();
      const metadata: SyncMetadata = {
        attempt: 0,
        max_attempts: 3,
        received_at: new Date().toISOString(),
        priority: accelerator.syncScope.syncBehavior.priority,
        source: request.source,
      };

      const envelope: SyncMessageEnvelope = {
        tenant_id: tenantId,
        correlation_id: correlationId,
        message_id: messageId,
        sync_type: request.syncType,
        accelerator_id: request.acceleratorId,
        connector_id: request.connectorId,
        plan_tier: request.planTier,
        entitlements_snapshot: entitlementCheck.entitlements!,
        payload: request.payload,
        metadata,
        schema_context: schemaContext,
      };

      // 6. Enqueue to SYNC_QUEUE
      await this.queue.send(envelope, {
        contentType: "json",
      });

      // 7. Set idempotency key
      const ttl = Math.max(
        entitlementCheck.entitlements!.minSyncIntervalMinutes * 60,
        this.config.idempotencyTtlSeconds
      );
      await this.kv.put(idempotencyKey, messageId, { expirationTtl: ttl });

      // 8. Log success
      logWithContext(correlationId, "info", "Sync enqueued successfully", {
        tenant_id: tenantId,
        queue: "SYNC_QUEUE",
        message_id: messageId,
        accelerator: request.acceleratorId,
        sync_type: request.syncType,
        priority: metadata.priority,
      });

      return {
        success: true,
        correlation_id: correlationId,
        message_id: messageId,
      };
    } catch (error) {
      logWithContext(correlationId, "error", "Failed to enqueue sync", {
        tenant_id: tenantId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error: "Internal error enqueueing sync",
        correlation_id: correlationId,
      };
    }
  }

  /**
   * Enqueue multiple syncs (batch operation)
   */
  async enqueueBatch(tenantId: string, requests: SyncRequest[]): Promise<EnqueueResult[]> {
    // Validate all requests first
    const results: EnqueueResult[] = [];

    for (const request of requests) {
      const result = await this.enqueueSync(tenantId, request);
      results.push(result);
    }

    return results;
  }

  /**
   * Build schema context from accelerator scope
   */
  private buildSchemaContext(
    scope: import("@integratewise/types").AcceleratorSyncScope,
    entitlements: import("@integratewise/types").SyncEntitlements
  ): SchemaContext {
    // Filter entity types by entitlements
    const allowedEntityTypes = [...scope.primaryEntities, ...scope.secondaryEntities].filter(
      (et) =>
        entitlements.allowedEntityTypes.includes("*") ||
        entitlements.allowedEntityTypes.includes(et)
    );

    // Build field scopes for allowed entities only
    const allowedFields: Record<string, FieldScope> = {};
    for (const entityType of allowedEntityTypes) {
      if (scope.fieldScopes[entityType]) {
        allowedFields[entityType] = scope.fieldScopes[entityType];
      }
    }

    return {
      allowed_entity_types: allowedEntityTypes,
      allowed_fields: allowedFields,
      computed_fields: scope.computedEntities,
    };
  }

  /**
   * Build idempotency key for deduplication
   */
  private buildIdempotencyKey(tenantId: string, request: SyncRequest): string {
    // Include key fields that make a sync unique
    const keyParts = [
      "sync",
      tenantId,
      request.connectorId,
      request.acceleratorId,
      request.syncType,
      request.payload.checksum,
    ];
    return keyParts.join(":");
  }
}
