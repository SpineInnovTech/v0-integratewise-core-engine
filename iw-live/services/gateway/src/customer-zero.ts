/**
 * Customer Zero provisioning — JIT membership for @integratewise.ai users.
 */

import {
  CUSTOMER_ZERO_TENANT_ID,
  CUSTOMER_ZERO_FOUNDER_EMAILS,
  isCustomerZeroEmail,
} from "@integratewise/types";
import type { Env } from "./index";

export interface CustomerZeroProfile {
  tenant_id: string;
  org_id: string;
  team_id: string;
  role: "owner" | "admin" | "member";
  department: string;
  awareness_profile_id: string;
}

export function resolveCustomerZeroProfile(email: string): CustomerZeroProfile {
  const isFounder = (CUSTOMER_ZERO_FOUNDER_EMAILS as readonly string[]).includes(email);
  return {
    tenant_id: CUSTOMER_ZERO_TENANT_ID,
    org_id: "org-iw-customer-zero",
    team_id: "team-iw-customer-zero",
    role: isFounder ? "owner" : "admin",
    department: "bizops",
    awareness_profile_id: "awareness-cz-founder",
  };
}

/**
 * Ensure @integratewise.ai user exists in tenant_users for Customer Zero.
 * Idempotent — safe on every authenticated request.
 */
export async function ensureCustomerZeroMembership(
  env: Env,
  email: string,
  cfUserId: string
): Promise<void> {
  if (!isCustomerZeroEmail(email) || !env.DB) return;

  const profile = resolveCustomerZeroProfile(email);
  const stableUserId =
    email === "nirmal@integratewise.ai"
      ? "user-nirmal-cz"
      : email === "connect@integratewise.ai"
        ? "user-connect-cz"
        : `user-cz-${email.split("@")[0].replace(/[^a-z0-9-]/gi, "-")}`;

  const now = new Date().toISOString();
  const displayName = email.split("@")[0];

  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO tenants (id, name, slug, plan, status, settings, metadata, created_at, updated_at)
       VALUES (?, 'IntegrateWise (Customer Zero)', 'iw-customer-zero', 'enterprise', 'active',
         '{"customer_zero":true,"promoted":true,"twin_enabled":true}', '{}', ?, ?)`
    )
      .bind(CUSTOMER_ZERO_TENANT_ID, now, now)
      .run();

    await env.DB.prepare(
      `INSERT INTO tenant_users (id, tenant_id, email, name, role, status, department, awareness_profile_id, plan, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, 'enterprise', '{"customer_zero":true}', ?, ?)
       ON CONFLICT(tenant_id, email) DO UPDATE SET
         role = excluded.role,
         department = excluded.department,
         awareness_profile_id = excluded.awareness_profile_id,
         plan = 'enterprise',
         status = 'active',
         updated_at = excluded.updated_at`
    )
      .bind(
        stableUserId,
        CUSTOMER_ZERO_TENANT_ID,
        email,
        displayName,
        profile.role,
        profile.department,
        profile.awareness_profile_id,
        now,
        now
      )
      .run();
  } catch (err) {
    console.error("[customer-zero] JIT membership failed:", err, { email, cfUserId });
  }
}

export function customerZeroHasTwinEntitlement(tenantId: string): boolean {
  return tenantId === CUSTOMER_ZERO_TENANT_ID;
}
