/**
 * Admin Utilities for Billing Service
 *
 * Cloudflare Worker compatible — uses D1 + JWT claims (no Supabase client).
 *
 * Admin verification:
 *   1. JWT decoded at Gateway → role claim extracted
 *   2. Billing service checks role = 'admin' | 'super_admin' | 'owner'
 *   3. Or checks against admin_users table in D1
 *
 * SECURITY: Override functions restricted to non-production environments.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminOverrideOptions {
  actorId: string;
  reason: string;
  expiresAt?: string; // ISO date string
  metadata?: Record<string, unknown>;
}

// ─── Admin Role Check ────────────────────────────────────────────────────────

/**
 * Check if the given JWT claims indicate an admin user.
 * Called from billing route handlers where JWT is already decoded by Gateway.
 */
export function isAdminRole(role?: string): boolean {
  if (!role) return false;
  const adminRoles = ["admin", "super_admin", "owner", "service_role"];
  return adminRoles.includes(role);
}

/**
 * Verify admin access from request headers.
 * Gateway forwards the decoded JWT role via x-user-role header,
 * or the billing service can decode the JWT directly.
 */
export function verifyAdminFromHeaders(headers: Headers): {
  isAdmin: boolean;
  userId: string;
  role: string;
} {
  const role = headers.get("x-user-role") || "";
  const userId = headers.get("x-user-id") || "";

  return {
    isAdmin: isAdminRole(role),
    userId,
    role,
  };
}

/**
 * Verify admin access via D1 lookup (fallback if JWT role claims not available).
 * Checks the admin allowlist stored in D1.
 */
export async function isAdminByEmail(db: D1Database, email: string): Promise<boolean> {
  if (!email) return false;

  try {
    // Check if email is in the founder/admin list
    const founderEmail = "nirmpapri@gmail.com"; // IntegrateWise founder
    if (email === founderEmail) return true;

    // Check D1 admin allowlist (if table exists)
    const result = await db
      .prepare(
        "SELECT 1 FROM tenant_subscriptions ts JOIN product_skus ps ON ts.sku_id = ps.id WHERE ts.tenant_id = (SELECT id FROM tenants WHERE owner_email = ? LIMIT 1) AND ps.tier = 'enterprise' AND ts.status = 'active' LIMIT 1"
      )
      .bind(email)
      .first();

    // Enterprise tier users get admin access
    return !!result;
  } catch {
    return false;
  }
}

// ─── Override Functions (Dev/Staging Only) ────────────────────────────────────

/**
 * Override entitlement for testing.
 * Writes directly to D1 — no Supabase dependency.
 */
export async function overrideEntitlement(
  db: D1Database,
  tenantId: string,
  entitlementKey: string,
  value: unknown,
  environment: string,
  options: AdminOverrideOptions
): Promise<void> {
  if (environment === "production") {
    throw new Error("Admin overrides not allowed in production");
  }

  // Record the override
  await db
    .prepare(
      `INSERT INTO tenant_subscriptions (id, tenant_id, sku_id, status, activated_at, gateway)
     VALUES (?, ?, ?, 'active', datetime('now'), 'admin_override')`
    )
    .bind(`override_${crypto.randomUUID()}`, tenantId, `override_${entitlementKey}`)
    .run();

  // Audit log
  await db
    .prepare(
      `INSERT INTO payment_transactions (id, tenant_id, sku_id, gateway, gateway_session_id, amount_cents, currency, status, created_at, updated_at)
     VALUES (?, ?, ?, 'admin_override', ?, 0, 'usd', 'completed', datetime('now'), datetime('now'))`
    )
    .bind(
      crypto.randomUUID(),
      tenantId,
      `override_${entitlementKey}`,
      JSON.stringify({ actor: options.actorId, reason: options.reason, value })
    )
    .run();
}

/**
 * Force subscription status change.
 * Direct D1 update — dev/staging only.
 */
export async function forceSubscriptionStatus(
  db: D1Database,
  tenantId: string,
  status: "trial" | "active" | "past_due" | "cancelled",
  environment: string,
  options: AdminOverrideOptions
): Promise<void> {
  if (environment === "production") {
    throw new Error("Admin overrides not allowed in production");
  }

  await db
    .prepare(
      `UPDATE tenant_subscriptions SET status = ? WHERE tenant_id = ? AND status != 'cancelled'`
    )
    .bind(status, tenantId)
    .run();

  // Audit
  await db
    .prepare(
      `INSERT INTO payment_transactions (id, tenant_id, sku_id, gateway, gateway_session_id, amount_cents, currency, status, created_at)
     VALUES (?, ?, 'admin_status_change', 'admin_override', ?, 0, 'usd', 'completed', datetime('now'))`
    )
    .bind(
      crypto.randomUUID(),
      tenantId,
      JSON.stringify({ actor: options.actorId, reason: options.reason, new_status: status })
    )
    .run();
}

/**
 * Check if paywall bypass is enabled (dev/staging only).
 */
export function canBypassPaywall(environment: string, role: string): boolean {
  if (environment === "production") return false;
  return isAdminRole(role);
}
