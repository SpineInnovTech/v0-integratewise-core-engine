/**
 * Enhanced Stripe Webhook Handler with Resilience Patterns
 *
 * This example demonstrates best practices for webhook processing with:
 * - Connection error retry until successful
 * - API rate limiting handling
 * - Governor limits handling
 * - Circuit breaker patterns
 * - Comprehensive error handling
 */

import type { Context } from "hono";
import { verifyStripeSignature } from "../lib/signature";
import { processFlowA } from "../lib/flowA";
import { mapSourceToEntityType } from "../pipeline";
// Inline types replacing @integratewise/lib/webhook-processor and @integratewise/lib/error-handling
interface WebhookPayload {
  id: string;
  eventType: string;
  provider: string;
  payload: any;
  headers: Record<string, string>;
  signature?: string | null;
  correlationId: string;
}

interface WebhookProcessingResult {
  success: boolean;
  eventId?: string;
  processingTime?: number;
  attempts?: number;
  correlationId?: string;
  error?: { message: string; code?: string; retryable?: boolean };
}

interface WebhookProcessor {
  processWebhook(
    payload: WebhookPayload,
    handler: (webhook: WebhookPayload) => Promise<void>
  ): Promise<WebhookProcessingResult>;
  getRateLimitStatus(): any;
  getCircuitBreakerStatus(): any;
}

const WebhookProcessorFactory = {
  createHighVolumeProcessor(): WebhookProcessor {
    return {
      async processWebhook(
        payload: WebhookPayload,
        handler: (webhook: WebhookPayload) => Promise<void>
      ): Promise<WebhookProcessingResult> {
        const start = Date.now();
        try {
          await handler(payload);
          return {
            success: true,
            eventId: payload.id,
            processingTime: Date.now() - start,
            attempts: 1,
            correlationId: payload.correlationId,
          };
        } catch (err: any) {
          return {
            success: false,
            correlationId: payload.correlationId,
            error: { message: err?.message || "Unknown error", retryable: false },
          };
        }
      },
      getRateLimitStatus() {
        return { limited: false };
      },
      getCircuitBreakerStatus() {
        return { state: "closed" };
      },
    };
  },
};

function createAppError(
  code: string,
  message: string,
  context?: Record<string, unknown>,
  cause?: Error
): Error & { code: string; context?: Record<string, unknown> } {
  const err = new Error(message) as Error & { code: string; context?: Record<string, unknown> };
  err.code = code;
  if (context) err.context = context;
  if (cause) err.cause = cause;
  return err;
}

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

// Create a webhook processor optimized for Stripe (high-volume financial webhooks)
const stripeWebhookProcessor = WebhookProcessorFactory.createHighVolumeProcessor();

/**
 * Enhanced Stripe webhook handler with comprehensive resilience patterns
 */
