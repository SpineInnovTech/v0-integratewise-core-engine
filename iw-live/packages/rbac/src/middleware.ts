import { checkPermission } from "./engine";
import type { PermissionCheck } from "./types";

/**
 * Permission middleware factory for Cloudflare Workers
 */
export function createPermissionMiddleware(dbUrl: string) {
  return async function requirePermission(
    user_id: string,
    tenant_id: string,
    permission: string,
    resource_id?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const check: PermissionCheck = {
      user_id,
      tenant_id,
      permission,
      resource_id,
    };

    const result = await checkPermission(dbUrl, check);

    if (!result.allowed) {
      throw new Error(result.reason || "Permission denied");
    }

    return result;
  };
}

/**
 * Express-style middleware for permission checking
 */
export function requirePermissionMiddleware(dbUrl: string, permission: string) {
  return async (req: any, res: any, next: any) => {
    const user_id = req.user?.id;
    const tenant_id = req.tenant?.id || req.user?.tenant_id;

    if (!user_id || !tenant_id) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User or tenant information missing",
      });
    }

    try {
      const check: PermissionCheck = {
        user_id,
        tenant_id,
        permission,
      };

      const result = await checkPermission(dbUrl, check);

      if (!result.allowed) {
        return res.status(403).json({
          error: "Forbidden",
          message: result.reason || "Permission denied",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Permission check failed",
      });
    }
  };
}
