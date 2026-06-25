/**
 * Subdomain lookup helpers
 *
 * Factory functions that produce {@link SubdomainLookupFn} instances for
 * common subdomain → tenant-id resolution patterns.
 */

import type { TenantId } from "@integratewise/types";
import type { SubdomainLookupFn } from "./types";

/**
 * Create a lookup backed by a static in-memory map.
 *
 * Useful for dev/test environments or small deployments where the full
 * subdomain → tenant mapping is known ahead of time.
 *
 * @example
 * ```ts
 * const lookup = createMemorySubdomainLookup({
 *   acme: "550e8400-e29b-41d4-a716-446655440000" as TenantId,
 *   globex: "6ba7b810-9dad-11d1-80b4-00c04fd430c8" as TenantId,
 * });
 * ```
 */
export function createMemorySubdomainLookup(map: Record<string, TenantId>): SubdomainLookupFn {
  return (subdomain: string) => map[subdomain] ?? null;
}

/**
 * Wrap an existing lookup with a TTL-based in-memory cache so repeated
 * lookups for the same subdomain avoid redundant async work (e.g. DB calls).
 *
 * @param lookup  - The underlying (potentially async) lookup function.
 * @param ttlMs   - Cache entry lifetime in milliseconds (default 60 000 ms).
 * @param maxSize - Max number of entries before the oldest is evicted (default 1 000).
 */
export function createCachedSubdomainLookup(
  lookup: SubdomainLookupFn,
  ttlMs = 60_000,
  maxSize = 1_000
): SubdomainLookupFn {
  const cache = new Map<string, { value: TenantId | null; expiresAt: number }>();

  return async (subdomain: string): Promise<TenantId | null> => {
    const now = Date.now();
    const cached = cache.get(subdomain);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const result = await lookup(subdomain);

    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }

    cache.set(subdomain, { value: result, expiresAt: now + ttlMs });
    return result;
  };
}

/**
 * Wrap a lookup so that the subdomain is validated before being forwarded.
 *
 * Returns `null` immediately for subdomains that fail the predicate, avoiding
 * unnecessary downstream work.
 *
 * @param lookup   - The underlying lookup function.
 * @param validate - A predicate that returns `true` for valid subdomains.
 *                   Defaults to rejecting empty strings and strings with
 *                   characters outside `[a-z0-9-]`.
 */
export function createValidatedSubdomainLookup(
  lookup: SubdomainLookupFn,
  validate: (subdomain: string) => boolean = defaultSubdomainValidator
): SubdomainLookupFn {
  return (subdomain: string) => {
    if (!validate(subdomain)) return null;
    return lookup(subdomain);
  };
}

/**
 * Combine multiple lookup functions into a single one that tries each in order
 * and returns the first non-null result.
 */
export function combineSubdomainLookups(...lookups: SubdomainLookupFn[]): SubdomainLookupFn {
  return async (subdomain: string): Promise<TenantId | null> => {
    for (const lookup of lookups) {
      const result = await lookup(subdomain);
      if (result !== null) return result;
    }
    return null;
  };
}

function defaultSubdomainValidator(subdomain: string): boolean {
  if (!subdomain) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(subdomain);
}
