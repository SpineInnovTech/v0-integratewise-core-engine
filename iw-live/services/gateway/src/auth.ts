/**
 * Auth Endpoints — CF Edge JWT from D1
 *
 * CANONICAL AUTH (real entry points):
 *   - Social OAuth: Google + GitHub  (handleOAuthStart / handleOAuthCallback)
 *   - Cloudflare Zero Trust (CF Access) — verified upstream in index.ts
 *   - /me, /update: JWT-protected session + profile reads/writes
 *
 * QUARANTINED (off by default): email + password signup/login/reset.
 *   Per platform doctrine, password auth is NOT a supported entry point.
 *   These handlers stay in-tree for a controlled transition only and are
 *   gated behind env.ALLOW_PASSWORD_AUTH === "true". When disabled they
 *   return 501 and steer users to OAuth, so no weak credential path is
 *   ever exposed in production.
 *
 * Per D-011: CF edge creates user first. No Supabase for initial users.
 * Promotion to Supabase happens manually after reviewing usage patterns.
 */

import { signJWT, verifyJWT } from "./lib/jwt";
import type { Env } from "./index";

/** Whether the quarantined email/password endpoints are enabled. Default: OFF. */
function passwordAuthEnabled(env: Env): boolean {
  return (env as any).ALLOW_PASSWORD_AUTH === "true";
}

