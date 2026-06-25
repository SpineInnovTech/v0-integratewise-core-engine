import { Request, Response, NextFunction } from "express";
import type { AuthContext } from "../types";

// Extended Request type with auth context
export interface AuthRequest extends Request {
  auth?: AuthContext;
}

/**
 * Simple tenant-based authentication middleware
 * In production, this should validate API keys against a secure store
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const apiKey = authHeader.substring(7);

  // Simple validation: Check if API key matches tenant pattern
  // Format: TENANT_<tenant-id> env var holds the key
  // In production, use a proper key management system
  const tenantId = extractTenantFromKey(apiKey);

  if (!tenantId) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // For MVP, all authenticated users are 'admin'
  req.auth = {
    tenantId,
    role: "admin",
  };

  next();
};

/**
 * Extract tenant ID from API key
 * This is a simplified version - in production use proper key validation
 */
function extractTenantFromKey(apiKey: string): string | null {
  // Check against env vars
  // Format: TENANT_demo-tenant=demo-api-key-12345
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("TENANT_") && value === apiKey) {
      return key.replace("TENANT_", "");
    }
  }
  return null;
}

/**
 * Require specific role
 */
export const requireRole = (requiredRole: "admin" | "member" | "viewer") => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const roleHierarchy = { admin: 3, member: 2, viewer: 1 };
    if (roleHierarchy[req.auth.role] < roleHierarchy[requiredRole]) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};
