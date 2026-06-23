/**
 * Hydration Fabric — Type Contracts
 *
 * Provider-agnostic, dynamically-instantiated, role-gated data hydration system.
 * This file defines EVERY contract the Fabric uses — no runtime code.
 *
 * Architecture:
 *   UI hooks  -->  FabricEngine (context)  -->  ProviderBus  -->  DataProvider(s)
 *                        |                           |
 *                   SlotResolver              Dynamic Registry
 *                   RoleGate                  (spine, rest, doppler, static)
 *                   CacheLayer
 *                        |
 *                   FabricManifest  <--  Server  <--  Doppler / KV / Env
 */

import type { Domain } from "@/components/l1/workspace/workspace-config";

// ─── Hydration Phase Machine ─────────────────────────────────────────────────

/** Progressive hydration lifecycle for each slot */
export type HydrationPhase =
  | "idle" // registered but not yet requested
  | "config" // resolving provider binding
  | "skeleton" // config resolved, fetch in progress
  | "partial" // stale cache served, background refresh running
  | "complete" // fully hydrated
  | "error" // fetch failed (retryable)
  | "stale"; // past TTL, still serving old data

/** State machine for a single slot's hydration lifecycle */
export interface SlotState<T = any> {
  slotId: string;
  phase: HydrationPhase;
  data: T | null;
  error: string | null;
  fetchedAt: number | null; // Date.now() of last successful fetch
  staleAt: number | null; // when data becomes stale (fetchedAt + ttl)
  retryCount: number;
  provenance: Provenance | null;
}

// ─── Provider Contract ───────────────────────────────────────────────────────

/** Every provider type the system supports */
export type ProviderType =
  | "spine" // wraps existing SpineProvider / spine-client.ts API
  | "rest" // generic REST (any URL, any auth)
  | "doppler" // reads data directly from Doppler secrets/configs
  | "static" // embedded JSON data (fallbacks, mocks, defaults)
  | "kv" // reads directly from Supabase KV store via server
  | "graphql"; // reserved for future

/** Universal data provider interface — every adapter implements this */
export interface DataProvider {
  readonly type: ProviderType;

  /** Fetch data for a given slot binding. Returns standardized result. */
  fetch<T = any>(binding: SlotBinding, context: HydrationContext): Promise<ProviderResult<T>>;

  /** Optional: subscribe to real-time updates */
  subscribe?<T = any>(
    binding: SlotBinding,
    context: HydrationContext,
    callback: (data: T) => void
  ): Unsubscribe;

  /** Optional: check if this provider is reachable */
  healthCheck?(): Promise<HealthStatus>;

  /** Teardown / cleanup */
  dispose?(): void;
}

/** Factory function that creates a provider instance from config */
export type ProviderFactory = (config: ProviderConfig) => DataProvider;

export type Unsubscribe = () => void;

/** Result of a provider fetch — standardized across all providers */
export interface ProviderResult<T = any> {
  data: T;
  provenance: Provenance;
  freshness: number; // 0–1, how fresh the data is (1 = just fetched)
  cached: boolean; // true if served from cache
  partial: boolean; // true if only a subset of expected data
  fetchDuration: number; // ms
}

/** Data lineage — where did this data come from? */
export interface Provenance {
  provider: ProviderType;
  endpoint: string;
  fetchedAt: string; // ISO timestamp
  sourceSystem?: string; // e.g. "salesforce", "hubspot", "doppler"
  confidence: number; // 0–1
  transformApplied?: string;
}

/** Provider health status */
export interface HealthStatus {
  provider: ProviderType;
  healthy: boolean;
  latencyMs: number;
  lastChecked: string;
  errorMessage?: string;
}

// ─── Slot Binding (from Manifest) ────────────────────────────────────────────

/** Maps a UI slot to its data provider — this is the core configurable mapping */
export interface SlotBinding {
  slotId: string; // e.g. "sales.pipeline.deals"
  provider: ProviderType; // which provider to use
  endpoint: string; // provider-specific endpoint/path
  method?: "GET" | "POST"; // for REST
  params?: Record<string, any>; // static params merged into fetch
  headers?: Record<string, string>; // extra headers (REST/doppler)
  transform?: string; // named transform to apply to response
  ttl: number; // cache TTL in ms (0 = no cache)
  priority: number; // fetch ordering (lower = earlier)
  fallbackSlotId?: string; // if primary fails, try this slot config
  fallbackProvider?: ProviderType; // alt provider if primary fails
  retryPolicy?: RetryPolicy;
  tags?: string[]; // for grouping/filtering
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number; // initial backoff
  backoffMultiplier: number; // exponential multiplier
}

