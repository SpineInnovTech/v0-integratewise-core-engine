/**
 * Data Loader Handlers
 * These handle data ingestion from various sources
 */

import { createGenericHandler } from "../lib/generic-handler";

// Slack Loader
export const slackLoaderHandler = createGenericHandler({
  toolId: "loader-slack",
  toolName: "Slack Loader",
  validatePayload: (body) => {
    if (typeof body !== "object" || body === null) {
      return { valid: false, error: "Payload must be an object" };
    }
    const payload = body as Record<string, unknown>;
    if (!payload.workspaceId && !payload.teamId) {
      return { valid: false, error: "workspaceId or teamId required" };
    }
    return { valid: true };
  },
});

// HubSpot Loader
export const hubspotLoaderHandler = createGenericHandler({
  toolId: "loader-hubspot",
  toolName: "HubSpot Loader",
  validatePayload: (body) => {
    if (typeof body !== "object" || body === null) {
      return { valid: false, error: "Payload must be an object" };
    }
    const payload = body as Record<string, unknown>;
    if (!payload.accountId && !payload.portalId) {
      return { valid: false, error: "accountId or portalId required" };
    }
    return { valid: true };
  },
});

// Notion Loader
export const notionLoaderHandler = createGenericHandler({
  toolId: "loader-notion",
  toolName: "Notion Loader",
  validatePayload: (body) => {
    if (typeof body !== "object" || body === null) {
      return { valid: false, error: "Payload must be an object" };
    }
    const payload = body as Record<string, unknown>;
    if (!payload.workspaceId) {
      return { valid: false, error: "workspaceId required" };
    }
    return { valid: true };
  },
});

// Gmail Loader
export const gmailLoaderHandler = createGenericHandler({
  toolId: "loader-gmail",
  toolName: "Gmail Loader",
  validatePayload: (body) => {
    if (typeof body !== "object" || body === null) {
      return { valid: false, error: "Payload must be an object" };
    }
    const payload = body as Record<string, unknown>;
    if (!payload.userId && !payload.email) {
      return { valid: false, error: "userId or email required" };
    }
    return { valid: true };
  },
});

// Google Sheets Loader
export const sheetsLoaderHandler = createGenericHandler({
  toolId: "loader-sheets",
  toolName: "Google Sheets Loader",
  validatePayload: (body) => {
    if (typeof body !== "object" || body === null) {
      return { valid: false, error: "Payload must be an object" };
    }
    const payload = body as Record<string, unknown>;
    if (!payload.spreadsheetId) {
      return { valid: false, error: "spreadsheetId required" };
    }
    return { valid: true };
  },
});
