/**
 * @integratewise/tenancy
 *
 * Shared tenant resolution and context middleware for:
 * - Next.js middleware
 * - Cloudflare Workers (Hono)
 * - Raw Cloudflare Workers
 */

// Core types
export type {
  TenantContext,
  JWTPayload,
  TenantResolutionOptions,
  TenantResolutionResult,
  SubdomainLookupFn,
} from "./types";

export { TenantResolutionErrorCode } from "./types";

// Resolution logic
export {
  resolveTenant,
  getTenantContext,
  extractTenantFromSubdomain,
  extractTenantFromJWT,
  type JWTTenantResult,
} from "./resolver";

// Next.js middleware
export {
  createTenantMiddleware,
  getTenantFromRequest,
  type TenantRequest,
  type NextTenantOptions,
} from "./middleware";

// Worker middleware
export {
  tenantMiddleware,
  getTenantFromContext,
  resolveTenantForWorker,
  type TenantContextEnv,
  type WorkerTenantOptions,
} from "./worker";

// Utilities
export {
  sanitizeError,
  validateTenantId,
  normalizeTenantId,
  matchesSubdomainPattern,
  extractBaseDomain,
  isSubdomain,
  parseJWTPayload,
  createLogger,
} from "./utils";

// Helpers
export {
  createMemorySubdomainLookup,
  createCachedSubdomainLookup,
  createValidatedSubdomainLookup,
  combineSubdomainLookups,
} from "./helpers";
