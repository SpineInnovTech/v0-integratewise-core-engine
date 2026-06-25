/**
 * Loader Pipeline - Entry Point for ALL Data Ingestion (KT Note §6, §7)
 *
 * This is the FIRST STAGE of the mandatory pipeline. ALL data, regardless of source,
 * enters IntegrateWise through this path.
 *
 * KT NOTE: "No raw source bypasses the pipeline" (Rule 2)
 *
 * DATA FLOWS:
 *
 * Flow A (Structured):
 *   Webhook/Poll → Loader (this file) → 8-Stage Pipeline → Normalizer → Spine
 *
 * Flow B (Unstructured):
 *   File Upload → Loader → Extraction → Chunking → Knowledge (NOT Spine truth)
 *
 * Flow C (AI Sessions):
 *   AI Chat → Triage → Approval → Knowledge UI (NEVER direct to Spine)
 *
 * THE 8 STAGES (KT Note §7):
 * See services/normalizer/src/index.ts for full stage documentation
 *
 * ADAPTIVE SPINE:
 * - Resolves tenant_id → tenant_spine_config
 * - Restricts entity types and canonical fields to tenant's schema
 * - Schema is Backend IP - Frontend never sees entity_type or field names
 *
 * NO BYPASSES:
 * - No connector writes directly to Spine
 * - No raw source updates truth tables directly
 * - All changes go through pipeline → normalizer → sectorize
 */

import { run8StagePipeline, setMetricsKV } from "./pipeline-stages";
import { resolveTenantAdaptiveSchema } from "../../../packages/types/src/adaptive-schema";

// Default URLs - will be overridden by env vars passed via context
const DEFAULT_NORMALIZER_URL = "http://localhost:8786";
const DEFAULT_STORE_URL = "http://localhost:8787";

export interface PipelineResult {
  success: boolean;
  entity_type: string;
  entity_id?: string;
  canonical_record?: any;
  version?: number;
  dlq?: boolean;
  errors?: string[];
}

export interface PipelineContext {
  env: {
    NORMALIZER_URL?: string;
    STORE_URL?: string;
    DATABASE_URL?: string;
    FILES?: R2Bucket;
    THINK_QUEUE?: Queue;
    DB?: D1Database;
    COGNITIVE_EVENTS_URL?: string;
    /** When set, pipeline filters by tenant Spine config (Adaptive Spine). */
    SUPABASE_URL?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
  };
  requestId?: string;
  tenant_id?: string;
  category?: string;
  user_id?: string;
  account_id?: string;
  team_id?: string;
  user_role?: string;
  log?: {
    info: (msg: string, data?: Record<string, unknown>) => void;
    warn: (msg: string, data?: Record<string, unknown>) => void;
    error: (msg: string, data?: Record<string, unknown>) => void;
  };
}

/**
 * Maps webhook source to entity type
 */
export function mapSourceToEntityType(source: string, eventType?: string): string {
  const sourceMapping: Record<string, string | Record<string, string>> = {
    hubspot: {
      "contact.creation": "contact",
      "contact.propertyChange": "contact",
      "contact.deletion": "contact",
      "deal.creation": "deal",
      "deal.propertyChange": "deal",
      "deal.deletion": "deal",
      "company.creation": "account",
      "company.propertyChange": "account",
      "company.deletion": "account",
      default: "generic",
    },
    stripe: {
      "checkout.session.completed": "payment",
      "customer.subscription.created": "subscription",
      "customer.subscription.updated": "subscription",
      "customer.subscription.deleted": "subscription",
      "invoice.paid": "invoice",
      "invoice.payment_failed": "invoice",
      default: "payment",
    },
    slack: {
      message: "message",
      channel: "channel",
      user_change: "user",
      default: "message",
    },
    webflow: {
      form_submission: "form_submission",
      form_submit: "form_submission",
      collection_item_created: "cms_item",
      collection_item_updated: "cms_item",
      collection_item_deleted: "cms_item",
      ecommerce_order_created: "order",
      ecommerce_order_updated: "order",
      default: "cms_item",
    },
    notion: "page",
    discord: "message",
    asana: "task",
    github: "event",
  };

  const mapping = sourceMapping[source];

  if (typeof mapping === "string") {
    return mapping;
  }

  if (typeof mapping === "object" && eventType) {
    return mapping[eventType] || mapping.default || "generic";
  }

  return "generic";
}

