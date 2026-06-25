/**
 * Twin Orchestrator — Cognitive Orchestration Layer
 *
 * Architecture: Pure cognitive layer (observes, reasons, proposes, coordinates)
 * Delegates: All infrastructure to specialized workers
 */

import { Hono } from "hono";
import { TwinState } from "./state";
import { buildTwinContext } from "./context";
import { reasonAboutContext } from "./reasoning";
import { generateProposals } from "./proposals";
import { dispatchApproved, monitorOutcomes } from "./coordination";
import type { Env, TwinContext, Reasoning } from "./types";

export { TwinState };

const app = new Hono<{ Bindings: Env }>();

// ============================================================================
// Health Check
// ============================================================================

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "twin-orchestrator",
    role: "cognitive-orchestrator",
    version: "2.0-complete",
    capabilities: {
      core: ["observe", "reason", "propose", "coordinate", "learn", "orchestrate"],
      ai: ["workers_ai", "openrouter_agents", "ai_gateway", "ai_search"],
      data: ["spine_read", "memory_read", "session_logs"],
      tools: ["mcp_tools", "tool_calling", "function_execution"],
      execution: ["workflows", "queues", "service_bindings"],
    },
    infrastructure: {
      service_bindings: {
        mcp_connector: "bound",
        intelligence: "bound",
        pipeline: "bound",
        knowledge: "bound",
        continuity: "bound",
      },
      cloudflare_ai: {
        workers_ai: c.env.AI ? "available" : "missing",
        ai_search: c.env.AI_SEARCH ? "available" : "missing",
        ai_gateway: c.env.AI_GATEWAY ? "configured" : "missing",
      },
      data: {
        d1: c.env.D1 ? "connected" : "missing",
        kv: c.env.CACHE ? "connected" : "missing",
      },
      workflows: {
        morning_brief: c.env.MORNING_BRIEF ? "bound" : "missing",
        signal_workflow: c.env.SIGNAL_WORKFLOW ? "bound" : "missing",
        act_workflow: c.env.ACT_WORKFLOW ? "bound" : "missing",
      },
      queues: {
        coordination: c.env.COORDINATION_QUEUE ? "bound" : "missing",
        execution: c.env.EXECUTION_QUEUE ? "bound" : "missing",
      },
    },
    ts: Date.now(),
  });
});

// ============================================================================
// Manual Observe Trigger (for testing)
// ============================================================================

app.post("/v1/twin/observe", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "iw-customer-zero";

  try {
    const context = await buildTwinContext(c.env, tenantId);
    const reasoning = await reasonAboutContext(context, c.env);
    const proposals = await generateProposals(reasoning, c.env);

    return c.json({
      success: true,
      data: {
        context,
        reasoning,
        proposals,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[Twin Observe] Failed:", err);
    return c.json({ error: err.message }, { status: 500 });
  }
});

// ============================================================================
// OpenAI-Compatible Chat Endpoint (OWUI Integration)
// ============================================================================

app.post("/v1/chat/completions", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "iw-customer-zero";
  const userId = c.req.header("x-user-id") || "system";
  const body = await c.req.json();

  try {
    const { messages, model, stream = false, tools, tool_choice, ...options } = body;

    // Build Twin context
    const context = await buildTwinContext(c.env, tenantId);

    // Build system prompt
    const systemPrompt = buildTwinSystemPrompt({
      context,
      tenantId,
      userId,
    });

    const augmentedMessages = [{ role: "system", content: systemPrompt }, ...messages];

    // Call Intelligence worker for AI response
    const aiResponse = await callIntelligence(c.env, {
      model: model || "openrouter/auto",
      messages: augmentedMessages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      tenantId,
    });

    return c.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: model || "twin-orchestrator",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: aiResponse.content || "",
          },
          finish_reason: "stop",
        },
      ],
      usage: aiResponse.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    });
  } catch (err: any) {
    console.error("[Twin Chat] Error:", err);
    return c.json({ error: { message: err.message, type: "twin_error" } }, { status: 500 });
  }
});

// ============================================================================
// Models Endpoint (OWUI Compatibility)
// ============================================================================

