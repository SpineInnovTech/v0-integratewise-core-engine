/**
 * Utility functions for tenant resolution
 */

import type { TenantId } from "@integratewise/types";
import { TenantIdUtils } from "@integratewise/types";

/**
 * Sanitize error message to prevent information leakage
 */
export function sanitizeError(error: unknown, debug = false): string {
  if (debug) {
    return error instanceof Error ? error.message : String(error);
  }

  // Return generic error message in production
  return "Tenant resolution failed";
}

/**
 * Validate tenant ID format
 */
export function validateTenantId(value: string): value is TenantId {
  return TenantIdUtils.is(value);
}

/**
 * Normalize tenant ID (trim whitespace, lowercase if needed)
 */
export function normalizeTenantId(value: string): string {
  return value.trim();
}

/**
 * Check if a subdomain matches an allowed pattern.
 *
 * Special characters in the pattern are escaped to prevent ReDoS.
 */
export function matchesSubdomainPattern(subdomain: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regexPattern = "^" + escaped.replace(/\\\*/g, "[a-z0-9-]*") + "$";
  const regex = new RegExp(regexPattern, "i");
  return regex.test(subdomain);
}

const MULTI_PART_TLDS = new Set([
  "co.uk",
  "co.in",
  "co.jp",
  "co.kr",
  "co.nz",
  "co.za",
  "co.id",
  "com.au",
  "com.br",
  "com.cn",
  "com.mx",
  "com.sg",
  "com.tr",
  "org.uk",
  "org.au",
  "net.au",
  "net.in",
  "ac.uk",
  "gov.uk",
  "gov.in",
  "gov.au",
  "edu.au",
]);

/**
 * Extract base domain from hostname.
 *
 * Handles multi-part TLDs such as `.co.uk`:
 *   - `app.example.co.uk` → `example.co.uk`
 *   - `app.example.com`   → `example.com`
 */
export function extractBaseDomain(hostname: string): string {
  const parts = hostname.split(".");

  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join(".");
    if (MULTI_PART_TLDS.has(lastTwo)) {
      return parts.slice(-3).join(".");
    }
  }

  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }
  return hostname;
}

/**
 * Check if hostname is likely a subdomain
 */
export function isSubdomain(hostname: string, baseDomain?: string): boolean {
  if (baseDomain) {
    return hostname.endsWith(`.${baseDomain}`) || hostname === baseDomain;
  }

  const parts = hostname.split(".");
  return parts.length > 2;
}

/**
 * Safe base64 URL decode for JWT payloads
 */
export function safeBase64Decode(input: string): string | null {
  try {
    // JWT uses base64url encoding: replace - with + and _ with /
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    return atob(padded);
  } catch {
    return null;
  }
}

/**
 * Parse JWT payload safely
 */
export function parseJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const decoded = safeBase64Decode(parts[1]);
    if (!decoded) {
      return null;
    }

    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Create a logger function
 */
export function createLogger(debug = false): (message: string, data?: unknown) => void {
  if (!debug) {
    return () => {}; // No-op logger
  }

  return (message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const prefix = `[Tenancy ${timestamp}]`;

    if (data !== undefined) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  };
}