/**
 * Process a single incoming webhook/data item through the normalization pipeline
 */
export async function processIncoming(
  entity_type: string,
  raw_data: any,
  tenant_id: string,
  source_system: string,
  context?: PipelineContext
): Promise<PipelineResult> {
  const normalizerUrl = context?.env?.NORMALIZER_URL || DEFAULT_NORMALIZER_URL;
  const storeUrl = context?.env?.STORE_URL || DEFAULT_STORE_URL;
  const log = context?.log;
  const requestId = context?.requestId || crypto.randomUUID();

  try {
    setMetricsKV((context?.env as any)?.METRICS);
    const resolvedSchema = await resolveTenantAdaptiveSchema({
      supabaseUrl: context?.env?.SUPABASE_URL,
      serviceRoleKey: context?.env?.SUPABASE_SERVICE_ROLE_KEY,
      tenantId: tenant_id,
    });
    const allowedDomainKeys = resolvedSchema?.domainKeys || [];
    // 0. Golden Path Wiring (Universal Stages)
    if (log?.info)
      log.info("Pipeline: Running 8-Stage Ingestion Pipeline", {
        requestId,
        allowedDomainKeys: allowedDomainKeys.length ? allowedDomainKeys : undefined,
        allowedEntityTypes: resolvedSchema?.allowedEntityTypes?.length
          ? resolvedSchema.allowedEntityTypes
          : undefined,
      });
    const processedData = await run8StagePipeline(raw_data, {
      tenant_id,
      source: source_system,
      requestId,
      entityTypeHint: entity_type,
      category: context?.category,
      user_id: context?.user_id,
      account_id: context?.account_id,
      team_id: context?.team_id,
      user_role: context?.user_role,
      db: context?.env?.DB,
      storeUrl: storeUrl,
      thinkQueue: context?.env?.THINK_QUEUE,
      allowedDomainKeys: allowedDomainKeys.length > 0 ? allowedDomainKeys : undefined,
      resolvedSchema,
    });

    // Check if pipeline detected a duplicate — skip downstream processing
    if (processedData?.__pipeline?.is_duplicate || processedData?.__pipeline?.skipped) {
      if (log?.info)
        log.info("Pipeline: Duplicate detected by 8-stage pipeline, skipping", { requestId });
      return {
        success: true,
        entity_type,
        entity_id: "duplicate",
        errors: ["Duplicate payload — skipped"],
      };
    }

    // Check write plan — if spine is false, skip normalization/storage
    const writePlan = processedData?.__pipeline?.write_plan;
    if (writePlan && !writePlan.spine) {
      if (log?.info)
        log.info("Pipeline: Write plan excludes spine, skipping store", {
          requestId,
          targets: writePlan.targets,
        });
      return {
        success: true,
        entity_type: processedData?.__pipeline?.entity_type || entity_type,
        errors: processedData?.__pipeline?.validation_errors,
      };
    }

    // 0.5. Large Data Offloading (R2)
    let finalPayload = processedData;
    let r2Key: string | undefined = undefined;

    if (context?.env?.FILES && JSON.stringify(processedData).length > 100 * 1024) {
      r2Key = `raw/${tenant_id}/${requestId}`;
      await context.env.FILES.put(r2Key, JSON.stringify(processedData), {
        customMetadata: {
          tenant_id,
          requestId,
          entity_type,
          source_system,
        },
      });
      finalPayload = { _r2_ref: r2Key };
      if (log?.info) log.info("Pipeline: Payload offloaded to R2", { r2Key, requestId });
    }

    // 1. Call Normalizer /v1/normalize
    if (log?.info) {
      log.info("Pipeline: Calling Normalizer", {
        entity_type,
        source_system,
        tenant_id,
        requestId,
      });
    }

    const normalizeResponse = await fetch(`${normalizerUrl}/v1/normalize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        "x-tenant-id": tenant_id,
      },
      body: JSON.stringify({
        entity_type,
        source_system,
        tenant_id,
        category: context?.category,
        user_id: context?.user_id,
        account_id: context?.account_id,
        team_id: context?.team_id,
        user_role: context?.user_role,
        raw_data: finalPayload, // Using offloaded ref if large
        metadata: {
          request_id: requestId,
          received_at: new Date().toISOString(),
          r2_key: r2Key,
        },
      }),
    });

    // Handle Normalizer response
    if (!normalizeResponse.ok) {
      const errorBody = await normalizeResponse.text().catch(() => "Unknown error");
      const isDlq = normalizeResponse.status === 422;

      if (log?.warn) {
        log.warn("Pipeline: Normalization failed", {
          status: normalizeResponse.status,
          dlq: isDlq,
          error: errorBody,
          requestId,
        });
      }

      return {
        success: false,
        entity_type,
        dlq: isDlq,
        errors: [`Normalization failed: ${errorBody}`],
      };
    }

    const normalizeResult = (await normalizeResponse.json()) as {
      success: boolean;
      entity_type: string;
      entity_id: string;
      canonical_record: any;
      version: number;
      errors?: string[];
    };

    if (!normalizeResult.success) {
      if (log?.warn) {
        log.warn("Pipeline: Normalizer returned failure", {
          errors: normalizeResult.errors,
          requestId,
        });
      }

      return {
        success: false,
        entity_type,
        dlq: true,
        errors: normalizeResult.errors || ["Normalization returned failure"],
      };
    }

    // 2. Store to appropriate Spine table
    if (log?.info) {
      log.info("Pipeline: Storing to Spine", {
        entity_type: normalizeResult.entity_type,
        entity_id: normalizeResult.entity_id,
        version: normalizeResult.version,
        requestId,
      });
    }

    const storeResponse = await fetch(`${storeUrl}/v1/spine/${normalizeResult.entity_type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        "x-tenant-id": tenant_id,
      },
      body: JSON.stringify({
        entity_id: normalizeResult.entity_id,
        tenant_id,
        source_system,
        canonical_record: normalizeResult.canonical_record,
        version: normalizeResult.version,
        metadata: {
          normalized_at: new Date().toISOString(),
          request_id: requestId,
        },
      }),
    });

    if (!storeResponse.ok) {
      const storeError = await storeResponse.text().catch(() => "Unknown store error");

      if (log?.error) {
        log.error("Pipeline: Store failed", {
          status: storeResponse.status,
          error: storeError,
          requestId,
        });
      }

      return {
        success: false,
        entity_type: normalizeResult.entity_type,
        entity_id: normalizeResult.entity_id,
        canonical_record: normalizeResult.canonical_record,
        version: normalizeResult.version,
        errors: [`Store failed: ${storeError}`],
      };
    }

    // 3. Asynchronous Analysis (Queue)
    if (context?.env?.THINK_QUEUE) {
      await context.env.THINK_QUEUE.send({
        tenant_id,
        entity_type: normalizeResult.entity_type,
        entity_id: normalizeResult.entity_id,
        canonical_record: normalizeResult.canonical_record,
        version: normalizeResult.version,
        correlation_id: requestId,
        metadata: {
          r2_key: r2Key,
          source: source_system,
          user_id: context?.user_id,
        },
      });
      if (log?.info) log.info("Pipeline: Message sent to THINK_QUEUE", { requestId });
    }

    // 4. Publish Cognitive Event (Frontend L3→L2 Trigger)
    // This notifies the frontend that ingestion completed so it can update completeness badges
    const cognitiveEventsUrl = context?.env?.COGNITIVE_EVENTS_URL;
    if (cognitiveEventsUrl) {
      try {
        await fetch(cognitiveEventsUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "ingestion_complete",
            payload: {
              entityId: normalizeResult.entity_id,
              entityType: normalizeResult.entity_type,
              tenantId: tenant_id,
              source: source_system,
              completeness: 85, // Will be updated by spine-v2 completeness calculation
              timestamp: new Date().toISOString(),
            },
          }),
        });
        if (log?.info)
          log.info("Pipeline: Cognitive event published", {
            requestId,
            entityId: normalizeResult.entity_id,
          });
      } catch (err) {
        // Non-blocking: cognitive events are best-effort
        if (log?.warn)
          log.warn("Pipeline: Cognitive event publish failed (non-blocking)", {
            requestId,
            error: (err as Error).message,
          });
      }
    }

    // 5. Success
    if (log?.info) {
      log.info("Pipeline: Complete", {
        entity_type: normalizeResult.entity_type,
        entity_id: normalizeResult.entity_id,
        version: normalizeResult.version,
        requestId,
      });
    }

    return {
      success: true,
      entity_type: normalizeResult.entity_type,
      entity_id: normalizeResult.entity_id,
      canonical_record: normalizeResult.canonical_record,
      version: normalizeResult.version,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (log?.error) {
      log.error("Pipeline: Unexpected error", {
        error: errorMessage,
        entity_type,
        source_system,
        requestId,
      });
    }

    return {
      success: false,
      entity_type,
      errors: [`Pipeline error: ${errorMessage}`],
    };
  }
}