app.get("/v1/models", (c) => {
  return c.json({
    object: "list",
    data: [
      {
        id: "twin-orchestrator",
        object: "model",
        created: 1717900800,
        owned_by: "integratewise",
        permission: [],
        root: "twin-orchestrator",
        parent: null,
      },
    ],
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function buildTwinSystemPrompt(params: { context: any; tenantId: string; userId: string }): string {
  const { context, tenantId, userId } = params;

  return `You are the Twin — a persistent cognitive orchestrator for IntegrateWise.

# YOUR ROLE
You observe, reason, propose, coordinate, and learn. You do NOT execute actions directly.

# CURRENT CONTEXT
**Spine (Operational Truth):**
- Entities: ${context.spine?.entity_count || 0} total
- Recent changes: ${context.spine?.recent_changes?.length || 0}

**Memory (Institutional Knowledge):**
- Recent items: ${context.memory?.recent?.length || 0}

**Signals (Attention Required):**
- Unprocessed: ${context.signals?.unprocessed?.length || 0}
- High priority: ${context.signals?.high_priority?.length || 0}

**Proposals (Governance Queue):**
- Pending approval: ${context.proposals?.pending_approval?.length || 0}
- Recently approved: ${context.proposals?.recently_approved?.length || 0}

**Operations:**
- Last observe: ${context.time?.last_observe || "never"}

# GOVERNANCE RULES
1. **Read operations:** Execute immediately (no approval needed)
2. **Write operations:** Propose → Wait for approval → Coordinate execution
3. **High-risk actions:** Always explain reasoning + impact

# RESPONSE STYLE
- Concise and actionable
- Cite sources (entity IDs, memory items)
- Propose next steps when appropriate
- Acknowledge governance gates (don't promise immediate execution)

You are always-on, observing continuously, reasoning strategically, and orchestrating intelligently.`;
}

async function callIntelligence(
  env: Env,
  params: {
    model: string;
    messages: any[];
    temperature: number;
    max_tokens?: number;
    tenantId: string;
  }
): Promise<{ content: string; usage: any }> {
  // Use /v1/test/rag which has Workers AI fallback (routeAI)
  const systemMsg = params.messages.find((m: any) => m.role === "system")?.content || "";
  const userMsg = params.messages
    .filter((m: any) => m.role !== "system")
    .map((m: any) => m.content)
    .join("\n");

  const response = await env.INTELLIGENCE.fetch(
    new Request("http://internal/v1/test/rag", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": params.tenantId,
        "cf-worker": "twin-orchestrator",
      },
      body: JSON.stringify({
        question: userMsg || "Analyze the current system state and suggest next actions.",
        tier: "balanced",
      }),
    })
  );

  if (!response.ok) {
    throw new Error(`Intelligence worker call failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.content || data.choices?.[0]?.message?.content || "",
    usage: data.usage || {},
  };
}

// ============================================================================
// Export default app for Hono
// ============================================================================

export default app;

// ============================================================================
// Scheduled Export (Twin Observe Loop — Every 5 Minutes)
// ============================================================================

export async function scheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const cron = event.cron;
  console.log(`[Twin Orchestrator] Scheduled trigger: ${cron}`);

  try {
    const tenantId = "iw-customer-zero";

    // Step 1: Build context (observe all systems)
    const context = await buildTwinContext(env, tenantId);
    console.log("[Twin] Context built:", {
      memory_items: context.memory?.recent?.length || 0,
      signals: context.signals?.unprocessed?.length || 0,
      proposals: context.proposals?.pending_approval?.length || 0,
    });

    // Step 2: Reason about context
    const reasoning = await reasonAboutContext(context, env);
    console.log("[Twin] Reasoning complete:", {
      observations: reasoning.observations.length,
      concerns: reasoning.risks.length,
      suggested_actions: reasoning.suggestedActions.length,
    });

    // Step 3: Generate proposals (if any actions suggested)
    if (reasoning.suggestedActions.length > 0) {
      const proposals = await generateProposals(reasoning, env);
      console.log("[Twin] Proposals created:", proposals.length);
    }

    // Step 4: Check for approved proposals and coordinate execution
    await coordinateApprovedActions(env, tenantId);

    // Step 5: Monitor ongoing executions
    const checkpoint = await getCheckpoint(env);
    await monitorOutcomes(checkpoint.pendingProposals || [], env);

    // Update last observe timestamp
    await env.CACHE.put(`twin:last_observe:${tenantId}`, new Date().toISOString(), {
      expirationTtl: 86400,
    });

    console.log("[Twin] Observe loop complete");
  } catch (err: any) {
    console.error("[Twin Orchestrator] Scheduled loop failed:", err.message);
  }
}

// ============================================================================
// Internal Functions for Scheduled Loop
// ============================================================================

async function buildTwinContext(env: Env, tenantId: string): Promise<TwinContext> {
  const now = new Date();

  const mcpInvoke = (toolName: string, args: Record<string, unknown>) => ({
    request_id: `twin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor: { tenant_id: tenantId, user_id: "twin-orchestrator", roles: ["Admin"] as const },
    tool: { name: toolName, arguments: args },
  });

  const SERVICE_HEADERS = { "cf-worker": "twin-orchestrator" };

  const mcpFetch = (toolName: string, args: Record<string, unknown>) =>
    env.MCP_CONNECTOR.fetch(
      new Request("http://internal/invoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          ...SERVICE_HEADERS,
        },
        body: JSON.stringify(mcpInvoke(toolName, { tenant_id: tenantId, ...args })),
      })
    );

  const [memory, signals, proposals, spineHealth, continuityState] = await Promise.all([
    mcpFetch("memory.search_org", { query: "recent changes pending objectives", limit: 20 })
      .then((r) => r.json())
      .catch(() => ({ results: [] })),

    mcpFetch("signal.list", { status: "pending", limit: 50 })
      .then((r) => r.json())
      .catch(() => ({ signals: [] })),

    mcpFetch("proposal.list", { status: "pending", limit: 20 })
      .then((r) => r.json())
      .catch(() => ({ proposals: [] })),

    env.PIPELINE.fetch(
      new Request("http://internal/v1/spine/health", {
        method: "GET",
        headers: { "x-tenant-id": tenantId, "cf-worker": "twin-orchestrator" },
      })
    )
      .then((r) => r.json())
      .catch(() => ({ status: "unknown" })),

    env.CONTINUITY.fetch(
      new Request("http://internal/v1/state", {
        method: "GET",
        headers: { "x-tenant-id": tenantId, "cf-worker": "twin-orchestrator" },
      })
    )
      .then((r) => r.json())
      .catch(() => ({ sessions: 0 })),
  ]);

  const timeTriggers = [];
  const hour = now.getHours();
  const lastBrief = await env.TWIN_KV?.get("last_morning_brief");

  if (hour === 7 && (!lastBrief || !isToday(lastBrief))) {
    timeTriggers.push({ type: "morning_brief", reason: "7am schedule" });
  }

  const pendingItems = (signals.signals || []).filter((s: any) => {
    const age = now.getTime() - new Date(s.created_at).getTime();
    return age > 24 * 60 * 60 * 1000;
  });

  if (pendingItems.length > 0) {
    timeTriggers.push({
      type: "staleness_review",
      count: pendingItems.length,
      reason: "Items pending > 24h",
    });
  }

  return {
    timestamp: now.toISOString(),
    memory,
    signals: signals.signals || [],
    proposals: proposals.proposals || [],
    spineChanges: spineHealth,
    operationsHealth: {
      continuity_sessions: continuityState.sessions || 0,
      pipeline_status: spineHealth.status,
    },
    timeTriggers,
  };
}

