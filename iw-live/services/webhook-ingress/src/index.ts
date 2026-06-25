/**
 * Webhook Ingress Service - Real-time Connector Events
 *
 * Architecture v3.6: Receives webhooks from external systems and broadcasts
 * real-time updates to connected clients via Stream Gateway.
 *
 * Providers Supported:
 * - HubSpot (contact/deal/company changes)
 * - Salesforce (opportunity/account updates)
 * - Stripe (payment events)
 * - GitHub (push/pull_request/issue events)
 *
 * Data Flow:
 * External System → Webhook POST → Verify → Process → Broadcast → UI
 */

import { Hono } from "hono";
import { cors } from "hono/cors";

// Inline entity type alias resolution (avoids bundling issues)
function resolveEntityTypeAlias(raw: string): string {
  const aliases: Record<string, string> = {
    contact: "person",
    lead: "person",
    user: "person",
    customer: "person",
    deal: "opportunity",
    ticket: "support_ticket",
    issue: "support_ticket",
    task: "activity",
    event: "activity",
    meeting: "activity",
    call: "activity",
    email: "activity",
    note: "activity",
    pull_request: "code_change",
    commit: "code_change",
    push: "code_change",
  };
  const lower = raw.toLowerCase().replace(/[-\s]/g, "_");
  return aliases[lower] || lower;
}

interface Env {
  // Service bindings
  BFF: Fetcher;
  CONNECTOR: Fetcher;
  FOLDER_WATCHER: Fetcher;

  // Pipeline queue — webhook data enters 8-stage normalization
  PIPELINE_QUEUE: Queue;

  // KV stores
  WEBHOOK_LOG?: KVNamespace;
  WEBHOOK_SECRETS?: KVNamespace;
  CONNECTOR_STATUS: KVNamespace;

  // Secrets
  HUBSPOT_WEBHOOK_SECRET?: string;
  SALESFORCE_WEBHOOK_SECRET?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  GITHUB_WEBHOOK_SECRET?: string;
  /** Optional: Slack signing secret for /webhooks/slack* signature verification */
  SLACK_SIGNING_SECRET?: string;
  /** Nango webhook HMAC secret */
  NANGO_WEBHOOK_SECRET?: string;
  /** Runtime env name (wrangler var) */
  ENVIRONMENT?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// =============================================================================
// HEALTH & STATUS
// =============================================================================

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "webhook-ingress",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    supported_providers: ["hubspot", "salesforce", "stripe", "github", "slack"],
  });
});

// =============================================================================
// FOLDER MONITOR WEBHOOK HANDLER
// =============================================================================

app.post("/webhooks/folder-monitor", async (c) => {
  try {
    // Parse and validate the incoming JSON
    const bodyText = await c.req.text();

    // Forward directly to the FOLDER_WATCHER service with proper headers
    const response = await c.env.FOLDER_WATCHER.fetch(
      new Request("https://local/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: c.req.header("Authorization") || "",
        },
        body: bodyText,
      })
    );

    const responseBody = await response.text();
    return new Response(responseBody, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Folder Monitor Webhook] Error:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});

// =============================================================================
// HUBSPOT WEBHOOK HANDLER
// =============================================================================

/**
 * HubSpot webhook endpoint
 * Receives: contact.creation, contact.propertyChange, deal.creation, etc.
 * Docs: https://developers.hubspot.com/docs/api/webhooks
 */
