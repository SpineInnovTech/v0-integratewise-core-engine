/**
 * Hermes — Orchestrator
 *
 * Bridges high-level workflow orchestration to execution backends:
 * - n8n: external workflow engine (Hostinger VPS)
 * - Durable Objects: stateful long-running workflows
 * - Direct service mesh calls for simple compositions
 *
 * Responsibilities:
 * 1. Resolve workflow definitions
 * 2. Map action types to backend executors
 * 3. Handle fallback when n8n is unavailable
 * 4. Compose multi-step executions
 */

import type {
  OrchestrationRequest,
  OrchestrationResult,
  OrchestrationNode,
  OrchestrationEdge,
  N8nWorkflow,
  ExecutionStatus,
  ExecutionError,
} from "./types";

export interface OrchestratorEnv {
  N8N_BASE_URL?: string;
  N8N_API_KEY?: string;
  EXECUTION_META?: KVNamespace;
  SPINE?: Fetcher;
  WORKFLOW?: Fetcher;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Orchestrate a workflow request.
 * Tries n8n first, falls back to DO-based orchestration.
 */
export async function orchestrate(
  request: OrchestrationRequest,
  env: OrchestratorEnv
): Promise<OrchestrationResult> {
  const startedAt = new Date().toISOString();
  const executionId = crypto.randomUUID();

  // 1. Check if n8n is healthy and we have a mapped workflow
  const n8nAvailable = await isN8nAvailable(env);
  const mappedWorkflowId =
    request.workflowId || (await findWorkflowMapping(request.workflowName || "", env));

  if (n8nAvailable && mappedWorkflowId) {
    return runN8nWorkflow(executionId, mappedWorkflowId, request, env, startedAt);
  }

  // 2. Fallback: DO-based orchestration
  return runLocalOrchestration(executionId, request, env, startedAt);
}

/**
 * Deploy a workflow definition to n8n.
 * If n8n is unavailable, stores as a pending deployment.
 */
export async function deployWorkflow(
  workflow: N8nWorkflow,
  env: OrchestratorEnv
): Promise<{ workflowId: string; deployed: boolean; pending?: boolean }> {
  const baseUrl = env.N8N_BASE_URL;
  if (!baseUrl) {
    // Store for later deployment
    await storePendingWorkflow(workflow, env);
    return { workflowId: workflow.id, deployed: false, pending: true };
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": env.N8N_API_KEY || "",
      },
      body: JSON.stringify(workflow),
    });

    if (!res.ok) {
      await storePendingWorkflow(workflow, env);
      return { workflowId: workflow.id, deployed: false, pending: true };
    }

    const data = (await res.json()) as { id?: string };
    return { workflowId: data.id || workflow.id, deployed: true };
  } catch {
    await storePendingWorkflow(workflow, env);
    return { workflowId: workflow.id, deployed: false, pending: true };
  }
}

/**
 * Activate/deactivate an n8n workflow.
 */
export async function setWorkflowActive(
  workflowId: string,
  active: boolean,
  env: OrchestratorEnv
): Promise<boolean> {
  const baseUrl = env.N8N_BASE_URL;
  if (!baseUrl) return false;

  try {
    const res = await fetch(`${baseUrl}/api/v1/workflows/${workflowId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": env.N8N_API_KEY || "",
      },
      body: JSON.stringify({ active }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── n8n Orchestration ──────────────────────────────────────────────────────

async function runN8nWorkflow(
  executionId: string,
  workflowId: string,
  request: OrchestrationRequest,
  env: OrchestratorEnv,
  startedAt: string
): Promise<OrchestrationResult> {
  const baseUrl = env.N8N_BASE_URL!;

  try {
    const res = await fetch(`${baseUrl}/api/v1/workflows/${workflowId}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": env.N8N_API_KEY || "",
      },
      body: JSON.stringify({
        data: {
          executionId,
          trigger: request.trigger,
          nodes: request.nodes,
          credentials: request.credentials,
        },
      }),
    });

    if (!res.ok) {
      // Fallback to local orchestration on n8n execution failure
      return runLocalOrchestration(executionId, request, env, startedAt);
    }

    const data = (await res.json()) as {
      executionId?: string;
      status?: string;
      data?: unknown;
      finishedAt?: string;
    };

    return {
      executionId: data.executionId || executionId,
      status: mapN8nStatus(data.status),
      startedAt,
      finishedAt: data.finishedAt,
      output: data.data,
    };
  } catch {
    return runLocalOrchestration(executionId, request, env, startedAt);
  }
}

// ─── Local (DO-based) Orchestration ─────────────────────────────────────────

async function runLocalOrchestration(
  executionId: string,
  request: OrchestrationRequest,
  env: OrchestratorEnv,
  startedAt: string
): Promise<OrchestrationResult> {
  // Simple sequential executor for defined nodes
  // In production this would dispatch to an ExecutionEngineDO
  const nodeResults: Awaited<ReturnType<typeof executeNode>>[] = [];

  // Build adjacency list
  const graph = buildGraph(request.nodes, request.edges);
  const visited = new Set<string>();
  const queue = graph.roots;

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = request.nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const result = await executeNode(node, env);
    nodeResults.push(result);

    if (result.status === "failed") {
      return {
        executionId,
        status: "failed",
        startedAt,
        finishedAt: new Date().toISOString(),
        nodeResults,
        error: result.error,
      };
    }

    // Enqueue children
    for (const childId of graph.children[nodeId] || []) {
      if (!visited.has(childId)) queue.push(childId);
    }
  }

  return {
    executionId,
    status: "completed",
    startedAt,
    finishedAt: new Date().toISOString(),
    nodeResults,
    output: nodeResults[nodeResults.length - 1]?.output,
  };
}

