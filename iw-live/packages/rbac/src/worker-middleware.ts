import { checkPermission } from "./engine";
import type { PermissionCheck } from "./types";

/**
 * Cloudflare Worker environment interface
 */
export interface WorkerEnv {
  DATABASE_URL: string;
  [key: string]: any;
}

/**
 * User context extracted from request
 */
export interface UserContext {
  user_id: string;
  tenant_id: string;
  [key: string]: any;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Extract and validate user context from request headers.
 *
 * Both `x-user-id` and `x-tenant-id` must be present and conform to UUID v1-v5
 * format. Returns `null` if either header is missing or malformed.
 */
export function extractUserContext(request: Request): UserContext | null {
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  if (!userId || !tenantId) {
    return null;
  }

  if (!UUID_RE.test(userId) || !UUID_RE.test(tenantId)) {
    return null;
  }

  return {
    user_id: userId,
    tenant_id: tenantId,
  };
}

/**
 * RBAC middleware for Cloudflare Workers
 *
 * @example
 * ```typescript
 * import { requirePermission } from '@integratewise/rbac/worker-middleware';
 *
 * export default {
 *   async fetch(request: Request, env: Env): Promise<Response> {
 *     // Check permission
 *     const authResult = await requirePermission(
 *       request,
 *       env.DATABASE_URL,
 *       'action:execute'
 *     );
 *
 *     if (!authResult.allowed) {
 *       return new Response(
 *         JSON.stringify({ error: 'Forbidden', message: authResult.reason }),
 *         { status: 403, headers: { 'Content-Type': 'application/json' } }
 *       );
 *     }
 *
 *     // Process request...
 *     return new Response('OK');
 *   }
 * }
 * ```
 */
export async function requirePermission(
  request: Request,
  dbUrl: string,
  permission: string
): Promise<{ allowed: boolean; reason?: string; user?: UserContext }> {
  const userContext = extractUserContext(request);

  if (!userContext) {
    return {
      allowed: false,
      reason: "User or tenant information missing from request headers",
    };
  }

  const check: PermissionCheck = {
    user_id: userContext.user_id,
    tenant_id: userContext.tenant_id,
    permission,
  };

  try {
    const result = await checkPermission(dbUrl, check);

    return {
      ...result,
      user: userContext,
    };
  } catch (error) {
    console.error("Permission check error:", error);
    return {
      allowed: false,
      reason: "Permission check failed",
    };
  }
}

/**
 * Create a permission-protected handler wrapper
 *
 * @example
 * ```typescript
 * import { withPermission } from '@integratewise/rbac/worker-middleware';
 *
 * const handler = withPermission('action:execute', async (request, env, user) => {
 *   // user is guaranteed to have the permission here
 *   return new Response('Action executed');
 * });
 *
 * export default {
 *   fetch: handler
 * }
 * ```
 */
export function withPermission<Env extends WorkerEnv>(
  permission: string,
  handler: (request: Request, env: Env, user: UserContext) => Promise<Response>
) {
  return async (request: Request, env: Env): Promise<Response> => {
    const result = await requirePermission(request, env.DATABASE_URL, permission);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: result.reason || "Permission denied",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return handler(request, env, result.user!);
  };
}

/**
 * Create a permission-protected handler for multiple permissions (ALL required)
 */
export function withAllPermissions<Env extends WorkerEnv>(
  permissions: string[],
  handler: (request: Request, env: Env, user: UserContext) => Promise<Response>
) {
  return async (request: Request, env: Env): Promise<Response> => {
    const userContext = extractUserContext(request);

    if (!userContext) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "User or tenant information missing",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check all permissions
    for (const permission of permissions) {
      const result = await requirePermission(request, env.DATABASE_URL, permission);

      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: result.reason || `Missing permission: ${permission}`,
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return handler(request, env, userContext);
  };
}

/**
 * Create a permission-protected handler for multiple permissions (ANY required)
 */
export function withAnyPermission<Env extends WorkerEnv>(
  permissions: string[],
  handler: (request: Request, env: Env, user: UserContext) => Promise<Response>
) {
  return async (request: Request, env: Env): Promise<Response> => {
    const userContext = extractUserContext(request);

    if (!userContext) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "User or tenant information missing",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user has any of the permissions
    let hasAny = false;
    for (const permission of permissions) {
      const result = await requirePermission(request, env.DATABASE_URL, permission);

      if (result.allowed) {
        hasAny = true;
        break;
      }
    }

    if (!hasAny) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: `Missing any of required permissions: ${permissions.join(", ")}`,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return handler(request, env, userContext);
  };
}