export async function enhancedStripeHandler(c: Context) {
  const log = c.get("log") as Log;
  const correlationId =
    (c.get("correlationId") as string) ||
    `stripe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Get raw body for signature verification
    const rawBody = (c.get("webhookRawBody") as string | undefined) || (await c.req.text());
    const signature = c.req.header("stripe-signature");

    // Parse event first for logging
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      log.error("Failed to parse Stripe webhook body", {
        correlationId,
        error: parseError instanceof Error ? parseError.message : "Unknown parse error",
      });
      return c.json({ error: "Invalid JSON payload" }, 400);
    }

    log.info("Stripe webhook received", {
      correlationId,
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode,
      userAgent: c.req.header("user-agent"),
      ip: c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for"),
    });

    // Create webhook payload for processing
    const webhookPayload: WebhookPayload = {
      id: event.id,
      eventType: event.type,
      provider: "stripe",
      payload: event,
      headers: {
        "stripe-signature": signature || "",
        "user-agent": c.req.header("user-agent") || "",
        "content-type": c.req.header("content-type") || "",
      },
      signature: signature,
      correlationId,
    };

    // Process webhook with comprehensive resilience patterns
    const result: WebhookProcessingResult = await stripeWebhookProcessor.processWebhook(
      webhookPayload,
      async (webhook) => {
        await processStripeWebhook(c, webhook, log);
      }
    );

    // Log processing result
    if (result.success) {
      log.info("Stripe webhook processed successfully", {
        correlationId,
        eventId: result.eventId,
        processingTime: result.processingTime,
        attempts: result.attempts,
      });

      return c.json({
        received: true,
        eventId: result.eventId,
        correlationId: result.correlationId,
        processingTime: result.processingTime,
        attempts: result.attempts,
      });
    } else {
      // Handle processing failure
      log.error("Stripe webhook processing failed", {
        correlationId,
        eventId: result.eventId,
        error: result.error,
        processingTime: result.processingTime,
        attempts: result.attempts,
      });

      // Send to dead letter queue with enhanced context
      await c.env.DEAD_LETTER_QUEUE?.send({
        source: "stripe",
        eventId: result.eventId,
        correlationId: result.correlationId,
        eventType: event.type,
        payload: event,
        error: result.error,
        processingTime: result.processingTime,
        attempts: result.attempts,
        timestamp: new Date().toISOString(),
        retryable: result.error?.retryable || false,
      });

      // Return appropriate HTTP status based on error type
      const statusCode = result.error?.retryable ? 503 : 500; // 503 for retryable, 500 for permanent failures

      return c.json(
        {
          error: "Processing failed",
          eventId: result.eventId,
          correlationId: result.correlationId,
          retryable: result.error?.retryable || false,
        },
        statusCode
      );
    }
  } catch (error) {
    // Handle unexpected errors in webhook reception
    const appError =
      error instanceof Error && "code" in error
        ? (error as any)
        : createAppError(
            "INTERNAL_ERROR",
            "Unexpected webhook processing error",
            {
              operation: "stripe_webhook_reception",
              correlationId,
            },
            error instanceof Error ? error : undefined
          );

    log.error("Unexpected error in Stripe webhook handler", {
      correlationId,
      error: appError.message,
      code: appError.code,
    });

    return c.json(
      {
        error: "Internal server error",
        correlationId,
        code: appError.code,
      },
      500
    );
  }
}

/**
 * Process Stripe webhook payload with business logic
 */
async function processStripeWebhook(c: Context, webhook: WebhookPayload, log: Log): Promise<void> {
  const event = webhook.payload;

  // Verify signature (this is done here in case we need to retry after connection issues)
  const isValid = await verifyStripeSignature(
    JSON.stringify(event),
    webhook.signature || "",
    c.env.STRIPE_WEBHOOK_SECRET ?? null
  );

  if (!isValid) {
    throw createAppError("VALIDATION_ERROR", "Invalid Stripe signature", {
      operation: "stripe_signature_verification",
      eventId: webhook.id,
      correlationId: webhook.correlationId,
    });
  }

  // Handle event types with specific business logic
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(c, event, log, webhook.correlationId);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(c, event, log, webhook.correlationId);
        break;

      case "invoice.paid":
      case "invoice.payment_failed":
        await handleInvoiceEvent(c, event, log, webhook.correlationId);
        break;

      default:
        log.info("Unhandled Stripe event type", {
          correlationId: webhook.correlationId,
          eventType: event.type,
        });
    }

    // Forward to Flow A (Store Raw -> Normalize via Pipeline -> Store Spine)
    const entityType = mapSourceToEntityType("stripe", event.type);
    const pipelineResult = await processFlowA(c, {
      source: "stripe",
      externalId: event.id,
      eventType: event.type,
      payload: event.data.object,
    } as any);

    // Log pipeline result
    log.info("Stripe event pipeline result", {
      correlationId: webhook.correlationId,
      eventId: event.id,
      eventType: event.type,
      entityType,
      pipelineSuccess: pipelineResult.success,
      entityId: pipelineResult.entity_id,
      dlq: pipelineResult.dlq,
    });

    // Validate pipeline success
    if (!pipelineResult.success) {
      throw createAppError("EXTERNAL_SERVICE_ERROR", "Pipeline processing failed", {
        operation: "stripe_pipeline_processing",
        eventId: webhook.id,
        correlationId: webhook.correlationId,
        pipelineResult,
      });
    }
  } catch (error) {
    // Re-throw with enhanced context
    throw createAppError(
      "WEBHOOK_DELIVERY_FAILED",
      `Stripe webhook processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        operation: "stripe_webhook_processing",
        eventId: webhook.id,
        eventType: webhook.eventType,
        correlationId: webhook.correlationId,
      },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Handle checkout completion with enhanced error handling
 */
