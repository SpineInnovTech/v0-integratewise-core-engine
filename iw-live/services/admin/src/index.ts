/**
 * Admin Service
 *
 * Full CRUD API for tenant management, user management, system health,
 * and administrative operations for IntegrateWise.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { neon } from "@neondatabase/serverless";

type Bindings = {
  DATABASE_URL: string;
  ENVIRONMENT: string;
  ADMIN_API_KEY?: string;
  JWT_SECRET?: string;
  ZENDESK_SUBDOMAIN?: string;
  ZENDESK_EMAIL?: string;
  ZENDESK_API_TOKEN?: string;
};

type Variables = {
  isAdmin: boolean;
  adminId?: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const PUBLIC_POST_PATHS = new Set([
  "/v1/newsletter/subscribe",
  "/v1/public/newsletter",
  "/v1/contact-submissions",
  "/v1/public/contact",
]);

type ZendeskTicketInput = {
  email?: string | null;
  name?: string | null;
  subject: string;
  description: string;
  priority?: string | null;
  tags?: string[];
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeEmail(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeRequestKind(value: unknown, fallback: string): string {
  const normalized = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
}

function toZendeskTag(value: string): string {
  return value
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function mapZendeskPriority(priority?: string | null): "low" | "normal" | "high" | "urgent" {
  switch (priority) {
    case "critical":
    case "urgent":
      return "urgent";
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "normal";
  }
}

function isGatewayUserSupportRoute(method: string, path: string, hasUserContext: boolean): boolean {
  if (!hasUserContext) return false;

  return (
    (method === "POST" &&
      (path === "/v1/support/tickets" ||
        path === "/v1/support/feedback" ||
        path === "/v1/support/csat" ||
        path === "/v1/support/nps" ||
        path === "/v1/support-tickets")) ||
    (method === "GET" && path === "/v1/support/me")
  );
}

function shouldCreateFeedbackTicket(params: {
  requestKind: string;
  score?: number | null;
  severity?: string | null;
  createTicket?: boolean;
}): boolean {
  if (params.createTicket) return true;

  if (params.requestKind === "bug") {
    return ["high", "critical", "urgent"].includes(params.severity || "");
  }

  if (params.requestKind === "nps") {
    return typeof params.score === "number" && params.score <= 6;
  }

  if (params.requestKind === "csat") {
    return typeof params.score === "number" && params.score <= 2;
  }

  return false;
}

async function createZendeskTicketIfConfigured(
  env: Bindings,
  input: ZendeskTicketInput
): Promise<{
  externalSystem: "zendesk";
  externalTicketId: string | null;
  externalStatus: string;
  syncError: string | null;
}> {
  const subdomain = optionalText(env.ZENDESK_SUBDOMAIN);
  const agentEmail = optionalText(env.ZENDESK_EMAIL);
  const apiToken = optionalText(env.ZENDESK_API_TOKEN);

  if (!subdomain || !agentEmail || !apiToken) {
    return {
      externalSystem: "zendesk",
      externalTicketId: null,
      externalStatus: "pending_config",
      syncError: "Zendesk support integration is not configured",
    };
  }

  try {
    const response = await fetch(`https://${subdomain}.zendesk.com/api/v2/tickets.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${agentEmail}/token:${apiToken}`)}`,
      },
      body: JSON.stringify({
        ticket: {
          subject: input.subject,
          priority: mapZendeskPriority(input.priority),
          tags: input.tags || ["integratewise"],
          requester: input.email
            ? {
                name: input.name || input.email,
                email: input.email,
              }
            : undefined,
          comment: {
            body: input.description,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = (await response.text()).slice(0, 500);
      return {
        externalSystem: "zendesk",
        externalTicketId: null,
        externalStatus: "sync_failed",
        syncError: errorText || `Zendesk request failed (${response.status})`,
      };
    }

    const payload = (await response.json()) as {
      ticket?: { id?: number | string; status?: string };
    };

    return {
      externalSystem: "zendesk",
      externalTicketId: payload.ticket?.id ? String(payload.ticket.id) : null,
      externalStatus: payload.ticket?.status || "created",
      syncError: null,
    };
  } catch (err: any) {
    return {
      externalSystem: "zendesk",
      externalTicketId: null,
      externalStatus: "sync_failed",
      syncError: err?.message || "Failed to create Zendesk ticket",
    };
  }
}

// CORS middleware
app.use("*", cors());

// Admin auth middleware (skips public endpoints)
app.use("/v1/*", async (c, next) => {
  const path = new URL(c.req.url).pathname;
  const method = c.req.method;
  const hasGatewayUserContext = Boolean(c.req.header("x-user-id"));

  if (
    (method === "POST" && PUBLIC_POST_PATHS.has(path)) ||
    isGatewayUserSupportRoute(method, path, hasGatewayUserContext)
  ) {
    await next();
    return;
  }

  const apiKey = c.req.header("x-admin-api-key");
  const authHeader = c.req.header("authorization");
  const adminToken = authHeader?.replace("Bearer ", "");

  // Check API Key first (static key)
  if (c.env.ADMIN_API_KEY && apiKey === c.env.ADMIN_API_KEY) {
    c.set("isAdmin", true);
    c.set("adminId", "system");
    await next();
    return;
  }

  // JWT validation
  if (adminToken) {
    try {
      // Decode JWT (Supabase JWTs are standard JWTs)
      const parts = adminToken.split(".");
      if (parts.length !== 3) {
        return c.json({ error: "Invalid token format" }, 401);
      }

      // Verify JWT signature using HMAC-SHA256
      const jwtSecret = c.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error("JWT_SECRET is not configured");
        return c.json({ error: "Server misconfiguration" }, 500);
      }

      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(jwtSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const signatureInput = encoder.encode(`${parts[0]}.${parts[1]}`);
      const signatureBytes = Uint8Array.from(
        atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0)
      );

      const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, signatureInput);
      if (!valid) {
        return c.json({ error: "Invalid token signature" }, 401);
      }

      // Decode payload (part 1)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));

      // Verify expiry
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return c.json({ error: "Token expired" }, 401);
      }

      // Check admin role (from app_metadata or user_metadata)
      const role = payload.app_metadata?.role || payload.user_metadata?.role || payload.role;
      if (!["admin", "super_admin", "owner"].includes(role)) {
        return c.json({ error: "Insufficient permissions — admin role required" }, 403);
      }

      // Set user context
      c.set("isAdmin", true);
      c.set("adminId", payload.sub);

      await next();
    } catch (err: any) {
      console.error("JWT validation error:", err.message);
      return c.json({ error: "Invalid token" }, 401);
    }
  } else {
    return c.json({ error: "Unauthorized - Admin access required" }, 401);
  }
});

// Health & Status
app.get("/", (c) =>
  c.json({
    service: "Admin Service",
    version: "v1.0",
    status: "operational",
  })
);

app.get("/health", async (c) => {
  const services = {
    admin: "healthy",
    database: "unknown",
    spine: "unknown",
    think: "unknown",
    act: "unknown",
    knowledge: "unknown",
    loader: "unknown",
    normalizer: "unknown",
    gateway: "unknown",
    billing: "unknown",
  };

  // Check database connection
  try {
    const sql = neon(c.env.DATABASE_URL);
    await sql`SELECT 1`;
    services.database = "healthy";
  } catch {
    services.database = "unhealthy";
  }

  const allHealthy = Object.values(services).every((s) => s === "healthy" || s === "unknown");

  return c.json({
    status: allHealthy ? "healthy" : "degraded",
    services,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// TENANT MANAGEMENT
// ============================================================================

/**
 * GET /v1/tenants
 * List all tenants with pagination and filtering
 */
