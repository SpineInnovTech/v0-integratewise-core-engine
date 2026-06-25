/**
 * Projection Endpoints — Gateway Assembles, Frontend Consumes
 *
 * Each projection endpoint queries multiple downstream services in PARALLEL
 * and returns a single pre-assembled response. The frontend calls ONE endpoint
 * per view, never multiple raw service endpoints.
 *
 * Pattern: Gateway → Promise.all(service queries) → assembled projection → frontend
 *
 * This is the PROJECTION LAYER between Spine/Memory/Signals and the UI stores.
 */

import type { Env } from "./index";

/**
 * Route /api/v1/projections/* requests to the appropriate projection handler.
 */
export async function routeProjectionRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/v1/projections", "");
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    return json({ error: "Missing tenant ID" }, 401);
  }

  // Route to specific projection handlers
  if (path === "/morning-context" || path === "/morning-context/") {
    return handleMorningContext(request, env, tenantId, userId);
  }

  if (path.startsWith("/entity360/")) {
    const entityId = path.replace("/entity360/", "").replace(/\/$/, "");
    return handleEntity360(request, env, tenantId, entityId);
  }

  if (path === "/governance/board" || path === "/governance/board/") {
    return handleGovernanceBoard(request, env, tenantId);
  }

  if (path === "/inbox" || path === "/inbox/") {
    return handleInbox(request, env, tenantId, userId);
  }

  return json({ error: "Unknown projection" }, 404);
}

// ============================================================================
// MORNING CONTEXT — /api/v1/projections/morning-context
// Used by: /desk (the morning briefing)
// ============================================================================

async function handleMorningContext(
  request: Request,
  env: Env,
  tenantId: string,
  userId: string | null
): Promise<Response> {
  const headers = buildHeaders(request, tenantId, userId);

  // Parallel fetch from multiple services
  const [signalsRes, proposalsRes] = await Promise.allSettled([
    // Signals from Intelligence service
    fetchService(env.INTELLIGENCE, "/v1/signals", headers, {
      severity: "critical,high",
      limit: "10",
    }),
    // Pending proposals from Intelligence service
    fetchService(env.INTELLIGENCE, "/v1/proposals", headers, {
      status: "pending",
      limit: "5",
    }),
  ]);

  const signals = resolveResult(signalsRes, []);
  const proposals = resolveResult(proposalsRes, []);

  // Assemble the morning context projection
  const morningContext = {
    signals: Array.isArray(signals) ? signals.slice(0, 10) : (signals as any)?.signals || [],
    agenda: [], // TODO: Wire to calendar connector when available
    commitments: [], // TODO: Wire to D1 commitments table
    renewals: extractRenewals(signals),
    proposalsPending: Array.isArray(proposals) ? proposals.length : (proposals as any)?.total || 0,
    proposalsPreview: Array.isArray(proposals)
      ? proposals.slice(0, 3)
      : (proposals as any)?.proposals?.slice(0, 3) || [],
    generatedAt: new Date().toISOString(),
  };

  return json(morningContext);
}

// ============================================================================
// ENTITY 360 — /api/v1/projections/entity360/:entityId
// Used by: /entity360/:id (the cognitive assembly point)
// ============================================================================

async function handleEntity360(
  request: Request,
  env: Env,
  tenantId: string,
  entityId: string
): Promise<Response> {
  if (!entityId) {
    return json({ error: "Missing entity ID" }, 400);
  }

  const headers = buildHeaders(request, tenantId);

  // Parallel fetch: Spine (Pipeline) + Signals (Intelligence) + Memory (Knowledge)
  const [spineRes, signalsRes, memoryRes] = await Promise.allSettled([
    // Spine data from Pipeline service (D1)
    fetchService(env.PIPELINE, `/v1/spine/entities/${entityId}`, headers),
    // Signals for this entity from Intelligence
    fetchService(env.INTELLIGENCE, "/v1/signals", headers, {
      entity_id: entityId,
      limit: "20",
    }),
    // Memory context from Knowledge (Vectorize query)
    fetchService(env.KNOWLEDGE, "/v1/memory/search", headers, {
      entity_id: entityId,
      limit: "10",
    }),
  ]);

  const spine = resolveResult(spineRes, null);
  const signals = resolveResult(signalsRes, []);
  const memory = resolveResult(memoryRes, []);

  // Assemble Entity 360 projection
  const entity360 = {
    spine: spine || { id: entityId, status: "not_found" },
    memory: Array.isArray(memory) ? memory : (memory as any)?.results || [],
    signals: Array.isArray(signals) ? signals : (signals as any)?.signals || [],
    twinInsight: null, // TODO: Twin generates insight on assembly (async, cached)
    assembledAt: new Date().toISOString(),
  };

  return json(entity360);
}

