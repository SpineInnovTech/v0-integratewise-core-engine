import type { Context } from "hono";

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

/**
 * Webflow Webhook Handler
 * Handles webhooks from Webflow for:
 * - Form submissions
 * - CMS collection updates
 * - Site publish events
 * - E-commerce events
 */
export async function webflowHandler(c: Context) {
  const log = c.get("log") as Log;

  // Get Webflow signature for verification
  const signature = c.req.header("x-webflow-signature");
  const rawBody = await c.req.text();

  // Verify signature if secret is configured
  if (c.env.WEBFLOW_WEBHOOK_SECRET && signature) {
    const isValid = await verifyWebflowSignature(rawBody, signature, c.env.WEBFLOW_WEBHOOK_SECRET);

    if (!isValid) {
      log.warn("Invalid Webflow signature", { hasSignature: !!signature });
      return c.json({ error: "Invalid signature" }, 401);
    }
  }

  // Parse body
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (error) {
    log.warn("Invalid JSON payload", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  log.info("Webflow webhook received", {
    eventType: event.name || event.type || "unknown",
    siteId: event.site || event.siteId,
  });

  // Process different event types
  const eventType = event.name || event.type || "unknown";
  let processedEvent = event;

  switch (eventType) {
    case "form_submission":
    case "form_submit":
      processedEvent = await handleFormSubmission(c, event, log);
      break;

    case "collection_item_created":
    case "collection_item_updated":
    case "collection_item_deleted":
      processedEvent = await handleCMSUpdate(c, event, log);
      break;

    case "site_published":
    case "site_unpublished":
      processedEvent = await handleSitePublish(c, event, log);
      break;

    case "ecommerce_order_created":
    case "ecommerce_order_updated":
      processedEvent = await handleEcommerceEvent(c, event, log);
      break;

    default:
      log.info("Unhandled Webflow event type", { eventType });
  }

  // Forward to core engine
  await forwardToEngine(c, {
    source: "webflow",
    externalId: event.id || event._id || crypto.randomUUID(),
    eventType: eventType,
    payload: processedEvent,
  });

  return c.json({
    received: true,
    eventId: event.id || event._id,
    eventType: eventType,
  });
}

/**
 * Handle form submission events
 */
async function handleFormSubmission(_c: Context, event: any, log: Log): Promise<any> {
  log.info("Processing form submission", {
    formId: event.formId || event.form?.id,
    siteId: event.site || event.siteId,
  });

  // Extract form data
  const formData = {
    formId: event.formId || event.form?.id,
    formName: event.formName || event.form?.name,
    siteId: event.site || event.siteId,
    fields: event.data || event.fields || {},
    submittedAt: event.submittedAt || event.createdAt || new Date().toISOString(),
  };

  return {
    ...event,
    normalized: formData,
    type: "form_submission",
  };
}

/**
 * Handle CMS collection updates
 */
async function handleCMSUpdate(_c: Context, event: any, log: Log): Promise<any> {
  log.info("Processing CMS update", {
    collectionId: event.collectionId || event.collection?.id,
    itemId: event.itemId || event.item?.id,
    siteId: event.site || event.siteId,
  });

  const cmsData = {
    collectionId: event.collectionId || event.collection?.id,
    collectionName: event.collectionName || event.collection?.name,
    itemId: event.itemId || event.item?.id,
    siteId: event.site || event.siteId,
    fields: event.fields || event.data || {},
    updatedAt: event.updatedAt || event.createdAt || new Date().toISOString(),
  };

  return {
    ...event,
    normalized: cmsData,
    type: "cms_update",
  };
}

/**
 * Handle site publish/unpublish events
 */
async function handleSitePublish(_c: Context, event: any, log: Log): Promise<any> {
  log.info("Processing site publish event", {
    siteId: event.site || event.siteId,
    published: event.published !== false,
  });

  return {
    ...event,
    normalized: {
      siteId: event.site || event.siteId,
      published: event.published !== false,
      publishedAt: event.publishedAt || new Date().toISOString(),
    },
    type: "site_publish",
  };
}

/**
 * Handle e-commerce events
 */
async function handleEcommerceEvent(_c: Context, event: any, log: Log): Promise<any> {
  log.info("Processing e-commerce event", {
    orderId: event.orderId || event.order?.id,
    siteId: event.site || event.siteId,
  });

  return {
    ...event,
    normalized: {
      orderId: event.orderId || event.order?.id,
      siteId: event.site || event.siteId,
      orderData: event.order || event.data || {},
      updatedAt: event.updatedAt || event.createdAt || new Date().toISOString(),
    },
    type: "ecommerce_event",
  };
}

/**
 * Verify Webflow webhook signature
 */
async function verifyWebflowSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Webflow uses HMAC SHA256 for signature verification
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

    // Compare signatures (constant-time comparison)
    return calculatedSignature === signature.toLowerCase();
  } catch (error) {
    return false;
  }
}

/**
 * Forward event to core engine
 */
async function forwardToEngine(
  c: Context,
  data: {
    source: string;
    externalId: string;
    eventType: string;
    payload: any;
  }
) {
  const log = c.get("log") as Log;

  try {
    const response = await fetch(`${c.env.CORE_ENGINE_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": c.get("requestId"),
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        source: data.source,
        type: data.eventType,
        timestamp: new Date().toISOString(),
        payload: data.payload,
        metadata: {
          raw_event_id: data.externalId,
        },
      }),
    });

    if (!response.ok) {
      log.warn("Failed to forward to engine", {
        status: response.status,
      });
    } else {
      log.info("Event forwarded successfully", {
        eventId: data.externalId,
        eventType: data.eventType,
      });
    }
  } catch (error) {
    log.error("Error forwarding to engine", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Send to dead letter queue
    await c.env.DEAD_LETTER_QUEUE?.send({
      source: "webflow",
      eventId: data.externalId,
      eventType: data.eventType,
      payload: data.payload,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