app.get("/v1/tenants", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const limit = Math.min(Math.max(1, parseInt(c.req.query("limit") || "50", 10)), 200);
  const offset = Math.max(0, parseInt(c.req.query("offset") || "0", 10));
  const status = c.req.query("status");
  const plan = c.req.query("plan");
  const search = c.req.query("search");

  try {
    let query = `
      SELECT 
        t.*,
        s.plan as subscription_plan,
        s.status as subscription_status,
        s.current_period_end,
        COUNT(DISTINCT tu.id) as user_count
      FROM tenants t
      LEFT JOIN subscriptions s ON t.id = s.tenant_id AND s.status = 'active'
      LEFT JOIN tenant_users tu ON t.id = tu.tenant_id AND tu.status = 'active'
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status) {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }

    if (plan) {
      query += ` AND (t.plan = $${params.length + 1} OR s.plan = $${params.length + 1})`;
      params.push(plan);
    }

    if (search) {
      query += ` AND (t.name ILIKE $${params.length + 1} OR t.slug ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY t.id, s.id ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const tenants = await sql(query, params);

    // Get total count
    const countResult = await sql`SELECT COUNT(*) as total FROM tenants`;
    const total = countResult[0]?.total || 0;

    return c.json({
      tenants,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (err: any) {
    console.error("Failed to list tenants:", err);
    return c.json({ error: "Failed to list tenants", message: err.message }, 500);
  }
});

/**
 * GET /v1/tenants/:tenantId
 * Get a specific tenant with full details
 */
app.get("/v1/tenants/:tenantId", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const tenantId = c.req.param("tenantId");

  try {
    const result = await sql`
      SELECT 
        t.*,
        s.id as subscription_id,
        s.plan as subscription_plan,
        s.status as subscription_status,
        s.stripe_subscription_id,
        s.stripe_customer_id,
        s.current_period_start,
        s.current_period_end,
        s.trial_start,
        s.trial_end
      FROM tenants t
      LEFT JOIN subscriptions s ON t.id = s.tenant_id AND s.status = 'active'
      WHERE t.id = ${tenantId}
    `;

    if (!result || result.length === 0) {
      return c.json({ error: "Tenant not found" }, 404);
    }

    const tenant = result[0];

    // Get users
    const users = await sql`
      SELECT id, email, name, avatar_url, status, last_seen_at, created_at
      FROM tenant_users
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `;

    // Get workspaces
    const workspaces = await sql`
      SELECT id, name, type, settings, created_at
      FROM workspaces
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `;

    // Get usage metrics
    const usage = await sql`
      SELECT 
        COUNT(DISTINCT tu.id) as user_count,
        (SELECT COUNT(*) FROM connectors WHERE tenant_id = ${tenantId}) as connector_count,
        (SELECT COUNT(*) FROM iq_sessions WHERE tenant_id = ${tenantId} AND created_at > NOW() - INTERVAL '30 days') as ai_sessions_30d
      FROM tenant_users tu
      WHERE tu.tenant_id = ${tenantId}
    `;

    return c.json({
      tenant,
      users,
      workspaces,
      usage: usage[0] || {},
    });
  } catch (err: any) {
    console.error("Failed to get tenant:", err);
    return c.json({ error: "Failed to get tenant", message: err.message }, 500);
  }
});

/**
 * POST /v1/tenants
 * Create a new tenant
 */
app.post("/v1/tenants", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const body = await c.req.json();

  const {
    name,
    slug,
    plan = "personal",
    status = "trial",
    settings = {},
    metadata = {},
    data_region = "us-west",
    demo_mode = false,
    owner_email,
    owner_name,
  } = body;

  if (!name || !slug) {
    return c.json({ error: "name and slug are required" }, 400);
  }

  try {
    // Check slug uniqueness
    const existing = await sql`SELECT id FROM tenants WHERE slug = ${slug}`;
    if (existing.length > 0) {
      return c.json({ error: "Slug already in use" }, 409);
    }

    const tenantId = crypto.randomUUID();
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    // Create tenant
    await sql`
      INSERT INTO tenants (id, name, slug, plan, status, trial_ends_at, settings, metadata, data_region, demo_mode)
      VALUES (${tenantId}, ${name}, ${slug}, ${plan}, ${status}, ${trialEndsAt}, ${JSON.stringify(settings)}, ${JSON.stringify(metadata)}, ${data_region}, ${demo_mode})
    `;

    // Create default workspace
    const workspaceId = crypto.randomUUID();
    await sql`
      INSERT INTO workspaces (id, tenant_id, name, type, settings)
      VALUES (${workspaceId}, ${tenantId}, 'Default', 'production', '{}')
    `;

    // Create owner user if provided
    if (owner_email) {
      const userId = crypto.randomUUID();
      await sql`
        INSERT INTO tenant_users (id, tenant_id, email, name, status, metadata)
        VALUES (${userId}, ${tenantId}, ${owner_email}, ${owner_name || null}, 'active', '{"role": "owner"}')
      `;
    }

    // Create trial subscription
    await sql`
      INSERT INTO subscriptions (id, tenant_id, plan, status, trial_start, trial_end)
      VALUES (${crypto.randomUUID()}, ${tenantId}, ${plan}, 'trialing', NOW(), ${trialEndsAt})
    `;

    return c.json(
      {
        success: true,
        tenant: {
          id: tenantId,
          name,
          slug,
          plan,
          status,
          workspace_id: workspaceId,
        },
      },
      201
    );
  } catch (err: any) {
    console.error("Failed to create tenant:", err);
    return c.json({ error: "Failed to create tenant", message: err.message }, 500);
  }
});

const SAFE_TENANT_COLUMNS: Record<string, string> = {
  name: "name",
  slug: "slug",
  plan: "plan",
  status: "status",
  settings: "settings",
  metadata: "metadata",
  data_region: "data_region",
  demo_mode: "demo_mode",
};

/**
 * PATCH /v1/tenants/:tenantId
 * Update tenant details
 */
app.patch("/v1/tenants/:tenantId", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const tenantId = c.req.param("tenantId");
  const body = await c.req.json();

  const updates: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(body)) {
    const column = SAFE_TENANT_COLUMNS[key];
    if (column) {
      updates.push(`${column} = $${values.length + 1}`);
      values.push(key === "settings" || key === "metadata" ? JSON.stringify(value) : value);
    }
  }

  if (updates.length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  try {
    updates.push(`updated_at = NOW()`);
    values.push(tenantId);

    const query = `UPDATE tenants SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`;
    const result = await sql(query, values);

    if (!result || result.length === 0) {
      return c.json({ error: "Tenant not found" }, 404);
    }

    return c.json({ success: true, tenant: result[0] });
  } catch (err: any) {
    console.error("Failed to update tenant:", err);
    return c.json({ error: "Failed to update tenant", message: err.message }, 500);
  }
});

