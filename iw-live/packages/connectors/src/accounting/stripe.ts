import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Stripe Connector — Stripe API (API Key Auth)
// ============================================================================

export interface StripeConnectorConfig extends ConnectorConfig {
  secretKey: string;
  webhookSecret?: string;
  apiVersion?: string;
}

export interface StripeCustomer {
  id: string;
  object: "customer";
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  created: number;
  currency?: string;
  balance: number;
  delinquent: boolean;
  metadata: Record<string, string>;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface StripePaymentIntent {
  id: string;
  object: "payment_intent";
  amount: number;
  amount_received: number;
  currency: string;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "requires_capture"
    | "canceled"
    | "succeeded";
  customer?: string;
  description?: string;
  created: number;
  metadata: Record<string, string>;
}

export interface StripeInvoice {
  id: string;
  object: "invoice";
  customer: string;
  customer_email?: string;
  customer_name?: string;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  due_date?: number;
  created: number;
  period_start: number;
  period_end: number;
  subscription?: string;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  lines: {
    data: Array<{
      id: string;
      amount: number;
      description?: string;
      quantity?: number;
      price?: { id: string; unit_amount: number };
    }>;
  };
  metadata: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  object: "subscription";
  customer: string;
  status:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused";
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  created: number;
  items: {
    data: Array<{
      id: string;
      price: { id: string; unit_amount: number; currency: string; recurring: { interval: string } };
      quantity: number;
    }>;
  };
  metadata: Record<string, string>;
  trial_start?: number;
  trial_end?: number;
}

export interface StripeProduct {
  id: string;
  object: "product";
  name: string;
  description?: string;
  active: boolean;
  created: number;
  images: string[];
  metadata: Record<string, string>;
  default_price?: string;
}

export interface StripePrice {
  id: string;
  object: "price";
  product: string;
  active: boolean;
  currency: string;
  unit_amount: number;
  type: "one_time" | "recurring";
  recurring?: { interval: "day" | "week" | "month" | "year"; interval_count: number };
  created: number;
  metadata: Record<string, string>;
}

export interface StripeRefund {
  id: string;
  object: "refund";
  amount: number;
  currency: string;
  payment_intent?: string;
  charge?: string;
  status: "pending" | "succeeded" | "failed" | "canceled";
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  created: number;
  metadata: Record<string, string>;
}

export interface StripeListParams {
  limit?: number;
  starting_after?: string;
  ending_before?: string;
  created?: { gt?: number; gte?: number; lt?: number; lte?: number };
}

export interface StripeSyncParams {
  limit?: number;
  cursor?: string;
  since?: string;
}

export class StripeConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: StripeConnectorConfig;

  constructor(config: StripeConnectorConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: "https://api.stripe.com/v1",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": config.apiVersion || "2025-01-27.acacia",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("Invalid Stripe API key", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Stripe API rate limit exceeded", error);
        const stripeError = error.response?.data?.error;
        throw new ConnectorError(
          `Stripe API error: ${stripeError?.message || error.message} (type: ${stripeError?.type})`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "stripe",
      name: "Stripe",
      version: "1.0.0",
      apiVersion: this.config.apiVersion || "2025-01-27.acacia",
      capabilities: { sync: true, webhooks: true, dataVelocity: "realtime" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/balance");
      return response.status === 200 && !!response.data.object;
    } catch {
      return false;
    }
  }

  private toFormData(obj: Record<string, any>): URLSearchParams {
    const params = new URLSearchParams();
    const flatten = (o: any, p: string) => {
      if (o === undefined || o === null) return;
      if (typeof o === "object" && !Array.isArray(o)) {
        for (const [k, v] of Object.entries(o)) flatten(v, p ? `${p}[${k}]` : k);
      } else if (Array.isArray(o)) {
        o.forEach((v, i) => flatten(v, `${p}[${i}]`));
      } else {
        params.append(p, String(o));
      }
    };
    flatten(obj, "");
    return params;
  }

  private getCreatedFilter(since?: string): StripeListParams["created"] | undefined {
    if (!since) return undefined;
    const parsed = new Date(since);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return { gte: Math.floor(parsed.getTime() / 1000) };
  }

