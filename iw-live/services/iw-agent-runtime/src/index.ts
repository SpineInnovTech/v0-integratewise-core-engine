import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { TwinAgent } from "./twin-agent";
import { TenantBrainDO } from "./tenant-brain-do";

console.log("[Runtime Worker] Loading index.ts...");

// Export Durable Object classes for Cloudflare registration
export { TwinAgent, TenantBrainDO };

const app = new Hono<{ Bindings: Env; Variables: { tenantId: string; userId: string } }>();

app.use("*", cors());

// ============================================================================
// Authentication & Verification Middleware (Tenant Isolation)
// ============================================================================

app.use("*", async (c, next) => {
  const path = c.req.path;
  console.log("[Runtime Middleware] Path:", path, "method:", c.req.method);
  if (path === "/health" || path === "/") {
    return await next();
  }

  // 1. Enforce presence of x-tenant-id header
  const tenantId = c.req.header("x-tenant-id");
  if (!tenantId) {
    return c.json({ error: "Unauthorized: Missing x-tenant-id header" }, 400);
  }

  c.set("tenantId", tenantId);

  // 2. Validate token or signature (JWT / HMAC / X-IW-Agent-Key)
  const authHeader = c.req.header("Authorization");
  const agentKey = c.req.header("X-IW-Agent-Key");

  // SECURITY: JWT_SECRET is REQUIRED. No fallback auth path.
  if (!c.env.JWT_SECRET) {
    console.error("[Runtime Auth] CRITICAL: JWT_SECRET is not configured. Rejecting request.");
    return c.json({ error: "Server misconfiguration: authentication unavailable" }, 503);
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid Authorization header" }, 401);
  }
  const token = authHeader.split(" ")[1];
  const isValid = await verifySignature(token, c.env.JWT_SECRET);
  if (!isValid) {
    return c.json({ error: "Unauthorized: Signature validation failed" }, 401);
  }

  // Decode and verify tenant_id claim in JWT matches path/header tenantId
  try {
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    const jwtTenant = payload.tenantId || payload.tenant_id;
    if (jwtTenant && jwtTenant !== tenantId) {
      return c.json({ error: "Unauthorized: Tenant ID mismatch in JWT" }, 403);
    }
  } catch {
    return c.json({ error: "Unauthorized: Invalid JWT payload structure" }, 401);
  }

  await next();
});

// Helper: HMAC SHA-256 signature verification for JWT/Simple tokens
async function verifySignature(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false; // Not a JWT

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signature = byteDecode(signatureB64.replace(/-/g, "+").replace(/_/g, "/"));
    return await crypto.subtle.verify("HMAC", cryptoKey, signature as any, data);
  } catch {
    return false;
  }
}

