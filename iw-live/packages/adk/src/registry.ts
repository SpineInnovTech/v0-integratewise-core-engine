/**
 * ADK Capability Registry
 *
 * Defines ALL capabilities the system exposes.
 * Capabilities are STABLE — they never change even when implementations do.
 * This is the MuleSoft RAML equivalent for AI consumption.
 */

import type { Capability } from "./types";

/** Built-in capabilities — the stable contract */
export const BUILTIN_CAPABILITIES: Capability[] = [
  // ─── SPINE (operational truth) ─────────────────────────────────────
  {
    name: "spine.entity.read",
    description:
      "Query normalized entities from the operational truth layer. Source identity erased — returns canonical entities only.",
    min_tier: "free",
    scopes: ["read:spine"],
    requires_connector: false,
    routing: {
      primary: { type: "ENCRYPTED_VAULT", target: "spine_vault", strategy: "index_lookup" },
      fallback: { type: "LOCAL_D1", target: "entity_cache", strategy: "full_scan" },
    },
  },
  {
    name: "spine.entity.get",
    description: "Get full state of a specific entity by source + source_id.",
    min_tier: "free",
    scopes: ["read:spine"],
    requires_connector: true,
    routing: {
      primary: { type: "ENCRYPTED_VAULT", target: "spine_vault", strategy: "index_lookup" },
    },
  },
  {
    name: "spine.entity.search",
    description: "Search entities by name or attributes across all connected sources.",
    min_tier: "starter",
    scopes: ["read:spine"],
    requires_connector: false,
    routing: {
      primary: { type: "ENCRYPTED_VAULT", target: "spine_vault", strategy: "full_scan" },
    },
  },
  {
    name: "spine.signals.list",
    description:
      "List active intelligence signals for the tenant. Signals fire when entity state changes.",
    min_tier: "starter",
    scopes: ["read:spine"],
    requires_connector: false,
    routing: {
      primary: { type: "LOCAL_D1", target: "signals", strategy: "index_lookup" },
    },
  },
  {
    name: "spine.summary",
    description: "Get high-level summary: entity counts, connected sources, system state.",
    min_tier: "free",
    scopes: ["read:spine"],
    requires_connector: false,
    routing: {
      primary: { type: "LOCAL_D1", target: "tenant_spine_config", strategy: "index_lookup" },
    },
  },

  // ─── MEMORY (institutional knowledge) ──────────────────────────────
  {
    name: "memory.search",
    description:
      "Semantic search across institutional memory. Returns decisions, patterns, commitments, learnings.",
    min_tier: "pro",
    scopes: ["read:memory"],
    requires_connector: false,
    routing: {
      primary: {
        type: "VECTOR_INDEX",
        target: "integratewise-knowledge",
        strategy: "semantic_query",
      },
    },
  },
  {
    name: "memory.read_org",
    description: "Read governed organizational memory entries. Filtered by category.",
    min_tier: "starter",
    scopes: ["read:memory"],
    requires_connector: false,
    routing: {
      primary: { type: "LOCAL_D1", target: "org_memory", strategy: "index_lookup" },
    },
  },
  {
    name: "memory.read_conversational",
    description: "Read conversational memory (session transcripts, working context).",
    min_tier: "starter",
    scopes: ["read:memory"],
    requires_connector: false,
    routing: {
      primary: { type: "LOCAL_D1", target: "conversational_memory", strategy: "index_lookup" },
    },
  },
  {
    name: "memory.propose",
    description:
      "Propose new knowledge for governance review. Does NOT write directly — enters Triage Bot queue.",
    min_tier: "starter",
    scopes: ["write:memory"],
    requires_connector: false,
    routing: {
      primary: { type: "LOCAL_D1", target: "proposals", strategy: "service_call" },
    },
  },

  // ─── GOVERNANCE (trust layer) ──────────────────────────────────────
  {
    name: "governance.proposals.list",
    description: "List pending proposals waiting for human review.",
    min_tier: "starter",
    scopes: ["read:governance"],
    requires_connector: false,
    routing: {
      primary: { type: "LOCAL_D1", target: "proposals", strategy: "index_lookup" },
    },
  },
  {
    name: "governance.proposals.approve",
    description: "Approve a proposal. Requires human authority.",
    min_tier: "starter",
    scopes: ["write:governance"],
    requires_connector: false,
    routing: {
      primary: { type: "SERVICE_BINDING", target: "intelligence", strategy: "service_call" },
    },
  },
  {
    name: "governance.proposals.reject",
    description: "Reject a proposal with reason.",
    min_tier: "starter",
    scopes: ["write:governance"],
    requires_connector: false,
    routing: {
      primary: { type: "SERVICE_BINDING", target: "intelligence", strategy: "service_call" },
    },
  },
  {
    name: "governance.tasks.list",
    description: "List shared tasks between Real Twin and Digital Twin.",
    min_tier: "starter",
    scopes: ["read:governance"],
    requires_connector: false,
    routing: {
      primary: { type: "LOCAL_D1", target: "tasks", strategy: "index_lookup" },
    },
  },
  {
    name: "governance.decisions.list",
    description: "List recorded decisions with lineage.",
    min_tier: "starter",
    scopes: ["read:governance"],
    requires_connector: false,
    routing: {
      primary: { type: "LOCAL_D1", target: "decisions", strategy: "index_lookup" },
    },
  },

  // ─── CONNECTORS (tool management) ─────────────────────────────────
  {
    name: "connector.list",
    description: "List connected data sources and their sync status.",
    min_tier: "free",
    scopes: ["read:connector"],
    requires_connector: false,
    routing: {
      primary: { type: "KV_CACHE", target: "CONNECTOR_STATUS", strategy: "kv_get" },
    },
  },
  {
    name: "connector.sync",
    description: "Trigger a sync for a specific connected source.",
    min_tier: "starter",
    scopes: ["write:connector"],
    requires_connector: true,
    routing: {
      primary: { type: "SERVICE_BINDING", target: "connector-sync", strategy: "service_call" },
    },
  },

  // ─── ASSEMBLY (projections) ────────────────────────────────────────
  {
    name: "assembly.morning_context",
    description: "Assemble the morning briefing: signals + entities + commitments + renewals.",
    min_tier: "free",
    scopes: ["read:spine", "read:memory"],
    requires_connector: false,
    routing: {
      primary: { type: "SERVICE_BINDING", target: "gateway", strategy: "service_call" },
    },
  },
  {
    name: "assembly.entity360",
    description: "Assemble full Entity 360: Spine + Memory + Signals for one entity.",
    min_tier: "starter",
    scopes: ["read:spine", "read:memory"],
    requires_connector: false,
    routing: {
      primary: { type: "SERVICE_BINDING", target: "pipeline", strategy: "service_call" },
    },
  },
];

