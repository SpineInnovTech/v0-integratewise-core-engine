import type { Env, TwinContext } from "./types";

// MCP tool invocation envelope
function mcpInvoke(tenantId: string, toolName: string, args: Record<string, unknown>) {
  return {
    request_id: `twin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor: {
      tenant_id: tenantId,
      user_id: "twin-orchestrator",
      roles: ["Admin"] as const,
    },
    tool: {
      name: toolName,
      arguments: args,
    },
  };
}

// Service binding headers (cf-worker = internal trust assertion)
const SERVICE_HEADERS = {
  "cf-worker": "twin-orchestrator",
};

export async function buildTwinContext(env: Env, tenantId?: string): Promise<TwinContext> {
  const now = new Date();
  const tid = tenantId || "iw-customer-zero";

  // Parallel queries to infrastructure (Twin only reads)
  const [memory, signals, proposals, spineHealth, continuityState] = await Promise.all([
    // Query MCP: org memory search via /invoke
    env.MCP_CONNECTOR.fetch(
      new Request("http://internal/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tid, ...SERVICE_HEADERS },
        body: JSON.stringify(mcpInvoke(tid, "memory.search_org", { tenant_id: tid, limit: 20 })),
      })
    )
      .then((r) => r.json())
      .catch(() => ({ results: [] })),

    // Query MCP: pending signals via /invoke
    env.MCP_CONNECTOR.fetch(
      new Request("http://internal/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tid, ...SERVICE_HEADERS },
        body: JSON.stringify(
          mcpInvoke(tid, "spine.list_signals", { tenant_id: tid, status: "pending", limit: 50 })
        ),
      })
    )
      .then((r) => r.json())
      .catch(() => ({ signals: [] })),

    // Query MCP: active proposals via /invoke
    env.MCP_CONNECTOR.fetch(
      new Request("http://internal/invoke", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tid, ...SERVICE_HEADERS },
        body: JSON.stringify(
          mcpInvoke(tid, "spine.list_proposals", { tenant_id: tid, status: "pending", limit: 20 })
        ),
      })
    )
      .then((r) => r.json())
      .catch(() => ({ proposals: [] })),

    // Query Pipeline: spine health / recent changes
    env.PIPELINE.fetch(
      new Request("http://internal/v1/spine/health", {
        method: "GET",
        headers: { "x-tenant-id": tid, ...SERVICE_HEADERS },
      })
    )
      .then((r) => r.json())
      .catch(() => ({ status: "unknown" })),

    // Query Continuity: session state
    env.CONTINUITY.fetch(
      new Request("http://internal/v1/state", {
        method: "GET",
        headers: { "x-tenant-id": tid, ...SERVICE_HEADERS },
      })
    )
      .then((r) => r.json())
      .catch(() => ({ sessions: 0 })),
  ]);

  // Determine time-based triggers
  const timeTriggers = [];
  const hour = now.getHours();
  const lastBrief = await env.TWIN_KV?.get("last_morning_brief");

  if (hour === 7 && (!lastBrief || !isToday(lastBrief))) {
    timeTriggers.push({ type: "morning_brief", reason: "7am schedule" });
  }

  // Check for stale items (older than 24h)
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