// ============================================================================
// GOVERNANCE BOARD — /api/v1/projections/governance/board
// Used by: /governance (the collaboration workbench)
// ============================================================================

async function handleGovernanceBoard(
  request: Request,
  env: Env,
  tenantId: string
): Promise<Response> {
  const headers = buildHeaders(request, tenantId);

  const [tasksRes, proposalsRes, decisionsRes] = await Promise.allSettled([
    // Tasks from BFF/Workflow service
    fetchService(env.BFF, "/v1/tasks", headers, { limit: "50" }),
    // Proposals from Intelligence
    fetchService(env.INTELLIGENCE, "/v1/proposals", headers, { limit: "20" }),
    // Recent decisions from Knowledge (org_memory where category=decision)
    fetchService(env.KNOWLEDGE, "/v1/memory/org", headers, {
      category: "decision",
      limit: "10",
    }),
  ]);

  const tasks = resolveResult(tasksRes, []);
  const proposals = resolveResult(proposalsRes, []);
  const decisions = resolveResult(decisionsRes, []);

  const board = {
    tasks: Array.isArray(tasks) ? tasks : (tasks as any)?.tasks || [],
    proposals: Array.isArray(proposals) ? proposals : (proposals as any)?.proposals || [],
    decisionsRecent: Array.isArray(decisions) ? decisions : (decisions as any)?.results || [],
    promotionsPending: [], // TODO: Wire to memory.propose queue reads
    generatedAt: new Date().toISOString(),
  };

  return json(board);
}

// ============================================================================
// INBOX — /api/v1/projections/inbox
// Used by: /inbox (unified queue)
// ============================================================================

async function handleInbox(
  request: Request,
  env: Env,
  tenantId: string,
  userId: string | null
): Promise<Response> {
  const headers = buildHeaders(request, tenantId, userId);

  const [signalsRes, proposalsRes] = await Promise.allSettled([
    fetchService(env.INTELLIGENCE, "/v1/signals", headers, {
      limit: "20",
      severity: "critical,high,medium",
    }),
    fetchService(env.INTELLIGENCE, "/v1/proposals", headers, {
      status: "pending",
      limit: "10",
    }),
  ]);

  const signals = resolveResult(signalsRes, []);
  const proposals = resolveResult(proposalsRes, []);

  // Unify into a single sorted feed
  const signalItems = (Array.isArray(signals) ? signals : (signals as any)?.signals || []).map(
    (s: any) => ({ ...s, _type: "signal", _sortDate: s.createdAt || s.created_at })
  );
  const proposalItems = (
    Array.isArray(proposals) ? proposals : (proposals as any)?.proposals || []
  ).map((p: any) => ({ ...p, _type: "proposal", _sortDate: p.createdAt || p.created_at }));

  const items = [...signalItems, ...proposalItems].sort(
    (a, b) => new Date(b._sortDate || 0).getTime() - new Date(a._sortDate || 0).getTime()
  );

  return json({ items, total: items.length, generatedAt: new Date().toISOString() });
}

// ============================================================================
// HELPERS
// ============================================================================

function buildHeaders(
  request: Request,
  tenantId: string,
  userId?: string | null
): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": tenantId,
  };
  if (userId) h["x-user-id"] = userId;
  const correlationId = request.headers.get("x-correlation-id") || crypto.randomUUID();
  h["x-correlation-id"] = correlationId;
  return h;
}

async function fetchService(
  fetcher: Fetcher,
  path: string,
  headers: Record<string, string>,
  params?: Record<string, string>
): Promise<any> {
  let url = `http://internal${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }
  const res = await fetcher.fetch(url, { headers });
  if (!res.ok) {
    console.warn(`[projections] ${path} returned ${res.status}`);
    return null;
  }
  return res.json();
}

function resolveResult(result: PromiseSettledResult<any>, fallback: any): any {
  if (result.status === "fulfilled" && result.value !== null) {
    return result.value;
  }
  if (result.status === "rejected") {
    console.warn(`[projections] Service call failed:`, result.reason?.message || result.reason);
  }
  return fallback;
}

function extractRenewals(signals: any): any[] {
  const signalList = Array.isArray(signals) ? signals : (signals as any)?.signals || [];
  return signalList
    .filter((s: any) => s.type === "renewal_approaching")
    .map((s: any) => ({
      entityId: s.entityId || s.entity_id,
      entityName: s.entityName || s.entity_name,
      renewalDate: s.data?.renewal_date || s.metadata?.renewal_date,
      daysRemaining: s.data?.days_remaining || s.metadata?.days_remaining,
      healthScore: s.data?.health_score || s.metadata?.health_score,
      arr: s.data?.arr || s.metadata?.arr,
    }));
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
