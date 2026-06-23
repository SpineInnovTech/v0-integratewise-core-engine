/**
 * Hydration Fabric — Public API
 *
 * Single import point for the entire fabric system.
 *
 * Usage:
 *   import { HydrationFabric, useHydrate, useFabricStatus } from "./components/hydration";
 */

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  HydrationPhase,
  SlotState,
  ProviderType,
  DataProvider,
  ProviderFactory,
  ProviderResult,
  ProviderConfig,
  Provenance,
  HealthStatus,
  SlotBinding,
  RetryPolicy,
  RoleBinding,
  HydrationStrategy,
  SlotOverride,
  FabricManifest,
  TransformDef,
  HydrationContext,
  FabricStatus,
  FabricContextValue,
} from "./types";

// ── Engine ───────────────────────────────────────────────────────────────────
export { HydrationFabric, useFabric } from "./fabric-engine";
export type { HydrationFabricProps } from "./fabric-engine";

// ── Hooks ────────────────────────────────────────────────────────────────────
export {
  useHydrate,
  useHydrateMany,
  useFabricStatus,
  useFabricManifest,
  useHydrationContext,
  useProviderHealth,
  useSlotConfig,
  useDomainSlots,
  useScopedSlots,
  useInvalidateOnEvent,
} from "./hooks";

// ── Migration Bridge ─────────────────────────────────────────────────────────
export { useHydrateProjection, useHydrateDomainTable } from "./use-hydrate-projection";
export type { HydrateProjectionResult } from "./use-hydrate-projection";

// ── Admin Panel ──────────────────────────────────────────────────────────────
export { FabricAdminPanel } from "./fabric-admin-panel";

// ── Provider Bus ─────────────────────────────────────────────────────────────
export { ProviderBus, getProviderBus, resetProviderBus } from "./provider-bus";

// ── Provider Factories (for custom registration) ─────────────────────────────
export { createSpineAdapter } from "./providers/spine-adapter";
export { createRestAdapter } from "./providers/rest-adapter";
export { createDopplerAdapter } from "./providers/doppler-adapter";
export {
  createStaticAdapter,
  registerStaticData,
  getStaticData,
  clearStaticData,
} from "./providers/static-adapter";
export { createKVAdapter } from "./providers/kv-adapter";