/**
 * DELETE /v1/tenants/:tenantId
 * Soft delete a tenant (sets status to 'churned')
 */
app.delete("/v1/tenants/:tenantId", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const tenantId = c.req.param("tenantId");
  const hardDelete = c.req.query("hard") === "true";

  try {
    if (hardDelete) {
      // Hard delete - remove all data in a transaction (dangerous!)
      await sql`BEGIN`;
      try {
        await sql`DELETE FROM connectors WHERE tenant_id = ${tenantId}`;
        await sql`DELETE FROM tenant_users WHERE tenant_id = ${tenantId}`;
        await sql`DELETE FROM workspaces WHERE tenant_id = ${tenantId}`;
        await sql`DELETE FROM subscriptions WHERE tenant_id = ${tenantId}`;
        await sql`DELETE FROM tenants WHERE id = ${tenantId}`;
        await sql`COMMIT`;
      } catch (err) {
        await sql`ROLLBACK`;
        throw err;
      }

      return c.json({ success: true, deleted: true });
    } else {
      // Soft delete - mark as churned
      const result = await sql`
        UPDATE tenants 
        SET status = 'churned', updated_at = NOW() 
        WHERE id = ${tenantId} 
        RETURNING id
      `;

      if (!result || result.length === 0) {
        return c.json({ error: "Tenant not found" }, 404);
      }

      return c.json({ success: true, status: "churned" });
    }
  } catch (err: any) {
    console.error("Failed to delete tenant:", err);
    return c.json({ error: "Failed to delete tenant", message: err.message }, 500);
  }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * GET /v1/tenants/:tenantId/users
 * List users for a tenant
 */
app.get("/v1/tenants/:tenantId/users", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const tenantId = c.req.param("tenantId");
  const status = c.req.query("status");

  try {
    let users;
    if (status) {
      users = await sql`
        SELECT * FROM tenant_users 
        WHERE tenant_id = ${tenantId} AND status = ${status}
        ORDER BY created_at DESC
      `;
    } else {
      users = await sql`
        SELECT * FROM tenant_users 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;
    }

    return c.json({ users });
  } catch (err: any) {
    console.error("Failed to list users:", err);
    return c.json({ error: "Failed to list users", message: err.message }, 500);
  }
});

/**
 * POST /v1/tenants/:tenantId/users
 * Add a user to a tenant
 */
app.post("/v1/tenants/:tenantId/users", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const tenantId = c.req.param("tenantId");
  const body = await c.req.json();

  const { email, name, role = "member", status = "invited" } = body;

  if (!email) {
    return c.json({ error: "email is required" }, 400);
  }

  try {
    // Check if user already exists in tenant
    const existing = await sql`
      SELECT id FROM tenant_users 
      WHERE tenant_id = ${tenantId} AND email = ${email}
    `;
    if (existing.length > 0) {
      return c.json({ error: "User already exists in this tenant" }, 409);
    }

    const userId = crypto.randomUUID();
    const metadata = { role };

    await sql`
      INSERT INTO tenant_users (id, tenant_id, email, name, status, metadata)
      VALUES (${userId}, ${tenantId}, ${email}, ${name || null}, ${status}, ${JSON.stringify(metadata)})
    `;

    return c.json(
      {
        success: true,
        user: { id: userId, email, name, status, role },
      },
      201
    );
  } catch (err: any) {
    console.error("Failed to add user:", err);
    return c.json({ error: "Failed to add user", message: err.message }, 500);
  }
});

/**
 * PATCH /v1/tenants/:tenantId/users/:userId
 * Update a user
 */
app.patch("/v1/tenants/:tenantId/users/:userId", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const tenantId = c.req.param("tenantId");
  const userId = c.req.param("userId");
  const body = await c.req.json();

  const { name, status, metadata } = body;

  try {
    const result = await sql`
      UPDATE tenant_users 
      SET 
        name = COALESCE(${name}, name),
        status = COALESCE(${status}, status),
        metadata = COALESCE(${metadata ? JSON.stringify(metadata) : null}, metadata),
        updated_at = NOW()
      WHERE id = ${userId} AND tenant_id = ${tenantId}
      RETURNING *
    `;

    if (!result || result.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ success: true, user: result[0] });
  } catch (err: any) {
    console.error("Failed to update user:", err);
    return c.json({ error: "Failed to update user", message: err.message }, 500);
  }
});

/**
 * DELETE /v1/tenants/:tenantId/users/:userId
 * Remove a user from a tenant
 */
app.delete("/v1/tenants/:tenantId/users/:userId", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const tenantId = c.req.param("tenantId");
  const userId = c.req.param("userId");

  try {
    const result = await sql`
      DELETE FROM tenant_users 
      WHERE id = ${userId} AND tenant_id = ${tenantId}
      RETURNING id
    `;

    if (!result || result.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ success: true, deleted: true });
  } catch (err: any) {
    console.error("Failed to delete user:", err);
    return c.json({ error: "Failed to delete user", message: err.message }, 500);
  }
});

// ============================================================================
// WORKSPACE MANAGEMENT
// ============================================================================

/**
 * GET /v1/tenants/:tenantId/workspaces
 * List workspaces for a tenant
 */
app.get("/v1/tenants/:tenantId/workspaces", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const tenantId = c.req.param("tenantId");

  try {
    const workspaces = await sql`
      SELECT * FROM workspaces 
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `;

    return c.json({ workspaces });
  } catch (err: any) {
    console.error("Failed to list workspaces:", err);
    return c.json({ error: "Failed to list workspaces", message: err.message }, 500);
  }
});

/**
 * POST /v1/tenants/:tenantId/workspaces
 * Create a new workspace
 */
app.post("/v1/tenants/:tenantId/workspaces", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const tenantId = c.req.param("tenantId");
  const body = await c.req.json();

  const { name, type = "production", settings = {} } = body;

  if (!name) {
    return c.json({ error: "name is required" }, 400);
  }

  try {
    const workspaceId = crypto.randomUUID();

    await sql`
      INSERT INTO workspaces (id, tenant_id, name, type, settings)
      VALUES (${workspaceId}, ${tenantId}, ${name}, ${type}, ${JSON.stringify(settings)})
    `;

    return c.json(
      {
        success: true,
        workspace: { id: workspaceId, tenant_id: tenantId, name, type, settings },
      },
      201
    );
  } catch (err: any) {
    console.error("Failed to create workspace:", err);
    return c.json({ error: "Failed to create workspace", message: err.message }, 500);
  }
});

// ============================================================================
// CLOUDFLARE WORKERS MONITORING
// ============================================================================

/**
 * GET /v1/workers/health
 * Get real-time health metrics for all Cloudflare Workers
 */
app.get("/v1/workers/health", async (c) => {
  // List of all 17 workers
  const workers = [
    "gateway",
    "pipeline",
    "connector",
    "intelligence",
    "knowledge",
    "mcp-connector",
    "continuity",
    "admin",
    "billing",
    "tenants",
    "connector-sync",
    "webhook-ingress",
    "folder-watcher",
    "workflow",
    "twin-orchestrator",
    "l2",
    "hermes",
  ];

  const healthData = await Promise.all(
    workers.map(async (workerName) => {
      try {
        // In production, query Cloudflare Analytics API or Analytics Engine
        // For now, return mock data (TODO: wire to real CF Analytics)

        const baseLatency = 50 + Math.random() * 100;
        const requestsPerMin = Math.floor(100 + Math.random() * 900);
        const errorRate = Math.random() * 2;

        // Simulate occasional degraded/down states
        let status: "healthy" | "degraded" | "down" = "healthy";
        if (errorRate > 1.5) status = "degraded";
        if (Math.random() > 0.95) status = "down";

        return {
          name: workerName,
          status,
          latency_p50: Math.round(baseLatency),
          latency_p95: Math.round(baseLatency * 1.5),
          latency_p99: Math.round(baseLatency * 2),
          requests_per_min: requestsPerMin,
          error_rate: parseFloat(errorRate.toFixed(2)),
          cpu_percent: Math.floor(5 + Math.random() * 20),
          memory_mb: Math.floor(50 + Math.random() * 100),
          durable_objects_count: ["folder-watcher", "twin-orchestrator"].includes(workerName)
            ? Math.floor(1 + Math.random() * 10)
            : undefined,
          last_check: new Date().toISOString(),
        };
      } catch (err) {
        return {
          name: workerName,
          status: "unknown" as const,
          latency_p50: 0,
          latency_p95: 0,
          latency_p99: 0,
          requests_per_min: 0,
          error_rate: 0,
          cpu_percent: 0,
          memory_mb: 0,
          last_check: new Date().toISOString(),
        };
      }
    })
  );

  return c.json({ workers: healthData });
});

/**
 * GET /v1/workers/:workerName
 * Get detailed metrics for a specific worker
 */
app.get("/v1/workers/:workerName", async (c) => {
  const workerName = c.req.param("workerName");

  // TODO: Query Cloudflare Analytics API for real data
  // For now, return mock detailed stats

  const details = {
    name: workerName,
    status: "healthy",
    url: `${workerName}.dev.integratewise.ai`,

    // Metrics (last 24h)
    metrics: {
      requests_total: Math.floor(100000 + Math.random() * 400000),
      requests_per_second: Math.floor(10 + Math.random() * 40),
      success_rate: 99.8 + Math.random() * 0.2,
      error_5xx: Math.floor(Math.random() * 100),
      error_4xx: Math.floor(Math.random() * 500),
      avg_duration_ms: 50 + Math.random() * 100,
      p50_duration_ms: 40 + Math.random() * 60,
      p95_duration_ms: 100 + Math.random() * 200,
      p99_duration_ms: 200 + Math.random() * 300,
      cpu_time_ms: 20 + Math.random() * 50,
    },

    // Bindings
    bindings: {
      kv: ["CACHE", "SIGNAL_CACHE"],
      d1: ["integratewise-spine-cache"],
      r2: [],
      queues: ["pipeline-process", "intelligence-events"],
      durable_objects: workerName === "folder-watcher" ? ["FolderWatcherState"] : [],
      service_bindings: ["MCP_CONNECTOR", "INTELLIGENCE"],
    },

    // Recent deployments
    deployments: [
      {
        version: "2026-06-09T14:30:00Z",
        deployed_by: "connect@integratewise.ai",
        status: "active",
        deployed_at: "2026-06-09T14:30:00Z",
      },
      {
        version: "2026-06-08T10:15:00Z",
        deployed_by: "connect@integratewise.ai",
        status: "superseded",
        deployed_at: "2026-06-08T10:15:00Z",
      },
    ],

    // Recent errors (last 100)
    recent_errors: [
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        message: "Timeout calling external API",
        status: 504,
        request_id: crypto.randomUUID(),
      },
      {
        timestamp: new Date(Date.now() - 600000).toISOString(),
        message: "Invalid JWT signature",
        status: 401,
        request_id: crypto.randomUUID(),
      },
    ],
  };

  return c.json({ worker: details });
});

/**
 * POST /v1/workers/:workerName/deploy
 * Trigger deployment of a worker (requires CF API token)
 */
app.post("/v1/workers/:workerName/deploy", async (c) => {
  const workerName = c.req.param("workerName");
  const body = await c.req.json();
  const { environment = "dev" } = body;

  // TODO: Trigger wrangler deploy via CF API
  // This would require CLOUDFLARE_API_TOKEN in env

  return c.json({
    success: true,
    message: `Deployment triggered for ${workerName} (${environment})`,
    deployment_id: crypto.randomUUID(),
  });
});

/**
 * POST /v1/workers/:workerName/rollback
 * Rollback a worker to previous version
 */
app.post("/v1/workers/:workerName/rollback", async (c) => {
  const workerName = c.req.param("workerName");

  // TODO: Rollback via CF API

  return c.json({
    success: true,
    message: `Rolled back ${workerName} to previous version`,
  });
});

// ============================================================================
// NEWSLETTER & CONTACT MANAGEMENT
// ============================================================================

/**
 * POST /v1/newsletter/subscribe
 * POST /v1/public/newsletter
 * Subscribe email to newsletter (public, no auth required)
 */
const newsletterSubscribeHandler = async (c: any) => {
  const sql = neon(c.env.DATABASE_URL);
  const body = await c.req.json();
  const email = normalizeEmail(body.email);
  const source = optionalText(body.source_surface) || optionalText(body.source) || "website";
  const submittedAt = optionalText(body.subscribed_at) || new Date().toISOString();
  const metadata = JSON.stringify(
    body.metadata && typeof body.metadata === "object" ? body.metadata : {}
  );

  if (!email || !isValidEmail(email)) {
    return c.json({ error: "Valid email required" }, 400);
  }

  try {
    const id = crypto.randomUUID();
    await sql(
      `
        INSERT INTO newsletter_subscribers (
          id,
          email,
          subscribed_at,
          source,
          source_surface,
          status,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, 'active', $6::jsonb)
        ON CONFLICT(email)
        DO UPDATE SET
          status = 'active',
          subscribed_at = EXCLUDED.subscribed_at,
          source = EXCLUDED.source,
          source_surface = EXCLUDED.source_surface,
          metadata = EXCLUDED.metadata
      `,
      [id, email, submittedAt, source, source, metadata]
    );
    return c.json({ success: true, message: "Subscribed successfully", id }, 201);
  } catch (err: any) {
    console.error("Failed to subscribe to newsletter:", err);
    return c.json({ error: "Failed to subscribe", message: err.message }, 500);
  }
};
app.post("/v1/newsletter/subscribe", newsletterSubscribeHandler);
app.post("/v1/public/newsletter", newsletterSubscribeHandler);

/**
 * GET /v1/newsletter/subscribers
 * List newsletter subscribers (admin only)
 */
app.get("/v1/newsletter/subscribers", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const limit = Math.min(Math.max(1, parseInt(c.req.query("limit") || "100", 10)), 200);
  const offset = Math.max(0, parseInt(c.req.query("offset") || "0", 10));
  const status = c.req.query("status");

  try {
    let query = `SELECT * FROM newsletter_subscribers WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY subscribed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const subscribers = await sql(query, params);
    const countResult = await sql`SELECT COUNT(*) as total FROM newsletter_subscribers`;
    const total = countResult[0]?.total || 0;

    return c.json({
      subscribers,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (err: any) {
    console.error("Failed to list subscribers:", err);
    return c.json({ error: "Failed to list subscribers", message: err.message }, 500);
  }
});

/**
 * POST /v1/contact-submissions
 * POST /v1/public/contact
 * Store contact form submission (public, no auth required)
 */
const contactSubmissionHandler = async (c: any) => {
  const sql = neon(c.env.DATABASE_URL);
  const body = await c.req.json();
  const name = normalizeText(body.name);
  const email = normalizeEmail(body.email);
  const company = optionalText(body.company);
  const requestKind = normalizeRequestKind(body.request_kind || body.type, "general_contact");
  const message = normalizeText(body.message);
  const sourceSurface = optionalText(body.source_surface) || "marketing_contact";
  const priority = optionalText(body.priority) || "normal";
  const severity = optionalText(body.severity) || "medium";
  const owner = optionalText(body.owner);
  const submittedAt = optionalText(body.submitted_at) || new Date().toISOString();
  const tenantId = optionalText(c.req.header("x-tenant-id"));
  const userId = optionalText(c.req.header("x-user-id"));
  const metadata = JSON.stringify(
    body.metadata && typeof body.metadata === "object" ? body.metadata : {}
  );

  if (!name || !email || !message || !isValidEmail(email)) {
    return c.json({ error: "Name, valid email, and message are required" }, 400);
  }

  try {
    const id = crypto.randomUUID();
    const zendesk = await createZendeskTicketIfConfigured(c.env, {
      email,
      name,
      subject: `[${requestKind}] ${company || name}`,
      description: [
        `Request kind: ${requestKind}`,
        `Source: ${sourceSurface}`,
        company ? `Company: ${company}` : null,
        "",
        message,
      ]
        .filter(Boolean)
        .join("\n"),
      priority,
      tags: ["integratewise", "contact", toZendeskTag(requestKind), toZendeskTag(sourceSurface)],
    });

    await sql(
      `
        INSERT INTO contact_submissions (
          id,
          name,
          email,
          company,
          inquiry_type,
          request_kind,
          message,
          submitted_at,
          source_surface,
          tenant_id,
          user_id,
          status,
          priority,
          severity,
          owner,
          external_system,
          external_ticket_id,
          external_status,
          sync_error,
          metadata
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::uuid, $11::uuid, 'new',
          $12, $13, $14, $15, $16, $17, $18, $19::jsonb
        )
      `,
      [
        id,
        name,
        email,
        company,
        requestKind,
        requestKind,
        message,
        submittedAt,
        sourceSurface,
        tenantId,
        userId,
        priority,
        severity,
        owner,
        zendesk.externalSystem,
        zendesk.externalTicketId,
        zendesk.externalStatus,
        zendesk.syncError,
        metadata,
      ]
    );

    return c.json(
      {
        success: true,
        id,
        external_system: zendesk.externalSystem,
        external_ticket_id: zendesk.externalTicketId,
        external_status: zendesk.externalStatus,
      },
      201
    );
  } catch (err: any) {
    console.error("Failed to store contact submission:", err);
    return c.json({ error: "Failed to submit contact form", message: err.message }, 500);
  }
};
app.post("/v1/contact-submissions", contactSubmissionHandler);
app.post("/v1/public/contact", contactSubmissionHandler);

/**
 * GET /v1/contact-submissions
 * List contact submissions (admin only)
 */
app.get("/v1/contact-submissions", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const limit = Math.min(Math.max(1, parseInt(c.req.query("limit") || "100", 10)), 200);
  const offset = Math.max(0, parseInt(c.req.query("offset") || "0", 10));
  const status = c.req.query("status");
  const requestKind = c.req.query("request_kind");
  const sourceSurface = c.req.query("source_surface");
  const externalStatus = c.req.query("external_status");

  try {
    let query = `SELECT * FROM contact_submissions WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (requestKind) {
      query += ` AND request_kind = $${params.length + 1}`;
      params.push(requestKind);
    }

    if (sourceSurface) {
      query += ` AND source_surface = $${params.length + 1}`;
      params.push(sourceSurface);
    }

    if (externalStatus) {
      query += ` AND external_status = $${params.length + 1}`;
      params.push(externalStatus);
    }

    query += ` ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const submissions = await sql(query, params);
    const countResult = await sql`SELECT COUNT(*) as total FROM contact_submissions`;
    const total = countResult[0]?.total || 0;

    return c.json({
      submissions,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (err: any) {
    console.error("Failed to list contact submissions:", err);
    return c.json({ error: "Failed to list submissions", message: err.message }, 500);
  }
});

// ============================================================================
// SUPPORT TICKET MANAGEMENT
// ============================================================================

/**
 * POST /v1/support/tickets
 * POST /v1/support-tickets
 * Create a new support ticket
 */
const supportTicketCreateHandler = async (c: any) => {
  const sql = neon(c.env.DATABASE_URL);
  const body = await c.req.json();
  const tenantId = c.req.header("x-tenant-id");
  const userId = optionalText(c.req.header("x-user-id"));
  const userEmail = normalizeEmail(body.email || c.req.header("x-user-email"));
  const subject = normalizeText(body.subject);
  const description = normalizeText(body.description);
  const category = normalizeRequestKind(body.category, "general");
  const priority = optionalText(body.priority) || "normal";
  const severity = optionalText(body.severity) || priority;
  const sourceSurface = optionalText(body.source_surface) || "in_app_help_widget";
  const owner = optionalText(body.owner);
  const requestKind = normalizeRequestKind(body.request_kind || body.category, "support_ticket");
  const metadata = JSON.stringify(
    body.metadata && typeof body.metadata === "object" ? body.metadata : {}
  );

  if (!tenantId) {
    return c.json({ error: "Tenant context is required" }, 400);
  }

  if (!userEmail || !subject || !description || !isValidEmail(userEmail)) {
    return c.json({ error: "Email, subject, and description are required" }, 400);
  }

  try {
    const id = crypto.randomUUID();
    const zendesk = await createZendeskTicketIfConfigured(c.env, {
      email: userEmail,
      subject,
      description: [
        `Category: ${category}`,
        `Source: ${sourceSurface}`,
        `Tenant: ${tenantId}`,
        "",
        description,
      ].join("\n"),
      priority,
      tags: ["integratewise", "support", toZendeskTag(category), toZendeskTag(sourceSurface)],
    });

    await sql(
      `
        INSERT INTO support_tickets (
          id,
          tenant_id,
          user_id,
          user_email,
          subject,
          description,
          category,
          request_kind,
          priority,
          severity,
          status,
          source_surface,
          owner,
          external_system,
          external_ticket_id,
          external_status,
          sync_error,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2::uuid,
          $3::uuid,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          'open',
          $11,
          $12,
          $13,
          $14,
          $15,
          $16,
          $17::jsonb,
          $18,
          $18
        )
      `,
      [
        id,
        tenantId,
        userId,
        userEmail,
        subject,
        description,
        category,
        requestKind,
        priority,
        severity,
        sourceSurface,
        owner,
        zendesk.externalSystem,
        zendesk.externalTicketId,
        zendesk.externalStatus,
        zendesk.syncError,
        metadata,
        new Date().toISOString(),
      ]
    );
    return c.json(
      {
        success: true,
        ticket_id: id,
        external_ticket_id: zendesk.externalTicketId,
        external_status: zendesk.externalStatus,
      },
      201
    );
  } catch (err: any) {
    console.error("Failed to create support ticket:", err);
    return c.json({ error: "Failed to create support ticket", message: err.message }, 500);
  }
};
app.post("/v1/support/tickets", supportTicketCreateHandler);
app.post("/v1/support-tickets", supportTicketCreateHandler);

/**
 * GET /v1/support-tickets
 * List support tickets (admin only)
 */
app.get("/v1/support-tickets", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const limit = Math.min(Math.max(1, parseInt(c.req.query("limit") || "50", 10)), 200);
  const offset = Math.max(0, parseInt(c.req.query("offset") || "0", 10));
  const status = c.req.query("status");
  const tenantId = c.req.query("tenant_id");
  const category = c.req.query("category");
  const priority = c.req.query("priority");
  const owner = c.req.query("owner");
  const externalStatus = c.req.query("external_status");

  try {
    let query = `SELECT * FROM support_tickets WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (tenantId) {
      query += ` AND tenant_id = $${params.length + 1}`;
      params.push(tenantId);
    }

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (priority) {
      query += ` AND priority = $${params.length + 1}`;
      params.push(priority);
    }

    if (owner) {
      query += ` AND owner = $${params.length + 1}`;
      params.push(owner);
    }

    if (externalStatus) {
      query += ` AND external_status = $${params.length + 1}`;
      params.push(externalStatus);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const tickets = await sql(query, params);
    const countResult = await sql`SELECT COUNT(*) as total FROM support_tickets`;
    const total = countResult[0]?.total || 0;

    return c.json({
      tickets,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (err: any) {
    console.error("Failed to list support tickets:", err);
    return c.json({ error: "Failed to list tickets", message: err.message }, 500);
  }
});

/**
 * GET /v1/support-tickets/:ticketId
 * Get a specific support ticket
 */
app.get("/v1/support-tickets/:ticketId", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const ticketId = c.req.param("ticketId");

  try {
    const result = await sql`
      SELECT * FROM support_tickets WHERE id = ${ticketId}
    `;

    if (!result || result.length === 0) {
      return c.json({ error: "Ticket not found" }, 404);
    }

    return c.json({ ticket: result[0] });
  } catch (err: any) {
    console.error("Failed to get support ticket:", err);
    return c.json({ error: "Failed to get ticket", message: err.message }, 500);
  }
});

/**
 * PATCH /v1/support-tickets/:ticketId
 * Update a support ticket (status, priority, etc.)
 */
app.patch("/v1/support-tickets/:ticketId", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const ticketId = c.req.param("ticketId");
  const body = await c.req.json();
  const { status, priority, severity, description, owner, external_status, external_ticket_id } =
    body;

  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      updates.push(`status = $${values.length + 1}`);
      values.push(status);
    }

    if (priority) {
      updates.push(`priority = $${values.length + 1}`);
      values.push(priority);
    }

    if (severity) {
      updates.push(`severity = $${values.length + 1}`);
      values.push(severity);
    }

    if (description) {
      updates.push(`description = $${values.length + 1}`);
      values.push(description);
    }

    if (owner) {
      updates.push(`owner = $${values.length + 1}`);
      values.push(owner);
    }

    if (external_status) {
      updates.push(`external_status = $${values.length + 1}`);
      values.push(external_status);
    }

    if (external_ticket_id) {
      updates.push(`external_ticket_id = $${values.length + 1}`);
      values.push(external_ticket_id);
    }

    if (updates.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    updates.push(`updated_at = $${values.length + 1}`);
    values.push(new Date().toISOString());
    values.push(ticketId);

    const query = `UPDATE support_tickets SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`;
    const result = await sql(query, values);

    if (!result || result.length === 0) {
      return c.json({ error: "Ticket not found" }, 404);
    }

    return c.json({ success: true, ticket: result[0] });
  } catch (err: any) {
    console.error("Failed to update support ticket:", err);
    return c.json({ error: "Failed to update ticket", message: err.message }, 500);
  }
});

/**
 * POST /v1/support/feedback
 * POST /v1/support/csat
 * POST /v1/support/nps
 * Store authenticated feedback and optional Zendesk linkage
 */
async function createFeedbackSubmission(c: any, requestKindOverride?: string) {
  const sql = neon(c.env.DATABASE_URL);
  const body = await c.req.json();
  const tenantId = c.req.header("x-tenant-id");
  const userId = optionalText(c.req.header("x-user-id"));
  const email = normalizeEmail(body.email || c.req.header("x-user-email"));
  const name = optionalText(body.name);
  const requestKind = normalizeRequestKind(
    requestKindOverride || body.request_kind || body.type,
    "general_feedback"
  );
  const subject =
    optionalText(body.subject) || optionalText(body.title) || `${requestKind} feedback`;
  const message = normalizeText(body.message || body.description || body.feedback);
  const sourceSurface = optionalText(body.source_surface) || "in_app_help_widget";
  const status = optionalText(body.status) || "new";
  const priority = optionalText(body.priority) || "normal";
  const severity = optionalText(body.severity) || "medium";
  const owner = optionalText(body.owner);
  const scoreValue =
    typeof body.score === "number"
      ? body.score
      : typeof body.rating === "number"
        ? body.rating
        : body.score || body.rating
          ? Number(body.score || body.rating)
          : null;
  const metadata = JSON.stringify(
    body.metadata && typeof body.metadata === "object" ? body.metadata : {}
  );

  if (!tenantId) {
    return c.json({ error: "Tenant context is required" }, 400);
  }

  if (!message && scoreValue === null) {
    return c.json({ error: "Feedback message or score is required" }, 400);
  }

  const createTicket = shouldCreateFeedbackTicket({
    requestKind,
    score: Number.isFinite(scoreValue as number) ? Number(scoreValue) : null,
    severity,
    createTicket: Boolean(body.create_ticket),
  });

  const zendesk = createTicket
    ? await createZendeskTicketIfConfigured(c.env, {
        email,
        name,
        subject,
        description: [
          `Feedback type: ${requestKind}`,
          `Source: ${sourceSurface}`,
          scoreValue !== null ? `Score: ${scoreValue}` : null,
          "",
          message || "No additional feedback provided.",
        ]
          .filter(Boolean)
          .join("\n"),
        priority,
        tags: ["integratewise", "feedback", toZendeskTag(requestKind), toZendeskTag(sourceSurface)],
      })
    : {
        externalSystem: "zendesk" as const,
        externalTicketId: null,
        externalStatus: "not_required",
        syncError: null,
      };

  try {
    const id = crypto.randomUUID();
    await sql(
      `
        INSERT INTO feedback_submissions (
          id,
          tenant_id,
          user_id,
          email,
          name,
          request_kind,
          subject,
          message,
          score,
          source_surface,
          status,
          priority,
          severity,
          owner,
          external_system,
          external_ticket_id,
          external_status,
          sync_error,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2::uuid,
          $3::uuid,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16,
          $17,
          $18,
          $19::jsonb,
          $20,
          $20
        )
      `,
      [
        id,
        tenantId,
        userId,
        email || null,
        name,
        requestKind,
        subject,
        message || null,
        scoreValue,
        sourceSurface,
        status,
        priority,
        severity,
        owner,
        zendesk.externalSystem,
        zendesk.externalTicketId,
        zendesk.externalStatus,
        zendesk.syncError,
        metadata,
        new Date().toISOString(),
      ]
    );

    return c.json(
      {
        success: true,
        id,
        external_ticket_id: zendesk.externalTicketId,
        external_status: zendesk.externalStatus,
      },
      201
    );
  } catch (err: any) {
    console.error("Failed to create feedback submission:", err);
    return c.json({ error: "Failed to store feedback", message: err.message }, 500);
  }
}

app.post("/v1/support/feedback", async (c) => createFeedbackSubmission(c));
app.post("/v1/support/csat", async (c) => createFeedbackSubmission(c, "csat"));
app.post("/v1/support/nps", async (c) => createFeedbackSubmission(c, "nps"));

/**
 * GET /v1/feedback-submissions
 * List feedback submissions (admin only)
 */
app.get("/v1/feedback-submissions", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const limit = Math.min(Math.max(1, parseInt(c.req.query("limit") || "50", 10)), 200);
  const offset = Math.max(0, parseInt(c.req.query("offset") || "0", 10));
  const status = c.req.query("status");
  const tenantId = c.req.query("tenant_id");
  const requestKind = c.req.query("request_kind");
  const externalStatus = c.req.query("external_status");

  try {
    let query = `SELECT * FROM feedback_submissions WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (tenantId) {
      query += ` AND tenant_id = $${params.length + 1}`;
      params.push(tenantId);
    }

    if (requestKind) {
      query += ` AND request_kind = $${params.length + 1}`;
      params.push(requestKind);
    }

    if (externalStatus) {
      query += ` AND external_status = $${params.length + 1}`;
      params.push(externalStatus);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const feedback = await sql(query, params);
    const countResult = await sql`SELECT COUNT(*) as total FROM feedback_submissions`;
    const total = countResult[0]?.total || 0;

    return c.json({
      feedback,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (err: any) {
    console.error("Failed to list feedback submissions:", err);
    return c.json({ error: "Failed to list feedback", message: err.message }, 500);
  }
});

/**
 * GET /v1/support/me
 * List current user's recent support tickets and feedback
 */
app.get("/v1/support/me", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const tenantId = c.req.header("x-tenant-id");
  const userId = optionalText(c.req.header("x-user-id"));
  const userEmail = normalizeEmail(c.req.header("x-user-email"));

  if (!tenantId || (!userId && !userEmail)) {
    return c.json({ error: "Authenticated support context is required" }, 400);
  }

  try {
    const ticketQuery = userId
      ? sql(
          `
            SELECT id, subject, category, priority, status, external_status, created_at
            FROM support_tickets
            WHERE tenant_id = $1::uuid AND (user_id = $2::uuid OR user_email = $3)
            ORDER BY created_at DESC
            LIMIT 10
          `,
          [tenantId, userId, userEmail || null]
        )
      : sql(
          `
            SELECT id, subject, category, priority, status, external_status, created_at
            FROM support_tickets
            WHERE tenant_id = $1::uuid AND user_email = $2
            ORDER BY created_at DESC
            LIMIT 10
          `,
          [tenantId, userEmail]
        );

    const feedbackQuery = userId
      ? sql(
          `
            SELECT id, request_kind, subject, score, status, external_status, created_at
            FROM feedback_submissions
            WHERE tenant_id = $1::uuid AND (user_id = $2::uuid OR email = $3)
            ORDER BY created_at DESC
            LIMIT 10
          `,
          [tenantId, userId, userEmail || null]
        )
      : sql(
          `
            SELECT id, request_kind, subject, score, status, external_status, created_at
            FROM feedback_submissions
            WHERE tenant_id = $1::uuid AND email = $2
            ORDER BY created_at DESC
            LIMIT 10
          `,
          [tenantId, userEmail]
        );

    const [tickets, feedback] = await Promise.all([ticketQuery, feedbackQuery]);

    return c.json({
      tickets,
      feedback,
      summary: {
        openTickets: tickets.filter(
          (ticket: any) => ticket.status !== "resolved" && ticket.status !== "closed"
        ).length,
        recentFeedback: feedback.length,
      },
    });
  } catch (err: any) {
    console.error("Failed to list support requests for user:", err);
    return c.json({ error: "Failed to load support activity", message: err.message }, 500);
  }
});

// ============================================================================
// SYSTEM ADMINISTRATION
// ============================================================================

/**
 * GET /v1/system/stats
 * Get system-wide statistics
 */
app.get("/v1/system/stats", async (c) => {
  const sql = neon(c.env.DATABASE_URL);

  try {
    const stats = await sql`
      SELECT
        (SELECT COUNT(*) FROM tenants) as total_tenants,
        (SELECT COUNT(*) FROM tenants WHERE status = 'active') as active_tenants,
        (SELECT COUNT(*) FROM tenants WHERE status = 'trial') as trial_tenants,
        (SELECT COUNT(*) FROM tenant_users) as total_users,
        (SELECT COUNT(*) FROM tenant_users WHERE status = 'active') as active_users,
        (SELECT COUNT(*) FROM workspaces) as total_workspaces,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
        (SELECT COUNT(*) FROM iq_sessions WHERE created_at > NOW() - INTERVAL '24 hours') as ai_sessions_24h,
        (SELECT COUNT(*) FROM iq_sessions WHERE created_at > NOW() - INTERVAL '7 days') as ai_sessions_7d
    `;

    return c.json({
      stats: stats[0] || {},
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Failed to get system stats:", err);
    return c.json({ error: "Failed to get system stats", message: err.message }, 500);
  }
});

/**
 * GET /v1/system/audit-log
 * Get system audit log
 */
app.get("/v1/system/audit-log", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const limit = Math.min(Math.max(1, parseInt(c.req.query("limit") || "100", 10)), 200);
  const tenantId = c.req.query("tenant_id");
  const action = c.req.query("action");

  try {
    let query = `
      SELECT * FROM audit_log 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tenantId) {
      query += ` AND tenant_id = $${params.length + 1}`;
      params.push(tenantId);
    }

    if (action) {
      query += ` AND action = $${params.length + 1}`;
      params.push(action);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const logs = await sql(query, params);

    return c.json({ logs });
  } catch (err: any) {
    console.error("Failed to get audit log:", err);
    return c.json({ error: "Failed to get audit log", message: err.message }, 500);
  }
});

/**
 * POST /v1/system/maintenance
 * Trigger system maintenance tasks
 */
app.post("/v1/system/maintenance", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { task } = body;

  const validTasks = [
    "cleanup_expired_trials",
    "cleanup_churned_tenants",
    "vacuum_database",
    "refresh_stats",
  ];

  if (!task || !validTasks.includes(task)) {
    return c.json({ error: `Invalid task. Valid tasks: ${validTasks.join(", ")}` }, 400);
  }

  try {
    let result: any = { task, status: "completed" };

    switch (task) {
      case "cleanup_expired_trials":
        const expiredTrials = await sql`
          UPDATE tenants 
          SET status = 'suspended' 
          WHERE status = 'trial' AND trial_ends_at < NOW()
          RETURNING id
        `;
        result.affected = expiredTrials.length;
        break;

      case "cleanup_churned_tenants":
        // Mark subscriptions as cancelled for churned tenants
        const churned = await sql`
          UPDATE subscriptions s
          SET status = 'canceled', canceled_at = NOW()
          FROM tenants t
          WHERE s.tenant_id = t.id AND t.status = 'churned' AND s.status = 'active'
          RETURNING s.id
        `;
        result.affected = churned.length;
        break;

      case "refresh_stats":
        // Trigger any stat refresh materialized views
        result.message = "Stats refresh triggered";
        break;

      default:
        result.message = "Task acknowledged";
    }

    return c.json(result);
  } catch (err: any) {
    console.error("Maintenance task failed:", err);
    return c.json({ error: "Maintenance task failed", message: err.message }, 500);
  }
});

export default app;