/**
 * Capability Registry — KV-cached, TTL-managed
 */
export class CapabilityRegistry {
  private capabilities: Map<string, Capability>;
  private kv: KVNamespace | null;
  private readonly REGISTRY_TTL = 24 * 60 * 60; // 24 hours

  constructor(capabilities: Capability[] = BUILTIN_CAPABILITIES, kv?: KVNamespace) {
    this.capabilities = new Map(capabilities.map((c) => [c.name, c]));
    this.kv = kv || null;
  }

  /** Get a capability by name */
  get(name: string): Capability | undefined {
    return this.capabilities.get(name);
  }

  /** List all capabilities (optionally filtered by tier) */
  list(maxTier?: string): Capability[] {
    const tierOrder = ["free", "starter", "pro", "enterprise"];
    const all = Array.from(this.capabilities.values());
    if (!maxTier) return all;
    const maxIdx = tierOrder.indexOf(maxTier);
    return all.filter((c) => tierOrder.indexOf(c.min_tier) <= maxIdx);
  }

  /** Check if a capability exists */
  has(name: string): boolean {
    return this.capabilities.has(name);
  }

  /** Register a custom capability (for plugins/extensions) */
  register(capability: Capability): void {
    this.capabilities.set(capability.name, capability);
  }

  /** Cache the registry to KV (24h TTL) */
  async cache(): Promise<void> {
    if (!this.kv) return;
    const serialized = JSON.stringify(Array.from(this.capabilities.values()));
    await this.kv.put("adk:capability_registry", serialized, { expirationTtl: this.REGISTRY_TTL });
  }

  /** Load from KV cache (returns false if cache miss) */
  async loadFromCache(): Promise<boolean> {
    if (!this.kv) return false;
    const cached = await this.kv.get("adk:capability_registry");
    if (!cached) return false;
    const capabilities: Capability[] = JSON.parse(cached);
    this.capabilities = new Map(capabilities.map((c) => [c.name, c]));
    return true;
  }
}
