import Razorpay from "razorpay";
import crypto from "crypto";
import { BaseBillingProvider, BillingProviderConfig } from "../provider";
import {
  BillingCustomer,
  UnifiedSubscription,
  UnifiedInvoice,
  PricePlan,
  CheckoutSession,
  BillingPeriod,
} from "../types";

export class RazorPayBillingProvider extends BaseBillingProvider {
  private client: InstanceType<typeof Razorpay>;

  constructor(config: BillingProviderConfig) {
    super(config);
    this.client = new Razorpay({
      key_id: config.apiKey,
      key_secret: config.apiSecret,
    });
  }

  getProviderName(): string {
    return "razorpay";
  }

  // ===========================================================================
  // CUSTOMER OPERATIONS
  // ===========================================================================

  async createCustomer(data: Partial<BillingCustomer>): Promise<BillingCustomer> {
    const response = await this.client.customers.create({
      name: data.name,
      email: data.email,
      contact: data.phone,
      notes: data.metadata,
    });

    return this.mapToBillingCustomer(response);
  }

  async getCustomer(id: string): Promise<BillingCustomer> {
    const response = await this.client.customers.fetch(id);
    return this.mapToBillingCustomer(response);
  }

  async updateCustomer(id: string, data: Partial<BillingCustomer>): Promise<BillingCustomer> {
    const response = await this.client.customers.edit(id, {
      name: data.name,
      email: data.email,
      contact: data.phone,
      notes: data.metadata,
    });

    return this.mapToBillingCustomer(response);
  }

  async deleteCustomer(_id: string): Promise<boolean> {
    console.warn("Razorpay does not support customer deletion via API");
    return false;
  }

  private mapToBillingCustomer(data: any): BillingCustomer {
    return {
      id: data.id,
      provider_id: this.config.providerId,
      email: data.email,
      name: data.name,
      phone: data.contact,
      metadata: data.notes,
    };
  }

  // ===========================================================================
  // SUBSCRIPTION MANAGEMENT
  // ===========================================================================

