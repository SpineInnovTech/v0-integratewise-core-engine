/**
 * Cloudflare Worker / Hono Middleware Integration
 *
 * Middleware functions for Cloudflare Workers and Hono framework
 */

import type { Context, MiddlewareHandler } from "hono";
import { resolveTenant, type TenantResolutionOptions } from "./resolver";
import type { TenantContext } from "./types";

/**
 * Extended Hono context with tenant
 */
export interface TenantContextEnv {
  tenant?: TenantContext;
}

/**
 * Tenant resolution options for Workers
 */
export interface WorkerTenantOptions extends TenantResolutionOptions {
  /** Context key name (default: 'tenant') */
  contextKey?: string;
}

/**
 * Create Hono middleware for tenant resolution
 *
 * Usage:
 * ```ts
 * import { tenantMiddleware } from '@integratewise/tenancy/worker';
 *
 * app.use('*', tenantMiddleware({
 *   defaultTenantId: 'ten_demo' as TenantId,
 *   requireTenant: false,
 * }));
 * ```
 */
export function tenantMiddleware(
  options: WorkerTenantOptions = {}
): MiddlewareHandler<TenantContextEnv> {
  const { contextKey = "tenant", ...resolutionOptions } = options;

  return async (c: Context<TenantContextEnv>, next) => {
    const result = await resolveTenant(c.req.raw, resolutionOptions);

    // If tenant is required but not found, return error
    if (options.requireTenant && !result.context) {
      return c.json(
        {
          error: result.error || "Tenant not found",
          code: result.errorCode || "TENANT_NOT_FOUND",
        },
        401
      );
    }

    // Attach tenant context to Hono context
    if (result.context) {
      c.set(contextKey as keyof TenantContextEnv, result.context);

      // Also set as header for downstream services
      c.header("x-tenant-id", result.context.tenantId);
    }

    await next();
  };
}

/**
 * Get tenant context from Hono context
 */
export function getTenantFromContext<T extends TenantContextEnv>(
  c: Context<T>
): TenantContext | null {
  return c.get("tenant" as keyof T) as TenantContext | null;
}

/**
 * Create raw Cloudflare Worker middleware (non-Hono)
 *
 * Usage:
 * ```ts
 * export default {
 *   async fetch(request: Request, env: Env): Promise<Response> {
 *     const tenantResult = await resolveTenantForWorker(request, {
 *       defaultTenantId: 'ten_demo' as TenantId,
 *     });
 *
 *     if (!tenantResult.context) {
 *       return new Response(JSON.stringify({ error: 'Tenant not found' }), {
 *         status: 401,
 *       });
 *     }
 *
 *     // Use tenantResult.context.tenantId
 *     // ...
 *   }
 * }
 * ```
 */
export async function resolveTenantForWorker(
  request: Request,
  options: TenantResolutionOptions = {}
): Promise<TenantResolutionResult> {
  return resolveTenant(request, options);
}