function byteDecode(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ============================================================================
// HEALTH CHECK (Startup Connectivity Verification)
// ============================================================================

app.get("/health", async (c) => {
  const status: Record<string, string> = {
    service: "iw-agent-runtime",
    status: "ok",
    environment: c.env.ENVIRONMENT || "development",
    note: "Twin runtime is 100% Cloudflare-native (D1/KV/AI/DO/service bindings). No Hostinger VPS.",
  };

  const services = [
    { name: "INTELLIGENCE", binding: c.env.INTELLIGENCE },
    { name: "PIPELINE", binding: c.env.PIPELINE },
    { name: "CONTINUITY", binding: c.env.CONTINUITY },
    { name: "CONNECTOR", binding: c.env.CONNECTOR },
    { name: "KNOWLEDGE", binding: c.env.KNOWLEDGE },
  ];

  const checkPromises = services.map(async (s) => {
    if (!s.binding) {
      status[s.name] = "missing_binding";
      return;
    }
    try {
      const res = await s.binding.fetch(new Request("http://internal/health")).catch(() => null);
      status[s.name] = res && res.ok ? "connected" : "degraded";
    } catch {
      status[s.name] = "unreachable";
    }
  });

  await Promise.all(checkPromises);

  // Check database connections
  status["D1"] = c.env.D1 ? "available" : "missing";
  status["CACHE"] = c.env.CACHE ? "available" : "missing";

  const isDegraded = Object.values(status).some(
    (v) => v === "degraded" || v === "unreachable" || v === "missing_binding"
  );

  return c.json(status, isDegraded ? 503 : 200);
});

app.get("/", (c) => {
  return c.json({
    service: "iw-agent-runtime",
    role: "user-facing-twin-agent-runtime",
    version: "1.0.0",
    docs: "/health",
  });
});

// ============================================================================
// TenantBrainDO Routes (/do/brain/:tenant_id/*)
// ============================================================================

app.all("/do/brain/:tenant_id/*", async (c) => {
  const jwtTenant = c.get("tenantId");
  const pathTenant = c.req.param("tenant_id");

  if (jwtTenant !== pathTenant) {
    return c.json({ error: "Tenant mismatch" }, 403);
  }

  const id = c.env.TENANT_BRAIN.idFromName(pathTenant);
  const brain = c.env.TENANT_BRAIN.get(id);

  // Rewrite request URL to strip the prefix for DO local routing if needed,
  // or pass directly so the DO can parse it
  return await brain.fetch(c.req.raw);
});

// ============================================================================
// TwinAgent Dynamic Routes (/v1/twin/:userId/*)
// ============================================================================

// 1. Post Chat (Streams SSE by calling DO stub 'chat' method)
app.post("/v1/twin/:userId/chat", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("userId");
  console.log("[Runtime Chat Router] Invoked for user:", userId, "tenant:", tenantId);
  let params: any;
  try {
    params = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const id = c.env.TWIN_AGENT.idFromName(`${tenantId}_${userId}`);
  const twin = c.env.TWIN_AGENT.get(id) as any;

  // Initialize twin state
  await twin.initTwin(userId, tenantId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "status", message: "Connecting to Twin..." });
        send({ type: "status", message: "Retrieving context..." });

        const result: any = await twin.chat({
          message: params.message,
          session_id: params.session_id,
          use_knowledge: params.use_knowledge,
        });

        if (result.hasContext) {
          send({
            type: "context",
            entity: { name: params.entity_id || "Customer Zero", type: "Account" },
          });
        }

        // Stream the text reply in chunks to frontend for smooth visual typing effect
        const reply = result.reply;
        const chunkSize = 15;
        for (let i = 0; i < reply.length; i += chunkSize) {
          send({
            type: "twin_chunk",
            content: reply.slice(i, i + chunkSize),
          });
          await new Promise((resolve) => setTimeout(resolve, 8));
        }

        send({
          type: "twin_complete",
          entity: { name: params.entity_id || "Customer Zero", type: "Account" },
        });

        send({ type: "done" });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: any) {
        console.error("[Twin HTTP Chat Stream Error]:", err.message);
        send({ type: "error", message: err.message || "Twin processing error" });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

// 2. GET Proactive suggestions (Forward to Intelligence service)
app.get("/v1/twin/:userId/proactive", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("userId");
  const url = new URL(c.req.url);

  const forwardUrl = new URL(`/v1/twin/proactive${url.search}`, "http://internal");
  const forwardReq = new Request(forwardUrl.toString(), {
    method: "GET",
    headers: {
      ...c.req.header(),
      "x-tenant-id": tenantId,
      "x-user-id": userId,
    },
  });

  return await c.env.INTELLIGENCE.fetch(forwardReq);
});

// 3. GET Memories (Forward to Intelligence service)
app.get("/v1/twin/:userId/memories", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("userId");
  const url = new URL(c.req.url);

  const forwardUrl = new URL(`/v1/twin/memories${url.search}`, "http://internal");
  const forwardReq = new Request(forwardUrl.toString(), {
    method: "GET",
    headers: {
      ...c.req.header(),
      "x-tenant-id": tenantId,
      "x-user-id": userId,
    },
  });

  return await c.env.INTELLIGENCE.fetch(forwardReq);
});

// 4. POST Act (Forward to Intelligence service)
app.post("/v1/twin/:userId/act", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("userId");

  const forwardUrl = new URL("/v1/twin/act", "http://internal");
  const forwardReq = new Request(forwardUrl.toString(), {
    method: "POST",
    headers: {
      ...c.req.header(),
      "x-tenant-id": tenantId,
      "x-user-id": userId,
      "Content-Type": "application/json",
    },
    body: await c.req.blob(),
  });

  return await c.env.INTELLIGENCE.fetch(forwardReq);
});

// 5. GET Config (Forward to Intelligence service)
app.get("/v1/twin/:userId/config", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("userId");
  const url = new URL(c.req.url);

  const forwardUrl = new URL(`/v1/twin/config${url.search}`, "http://internal");
  const forwardReq = new Request(forwardUrl.toString(), {
    method: "GET",
    headers: {
      ...c.req.header(),
      "x-tenant-id": tenantId,
      "x-user-id": userId,
    },
  });

  return await c.env.INTELLIGENCE.fetch(forwardReq);
});

// 6. POST Config (Forward to Intelligence service)
app.post("/v1/twin/:userId/config", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("userId");

  const forwardUrl = new URL("/v1/twin/config", "http://internal");
  const forwardReq = new Request(forwardUrl.toString(), {
    method: "POST",
    headers: {
      ...c.req.header(),
      "x-tenant-id": tenantId,
      "x-user-id": userId,
      "Content-Type": "application/json",
    },
    body: await c.req.blob(),
  });

  return await c.env.INTELLIGENCE.fetch(forwardReq);
});

// 7. GET State (Direct DO stub call)
app.get("/v1/twin/:userId/state", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("userId");

  const id = c.env.TWIN_AGENT.idFromName(`${tenantId}_${userId}`);
  const twin = c.env.TWIN_AGENT.get(id) as any;

  await twin.initTwin(userId, tenantId);
  const state = await twin.getState();

  return c.json(state);
});

// 8. GET Learned Profile (Direct DO stub call)
app.get("/v1/twin/:userId/profile", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("userId");

  const id = c.env.TWIN_AGENT.idFromName(`${tenantId}_${userId}`);
  const twin = c.env.TWIN_AGENT.get(id) as any;

  await twin.initTwin(userId, tenantId);
  const profile = await twin.getLearnedProfile();

  return c.json(profile);
});