  // ---------------------------------------------------------------------------
  // Balance
  // ---------------------------------------------------------------------------
  async getBalance(): Promise<{
    available: Array<{ amount: number; currency: string }>;
    pending: Array<{ amount: number; currency: string }>;
  }> {
    try {
      const response = await this.client.get("/balance");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Stripe balance", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Customers — CRUD
  // ---------------------------------------------------------------------------
  async listCustomers(
    params?: StripeListParams & { email?: string }
  ): Promise<{ data: StripeCustomer[]; has_more: boolean }> {
    try {
      const response = await this.client.get("/customers", { params: { limit: 100, ...params } });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Stripe customers", error);
    }
  }

  /**
   * Sync-friendly alias used by the universal sync adapters.
   */
  async getCustomers(params?: StripeSyncParams): Promise<{
    data: StripeCustomer[];
    has_more: boolean;
    next_cursor?: string;
  }> {
    const result = await this.listCustomers({
      limit: params?.limit,
      starting_after: params?.cursor,
      created: this.getCreatedFilter(params?.since),
    });
    const nextCursor =
      result.has_more && result.data.length > 0
        ? result.data[result.data.length - 1]?.id
        : undefined;
    return { ...result, next_cursor: nextCursor };
  }

  async getCustomer(customerId: string): Promise<StripeCustomer> {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Stripe customer ${customerId}`, error);
    }
  }

  async createCustomer(data: {
    email?: string;
    name?: string;
    phone?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<StripeCustomer> {
    try {
      const response = await this.client.post("/customers", this.toFormData(data));
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Stripe customer", error);
    }
  }

  async updateCustomer(
    customerId: string,
    data: Partial<{
      email: string;
      name: string;
      phone: string;
      description: string;
      metadata: Record<string, string>;
    }>
  ): Promise<StripeCustomer> {
    try {
      const response = await this.client.post(`/customers/${customerId}`, this.toFormData(data));
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update Stripe customer ${customerId}`, error);
    }
  }

