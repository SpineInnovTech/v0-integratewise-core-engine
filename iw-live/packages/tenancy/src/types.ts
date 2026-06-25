/**
 * Tenant Context Types
 *
 * Types for tenant resolution and context propagation
 */

import type { TenantId } from "@integratewise/types";

/**
 * Tenant context resolved from request
 */
export interface TenantContext {
  /** Tenant UUID identifier */
  tenantId: TenantId;
  /** Tenant subdomain (if resolved from subdomain) */
  subdomain?: string;
  /** Resolution method used */
  method: "subdomain" | "header" | "jwt" | "default";
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Timestamp when context was resolved */
  resolvedAt?: Date;
}

/**
 * Tenant resolution error codes
 */
export enum TenantResolutionErrorCode {
  /** No tenant identifier found in request */
  NOT_FOUND = "TENANT_NOT_FOUND",
  /** Invalid tenant ID format */
  INVALID_FORMAT = "TENANT_INVALID_FORMAT",
  /** Tenant ID not in allowed list */
  NOT_ALLOWED = "TENANT_NOT_ALLOWED",
  /** JWT token invalid or expired */
  JWT_INVALID = "JWT_INVALID",
  /** Subdomain not allowed */
  SUBDOMAIN_NOT_ALLOWED = "SUBDOMAIN_NOT_ALLOWED",
  /** Multiple tenant identifiers found (conflict) */
  CONFLICT = "TENANT_CONFLICT",
}

/**
 * JWT payload structure (expected format)
 */
export interface JWTPayload {
  tenant_id?: string;
  tenantId?: string;
  sub?: string;
  [key: string]: unknown;
}

/**
 * Subdomain to tenant ID lookup function
 * Used to resolve tenant ID from subdomain string
 */
export type SubdomainLookupFn = (subdomain: string) => Promise<TenantId | null> | TenantId | null;

/**
 * Tenant resolution options
 */
export interface TenantResolutionOptions {
  /** Default tenant ID to use if resolution fails */
  defaultTenantId?: TenantId;
  /** Whether to throw error if tenant cannot be resolved */
  requireTenant?: boolean;
  /** Custom header name for tenant ID (default: 'x-tenant-id') */
  tenantHeaderName?: string;
  /** JWT secret for verification (optional, for future use) */
  jwtSecret?: string;
  /** Allowed subdomain patterns (e.g., ['*.example.com']) */
  allowedSubdomains?: string[];
  /** Function to lookup tenant ID from subdomain */
  subdomainLookup?: SubdomainLookupFn;
  /** Base domain for subdomain extraction (e.g., 'example.com') */
  baseDomain?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom logger function */
  logger?: (message: string, data?: unknown) => void;
}

/**
 * Tenant resolution result
 */
export interface TenantResolutionResult {
  /** Resolved tenant context */
  context: TenantContext | null;
  /** Error message if resolution failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: TenantResolutionErrorCode;
  /** Whether resolution was successful */
  success: boolean;
}
