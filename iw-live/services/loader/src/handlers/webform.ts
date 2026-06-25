import type { Context } from "hono";
import { z } from "zod";

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

// Webform submission schema
const WebformSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(1).max(5000),
  source: z.string().optional(), // e.g., "contact", "demo", "pricing"
  referrer: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

type WebformData = z.infer<typeof WebformSchema>;

/**
 * Webform handler for public contact/lead forms
 * Accepts form submissions and forwards to core engine as events
 */
export async function webformHandler(c: Context) {
  const log = c.get("log") as Log;

  // Only accept POST requests
  if (c.req.method !== "POST") {
    return c.json({ error: "Method not allowed" }, 405);
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    log.warn("Invalid JSON payload");
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  const parsed = WebformSchema.safeParse(body);

  if (!parsed.success) {
    log.warn("Invalid webform payload", { errors: parsed.error.flatten() });
    return c.json(
      {
        error: "Invalid form data",
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const formData: WebformData = parsed.data;

  log.info("Webform submission received", {
    email: formData.email,
    source: formData.source || "contact",
    hasCompany: !!formData.company,
  });

  // Create Spine event from webform submission
  const spineEvent = {
    id: crypto.randomUUID(),
    source: "webform",
    type: "form.submission",
    timestamp: new Date().toISOString(),
    payload: {
      name: formData.name,
      email: formData.email,
      company: formData.company,
      message: formData.message,
      source: formData.source || "contact",
      referrer: formData.referrer,
      metadata: formData.metadata || {},
    },
    metadata: {
      userAgent: c.req.header("user-agent"),
      ip: c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown",
      requestId: c.get("requestId"),
    },
  };

  // Forward to core engine
  try {
    const response = await fetch(`${c.env.CORE_ENGINE_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": c.get("requestId"),
        "x-source": "webform",
      },
      body: JSON.stringify(spineEvent),
    });

    if (!response.ok) {
      log.error("Failed to forward webform event", {
        status: response.status,
        email: formData.email,
      });

      // Still return success to user (fire and forget pattern)
      // But log error for monitoring
      return c.json(
        {
          success: true,
          message: "Thank you for your submission. We will get back to you soon.",
        },
        200
      );
    }

    log.info("Webform event forwarded successfully", {
      eventId: spineEvent.id,
      email: formData.email,
    });

    return c.json(
      {
        success: true,
        message: "Thank you for your submission. We will get back to you soon.",
        id: spineEvent.id,
      },
      200
    );
  } catch (error) {
    log.error("Error forwarding webform event", {
      error: error instanceof Error ? error.message : "Unknown error",
      email: formData.email,
    });

    // Return success to user even if forwarding fails
    // The error is logged for monitoring
    return c.json(
      {
        success: true,
        message: "Thank you for your submission. We will get back to you soon.",
      },
      200
    );
  }
}

/**
 * GET handler for webform endpoint (optional - for form validation or info)
 */
export async function webformInfoHandler(c: Context) {
  return c.json({
    endpoint: "/webform",
    method: "POST",
    description: "Public webform submission endpoint",
    requiredFields: ["name", "email", "message"],
    optionalFields: ["company", "source", "referrer", "metadata"],
    example: {
      name: "John Doe",
      email: "john@example.com",
      company: "Acme Corp",
      message: "Interested in learning more about IntegrateWise",
      source: "contact",
    },
  });
}