/** Standard response when a quarantined password endpoint is hit while disabled. */
function passwordAuthDisabled(): Response {
  return new Response(
    JSON.stringify({
      error: "password_auth_disabled",
      message: "Email/password sign-in is disabled. Use Google or GitHub sign-in.",
      providers: ["google", "github"],
    }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Route /api/v1/auth/* requests to the appropriate auth handler.
 */
export async function routeAuthRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/v1/auth", "");

  // CORS preflight — must respond before any auth logic
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-tenant-id, x-user-id",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // ── Quarantined: email/password endpoints (off unless ALLOW_PASSWORD_AUTH=true) ──
  if (path === "/signup" && request.method === "POST") {
    return passwordAuthEnabled(env) ? handleSignup(request, env) : passwordAuthDisabled();
  }
  if (path === "/login" && request.method === "POST") {
    return passwordAuthEnabled(env) ? handleLogin(request, env) : passwordAuthDisabled();
  }
  if (path === "/me" && request.method === "GET") {
    return handleMe(request, env);
  }
  if (path === "/update" && request.method === "PATCH") {
    return handleUpdate(request, env);
  }
  if ((path === "/reset-password" || path === "/reset-password/") && request.method === "POST") {
    return passwordAuthEnabled(env) ? handleResetPassword(request, env) : passwordAuthDisabled();
  }

  // Social OAuth (Google / GitHub) — browser navigations, public.
  const oauthMatch = path.match(/^\/oauth\/(google|github)\/(start|callback)$/);
  if (oauthMatch && request.method === "GET") {
    const provider = oauthMatch[1] as "google" | "github";
    return oauthMatch[2] === "start"
      ? handleOAuthStart(request, env, provider)
      : handleOAuthCallback(request, env, provider);
  }

  return json({ error: "Unknown auth endpoint" }, 404);
}

// ============================================================================
// SIGNUP — POST /api/v1/auth/signup
// ============================================================================

async function handleSignup(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { email, password, name, company_name, slug } = body;

  if (!email || !password || !name) {
    return json({ error: "email, password, and name are required" }, 400);
  }

  // Use the tenants service (embedded) to create tenant + user
  const tenantId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const now = new Date().toISOString();
  const tenantSlug =
    slug ||
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");

  // Hash password (simple SHA-256 for edge — upgrade to bcrypt/argon2 for prod)
  const passwordHash = await hashPassword(password);

  // Check if email already exists
  const tenantsDb = getTenantsDb(env);
  if (!tenantsDb) return json({ error: "Database not available" }, 503);

  const existing = await tenantsDb
    .prepare(`SELECT id FROM tenant_users WHERE email = ?`)
    .bind(email)
    .first();

  if (existing) {
    return json({ error: "Email already registered" }, 409);
  }

  // Check slug uniqueness
  const slugExists = await tenantsDb
    .prepare(`SELECT id FROM tenants WHERE slug = ?`)
    .bind(tenantSlug)
    .first();

  if (slugExists) {
    return json({ error: "Workspace slug already taken" }, 409);
  }

  // Batch: create tenant + user + workspace atomically
  await tenantsDb.batch([
    tenantsDb
      .prepare(
        `INSERT INTO tenants (id, name, slug, plan, status, settings, metadata, created_at, updated_at)
         VALUES (?, ?, ?, 'free', 'active', '{}', '{}', ?, ?)`
      )
      .bind(tenantId, company_name || name, tenantSlug, now, now),

    tenantsDb
      .prepare(
        `INSERT INTO tenant_users (id, tenant_id, email, name, role, status, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'owner', 'active', ?, ?, ?)`
      )
      .bind(
        userId,
        tenantId,
        email,
        name,
        JSON.stringify({ password_hash: passwordHash }),
        now,
        now
      ),

    tenantsDb
      .prepare(
        `INSERT INTO workspaces (id, tenant_id, name, type, settings, created_at, updated_at)
         VALUES (?, ?, 'Default', 'production', '{}', ?, ?)`
      )
      .bind(workspaceId, tenantId, now, now),
  ]);

  // Issue JWT
  const token = await signJWT(
    {
      iss: "https://auth.integratewise.ai",
      aud: "https://app.integratewise.ai",
      sub: userId,
      tenant_id: tenantId,
      role: "owner",
      scope: "full",
      exp: Math.floor(Date.now() / 1000) + 86400, // 24h
    },
    env.OAUTH_PRIVATE_KEY
  );

  return json(
    {
      token,
      user: { id: userId, email, name, role: "owner" },
      tenant: { id: tenantId, name: company_name || name, slug: tenantSlug, plan: "free" },
      workspace: { id: workspaceId, name: "Default" },
    },
    201
  );
}

// ============================================================================
// LOGIN — POST /api/v1/auth/login
// ============================================================================

async function handleLogin(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { email, password } = body;

  if (!email || !password) {
    return json({ error: "email and password are required" }, 400);
  }

  const tenantsDb = getTenantsDb(env);
  if (!tenantsDb) return json({ error: "Database not available" }, 503);

  // Find user by email
  const user = await tenantsDb
    .prepare(
      `SELECT tu.id, tu.tenant_id, tu.email, tu.name, tu.role, tu.metadata,
              t.name as tenant_name, t.slug, t.plan
       FROM tenant_users tu
       JOIN tenants t ON t.id = tu.tenant_id
       WHERE tu.email = ? AND tu.status = 'active'`
    )
    .bind(email)
    .first<{
      id: string;
      tenant_id: string;
      email: string;
      name: string;
      role: string;
      metadata: string;
      tenant_name: string;
      slug: string;
      plan: string;
    }>();

  if (!user) {
    return json({ error: "Invalid credentials" }, 401);
  }

  // Verify password
  const metadata = user.metadata ? JSON.parse(user.metadata) : {};
  const storedHash = metadata.password_hash;

  if (!storedHash) {
    // User exists but has no password (e.g., Google OAuth user)
    return json({ error: "Use Google sign-in for this account" }, 401);
  }

  const passwordHash = await hashPassword(password);
  if (passwordHash !== storedHash) {
    return json({ error: "Invalid credentials" }, 401);
  }

  // Update last_seen
  await tenantsDb
    .prepare(`UPDATE tenant_users SET last_seen_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), user.id)
    .run();

  // Issue JWT
  const token = await signJWT(
    {
      iss: "https://auth.integratewise.ai",
      aud: "https://app.integratewise.ai",
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      scope: "full",
      exp: Math.floor(Date.now() / 1000) + 86400, // 24h
    },
    env.OAUTH_PRIVATE_KEY
  );

  return json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    tenant: { id: user.tenant_id, name: user.tenant_name, slug: user.slug, plan: user.plan },
  });
}

// ============================================================================
// ME — GET /api/v1/auth/me
// ============================================================================

async function handleMe(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  const result = await verifyJWT(
    token,
    "https://auth.integratewise.ai",
    "https://app.integratewise.ai"
  );

  if (!result.valid || !result.payload) {
    return json({ error: result.error || "Invalid token" }, 401);
  }

  const { sub: userId, tenant_id, role } = result.payload;

  const tenantsDb = getTenantsDb(env);
  if (!tenantsDb) return json({ error: "Database not available" }, 503);

  const user = await tenantsDb
    .prepare(
      `SELECT tu.id, tu.email, tu.name, tu.role, tu.status,
              t.id as tenant_id, t.name as tenant_name, t.slug, t.plan, t.settings
       FROM tenant_users tu
       JOIN tenants t ON t.id = tu.tenant_id
       WHERE tu.id = ? AND tu.tenant_id = ?`
    )
    .bind(userId, tenant_id)
    .first();

  if (!user) {
    return json({ error: "User not found" }, 404);
  }

  return json({
    user: {
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
      role: (user as any).role,
    },
    tenant: {
      id: (user as any).tenant_id,
      name: (user as any).tenant_name,
      slug: (user as any).slug,
      plan: (user as any).plan,
    },
  });
}

// ============================================================================
// UPDATE — PATCH /api/v1/auth/update
// Persists onboarding metadata (department, domain, onboarding_complete, etc.)
// to tenant_users.metadata in D1. No Supabase.
// ============================================================================

async function handleUpdate(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  const result = await verifyJWT(
    token,
    "https://auth.integratewise.ai",
    "https://app.integratewise.ai"
  );

  if (!result.valid || !result.payload) {
    return json({ error: result.error || "Invalid token" }, 401);
  }

  const { sub: userId, tenant_id } = result.payload;

  let patch: Record<string, any>;
  try {
    patch = await request.json();
  } catch {
    patch = {};
  }

  const db = getTenantsDb(env);
  if (!db) return json({ error: "Database not available" }, 503);

  // Merge incoming patch into existing metadata JSON.
  const existing = await db
    .prepare(`SELECT metadata, department FROM tenant_users WHERE id = ? AND tenant_id = ?`)
    .bind(userId, tenant_id)
    .first<{ metadata: string | null; department: string | null }>();

  let metadata: Record<string, any> = {};
  if (existing?.metadata) {
    try {
      metadata = JSON.parse(existing.metadata);
    } catch {
      /* ignore */
    }
  }
  const merged = { ...metadata, ...patch };
  const department = patch.department || existing?.department || null;

  await db
    .prepare(
      `UPDATE tenant_users SET metadata = ?, department = ?, updated_at = datetime('now')
       WHERE id = ? AND tenant_id = ?`
    )
    .bind(JSON.stringify(merged), department, userId, tenant_id)
    .run();

  // Never echo sensitive fields (password hashes, tokens) back to the client.
  const safe = { ...merged };
  delete safe.password_hash;
  delete safe.passwordHash;
  delete safe.password;
  return json({ success: true, metadata: safe });
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the D1 database binding from the env.
 * The tenants service is embedded in gateway — we access its DB binding.
 */
function getTenantsDb(env: Env): D1Database | null {
  // The tenants app is imported directly; it uses env.DB but the gateway
  // doesn't have a DB binding in its own wrangler.toml. We need to add it.
  // For now, fallback to the CONNECTOR service binding's D1 or return null.
  return (env as any).DB || null;
}

/**
 * Simple password hashing using SHA-256.
 * For production: upgrade to scrypt or argon2id via a dedicated CF Worker.
 */
async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + "iw-salt-2026");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function handleResetPassword(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { email } = body;
  if (!email) {
    return json({ error: "email is required" }, 400);
  }

  // NOTE: Real email delivery is ops-plane (not product plane per doctrine).
  // For now we ack success. In production the ops email worker or external
  // can pick up from D1 audit or KV and send the reset link/token.
  // The frontend already calls this; this wires the route so it doesn't 404.
  console.log("[auth] reset-password requested for", email);

  // Optionally record in a table for ops follow-up (best effort)
  try {
    const db = getTenantsDb(env);
    if (db) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO password_reset_requests (email, requested_at) VALUES (?, ?)`
        )
        .bind(email, new Date().toISOString())
        .run();
    }
  } catch {
    // non fatal
  }

  return json({ success: true, message: "If the email exists, a reset link will be sent." });
}

