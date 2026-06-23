/**
 * Customer Zero — IntegrateWise operating on IntegrateWise (founder dogfood tenant).
 * Canonical tenant id used across Spine, Memory, MCP, and Twin runtime.
 */

/** Canonical Customer Zero tenant id (D1, MCP, continuity-tool-server). */
export const CUSTOMER_ZERO_TENANT_ID = "iw-customer-zero";

/** Legacy alias — gateway/frontend previously used this id. */
export const CUSTOMER_ZERO_LEGACY_TENANT_ID = "tenant-iw-101";

export const CUSTOMER_ZERO_DOMAIN = "integratewise.ai";

export const CUSTOMER_ZERO_FOUNDER_EMAILS = [
  "nirmal@integratewise.ai",
  "connect@integratewise.ai",
] as const;

export function isCustomerZeroTenant(tenantId: string | null | undefined): boolean {
  if (!tenantId) return false;
  return tenantId === CUSTOMER_ZERO_TENANT_ID || tenantId === CUSTOMER_ZERO_LEGACY_TENANT_ID;
}

/** Normalize legacy tenant id to canonical Customer Zero id. */
export function resolveCustomerZeroTenantId(tenantId: string): string {
  return tenantId === CUSTOMER_ZERO_LEGACY_TENANT_ID ? CUSTOMER_ZERO_TENANT_ID : tenantId;
}

export function isCustomerZeroEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return domain === CUSTOMER_ZERO_DOMAIN;
}
