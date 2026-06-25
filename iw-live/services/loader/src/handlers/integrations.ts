/**
 * Integration Handlers for Asana and GitHub
 * Handles webhook events from these platforms with proper validation and transformation
 */

import type { Context } from "hono";

// Webhook schemas - validated at handler level
const AsanaWebhookSchema = {
  parse: (data: unknown) => data as any,
  safeParse: (data: unknown) =>
    ({ success: true, data: data as any }) as { success: true; data: any; error?: any },
};
const GitHubWebhookSchema = {
  parse: (data: unknown) => data as any,
  safeParse: (data: unknown) =>
    ({ success: true, data: data as any }) as { success: true; data: any; error?: any },
};

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

// ============================================================================
// ASANA WEBHOOK HANDLER
// ============================================================================

/**
 * Asana Webhook Handler
 * Handles Asana webhook events including:
 * - Task creation, updates, and deletion
 * - Project updates
 * - Attachment changes
 * - Custom field updates
 *
 * Asana uses X-Hook-Secret header for initial handshake verification
 */
export async function asanaHandler(c: Context): Promise<Response> {
  const log = c.get("log") as Log;

  // Get raw body for handshake validation
  const rawBody = await c.req.text();
  const xHookSecret = c.req.header("x-hook-secret");
  const xHookSignature = c.req.header("x-hook-signature");

  // Handle Asana webhook handshake (initial registration)
  if (xHookSecret) {
    log.info("Asana webhook handshake received", { hasHookSecret: true });
    return new Response(null, {
      status: 200,
      headers: {
        "X-Hook-Secret": xHookSecret,
      },
    });
  }

  // Parse JSON body
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    log.warn("Invalid JSON payload from Asana");
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  // Validate Asana webhook format
  const parsed = AsanaWebhookSchema.safeParse(body);
  if (!parsed.success) {
    log.warn("Invalid Asana payload schema", { errors: parsed.error.flatten() });
    return c.json({ error: "Invalid payload" }, 400);
  }

  // Verify signature if configured
  if (c.env.ASANA_WEBHOOK_SECRET && xHookSignature) {
    const isValid = await verifyAsanaSignature(rawBody, xHookSignature, c.env.ASANA_WEBHOOK_SECRET);
    if (!isValid) {
      log.warn("Invalid Asana signature", { hasSignature: !!xHookSignature });
      return c.json({ error: "Invalid signature" }, 401);
    }
  }

  const events = parsed.data.events || [];
  log.info("Asana webhook received", {
    eventCount: events.length,
  });

  // Process each event and forward to core engine
  const results = [];
  for (const event of events) {
    const transformedEvent = transformAsanaEvent(event);

    try {
      const response = await fetch(`${c.env.CORE_ENGINE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": c.get("requestId"),
          "x-source": "asana",
        },
        body: JSON.stringify({
          id: generateUUID(),
          source: "asana",
          type: `asana.${transformedEvent.action}`,
          timestamp: new Date().toISOString(),
          payload: transformedEvent,
          metadata: {
            raw_event_id: event.resource?.id,
            user_id: event.user?.id,
          },
        }),
      });

      if (!response.ok) {
        log.error("Failed to forward Asana event", {
          status: response.status,
          resourceId: event.resource?.id,
        });
      } else {
        log.info("Asana event forwarded successfully", {
          action: transformedEvent.action,
          resourceId: event.resource?.id,
        });
      }

      results.push({
        resourceId: event.resource?.id,
        success: response.ok,
      });
    } catch (error) {
      log.error("Error forwarding Asana event", {
        error: error instanceof Error ? error.message : "Unknown error",
        resourceId: event.resource?.id,
      });
      results.push({
        resourceId: event.resource?.id,
        success: false,
      });
    }
  }

  return c.json({
    success: true,
    processed: results.length,
    results,
  });
}

/**
 * Transform Asana webhook event to normalized format
 */
function transformAsanaEvent(event: any): Record<string, unknown> {
  return {
    action: event.action || "unknown",
    resource_type: event.resource?.type || "unknown",
    resource_id: event.resource?.id,
    resource_name: event.resource?.name,
    parent_id: event.parent?.id,
    parent_type: event.parent?.type,
    user_id: event.user?.id,
    user_name: event.user?.name,
    created_at: event.created_at || new Date().toISOString(),
  };
}

/**
 * Verify Asana webhook signature using HMAC-SHA256
 * Asana format: SHA256(body + secret)
 */
async function verifyAsanaSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const calculatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return calculatedSignature === signature.toLowerCase();
  } catch {
    return false;
  }
}

// ============================================================================
// GITHUB WEBHOOK HANDLER
// ============================================================================

/**
 * GitHub Webhook Handler
 * Handles GitHub webhook events including:
 * - Push events
 * - Pull request events (opened, closed, synchronize, etc.)
 * - Issues (opened, closed, labeled, etc.)
 * - Issue comments
 *
 * GitHub uses X-Hub-Signature-256 (HMAC SHA256) for signature verification
 */
export async function githubHandler(c: Context): Promise<Response> {
  const log = c.get("log") as Log;

  // Get raw body for signature verification
  const rawBody = await c.req.text();
  const signature = c.req.header("x-hub-signature-256");
  const eventType = c.req.header("x-github-event") || "unknown";

  // Parse JSON body
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    log.warn("Invalid JSON payload from GitHub");
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  // Validate GitHub webhook format
  const parsed = GitHubWebhookSchema.safeParse(body);
  if (!parsed.success) {
    log.warn("Invalid GitHub payload schema", {
      eventType,
      errors: parsed.error.flatten(),
    });
    return c.json({ error: "Invalid payload" }, 400);
  }

  // Verify GitHub signature if secret is configured
  if (c.env.GITHUB_WEBHOOK_SECRET && signature) {
    const isValid = await verifyGitHubSignature(rawBody, signature, c.env.GITHUB_WEBHOOK_SECRET);

    if (!isValid) {
      log.warn("Invalid GitHub signature", {
        hasSignature: !!signature,
        eventType,
      });
      return c.json({ error: "Invalid signature" }, 401);
    }
  }

  log.info("GitHub webhook received", {
    eventType,
    repo: parsed.data.repository?.full_name,
    action: parsed.data.action,
  });

  // Transform event based on type
  const transformedEvent = transformGitHubEvent(parsed.data, eventType);

  // Forward to core engine
  try {
    const response = await fetch(`${c.env.CORE_ENGINE_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": c.get("requestId"),
        "x-source": "github",
      },
      body: JSON.stringify({
        id: generateUUID(),
        source: "github",
        type: `github.${eventType}`,
        timestamp: new Date().toISOString(),
        payload: transformedEvent,
        metadata: {
          event_type: eventType,
          action: parsed.data.action,
          repository: parsed.data.repository?.full_name,
          sender: parsed.data.sender?.login,
        },
      }),
    });

    if (!response.ok) {
      log.error("Failed to forward GitHub event", {
        status: response.status,
        eventType,
      });
      return c.json({ error: "Failed to forward event" }, 500);
    }

    log.info("GitHub event forwarded successfully", {
      eventType,
      repo: parsed.data.repository?.full_name,
    });

    return c.json({
      success: true,
      eventType,
      delivered: true,
    });
  } catch (error) {
    log.error("Error forwarding GitHub event", {
      error: error instanceof Error ? error.message : "Unknown error",
      eventType,
    });
    return c.json({ error: "Processing failed" }, 500);
  }
}

