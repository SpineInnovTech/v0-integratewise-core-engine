/**
 * Hermes — Orchestration Intelligence Worker
 *
 * Entrypoint for the execution layer:
 * - POST /execute       → Execute approved action
 * - GET  /stream/:taskId → SSE stream of execution status
 * - GET  /health        → Health check
 * - POST /orchestrate   → Orchestrate workflow
 *
 * Architecture:
 *   Approval → Hermes receives task → Orchestrates (n8n or DO) →
 *   Executes → Writes outcome to Spine → Updates CouchDB continuity →
 *   Surfaces result to user (SSE)
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { executeTask, buildTask } from "./executor";
import { orchestrate, deployWorkflow, setWorkflowActive } from "./orchestrator";
import { createSSEResponse, emitStatus, emitOutcome, StreamHubDO } from "./stream";
import { ExecutionEngineDO } from "./execution-engine";
import type { ExecutionPayload, OrchestrationRequest } from "./types";

export { StreamHubDO, ExecutionEngineDO };

// ============================================================================
// Environment
// ============================================================================

interface Env {
  SPINE?: Fetcher;
  KNOWLEDGE?: Fetcher;
  THINK?: Fetcher;
  ACT?: Fetcher;
  CONTINUITY?: Fetcher;
  WORKFLOW?: Fetcher;
  OUTCOMES_QUEUE?: Queue;
  EXECUTION_META?: KVNamespace;
  RATE_LIMIT?: KVNamespace;
  STREAM_HUB: DurableObjectNamespace;
  N8N_BASE_URL?: string;
  N8N_API_KEY?: string;
}

// ============================================================================
// App Setup
// ============================================================================

const app = new Hono<{ Bindings: Env; Variables: { requestId: string; tenantId?: string } }>();
app.use("*", cors());

// Middleware: correlation ID + tenant extraction + rate limit
app.use("*", async (c, next) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  const tenantId = c.req.header("x-tenant-id");
  c.res.headers.set("x-correlation-id", requestId);
  c.set("requestId", requestId);
  if (tenantId) c.set("tenantId", tenantId);
  await next();
});

// ============================================================================
// Root — Service Info
// ============================================================================

app.get("/", async (c) => {
  return c.json({
    service: "hermes",
    version: "1.0.0",
    description: "Orchestration Intelligence Worker — Execution Layer",
    endpoints: [
      { method: "GET", path: "/health", description: "Health check" },
      { method: "POST", path: "/execute", description: "Execute approved action" },
      { method: "GET", path: "/stream/:taskId", description: "SSE stream of execution status" },
      { method: "POST", path: "/orchestrate", description: "Orchestrate workflow" },
      { method: "POST", path: "/workflows", description: "Deploy n8n workflow" },
      {
        method: "PATCH",
        path: "/workflows/:id/active",
        description: "Toggle workflow active state",
      },
      { method: "GET", path: "/tasks/:taskId", description: "Lookup task by ID" },
    ],
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Health Check
// ============================================================================

app.get("/health", async (c) => {
  const n8nHealthy = await checkN8nHealth(c.env);

  return c.json({
    status: "ok",
    service: "hermes",
    version: "1.0.0",
    n8n: n8nHealthy ? "connected" : "unavailable",
    backends: ["n8n", "durable_object", "direct", "queued"].filter(Boolean),
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// POST /execute — Execute Approved Action
// ============================================================================

const ExecuteSchema = z.object({
  action_id: z.string().min(1),
  action_type: z.string().min(1),
  target_tool: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  params: z.record(z.unknown()).default({}),
  approval_token: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  timeout_ms: z.number().int().min(1000).max(300000).optional(),
});

app.post("/execute", async (c) => {
  const requestId = c.get("requestId") as string;
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id") || "system";

  if (!tenantId) {
    return c.json({ error: "x-tenant-id required" }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = ExecuteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid execute payload", details: parsed.error.flatten() }, 400);
  }

  const payload: ExecutionPayload = {
    actionType: parsed.data.action_type,
    targetTool: parsed.data.target_tool,
    entityType: parsed.data.entity_type,
    entityId: parsed.data.entity_id,
    params: parsed.data.params,
    approvalToken: parsed.data.approval_token,
    priority: parsed.data.priority,
    timeoutMs: parsed.data.timeout_ms,
  };

  const task = buildTask(parsed.data.action_id, tenantId, userId, payload, requestId);

  // Emit initial status to any connected SSE clients
  c.executionCtx.waitUntil(emitStatus(task, c.env));

  // Execute (async if queued, sync otherwise)
  const outcome = await executeTask(task, c.env, c.executionCtx);

  // Emit final outcome
  c.executionCtx.waitUntil(emitOutcome(task, c.env));

  return c.json({
    success: outcome.success,
    data: {
      task_id: task.taskId,
      action_id: task.actionId,
      status: task.status,
      backend: task.backend,
      outcome: task.outcome,
      error: task.error,
      lineage: task.lineage,
    },
    correlation_id: requestId,
  });
});

// ============================================================================
// GET /stream/:taskId — SSE Stream of Execution Status
// ============================================================================

app.get("/stream/:taskId", async (c) => {
  const taskId = c.req.param("taskId");
  if (!taskId) {
    return c.json({ error: "taskId required" }, 400);
  }

  return createSSEResponse(taskId, c.env);
});

// ============================================================================
// POST /orchestrate — Orchestrate Workflow
// ============================================================================

const OrchestrateSchema = z.object({
  workflow_id: z.string().optional(),
  workflow_name: z.string().optional(),
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
      parameters: z.record(z.unknown()).default({}),
      position: z.tuple([z.number(), z.number()]).optional(),
    })
  ),
  edges: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      condition: z.string().optional(),
    })
  ),
  trigger: z.object({
    type: z.enum(["webhook", "schedule", "manual", "approval"]),
    payload: z.record(z.unknown()).optional(),
  }),
  credentials: z.record(z.string()).optional(),
});

app.post("/orchestrate", async (c) => {
  const requestId = c.get("requestId") as string;
  const tenantId = c.req.header("x-tenant-id");

  if (!tenantId) {
    return c.json({ error: "x-tenant-id required" }, 400);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = OrchestrateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid orchestration payload", details: parsed.error.flatten() }, 400);
  }

  const request: OrchestrationRequest = {
    workflowId: parsed.data.workflow_id,
    workflowName: parsed.data.workflow_name,
    nodes: parsed.data.nodes,
    edges: parsed.data.edges,
    trigger: parsed.data.trigger,
    credentials: parsed.data.credentials,
  };

  const result = await orchestrate(request, c.env);

  return c.json({
    success: result.status === "completed",
    data: {
      execution_id: result.executionId,
      status: result.status,
      started_at: result.startedAt,
      finished_at: result.finishedAt,
      output: result.output,
      error: result.error,
    },
    correlation_id: requestId,
  });
});

// ============================================================================
// Workflow Management (n8n bridge)
// ============================================================================

app.post("/workflows", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { workflow } = body as {
    workflow: { id: string; name: string; active: boolean; nodes: unknown[]; connections: unknown };
  };

  if (!workflow) {
    return c.json({ error: "workflow required" }, 400);
  }

  const result = await deployWorkflow(workflow as any, c.env);
  return c.json({ success: true, data: result });
});

app.patch("/workflows/:id/active", async (c) => {
  const workflowId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const { active } = body as { active?: boolean };

  if (active === undefined) {
    return c.json({ error: "active boolean required" }, 400);
  }

  const ok = await setWorkflowActive(workflowId, active, c.env);
  return c.json({ success: ok, data: { workflowId, active } });
});

// ============================================================================
// Task Lookup
// ============================================================================

app.get("/tasks/:taskId", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const taskId = c.req.param("taskId");

  if (!tenantId || !c.env.EXECUTION_META) {
    return c.json({ error: "Not available" }, 404);
  }

  const raw = await c.env.EXECUTION_META.get(`task:${tenantId}:${taskId}`);
  if (!raw) {
    return c.json({ error: "Task not found" }, 404);
  }

  return c.json({ success: true, data: JSON.parse(raw) });
});

// ============================================================================
// 404 Handler
// ============================================================================

app.notFound((c) =>
  c.json(
    {
      error: "Not found",
      message: `No route matches ${c.req.path}`,
      code: "ROUTE_NOT_FOUND",
    },
    404
  )
);

// ============================================================================
// Default Export (Cloudflare Worker)
// ============================================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<unknown>, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      const body = message.body as Record<string, unknown>;

      if (body.type === "execute_task") {
        const {
          task_id,
          tenant_id,
          payload,
          approval_token: _approval_token,
        } = body as {
          task_id: string;
          tenant_id: string;
          payload: ExecutionPayload;
          approval_token: string;
        };

        const { executeTask, buildTask } = await import("./executor");
        const { emitStatus, emitOutcome } = await import("./stream");

        const task = buildTask(task_id, tenant_id, "system", payload);
        ctx.waitUntil(emitStatus(task, env));

        await executeTask(task, env, ctx);

        ctx.waitUntil(emitOutcome(task, env));
      }
    }
  },
};

// ============================================================================
// Helpers
// ============================================================================

async function checkN8nHealth(env: Env): Promise<boolean> {
  const baseUrl = env.N8N_BASE_URL;
  if (!baseUrl) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${baseUrl}/healthz`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}
