/**
 * TanStack Query Client Configuration
 *
 * Centralized QueryClient singleton with default staleTime/gcTime for
 * instant cached responses (R7: Returning User Fast Hydration) and
 * query key factory functions for consistent cache management.
 *
 * Requirements: R5 (All Workspace API Calls Route Through CF Gateway),
 *               R7 (Returning User Fast Hydration)
 */

import { QueryClient } from "@tanstack/react-query";

// ─── Query Client Singleton ──────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s before revalidation
      gcTime: 5 * 60_000, // 5min garbage collection
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

// ─── Query Key Factory ───────────────────────────────────────────────────────

/**
 * Typed query key factory for consistent cache key management across the app.
 *
 * Conventions:
 * - ['entities', entityType, filters]
 * - ['dashboard', domain]
 * - ['signals', tenantId]
 * - ['memory', 'org', query]
 * - ['connectors']
 * - ['morning-context']
 */
export const queryKeys = {
  /** Entity queries: ['entities', type?, filters?] */
  entities: {
    all: ["entities"] as const,
    byType: (entityType: string) => ["entities", entityType] as const,
    filtered: (entityType: string, filters: Record<string, string>) =>
      ["entities", entityType, filters] as const,
  },

  /** Dashboard queries: ['dashboard', domain?] */
  dashboard: {
    all: ["dashboard"] as const,
    byDomain: (domain: string) => ["dashboard", domain] as const,
  },

  /** Signal queries: ['signals', tenantId?, filters?] */
  signals: {
    all: ["signals"] as const,
    byTenant: (tenantId: string) => ["signals", tenantId] as const,
    filtered: (tenantId: string, filters: Record<string, string>) =>
      ["signals", tenantId, filters] as const,
  },

  /** Memory queries: ['memory', type, query?] */
  memory: {
    all: ["memory"] as const,
    org: (query?: string) =>
      query ? (["memory", "org", query] as const) : (["memory", "org"] as const),
    conversational: (sessionId?: string) =>
      sessionId
        ? (["memory", "conversational", sessionId] as const)
        : (["memory", "conversational"] as const),
    personal: () => ["memory", "personal"] as const,
  },

  /** Connector queries: ['connectors', provider?] */
  connectors: {
    all: ["connectors"] as const,
    byProvider: (provider: string) => ["connectors", provider] as const,
    status: (provider: string) => ["connectors", provider, "status"] as const,
  },

  /** Morning context: ['morning-context'] */
  morningContext: () => ["morning-context"] as const,

  /** Pipeline status: ['pipeline-status', connector?] */
  pipeline: {
    status: () => ["pipeline-status"] as const,
    byConnector: (connector: string) => ["pipeline-status", connector] as const,
    delta: () => ["pipeline-delta"] as const,
  },
} as const;
