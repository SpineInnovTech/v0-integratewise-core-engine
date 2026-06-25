/**
 * ADK Capability Resolver
 *
 * Stateless. Routes capability requests to correct implementations.
 * Checks: tier gate → connector gate → routing → fallback.
 *
 * Resolution flow:
 *   1. Does capability exist? → 404 if not
 *   2. Does tenant tier satisfy min_tier? → 403 PLAN_INSUFFICIENT
 *   3. Does capability require connector? Is it connected? → 403 CONNECTOR_NOT_AVAILABLE
 *   4. Is connector syncing initial? → 202 CONNECTOR_SYNCING
 *   5. Route to primary target
 *   6. If primary fails → route to fallback
 */

import { CapabilityRegistry, BUILTIN_CAPABILITIES } from "./registry";
import type {
  Capability,
  CapabilityRequest,
  CapabilityResponse,
  RouteTarget,
  RoutingContext,
  TenantContext,
} from "./types";

const TIER_ORDER = ["free", "starter", "pro", "enterprise"];

export class CapabilityResolver {
  private registry: CapabilityRegistry;
  private kv: KVNamespace | null;
  private readonly TENANT_CONFIG_TTL = 5 * 60; // 5 minutes
  private readonly CONNECTOR_STATUS_TTL = 30; // 30 seconds

  constructor(kv?: KVNamespace) {
    this.registry = new CapabilityRegistry(BUILTIN_CAPABILITIES, kv);
    this.kv = kv || null;
  }

  /**
   * Resolve a capability request to a route target.
   * This is the core routing function — called on every MCP tool invocation.
   */
  async resolve(request: CapabilityRequest): Promise<CapabilityResponse> {
    const { capability, context } = request;

    // 1. Does capability exist?
    const cap = this.registry.get(capability);
    if (!cap) {
      return {
        resolved: false,
        error: "CAPABILITY_NOT_FOUND",
        message: `Capability '${capability}' is not supported.`,
      };
    }

    // 2. Tier gate
    const requiredTierIdx = TIER_ORDER.indexOf(cap.min_tier);
    const actualTierIdx = TIER_ORDER.indexOf(context.tier);
    if (actualTierIdx < requiredTierIdx) {
      return {
        resolved: false,
        error: "PLAN_INSUFFICIENT",
        message: `Upgrade to ${cap.min_tier} plan to access ${capability}.`,
        upgrade_url: `https://app.integratewise.ai/billing/upgrade?tier=${cap.min_tier}`,
      };
    }

    // 3. Connector gate (if capability requires a connected source)
    if (cap.requires_connector) {
      const entityType = request.arguments.entity_type as string | undefined;
      const source = request.arguments.source as string | undefined;

      if (source && !context.connected_sources.includes(source)) {
        return {
          resolved: false,
          error: "CONNECTOR_NOT_AVAILABLE",
          message: `"${source}" is not connected. Connect it at /connectors.`,
          connect_url: `https://app.integratewise.ai/connectors/${source}/oauth`,
        };
      }
    }

    // 4. Check connector sync status (if KV available)
    if (cap.requires_connector && this.kv) {
      const source = request.arguments.source as string | undefined;
      if (source) {
        const statusKey = `sync:${context.tenant_id}:${source}`;
        const statusRaw = await this.kv.get(statusKey);
        if (statusRaw) {
          const status = JSON.parse(statusRaw);
          if (status.status === "syncing_initial") {
            return {
              resolved: false,
              error: "CONNECTOR_SYNCING",
              message: `${source} is performing initial sync. Data will be available shortly.`,
              sync_progress: status.progress || 0.5,
            };
          }
        }
      }
    }

    // 5. Route to primary target
    return {
      resolved: true,
      target: cap.routing.primary,
    };
  }

  /**
   * Resolve with fallback — tries primary, falls back if primary returns null/error.
   */
  async resolveWithFallback(request: CapabilityRequest): Promise<CapabilityResponse> {
    const result = await this.resolve(request);
    if (!result.resolved) return result;

    // If primary target might fail, prepare fallback
    const cap = this.registry.get(request.capability);
    if (cap?.routing.fallback) {
      return {
        ...result,
        // Caller can check target and fall through to fallback if needed
        target: result.target,
      };
    }

    return result;
  }

  /**
   * Get the fallback target for a capability (if primary fails).
   */
  getFallback(capability: string): RouteTarget | undefined {
    return this.registry.get(capability)?.routing.fallback;
  }

  /**
   * List capabilities available for a given tier.
   */
  listForTier(tier: string): Capability[] {
    return this.registry.list(tier);
  }

  /**
   * Get tenant context from KV cache (5-min TTL) or D1.
   */
  async getTenantContext(tenantId: string, db?: D1Database): Promise<TenantContext | null> {
    // Try KV cache first
    if (this.kv) {
      const cached = await this.kv.get(`adk:tenant:${tenantId}`);
      if (cached) return JSON.parse(cached);
    }

    // Fall through to D1
    if (!db) return null;
    const row = await db
      .prepare("SELECT * FROM tenant_spine_config WHERE tenant_id = ?")
      .bind(tenantId)
      .first<any>();

    if (!row) return null;

    const ctx: TenantContext = {
      tenant_id: tenantId,
      tier: row.subscription_tier || "free",
      domains: JSON.parse(row.domains || "[]"),
      industry: row.industry || "",
      allowed_entity_types: JSON.parse(row.allowed_entity_types || "[]"),
      connected_connectors: JSON.parse(row.connected_connectors || "[]"),
      schema_version: row.schema_version || "v1",
    };

    // Cache in KV (5-min TTL)
    if (this.kv) {
      await this.kv.put(`adk:tenant:${tenantId}`, JSON.stringify(ctx), {
        expirationTtl: this.TENANT_CONFIG_TTL,
      });
    }

    return ctx;
  }

  /**
   * Build a RoutingContext from TenantContext + request headers.
   */
  buildContext(tenant: TenantContext, userId: string, role: string): RoutingContext {
    return {
      tenant_id: tenant.tenant_id,
      user_id: userId,
      role,
      tier: tenant.tier,
      connected_sources: tenant.connected_connectors,
      allowed_entity_types: tenant.allowed_entity_types,
    };
  }

  /** Access the underlying registry */
  getRegistry(): CapabilityRegistry {
    return this.registry;
  }
}

/**
 * Create an ADK resolver instance.
 * Call once per worker, reuse across requests.
 */
export function createResolver(kv?: KVNamespace): CapabilityResolver {
  return new CapabilityResolver(kv);
}