app.post("/webhooks/hubspot", async (c) => {
  const startTime = Date.now();
  const body = await c.req.text();
  const signature = c.req.header("X-HubSpot-Signature") || c.req.header("X-HubSpot-Signature-v3");
  const timestampHeader = c.req.header("X-HubSpot-Request-Timestamp");

  // Preferred: gateway registers tenant-scoped URLs (config endpoint returns ?tenantId=...).
  // Fallback: resolve from HubSpot appId mapping in KV.
  const tenantIdFromQuery = c.req.query("tenantId") || c.req.query("tenant_id") || null;
  const appId = c.req.query("appId");

  // Verify signature if secret configured
  if (c.env.HUBSPOT_WEBHOOK_SECRET) {
    if (!signature) {
      return c.json({ error: "Missing signature" }, 401);
    }
    const isValid = await verifyHubSpotSignature({
      body,
      signature,
      secret: c.env.HUBSPOT_WEBHOOK_SECRET,
      method: c.req.method,
      url: c.req.url,
      timestampHeader,
    });
    if (!isValid) {
      console.error("[HubSpot Webhook] Invalid signature");
      return c.json({ error: "Invalid signature" }, 401);
    }
  }

  try {
    const events = JSON.parse(body);
    const normalizedEvents = Array.isArray(events) ? events : [events];
    const first = normalizedEvents[0];
    const tenantId =
      (await resolveTenantFromHubSpotPortalId(first?.portalId, c.env)) ||
      (await resolveTenantFromAppId(appId, c.env)) ||
      tenantIdFromQuery;
    if (!tenantId) return c.json({ error: "Unknown tenant" }, 401);
    if (
      await reserveWebhookDelivery(
        c.env,
        "hubspot",
        extractHubSpotDeliveryId(normalizedEvents, timestampHeader)
      )
    ) {
      return c.json({ success: true, duplicate: true, tenantId });
    }
    const results = [];

    for (const event of normalizedEvents) {
      const result = await processHubSpotEvent(event, tenantId, c.env);
      results.push(result);

      // Forward to pipeline for 8-stage normalization → Spine
      await forwardToPipeline(c.env, tenantId, "hubspot", event.eventType || "unknown", event);

      // Broadcast real-time update
      await broadcastConnectorEvent(
        {
          tenantId,
          eventType: `hubspot.${event.eventType}`,
          entityType: resolveEntityTypeAlias(event.objectType || "activity"),
          entityId: event.objectId,
          timestamp: event.occurredAt || new Date().toISOString(),
          payload: event,
        },
        c.env
      );
    }

    // Log webhook
    if (c.env.WEBHOOK_LOG) {
      await c.env.WEBHOOK_LOG.put(
        `webhook:${tenantId}:hubspot:${Date.now()}`,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          provider: "hubspot",
          tenantId,
          eventCount: results.length,
          processingTime: Date.now() - startTime,
        }),
        { expirationTtl: 86400 * 7 } // 7 days retention
      );
    }

    return c.json({
      success: true,
      processed: results.length,
      tenantId,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error("[HubSpot Webhook] Processing error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Processing failed",
      },
      500
    );
  }
});

// =============================================================================
// SALESFORCE WEBHOOK HANDLER (Platform Events)
// =============================================================================

