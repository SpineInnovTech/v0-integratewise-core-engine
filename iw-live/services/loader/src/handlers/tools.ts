/**
 * Tools Management Handlers
 * Registry, health checks, and tool management
 */

import type { Context } from "hono";
import { TOOL_REGISTRY, getToolConfig, getToolsByCategory } from "../lib/tool-registry";
import { createHealthCheckHandler } from "../lib/generic-handler";

type Log = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

/**
 * Get all tools registry
 */
export async function toolsRegistryHandler(c: Context) {
  const log = c.get("log") as Log;
  const category = c.req.query("category");
  const enabled = c.req.query("enabled");

  let tools = TOOL_REGISTRY;

  // Filter by category
  if (category) {
    tools = getToolsByCategory(category as any);
  }

  // Filter by enabled status
  if (enabled === "true") {
    tools = tools.filter((t) => t.enabled);
  } else if (enabled === "false") {
    tools = tools.filter((t) => !t.enabled);
  }

  log.info("Tools registry requested", { category, enabled, count: tools.length });

  return c.json({
    tools,
    total: tools.length,
    enabled: tools.filter((t) => t.enabled).length,
    categories: {
      integration: tools.filter((t) => t.category === "integration").length,
      cron: tools.filter((t) => t.category === "cron").length,
      loader: tools.filter((t) => t.category === "loader").length,
      api: tools.filter((t) => t.category === "api").length,
      system: tools.filter((t) => t.category === "system").length,
    },
  });
}

/**
 * Get specific tool info
 */
export async function toolInfoHandler(c: Context) {
  const log = c.get("log") as Log;
  const toolId = c.req.param("id");

  if (!toolId) {
    return c.json({ error: "Tool ID is required" }, 400);
  }

  const tool = getToolConfig(toolId);

  if (!tool) {
    log.warn("Tool not found", { toolId });
    return c.json({ error: "Tool not found" }, 404);
  }

  return c.json(tool);
}

/**
 * Health check for all tools
 */
export async function toolsHealthHandler(c: Context) {
  const healthChecks = await Promise.allSettled(
    TOOL_REGISTRY.map(async (tool) => {
      try {
        // For now, just check if tool is enabled
        // In production, you might want to ping each tool's health endpoint
        return {
          id: tool.id,
          name: tool.name,
          status: tool.enabled ? "enabled" : "disabled",
          category: tool.category,
        };
      } catch (error) {
        return {
          id: tool.id,
          name: tool.name,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  const results = healthChecks.map((result) =>
    result.status === "fulfilled" ? result.value : { status: "error" }
  );

  const healthy = results.filter((r) => r.status === "enabled").length;
  const total = results.length;

  return c.json({
    status: healthy === total ? "healthy" : "degraded",
    healthy,
    total,
    tools: results,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create health check handler for a specific tool
 */
export function createToolHealthHandler(toolId: string): (c: Context) => Promise<Response> {
  const tool = getToolConfig(toolId);
  if (!tool) {
    return async (c: Context) => {
      return c.json({ error: "Tool not found" }, 404);
    };
  }

  return createHealthCheckHandler(toolId, tool.name);
}
