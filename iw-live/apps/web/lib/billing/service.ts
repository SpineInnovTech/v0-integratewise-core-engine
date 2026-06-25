// Billing Service - Core business logic for subscriptions and billing

import { createClient } from '@/lib/supabase/server';
import type {
  Plan,
  Subscription,
  Invoice,
  Entitlement,
  SubscribeRequest,
  SubscribeResponse,
  ChangePlanRequest,
  ChangePlanResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  GetSubscriptionResponse,
  InvoiceLineItem,
} from './types';

export class BillingService {
  /**
   * Get all active plans
   */
  static async getPlans(): Promise<Plan[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cents', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      throw new Error('Failed to fetch plans');
    }

    return data as Plan[];
  }

  /**
   * Get a specific plan by code
   */
  static async getPlanByCode(code: string): Promise<Plan | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching plan:', error);
      return null;
    }

    return data as Plan;
  }

  /**
   * Create a new subscription
   */
  static async subscribe(request: SubscribeRequest): Promise<SubscribeResponse> {
    const supabase = await createClient();
    const { org_id, plan_code, trial_days, payment_method_token } = request;

    // Get the plan
    const plan = await this.getPlanByCode(plan_code);
    if (!plan) {
      throw new Error(`Plan not found: ${plan_code}`);
    }

    // Check if org already has a subscription
    const { data: existingSub } = await supabase
      .from('org_subscriptions')
      .select('*')
      .eq('org_id', org_id)
      .single();

    if (existingSub) {
      throw new Error('Organization already has an active subscription');
    }

    // Calculate trial end and period dates
    const now = new Date();
    const trialDays = trial_days ?? (plan.metadata?.trial_days as number) ?? 0;
    const trialEnd = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;
    
    // Period end is based on interval
    const periodEnd = new Date(now);
    if (plan.interval === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (plan.interval === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Create subscription
    const { data: subscription, error: subError } = await supabase
      .from('org_subscriptions')
      .insert({
        org_id,
        plan_id: plan.id,
        status: trialEnd ? 'trial' : 'active',
        trial_end: trialEnd?.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        metadata: {
          payment_method_token: payment_method_token || null,
        },
      })
      .select()
      .single();

    if (subError) {
      console.error('Error creating subscription:', subError);
      throw new Error('Failed to create subscription');
    }

    // Sync entitlements
    await supabase.rpc('sync_entitlements_for_subscription', {
      p_org_id: org_id,
      p_plan_code: plan_code,
    });

    // Create audit log
    await supabase.from('billing_audit_log').insert({
      org_id,
      event_type: 'subscribe',
      metadata: { plan_code, trial_days: trialDays },
    });

    // If not in trial, create initial invoice
    if (!trialEnd && plan.price_cents > 0) {
      await this.createInvoice(org_id, subscription.id, plan, periodEnd);
    }

    return {
      subscription_id: subscription.id,
      status: subscription.status,
      trial_end: subscription.trial_end,
      current_period_end: subscription.current_period_end,
    };
  }

  /**
   * Get subscription for an organization
   */
  static async getSubscription(org_id: string): Promise<GetSubscriptionResponse | null> {
    const supabase = await createClient();

    const { data: subscription, error } = await supabase
      .from('org_subscriptions')
      .select('*, plan:plans(*)')
      .eq('org_id', org_id)
      .single();

    if (error || !subscription) {
      return null;
    }

    // Get entitlements
    const { data: entitlements } = await supabase
      .from('entitlements')
      .select('key, value')
      .eq('org_id', org_id);

    const entitlementsMap = (entitlements || []).reduce((acc, e) => {
      acc[e.key] = e.value;
      return acc;
    }, {} as Record<string, any>);

    return {
      subscription: subscription as unknown as Subscription,
      plan: subscription.plan as unknown as Plan,
      entitlements: entitlementsMap,
    };
  }

  /**
   * Change subscription plan
   */
  static async changePlan(request: ChangePlanRequest): Promise<ChangePlanResponse> {
    const supabase = await createClient();
    const { org_id, new_plan_code, prorate = true } = request;

    // Get current subscription
    const { data: currentSub, error: subError } = await supabase
      .from('org_subscriptions')
      .select('*, plan:plans(*)')
      .eq('org_id', org_id)
      .single();

    if (subError || !currentSub) {
      throw new Error('No active subscription found');
    }

    // Get new plan
    const newPlan = await this.getPlanByCode(new_plan_code);
    if (!newPlan) {
      throw new Error(`Plan not found: ${new_plan_code}`);
    }

    const currentPlan = currentSub.plan as unknown as Plan;

    // Calculate proration if applicable
    let prorationInvoice: Invoice | undefined;
    if (prorate && currentPlan.price_cents !== newPlan.price_cents) {
      const now = new Date();
      const periodStart = new Date(currentSub.current_period_start);
      const periodEnd = new Date(currentSub.current_period_end);
      const totalPeriodMs = periodEnd.getTime() - periodStart.getTime();
      const remainingMs = periodEnd.getTime() - now.getTime();
      const remainingRatio = remainingMs / totalPeriodMs;

      // Calculate refund for unused time on old plan
      const refundCents = Math.floor(currentPlan.price_cents * remainingRatio);
      
      // Calculate charge for remaining time on new plan
      const chargeCents = Math.floor(newPlan.price_cents * remainingRatio);
      
      const netChargeCents = chargeCents - refundCents;

      if (netChargeCents !== 0) {
        prorationInvoice = await this.createProrationInvoice(
          org_id,
          currentSub.id,
          currentPlan,
          newPlan,
          netChargeCents,
          now
        );
      }
    }

    // Update subscription
    const { data: updatedSub, error: updateError } = await supabase
      .from('org_subscriptions')
      .update({
        plan_id: newPlan.id,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', org_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      throw new Error('Failed to update subscription');
    }

    // Sync entitlements
    await supabase.rpc('sync_entitlements_for_subscription', {
      p_org_id: org_id,
      p_plan_code: new_plan_code,
    });

    // Create audit log
    await supabase.from('billing_audit_log').insert({
      org_id,
      event_type: 'change_plan',
      metadata: { 
        old_plan_code: currentPlan.code, 
        new_plan_code,
        prorated: prorate,
      },
    });

    return {
      subscription_id: updatedSub.id,
      status: updatedSub.status,
      proration_invoice: prorationInvoice,
    };
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(request: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse> {
    const supabase = await createClient();
    const { org_id, cancel_at_period_end, reason } = request;

    const { data: subscription, error: subError } = await supabase
      .from('org_subscriptions')
      .select('*')
      .eq('org_id', org_id)
      .single();

    if (subError || !subscription) {
      throw new Error('No active subscription found');
    }

    const now = new Date();
    const updates: any = {
      updated_at: now.toISOString(),
    };

    if (cancel_at_period_end) {
      updates.cancel_at = subscription.current_period_end;
      updates.status = subscription.status; // Keep current status
    } else {
      updates.canceled_at = now.toISOString();
      updates.status = 'canceled';
    }

    const { data: updatedSub, error: updateError } = await supabase
      .from('org_subscriptions')
      .update(updates)
      .eq('org_id', org_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error canceling subscription:', updateError);
      throw new Error('Failed to cancel subscription');
    }

    // Create audit log
    await supabase.from('billing_audit_log').insert({
      org_id,
      event_type: 'cancel',
      metadata: { 
        cancel_at_period_end,
        reason: reason || null,
      },
    });

    return {
      subscription_id: updatedSub.id,
      status: updatedSub.status,
      canceled_at: updatedSub.canceled_at,
      cancel_at: updatedSub.cancel_at,
    };
  }

  /**
   * Get invoices for an organization
   */
  static async getInvoices(org_id: string): Promise<Invoice[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('org_id', org_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw new Error('Failed to fetch invoices');
    }

    return data as Invoice[];
  }

  /**
   * Get entitlements for an organization
   */
  static async getEntitlements(org_id: string): Promise<Record<string, any>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('entitlements')
      .select('key, value')
      .eq('org_id', org_id);

    if (error) {
      console.error('Error fetching entitlements:', error);
      return {};
    }

    return (data || []).reduce((acc, e) => {
      acc[e.key] = e.value;
      return acc;
    }, {} as Record<string, any>);
  }

  /**
   * Check if org has specific entitlement
   */
  static async hasEntitlement(org_id: string, key: string): Promise<boolean> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('entitlements')
      .select('id')
      .eq('org_id', org_id)
      .eq('key', key)
      .single();

    return !!data;
  }

  /**
   * Get entitlement value
   */
  static async getEntitlementValue(org_id: string, key: string): Promise<any> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('entitlements')
      .select('value')
      .eq('org_id', org_id)
      .eq('key', key)
      .single();

    return data?.value;
  }

  // Private helper methods

  private static async createInvoice(
    org_id: string,
    subscription_id: string,
    plan: Plan,
    period_end: Date
  ): Promise<Invoice> {
    const supabase = await createClient();

    const lineItems: InvoiceLineItem[] = [
      {
        description: `${plan.name} - ${plan.interval} subscription`,
        quantity: 1,
        unit_amount_cents: plan.price_cents,
        total_cents: plan.price_cents,
        metadata: { plan_code: plan.code },
      },
    ];

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        org_id,
        subscription_id,
        amount_cents: plan.price_cents,
        currency: plan.currency,
        status: 'open',
        due_at: period_end.toISOString(),
        line_items: lineItems,
        corr_id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice');
    }

    return invoice as Invoice;
  }

  private static async createProrationInvoice(
    org_id: string,
    subscription_id: string,
    oldPlan: Plan,
    newPlan: Plan,
    netChargeCents: number,
    date: Date
  ): Promise<Invoice> {
    const supabase = await createClient();

    const lineItems: InvoiceLineItem[] = [
      {
        description: `Proration: Upgrade from ${oldPlan.name} to ${newPlan.name}`,
        quantity: 1,
        unit_amount_cents: netChargeCents,
        total_cents: netChargeCents,
        metadata: {
          old_plan_code: oldPlan.code,
          new_plan_code: newPlan.code,
          proration: true,
        },
      },
    ];

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        org_id,
        subscription_id,
        amount_cents: netChargeCents,
        currency: newPlan.currency,
        status: netChargeCents > 0 ? 'open' : 'paid',
        due_at: date.toISOString(),
        paid_at: netChargeCents <= 0 ? date.toISOString() : null,
        line_items: lineItems,
        corr_id: `prorate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating proration invoice:', error);
      throw new Error('Failed to create proration invoice');
    }

    return invoice as Invoice;
  }
}
