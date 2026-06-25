/**
 * Next.js Middleware Integration
 *
 * Middleware functions for Next.js to resolve and inject tenant context
 */

import { NextResponse, type NextRequest } from "next/server";
import { resolveTenant, type TenantResolutionOptions } from "./resolver";
import type { TenantContext } from "./types";

/**
 * Extended NextRequest with tenant context
 */
export interface TenantRequest extends NextRequest {
  tenant?: TenantContext;
}

/**
 * Tenant resolution options for Next.js middleware
 */
export interface NextTenantOptions extends TenantResolutionOptions {
  /** Header name to inject tenant context into (default: 'x-tenant-context') */
  contextHeaderName?: string;
  /** Whether to add tenant context to request headers */
  injectHeaders?: boolean;
}

/**
 * Create Next.js middleware that resolves tenant context
 *
 * Usage:
 * ```ts
 * export async function middleware(request: NextRequest) {
 *   const tenantMiddleware = createTenantMiddleware({
 *     defaultTenantId: 'ten_demo' as TenantId,
 *     requireTenant: false,
 *   });
 *
 *   return tenantMiddleware(request);
 * }
 * ```
 */
export function createTenantMiddleware(options: NextTenantOptions = {}) {
  const {
    contextHeaderName = "x-tenant-context",
    injectHeaders = true,
    ...resolutionOptions
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await resolveTenant(request, resolutionOptions);

    // If tenant is required but not found, return error
    if (options.requireTenant && !result.context) {
      return NextResponse.json(
        {
          error: result.error || "Tenant not found",
          code: result.errorCode || "TENANT_NOT_FOUND",
        },
        { status: 401 }
      );
    }

    // Create response
    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });

    // Inject tenant context into headers if resolved
    if (result.context && injectHeaders) {
      response.headers.set(
        contextHeaderName,
        JSON.stringify({
          tenantId: result.context.tenantId,
          method: result.context.method,
          subdomain: result.context.subdomain,
        })
      );
      response.headers.set("x-tenant-id", result.context.tenantId);
    }

    return response;
  };
}

/**
 * Extract tenant context from Next.js request headers
 * (for use in API routes or server components)
 */
export function getTenantFromRequest(request: NextRequest | Request): TenantContext | null {
  const contextHeader = request.headers.get("x-tenant-context");
  if (contextHeader) {
    try {
      return JSON.parse(contextHeader) as TenantContext;
    } catch {
      // Fallback: try x-tenant-id header
      const tenantId = request.headers.get("x-tenant-id");
      if (tenantId) {
        return {
          tenantId: tenantId as TenantContext["tenantId"],
          method: "header",
        };
      }
    }
  }

  // Try direct tenant ID header
  const tenantId = request.headers.get("x-tenant-id");
  if (tenantId) {
    return {
      tenantId: tenantId as TenantContext["tenantId"],
      method: "header",
    };
  }

  return null;
}
