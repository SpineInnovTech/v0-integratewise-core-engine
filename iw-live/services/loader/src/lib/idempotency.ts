import type { Context, Next } from "hono";

// Idempotency middleware using KV store
export function idempotencyMiddleware(source: string) {
  return async (c: Context, next: Next) => {
    const log = c.get("log");

    // Get idempotency key from appropriate header or payload
    let idempotencyKey: string | null = null;

    if (source === "stripe") {
      // Stripe uses the event ID - read body but don't consume it
      const rawBody = await c.req.text();
      try {
        const body = JSON.parse(rawBody) as { id?: string };
        idempotencyKey = body.id ?? null;
        // Store raw body for handler to re-parse
        c.set("webhookRawBody", rawBody);
      } catch {
        // If parsing fails, continue without idempotency
      }
    } else if (source === "hubspot") {
      // HubSpot uses correlation ID from header (doesn't consume body)
      idempotencyKey = c.req.header("x-hubspot-correlation-id") ?? null;
    } else if (source === "slack") {
      // Slack uses event ID from payload - read body but don't consume it
      const rawBody = await c.req.text();
      try {
        const body = JSON.parse(rawBody);
        idempotencyKey = body.event_id ?? body.event?.event_ts ?? null;
        // Store raw body for handler to re-parse
        c.set("webhookRawBody", rawBody);
      } catch {
        // If parsing fails, continue without idempotency
      }
    } else if (source === "ai-relay") {
      // AI-Relay uses event ID from payload - read body but don't consume it
      const rawBody = await c.req.text();
      try {
        const body = JSON.parse(rawBody);
        idempotencyKey = body.id ?? null;
        // Store raw body for handler to re-parse
        c.set("webhookRawBody", rawBody);
      } catch {
        // If parsing fails, continue without idempotency
      }
    }

    if (!idempotencyKey) {
      log.warn("No idempotency key found", { source });
      return next();
    }

    const kvKey = `${source}:${idempotencyKey}`;

    // Check if already processed
    const existing = await c.env.WEBHOOK_IDEMPOTENCY?.get(kvKey);

    if (existing) {
      log.info("Duplicate webhook, skipping", { source, key: idempotencyKey });
      return c.json({ received: true, duplicate: true }, 200);
    }

    // Mark as processing
    await c.env.WEBHOOK_IDEMPOTENCY?.put(kvKey, "processing", {
      expirationTtl: 60 * 60 * 24, // 24 hours
    });

    try {
      await next();

      // Mark as completed
      await c.env.WEBHOOK_IDEMPOTENCY?.put(
        kvKey,
        JSON.stringify({
          status: "completed",
          processedAt: new Date().toISOString(),
        }),
        { expirationTtl: 60 * 60 * 24 * 7 } // 7 days
      );
    } catch (error) {
      // Mark as failed
      await c.env.WEBHOOK_IDEMPOTENCY?.put(
        kvKey,
        JSON.stringify({
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          failedAt: new Date().toISOString(),
        }),
        { expirationTtl: 60 * 60 * 24 } // 24 hours for retry
      );
      throw error;
    }
  };
}
