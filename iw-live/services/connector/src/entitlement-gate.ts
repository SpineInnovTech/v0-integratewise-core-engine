/**
 * Sync Entitlement Gate
 *
 * Validates sync requests against plan-based entitlements.
 * Enforces quotas, frequency limits, and accelerator access.
 */

import type {
  SkuTier,
  SyncEntitlements,
  SyncRequest,
  EntitlementResult,
} from "@integratewise/types";
import { PLAN_SYNC_ENTITLEMENTS } from "@integratewise/types";
import { ACCELERATOR_SYNC_REGISTRY } from "@integratewise/accelerators";

export interface SubscriptionInfo {
  tier: SkuTier;
  status: "active" | "trial" | "past_due";
  expiresAt?: string;
}

export interface UsageInfo {
  recordsThisMonth: number;
  lastSyncAt?: string;
  activeConnectors: number;
}

export class SyncEntitlementGate {
  constructor(
    private readonly kv: KVNamespace,
    private readonly getSubscription: (tenantId: string) => Promise<SubscriptionInfo>,
    private readonly getUsage: (tenantId: string) => Promise<UsageInfo>
  ) {}

  /**
   * Validate a sync request against entitlements
   */
  async validateSyncRequest(tenantId: string, request: SyncRequest): Promise<EntitlementResult> {
    // 1. Check subscription status
    const subscription = await this.getSubscription(tenantId);

    if (subscription.status === "past_due") {
      return {
        allowed: false,
        reason: "Subscription payment past due. Please update billing.",
        upgradeRequired: true,
      };
    }

    if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
      return {
        allowed: false,
        reason: "Subscription expired. Please renew to continue syncing.",
        upgradeRequired: true,
      };
    }

    const entitlements = PLAN_SYNC_ENTITLEMENTS[subscription.tier];

    // 2. Check sync frequency (rate limit by connector)
    const frequencyCheck = await this.checkFrequency(tenantId, request.connectorId, entitlements);
    if (!frequencyCheck.allowed) return frequencyCheck;

    // 3. Check connector limit
    const connectorCheck = await this.checkConnectorLimit(
      tenantId,
      request.connectorId,
      entitlements
    );
    if (!connectorCheck.allowed) return connectorCheck;

    // 4. Check monthly record quota
    const quotaCheck = await this.checkRecordQuota(tenantId, entitlements);
    if (!quotaCheck.allowed) return quotaCheck;

    // 5. Validate accelerator access
    const acceleratorCheck = this.checkAcceleratorAccess(request.acceleratorId, entitlements);
    if (!acceleratorCheck.allowed) return acceleratorCheck;

    // 6. Validate entity types
    const entityCheck = this.checkEntityTypes(request.entityTypes, entitlements);
    if (!entityCheck.allowed) return entityCheck;

    // 7. Check sync type permissions
    const typeCheck = this.checkSyncType(request.syncType, entitlements);
    if (!typeCheck.allowed) return typeCheck;

