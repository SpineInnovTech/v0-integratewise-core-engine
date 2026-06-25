/**
 * S11 Dispatch Boundary — Tenant Class Guard
 *
 * Routes packages to either native execution (Hermes/S11, Customer Zero only)
 * or the Handoff Layer (external tenants).
 *
 * SECURITY: Any tenant_class other than 'customer_zero' (including null,
 * undefined, missing, malformed) routes to handoff. Fail-safe deny on S11.
 */

import { getTenantClass, type TenantClass } from "./tenant";

export interface DispatchablePackage {
  package_id: string;
  tenant_id: string;
  [key: string]: unknown;
}

export interface DispatchResult {
  path: "s11_native" | "handoff_layer";
  tenant_class: TenantClass;
  package_id: string;
  tenant_id: string;
}

interface DispatchEnv {
  D1: D1Database;
  CACHE?: KVNamespace;
}

/**
 * Evaluate tenant_class and route the package to the correct execution path.
 * Emits a structured log on every decision.
 */
export async function dispatch(
  pkg: DispatchablePackage,
  env: DispatchEnv
): Promise<DispatchResult> {
  const tenantClass = await getTenantClass(pkg.tenant_id, env);

  const result: DispatchResult = {
    path: tenantClass === "customer_zero" ? "s11_native" : "handoff_layer",
    tenant_class: tenantClass,
    package_id: pkg.package_id,
    tenant_id: pkg.tenant_id,
  };

  // Structured log on every dispatch decision
  console.log(
    JSON.stringify({
      event: "s11_dispatch_decision",
      tenant_id: pkg.tenant_id,
      package_id: pkg.package_id,
      tenant_class: tenantClass,
      decision: result.path,
      timestamp: new Date().toISOString(),
    })
  );

  return result;
}
