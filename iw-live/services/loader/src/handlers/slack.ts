import type { Context } from "hono";

// Slack webhook payload - validated at handler level
const SlackWebhookSchema = {
  parse: (data: unknown) => data as any,
  safeParse: (data: unknown) =>
    ({ success: true, data: data as any }) as { success: true; data: any; error?: any },
};
import { verifySlackSignature } from "../lib/signature";
import { processFlowA } from "../lib/flowA";
import { mapSourceToEntityType } from "../pipeline";

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

export async function slackHandler(c: Context) {
  const log = c.get("log") as Log;

  // Get raw body for signature verification (use stored body if available from idempotency middleware)
  const rawBody = (c.get("webhookRawBody") as string | undefined) || (await c.req.text());
  const signature = c.req.header("x-slack-signature");
  const timestamp = c.req.header("x-slack-request-timestamp");

  // Parse body
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    log.warn("Invalid JSON payload");
    return c.json({ error: "Invalid payload" }, 400);
  }

  const parsed = SlackWebhookSchema.safeParse(body);

  if (!parsed.success) {
    log.warn("Invalid Slack payload schema", { errors: parsed.error.flatten() });
    return c.json({ error: "Invalid payload" }, 400);
  }

  // Handle URL verification challenge (must respond before signature check per Slack docs)
  if (parsed.data.challenge) {
    return c.text(parsed.data.challenge);
  }

  // Verify Slack signature for actual events
  const isValid = await verifySlackSignature(
    rawBody,
    signature ?? null,
    timestamp ?? null,
    c.env.SLACK_SIGNING_SECRET ?? ""
  );

  if (!isValid) {
    log.warn("Invalid Slack signature", {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
    });
    return c.json({ error: "Invalid signature" }, 401);
  }

  log.info("Slack webhook received", {
    eventType: parsed.data.event?.type,
    teamId: parsed.data.team_id,
  });

  // Forward to Flow A (Store Raw -> Normalize via Pipeline -> Store Spine)
  // Slack's `event` payload is loosely typed; ensure we always produce a string eventType.
  const rawEventType = parsed.data.event?.type;
  const eventType = typeof rawEventType === "string" ? rawEventType : "unknown";
  const entityType = mapSourceToEntityType("slack", eventType);
  const pipelineResult = await processFlowA(c, {
    source: "slack",
    externalId: parsed.data.team_id || crypto.randomUUID(),
    eventType,
    payload: parsed.data,
  });

  // Log pipeline result
  log.info("Slack event pipeline result", {
    teamId: parsed.data.team_id,
    eventType,
    entityType,
    pipelineSuccess: pipelineResult.success,
    entityId: pipelineResult.entity_id,
    dlq: pipelineResult.dlq,
  });

  return c.json({
    ok: true,
    entityType,
    entityId: pipelineResult.entity_id,
    pipelineSuccess: pipelineResult.success,
  });
}