  async createSubscription(customerId: string, planId: string): Promise<UnifiedSubscription> {
    // Razorpay requires 'total_count' (billing cycles).
    // For "forever", we set a large number or handle logic based on business requirements.
    const response = await this.client.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120, // Example: 10 years
      customer_id: customerId,
      notes: { source: "integratewise" },
    });

    return this.mapToUnifiedSubscription(response);
  }

  async getSubscription(id: string): Promise<UnifiedSubscription> {
    const response = await this.client.subscriptions.fetch(id);
    return this.mapToUnifiedSubscription(response);
  }

  async updateSubscription(
    id: string,
    updates: Partial<UnifiedSubscription>
  ): Promise<UnifiedSubscription> {
    const params: any = {};
    if (updates.plan_id) params.plan_id = updates.plan_id;
    // Razorpay subscription updates are limited (mainly plan changes)

    const response = await this.client.subscriptions.update(id, params);
    return this.mapToUnifiedSubscription(response);
  }

  async cancelSubscription(id: string, atPeriodEnd: boolean = false): Promise<UnifiedSubscription> {
    const response = await this.client.subscriptions.cancel(id, atPeriodEnd);
    return this.mapToUnifiedSubscription(response);
  }

  async pauseSubscription(id: string): Promise<UnifiedSubscription> {
    const response = await this.client.subscriptions.pause(id, {
      pause_at: "now",
    });
    return this.mapToUnifiedSubscription(response);
  }

  async resumeSubscription(id: string): Promise<UnifiedSubscription> {
    const response = await this.client.subscriptions.resume(id, {
      resume_at: "now",
    });
    return this.mapToUnifiedSubscription(response);
  }

  private mapToUnifiedSubscription(data: any): UnifiedSubscription {
    const statusMap: Record<string, UnifiedSubscription["status"]> = {
      created: "incomplete",
      authenticated: "active",
      active: "active",
      pending: "active", // Razorpay uses pending for ongoing cycles
      halted: "past_due",
      cancelled: "canceled",
      completed: "canceled", // Ended
      paused: "paused",
    };

    return {
      id: data.id,
      provider_id: this.config.providerId,
      customer_id: data.customer_id,
      plan_id: data.plan_id,
      status: statusMap[data.status] || "incomplete",
      current_period_start: new Date(data.current_start * 1000),
      current_period_end: new Date(data.current_end * 1000),
      cancel_at_period_end: false, // Not explicitly exposed in same way
      amount: data.paid_count * (data.total_amount || 0), // Approximation
      currency: "INR", // Razorpay default
      metadata: data.notes,
    };
  }

  // ===========================================================================
  // INVOICE OPERATIONS
  // ===========================================================================

  async getInvoice(id: string): Promise<UnifiedInvoice> {
    const response = await this.client.invoices.fetch(id);
    return this.mapToUnifiedInvoice(response);
  }

  async listInvoices(customerId: string): Promise<UnifiedInvoice[]> {
    const response = await this.client.invoices.all({ customer_id: customerId });
    return (response.items || []).map((inv: any) => this.mapToUnifiedInvoice(inv));
  }

  async voidInvoice(id: string): Promise<boolean> {
    try {
      await this.client.invoices.cancel(id);
      return true;
    } catch {
      return false;
    }
  }

  private mapToUnifiedInvoice(data: any): UnifiedInvoice {
    const statusMap: Record<string, UnifiedInvoice["status"]> = {
      draft: "draft",
      issued: "open",
      partially_paid: "open",
      paid: "paid",
      cancelled: "void",
      expired: "void",
    };

    return {
      id: data.id,
      provider_id: this.config.providerId,
      customer_id: data.customer_id || "",
      subscription_id: data.subscription_id,
      amount_due: data.amount_due,
      amount_paid: data.amount_paid,
      amount_remaining: data.amount_due - data.amount_paid,
      currency: data.currency || "INR",
      status: statusMap[data.status] || "draft",
      invoice_date: new Date(data.issued_at * 1000),
      due_date: new Date(data.expire_by * 1000),
      pdf_url: data.short_url,
      items: (data.line_items || []).map((item: any) => ({
        description: item.name,
        quantity: item.quantity,
        amount: item.amount,
      })),
    };
  }

  // ===========================================================================
  // PLAN MANAGEMENT
  // ===========================================================================

  async createPlan(plan: Partial<PricePlan>): Promise<PricePlan> {
    const periodMap: Record<string, string> = {
      monthly: "monthly",
      yearly: "yearly",
      quarterly: "monthly", // Razorpay doesn't have native "quarterly" enum in same way, handles via interval
    };

    // Interval calculation
    let interval = 1;
    let period = "monthly";

    if (plan.interval === "quarterly") {
      interval = 3;
      period = "monthly";
    } else if (plan.interval === "yearly") {
      interval = 1;
      period = "yearly";
    }

    const response = await this.client.plans.create({
      period: period,
      interval: interval,
      item: {
        name: plan.name || "Default Plan",
        amount: (plan.amount || 0) * 100, // Amount in paise
        currency: plan.currency || "INR",
        description: "Created via IntegrateWise",
      },
      notes: plan.metadata,
    });

    return {
      id: response.id,
      provider_id: this.config.providerId,
      name: plan.name || "",
      amount: plan.amount || 0,
      currency: plan.currency || "INR",
      interval: plan.interval || "monthly",
      active: true,
      metadata: response.notes,
    };
  }

  async getPlan(id: string): Promise<PricePlan> {
    const response = await this.client.plans.fetch(id);
    return {
      id: response.id,
      provider_id: this.config.providerId,
      name: response.item.name,
      amount: response.item.amount / 100,
      currency: response.item.currency,
      interval: response.period === "yearly" ? "yearly" : "monthly", // simplified
      active: response.item.active,
      metadata: response.notes,
    };
  }

  // ===========================================================================
  // CHECKOUT & WEBHOOKS
  // ===========================================================================

  async createCheckoutSession(params: {
    customerId?: string;
    planId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    // Razorpay doesn't have a "checkout session" exactly like Stripe Grid.
    // It creates a Subscription Link or we return details to init client SDK.
    // Here we'll create a Subscription which generates a `short_url` (payment link).

    const sub = await this.client.subscriptions.create({
      plan_id: params.planId,
      customer_id: params.customerId,
      total_count: 120, // 10 years default
      notes: { source: "checkout" },
    });

    return {
      id: sub.id,
      url: sub.short_url,
      customer_id: sub.customer_id,
      subscription_id: sub.id,
      status: "open",
    };
  }

  async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const generated_signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    return generated_signature === signature;
  }

  async parseWebhookEvent(payload: string): Promise<{ type: string; data: any }> {
    const event = JSON.parse(payload);
    // Razorpay event structure: { event: "subscription.activated", payload: { subscription: { entity: { ... } } } }
    return {
      type: event.event,
      data: event.payload,
    };
  }
}