// ============================================================================
// SOCIAL OAUTH — Google / GitHub  (GET /api/v1/auth/oauth/:provider/start|callback)
// Stateless: CSRF state is a short-lived signed JWT carrying the app redirect.
// ============================================================================

type OAuthProvider = "google" | "github";

interface ProviderCfg {
  authorize: string;
  token: string;
  userinfo: string;
  emails?: string;
  scope: string;
  idKey: string;
  secretKey: string;
}

const OAUTH_PROVIDERS: Record<OAuthProvider, ProviderCfg> = {
  google: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    idKey: "GOOGLE_CLIENT_ID",
    secretKey: "GOOGLE_CLIENT_SECRET",
  },
  github: {
    authorize: "https://github.com/login/oauth/authorize",
    token: "https://github.com/login/oauth/access_token",
    userinfo: "https://api.github.com/user",
    emails: "https://api.github.com/user/emails",
    scope: "read:user user:email",
    idKey: "GITHUB_CLIENT_ID",
    secretKey: "GITHUB_CLIENT_SECRET",
  },
};

const DEFAULT_APP_CALLBACK = "https://app.integratewise.ai/auth/callback";

/**
 * Resolve a binding that may be a Cloudflare Secrets Store secret ({ get(): Promise<string> })
 * or a plain string env var.
 */