  async deleteCustomer(customerId: string): Promise<{ id: string; deleted: boolean }> {
    try {
      const response = await this.client.delete(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to delete Stripe customer ${customerId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Payment Intents
  // ---------------------------------------------------------------------------
  async listPaymentIntents(
    params?: StripeListParams & { customer?: string }
  ): Promise<{ data: StripePaymentIntent[]; has_more: boolean }> {
    try {
      const response = await this.client.get("/payment_intents", {
        params: { limit: 100, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Stripe payment intents", error);
    }
  }

  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    customer?: string;
    description?: string;
    metadata?: Record<string, string>;
    payment_method_types?: string[];
  }): Promise<StripePaymentIntent> {
    try {
      const response = await this.client.post("/payment_intents", this.toFormData(data));
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Stripe payment intent", error);
    }
  }

  async capturePaymentIntent(
    paymentIntentId: string,
    amount?: number
  ): Promise<StripePaymentIntent> {
    try {
      const response = await this.client.post(
        `/payment_intents/${paymentIntentId}/capture`,
        amount ? this.toFormData({ amount_to_capture: amount }) : undefined
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to capture payment intent ${paymentIntentId}`, error);
    }
  }

  async cancelPaymentIntent(
    paymentIntentId: string,
    reason?: string
  ): Promise<StripePaymentIntent> {
    try {
      const response = await this.client.post(
        `/payment_intents/${paymentIntentId}/cancel`,
        reason ? this.toFormData({ cancellation_reason: reason }) : undefined
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to cancel payment intent ${paymentIntentId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Invoices
  // ---------------------------------------------------------------------------
  async listInvoices(
    params?: StripeListParams & { customer?: string; status?: string; subscription?: string }
  ): Promise<{ data: StripeInvoice[]; has_more: boolean }> {
    try {
      const response = await this.client.get("/invoices", { params: { limit: 100, ...params } });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Stripe invoices", error);
    }
  }

  /**
   * Sync-friendly alias used by the universal sync adapters.
   */
  async getInvoices(params?: StripeSyncParams): Promise<{
    data: StripeInvoice[];
    has_more: boolean;
    next_cursor?: string;
  }> {
    const result = await this.listInvoices({
      limit: params?.limit,
      starting_after: params?.cursor,
      created: this.getCreatedFilter(params?.since),
    });
    const nextCursor =
      result.has_more && result.data.length > 0
        ? result.data[result.data.length - 1]?.id
        : undefined;
    return { ...result, next_cursor: nextCursor };
  }

  async getInvoice(invoiceId: string): Promise<StripeInvoice> {
    try {
      const response = await this.client.get(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Stripe invoice ${invoiceId}`, error);
    }
  }

  async createInvoice(data: {
    customer: string;
    auto_advance?: boolean;
    collection_method?: "charge_automatically" | "send_invoice";
    days_until_due?: number;
    metadata?: Record<string, string>;
  }): Promise<StripeInvoice> {
    try {
      const response = await this.client.post("/invoices", this.toFormData(data));
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Stripe invoice", error);
    }
  }

  async finalizeInvoice(invoiceId: string): Promise<StripeInvoice> {
    try {
      const response = await this.client.post(`/invoices/${invoiceId}/finalize`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to finalize Stripe invoice ${invoiceId}`, error);
    }
  }

  async voidInvoice(invoiceId: string): Promise<StripeInvoice> {
    try {
      const response = await this.client.post(`/invoices/${invoiceId}/void`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to void Stripe invoice ${invoiceId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------
  async listSubscriptions(
    params?: StripeListParams & { customer?: string; status?: string }
  ): Promise<{ data: StripeSubscription[]; has_more: boolean }> {
    try {
      const response = await this.client.get("/subscriptions", {
        params: { limit: 100, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Stripe subscriptions", error);
    }
  }

  /**
   * Sync-friendly alias used by the universal sync adapters.
   */
  async getSubscriptions(params?: StripeSyncParams): Promise<{
    data: StripeSubscription[];
    has_more: boolean;
    next_cursor?: string;
  }> {
    const result = await this.listSubscriptions({
      limit: params?.limit,
      starting_after: params?.cursor,
      created: this.getCreatedFilter(params?.since),
    });
    const nextCursor =
      result.has_more && result.data.length > 0
        ? result.data[result.data.length - 1]?.id
        : undefined;
    return { ...result, next_cursor: nextCursor };
  }

  async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
    try {
      const response = await this.client.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Stripe subscription ${subscriptionId}`, error);
    }
  }

  async createSubscription(data: {
    customer: string;
    items: Array<{ price: string; quantity?: number }>;
    trial_period_days?: number;
    metadata?: Record<string, string>;
  }): Promise<StripeSubscription> {
    try {
      const response = await this.client.post("/subscriptions", this.toFormData(data));
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Stripe subscription", error);
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    atPeriodEnd = true
  ): Promise<StripeSubscription> {
    try {
      if (atPeriodEnd) {
        const response = await this.client.post(
          `/subscriptions/${subscriptionId}`,
          this.toFormData({ cancel_at_period_end: true })
        );
        return response.data;
      }
      const response = await this.client.delete(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to cancel Stripe subscription ${subscriptionId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Products & Prices
  // ---------------------------------------------------------------------------
  async listProducts(
    params?: StripeListParams & { active?: boolean }
  ): Promise<{ data: StripeProduct[]; has_more: boolean }> {
    try {
      const response = await this.client.get("/products", { params: { limit: 100, ...params } });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Stripe products", error);
    }
  }

  async createProduct(data: {
    name: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<StripeProduct> {
    try {
      const response = await this.client.post("/products", this.toFormData(data));
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Stripe product", error);
    }
  }

  async listPrices(
    params?: StripeListParams & { product?: string; active?: boolean }
  ): Promise<{ data: StripePrice[]; has_more: boolean }> {
    try {
      const response = await this.client.get("/prices", { params: { limit: 100, ...params } });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Stripe prices", error);
    }
  }

  async createPrice(data: {
    product: string;
    unit_amount: number;
    currency: string;
    recurring?: { interval: string };
    metadata?: Record<string, string>;
  }): Promise<StripePrice> {
    try {
      const response = await this.client.post("/prices", this.toFormData(data));
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Stripe price", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Refunds
  // ---------------------------------------------------------------------------
  async createRefund(data: {
    payment_intent?: string;
    charge?: string;
    amount?: number;
    reason?: "duplicate" | "fraudulent" | "requested_by_customer";
    metadata?: Record<string, string>;
  }): Promise<StripeRefund> {
    try {
      const response = await this.client.post("/refunds", this.toFormData(data));
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Stripe refund", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Webhooks
  // ---------------------------------------------------------------------------
  async listWebhookEndpoints(): Promise<{
    data: Array<{ id: string; url: string; enabled_events: string[]; status: string }>;
  }> {
    try {
      const response = await this.client.get("/webhook_endpoints");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Stripe webhook endpoints", error);
    }
  }

  async createWebhookEndpoint(data: {
    url: string;
    enabled_events: string[];
    description?: string;
  }): Promise<{ id: string; secret: string; url: string }> {
    try {
      const response = await this.client.post("/webhook_endpoints", this.toFormData(data));
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Stripe webhook endpoint", error);
    }
  }

  async deleteWebhookEndpoint(endpointId: string): Promise<void> {
    try {
      await this.client.delete(`/webhook_endpoints/${endpointId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete Stripe webhook endpoint ${endpointId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Revenue Metrics (Aggregate Helper)
  // ---------------------------------------------------------------------------
  async getRevenueMetrics(): Promise<{
    totalRevenue: number;
    mrrEstimate: number;
    activeSubscriptions: number;
    churnedSubscriptions: number;
    averageInvoice: number;
  }> {
    try {
      const [invoices, subscriptions] = await Promise.all([
        this.listInvoices({ status: "paid", limit: 100 }),
        this.listSubscriptions({ limit: 100 }),
      ]);

      const totalRevenue = invoices.data.reduce((sum, inv) => sum + inv.amount_paid, 0);
      const active = subscriptions.data.filter((s) => s.status === "active");
      const canceled = subscriptions.data.filter((s) => s.status === "canceled");
      const mrrEstimate = active.reduce((sum, s) => {
        const item = s.items.data[0];
        if (!item) return sum;
        const amount = item.price.unit_amount * item.quantity;
        const interval = item.price.recurring?.interval;
        if (interval === "year") return sum + amount / 12;
        if (interval === "week") return sum + amount * 4;
        return sum + amount;
      }, 0);

      return {
        totalRevenue: totalRevenue / 100,
        mrrEstimate: mrrEstimate / 100,
        activeSubscriptions: active.length,
        churnedSubscriptions: canceled.length,
        averageInvoice: invoices.data.length ? totalRevenue / invoices.data.length / 100 : 0,
      };
    } catch (error) {
      throw new ConnectorError("Failed to calculate Stripe revenue metrics", error);
    }
  }
}

export function createStripeConnector(config: StripeConnectorConfig): StripeConnector {
  return new StripeConnector(config);
}