async function executeNode(
  node: OrchestrationNode,
  env: OrchestratorEnv
): Promise<{
  nodeId: string;
  nodeName: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  output?: unknown;
  error?: ExecutionError;
}> {
  const startedAt = new Date().toISOString();

  try {
    let output: unknown;

    switch (node.type) {
      case "spine.read":
        output = await callSpine("GET", "/api/entities", node.parameters, env);
        break;
      case "spine.write":
        output = await callSpine("POST", "/api/entities", node.parameters, env);
        break;
      case "http.request":
        output = await callHttp(node.parameters);
        break;
      case "transform":
        output = applyTransform(node.parameters);
        break;
      case "condition":
        output = evaluateCondition(node.parameters);
        break;
      default:
        output = { passthrough: node.parameters };
    }

    return {
      nodeId: node.id,
      nodeName: node.name,
      status: "completed",
      startedAt,
      finishedAt: new Date().toISOString(),
      output,
    };
  } catch (err: any) {
    return {
      nodeId: node.id,
      nodeName: node.name,
      status: "failed",
      startedAt,
      finishedAt: new Date().toISOString(),
      error: {
        code: "NODE_EXECUTION_FAILED",
        message: err.message || "Node execution failed",
        retryable: false,
      },
    };
  }
}

// ─── Graph Builder ──────────────────────────────────────────────────────────

function buildGraph(nodes: OrchestrationNode[], edges: OrchestrationEdge[]) {
  const children: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  for (const node of nodes) {
    children[node.id] = [];
    inDegree[node.id] = 0;
  }

  for (const edge of edges) {
    if (children[edge.from]) {
      children[edge.from].push(edge.to);
    }
    if (inDegree[edge.to] !== undefined) {
      inDegree[edge.to]++;
    }
  }

  const roots = nodes.filter((n) => (inDegree[n.id] || 0) === 0).map((n) => n.id);

  return { children, roots };
}

// ─── Node Implementations ───────────────────────────────────────────────────

async function callSpine(
  method: string,
  path: string,
  params: Record<string, unknown>,
  env: OrchestratorEnv
): Promise<unknown> {
  if (!env.SPINE) throw new Error("SPINE service not available");

  const res = await env.SPINE.fetch(
    new Request(`https://spine${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method !== "GET" ? JSON.stringify(params) : undefined,
    })
  );

  if (!res.ok) throw new Error(`Spine error: ${res.status}`);
  return res.json();
}

async function callHttp(params: Record<string, unknown>): Promise<unknown> {
  const url = String(params.url || "");
  const method = String(params.method || "GET");
  const body = params.body ? JSON.stringify(params.body) : undefined;

  const res = await fetch(url, {
    method,
    headers: (params.headers as Record<string, string>) || {},
    body,
  });

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json().catch(() => res.text());
}

function applyTransform(params: Record<string, unknown>): unknown {
  const input = params.input as Record<string, unknown>;
  const mapping = params.mapping as Record<string, string>;
  if (!input || !mapping) return input;

  const output: Record<string, unknown> = {};
  for (const [key, path] of Object.entries(mapping)) {
    output[key] = getPath(input, path);
  }
  return output;
}

function evaluateCondition(params: Record<string, unknown>): unknown {
  const input = params.input as Record<string, unknown>;
  const operator = String(params.operator || "eq");
  const field = String(params.field || "");
  const value = params.value;
  const actual = getPath(input, field);

  switch (operator) {
    case "eq":
      return actual === value;
    case "neq":
      return actual !== value;
    case "gt":
      return (actual as number) > (value as number);
    case "lt":
      return (actual as number) < (value as number);
    case "exists":
      return actual !== undefined;
    default:
      return false;
  }
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function isN8nAvailable(env: OrchestratorEnv): Promise<boolean> {
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

async function findWorkflowMapping(name: string, env: OrchestratorEnv): Promise<string | null> {
  if (!env.EXECUTION_META) return null;
  const mapping = await env.EXECUTION_META.get(`workflow-name:${name}`);
  return mapping;
}

async function storePendingWorkflow(workflow: N8nWorkflow, env: OrchestratorEnv): Promise<void> {
  if (!env.EXECUTION_META) return;
  await env.EXECUTION_META.put(
    `pending-workflow:${workflow.id}`,
    JSON.stringify({ workflow, queuedAt: new Date().toISOString() }),
    { expirationTtl: 604800 } // 7 days
  );
}

function mapN8nStatus(status?: string): ExecutionStatus {
  switch (status) {
    case "success":
      return "completed";
    case "error":
      return "failed";
    case "waiting":
      return "awaiting_hitl";
    case "running":
      return "running";
    default:
      return "pending";
  }
}