async function readSecret(v: any): Promise<string> {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v.get === "function") {
    try {
      return (await v.get()) || "";
    } catch {
      return "";
    }
  }
  return "";
}

function appErrorRedirect(appRedirect: string, msg: string): Response {
  const u = new URL(appRedirect);
  u.searchParams.set("auth_error", msg);
  return Response.redirect(u.toString(), 302);
}

async function handleOAuthStart(
  request: Request,
  env: Env,
  provider: OAuthProvider
): Promise<Response> {
  const cfg = OAUTH_PROVIDERS[provider];
  const clientId = await readSecret((env as any)[cfg.idKey]);
  if (!clientId) return json({ error: `${provider} sign-in not configured` }, 503);

  const url = new URL(request.url);
  const appRedirect = url.searchParams.get("redirect_uri") || DEFAULT_APP_CALLBACK;
  const gatewayCallback = `${url.origin}/api/v1/auth/oauth/${provider}/callback`;

  try {
    // Signed, short-lived state (CSRF) carrying the app redirect target.
    const state = await signJWT(
      {
        iss: "https://auth.integratewise.ai",
        aud: "https://app.integratewise.ai",
        sub: "oauth-state",
        tenant_id: "-",
        role: "-",
        scope: "oauth-state",
        provider,
        app_redirect: appRedirect,
        nonce: crypto.randomUUID(),
        exp: Math.floor(Date.now() / 1000) + 600,
      },
      env.OAUTH_PRIVATE_KEY
    );

    const authUrl = new URL(cfg.authorize);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", gatewayCallback);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", cfg.scope);
    authUrl.searchParams.set("state", state);
    if (provider === "google") {
      authUrl.searchParams.set("access_type", "online");
      authUrl.searchParams.set("prompt", "select_account");
    }
    return Response.redirect(authUrl.toString(), 302);
  } catch (err) {
    console.error(`OAuth ${provider} start failed`, err);
    return appErrorRedirect(appRedirect, "oauth_start_failed");
  }
}

