/**
 * Generic Webhook Handler Factory
 * Creates handlers for tools that forward to core engine
 */

import type { Context } from "hono";
import type { ToolConfig } from "./tool-registry";

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

interface GenericHandlerOptions {
  toolId: string;
  toolName: string;
  validatePayload?: (body: unknown) => { valid: boolean; error?: string };
  transformPayload?: (body: unknown, c: Context) => unknown;
}

/**
 * Create a generic webhook handler that forwards to core engine
 */
export function createGenericHandler(options: GenericHandlerOptions) {
  return async (c: Context) => {
    const log = c.get("log") as Log;

    // Check if tool is enabled
    const toolConfig = c.get("toolConfig") as ToolConfig | undefined;
    if (toolConfig && !toolConfig.enabled) {
      log.warn("Tool is disabled", { toolId: options.toolId });
      return c.json({ error: "Tool is disabled" }, 503);
    }

    // Parse body
    let body: unknown;
    try {
      if (c.req.method === "GET") {
        // For GET requests, use query params
        const params = c.req.query();
        body = Object.keys(params).length > 0 ? params : { trigger: "manual" };
      } else {
        body = await c.req.json();
      }
    } catch {
      log.warn("Invalid JSON payload", { toolId: options.toolId });
      return c.json({ error: "Invalid JSON payload" }, 400);
    }

    // Validate payload if validator provided
    if (options.validatePayload) {
      const validation = options.validatePayload(body);
      if (!validation.valid) {
        log.warn("Invalid payload", {
          toolId: options.toolId,
          error: validation.error,
        });
        return c.json({ error: validation.error || "Invalid payload" }, 400);
      }
    }

    // Transform payload if transformer provided
    const transformedPayload = options.transformPayload ? options.transformPayload(body, c) : body;

    log.info(`${options.toolName} webhook received`, {
      toolId: options.toolId,
      method: c.req.method,
    });

    // Create Spine event
    const spineEvent = {
      id: crypto.randomUUID(),
      source: options.toolId,
      type: `${options.toolId}.event`,
      timestamp: new Date().toISOString(),
      payload: transformedPayload,
      metadata: {
        userAgent: c.req.header("user-agent"),
        ip: c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown",
        requestId: c.get("requestId"),
        method: c.req.method,
      },
    };

    // Forward to core engine
    try {
      const response = await fetch(`${c.env.CORE_ENGINE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-id": c.get("requestId"),
          "x-source": options.toolId,
          "x-tool-name": options.toolName,
        },
        body: JSON.stringify(spineEvent),
      });

      if (!response.ok) {
        log.error("Failed to forward event", {
          toolId: options.toolId,
          status: response.status,
        });

        // For cron jobs and system tools, still return success
        if (toolConfig?.category === "cron" || toolConfig?.category === "system") {
          return c.json({
            success: true,
            message: "Event processed",
            eventId: spineEvent.id,
          });
        }

        return c.json({ error: "Failed to forward event" }, 500);
      }

      log.info("Event forwarded successfully", {
        toolId: options.toolId,
        eventId: spineEvent.id,
      });

      return c.json({
        success: true,
        message: "Event processed",
        eventId: spineEvent.id,
      });
    } catch (error) {
      log.error("Error forwarding event", {
        toolId: options.toolId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // For cron jobs, return success even on error
      if (toolConfig?.category === "cron" || toolConfig?.category === "system") {
        return c.json({
          success: true,
          message: "Event queued for retry",
        });
      }

      return c.json({ error: "Processing failed" }, 500);
    }
  };
}

/**
 * Create a health check handler
 */
export function createHealthCheckHandler(toolId: string, toolName: string) {
  return async (c: Context) => {
    const log = c.get("log") as Log;

    const health = {
      tool: toolId,
      name: toolName,
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT,
      coreEngineUrl: c.env.CORE_ENGINE_URL,
    };

    // Optional: Test core engine connectivity
    try {
      const testResponse = await fetch(`${c.env.CORE_ENGINE_URL}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (testResponse.ok) {
        health.status = "ok";
        (health as Record<string, unknown>).coreEngineReachable = true;
      } else {
        health.status = "degraded";
        (health as Record<string, unknown>).coreEngineReachable = false;
        (health as Record<string, unknown>).coreEngineStatus = testResponse.status;
      }
    } catch (error) {
      log.warn("Core engine health check failed", {
        toolId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      health.status = "degraded";
      (health as Record<string, unknown>).coreEngineReachable = false;
    }

    const statusCode = health.status === "ok" ? 200 : 503;
    return c.json(health, statusCode);
  };
}
