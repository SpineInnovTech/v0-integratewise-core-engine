import type { Context } from "hono";
import { z } from "zod";

// Inline schemas — not yet exported from @integratewise/types
const DiscordInteractionSchema = z.object({
  id: z.string(),
  type: z.number(),
  data: z.record(z.unknown()).optional(),
  token: z.string().optional(),
  guild_id: z.string().optional(),
  channel_id: z.string().optional(),
  member: z.record(z.unknown()).optional(),
  user: z.record(z.unknown()).optional(),
});

function normalizeDiscordEvent(data: z.infer<typeof DiscordInteractionSchema>) {
  return {
    source: "discord",
    source_id: data.id,
    type: `discord.interaction.type_${data.type}`,
    payload: data,
    timestamp: new Date().toISOString(),
  };
}

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

type Bindings = {
  DISCORD_PUBLIC_KEY?: string;
};

/**
 * Convert hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Verify Discord Ed25519 signature
 * Discord sends X-Signature-Ed25519 and X-Signature-Timestamp headers
 */
async function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string,
  publicKey: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const message = encoder.encode(timestamp + body);
    const sigBytes = hexToUint8Array(signature);
    const keyBytes = hexToUint8Array(publicKey);

    // Import the public key for Ed25519 verification
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes as unknown as BufferSource,
      { name: "Ed25519", namedCurve: "Ed25519" } as any,
      false,
      ["verify"]
    );

    // Verify the signature
    const isValid = await crypto.subtle.verify(
      "Ed25519" as any,
      key,
      sigBytes as unknown as BufferSource,
      message as unknown as BufferSource
    );

    return isValid;
  } catch (error) {
    return false;
  }
}

export async function discordHandler(c: Context) {
  const log = c.get("log") as Log;
  const env = c.env as Bindings;

  // Get raw body for signature verification
  const rawBody = await c.req.text();

  // Verify Discord signature
  const signature = c.req.header("x-signature-ed25519") || "";
  const timestamp = c.req.header("x-signature-timestamp") || "";
  const publicKey = env.DISCORD_PUBLIC_KEY;

  if (publicKey && signature && timestamp) {
    const isValid = await verifyDiscordSignature(rawBody, signature, timestamp, publicKey);
    if (!isValid) {
      log.warn("Discord signature verification failed", {
        signature: signature.substring(0, 16) + "...",
      });
      return c.json({ error: "Invalid signature" }, 401);
    }
    log.info("Discord signature verified");
  } else if (publicKey) {
    log.warn("Discord signature headers missing", {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
    });
    return c.json({ error: "Signature headers missing" }, 400);
  }

  // Parse the body as JSON
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    log.warn("Invalid Discord payload JSON");
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const parsed = DiscordInteractionSchema.safeParse(body);

  if (!parsed.success) {
    log.warn("Invalid Discord payload schema", { errors: parsed.error.flatten() });
    return c.json({ error: "Invalid payload" }, 400);
  }

  // Handle PING (type 1)
  if (parsed.data.type === 1) {
    log.info("Discord PING received");
    return c.json({ type: 1 });
  }

  log.info("Discord webhook received", {
    type: parsed.data.type,
    interactionId: parsed.data.id,
  });

  const spineEvent = normalizeDiscordEvent(parsed.data);

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
    // Discord requires quick response, handle async
    log.error("Failed to forward Discord event", { status: response.status });
  }

  // Acknowledge interaction
  return c.json({ type: 5 }); // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
}