// ─── Provider Configuration ──────────────────────────────────────────────────

/** Per-provider global config — lives in the manifest */
export interface ProviderConfig {
  type: ProviderType;
  enabled: boolean;
  baseUrl?: string; // for REST/graphql
  authHeader?: string; // authorization header value
  defaultHeaders?: Record<string, string>;
  timeout?: number; // ms
  rateLimit?: number; // max requests per minute
  meta?: Record<string, any>; // provider-specific config
}

// ─── Role Binding ────────────────────────────────────────────────────────────

/** Defines what slots a role can access and how they hydrate */
export interface RoleBinding {
  roleId: string; // matches domain or custom role
  domain: Domain;
  allowedSlots: string[]; // slot ID patterns (supports `*` wildcards)
  deniedSlots?: string[]; // explicit deny (takes precedence)
  overrides?: SlotOverride[]; // role-specific config overrides
  hydrationStrategy: HydrationStrategy;
  maxConcurrent: number; // max parallel provider fetches
  preloadSlots?: string[]; // eagerly hydrate these on login
}

export type HydrationStrategy = "eager" | "lazy" | "on-demand";

/** Role-specific overrides for a slot binding */
export interface SlotOverride {
  slotId: string;
  provider?: ProviderType;
  endpoint?: string;
  ttl?: number;
  transform?: string;
  priority?: number;
}

// ─── Fabric Manifest ────────────────────────────────────────────────────────

/**
 * The master configuration document — fetched from the server on app boot.
 * Server builds it from: Doppler API > env vars > KV store > inline defaults.
 * This is the SSOT for all UI ↔ Backend mappings.
 */
export interface FabricManifest {
  version: string;
  generatedAt: string;
  configSource: "doppler" | "env" | "kv" | "inline" | "merged";

  /** All slot bindings keyed by slotId */
  slots: Record<string, SlotBinding>;

  /** Role-based access and hydration config */
  roleBindings: Record<string, RoleBinding>;

  /** Global provider configs */
  providers: Record<ProviderType, ProviderConfig>;

  /** Named transform functions (server-side references) */
  transforms: Record<string, TransformDef>;

  /** Doppler project/config metadata (if sourced from Doppler) */
  dopplerMeta?: {
    project: string;
    config: string;
    environment: string;
    lastSyncedAt: string;
  };
}

/** Named data transform definition */
export interface TransformDef {
  id: string;
  description: string;
  type: "map" | "filter" | "reduce" | "reshape" | "chain";
  /** For simple transforms, a JSONPath or field mapping spec */
  spec?: Record<string, string>;
}

// ─── Hydration Context (passed to providers) ─────────────────────────────────

/** Contextual info available to every provider fetch */
export interface HydrationContext {
  domain: Domain;
  role: string;
  tenantId: string;
  userName: string;
  department?: string;
  connectedApps: string[];
  accessToken?: string;
  /** Extra context that UI components can pass */
  extra?: Record<string, any>;
}

// ─── Fabric Engine State ─────────────────────────────────────────────────────

/** Overall fabric status */
export interface FabricStatus {
  initialized: boolean;
  initializing: boolean;
  manifestLoaded: boolean;
  configSource: FabricManifest["configSource"] | null;
  activeProviders: ProviderType[];
  slotCount: number;
  healthyProviders: number;
  totalProviders: number;
  lastManifestFetch: string | null;
  error: string | null;
}

/** The full context value exposed by HydrationFabric provider */
export interface FabricContextValue {
  /** Overall status */
  status: FabricStatus;

  /** The loaded manifest (null until loaded) */
  manifest: FabricManifest | null;

  /** Current hydration context (role, domain, tenant, etc.) */
  context: HydrationContext;

  /** Get current state for a slot */
  getSlotState<T = any>(slotId: string): SlotState<T>;

  /** Imperatively trigger hydration for a slot */
  hydrate<T = any>(slotId: string, extraParams?: Record<string, any>): Promise<T | null>;

  /** Invalidate cached data for a slot (forces re-fetch on next read) */
  invalidate(slotId: string): void;

  /** Invalidate all slots matching a pattern (e.g. "sales.*") */
  invalidatePattern(pattern: string): void;

  /** Re-fetch the manifest from the server */
  refreshManifest(): Promise<void>;

  /** Update hydration context (e.g. when domain/role changes) */
  updateContext(patch: Partial<HydrationContext>): void;

  /** Register a custom provider at runtime */
  registerProvider(type: ProviderType, factory: ProviderFactory, config: ProviderConfig): void;

  /** Get provider health */
  getProviderHealth(): Promise<Record<ProviderType, HealthStatus>>;
}
