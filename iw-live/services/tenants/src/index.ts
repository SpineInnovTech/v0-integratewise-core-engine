/**
 * Tenants Service
 *
 * Multi-tenant context resolution, tenant CRUD, invitation system,
 * SSO configuration, and tenant management API for IntegrateWise.
 *
 * Storage: D1 (integratewise-spine-cache) for tenants, tenant_users, workspaces.
 * Connector OAuth tokens remain in Supabase (connectors table).
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { getSerializableCatalog } from "@integratewise/connectors";
import {
  syncTenantConnectedConnector,
  classifyConnector,
  getFlowTypeDescription,
} from "@integratewise/types";
import { encryptToken } from "@integratewise/lib/crypto";
import type { ConnectorStatus as ConnectorFormalStatus } from "@integratewise/types";
import { resolveTenantContext, getPlanLimits, getTenantBySlug } from "./context";
import type { Env } from "./context";
import type { Plan, WorkspaceType } from "./types";
import { OAUTH_REGISTRY, OAUTH_STATS } from "./oauth-configs";

const app = new Hono<{ Bindings: Env }>();

async function triggerInitialConnectorHydration(
  env: Env,
  tenantId: string,
  provider: string
): Promise<void> {
  if (!tenantId || !env.CONNECTOR_SYNC) return;

  const response = await env.CONNECTOR_SYNC.fetch(
    new Request(`http://connector-sync/api/sync/${tenantId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({
        provider,
        phase: "creamy",
      }),
    })
  );

  if (!response.ok) {
    const message = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Initial creamy sync trigger failed for ${provider}: ${response.status} ${message}`
    );
  }
}

/**
 * Initialize D1 buffer for Flow C connectors (AI/Knowledge)
 * Flow C NEVER writes directly to Spine - only via D1 buffer → Triage → Knowledge UI
 */
async function initializeD1Buffer(tenantId: string, provider: string, _env: Env): Promise<void> {
  console.log(`[connectors] Initializing D1 buffer for ${provider} (tenant: ${tenantId})`);
  console.log(`[connectors] D1 buffer initialized for ${provider} (Flow C - no immediate sync)`);
}

// CORS middleware
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "tenants", version: "2.0", storage: "d1" });
});

// ============================================================================
// TENANT CONTEXT RESOLUTION
// ============================================================================

/**
 * GET /context
 * Get tenant context for current request
 */
