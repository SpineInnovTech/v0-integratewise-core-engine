// Entitlement Enforcement Utilities
// Server-side and client-side helpers to gate features based on subscription

import { BillingService } from './service';
import { ENTITLEMENT_KEYS, type EntitlementKey } from './types';

/**
 * Server-side entitlement check
 * Use in API routes and server components
 */
export class EntitlementEnforcement {
  /**
   * Check if org has access to a feature
   */
  static async checkAccess(org_id: string, entitlementKey: EntitlementKey): Promise<boolean> {
    try {
      const hasAccess = await BillingService.hasEntitlement(org_id, entitlementKey);
      return hasAccess;
    } catch (error) {
      console.error('Error checking entitlement:', error);
      // Fail open in development, closed in production
      return process.env.NODE_ENV === 'development';
    }
  }

  /**
   * Get entitlement value (e.g., max workflows, token quota)
   */
  static async getValue(org_id: string, entitlementKey: EntitlementKey): Promise<any> {
    try {
      const value = await BillingService.getEntitlementValue(org_id, entitlementKey);
      return value;
    } catch (error) {
      console.error('Error getting entitlement value:', error);
      return null;
    }
  }

  /**
   * Check if usage is within limits
   */
  static async checkLimit(
    org_id: string,
    entitlementKey: EntitlementKey,
    currentUsage: number
  ): Promise<{ allowed: boolean; limit: number; usage: number }> {
    try {
      const limit = await this.getValue(org_id, entitlementKey);
      
      // Unlimited plans have very high limits
      const isUnlimited = limit >= 999999;
      
      return {
        allowed: isUnlimited || currentUsage < limit,
        limit: isUnlimited ? Infinity : limit,
        usage: currentUsage,
      };
    } catch (error) {
      console.error('Error checking limit:', error);
      return { allowed: false, limit: 0, usage: currentUsage };
    }
  }

  /**
   * Require specific entitlement or throw error
   * Useful for API route protection
   */
  static async requireEntitlement(org_id: string, entitlementKey: EntitlementKey): Promise<void> {
    const hasAccess = await this.checkAccess(org_id, entitlementKey);
    
    if (!hasAccess) {
      throw new EntitlementError(
        `Feature not available: ${entitlementKey}. Please upgrade your plan.`,
        entitlementKey
      );
    }
  }

  /**
   * Require usage within limit or throw error
   */
  static async requireWithinLimit(
    org_id: string,
    entitlementKey: EntitlementKey,
    currentUsage: number
  ): Promise<void> {
    const result = await this.checkLimit(org_id, entitlementKey, currentUsage);
    
    if (!result.allowed) {
      throw new EntitlementError(
        `Limit exceeded: ${entitlementKey}. Current: ${result.usage}, Limit: ${result.limit}. Please upgrade your plan.`,
        entitlementKey,
        { usage: result.usage, limit: result.limit }
      );
    }
  }

  /**
   * Get all entitlements for an org
   */
  static async getAll(org_id: string): Promise<Record<string, any>> {
    try {
      return await BillingService.getEntitlements(org_id);
    } catch (error) {
      console.error('Error getting all entitlements:', error);
      return {};
    }
  }

  /**
   * Check if subscription is active
   */
  static async isSubscriptionActive(org_id: string): Promise<boolean> {
    try {
      const subscription = await BillingService.getSubscription(org_id);
      return subscription !== null && ['trial', 'active'].includes(subscription.subscription.status);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
}

/**
 * Custom error for entitlement violations
 */
export class EntitlementError extends Error {
  constructor(
    message: string,
    public entitlementKey: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'EntitlementError';
  }

  toJSON() {
    return {
      error: 'EntitlementError',
      message: this.message,
      entitlement: this.entitlementKey,
      details: this.details,
      upgrade_url: '/pricing',
    };
  }
}

/**
 * Middleware helper to check entitlements in API routes
 */
export async function withEntitlement(
  org_id: string,
  entitlementKey: EntitlementKey,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    await EntitlementEnforcement.requireEntitlement(org_id, entitlementKey);
    return await handler();
  } catch (error) {
    if (error instanceof EntitlementError) {
      return new Response(JSON.stringify(error.toJSON()), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }
}

/**
 * Middleware helper to check usage limits in API routes
 */
export async function withLimitCheck(
  org_id: string,
  entitlementKey: EntitlementKey,
  currentUsage: number,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    await EntitlementEnforcement.requireWithinLimit(org_id, entitlementKey, currentUsage);
    return await handler();
  } catch (error) {
    if (error instanceof EntitlementError) {
      return new Response(JSON.stringify(error.toJSON()), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }
}

/**
 * Helper to get default entitlements for free/trial users
 */
export function getDefaultEntitlements() {
  return {
    [ENTITLEMENT_KEYS.MAX_WORKFLOWS]: 5,
    [ENTITLEMENT_KEYS.MAX_INTEGRATIONS]: 3,
    [ENTITLEMENT_KEYS.RAG_QUOTA_TOKENS_MONTH]: 1000,
    [ENTITLEMENT_KEYS.ANALYTICS_LEVEL]: 'basic',
    [ENTITLEMENT_KEYS.SUPPORT_SLA]: 'email_48h',
    [ENTITLEMENT_KEYS.API_ACCESS]: false,
    [ENTITLEMENT_KEYS.WEBHOOKS_ENABLED]: false,
    [ENTITLEMENT_KEYS.TEAM_COLLABORATION]: false,
    [ENTITLEMENT_KEYS.CUSTOM_INTEGRATIONS]: false,
    [ENTITLEMENT_KEYS.WHITE_LABEL]: false,
    [ENTITLEMENT_KEYS.ON_PREMISE]: false,
  };
}

/**
 * Format entitlement value for display
 */
export function formatEntitlementValue(key: EntitlementKey, value: any): string {
  if (typeof value === 'boolean') {
    return value ? 'Enabled' : 'Disabled';
  }
  
  if (typeof value === 'number') {
    if (value >= 999999) {
      return 'Unlimited';
    }
    return value.toLocaleString();
  }
  
  return String(value);
}