/**
 * Process a batch of items through the pipeline
 */
export async function processBatch(
  items: Array<{ entity_type: string; data: any; event_type?: string }>,
  tenant_id: string,
  source_system: string,
  context?: PipelineContext
): Promise<PipelineResult[]> {
  const log = context?.log;

  if (log?.info) {
    log.info("Pipeline: Processing batch", {
      itemCount: items.length,
      source_system,
      tenant_id,
    });
  }

  const results = await Promise.allSettled(
    items.map((item) => {
      const resolvedEntityType =
        item.entity_type || mapSourceToEntityType(source_system, item.event_type);
      return processIncoming(resolvedEntityType, item.data, tenant_id, source_system, context);
    })
  );

  const pipelineResults: PipelineResult[] = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    const errorMessage =
      result.reason instanceof Error ? result.reason.message : "Unknown batch error";
    return {
      success: false,
      entity_type: items[index].entity_type || "unknown",
      errors: [`Batch processing error: ${errorMessage}`],
    };
  });

  const successCount = pipelineResults.filter((r) => r.success).length;
  const dlqCount = pipelineResults.filter((r) => r.dlq).length;
  const errorCount = pipelineResults.filter((r) => !r.success && !r.dlq).length;

  if (log?.info) {
    log.info("Pipeline: Batch complete", {
      total: items.length,
      success: successCount,
      dlq: dlqCount,
      errors: errorCount,
      source_system,
    });
  }

  return pipelineResults;
}

