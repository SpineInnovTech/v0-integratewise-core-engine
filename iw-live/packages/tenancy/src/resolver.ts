/**
 * Tenant Resolution Logic
 *
 * Resolves tenant ID from:
 * 1. Header (x-tenant-id) - highest priority
 * 2. Subdomain (e.g., acme.example.com -> acme)
 * 3. JWT token (Authorization: Bearer <token>)
 * 4. Default fallback
 */

import type { TenantId } from "@integratewise/types";
import { TenantIdUtils } from "@integratewise/types";
import type {
  TenantContext,
  TenantResolutionOptions,
  TenantResolutionResult,
  JWTPayload,
  TenantResolutionErrorCode,
} from "./types";
import {
  sanitizeError,
  normalizeTenantId,
  matchesSubdomainPattern,
  parseJWTPayload,
  createLogger,
} from "./utils";

/**
 * Common subdomain prefixes that should be skipped
 */
const SKIP_SUBDOMAIN_PREFIXES = [
  "www",
  "app",
  "api",
  "admin",
  "admin-api",
  "cdn",
  "static",
  "assets",
];

/**
 * Extract tenant ID from subdomain
 *
 * Examples:
 * - acme.example.com -> acme
 * - acme.app.example.com -> acme (if baseDomain is 'app.example.com')
 * - example.com -> null
 */
export function extractTenantFromSubdomain(hostname: string, baseDomain?: string): string | null {
  if (!hostname) return null;

  // Remove port if present
  const host = hostname.split(":")[0].toLowerCase();

  // If base domain is provided, extract subdomain relative to it
  if (baseDomain) {
    const normalizedBase = baseDomain.toLowerCase();
    const hostParts = host.split(".");
    const baseParts = normalizedBase.split(".");

    // Check if hostname ends with base domain
    if (
      hostParts.length > baseParts.length &&
      hostParts.slice(-baseParts.length).join(".") === normalizedBase
    ) {
      const subdomain = hostParts[0];
      // Skip common prefixes
      if (subdomain && !SKIP_SUBDOMAIN_PREFIXES.includes(subdomain)) {
        return subdomain;
      }
    }
    return null;
  }

  // Default: extract first subdomain
  const parts = host.split(".");
  if (parts.length >= 2) {
    const firstPart = parts[0];
    // Skip common prefixes like 'www', 'app', 'api'
    if (firstPart && !SKIP_SUBDOMAIN_PREFIXES.includes(firstPart)) {
      return firstPart;
    }
  }

  return null;
}

/**
 * Result of extracting tenant information from a JWT.
 */
export interface JWTTenantResult {
  /** Resolved tenant ID string (or null if not found) */
  tenantId: string | null;
  /**
   * Whether the JWT signature was cryptographically verified.
   *
   * WARNING: When `false`, the token payload has only been base64-decoded
   * without any signature check. An attacker can craft arbitrary payloads.
   * Always verify JWTs with a trusted secret/public key in production.
   */
  verified: boolean;
}

/**
 * Extract tenant ID from JWT token.
 *
 * Supports multiple JWT payload formats:
 * - tenant_id
 * - tenantId
 * - sub (if it's a tenant ID)
 *
 * **SECURITY WARNING**: This function only base64-decodes the JWT payload; it
 * does **not** verify the token signature. In production you MUST verify the
 * JWT (e.g. via `jwtSecret` / JWKS) before trusting the returned tenant ID.
 * The `verified` field on the result is always `false` until signature
 * verification is implemented.
 */
export function extractTenantFromJWT(token: string): string | null;
export function extractTenantFromJWT(token: string, opts: { returnMeta: true }): JWTTenantResult;
export function extractTenantFromJWT(
  token: string,
  opts?: { returnMeta?: boolean }
): string | null | JWTTenantResult {
  const decoded = parseJWTPayload(token);

  const buildResult = (tenantId: string | null): string | null | JWTTenantResult => {
    if (opts?.returnMeta) {
      return { tenantId, verified: false };
    }
    return tenantId;
  };

  if (!decoded) {
    return buildResult(null);
  }

  const payload = decoded as JWTPayload;

  const tenantIdStr =
    payload.tenant_id ||
    payload.tenantId ||
    (payload.sub && TenantIdUtils.is(payload.sub) ? payload.sub : null) ||
    null;

  return buildResult(tenantIdStr);
}

/**
 * Resolve tenant from request
 *
 * Priority order:
 * 1. Header (x-tenant-id) - highest priority
 * 2. Subdomain
 * 3. JWT token (Authorization header)
 * 4. Default tenant (if provided)
 */
