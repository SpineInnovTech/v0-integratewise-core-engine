import Stripe from "stripe";
import { BaseBillingProvider, BillingProviderConfig } from "../provider";
import {
  BillingCustomer,
  UnifiedSubscription,
  UnifiedInvoice,
  PricePlan,
  CheckoutSession,
  BillingPeriod,
} from "../types";

export class StripeBillingProvider extends BaseBillingProvider {
  private client: Stripe;

  constructor(config: BillingProviderConfig) {
    super(config);
    this.client = new Stripe(config.apiKey, {
      apiVersion: "2023-10-16", // Latest stable
      typescript: true,
    });
  }

  getProviderName(): string {
    return "stripe";
  }

  // ===========================================================================
  // CUSTOMER OPERATIONS
  // ===========================================================================

  async createCustomer(data: Partial<BillingCustomer>): Promise<BillingCustomer> {
    const response = await this.client.customers.create({
      email: data.email,
      name: data.name,
      phone: data.phone,
      metadata: data.metadata,
      address: data.address
        ? {
            line1: data.address.line1,
            line2: data.address.line2,
            city: data.address.city,
            state: data.address.state,
            postal_code: data.address.postal_code,
            country: data.address.country,
          }
        : undefined,
    });

    return this.mapToBillingCustomer(response);
  }

  async getCustomer(id: string): Promise<BillingCustomer> {
    const response = await this.client.customers.retrieve(id);
    if (response.deleted) throw new Error("Customer deleted");
    return this.mapToBillingCustomer(response as Stripe.Customer);
  }

  async updateCustomer(id: string, data: Partial<BillingCustomer>): Promise<BillingCustomer> {
    const response = await this.client.customers.update(id, {
      email: data.email,
      name: data.name,
      phone: data.phone,
      metadata: data.metadata,
    });

    return this.mapToBillingCustomer(response as Stripe.Customer);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const response = await this.client.customers.del(id);
    return response.deleted;
  }

  private mapToBillingCustomer(data: Stripe.Customer): BillingCustomer {
    return {
      id: data.id,
      provider_id: this.config.providerId,
      email: data.email || "",
      name: data.name || undefined,
      phone: data.phone || undefined,
      metadata: data.metadata,
    };
  }

  // ===========================================================================
  // SUBSCRIPTION MANAGEMENT
  // ===========================================================================