/**
 * Helper to create pipeline context from Hono context
 */
export function createPipelineContext(c: any): PipelineContext {
  return {
    env: {
      NORMALIZER_URL: c.env?.NORMALIZER_URL,
      STORE_URL: c.env?.STORE_URL,
      DATABASE_URL: c.env?.DATABASE_URL,
      DB: c.env?.DB,
      THINK_QUEUE: c.env?.THINK_QUEUE,
      FILES: c.env?.FILES,
      COGNITIVE_EVENTS_URL: c.env?.COGNITIVE_EVENTS_URL,
      SUPABASE_URL: c.env?.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: c.env?.SUPABASE_SERVICE_ROLE_KEY,
    },
    requestId: c.get?.("requestId") || crypto.randomUUID(),
    log: c.get?.("log") || {
      info: (msg: string, data?: any) => console.log(msg, data),
      warn: (msg: string, data?: any) => console.warn(msg, data),
      error: (msg: string, data?: any) => console.error(msg, data),
    },
  };
}

/**
 * Process webhook data through the pipeline (convenience wrapper)
 */
export async function processWebhook(
  c: any,
  data: {
    source: string;
    externalId: string;
    eventType: string;
    payload: any;
    tenantId?: string;
  }
): Promise<PipelineResult> {
  const context = createPipelineContext(c);
  const entityType = mapSourceToEntityType(data.source, data.eventType);
  const tenantId = data.tenantId || c.get?.("tenantId") || "default";

  return processIncoming(
    entityType,
    {
      ...data.payload,
      __meta: {
        external_id: data.externalId,
        event_type: data.eventType,
        source: data.source,
      },
    },
    tenantId,
    data.source,
    context
  );
}
