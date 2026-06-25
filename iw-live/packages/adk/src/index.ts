/**
 * @integratewise/adk — Agentic Development Kit
 *
 * The MuleSoft of AI. Capability-first routing.
 * Separates stable AI-facing capabilities from unstable implementations.
 *
 * AI clients call capabilities. ADK resolves to implementations.
 * Implementations change. Capabilities don't. That's the moat.
 *
 * Components:
 *   CapabilityResolver  — routes capabilities to implementations (tier + connector gated)
 *   CapabilityRegistry  — defines what capabilities exist (KV-cached, 24h TTL)
 *   AgentRegistry       — tracks which agents/tools handle which capabilities
 *   SpineCache          — KV-backed hot cache (sub-10ms reads, TTL-managed)
 */

export { CapabilityResolver, createResolver } from "./resolver";
export { CapabilityRegistry, BUILTIN_CAPABILITIES } from "./registry";
export { AgentRegistry, DEFAULT_AGENTS } from "./agent-registry";
export type { AgentEntry, ToolEntry } from "./agent-registry";
export { SpineCache } from "./spine-cache";
export type { CacheEntry, SpineCacheConfig } from "./spine-cache";
export type {
  Capability,
  CapabilityRequest,
  CapabilityResponse,
  RouteTarget,
  RoutingContext,
  FallbackChain,
  TenantContext,
} from "./types";