async function handleOAuthCallback(
  request: Request,
  env: Env,
  provider: OAuthProvider
): Promise<Response> {
  const cfg = OAUTH_PROVIDERS[provider];
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";

  // Verify CSRF state (signed JWT) and recover the app redirect.
  const sv = await verifyJWT(
    state,
    "https://auth.integratewise.ai",
    "https://app.integratewise.ai"
  );
  const appRedirect = (sv.valid && (sv.payload as any)?.app_redirect) || DEFAULT_APP_CALLBACK;
  if (!sv.valid || (sv.payload as any)?.provider !== provider) {
    return appErrorRedirect(appRedirect, "state_invalid");
  }
  if (!code) return appErrorRedirect(appRedirect, "missing_code");

  const clientId = await readSecret((env as any)[cfg.idKey]);
  const clientSecret = await readSecret((env as any)[cfg.secretKey]);
  const gatewayCallback = `${url.origin}/api/v1/auth/oauth/${provider}/callback`;

  // Exchange code → access token.
  let accessToken = "";
  try {
    const tokenRes = await fetch(cfg.token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: gatewayCallback,
        grant_type: "authorization_code",
      }),
    });
    const tok = (await tokenRes.json()) as any;
    accessToken = tok.access_token;
  } catch {
    return appErrorRedirect(appRedirect, "token_exchange_failed");
  }
  if (!accessToken) return appErrorRedirect(appRedirect, "no_access_token");

  // Resolve identity (email + name).
  let email = "";
  let name = "";
  try {
    if (provider === "google") {
      const ui = (await (
        await fetch(cfg.userinfo, { headers: { Authorization: `Bearer ${accessToken}` } })
      ).json()) as any;
      email = ui.email || "";
      name = ui.name || ui.given_name || (email ? email.split("@")[0] : "");
    } else {
      const ghHeaders = {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "integratewise-auth",
        Accept: "application/vnd.github+json",
      };
      const u = (await (await fetch(cfg.userinfo, { headers: ghHeaders })).json()) as any;
      name = u.name || u.login || "";
      email = u.email || "";
      if (!email && cfg.emails) {
        const list = (await (await fetch(cfg.emails, { headers: ghHeaders })).json()) as any[];
        const primary =
          (Array.isArray(list) &&
            (list.find((e) => e.primary && e.verified) ||
              list.find((e) => e.verified) ||
              list[0])) ||
          null;
        email = primary?.email || "";
      }
    }
  } catch {
    return appErrorRedirect(appRedirect, "userinfo_failed");
  }
  if (!email) return appErrorRedirect(appRedirect, "no_email");

  // Upsert tenant/user in D1 and issue our JWT.
  let token: string;
  try {
    token = await upsertOAuthUserAndIssueJwt(env, email, name, provider);
  } catch (e: any) {
    console.error("[auth:oauth] upsert failed:", e?.message || e);
    return appErrorRedirect(appRedirect, "account_provision_failed");
  }

  // Hand the token back via fragment (not query) so it never lands in logs/referrers.
  return Response.redirect(`${appRedirect}#token=${encodeURIComponent(token)}`, 302);
}

/**
 * Find-or-create the tenant/user for a social identity, then issue the app JWT.
 * No password is stored (social-only users authenticate via provider).
 */
async function upsertOAuthUserAndIssueJwt(
  env: Env,
  email: string,
  name: string,
  provider: OAuthProvider
): Promise<string> {
  const db = getTenantsDb(env);
  if (!db) throw new Error("Database not available");

  const existing = await db
    .prepare(
      `SELECT tu.id, tu.tenant_id, tu.role FROM tenant_users tu WHERE tu.email = ? AND tu.status = 'active'`
    )
    .bind(email)
    .first<{ id: string; tenant_id: string; role: string }>();

  let userId: string;
  let tenantId: string;
  let role: string;

  if (existing) {
    userId = existing.id;
    tenantId = existing.tenant_id;
    role = existing.role || "owner";
    await db
      .prepare(`UPDATE tenant_users SET last_seen_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), userId)
      .run();
  } else {
    userId = crypto.randomUUID();
    tenantId = crypto.randomUUID();
    const workspaceId = crypto.randomUUID();
    role = "owner";
    const now = new Date().toISOString();
    const displayName = name || email.split("@")[0];
    let slug = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    // Ensure slug uniqueness (append short suffix on collision).
    const slugTaken = await db.prepare(`SELECT id FROM tenants WHERE slug = ?`).bind(slug).first();
    if (slugTaken) slug = `${slug}-${userId.slice(0, 6)}`;

    await db.batch([
      db
        .prepare(
          `INSERT INTO tenants (id, name, slug, plan, status, settings, metadata, created_at, updated_at)
           VALUES (?, ?, ?, 'free', 'active', '{}', '{}', ?, ?)`
        )
        .bind(tenantId, displayName, slug, now, now),
      db
        .prepare(
          `INSERT INTO tenant_users (id, tenant_id, email, name, role, status, metadata, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'owner', 'active', ?, ?, ?)`
        )
        .bind(
          userId,
          tenantId,
          email,
          displayName,
          JSON.stringify({ oauth_provider: provider }),
          now,
          now
        ),
      db
        .prepare(
          `INSERT INTO workspaces (id, tenant_id, name, type, settings, created_at, updated_at)
           VALUES (?, ?, 'Default', 'production', '{}', ?, ?)`
        )
        .bind(workspaceId, tenantId, now, now),
    ]);
  }

  return signJWT(
    {
      iss: "https://auth.integratewise.ai",
      aud: "https://app.integratewise.ai",
      sub: userId,
      tenant_id: tenantId,
      role,
      scope: "full",
      exp: Math.floor(Date.now() / 1000) + 86400,
    },
    env.OAUTH_PRIVATE_KEY
  );
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-tenant-id, x-user-id",
      Vary: "Origin",
    },
  });
}
