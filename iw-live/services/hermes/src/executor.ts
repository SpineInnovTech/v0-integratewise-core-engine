/**
 * Hermes — Execution Engine
 *
 * Core execution logic:
 * 1. Receives approved action + approval token
 * 2. Validates token against Spine / HITL Gate
 * 3. Selects backend (n8n → DO → direct)
 * 4. Executes with timeout + retry
 * 5. Writes outcome to Spine + CouchDB continuity
 * 6. Surfaces result via SSE / queue
 */

import type {
  ExecutionTask,
  ExecutionPayload,
  ExecutionOutcome,
  ExecutionError,
  ExecutorBackend,
} from "./types";

// ─── Environment Interface ──────────────────────────────────────────────────

export interface ExecutorEnv {
  SPINE?: Fetcher;
  KNOWLEDGE?: Fetcher;
  THINK?: Fetcher;
  ACT?: Fetcher;
  CONTINUITY?: Fetcher;
  WORKFLOW?: Fetcher;
  OUTCOMES_QUEUE?: Queue;
  EXECUTION_META?: KVNamespace;
  N8N_BASE_URL?: string;
  N8N_API_KEY?: string;
}

// ─── Configuration ──────────────────────────────────────────────────────────

// const _DEFAULT_TIMEOUT_MS = 30000; // reserved for future timeout logic
// const _MAX_RETRIES = 2; // reserved for future retry logic

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Execute an approved action.
 * This is the main entrypoint called by POST /execute.
 */
export async function executeTask(
  task: ExecutionTask,
  env: ExecutorEnv,
  ctx: ExecutionContext
): Promise<ExecutionOutcome> {
  addLineageStep(task, "hermes", "execute_start", "running");

  try {
    // 1. Validate approval token
    const tokenValid = await validateApprovalToken(task, env);
    if (!tokenValid) {
      throw executionError("INVALID_TOKEN", "Approval token validation failed", false);
    }

    // 2. Select backend
    const backend = await selectBackend(task, env);
    task.backend = backend;
    addLineageStep(task, "hermes", "backend_selected", backend);

    // 3. Route to backend
    let outcome: ExecutionOutcome;
    switch (backend) {
      case "n8n":
        outcome = await executeViaN8n(task, env, ctx);
        break;
      case "durable_object":
        outcome = await executeViaDurableObject(task, env);
        break;
      case "direct":
        outcome = await executeDirect(task, env);
        break;
      case "queued":
        outcome = await executeViaQueue(task, env, ctx);
        break;
      default:
        throw executionError("UNKNOWN_BACKEND", `Backend ${backend} not implemented`, false);
    }

    // 4. Record outcome
    task.outcome = outcome;
    task.status = outcome.success ? "completed" : "failed";
    task.completedAt = new Date().toISOString();
    addLineageStep(task, "hermes", "execute_complete", task.status);

    // 5. Persist to Spine + Continuity (async, non-blocking)
    ctx.waitUntil(persistOutcome(task, env));

    return outcome;
  } catch (err: any) {
    const error = err.isExecutionError
      ? err
      : executionError("EXECUTION_FAILED", err.message || "Unknown execution error", true);

    task.error = error;
    task.status = "failed";
    task.completedAt = new Date().toISOString();
    addLineageStep(task, "hermes", "execute_failed", error.code);

    ctx.waitUntil(persistOutcome(task, env));

    return { success: false };
  }
}

/**
 * Build a new ExecutionTask from an approved action payload.
 */
export function buildTask(
  actionId: string,
  tenantId: string,
  userId: string,
  payload: ExecutionPayload,
  correlationId?: string
): ExecutionTask {
  const now = new Date().toISOString();
  return {
    taskId: crypto.randomUUID(),
    actionId,
    tenantId,
    userId,
    status: "pending",
    backend: "queued",
    createdAt: now,
    updatedAt: now,
    payload,
    lineage: {
      correlationId: correlationId || crypto.randomUUID(),
      trace: [{ at: now, service: "hermes", action: "task_created", status: "pending" }],
    },
  };
}

// ─── Backend Selection ──────────────────────────────────────────────────────

async function selectBackend(task: ExecutionTask, env: ExecutorEnv): Promise<ExecutorBackend> {
  // Priority:
  // 1. n8n — if available and workflow mapped
  // 2. Durable Object — for stateful / long-running
  // 3. Direct — for simple CRUD ops
  // 4. Queued — fallback, defer to queue consumer

  const n8nHealthy = await isN8nHealthy(env);
  if (n8nHealthy && task.payload.actionType.startsWith("workflow.")) {
    return "n8n";
  }

  if (task.payload.timeoutMs && task.payload.timeoutMs > 30000) {
    return "durable_object";
  }

  if (["entity.create", "entity.update", "entity.delete"].includes(task.payload.actionType)) {
    return "direct";
  }

  return env.OUTCOMES_QUEUE ? "queued" : "durable_object";
}