// Handoff / Execution Package endpoints (first-class artifact)
app.post("/v1/twin/:userId/handoff/generate", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("userId");
  const body = await c.req.json().catch(() => ({}));

  const id = c.env.TWIN_AGENT.idFromName(`${tenantId}_${userId}`);
  const twin = c.env.TWIN_AGENT.get(id) as any;

  await twin.initTwin(userId, tenantId);
  const pkg = await twin.generateExecutionHandoff(body);

  return c.json(pkg);
});

app.get("/v1/twin/:userId/handoffs", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("userId");

  const id = c.env.TWIN_AGENT.idFromName(`${tenantId}_${userId}`);
  const twin = c.env.TWIN_AGENT.get(id) as any;

  await twin.initTwin(userId, tenantId);
  const handoffs = await twin.listHandoffs();

  return c.json({ handoffs });
});

// Execution Packages list (for L5/L6 CZ pickup from D1)
app.get("/v1/execution-packages", async (c) => {
  const tenantId = c.get("tenantId") || c.req.header("x-tenant-id");
  if (!tenantId) return c.json({ error: "Missing tenant" }, 400);
  if (!c.env.D1) return c.json({ packages: [] });
  const rows = await c.env.D1.prepare(
    `SELECT * FROM execution_packages WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 20`
  )
    .bind(tenantId)
    .all();
  return c.json({ packages: rows.results || [] });
});

// Pickup / complete a handoff package (used by CZ L5/L6)
app.post("/v1/execution-packages/:id/complete", async (c) => {
  const tenantId = c.get("tenantId") || c.req.header("x-tenant-id");
  const id = c.req.param("id");
  if (!tenantId || !id) return c.json({ error: "Missing tenant or id" }, 400);
  if (!c.env.D1) return c.json({ success: false });

  const now = new Date().toISOString();
  try {
    await c.env.D1.prepare(
      `UPDATE execution_packages SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`
    )
      .bind(now, now, id, tenantId)
      .run();

    // Memory writeback with structured logging + retry + DLQ (Phase 4 hardening)
    const memoryId = `outcome:${id}:${Date.now()}`;
    const memoryContent = JSON.stringify({
      type: "handoff_completed",
      packageId: id,
      completedAt: now,
    });
    const userId = c.get("userId") || "cz";

    let memoryWriteSuccess = false;
    let lastError: string | null = null;
    const maxRetries = 3;
    const backoffBase = 200; // ms

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await c.env.D1.prepare(
          `INSERT INTO conversational_memory (id, tenant_id, user_id, role, content, created_at)
           VALUES (?, ?, ?, 'system', ?, ?)`
        )
          .bind(memoryId, tenantId, userId, memoryContent, now)
          .run();
        memoryWriteSuccess = true;

        // Structured log: success
        console.log(
          JSON.stringify({
            event: "memory_writeback",
            status: "success",
            handoff_id: id,
            memory_id: memoryId,
            tenant_id: tenantId,
            attempt: attempt + 1,
            timestamp: now,
          })
        );
        break;
      } catch (err: any) {
        lastError = err.message || String(err);

        // Structured log: retry
        console.warn(
          JSON.stringify({
            event: "memory_writeback",
            status: "retry",
            handoff_id: id,
            memory_id: memoryId,
            tenant_id: tenantId,
            attempt: attempt + 1,
            error: lastError,
            next_backoff_ms: backoffBase * Math.pow(2, attempt),
            timestamp: new Date().toISOString(),
          })
        );

        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, backoffBase * Math.pow(2, attempt)));
        }
      }
    }

    // DLQ: if all retries exhausted, push to dead letter for later replay
    if (!memoryWriteSuccess) {
      console.error(
        JSON.stringify({
          event: "memory_writeback",
          status: "dlq",
          handoff_id: id,
          memory_id: memoryId,
          tenant_id: tenantId,
          error: lastError,
          retries_exhausted: maxRetries,
          timestamp: new Date().toISOString(),
        })
      );

      // Write to DLQ table (best-effort)
      try {
        await c.env.D1.prepare(
          `INSERT OR IGNORE INTO memory_writeback_dlq (id, tenant_id, handoff_id, payload, error, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(memoryId, tenantId, id, memoryContent, lastError, new Date().toISOString())
          .run();
      } catch {
        // DLQ write failed — already logged above
      }

      // Return 200 for the handoff completion (it succeeded) but flag memory failure
      return c.json({ success: true, id, status: "completed", memory_write: "failed_dlq" });
    }

    return c.json({ success: true, id, status: "completed" });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

app.all("/v1/twin/:userId/*", async (c) => {
  const tenantId = c.get("tenantId");
  const userId = c.req.param("userId");

  // Route deterministically using a composite key of tenant + user
  const id = c.env.TWIN_AGENT.idFromName(`${tenantId}_${userId}`);
  const twin = c.env.TWIN_AGENT.get(id);

  return await twin.fetch(c.req.raw);
});

export default app;
