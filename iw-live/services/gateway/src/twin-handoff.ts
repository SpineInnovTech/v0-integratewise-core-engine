/**
 * Twin Handoff Endpoint — POST /v1/twin/handoff
 *
 * Creates a secure Twin launch session:
 * 1. Validates authenticated user (already enriched by gateway auth)
 * 2. Resolves user profile, tenant, role, department, awareness
 * 3. Creates D1 twin_sessions row
 * 4. Generates one-time launch JWT (60s TTL)
 * 5. Stores context/session in KV
 * 6. Returns twinUrl + sessionId + contextKey + expiresAt
 * 7. Writes audit event
 *
 * DECISION 22: returns the in-app NATIVE Twin route (app.integratewise.ai/work/twin).
 * OWUI-free — no external Twin host. The native surface authenticates via the user's
 * existing gateway session and resolves context by `ctx` key.
 */

import { isCustomerZeroTenant } from "@integratewise/types";
import { signJWT } from "./lib/jwt";
import type { Env } from "./index";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TwinHandoffRequest {
  source: "l1" | "l2" | "l4" | "sidebar" | "command";
  domain: string;
  entityId?: string;
  entityType?: string;
  entityName?: string;
  insightId?: string;
  insightTitle?: string;
  prompt?: string;
  returnUrl?: string;
}

interface TwinLaunchSession {
  sessionId: string;
  contextKey: string;
  userId: string;
  email: string;
  tenantId: string;
  role: string;
  department: string;
  groups: string[];
  source: string;
  domain: string;
  entityId?: string;
  entityType?: string;
  entityName?: string;
  insightId?: string;
  insightTitle?: string;
  prompt?: string;
  createdAt: string;
  expiresAt: string;
  status: "created" | "opened" | "expired" | "revoked";
}

