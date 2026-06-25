import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Webhook payload types - defined locally to avoid coupling
type StripeWebhook = { type: string; data: { object: Record<string, any> }; [key: string]: any };
type SlackWebhook = {
  type: string;
  event?: Record<string, any>;
  team_id?: string;
  [key: string]: any;
};
type DiscordInteraction = {
  type: number;
  data?: Record<string, any>;
  guild_id?: string;
  [key: string]: any;
};
type NotionWebhook = {
  type: string;
  data?: Record<string, any>;
  workspace_id?: string;
  [key: string]: any;
};

// Local contract (kept in @integratewise/lib to avoid coupling this package to
// any specific pipeline message schema).
export const NormalizedEventSchema = z.object({
  tenantId: z.string(),
  resourceType: z.string(),
  resourceKey: z.object({
    lookupType: z.string(),
    value: z.string(),
  }),
  sourceSystem: z.string(),
  canonicalEventType: z.string(),
  occurredAt: z.string(),
  severity: z.enum(["debug", "info", "warning", "error"]).default("info"),
  knowledgePointer: z
    .object({
      location: z.string(),
      id: z.string(),
    })
    .optional(),
});

export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;

export type NormalizationResult<T> =
  | { success: true; data: T }
  | { success: false; error: any; raw: any; tool: string };

export async function normalizePayload(
  tool: string,
  rawPayload: any,
  tenantId: string
): Promise<NormalizationResult<NormalizedEvent>> {
  try {
    let result: NormalizedEvent | null = null;

    switch (tool) {
      case "stripe":
        // Check if it matches StripeWebhook roughly or just pass raw
        result = await normalizeStripeEvent(rawPayload, tenantId);
        break;
      case "slack":
        result = await normalizeSlackEvent(rawPayload, tenantId);
        break;
      case "discord":
        result = await normalizeDiscordEvent(rawPayload, tenantId);
        break;
      case "notion":
        result = await normalizeNotionEvent(rawPayload, tenantId);
        break;
      default:
        throw new Error(`No normalizer found for tool: ${tool}`);
    }

    if (!result) throw new Error("Normalization returned null");

    // Final Schema Validation
    const validation = NormalizedEventSchema.safeParse(result);
    if (!validation.success) {
      return { success: false, error: validation.error, raw: rawPayload, tool };
    }

    return { success: true, data: validation.data };
  } catch (e: any) {
    return { success: false, error: e.message, raw: rawPayload, tool };
  }
}

// Normalize Stripe webhook to NormalizedEvent
export async function normalizeStripeEvent(
  event: StripeWebhook,
  tenantId: string
): Promise<NormalizedEvent> {
  return {
    tenantId,
    resourceType: "payment",
    resourceKey: { lookupType: "externalId", value: event.id },
    sourceSystem: "stripe",
    canonicalEventType: event.type,
    occurredAt: new Date(event.created * 1000).toISOString(),
    severity: "info",
    knowledgePointer: { location: "knowledge-base", id: event.id },
  };
}

// Normalize Slack webhook to NormalizedEvent
export async function normalizeSlackEvent(
  event: SlackWebhook,
  tenantId: string
): Promise<NormalizedEvent> {
  return {
    tenantId,
    resourceType: "conversation",
    resourceKey: { lookupType: "externalId", value: (event.event as any)?.event_cjs || uuidv4() }, // fallback
    sourceSystem: "slack",
    canonicalEventType: event.type,
    occurredAt: new Date().toISOString(),
    severity: "info",
    knowledgePointer: { location: "knowledge-base", id: (event.event as any)?.ts || "unknown" },
  };
}

// Normalize Discord interaction to NormalizedEvent
export async function normalizeDiscordEvent(
  event: DiscordInteraction,
  tenantId: string
): Promise<NormalizedEvent> {
  return {
    tenantId,
    resourceType: "conversation",
    resourceKey: { lookupType: "externalId", value: event.id },
    sourceSystem: "discord",
    canonicalEventType: `interaction.${event.type}`,
    occurredAt: new Date().toISOString(),
    severity: "info",
    knowledgePointer: { location: "knowledge-base", id: event.id },
  };
}

// Normalize Notion webhook to NormalizedEvent
export async function normalizeNotionEvent(
  event: NotionWebhook,
  tenantId: string
): Promise<NormalizedEvent> {
  return {
    tenantId,
    resourceType: "note",
    resourceKey: { lookupType: "externalId", value: uuidv4() }, // Notion webhooks might need specific logic
    sourceSystem: "notion",
    canonicalEventType: event.type,
    occurredAt: new Date().toISOString(),
    severity: "info",
    knowledgePointer: { location: "knowledge-base", id: "notion_update" },
  };
}