  async createSubscription(customerId: string, planId: string): Promise<UnifiedSubscription> {
    const response = await this.client.subscriptions.create({
      customer: customerId,
      items: [{ price: planId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    return this.mapToUnifiedSubscription(response);
  }

  async getSubscription(id: string): Promise<UnifiedSubscription> {
    const response = await this.client.subscriptions.retrieve(id);
    return this.mapToUnifiedSubscription(response);
  }

  async updateSubscription(
    id: string,
    updates: Partial<UnifiedSubscription>
  ): Promise<UnifiedSubscription> {
    const params: Stripe.SubscriptionUpdateParams = {};
    if (updates.plan_id) {
      // Logic to swap items needed, simplified here
      // In real implementation, need to fetch subs items, delete old, add new
    }

    // Stripe status updates usually happen via actions (cancel, pause)

    const response = await this.client.subscriptions.update(id, params);
    return this.mapToUnifiedSubscription(response);
  }

  async cancelSubscription(id: string, atPeriodEnd: boolean = false): Promise<UnifiedSubscription> {
    // If atPeriodEnd is true, use update. If false, use cancel.
    let response;
    if (atPeriodEnd) {
      response = await this.client.subscriptions.update(id, { cancel_at_period_end: true });
    } else {
      response = await this.client.subscriptions.cancel(id);
    }
    return this.mapToUnifiedSubscription(response);
  }

  async pauseSubscription(id: string): Promise<UnifiedSubscription> {
    const response = await this.client.subscriptions.update(id, {
      pause_collection: { behavior: "void" },
    });
    return this.mapToUnifiedSubscription(response);
  }

  async resumeSubscription(id: string): Promise<UnifiedSubscription> {
    const response = await this.client.subscriptions.update(id, {
      pause_collection: null,
    });
    return this.mapToUnifiedSubscription(response);
  }

  private mapToUnifiedSubscription(data: Stripe.Subscription): UnifiedSubscription {
    return {
      id: data.id,
      provider_id: this.config.providerId,
      customer_id: typeof data.customer === "string" ? data.customer : data.customer.id,
      plan_id: data.items.data[0]?.price.id || "",
      status: data.status as UnifiedSubscription["status"],
      current_period_start: new Date(data.current_period_start * 1000),
      current_period_end: new Date(data.current_period_end * 1000),
      cancel_at_period_end: data.cancel_at_period_end,
      amount: (data.items.data[0]?.price.unit_amount || 0) / 100,
      currency: data.currency,
      metadata: data.metadata,
    };
  }

  // ===========================================================================
  // INVOICE OPERATIONS
  // ===========================================================================

  async getInvoice(id: string): Promise<UnifiedInvoice> {
    const response = await this.client.invoices.retrieve(id);
    return this.mapToUnifiedInvoice(response);
  }

  async listInvoices(customerId: string): Promise<UnifiedInvoice[]> {
    const response = await this.client.invoices.list({ customer: customerId });
    return response.data.map((inv) => this.mapToUnifiedInvoice(inv));
  }

  async voidInvoice(id: string): Promise<boolean> {
    const response = await this.client.invoices.voidInvoice(id);
    return response.status === "void";
  }

  private mapToUnifiedInvoice(data: Stripe.Invoice): UnifiedInvoice {
    const statusMap: Record<string, UnifiedInvoice["status"]> = {
      draft: "draft",
      open: "open",
      paid: "paid",
      uncollectible: "uncollectible",
      void: "void",
    };

    return {
      id: data.id,
      provider_id: this.config.providerId,
      customer_id:
        typeof data.customer === "string"
          ? data.customer
          : (data.customer as Stripe.Customer)?.id || "",
      subscription_id:
        typeof data.subscription === "string"
          ? data.subscription
          : (data.subscription as Stripe.Subscription)?.id,
      amount_due: data.amount_due / 100,
      amount_paid: data.amount_paid / 100,
      amount_remaining: data.amount_remaining / 100,
      currency: data.currency,
      status: statusMap[data.status || "draft"] || "draft",
      invoice_date: new Date(data.created * 1000),
      due_date: data.due_date ? new Date(data.due_date * 1000) : new Date(),
      pdf_url: data.invoice_pdf || undefined,
      hosted_url: data.hosted_invoice_url || undefined,
      items: data.lines.data.map((line) => ({
        description: line.description || "Item",
        amount: (line.amount || 0) / 100,
        quantity: line.quantity || 1,
      })),
    };
  }

  // ===========================================================================
  // PLAN MANAGEMENT
  // ===========================================================================

  async createPlan(plan: Partial<PricePlan>): Promise<PricePlan> {
    const product = await this.client.products.create({
      name: plan.name || "Product",
    });

    const price = await this.client.prices.create({
      product: product.id,
      unit_amount: (plan.amount || 0) * 100,
      currency: plan.currency || "usd",
      recurring: {
        interval: plan.interval || "month",
      },
      metadata: plan.metadata,
    });

    return {
      id: price.id,
      provider_id: this.config.providerId,
      name: plan.name || "",
      amount: plan.amount || 0,
      currency: plan.currency || "usd",
      interval: (price.recurring?.interval as BillingPeriod) || "monthly",
      active: price.active,
      metadata: price.metadata,
    };
  }

  async getPlan(id: string): Promise<PricePlan> {
    const price = await this.client.prices.retrieve(id, { expand: ["product"] });
    const product = price.product as Stripe.Product;

    return {
      id: price.id,
      provider_id: this.config.providerId,
      name: product.name,
      amount: (price.unit_amount || 0) / 100,
      currency: price.currency,
      interval: (price.recurring?.interval as BillingPeriod) || "monthly",
      active: price.active,
      metadata: price.metadata,
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
    const session = await this.client.checkout.sessions.create({
      customer: params.customerId,
      mode: "subscription",
      line_items: [{ price: params.planId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    return {
      id: session.id,
      url: session.url || "",
      customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
      subscription_id:
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
      status: session.status as CheckoutSession["status"],
    };
  }

  async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      this.client.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (err) {
      return false;
    }
  }

  async parseWebhookEvent(payload: string): Promise<{ type: string; data: any }> {
    const event = JSON.parse(payload) as Stripe.Event;
    return {
      type: event.type,
      data: event.data.object,
    };
  }
}