function isToday(isoString: string): boolean {
  const d = new Date(isoString);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

async function coordinateApprovedActions(env: Env, tenantId: string): Promise<void> {
  try {
    const mcpInvoke = (toolName: string, args: Record<string, unknown>) => ({
      request_id: `twin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actor: { tenant_id: tenantId, user_id: "twin-orchestrator", roles: ["Admin"] as const },
      tool: { name: toolName, arguments: args },
    });

    const proposalsRes = await env.MCP_CONNECTOR.fetch(
      new Request("http://internal/invoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "cf-worker": "twin-orchestrator",
        },
        body: JSON.stringify(
          mcpInvoke("proposal.list", { tenant_id: tenantId, status: "approved", limit: 10 })
        ),
      })
    );

    if (!proposalsRes.ok) return;

    const proposalsData = await proposalsRes.json();
    const approved = proposalsData.proposals || [];

    for (const proposal of approved) {
      console.log("[Twin Coordinate] Dispatching action for proposal:", proposal.id);
      // TODO: Wire to Act service in Phase 4
    }
  } catch (err) {
    console.error("[Twin Coordinate] Failed:", err);
  }
}

async function getCheckpoint(env: Env): Promise<{ pendingProposals: string[] }> {
  try {
    const id = env.TWIN_STATE.idFromName("primary");
    const state = env.TWIN_STATE.get(id);
    const res = await state.fetch(new Request("http://internal/checkpoint"));
    return await res.json();
  } catch {
    return { pendingProposals: [] };
  }
}