export async function resolveTenant(
  request: Request,
  options: TenantResolutionOptions = {}
): Promise<TenantResolutionResult> {
  const {
    defaultTenantId,
    requireTenant = false,
    tenantHeaderName = "x-tenant-id",
    allowedSubdomains,
    subdomainLookup,
    baseDomain,
    debug = false,
    logger = createLogger(debug),
  } = options;

  const log = logger;

  try {
    // 1. Try header first (highest priority)
    const tenantHeader = request.headers.get(tenantHeaderName);
    if (tenantHeader) {
      const normalized = normalizeTenantId(tenantHeader);
      const tenantId = TenantIdUtils.tryTo(normalized);

      if (tenantId) {
        log(`Tenant resolved from header: ${tenantId}`);
        return {
          success: true,
          context: {
            tenantId,
            method: "header",
            metadata: { headerName: tenantHeaderName },
            resolvedAt: new Date(),
          },
        };
      } else {
        log(`Invalid tenant ID format in header: ${normalized}`);
        return {
          success: false,
          context: null,
          error: "Invalid tenant ID format",
          errorCode: TenantResolutionErrorCode.INVALID_FORMAT,
        };
      }
    }

    // 2. Try subdomain
    const hostname = request.headers.get("host") || new URL(request.url).hostname;
    if (hostname) {
      const subdomain = extractTenantFromSubdomain(hostname, baseDomain);
      if (subdomain) {
        log(`Subdomain extracted: ${subdomain} from ${hostname}`);

        // Validate against allowed subdomains if provided
        if (allowedSubdomains && allowedSubdomains.length > 0) {
          const isAllowed = allowedSubdomains.some((pattern) =>
            matchesSubdomainPattern(subdomain, pattern)
          );

          if (!isAllowed) {
            log(`Subdomain not allowed: ${subdomain}`);
            return {
              success: false,
              context: null,
              error: "Subdomain not allowed",
              errorCode: TenantResolutionErrorCode.SUBDOMAIN_NOT_ALLOWED,
            };
          }
        }

        // Try to resolve tenant ID from subdomain
        let tenantId: TenantId | null = null;

        // First, try lookup function if provided
        if (subdomainLookup) {
          try {
            const lookupResult = await subdomainLookup(subdomain);
            tenantId = lookupResult ? TenantIdUtils.tryTo(lookupResult) : null;
            log(`Subdomain lookup result: ${tenantId || "not found"}`);
          } catch (error) {
            log(`Subdomain lookup error: ${sanitizeError(error, debug)}`);
            // Fall through to try UUID validation
          }
        }

        // If no lookup function or lookup failed, try treating subdomain as UUID
        if (!tenantId) {
          tenantId = TenantIdUtils.tryTo(subdomain);
        }

        if (tenantId) {
          log(`Tenant resolved from subdomain: ${tenantId}`);
          return {
            success: true,
            context: {
              tenantId,
              subdomain,
              method: "subdomain",
              metadata: { hostname, subdomain },
              resolvedAt: new Date(),
            },
          };
        } else {
          log(`Subdomain is not a valid tenant ID: ${subdomain}`);
          // Continue to next resolution method
        }
      }
    }

    // 3. Try JWT token
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const tenantIdStr = extractTenantFromJWT(token);

      if (tenantIdStr) {
        const tenantId = TenantIdUtils.tryTo(tenantIdStr);
        if (tenantId) {
          log(`Tenant resolved from JWT: ${tenantId}`);
          return {
            success: true,
            context: {
              tenantId,
              method: "jwt",
              metadata: { tokenPresent: true },
              resolvedAt: new Date(),
            },
          };
        } else {
          log(`Invalid tenant ID format in JWT: ${tenantIdStr}`);
          return {
            success: false,
            context: null,
            error: "Invalid tenant ID format in token",
            errorCode: TenantResolutionErrorCode.INVALID_FORMAT,
          };
        }
      } else {
        log("JWT token present but no tenant ID found");
      }
    }

    // 4. Use default tenant if provided
    if (defaultTenantId) {
      log(`Using default tenant: ${defaultTenantId}`);
      return {
        success: true,
        context: {
          tenantId: defaultTenantId,
          method: "default",
          metadata: { fallback: true },
          resolvedAt: new Date(),
        },
      };
    }

    // 5. No tenant resolved
    const errorMessage = requireTenant
      ? "Tenant could not be resolved from request"
      : "No tenant identifier found";

    log(`Tenant resolution failed: ${errorMessage}`);

    return {
      success: false,
      context: null,
      error: errorMessage,
      errorCode: TenantResolutionErrorCode.NOT_FOUND,
    };
  } catch (error) {
    const errorMessage = sanitizeError(error, debug);
    log(`Tenant resolution error: ${errorMessage}`, error);

    return {
      success: false,
      context: null,
      error: errorMessage,
      errorCode: TenantResolutionErrorCode.NOT_FOUND,
    };
  }
}

/**
 * Get tenant context from request (convenience wrapper)
 *
 * Note: This is async now due to potential subdomain lookup.
 * Use await when calling this function.
 */
export async function getTenantContext(
  request: Request,
  options?: TenantResolutionOptions
): Promise<TenantContext | null> {
  const result = await resolveTenant(request, options);
  return result.context;
}