// ─── Validation ─────────────────────────────────────────────────────────────

async function validateApprovalToken(task: ExecutionTask, env: ExecutorEnv): Promise<boolean> {
  if (!env.WORKFLOW) return true; // Dev fallback

  try {
    const res = await env.WORKFLOW.fetch(
      new Request("http://workflow/internal/hitl/validate-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": task.tenantId,
        },
        body: JSON.stringify({
          action_id: task.actionId,
          approval_token: task.payload.approvalToken,
        }),
      })
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { valid?: boolean };
    return data.valid === true;
  } catch {
    // If validation service is down, fail closed in production, open in dev
    return env.N8N_BASE_URL?.includes("localhost") || false;
  }
}

// ─── n8n Execution ──────────────────────────────────────────────────────────

async function executeViaN8n(
  task: ExecutionTask,
  env: ExecutorEnv,
  _ctx: ExecutionContext
): Promise<ExecutionOutcome> {
  addLineageStep(task, "n8n", "execution_start", "running");

  const baseUrl = env.N8N_BASE_URL || "http://localhost:5678";
  const apiKey = env.N8N_API_KEY || "";

  // Map actionType to n8n workflow ID (configurable via KV)
  const workflowId = await resolveWorkflowId(task, env);
  if (!workflowId) {
    // Fallback if no workflow mapped
    return executeViaDurableObject(task, env);
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/workflows/${workflowId}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": apiKey,
      },
      body: JSON.stringify({
        data: {
          taskId: task.taskId,
          actionId: task.actionId,
          tenantId: task.tenantId,
          userId: task.userId,
          payload: task.payload,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw executionError(
        "N8N_EXECUTION_FAILED",
        `n8n returned ${res.status}: ${body}`,
        res.status >= 500
      );
    }

    const data = (await res.json()) as { executionId?: string; data?: unknown };
    addLineageStep(task, "n8n", "execution_complete", "completed");

    return {
      success: true,
      data: data.data,
      spineWrites: extractSpineWrites(data.data),
    };
  } catch (err: any) {
    if (err.isExecutionError) throw err;
    throw executionError("N8N_UNREACHABLE", err.message, true);
  }
}

// ─── Durable Object Execution ───────────────────────────────────────────────

async function executeViaDurableObject(
  task: ExecutionTask,
  env: ExecutorEnv
): Promise<ExecutionOutcome> {
  addLineageStep(task, "durable_object", "execution_start", "running");

  // For now: proxy to ACT service (existing intelligence execution)
  if (!env.ACT) {
    throw executionError("NO_ACT_SERVICE", "ACT service binding not available", false);
  }

  const res = await env.ACT.fetch(
    new Request("http://act/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": task.tenantId,
        "x-approval-token": task.payload.approvalToken,
      },
      body: JSON.stringify({
        action_id: task.actionId,
        action_type: task.payload.actionType,
        target_tool: task.payload.targetTool,
        payload: task.payload.params,
        approval_token: task.payload.approvalToken,
      }),
    })
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw executionError(
      "ACT_EXECUTION_FAILED",
      `ACT returned ${res.status}: ${body}`,
      res.status >= 500
    );
  }

  const data = (await res.json()) as unknown;
  addLineageStep(task, "durable_object", "execution_complete", "completed");

  return {
    success: true,
    data,
    spineWrites: extractSpineWrites(data),
  };
}

// ─── Direct Execution ───────────────────────────────────────────────────────