interface HandoffResponse {
  success: boolean;
  twinUrl: string;
  sessionId: string;
  contextKey: string;
  expiresAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

// Native in-app Twin surface (DECISION 22 — no external OWUI host).
const TWIN_APP_URL = "https://app.integratewise.ai";
const TWIN_ROUTE = "/work/twin";
const LAUNCH_JWT_TTL_SECONDS = 120; // 2 minutes
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours
const CONTEXT_TTL_SECONDS = 60 * 60; // 1 hour

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex}`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function handleTwinHandoff(request: Request, env: Env): Promise<Response> {
  // Extract enriched auth context (set by gateway auth middleware)
  const userId = request.headers.get("x-user-id") || "";
  const email = request.headers.get("x-user-email") || "";
  const tenantId = request.headers.get("x-tenant-id") || "";
  const role = request.headers.get("x-user-role") || "member";

  if (!userId || !tenantId) {
    return json({ error: "Missing user or tenant context" }, 400);
  }

  // Parse request body
  let body: TwinHandoffRequest;
  try {
    body = (await request.json()) as TwinHandoffRequest;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { source, domain, entityId, entityType, entityName, insightId, insightTitle, prompt } =
    body;

  if (!domain) {
    return json({ error: "Missing required field: domain" }, 400);
  }

  // Customer Zero always has Twin entitlement (enterprise dogfood tenant)
  if (!isCustomerZeroTenant(tenantId)) {
    try {
      const tenantRow = await env.DB.prepare(`SELECT plan FROM tenants WHERE id = ?`)
        .bind(tenantId)
        .first<{ plan: string }>();
      const plan = tenantRow?.plan || "free";
      if (plan === "free") {
        return json(
          { error: "Twin not available on free plan. Upgrade to access L3 Twin Workbench." },
          403
        );
      }
    } catch {
      /* proceed if plan lookup fails */
    }
  }

  // ─── Resolve user profile from D1 ───────────────────────────────────────

  let department = "bizops";
  let groups: string[] = [];

  try {
    const userRow = await env.DB.prepare(
      `SELECT department, role, plan, status FROM tenant_users WHERE tenant_id = ? AND (id = ? OR email = ?) LIMIT 1`
    )
      .bind(tenantId, userId, email)
      .first<{ department: string; role: string; plan: string; status: string }>();

    if (userRow) {
      if (userRow.status === "disabled") {
        return json({ error: "User is disabled. Twin access denied." }, 403);
      }
      department = userRow.department || department;
      groups = [userRow.role, userRow.department, "all-employees"].filter(Boolean);
    } else {
      // User not in tenant_users yet — use gateway-resolved role
      groups = [role, "all-employees"];
    }
  } catch {
    // D1 query failed — proceed with defaults from gateway headers
    groups = [role, "all-employees"];
  }

  // ─── Create session + context ───────────────────────────────────────────

  const sessionId = generateId("tws");
  const contextKey = generateId("ctx");
  const jti = generateId("jti");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

  const session: TwinLaunchSession = {
    sessionId,
    contextKey,
    userId,
    email,
    tenantId,
    role,
    department,
    groups,
    source: source || "l1",
    domain,
    entityId,
    entityType,
    entityName,
    insightId,
    insightTitle,
    prompt,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "created",
  };

  // ─── Write to D1 twin_sessions ──────────────────────────────────────────

  try {
    await env.DB.prepare(
      `INSERT INTO twin_sessions (id, tenant_id, user_id, email, context_key, source, domain, entity_id, entity_type, entity_name, insight_id, insight_title, status, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', ?, ?)`
    )
      .bind(
        sessionId,
        tenantId,
        userId,
        email,
        contextKey,
        source || "l1",
        domain,
        entityId || null,
        entityType || null,
        entityName || null,
        insightId || null,
        insightTitle || null,
        now.toISOString(),
        expiresAt.toISOString()
      )
      .run();
  } catch (err) {
    // If table doesn't exist yet, proceed without D1 (graceful degradation)
    console.error("[twin-handoff] D1 write failed:", err);
  }

  // ─── Store in KV for fast lookup ────────────────────────────────────────

  try {
    await env.SESSIONS.put(`twin:session:${sessionId}`, JSON.stringify(session), {
      expirationTtl: SESSION_TTL_SECONDS,
    });

    await env.SESSIONS.put(
      `twin:context:${contextKey}`,
      JSON.stringify({
        sessionId,
        tenantId,
        userId,
        email,
        role,
        department,
        domain,
        entityId,
        entityType,
        entityName,
        insightId,
        insightTitle,
        prompt,
      }),
      { expirationTtl: CONTEXT_TTL_SECONDS }
    );

    // Store JTI for one-time-use validation
    await env.SESSIONS.put(`twin:jti:${jti}`, "1", {
      expirationTtl: LAUNCH_JWT_TTL_SECONDS + 30, // small buffer
    });
  } catch (err) {
    console.error("[twin-handoff] KV write failed:", err);
  }

  // ─── Generate one-time launch JWT ───────────────────────────────────────

  const launchJwt = await signJWT(
    {
      iss: "https://gateway.dev.integratewise.ai",
      aud: "https://app.integratewise.ai",
      sub: userId,
      tenant_id: tenantId,
      role,
      scope: "twin:launch",
      exp: Math.floor(Date.now() / 1000) + LAUNCH_JWT_TTL_SECONDS,
      // Custom claims
      context_key: contextKey,
      continuity_session_id: sessionId,
      department,
      jti,
    },
    env.OAUTH_PRIVATE_KEY
  );

  // ─── Build Twin URL ─────────────────────────────────────────────────────

  const twinUrl = new URL(TWIN_ROUTE, TWIN_APP_URL);
  twinUrl.searchParams.set("token", launchJwt);
  twinUrl.searchParams.set("session", sessionId);
  twinUrl.searchParams.set("ctx", contextKey);

  // ─── Write audit event ──────────────────────────────────────────────────

  try {
    await env.DB.prepare(
      `INSERT INTO twin_audit_events (id, tenant_id, user_id, session_id, event_type, payload, created_at)
       VALUES (?, ?, ?, ?, 'handoff_created', ?, ?)`
    )
      .bind(
        generateId("evt"),
        tenantId,
        userId,
        sessionId,
        JSON.stringify({ source, domain, entityId, entityType, insightTitle }),
        now.toISOString()
      )
      .run();
  } catch {
    // Audit write failure is non-critical
  }

  // ─── Return ─────────────────────────────────────────────────────────────

  const response: HandoffResponse = {
    success: true,
    twinUrl: twinUrl.toString(),
    sessionId,
    contextKey,
    expiresAt: expiresAt.toISOString(),
  };

  return json(response, 200);
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
