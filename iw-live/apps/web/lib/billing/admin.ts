/**
 * Admin Override Utilities
 * 
 * Provides admin-only utilities for testing and internal operations:
 * - Override entitlements for testing
 * - Bypass paywall for internal users
 * - Force subscription status changes
 * 
 * SECURITY: These functions should only be used:
 * - In development/staging environments
 * - By authenticated admin users
 * - With proper audit logging
 */

import { createClient } from '@/lib/supabase/server';
import { BillingService } from './service';
import type { EntitlementKey } from './types';

interface AdminOverrideOptions {
  actorId: string;
  reason: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Check if user is admin
 * Should check against admin list or role
 */
async function isAdmin(userId: string): Promise<boolean> {
  // TODO: Implement admin check
  // For now, check environment variable or admin list
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const supabase = await createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;
  
  return adminEmails.includes(user.user.email || '');
}

/**
 * Override entitlement for testing
 * 
 * WARNING: Only use in development/staging
 */
export async function overrideEntitlement(
  orgId: string,
  entitlementKey: EntitlementKey,
  value: any,
  options: AdminOverrideOptions
): Promise<void> {
  // Security check
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Admin overrides not allowed in production');
  }

  if (!(await isAdmin(options.actorId))) {
    throw new Error('Unauthorized: Admin access required');
  }

  const supabase = await createClient();

  // Create override entitlement
  const { error } = await supabase.from('org_entitlements').upsert({
    org_id: orgId,
    key: entitlementKey,
    value,
    source: 'manual',
    expires_at: options.expiresAt?.toISOString() || null,
    metadata: {
      ...options.metadata,
      override: true,
      actor_id: options.actorId,
      reason: options.reason,
      created_at: new Date().toISOString(),
    },
  });

  if (error) {
    throw new Error(`Failed to override entitlement: ${error.message}`);
  }

  // Audit log
  await supabase.from('billing_audit_log').insert({
    org_id: orgId,
    event_type: 'admin_override_entitlement',
    actor_id: options.actorId,
    metadata: {
      entitlement_key: entitlementKey,
      value,
      reason: options.reason,
      expires_at: options.expiresAt?.toISOString(),
    },
  });
}

/**
 * Force subscription status change
 * 
 * WARNING: Only use for testing or support operations
 */
export async function forceSubscriptionStatus(
  orgId: string,
  status: 'trial' | 'active' | 'past_due' | 'canceled',
  options: AdminOverrideOptions
): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Admin overrides not allowed in production');
  }

  if (!(await isAdmin(options.actorId))) {
    throw new Error('Unauthorized: Admin access required');
  }

  const supabase = await createClient();

  // Update subscription
  const { error } = await supabase
    .from('org_subscriptions')
    .update({
      status,
      metadata: {
        admin_override: true,
        actor_id: options.actorId,
        reason: options.reason,
        overridden_at: new Date().toISOString(),
      },
    })
    .eq('org_id', orgId);

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  // Sync entitlements
  await BillingService.syncEntitlements(orgId);

  // Audit log
  await supabase.from('billing_audit_log').insert({
    org_id: orgId,
    event_type: 'admin_override_subscription',
    actor_id: options.actorId,
    metadata: {
      status,
      reason: options.reason,
    },
  });
}

/**
 * Bypass paywall check (for internal testing)
 * 
 * Returns true if admin override is enabled for this org
 */
export async function canBypassPaywall(orgId: string, userId: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'production') {
    return false; // Never bypass in production
  }

  if (!(await isAdmin(userId))) {
    return false;
  }

  // Check if bypass is enabled for this org
  const supabase = await createClient();
  const { data } = await supabase
    .from('org_entitlements')
    .select('value')
    .eq('org_id', orgId)
    .eq('key', 'admin_bypass_enabled')
    .single();

  return data?.value === true;
}

/**
 * Get admin override status for org
 */
export async function getAdminOverrides(orgId: string): Promise<{
  entitlements: Array<{ key: string; value: any; expires_at: string | null }>;
  subscription_override: boolean;
}> {
  const supabase = await createClient();

  const { data: entitlements } = await supabase
    .from('org_entitlements')
    .select('key, value, expires_at, metadata')
    .eq('org_id', orgId)
    .eq('source', 'manual')
    .not('metadata->override', 'is', null);

  const { data: subscription } = await supabase
    .from('org_subscriptions')
    .select('metadata')
    .eq('org_id', orgId)
    .single();

  return {
    entitlements: entitlements?.data || [],
    subscription_override: subscription?.metadata?.admin_override === true,
  };
}
