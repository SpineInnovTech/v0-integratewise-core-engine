/**
 * API Endpoint Handlers
 * Webhook versions of API endpoints
 */

import { createGenericHandler } from "../lib/generic-handler";

// Brainstorm Handler
export const brainstormHandler = createGenericHandler({
  toolId: "brainstorm",
  toolName: "Brainstorm",
  validatePayload: (body) => {
    if (typeof body !== "object" || body === null) {
      return { valid: false, error: "Payload must be an object" };
    }
    return { valid: true };
  },
});

// Neutron Ingest Handler
export const neutronIngestHandler = createGenericHandler({
  toolId: "neutron-ingest",
  toolName: "Neutron Ingest",
  validatePayload: (body) => {
    if (typeof body !== "object" || body === null) {
      return { valid: false, error: "Payload must be an object" };
    }
    const payload = body as Record<string, unknown>;
    if (!payload.data && !payload.events) {
      return { valid: false, error: "data or events required" };
    }
    return { valid: true };
  },
});

// Data Sync Handler
export const dataSyncHandler = createGenericHandler({
  toolId: "data-sync",
  toolName: "Data Sync",
  validatePayload: (body) => {
    if (typeof body !== "object" || body === null) {
      return { valid: false, error: "Payload must be an object" };
    }
    const payload = body as Record<string, unknown>;
    if (!payload.source && !payload.target) {
      return { valid: false, error: "source and target required" };
    }
    return { valid: true };
  },
});

// Webhook Scheduler Handler
export const webhookSchedulerHandler = createGenericHandler({
  toolId: "webhook-scheduler",
  toolName: "Webhook Scheduler",
  validatePayload: (body) => {
    if (typeof body !== "object" || body === null) {
      return { valid: false, error: "Payload must be an object" };
    }
    const payload = body as Record<string, unknown>;
    if (!payload.scheduleId && !payload.webhookId) {
      return { valid: false, error: "scheduleId or webhookId required" };
    }
    return { valid: true };
  },
});