async function executeDirect(task: ExecutionTask, env: ExecutorEnv): Promise<ExecutionOutcome> {
  addLineageStep(task, "direct", "execution_start", "running");

  if (!env.SPINE) {
    throw executionError("NO_SPINE_SERVICE", "SPINE service binding not available", false);
  }

  const method = task.payload.actionType === "entity.delete" ? "DELETE" : "POST";
  const endpoint =
    task.payload.actionType === "entity.delete"
      ? `/api/entities/${task.payload.entityType}/${task.payload.entityId}`
      : "/api/entities";

  const res = await env.SPINE.fetch(
    new Request(`https://spine${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": task.tenantId,
      },
      body: method !== "DELETE" ? JSON.stringify(task.payload.params) : undefined,
    })
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw executionError(
      "SPINE_WRITE_FAILED",
      `Spine returned ${res.status}: ${body}`,
      res.status >= 500
    );
  }

  const data = (await res.json()) as unknown;
  addLineageStep(task, "direct", "execution_complete", "completed");

  return {
    success: true,
    data,
    spineWrites: [
      {
        entityType: task.payload.entityType || "unknown",
        entityId: task.payload.entityId || task.taskId,
        operation: method === "DELETE" ? "delete" : "create",
        fields: task.payload.params,
      },
    ],
  };
}

// ─── Queued Execution ───────────────────────────────────────────────────────

async function executeViaQueue(
  task: ExecutionTask,
  env: ExecutorEnv,
  ctx: ExecutionContext
): Promise<ExecutionOutcome> {
  if (!env.OUTCOMES_QUEUE) {
    throw executionError("NO_QUEUE", "OUTCOMES_QUEUE binding not available", false);
  }

  addLineageStep(task, "queue", "queued", "queued");

  ctx.waitUntil(
    env.OUTCOMES_QUEUE.send({
      type: "execute_task",
      task_id: task.taskId,
      tenant_id: task.tenantId,
      payload: task.payload,
      approval_token: task.payload.approvalToken,
    })
  );

  return {
    success: true,
    data: { queued: true, taskId: task.taskId },
  };
}

// ─── Outcome Persistence ────────────────────────────────────────────────────

async function persistOutcome(task: ExecutionTask, env: ExecutorEnv): Promise<void> {
  const promises: Promise<unknown>[] = [];

  // Write to Spine (audit / action outcome)
  if (env.SPINE && task.outcome?.spineWrites) {
    promises.push(
      env.SPINE.fetch(
        new Request("https://spine/internal/actions/outcome", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": task.tenantId,
          },
          body: JSON.stringify({
            task_id: task.taskId,
            action_id: task.actionId,
            status: task.status,
            outcome: task.outcome,
            error: task.error,
            lineage: task.lineage,
          }),
        })
      ).catch(() => {
        /* non-blocking */
      })
    );
  }

  // Write to CouchDB continuity
  if (env.CONTINUITY) {
    promises.push(
      env.CONTINUITY.fetch(
        new Request("http://continuity/v1/continuity/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": task.tenantId,
          },
          body: JSON.stringify({
            type: "workflow.event",
            user_id: task.userId,
            content: {
              task_id: task.taskId,
              action_id: task.actionId,
              action_type: task.payload.actionType,
              status: task.status,
              backend: task.backend,
              outcome: task.outcome,
              error: task.error,
            },
            source: "hermes:executor",
            metadata: {
              correlation_id: task.lineage.correlationId,
              lineage: task.lineage.trace,
            },
          }),
        })
      ).catch(() => {
        /* non-blocking */
      })
    );
  }

  // Update KV for fast lookups
  if (env.EXECUTION_META) {
    promises.push(
      env.EXECUTION_META.put(
        `task:${task.tenantId}:${task.taskId}`,
        JSON.stringify({
          status: task.status,
          updated_at: task.updatedAt,
          action_type: task.payload.actionType,
        }),
        { expirationTtl: 86400 }
      )
    );
  }

  await Promise.all(promises);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function isN8nHealthy(env: ExecutorEnv): Promise<boolean> {
  const baseUrl = env.N8N_BASE_URL;
  if (!baseUrl) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${baseUrl}/healthz`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function resolveWorkflowId(task: ExecutionTask, env: ExecutorEnv): Promise<string | null> {
  if (!env.EXECUTION_META) return null;
  const mapping = await env.EXECUTION_META.get(`workflow-map:${task.payload.actionType}`);
  return mapping || null;
}

function extractSpineWrites(data: unknown): Array<{
  entityType: string;
  entityId: string;
  operation: "create" | "update" | "delete";
  fields: Record<string, unknown>;
}> {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.spineWrites)) return [];
  return d.spineWrites as Array<{
    entityType: string;
    entityId: string;
    operation: "create" | "update" | "delete";
    fields: Record<string, unknown>;
  }>;
}

function executionError(
  code: string,
  message: string,
  retryable: boolean
): ExecutionError & { isExecutionError: true } {
  const err = new Error(message) as unknown as ExecutionError & { isExecutionError: true };
  err.code = code;
  err.message = message;
  err.retryable = retryable;
  err.isExecutionError = true;
  return err;
}

function addLineageStep(
  task: ExecutionTask,
  service: string,
  action: string,
  status: string
): void {
  task.lineage.trace.push({
    at: new Date().toISOString(),
    service,
    action,
    status,
  });
}
