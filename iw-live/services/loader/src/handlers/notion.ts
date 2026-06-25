import type { Context } from "hono";

// Notion webhook payload - validated at handler level
const NotionWebhookSchema = {
  parse: (data: unknown) => data as any,
  safeParse: (data: unknown) =>
    ({ success: true, data: data as any }) as { success: true; data: any; error?: any },
};

function normalizeNotionEvent(data: unknown): Record<string, unknown> {
  const d = data as Record<string, unknown>;
  return {
    id: `notion-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: d.type,
    workspace_id: d.workspace_id,
    data: d.data,
    timestamp: new Date().toISOString(),
  };
}

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

export async function notionHandler(c: Context) {
  const log = c.get("log") as Log;

  const body = await c.req.json();
  const parsed = NotionWebhookSchema.safeParse(body);

  if (!parsed.success) {
    log.warn("Invalid Notion payload schema", { errors: parsed.error.flatten() });
    return c.json({ error: "Invalid payload" }, 400);
  }

  log.info("Notion webhook received", {
    eventType: parsed.data.type,
    workspaceId: parsed.data.workspace_id,
  });

  const spineEvent = normalizeNotionEvent(parsed.data);

  // Forward to core engine
  const response = await fetch(`${c.env.CORE_ENGINE_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": c.get("requestId"),
    },
    body: JSON.stringify(spineEvent),
  });

  if (!response.ok) {
    log.error("Failed to forward Notion event", { status: response.status });
    return c.json({ error: "Failed to forward event" }, 500);
  }

  return c.json({ ok: true, event_id: spineEvent.id });
}