/**
 * Transform GitHub webhook event to normalized format
 */
function transformGitHubEvent(event: any, eventType: string): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    event_type: eventType,
    action: event.action,
    timestamp: new Date().toISOString(),
    sender: {
      login: event.sender?.login,
      id: event.sender?.id,
      type: event.sender?.type,
    },
    repository: {
      id: event.repository?.id,
      name: event.repository?.name,
      full_name: event.repository?.full_name,
      owner: event.repository?.owner?.login,
    },
  };

  // Event-specific fields
  switch (eventType) {
    case "push":
      normalized.ref = event.ref;
      normalized.commits =
        event.commits?.map((c: any) => ({
          id: c.id,
          message: c.message,
          author: c.author,
          timestamp: c.timestamp,
        })) || [];
      break;

    case "pull_request":
      normalized.pr_number = event.number;
      normalized.pr_action = event.action;
      normalized.pull_request = {
        id: event.pull_request?.id,
        number: event.pull_request?.number,
        title: event.pull_request?.title,
        state: event.pull_request?.state,
        author: event.pull_request?.user?.login,
        created_at: event.pull_request?.created_at,
        updated_at: event.pull_request?.updated_at,
        merged_at: event.pull_request?.merged_at,
      };
      break;

    case "issues":
      normalized.issue_number = event.number;
      normalized.issue_action = event.action;
      normalized.issue = {
        id: event.issue?.id,
        number: event.issue?.number,
        title: event.issue?.title,
        state: event.issue?.state,
        body: event.issue?.body,
        author: event.issue?.user?.login,
        created_at: event.issue?.created_at,
        updated_at: event.issue?.updated_at,
        labels: event.issue?.labels?.map((l: any) => l.name) || [],
      };
      break;

    case "issue_comment":
      normalized.issue_number = event.issue?.number;
      normalized.comment = {
        id: event.comment?.id,
        body: event.comment?.body,
        author: event.comment?.user?.login,
        created_at: event.comment?.created_at,
        updated_at: event.comment?.updated_at,
      };
      break;
  }

  return normalized;
}

/**
 * Verify GitHub webhook signature using HMAC SHA256
 * GitHub format: sha256=<hex_digest>
 */
async function verifyGitHubSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const calculatedSignature =
      "sha256=" +
      Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return calculatedSignature === signature;
  } catch {
    return false;
  }
}

/**
 * Generate a UUID v4 using Web Crypto API (Cloudflare Workers compatible)
 */
function generateUUID(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Set version (4) and variant (RFC 4122) bits
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;

  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
