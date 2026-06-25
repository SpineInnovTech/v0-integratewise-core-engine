import type { Context } from "hono";
import { verifyHubSpotSignature } from "../lib/signature";
import { processFlowA } from "../lib/flowA";
import { mapSourceToEntityType } from "../pipeline";

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

export async function hubspotHandler(c: Context) {
  const log = c.get("log") as Log;

  // Get raw body for signature verification
  const rawBody = await c.req.text();
  const signature = c.req.header("x-hubspot-signature-v3");
  const timestamp = c.req.header("x-hubspot-request-timestamp");
  const requestUri = new URL(c.req.url).pathname;

  // Verify signature
  const isValid = await verifyHubSpotSignature(
    rawBody,
    signature ?? null,
    c.env.HUBSPOT_WEBHOOK_SECRET ?? null,
    c.req.method,
    requestUri,
    timestamp ?? null
  );

  if (!isValid) {
    log.warn("Invalid HubSpot signature", {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
    });
    return c.json({ error: "Invalid signature" }, 401);
  }

  // Parse body - HubSpot sends array of events
  const events = JSON.parse(rawBody);

  log.info("HubSpot webhook received", {
    eventCount: Array.isArray(events) ? events.length : 1,
  });

  const results = [];

  // Process each event
  for (const event of Array.isArray(events) ? events : [events]) {
    try {
      log.info("Processing HubSpot event", {
        eventId: event.eventId,
        subscriptionType: event.subscriptionType,
        objectType: event.objectType,
      });

      // Handle event types
      switch (event.subscriptionType) {
        case "contact.creation":
        case "contact.propertyChange":
        case "contact.deletion":
          await handleContactEvent(c, event, log);
          break;

        case "deal.creation":
        case "deal.propertyChange":
        case "deal.deletion":
          await handleDealEvent(c, event, log);
          break;

        case "company.creation":
        case "company.propertyChange":
        case "company.deletion":
          await handleCompanyEvent(c, event, log);
          break;

        default:
          log.info("Unhandled HubSpot event type", {
            subscriptionType: event.subscriptionType,
          });
      }

      // Forward to Flow A (Store Raw -> Normalize via Pipeline -> Store Spine)
      const entityType = mapSourceToEntityType("hubspot", event.subscriptionType);
      const pipelineResult = await processFlowA(c, {
        source: "hubspot",
        externalId: event.eventId?.toString() || crypto.randomUUID(),
        eventType: event.subscriptionType,
        payload: event,
      });

      // Log pipeline result
      log.info("HubSpot event pipeline result", {
        eventId: event.eventId,
        entityType,
        pipelineSuccess: pipelineResult.success,
        entityId: pipelineResult.entity_id,
        dlq: pipelineResult.dlq,
      });

      results.push({
        eventId: event.eventId,
        status: pipelineResult.success ? "processed" : "failed",
        entityType,
        entityId: pipelineResult.entity_id,
        dlq: pipelineResult.dlq,
      });
    } catch (error) {
      log.error("Failed to process HubSpot event", {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Send to dead letter queue
      await c.env.DEAD_LETTER_QUEUE?.send({
        source: "hubspot",
        eventId: event.eventId,
        eventType: event.subscriptionType,
        payload: event,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });

      results.push({ eventId: event.eventId, status: "failed" });
    }
  }

  return c.json({ received: true, results });
}

async function handleContactEvent(_c: Context, event: any, log: Log) {
  log.info("Contact event", {
    eventId: event.eventId,
    objectId: event.objectId,
    subscriptionType: event.subscriptionType,
    propertyName: event.propertyName,
  });
}

async function handleDealEvent(_c: Context, event: any, log: Log) {
  log.info("Deal event", {
    eventId: event.eventId,
    objectId: event.objectId,
    subscriptionType: event.subscriptionType,
    propertyName: event.propertyName,
  });
}

async function handleCompanyEvent(_c: Context, event: any, log: Log) {
  log.info("Company event", {
    eventId: event.eventId,
    objectId: event.objectId,
    subscriptionType: event.subscriptionType,
    propertyName: event.propertyName,
  });
}