app.post("/webhooks/salesforce", async (c) => {
  const body = await c.req.text();

  // Salesforce uses certificate-based auth, verify if needed
  // Prefer signed organization mapping; allow query fallback only outside production.
  const tenantIdFromQuery = c.req.query("tenantId") || c.req.query("tenant_id") || null;
  const signatureHeader = c.req.header("x-salesforce-signature");

  try {
    const event = JSON.parse(body);
    const tenantId =
      (await resolveTenantFromSalesforceOrgId(event, c.env)) ||
      (c.env.ENVIRONMENT !== "production" ? tenantIdFromQuery : null);

    if (!tenantId) {
      return c.json({ error: "Unknown tenant" }, 401);
    }

    if (
      await reserveWebhookDelivery(
        c.env,
        "salesforce",
        extractSalesforceDeliveryId(event, signatureHeader)
      )
    ) {
      return c.json({ success: true, duplicate: true, tenantId });
    }

    await processSalesforceEvent(event, tenantId, c.env);

    // Forward to pipeline
    await forwardToPipeline(
      c.env,
      tenantId,
      "salesforce",
      event.event?.type || "update",
      event.payload?.sobject || event
    );

    // Broadcast real-time update
    await broadcastConnectorEvent(
      {
        tenantId,
        eventType: `salesforce.${event.event?.type}`,
        entityType: resolveEntityTypeAlias(event.payload?.sobject?.attributes?.type || "activity"),
        entityId: event.payload?.sobject?.Id,
        timestamp: event.event?.createdDate || new Date().toISOString(),
        payload: event.payload?.sobject,
      },
      c.env
    );

    return c.json({ success: true, tenantId });
  } catch (error) {
    console.error("[Salesforce Webhook] Processing error:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});

// =============================================================================
// SLACK WEBHOOK HANDLERS
// =============================================================================

/**
 * Slack Workflow Builder step execution.
 * Expects tenant-scoped webhook URL: /webhooks/slack-workflow?tenantId=...
 */
app.post("/webhooks/slack-workflow", async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("x-slack-signature");
  const timestamp = c.req.header("x-slack-request-timestamp");

  if (c.env.SLACK_SIGNING_SECRET) {
    const ok = await verifySlackSignature(
      rawBody,
      signature ?? null,
      timestamp ?? null,
      c.env.SLACK_SIGNING_SECRET
    );
    if (!ok) return c.json({ error: "Invalid signature" }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const teamId = String(payload?.team_id || payload?.team?.id || payload?.teamId || "");
  const tenantIdFromKV = teamId
    ? await c.env.CONNECTOR_STATUS.get(`slack:workspace:${teamId}:tenant`)
    : null;
  const tenantIdFromQuery = c.req.query("tenantId") || c.req.query("tenant_id") || null;
  const tenantId =
    tenantIdFromKV || (c.env.ENVIRONMENT !== "production" ? tenantIdFromQuery : null);
  if (!tenantId) return c.json({ error: "Unknown tenant" }, 401);

  if (await reserveWebhookDelivery(c.env, "slack-workflow", extractSlackDeliveryId(payload))) {
    return c.json({
      outputs: {
        status: { value: "duplicate" },
      },
    });
  }

  await forwardToPipeline(c.env, tenantId, "slack", "workflow_step", payload);
  await broadcastConnectorEvent(
    {
      tenantId,
      eventType: "slack.workflow_step",
      entityType: "interaction_event",
      timestamp: new Date().toISOString(),
      payload,
    },
    c.env
  );

  // Minimal workflow outputs so Slack step can proceed.
  return c.json({
    outputs: {
      status: { value: "queued" },
    },
  });
});

/**
 * Slack interactivity payloads are sent as application/x-www-form-urlencoded with a `payload` field.
 * Expects tenant-scoped webhook URL: /webhooks/slack/interactivity?tenantId=...
 */
app.post("/webhooks/slack/interactivity", async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("x-slack-signature");
  const timestamp = c.req.header("x-slack-request-timestamp");

  if (c.env.SLACK_SIGNING_SECRET) {
    const ok = await verifySlackSignature(
      rawBody,
      signature ?? null,
      timestamp ?? null,
      c.env.SLACK_SIGNING_SECRET
    );
    if (!ok) return c.json({ error: "Invalid signature" }, 401);
  }

  const params = new URLSearchParams(rawBody);
  const payloadRaw = params.get("payload");
  if (!payloadRaw) return c.json({ error: "Missing payload" }, 400);

  let payload: any;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return c.json({ error: "Invalid payload JSON" }, 400);
  }

  const teamId = String(payload?.team?.id || payload?.team_id || payload?.teamId || "");
  const tenantIdFromKV = teamId
    ? await c.env.CONNECTOR_STATUS.get(`slack:workspace:${teamId}:tenant`)
    : null;
  const tenantIdFromQuery = c.req.query("tenantId") || c.req.query("tenant_id") || null;
  const tenantId =
    tenantIdFromKV || (c.env.ENVIRONMENT !== "production" ? tenantIdFromQuery : null);
  if (!tenantId) return c.json({ error: "Unknown tenant" }, 401);

  if (await reserveWebhookDelivery(c.env, "slack-interactivity", extractSlackDeliveryId(payload))) {
    return c.json({ response_type: "ephemeral", text: "Duplicate ignored" });
  }

  await forwardToPipeline(c.env, tenantId, "slack", "interactivity", payload);
  await broadcastConnectorEvent(
    {
      tenantId,
      eventType: "slack.interactivity",
      entityType: "interaction_event",
      timestamp: new Date().toISOString(),
      payload,
    },
    c.env
  );

  return c.json({ response_type: "ephemeral", text: "Received" });
});

// =============================================================================
// STRIPE WEBHOOK HANDLER
// =============================================================================

app.post("/webhooks/stripe", async (c) => {
  const body = await c.req.text();
  const signature = c.req.header("Stripe-Signature");

  // Verify Stripe signature
  if (c.env.STRIPE_WEBHOOK_SECRET) {
    if (!signature) {
      return c.json({ error: "Missing signature" }, 401);
    }
    const isValid = await verifyStripeSignature(body, signature, c.env.STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      return c.json({ error: "Invalid signature" }, 401);
    }
  }

  try {
    const event = JSON.parse(body);
    if (await reserveWebhookDelivery(c.env, "stripe", extractStripeDeliveryId(event))) {
      return c.json({ received: true, duplicate: true });
    }
    const tenantId = await resolveTenantFromCustomerId(event.data?.object?.customer, c.env);

    if (tenantId) {
      // Forward to pipeline
      await forwardToPipeline(c.env, tenantId, "stripe", event.type, event.data?.object);

      await broadcastConnectorEvent(
        {
          tenantId,
          eventType: `stripe.${event.type}`,
          entityType: "payment",
          timestamp: new Date().toISOString(),
          payload: event.data?.object,
        },
        c.env
      );
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});

// =============================================================================
// GITHUB WEBHOOK HANDLER
// =============================================================================

app.post("/webhooks/github", async (c) => {
  const body = await c.req.text();
  const signature = c.req.header("X-Hub-Signature-256");
  const eventType = c.req.header("X-GitHub-Event");

  // Verify signature
  if (c.env.GITHUB_WEBHOOK_SECRET) {
    if (!signature) {
      return c.json({ error: "Missing signature" }, 401);
    }
    const isValid = await verifyGitHubSignature(body, signature, c.env.GITHUB_WEBHOOK_SECRET);
    if (!isValid) {
      return c.json({ error: "Invalid signature" }, 401);
    }
  }

  try {
    const payload = JSON.parse(body);
    const tenantIdFromQuery = c.req.query("tenantId") || c.req.query("tenant_id") || null;
    const tenantId =
      (await resolveTenantFromGitHubInstallation(payload, c.env)) ||
      (c.env.ENVIRONMENT !== "production" ? tenantIdFromQuery : null);

    if (!tenantId) {
      return c.json({ error: "Unknown tenant" }, 401);
    }

    if (
      await reserveWebhookDelivery(
        c.env,
        "github",
        extractGitHubDeliveryId(c.req.header("X-GitHub-Delivery"), payload)
      )
    ) {
      return c.json({ success: true, duplicate: true, tenantId });
    }

    // Forward to pipeline
    await forwardToPipeline(c.env, tenantId, "github", eventType || "push", payload);

    await broadcastConnectorEvent(
      {
        tenantId,
        eventType: `github.${eventType}`,
        entityType: resolveEntityTypeAlias(
          payload.pull_request ? "pull_request" : payload.issue ? "issue" : "push"
        ),
        timestamp: new Date().toISOString(),
        payload,
      },
      c.env
    );

    return c.json({ success: true, tenantId });
  } catch (error) {
    console.error("[GitHub Webhook] Error:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});

// =============================================================================
// NANGO WEBHOOK HANDLER
// =============================================================================

/**
 * Nango sends webhooks after connection events (sync complete, auth refresh, errors).
 * Signature: HMAC-SHA256 of body using NANGO_WEBHOOK_SECRET, sent as X-Nango-Signature.
 *
 * Events:
 * - connection.created: new tool connected → trigger creamy layer
 * - sync.success: delta sync completed
 * - sync.error: sync failed
 * - connection.deleted: tool disconnected
 */
app.post("/webhooks/nango", async (c) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header("X-Nango-Signature") || c.req.header("x-nango-signature");
    const nangoSecret = (c.env as any).NANGO_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (nangoSecret) {
      if (!signature) {
        console.error("[Nango Webhook] Missing signature header");
        return c.json({ error: "Missing signature" }, 401);
      }

      const isValid = await verifyNangoSignature(body, signature, nangoSecret);
      if (!isValid) {
        console.error("[Nango Webhook] Invalid signature");
        return c.json({ error: "Invalid signature" }, 401);
      }
    }

    const payload = JSON.parse(body);
    const eventType = payload.type || payload.event || "unknown";
    const connectionId = payload.connectionId || payload.connection_id;
    const provider = payload.provider || payload.providerConfigKey || "unknown";

    // Resolve tenant from connection ID (format: tenant_id or custom mapping)
    const tenantId = connectionId || "iw-customer-zero";

    console.log(`[Nango Webhook] ${eventType} from ${provider} for tenant ${tenantId}`);

    // Update connector status in KV
    if (c.env.CONNECTOR_STATUS) {
      const statusKey = `sync:${tenantId}:${provider}`;
      const statusMap: Record<string, string> = {
        "connection.created": "oauth_complete",
        "sync.success": "sync_complete",
        "sync.error": "sync_error",
        "connection.deleted": "not_connected",
      };
      const newStatus = statusMap[eventType] || "syncing_delta";
      await c.env.CONNECTOR_STATUS.put(
        statusKey,
        JSON.stringify({
          provider,
          status: newStatus,
          lastEvent: eventType,
          lastEventAt: new Date().toISOString(),
        }),
        { expirationTtl: 30 * 24 * 60 * 60 }
      );
    }

    // Forward to pipeline for processing
    if (eventType === "connection.created" || eventType === "sync.success") {
      await forwardToPipeline(c.env, tenantId, provider, `nango.${eventType}`, payload);
    }

    // Log webhook
    if (c.env.WEBHOOK_LOG) {
      await c.env.WEBHOOK_LOG.put(
        `webhook:${tenantId}:nango:${Date.now()}`,
        JSON.stringify({ eventType, provider, connectionId, timestamp: new Date().toISOString() }),
        { expirationTtl: 7 * 24 * 60 * 60 }
      );
    }

    return c.json({ received: true, event: eventType, provider });
  } catch (err: any) {
    console.error("[Nango Webhook] Error:", err.message);
    return c.json({ error: "Processing failed" }, 500);
  }
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Verify Nango webhook signature (HMAC-SHA256).
 */
async function verifyNangoSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Nango may send hex or base64 — check both
  return signature === computed || signature === btoa(String.fromCharCode(...new Uint8Array(mac)));
}

/**
 * Forward webhook data to the 8-stage normalization pipeline.
 * This is the critical link: webhook → PIPELINE_QUEUE → normalizer → spine → workspace.
 */
async function forwardToPipeline(
  env: Env,
  tenantId: string,
  provider: string,
  eventType: string,
  payload: any
): Promise<void> {
  try {
    const traceId = crypto.randomUUID();
    const receivedAt = new Date().toISOString();
    const objPayload = payload && typeof payload === "object" ? payload : { value: payload };
    await env.PIPELINE_QUEUE.send({
      stage: "analyze",
      tenant_id: tenantId,
      source: provider,
      source_type: "webhook",
      payload: {
        ...objPayload,
        _webhook_event_type: eventType,
      },
      metadata: {
        trace_id: traceId,
        attempt: 0,
        received_at: receivedAt,
      },
    });
  } catch (err: any) {
    console.error(`[Pipeline Forward] Failed for ${provider}:`, err.message);
  }
}

async function resolveTenantFromAppId(appId: string | undefined, env: Env): Promise<string | null> {
  if (!appId) return null;

  // Look up tenant mapping in KV or CONNECTOR_STATUS
  const mapping = await env.CONNECTOR_STATUS.get(`app:${appId}:tenant`);
  return mapping || null;
}

async function resolveTenantFromHubSpotPortalId(
  portalId: unknown,
  env: Env
): Promise<string | null> {
  if (!portalId) return null;
  const key = `hubspot:portal:${String(portalId)}:tenant`;
  const mapping = await env.CONNECTOR_STATUS.get(key);
  return mapping || null;
}

async function resolveTenantFromCustomerId(
  customerId: string | undefined,
  env: Env
): Promise<string | null> {
  if (!customerId) return null;

  const mapping = await env.CONNECTOR_STATUS.get(`stripe:${customerId}:tenant`);
  return mapping || null;
}

async function resolveTenantFromGitHubInstallation(payload: any, env: Env): Promise<string | null> {
  const installationId = payload?.installation?.id || payload?.installation_id;
  if (!installationId) return null;
  return env.CONNECTOR_STATUS.get(`github:installation:${String(installationId)}:tenant`);
}

async function resolveTenantFromSalesforceOrgId(event: any, env: Env): Promise<string | null> {
  const changeHeader = event?.payload?.ChangeEventHeader || event?.payload?.changeEventHeader;
  const orgId =
    event?.organization_id ||
    event?.organizationId ||
    event?.org_id ||
    event?.orgId ||
    event?.event?.organization_id ||
    event?.event?.organizationId ||
    event?.event?.org_id ||
    event?.event?.orgId ||
    event?.payload?.organization_id ||
    event?.payload?.organizationId ||
    event?.payload?.org_id ||
    event?.payload?.orgId ||
    changeHeader?.organizationId ||
    changeHeader?.organization_id;

  if (!orgId) return null;
  return env.CONNECTOR_STATUS.get(`salesforce:org:${String(orgId)}:tenant`);
}

async function reserveWebhookDelivery(
  env: Env,
  provider: string,
  deliveryId: string | null
): Promise<boolean> {
  if (!env.WEBHOOK_LOG || !deliveryId) return false;
  const key = `delivery:${provider}:${deliveryId}`;
  const existing = await env.WEBHOOK_LOG.get(key);
  if (existing) return true;
  await env.WEBHOOK_LOG.put(key, new Date().toISOString(), { expirationTtl: 86400 * 7 });
  return false;
}

function extractHubSpotDeliveryId(events: any[], timestampHeader?: string | null): string | null {
  const ids = events
    .map((event) => event?.eventId || event?.id)
    .filter(Boolean)
    .map((value) => String(value))
    .sort();
  if (ids.length > 0) return ids.join(",");
  return timestampHeader ? `timestamp:${timestampHeader}` : null;
}

function extractSalesforceDeliveryId(event: any, signatureHeader?: string | null): string | null {
  const changeHeader = event?.payload?.ChangeEventHeader || event?.payload?.changeEventHeader;
  const deliveryId =
    event?.event?.id ||
    event?.event?.replayId ||
    changeHeader?.commitNumber ||
    changeHeader?.transactionKey ||
    signatureHeader;
  return deliveryId ? String(deliveryId) : null;
}

function extractStripeDeliveryId(event: any): string | null {
  return event?.id ? String(event.id) : null;
}

function extractGitHubDeliveryId(headerValue?: string | null, payload?: any): string | null {
  const deliveryId = headerValue || payload?.delivery || payload?.id;
  return deliveryId ? String(deliveryId) : null;
}

function extractSlackDeliveryId(payload: any): string | null {
  const deliveryId =
    payload?.workflow_step?.workflow_step_execute_id ||
    payload?.workflow_step_execute_id ||
    payload?.trigger_id ||
    payload?.container?.message_ts;
  return deliveryId ? String(deliveryId) : null;
}

async function verifySlackSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  signingSecret: string
): Promise<boolean> {
  if (!signature || !timestamp || !signingSecret) return false;
  if (!signature.startsWith("v0=")) return false;

  const ts = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`v0:${timestamp}:${rawBody}`)
  );
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const computed = `v0=${hex}`;
  return timingSafeEqual(signature, computed);
}

async function processHubSpotEvent(event: any, tenantId: string, env: Env): Promise<void> {
  // Update connector status with real-time info
  const statusKey = `connector:${tenantId}:hubspot`;
  const currentStatus = await env.CONNECTOR_STATUS.get(statusKey);

  const status = currentStatus ? JSON.parse(currentStatus) : {};
  status.lastWebhookReceived = new Date().toISOString();
  status.webhookEvents = (status.webhookEvents || 0) + 1;
  status.lastEventType = event.eventType;

  // If this is a data change event, mark that incremental sync is needed
  if (event.eventType?.includes("propertyChange") || event.eventType?.includes("creation")) {
    status.needsIncrementalSync = true;
    status.pendingChanges = (status.pendingChanges || 0) + 1;
  }

  await env.CONNECTOR_STATUS.put(statusKey, JSON.stringify(status), { expirationTtl: 7200 });
}

async function processSalesforceEvent(event: any, tenantId: string, env: Env): Promise<void> {
  const statusKey = `connector:${tenantId}:salesforce`;
  const currentStatus = await env.CONNECTOR_STATUS.get(statusKey);

  const status = currentStatus ? JSON.parse(currentStatus) : {};
  status.lastWebhookReceived = new Date().toISOString();
  status.lastEventType = event.event?.type;
  status.needsIncrementalSync = true;

  await env.CONNECTOR_STATUS.put(statusKey, JSON.stringify(status), { expirationTtl: 7200 });
}

/**
 * Broadcast connector event to all connected clients via Stream Gateway
 */
async function broadcastConnectorEvent(
  event: {
    tenantId: string;
    eventType: string;
    entityType?: string;
    entityId?: string;
    timestamp: string;
    payload: any;
  },
  env: Env
): Promise<void> {
  try {
    // Send to Stream Gateway's broadcast endpoint
    // Format matches Signal interface expected by SignalStreamDO
    const signal = {
      id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "connector.update",
      severity: "info" as const,
      title: `${event.eventType} from ${event.entityType || "unknown"}`,
      description: `Real-time update: ${event.eventType}`,
      entity_type: event.entityType,
      entity_id: event.entityId,
      data: {
        eventType: event.eventType,
        provider: event.eventType.split(".")[0],
        timestamp: event.timestamp,
        payload: event.payload,
      },
      created_at: event.timestamp,
    };

    const response = await env.BFF.fetch(
      new Request("https://local/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": event.tenantId,
        },
        body: JSON.stringify(signal),
      })
    );

    if (!response.ok) {
      console.warn("[Broadcast] Failed to broadcast event:", response.status);
    } else {
      const result = await response.json();
      console.log("[Broadcast] Event broadcasted:", result);
    }
  } catch (error) {
    console.error("[Broadcast] Error broadcasting event:", error);
    // Don't fail the webhook if broadcast fails
  }
}

// =============================================================================
// SIGNATURE VERIFICATION
// =============================================================================

async function verifyHubSpotSignature(input: {
  body: string;
  signature: string;
  secret: string;
  method: string;
  url: string;
  timestampHeader?: string | null;
}): Promise<boolean> {
  const signature = input.signature.trim();

  // HubSpot v3 (recommended): base64(HMAC_SHA256(method + url + body + timestamp))
  if (signature.length > 50 && input.timestampHeader) {
    const payload = `${input.method}${new URL(input.url).toString()}${input.body}${input.timestampHeader}`;
    const digest = await hmacSha256(input.secret, payload, "base64");
    return timingSafeEqual(digest, signature);
  }

  // HubSpot legacy: hex(HMAC_SHA256(body))
  const hexDigest = await hmacSha256(input.secret, input.body, "hex");
  return timingSafeEqual(hexDigest.toLowerCase(), signature.toLowerCase());
}

async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parsed = parseStripeSignature(signature);
  if (!parsed.timestamp || !parsed.v1) return false;

  const signedPayload = `${parsed.timestamp}.${body}`;
  const expected = await hmacSha256(secret, signedPayload, "hex");
  return timingSafeEqual(expected, parsed.v1.toLowerCase());
}

async function verifyGitHubSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const normalized = signature.replace(/^sha256=/, "").toLowerCase();
  const expected = await hmacSha256(secret, body, "hex");
  return timingSafeEqual(expected, normalized);
}

function parseStripeSignature(header: string): { timestamp?: string; v1?: string } {
  const out: { timestamp?: string; v1?: string } = {};
  for (const part of header.split(",")) {
    const [key, value] = part.split("=");
    if (key === "t") out.timestamp = value;
    if (key === "v1") out.v1 = value;
  }
  return out;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hmacSha256(
  secret: string,
  payload: string,
  encoding: "hex" | "base64"
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const bytes = new Uint8Array(digest);

  if (encoding === "base64") {
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }

  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// =============================================================================
// CONFIGURATION ENDPOINT
// =============================================================================

/**
 * Return webhook configuration for setting up external systems
 * This tells HubSpot, Stripe, etc. where to send webhooks
 */
app.get("/config/:provider", async (c) => {
  const provider = c.req.param("provider");
  const tenantId = c.req.query("tenantId");

  if (!tenantId) {
    return c.json({ error: "Missing tenantId" }, 400);
  }

  const baseUrl = "https://gateway.integratewise.ai";

  const configs: Record<string, any> = {
    hubspot: {
      targetUrl: `${baseUrl}/webhooks/hubspot?tenantId=${tenantId}`,
      subscriptions: [
        "contact.creation",
        "contact.propertyChange",
        "deal.creation",
        "deal.propertyChange",
        "company.creation",
        "company.propertyChange",
      ],
    },
    stripe: {
      endpoint: `${baseUrl}/webhooks/stripe`,
      events: [
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "invoice.paid",
        "invoice.payment_failed",
        "customer.subscription.updated",
      ],
    },
    github: {
      url: `${baseUrl}/webhooks/github?tenantId=${tenantId}`,
      events: ["push", "pull_request", "issues", "workflow_run"],
    },
  };

  return c.json({
    provider,
    tenantId,
    ...configs[provider],
  });
});

export default app;