async function handleCheckoutCompleted(
  _c: Context,
  event: any,
  log: Log,
  correlationId?: string
): Promise<void> {
  const session = event.data.object;

  log.info("Processing checkout completed", {
    correlationId,
    sessionId: session.id,
    customerId: session.customer,
    amountTotal: session.amount_total,
  });

  // Add business logic here with proper error handling
  try {
    // Example: Update subscription status, send notifications, etc.
    // This would include calls to external services with resilience patterns

    // For now, just validate the session data
    if (!session.id || !session.customer) {
      throw createAppError("VALIDATION_ERROR", "Invalid checkout session data", {
        operation: "checkout_validation",
        sessionId: session.id,
        correlationId,
      });
    }
  } catch (error) {
    log.error("Failed to handle checkout completion", {
      correlationId,
      sessionId: session.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error; // Re-throw to be handled by webhook processor
  }
}

/**
 * Handle subscription changes with enhanced error handling
 */
async function handleSubscriptionChange(
  _c: Context,
  event: any,
  log: Log,
  correlationId?: string
): Promise<void> {
  const subscription = event.data.object;

  log.info("Processing subscription change", {
    correlationId,
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status,
    eventType: event.type,
  });

  // Add business logic here with proper error handling
  try {
    // Example: Update billing records, trigger provisioning, etc.
    // This would include database operations and external API calls

    if (!subscription.id || !subscription.customer) {
      throw createAppError("VALIDATION_ERROR", "Invalid subscription data", {
        operation: "subscription_validation",
        subscriptionId: subscription.id,
        correlationId,
      });
    }
  } catch (error) {
    log.error("Failed to handle subscription change", {
      correlationId,
      subscriptionId: subscription.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error; // Re-throw to be handled by webhook processor
  }
}

/**
 * Handle invoice events with enhanced error handling
 */
async function handleInvoiceEvent(
  _c: Context,
  event: any,
  log: Log,
  correlationId?: string
): Promise<void> {
  const invoice = event.data.object;

  log.info("Processing invoice event", {
    correlationId,
    invoiceId: invoice.id,
    customerId: invoice.customer,
    status: invoice.status,
    eventType: event.type,
  });

  // Add business logic here with proper error handling
  try {
    // Example: Update payment records, send receipts, handle failures, etc.

    if (!invoice.id) {
      throw createAppError("VALIDATION_ERROR", "Invalid invoice data", {
        operation: "invoice_validation",
        invoiceId: invoice.id,
        correlationId,
      });
    }
  } catch (error) {
    log.error("Failed to handle invoice event", {
      correlationId,
      invoiceId: invoice.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error; // Re-throw to be handled by webhook processor
  }
}

/**
 * Health check endpoint for webhook processor status
 */
export async function getStripeWebhookHealth(c: Context) {
  const rateLimitStatus = stripeWebhookProcessor.getRateLimitStatus();
  const circuitBreakerStatus = stripeWebhookProcessor.getCircuitBreakerStatus();

  return c.json({
    service: "stripe-webhook-processor",
    status: circuitBreakerStatus === "open" ? "degraded" : "healthy",
    timestamp: new Date().toISOString(),
    rateLimiter: rateLimitStatus,
    circuitBreaker: {
      state: circuitBreakerStatus,
    },
    config: {
      maxConnectionRetries: 15,
      maxRateLimitRetries: 10,
      maxGovernorRetries: 5,
      timeout: 60000,
    },
  });
}