    return { allowed: true, entitlements };
  }

  /**
   * Check if enough time has passed since last sync
   */
  private async checkFrequency(
    tenantId: string,
    connectorId: string,
    entitlements: SyncEntitlements
  ): Promise<EntitlementResult> {
    const lastSyncKey = `last_sync:${tenantId}:${connectorId}`;
    const lastSync = await this.kv.get(lastSyncKey);

    if (lastSync) {
      const lastSyncTime = parseInt(lastSync, 10);
      const minutesSinceLastSync = (Date.now() - lastSyncTime) / 60000;

      if (minutesSinceLastSync < entitlements.minSyncIntervalMinutes) {
        const retryAfter = Math.ceil(entitlements.minSyncIntervalMinutes - minutesSinceLastSync);

        return {
          allowed: false,
          reason: `Sync too frequent. ${entitlements.minSyncIntervalMinutes} minutes required between syncs.`,
          retryAfterMinutes: retryAfter,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check connector count limit
   */
  private async checkConnectorLimit(
    tenantId: string,
    connectorId: string,
    entitlements: SyncEntitlements
  ): Promise<EntitlementResult> {
    // Check if this connector is already active
    const connectorKey = `connector:${tenantId}:${connectorId}`;
    const isActive = await this.kv.get(connectorKey);

    if (isActive) {
      // Already active, no need to count
      return { allowed: true };
    }

    // New connector - check limit
    const { activeConnectors } = await this.getUsage(tenantId);

    if (activeConnectors >= entitlements.maxConnectors) {
      return {
        allowed: false,
        reason: `Connector limit reached (${entitlements.maxConnectors}). Upgrade to add more connectors.`,
        upgradeRequired: true,
      };
    }

    return { allowed: true };
  }

  /**
   * Check monthly record quota
   */
  private async checkRecordQuota(
    tenantId: string,
    entitlements: SyncEntitlements
  ): Promise<EntitlementResult> {
    const { recordsThisMonth } = await this.getUsage(tenantId);

    if (recordsThisMonth >= entitlements.maxRecordsPerMonth) {
      return {
        allowed: false,
        reason: `Monthly record quota exceeded (${entitlements.maxRecordsPerMonth.toLocaleString()}). Upgrade for more capacity.`,
        upgradeRequired: true,
      };
    }

    return { allowed: true };
  }

  /**
   * Check accelerator access
   */
  private checkAcceleratorAccess(
    acceleratorId: string,
    entitlements: SyncEntitlements
  ): EntitlementResult {
    if (entitlements.allowedAccelerators.includes("*")) {
      return { allowed: true };
    }

    if (entitlements.allowedAccelerators.includes(acceleratorId)) {
      return { allowed: true };
    }

    // Check if accelerator exists
    const accelerator = ACCELERATOR_SYNC_REGISTRY[acceleratorId];
    if (!accelerator) {
      return {
        allowed: false,
        reason: `Unknown accelerator: ${acceleratorId}`,
      };
    }

    return {
      allowed: false,
      reason: `Accelerator '${accelerator.name}' requires ${accelerator.minimumPlan} plan or higher.`,
      upgradeRequired: true,
    };
  }

  /**
   * Check entity type permissions
   */
  private checkEntityTypes(
    entityTypes: string[] | undefined,
    entitlements: SyncEntitlements
  ): EntitlementResult {
    if (!entityTypes || entityTypes.length === 0) {
      return { allowed: true };
    }

    if (entitlements.allowedEntityTypes.includes("*")) {
      return { allowed: true };
    }

    const disallowed = entityTypes.filter((et) => !entitlements.allowedEntityTypes.includes(et));

    if (disallowed.length > 0) {
      return {
        allowed: false,
        reason: `Entity types not allowed on current plan: ${disallowed.join(", ")}`,
        allowedEntities: entitlements.allowedEntityTypes,
      };
    }

    return { allowed: true };
  }

  /**
   * Check sync type permissions
   */
  private checkSyncType(syncType: string, entitlements: SyncEntitlements): EntitlementResult {
    switch (syncType) {
      case "webhook":
        if (!entitlements.supportsRealtimeWebhooks) {
          return {
            allowed: false,
            reason: "Real-time webhooks require Professional plan or higher.",
            upgradeRequired: true,
          };
        }
        break;

      case "full":
        if (!entitlements.supportsFullRefresh) {
          return {
            allowed: false,
            reason: "Full refresh sync requires Starter plan or higher.",
            upgradeRequired: true,
          };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Record sync completion for tracking
   */
  async recordSyncCompletion(
    tenantId: string,
    connectorId: string,
    recordCount: number
  ): Promise<void> {
    const lastSyncKey = `last_sync:${tenantId}:${connectorId}`;
    await this.kv.put(lastSyncKey, Date.now().toString());

    const connectorKey = `connector:${tenantId}:${connectorId}`;
    await this.kv.put(connectorKey, "active");

    // Update monthly usage
    const usageKey = `usage:${tenantId}:${this.getCurrentMonth()}`;
    const current = parseInt((await this.kv.get(usageKey)) || "0", 10);
    await this.kv.put(usageKey, (current + recordCount).toString());
  }

  private getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7); // '2026-03'
  }
}
