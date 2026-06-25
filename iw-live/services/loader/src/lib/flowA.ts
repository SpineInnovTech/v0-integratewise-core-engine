import type { Context } from "hono";
import { processWebhook, type PipelineResult } from "../pipeline";

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

/**
 * Process Flow A: Store Raw -> Normalize via Pipeline -> Store Spine
 *
 * This function now delegates to the centralized pipeline which:
 * 1. Calls Normalizer /v1/normalize
 * 2. Stores canonical data to Spine
 * 3. Handles DLQ routing for failures
 */
export async function processFlowA(
  c: Context,
  data: {
    source: string;
    externalId: string;
    eventType: string;
    payload: any;
    tenantId?: string;
  }
): Promise<PipelineResult> {
  const log = c.get("log") as Log;

  try {
    // Store raw webhook first (for audit trail)
    await storeRawWebhook(c, data, log);

    // Process through normalization pipeline
    const result = await processWebhook(c, data);

    if (result.success) {
      log.info("Flow A complete: Entity persisted via pipeline", {
        entityId: result.entity_id,
        entityType: result.entity_type,
        version: result.version,
        source: data.source,
        eventType: data.eventType,
      });
    } else {
      log.warn("Flow A: Pipeline returned failure", {
        dlq: result.dlq,
        errors: result.errors,
        source: data.source,
        eventType: data.eventType,
      });
    }

    return result;
  } catch (error) {
    log.error("Flow A orchestration error", {
      error: error instanceof Error ? error.message : "Unknown error",
      source: data.source,
      eventType: data.eventType,
    });

    return {
      success: false,
      entity_type: "unknown",
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Store raw webhook data for audit trail
 */
async function storeRawWebhook(
  c: Context,
  data: {
    source: string;
    externalId: string;
    eventType: string;
    payload: any;
  },
  log: Log
): Promise<string | null> {
  try {
    const rawStoreResponse = await fetch(`${c.env.STORE_URL}/webhooks/raw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: data.source,
        event_type: data.eventType,
        event_id: data.externalId,
        payload: data.payload,
        metadata: { request_id: c.get("requestId") },
      }),
    });

    if (!rawStoreResponse.ok) {
      log.warn("Raw storage failed", { status: rawStoreResponse.status });
      return null;
    }

    const { id: rawId } = (await rawStoreResponse.json()) as { id: string };
    return rawId;
  } catch (error) {
    log.warn("Raw storage error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}