app.get("/context", async (c) => {
  try {
    const context = await resolveTenantContext(c.req.raw, c.env);
    return c.json(context);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

/**
 * GET /resolve/:slug
 * Resolve tenant ID from slug (for subdomain routing)
 */
app.get("/resolve/:slug", async (c) => {
  const slug = c.req.param("slug");

  try {
    const tenantId = await getTenantBySlug(slug, c.env);

    if (!tenantId) {
      return c.json({ error: "Tenant not found" }, 404);
    }

    return c.json({ tenant_id: tenantId, slug });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /limits/:plan
 * Get plan limits for a specific plan
 */
app.get("/limits/:plan", (c) => {
  const plan = c.req.param("plan") as Plan;
  const validPlans = ["personal", "team", "org", "enterprise"];

  if (!validPlans.includes(plan)) {
    return c.json({ error: "Invalid plan" }, 400);
  }

  const limits = getPlanLimits(plan);
  return c.json({ plan, limits });
});

// ============================================================================
// TENANT CRUD (D1)
// ============================================================================

/**
 * POST /v1/tenants
 * Create a new tenant (signup flow — CF edge creates user first per D-011)
 */
app.post("/v1/tenants", async (c) => {
  const body = await c.req.json();
  const { name, slug, plan = "personal", email } = body;

  if (!name || !slug || !email) {
    return c.json({ error: "name, slug, and email are required" }, 400);
  }

  // Check slug uniqueness
  const existing = await c.env.DB.prepare(`SELECT id FROM tenants WHERE slug = ?`)
    .bind(slug)
    .first();

  if (existing) {
    return c.json({ error: "Slug already taken" }, 409);
  }

  const tenantId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Batch: create tenant + owner user + default workspace atomically
  const batch = [
    c.env.DB.prepare(
      `INSERT INTO tenants (id, name, slug, plan, status, settings, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', '{}', '{}', ?, ?)`
    ).bind(tenantId, name, slug, plan, now, now),

    c.env.DB.prepare(
      `INSERT INTO tenant_users (id, tenant_id, email, name, role, status, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'owner', 'active', '{}', ?, ?)`
    ).bind(userId, tenantId, email, name, now, now),

    c.env.DB.prepare(
      `INSERT INTO workspaces (id, tenant_id, name, type, settings, created_at, updated_at)
       VALUES (?, ?, 'Default', 'production', '{}', ?, ?)`
    ).bind(workspaceId, tenantId, now, now),
  ];

  await c.env.DB.batch(batch);

  return c.json(
    {
      success: true,
      tenant: { id: tenantId, name, slug, plan, status: "active" },
      user: { id: userId, email, role: "owner" },
      workspace: { id: workspaceId, name: "Default", type: "production" },
    },
    201
  );
});

/**
 * GET /v1/tenants/:tenantId
 * Get full tenant details
 */
app.get("/v1/tenants/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");
  const requestingTenantId = c.req.header("x-tenant-id");

  if (requestingTenantId && requestingTenantId !== tenantId) {
    return c.json({ error: "Access denied" }, 403);
  }

  try {
    const tenant = await c.env.DB.prepare(`SELECT * FROM tenants WHERE id = ?`)
      .bind(tenantId)
      .first();

    if (!tenant) {
      return c.json({ error: "Tenant not found" }, 404);
    }

    return c.json({
      tenant: {
        ...tenant,
        settings: tenant.settings ? JSON.parse(tenant.settings as string) : {},
        metadata: tenant.metadata ? JSON.parse(tenant.metadata as string) : {},
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PATCH /v1/tenants/:tenantId
 * Update tenant settings (self-service)
 */
app.patch("/v1/tenants/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");
  const requestingTenantId = c.req.header("x-tenant-id");
  const body = await c.req.json();

  if (requestingTenantId !== tenantId) {
    return c.json({ error: "Access denied" }, 403);
  }

  const allowedFields = ["name", "settings", "metadata"];
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = ?`);
      values.push(key === "settings" || key === "metadata" ? JSON.stringify(value) : value);
    }
  }

  if (setClauses.length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  setClauses.push(`updated_at = ?`);
  values.push(new Date().toISOString());
  values.push(tenantId);

  try {
    await c.env.DB.prepare(`UPDATE tenants SET ${setClauses.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await c.env.DB.prepare(`SELECT * FROM tenants WHERE id = ?`)
      .bind(tenantId)
      .first();

    return c.json({ success: true, tenant: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// WORKSPACE MANAGEMENT (D1)
// ============================================================================

/**
 * GET /v1/tenants/:tenantId/workspaces
 * List workspaces for a tenant
 */
app.get("/v1/tenants/:tenantId/workspaces", async (c) => {
  const tenantId = c.req.param("tenantId");
  const requestingTenantId = c.req.header("x-tenant-id");

  if (requestingTenantId !== tenantId) {
    return c.json({ error: "Access denied" }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM workspaces WHERE tenant_id = ? ORDER BY created_at DESC`
    )
      .bind(tenantId)
      .all();

    return c.json({ workspaces: results });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /v1/tenants/:tenantId/workspaces
 * Create a new workspace
 */
app.post("/v1/tenants/:tenantId/workspaces", async (c) => {
  const tenantId = c.req.param("tenantId");
  const requestingTenantId = c.req.header("x-tenant-id");
  const body = await c.req.json();

  if (requestingTenantId !== tenantId) {
    return c.json({ error: "Access denied" }, 403);
  }

  const { name, type = "production" as WorkspaceType, settings = {} } = body;

  if (!name) {
    return c.json({ error: "name is required" }, 400);
  }

  try {
    const workspaceId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO workspaces (id, tenant_id, name, type, settings, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(workspaceId, tenantId, name, type, JSON.stringify(settings), now, now)
      .run();

    return c.json(
      {
        success: true,
        workspace: { id: workspaceId, tenant_id: tenantId, name, type, settings },
      },
      201
    );
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /v1/tenants/:tenantId/workspaces/:workspaceId
 * Delete a workspace
 */
app.delete("/v1/tenants/:tenantId/workspaces/:workspaceId", async (c) => {
  const tenantId = c.req.param("tenantId");
  const workspaceId = c.req.param("workspaceId");
  const requestingTenantId = c.req.header("x-tenant-id");

  if (requestingTenantId !== tenantId) {
    return c.json({ error: "Access denied" }, 403);
  }

  try {
    const count = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM workspaces WHERE tenant_id = ?`
    )
      .bind(tenantId)
      .first<{ total: number }>();

    if ((count?.total ?? 0) <= 1) {
      return c.json({ error: "Cannot delete the only workspace" }, 400);
    }

    await c.env.DB.prepare(`DELETE FROM workspaces WHERE id = ? AND tenant_id = ?`)
      .bind(workspaceId, tenantId)
      .run();

    return c.json({ success: true, deleted: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// USER INVITATION SYSTEM (D1)
// ============================================================================

/**
 * GET /v1/tenants/:tenantId/users
 * List users for a tenant
 */
app.get("/v1/tenants/:tenantId/users", async (c) => {
  const tenantId = c.req.param("tenantId");
  const requestingTenantId = c.req.header("x-tenant-id");

  if (requestingTenantId !== tenantId) {
    return c.json({ error: "Access denied" }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, email, name, avatar_url, role, status, last_seen_at, metadata, created_at
       FROM tenant_users WHERE tenant_id = ? ORDER BY created_at DESC`
    )
      .bind(tenantId)
      .all();

    // Parse metadata JSON for each user
    const users = results.map((u: any) => ({
      ...u,
      metadata: u.metadata ? JSON.parse(u.metadata) : {},
    }));

    return c.json({ users });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /v1/tenants/:tenantId/invitations
 * Invite a new user to the tenant
 */
app.post("/v1/tenants/:tenantId/invitations", async (c) => {
  const tenantId = c.req.param("tenantId");
  const requestingTenantId = c.req.header("x-tenant-id");
  const body = await c.req.json();

  if (requestingTenantId !== tenantId) {
    return c.json({ error: "Access denied" }, 403);
  }

  const { email, role = "member", name } = body;

  if (!email) {
    return c.json({ error: "email is required" }, 400);
  }

  try {
    // Check plan limits
    const context = await resolveTenantContext(c.req.raw, c.env);
    const countRow = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM tenant_users WHERE tenant_id = ?`
    )
      .bind(tenantId)
      .first<{ total: number }>();

    if ((countRow?.total ?? 0) >= context.limits.users) {
      return c.json(
        {
          error: "User limit reached for your plan",
          limit: context.limits.users,
          upgrade_url: "/upgrade",
        },
        403
      );
    }

    // Check if user already exists
    const existing = await c.env.DB.prepare(
      `SELECT id FROM tenant_users WHERE tenant_id = ? AND email = ?`
    )
      .bind(tenantId, email)
      .first();

    if (existing) {
      return c.json({ error: "User already exists in this tenant" }, 409);
    }

    // Create invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const metadata = JSON.stringify({
      invitation_token: invitationToken,
      invitation_expires_at: expiresAt.toISOString(),
    });

    await c.env.DB.prepare(
      `INSERT INTO tenant_users (id, tenant_id, email, name, role, status, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'invited', ?, ?, ?)`
    )
      .bind(userId, tenantId, email, name || null, role, metadata, now, now)
      .run();

    return c.json(
      {
        success: true,
        invitation: {
          id: userId,
          email,
          role,
          status: "invited",
          expires_at: expiresAt.toISOString(),
          token: invitationToken,
        },
      },
      201
    );
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /v1/invitations/accept
 * Accept an invitation (public endpoint)
 */
app.post("/v1/invitations/accept", async (c) => {
  const body = await c.req.json();
  const { token, name } = body;

  if (!token) {
    return c.json({ error: "token is required" }, 400);
  }

  try {
    // Find user with this invitation token — D1 doesn't have JSON operators,
    // so we scan invited users and check metadata in app layer
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM tenant_users WHERE status = 'invited'`
    ).all();

    const user = results.find((u: any) => {
      const meta = u.metadata ? JSON.parse(u.metadata as string) : {};
      return meta.invitation_token === token;
    }) as any | undefined;

    if (!user) {
      return c.json({ error: "Invalid or expired invitation" }, 404);
    }

    const meta = JSON.parse(user.metadata || "{}");
    const expiresAt = new Date(meta.invitation_expires_at);

    if (expiresAt < new Date()) {
      return c.json({ error: "Invitation has expired" }, 410);
    }

    // Activate user — clear invitation fields
    const updatedMeta = { ...meta };
    delete updatedMeta.invitation_token;
    delete updatedMeta.invitation_expires_at;

    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `UPDATE tenant_users SET status = 'active', name = COALESCE(?, name), metadata = ?, updated_at = ? WHERE id = ?`
    )
      .bind(name || null, JSON.stringify(updatedMeta), now, user.id)
      .run();

    return c.json({
      success: true,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        email: user.email,
        status: "active",
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /v1/tenants/:tenantId/users/:userId
 * Remove a user from the tenant
 */
app.delete("/v1/tenants/:tenantId/users/:userId", async (c) => {
  const tenantId = c.req.param("tenantId");
  const userId = c.req.param("userId");
  const requestingTenantId = c.req.header("x-tenant-id");
  const requestingUserId = c.req.header("x-user-id");

  if (requestingTenantId !== tenantId) {
    return c.json({ error: "Access denied" }, 403);
  }

  if (requestingUserId === userId) {
    return c.json({ error: "Cannot remove yourself" }, 400);
  }

  try {
    const user = await c.env.DB.prepare(
      `SELECT role FROM tenant_users WHERE id = ? AND tenant_id = ?`
    )
      .bind(userId, tenantId)
      .first<{ role: string }>();

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (user.role === "owner") {
      return c.json({ error: "Cannot remove the tenant owner" }, 400);
    }

    await c.env.DB.prepare(`DELETE FROM tenant_users WHERE id = ? AND tenant_id = ?`)
      .bind(userId, tenantId)
      .run();

    return c.json({ success: true, deleted: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// SSO CONFIGURATION (D1 — stored in tenants.settings JSON)
// ============================================================================

/**
 * GET /v1/tenants/:tenantId/sso
 * Get SSO configuration for a tenant
 */
app.get("/v1/tenants/:tenantId/sso", async (c) => {
  const tenantId = c.req.param("tenantId");
  const requestingTenantId = c.req.header("x-tenant-id");

  if (requestingTenantId !== tenantId) {
    return c.json({ error: "Access denied" }, 403);
  }

  try {
    const row = await c.env.DB.prepare(`SELECT settings FROM tenants WHERE id = ?`)
      .bind(tenantId)
      .first<{ settings: string }>();

    if (!row) {
      return c.json({ error: "Tenant not found" }, 404);
    }

    const settings = row.settings ? JSON.parse(row.settings) : {};
    const sso = settings.sso || { enabled: false };

    // Mask sensitive data
    if (sso.client_secret) {
      sso.client_secret = "********";
    }

    return c.json({ sso });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /v1/tenants/:tenantId/sso
 * Configure SSO for a tenant (enterprise feature)
 */
app.put("/v1/tenants/:tenantId/sso", async (c) => {
  const tenantId = c.req.param("tenantId");
  const requestingTenantId = c.req.header("x-tenant-id");
  const body = await c.req.json();

  if (requestingTenantId !== tenantId) {
    return c.json({ error: "Access denied" }, 403);
  }

  // Check if plan supports SSO
  try {
    const context = await resolveTenantContext(c.req.raw, c.env);
    if (context.plan !== "enterprise" && context.plan !== "org") {
      return c.json(
        {
          error: "SSO is available on Org and Enterprise plans",
          upgrade_url: "/upgrade",
        },
        403
      );
    }
  } catch {
    return c.json({ error: "Could not verify plan" }, 500);
  }

  const {
    enabled = false,
    provider,
    domain,
    client_id,
    client_secret,
    issuer_url,
    metadata_url,
    enforce = false,
  } = body;

  const ssoConfig = {
    enabled,
    provider,
    domain,
    client_id,
    client_secret,
    issuer_url,
    metadata_url,
    enforce,
    configured_at: new Date().toISOString(),
  };

  try {
    // Read current settings, merge SSO in
    const row = await c.env.DB.prepare(`SELECT settings FROM tenants WHERE id = ?`)
      .bind(tenantId)
      .first<{ settings: string }>();

    const settings = row?.settings ? JSON.parse(row.settings) : {};
    settings.sso = ssoConfig;

    const now = new Date().toISOString();
    await c.env.DB.prepare(`UPDATE tenants SET settings = ?, updated_at = ? WHERE id = ?`)
      .bind(JSON.stringify(settings), now, tenantId)
      .run();

    // Mask secret in response
    const responseConfig = { ...ssoConfig, client_secret: "********" };
    return c.json({ success: true, sso: responseConfig });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// USAGE & LIMITS (D1)
// ============================================================================

/**
 * GET /v1/tenants/:tenantId/usage
 * Get usage metrics for a tenant
 */
app.get("/v1/tenants/:tenantId/usage", async (c) => {
  const tenantId = c.req.param("tenantId");
  const requestingTenantId = c.req.header("x-tenant-id");

  if (requestingTenantId !== tenantId) {
    return c.json({ error: "Access denied" }, 403);
  }

  try {
    const context = await resolveTenantContext(c.req.raw, c.env);

    const userCount = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM tenant_users WHERE tenant_id = ? AND status = 'active'`
    )
      .bind(tenantId)
      .first<{ total: number }>();

    const users = userCount?.total ?? 0;

    return c.json({
      plan: context.plan,
      limits: context.limits,
      usage: {
        users: {
          current: users,
          limit: context.limits.users,
          percentage: Math.round((users / context.limits.users) * 100),
        },
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// CONNECTOR OAUTH & STATUS (Phase 1 — Token Circuit)
// Connector tokens stay in Supabase (connectors table). Not migrated to D1.
// ============================================================================

/**
 * Connectors store — D1-backed (DECISION 22: Cloudflare-only product plane).
 * Same select/upsert/update interface as before, but reads/writes the D1
 * `connectors` table instead of Supabase PostgREST. Connectors-table aware:
 * JSON fields (metadata, scopes), boolean fields (sync_enabled, tokens_encrypted),
 * and null-normalized conflict keys (tenant_id → '', provider_workspace_id → 'default').
 * Tokens remain encrypted exactly as before — only the storage plane changes.
 */
function connectorsDb(env: Env) {
  const db = env.DB;
  const JSON_FIELDS = new Set(["metadata", "scopes"]);
  const BOOL_FIELDS = new Set(["sync_enabled", "tokens_encrypted"]);
  const COLUMNS = [
    "id",
    "user_id",
    "tenant_id",
    "provider",
    "status",
    "access_token",
    "refresh_token",
    "token_type",
    "expires_at",
    "provider_user_id",
    "provider_workspace_id",
    "provider_workspace_name",
    "scopes",
    "sync_enabled",
    "tokens_encrypted",
    "last_sync_at",
    "sync_error",
    "metadata",
    "created_at",
    "updated_at",
  ];
  const enc = (k: string, v: unknown): unknown => {
    if (v === undefined) return null;
    if (BOOL_FIELDS.has(k)) return v ? 1 : 0;
    if (JSON_FIELDS.has(k)) {
      if (v === null) return null;
      return typeof v === "string" ? v : JSON.stringify(v);
    }
    return v;
  };
  const revive = (row: any) => {
    if (!row) return row;
    const out: any = { ...row };
    for (const k of JSON_FIELDS) {
      if (typeof out[k] === "string") {
        try {
          out[k] = JSON.parse(out[k]);
        } catch {
          /* leave string */
        }
      }
    }
    for (const k of BOOL_FIELDS) {
      if (out[k] !== undefined && out[k] !== null) out[k] = !!out[k];
    }
    return out;
  };
  return {
    async select(_table: string, filters: Record<string, string>, columns = "*") {
      const keys = Object.keys(filters);
      const where = keys.length ? "WHERE " + keys.map((k) => `${k} = ?`).join(" AND ") : "";
      const { results } = await db
        .prepare(`SELECT ${columns === "*" ? "*" : columns} FROM connectors ${where}`)
        .bind(...keys.map((k) => filters[k]))
        .all();
      return (results || []).map(revive) as any[];
    },
    async upsert(_table: string, data: Record<string, unknown>, _onConflict: string) {
      const now = new Date().toISOString();
      const row: Record<string, unknown> = {
        id: (data.id as string) || crypto.randomUUID(),
        created_at: (data.created_at as string) || now,
        ...data,
        updated_at: now,
        tenant_id: (data.tenant_id as string | null) ?? "",
        provider_workspace_id: (data.provider_workspace_id as string) || "default",
      };
      if (row.tenant_id === null || row.tenant_id === undefined) row.tenant_id = "";
      const cols = COLUMNS.filter((c) => row[c] !== undefined);
      const placeholders = cols.map(() => "?").join(", ");
      const updates = cols
        .filter((c) => c !== "id" && c !== "created_at")
        .map((c) => `${c} = excluded.${c}`)
        .join(", ");
      await db
        .prepare(
          `INSERT INTO connectors (${cols.join(", ")}) VALUES (${placeholders})
           ON CONFLICT(tenant_id, user_id, provider, provider_workspace_id) DO UPDATE SET ${updates}`
        )
        .bind(...cols.map((c) => enc(c, row[c])))
        .run();
      return [revive(row)];
    },
    async update(_table: string, filters: Record<string, string>, data: Record<string, unknown>) {
      const setData: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
      const setKeys = Object.keys(setData);
      const whereKeys = Object.keys(filters);
      await db
        .prepare(
          `UPDATE connectors SET ${setKeys.map((k) => `${k} = ?`).join(", ")} WHERE ${whereKeys
            .map((k) => `${k} = ?`)
            .join(" AND ")}`
        )
        .bind(...setKeys.map((k) => enc(k, setData[k])), ...whereKeys.map((k) => filters[k]))
        .run();
      return [];
    },
  };
}

/**
 * Build token endpoint configuration from OAuth registry
 */
function buildTokenEndpoint(provider: string, config: any) {
  const getBody = (code: string, redirectUri: string, clientId: string, clientSecret: string) => {
    const base: Record<string, string> = {
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    };

    switch (provider) {
      case "slack":
        return {
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        };
      case "notion":
        return { grant_type: "authorization_code", redirect_uri: redirectUri, code };
      case "intercom":
        return { client_id: clientId, client_secret: clientSecret, code };
      case "stripe":
        return { grant_type: "authorization_code", client_secret: clientSecret, code };
      default:
        return base;
    }
  };

  let url = config.endpoints.token;
  url = url
    .replace("{subdomain}", "SUBDOMAIN")
    .replace("{site}", "SITE")
    .replace("{munchkinId}", "MUNCHKIN")
    .replace("{shop}", "SHOP")
    .replace("{host}", "HOST")
    .replace("{region}", "REGION")
    .replace("{server}", "SERVER");

  return { url, getBody };
}

const TOKEN_ENDPOINTS: Record<
  string,
  {
    url: string;
    getBody: (
      code: string,
      redirectUri: string,
      clientId: string,
      clientSecret: string
    ) => Record<string, string>;
  }
> = (() => {
  const endpoints: Record<string, any> = {};
  for (const [provider, config] of Object.entries(OAUTH_REGISTRY)) {
    if (config.authType === "oauth2") {
      endpoints[provider] = buildTokenEndpoint(provider, config);
    }
  }
  return endpoints;
})();

/**
 * OAuth Environment Variable Mapping
 */
const OAUTH_ENV_MAP: Record<string, [string, string]> = {
  salesforce: ["SALESFORCE_CLIENT_ID", "SALESFORCE_CLIENT_SECRET"],
  hubspot: ["HUBSPOT_CLIENT_ID", "HUBSPOT_CLIENT_SECRET"],
  pipedrive: ["PIPEDRIVE_CLIENT_ID", "PIPEDRIVE_CLIENT_SECRET"],
  "zoho-crm": ["ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET"],
  freshsales: ["FRESHSALES_CLIENT_ID", "FRESHSALES_CLIENT_SECRET"],
  close: ["CLOSE_API_KEY", ""],
  zendesk: ["ZENDESK_CLIENT_ID", "ZENDESK_CLIENT_SECRET"],
  freshdesk: ["FRESHDESK_CLIENT_ID", "FRESHDESK_CLIENT_SECRET"],
  front: ["FRONT_CLIENT_ID", "FRONT_CLIENT_SECRET"],
  helpscout: ["HELPSCOUT_CLIENT_ID", "HELPSCOUT_CLIENT_SECRET"],
  intercom: ["INTERCOM_CLIENT_ID", "INTERCOM_CLIENT_SECRET"],
  kustomer: ["KUSTOMER_CLIENT_ID", "KUSTOMER_CLIENT_SECRET"],
  "whatsapp-business": ["WHATSAPP_BUSINESS_CLIENT_ID", "WHATSAPP_BUSINESS_CLIENT_SECRET"],
  crisp: ["CRISP_CLIENT_ID", "CRISP_CLIENT_SECRET"],
  drift: ["DRIFT_CLIENT_ID", "DRIFT_CLIENT_SECRET"],
  stripe: ["STRIPE_CLIENT_ID", "STRIPE_CLIENT_SECRET"],
  chargebee: ["CHARGEBEE_API_KEY", "CHARGEBEE_SITE"],
  paddle: ["PADDLE_API_KEY", "PADDLE_VENDOR_ID"],
  quickbooks: ["QUICKBOOKS_CLIENT_ID", "QUICKBOOKS_CLIENT_SECRET"],
  xero: ["XERO_CLIENT_ID", "XERO_CLIENT_SECRET"],
  freshbooks: ["FRESHBOOKS_CLIENT_ID", "FRESHBOOKS_CLIENT_SECRET"],
  "hubspot-marketing": ["HUBSPOT_CLIENT_ID", "HUBSPOT_CLIENT_SECRET"],
  mailchimp: ["MAILCHIMP_CLIENT_ID", "MAILCHIMP_CLIENT_SECRET"],
  marketo: ["MARKETO_CLIENT_ID", "MARKETO_CLIENT_SECRET"],
  braze: ["BRAZE_API_KEY", "BRAZE_REST_ENDPOINT"],
  segment: ["SEGMENT_WRITE_KEY", ""],
  sendgrid: ["SENDGRID_API_KEY", ""],
  "customer-io": ["CUSTOMERIO_SITE_ID", "CUSTOMERIO_API_KEY"],
  klaviyo: ["KLAVIYO_CLIENT_ID", "KLAVIYO_CLIENT_SECRET"],
  "google-analytics": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  mixpanel: ["MIXPANEL_API_KEY", "MIXPANEL_API_SECRET"],
  amplitude: ["AMPLITUDE_API_KEY", "AMPLITUDE_SECRET_KEY"],
  heap: ["HEAP_APP_ID", "HEAP_API_KEY"],
  tableau: ["TABLEAU_CLIENT_ID", "TABLEAU_CLIENT_SECRET"],
  metabase: ["METABASE_API_KEY", "METABASE_INSTANCE_URL"],
  jira: ["JIRA_CLIENT_ID", "JIRA_CLIENT_SECRET"],
  asana: ["ASANA_CLIENT_ID", "ASANA_CLIENT_SECRET"],
  linear: ["LINEAR_CLIENT_ID", "LINEAR_CLIENT_SECRET"],
  monday: ["MONDAY_CLIENT_ID", "MONDAY_CLIENT_SECRET"],
  clickup: ["CLICKUP_CLIENT_ID", "CLICKUP_CLIENT_SECRET"],
  trello: ["TRELLO_API_KEY", "TRELLO_API_TOKEN"],
  github: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
  gitlab: ["GITLAB_CLIENT_ID", "GITLAB_CLIENT_SECRET"],
  bitbucket: ["BITBUCKET_CLIENT_ID", "BITBUCKET_CLIENT_SECRET"],
  shopify: ["SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET"],
  woocommerce: ["WOOCOMMERCE_CONSUMER_KEY", "WOOCOMMERCE_CONSUMER_SECRET"],
  bigcommerce: ["BIGCOMMERCE_CLIENT_ID", "BIGCOMMERCE_CLIENT_SECRET"],
  bamboohr: ["BAMBOOHR_CLIENT_ID", "BAMBOOHR_CLIENT_SECRET"],
  gmail: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  outlook: ["OUTLOOK_CLIENT_ID", "OUTLOOK_CLIENT_SECRET"],
  slack: ["SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET"],
  teams: ["TEAMS_CLIENT_ID", "TEAMS_CLIENT_SECRET"],
  discord: ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"],
  zoom: ["ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET"],
  "google-calendar": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  notion: ["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET"],
  "google-drive": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  dropbox: ["DROPBOX_CLIENT_ID", "DROPBOX_CLIENT_SECRET"],
  onedrive: ["ONEDRIVE_CLIENT_ID", "ONEDRIVE_CLIENT_SECRET"],
  airtable: ["AIRTABLE_CLIENT_ID", "AIRTABLE_CLIENT_SECRET"],
  calendly: ["CALENDLY_CLIENT_ID", "CALENDLY_CLIENT_SECRET"],
  "ai-chat": ["AI_CHAT_API_KEY", ""],
  mcp: ["MCP_API_KEY", ""],
  openai: ["OPENAI_API_KEY", ""],
};

function getOAuthCreds(
  provider: string,
  env: Env
): { clientId: string; clientSecret: string } | null {
  const mapping = OAUTH_ENV_MAP[provider];
  if (!mapping) {
    console.warn(`[oauth] No environment mapping for provider: ${provider}`);
    return null;
  }

  const [idVar, secretVar] = mapping;
  const clientId = (env as any)[idVar];
  const clientSecret = (env as any)[secretVar];

  if (!clientId && !clientSecret) {
    return null;
  }

  return {
    clientId: clientId || "",
    clientSecret: clientSecret || "",
  };
}

/**
 * Build authorization URL builder for a provider
 */
function buildAuthUrlBuilder(provider: string, config: any) {
  return (clientId: string, redirectUri: string, state: string): string => {
    const scopes = config.scopes?.join(" ") || "";
    let authorizeUrl = config.endpoints.authorize;

    authorizeUrl = authorizeUrl
      .replace("{subdomain}", "SUBDOMAIN")
      .replace("{site}", "SITE")
      .replace("{munchkinId}", "MUNCHKIN")
      .replace("{shop}", "SHOP")
      .replace("{host}", "HOST")
      .replace("{region}", "REGION")
      .replace("{server}", "SERVER");

    const params = new URLSearchParams();
    params.set("client_id", clientId);
    params.set("redirect_uri", redirectUri);
    params.set("state", state);
    params.set("response_type", "code");

    if (config.authType === "oauth2") {
      if (scopes) params.set("scope", scopes);
      if (config.pkce) params.set("code_challenge_method", "S256");

      const googleProviders = [
        "google",
        "gmail",
        "outlook",
        "google-calendar",
        "google-drive",
        "google-analytics",
      ];
      if (googleProviders.includes(provider)) {
        params.set("access_type", "offline");
        params.set("prompt", "consent");
      }
      if (provider === "jira") {
        params.set("audience", "api.atlassian.com");
        params.set("prompt", "consent");
      }
      if (provider === "notion") {
        params.set("owner", "user");
      }
    }

    return `${authorizeUrl}?${params.toString()}`;
  };
}

const AUTH_URLS: Record<string, (clientId: string, redirectUri: string, state: string) => string> =
  (() => {
    const urls: Record<string, any> = {};
    for (const [provider, config] of Object.entries(OAUTH_REGISTRY)) {
      if (config.authType === "oauth2" && config.endpoints.authorize) {
        urls[provider] = buildAuthUrlBuilder(provider, config);
      }
    }
    return urls;
  })();

const OAUTH_READY_PROVIDERS = new Set(Object.keys(AUTH_URLS));

/**
 * GET /v1/connectors/stats
 */
app.get("/v1/connectors/stats", async (c) => {
  return c.json({
    total: OAUTH_STATS.total,
    flowA: OAUTH_STATS.flowA,
    flowB: OAUTH_STATS.flowB,
    flowC: OAUTH_STATS.flowC,
    byAuthType: OAUTH_STATS.byAuthType,
    oauthReady: OAUTH_READY_PROVIDERS.size,
  });
});

/**
 * GET /v1/connectors/:provider/authorize
 */
app.get("/v1/connectors/:provider/authorize", async (c) => {
  const provider = c.req.param("provider");
  const origin = c.req.query("origin") || c.req.header("X-Origin") || "https://integratewise.ai";
  const userId = c.req.header("x-user-id") || c.req.header("x-spine-context-user-id");
  const tenantId = c.req.header("x-tenant-id") || c.req.header("x-spine-context-tenant-id");

  if (!OAUTH_READY_PROVIDERS.has(provider)) {
    return c.json({
      authUrl: null,
      state: null,
      provider,
      authReady: false,
      message: "OAuth not yet configured for this connector. Coming soon.",
    });
  }

  const buildUrl = AUTH_URLS[provider];
  if (!buildUrl) {
    return c.json({ error: `Unsupported provider: ${provider}` }, 400);
  }

  const creds = getOAuthCreds(provider, c.env);
  if (!creds) {
    return c.json({ error: `OAuth credentials not configured for ${provider}` }, 500);
  }

  const state = crypto.randomUUID();
  const redirectUri = `${origin}/oauth/callback/${provider}`;
  const authUrl = buildUrl(creds.clientId, redirectUri, state);

  if (c.env.OAUTH_STATE_KV) {
    await c.env.OAUTH_STATE_KV.put(
      `oauth_state:${state}`,
      JSON.stringify({
        provider,
        origin,
        user_id: userId || null,
        tenant_id: tenantId || null,
        created_at: Date.now(),
      }),
      { expirationTtl: 600 }
    );
  }

  return c.json({ authUrl, state, provider, authReady: true });
});

/**
 * GET /v1/connectors/:provider/callback
 */
app.get("/v1/connectors/:provider/callback", async (c) => {
  const provider = c.req.param("provider");
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");
  const origin = c.req.header("X-Origin") || "https://integratewise.ai";

  if (error) {
    return c.json(
      { error: `OAuth denied: ${error}` },
      { status: 400, headers: { "X-Redirect-URL": `${origin}/integrations?error=${error}` } }
    );
  }

  if (!code) {
    return c.json({ error: "Missing authorization code" }, 400);
  }

  if (!state) {
    return c.json(
      { error: "Missing state parameter — possible CSRF" },
      { status: 403, headers: { "X-Redirect-URL": `${origin}/integrations?error=missing_state` } }
    );
  }

  let stateUserId: string | null = null;
  let stateTenantId: string | null = null;
  if (c.env.OAUTH_STATE_KV) {
    const storedState = await c.env.OAUTH_STATE_KV.get(`oauth_state:${state}`);
    if (!storedState) {
      return c.json(
        { error: "Invalid or expired state — possible CSRF" },
        {
          status: 403,
          headers: { "X-Redirect-URL": `${origin}/integrations?error=state_mismatch` },
        }
      );
    }
    try {
      const parsed = JSON.parse(storedState) as { user_id?: string; tenant_id?: string };
      stateUserId = parsed.user_id || null;
      stateTenantId = parsed.tenant_id || null;
    } catch {
      /* ignore */
    }
    await c.env.OAUTH_STATE_KV.delete(`oauth_state:${state}`);
  }

  const tokenConfig = TOKEN_ENDPOINTS[provider];
  if (!tokenConfig) {
    return c.json({ error: `Unsupported provider: ${provider}` }, 400);
  }

  const creds = getOAuthCreds(provider, c.env);
  if (!creds) {
    return c.json({ error: `OAuth credentials not configured for ${provider}` }, 500);
  }

  const redirectUri = `${origin}/oauth/callback/${provider}`;

  try {
    const tokenBody = tokenConfig.getBody(code, redirectUri, creds.clientId, creds.clientSecret);

    const isNotion = provider === "notion";
    const tokenHeaders: Record<string, string> = {
      "Content-Type":
        provider === "github" ? "application/json" : "application/x-www-form-urlencoded",
    };
    if (provider === "github") tokenHeaders["Accept"] = "application/json";
    if (isNotion) {
      tokenHeaders["Authorization"] = `Basic ${btoa(`${creds.clientId}:${creds.clientSecret}`)}`;
      tokenHeaders["Content-Type"] = "application/json";
    }

    const body =
      provider === "github" || isNotion
        ? JSON.stringify(tokenBody)
        : new URLSearchParams(tokenBody).toString();

    const tokenRes = await fetch(tokenConfig.url, {
      method: "POST",
      headers: tokenHeaders,
      body,
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error(`[connectors] Token exchange failed for ${provider}:`, errText);
      return c.json(
        { error: "Token exchange failed" },
        {
          status: 502,
          headers: { "X-Redirect-URL": `${origin}/integrations?error=token_exchange_failed` },
        }
      );
    }

    const tokens: any = await tokenRes.json();

    const accessToken = tokens.access_token || tokens.authed_user?.access_token;
    const refreshToken = tokens.refresh_token || null;
    const expiresIn = tokens.expires_in ? Number(tokens.expires_in) : null;
    const tokenType = tokens.token_type || "bearer";
    const scopes = tokens.scope
      ? typeof tokens.scope === "string"
        ? tokens.scope.split(/[,\s]+/)
        : tokens.scope
      : [];

    let providerUserId: string | null = null;
    let providerWorkspaceId: string | null = null;
    let providerWorkspaceName: string | null = null;

    if (provider === "slack") {
      providerUserId = tokens.authed_user?.id;
      providerWorkspaceId = tokens.team?.id;
      providerWorkspaceName = tokens.team?.name;
    } else if (provider === "notion") {
      providerWorkspaceId = tokens.workspace_id;
      providerWorkspaceName = tokens.workspace_name;
      providerUserId = tokens.owner?.user?.id;
    } else if (provider === "hubspot") {
      providerUserId = String(tokens.hub_id || tokens.user_id || "");
    } else if (provider === "salesforce") {
      try {
        if (tokens.id && accessToken) {
          const identityRes = await fetch(tokens.id, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (identityRes.ok) {
            const identity: any = await identityRes.json();
            if (identity.user_id) providerUserId = String(identity.user_id);
            if (identity.organization_id) providerWorkspaceId = String(identity.organization_id);
            if (identity.organization_name)
              providerWorkspaceName = String(identity.organization_name);
          }
        }
      } catch {
        /* optional */
      }
    } else if (provider === "github") {
      const installationId =
        tokens.installation?.id || tokens.installation_id || c.req.query("installation_id");
      if (installationId) providerWorkspaceId = String(installationId);
      try {
        const userRes = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "IntegrateWise" },
        });
        if (userRes.ok) {
          const user: any = await userRes.json();
          providerUserId = String(user.id);
        }
      } catch {
        /* optional */
      }
    }

    const userId =
      stateUserId ?? c.req.header("x-user-id") ?? c.req.header("x-spine-context-user-id");
    const tenantId =
      stateTenantId ?? c.req.header("x-tenant-id") ?? c.req.header("x-spine-context-tenant-id");

    if (!userId) {
      return c.json(
        { error: "User not authenticated" },
        {
          status: 401,
          headers: { "X-Redirect-URL": `${origin}/integrations?error=not_authenticated` },
        }
      );
    }

    const sb = connectorsDb(c.env);
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const encryptedAccessToken = await encryptToken(accessToken, c.env.TOKEN_ENCRYPTION_KEY);
    const encryptedRefreshToken = refreshToken
      ? await encryptToken(refreshToken, c.env.TOKEN_ENCRYPTION_KEY)
      : null;

    const providerWorkspaceKey = providerWorkspaceId || "default";
    const metadata: Record<string, unknown> = {
      connected_at: new Date().toISOString(),
      raw_scopes: tokens.scope,
      client_id: creds.clientId,
      enc_client_secret: creds.clientSecret
        ? await encryptToken(creds.clientSecret, c.env.TOKEN_ENCRYPTION_KEY)
        : "",
    };
    if (provider === "salesforce") {
      const instanceUrl =
        typeof tokens.instance_url === "string"
          ? tokens.instance_url
          : typeof tokens.instanceUrl === "string"
            ? tokens.instanceUrl
            : null;
      if (instanceUrl) metadata.instance_url = instanceUrl;
      if (providerWorkspaceId) {
        metadata.salesforce_orgs = [
          { org_id: providerWorkspaceId, org_name: providerWorkspaceName },
        ];
        metadata.primary_salesforce_org_id = providerWorkspaceId;
      }
    }

    await sb.upsert(
      "connectors",
      {
        user_id: userId,
        tenant_id: tenantId || null,
        provider,
        status: "connected",
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_type: tokenType,
        expires_at: expiresAt,
        provider_user_id: providerUserId,
        provider_workspace_id: providerWorkspaceKey,
        provider_workspace_name: providerWorkspaceName,
        scopes,
        sync_enabled: true,
        tokens_encrypted: true,
        metadata,
      },
      "tenant_id,user_id,provider,provider_workspace_id"
    );

    // Installation-id → tenant bindings (for webhook tenant resolution)
    if (tenantId && c.env.CONNECTOR_STATUS) {
      try {
        if (provider === "slack" && providerWorkspaceId) {
          await c.env.CONNECTOR_STATUS.put(
            `slack:workspace:${providerWorkspaceId}:tenant`,
            tenantId
          );
        }
        if (provider === "hubspot") {
          const portalId =
            (tokens?.hub_id as string | number | undefined) ??
            (tokens?.portalId as string | number | undefined) ??
            (tokens?.portal_id as string | number | undefined);
          if (portalId) {
            await c.env.CONNECTOR_STATUS.put(`hubspot:portal:${String(portalId)}:tenant`, tenantId);
          }
        }
        if (provider === "github" && providerWorkspaceId) {
          await c.env.CONNECTOR_STATUS.put(
            `github:installation:${providerWorkspaceId}:tenant`,
            tenantId
          );
        }
        if (provider === "salesforce" && providerWorkspaceId) {
          await c.env.CONNECTOR_STATUS.put(
            `salesforce:org:${providerWorkspaceId}:tenant`,
            tenantId
          );
        }
      } catch (e) {
        console.warn("[connectors] Failed to write installation→tenant KV mapping", e);
      }
    }

    // Flow classification
    const flowType = classifyConnector(provider);
    const flowDescription = getFlowTypeDescription(flowType);
    metadata.flow_type = flowType;
    metadata.flow_description = flowDescription;
    metadata.routing = flowType === "A" ? "pipeline" : flowType === "B" ? "knowledge" : "d1-buffer";

    if (tenantId) {
      try {
        await syncTenantConnectedConnector({
          supabaseUrl: c.env.SUPABASE_URL,
          serviceRoleKey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          tenantId,
          connectorId: provider,
          connected: true,
          flowType,
        });
      } catch (error) {
        console.warn(`[connectors] Failed to update tenant schema config for ${provider}:`, error);
      }

      if (flowType === "A" || flowType === "B") {
        c.executionCtx.waitUntil(
          triggerInitialConnectorHydration(c.env, tenantId, provider).catch((error) => {
            console.error(
              `[connectors] Failed to queue initial creamy sync for ${provider}:`,
              error
            );
          })
        );
      } else if (flowType === "C") {
        c.executionCtx.waitUntil(
          initializeD1Buffer(tenantId, provider, c.env).catch((error) => {
            console.error(`[connectors] Failed to initialize D1 buffer for ${provider}:`, error);
          })
        );
      }
    }

    console.log(`[connectors] ✅ ${provider} connected for user ${userId} (Flow ${flowType})`);

    return c.json(
      {
        success: true,
        provider,
        flowType,
        flowDescription,
        routing: flowType === "A" ? "pipeline" : flowType === "B" ? "knowledge" : "d1-buffer",
      },
      {
        headers: {
          "X-Redirect-URL": `${origin}/integrations?connected=${provider}&flow=${flowType}`,
        },
      }
    );
  } catch (err: any) {
    console.error(`[connectors] callback error for ${provider}:`, err);
    return c.json(
      { error: err.message },
      { status: 500, headers: { "X-Redirect-URL": `${origin}/integrations?error=internal` } }
    );
  }
});

/**
 * POST /v1/connectors/:provider/disconnect
 */
app.post("/v1/connectors/:provider/disconnect", async (c) => {
  const provider = c.req.param("provider");
  const userId = c.req.header("x-user-id") || c.req.header("x-spine-context-user-id");
  const tenantId = c.req.header("x-tenant-id") || c.req.header("x-spine-context-tenant-id") || "";

  if (!userId) {
    return c.json({ error: "User not authenticated" }, 401);
  }

  try {
    const sb = connectorsDb(c.env);
    const targetStatus: ConnectorFormalStatus = "paused";
    await sb.update(
      "connectors",
      { user_id: userId, provider },
      {
        status: targetStatus,
        access_token: null,
        refresh_token: null,
        expires_at: null,
        sync_enabled: false,
        metadata: { disconnected_at: new Date().toISOString(), previous_status: "connected" },
      }
    );

    if (tenantId) {
      try {
        await syncTenantConnectedConnector({
          supabaseUrl: c.env.SUPABASE_URL,
          serviceRoleKey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          tenantId,
          connectorId: provider,
          connected: false,
        });
      } catch (error) {
        console.warn(
          `[connectors] Failed to remove ${provider} from tenant schema config ${tenantId}:`,
          error
        );
      }
    }

    return c.json({ success: true, provider, status: targetStatus });
  } catch (err: any) {
    console.error(`[connectors] disconnect error for ${provider}:`, err);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /v1/connectors/:provider/status
 */
app.get("/v1/connectors/:provider/status", async (c) => {
  const provider = c.req.param("provider");
  const userId = c.req.header("x-user-id") || c.req.header("x-spine-context-user-id");

  if (!userId) {
    return c.json({ error: "User not authenticated" }, 401);
  }

  try {
    const sb = connectorsDb(c.env);
    const rows = await sb.select("connectors", { user_id: userId, provider });

    if (!rows || rows.length === 0) {
      return c.json({ provider, status: "not_connected" });
    }

    const conn = rows[0];
    return c.json({
      provider,
      status: conn.status,
      provider_workspace_name: conn.provider_workspace_name,
      last_sync_at: conn.last_sync_at,
      sync_enabled: conn.sync_enabled,
      sync_error: conn.sync_error,
      connected_at: conn.metadata?.connected_at,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /v1/connectors/list
 */
app.get("/v1/connectors/list", async (c) => {
  const userId = c.req.header("x-user-id") || c.req.header("x-spine-context-user-id");

  if (!userId) {
    return c.json({ error: "User not authenticated" }, 401);
  }

  try {
    const sb = connectorsDb(c.env);
    const rows = await sb.select(
      "connectors",
      { user_id: userId },
      "provider,status,provider_workspace_name,last_sync_at,sync_enabled,sync_error,metadata"
    );

    return c.json({ connectors: rows || [] });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /v1/connectors/catalog
 */
app.get("/v1/connectors/catalog", async (c) => {
  try {
    const catalog = getSerializableCatalog();
    const departmentsParam = c.req.query("departments");
    const industriesParam = c.req.query("industries");

    let filteredCatalog = catalog;

    if (departmentsParam) {
      const deptFilter = new Set(departmentsParam.split(",").map((d) => d.trim()));
      filteredCatalog = filteredCatalog.filter(
        (conn) => !conn.departments || conn.departments.some((dept) => deptFilter.has(dept))
      );
    }

    if (industriesParam) {
      const industryFilter = new Set(industriesParam.split(",").map((i) => i.trim()));
      filteredCatalog = filteredCatalog.filter(
        (conn) =>
          !conn.industries || conn.industries.some((industry) => industryFilter.has(industry))
      );
    }

    const connectors = filteredCatalog.map((conn) => ({
      ...conn,
      authReady: OAUTH_READY_PROVIDERS.has(conn.id),
    }));
    return c.json({ connectors });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ============================================================================
// MIDDLEWARE EXPORT (for Gateway)
// ============================================================================

/**
 * Middleware to resolve tenant context
 * Used by the Gateway service for request routing
 */
export async function tenantMiddleware(request: Request, env: Env): Promise<Response | null> {
  try {
    const context = await resolveTenantContext(request, env);

    const newHeaders = new Headers(request.headers);
    newHeaders.set("x-tenant-id", context.tenantId);
    newHeaders.set("x-workspace-id", context.workspaceId);
    newHeaders.set("x-tenant-plan", context.plan);
    newHeaders.set("x-tenant-features", context.features.join(","));

    return null; // Continue to next handler
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export default app;
