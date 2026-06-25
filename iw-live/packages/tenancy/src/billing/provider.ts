import {
  BillingCustomer,
  UnifiedSubscription,
  UnifiedInvoice,
  PricePlan,
  CheckoutSession,
  BillingPeriod,
} from "./types";

export interface BillingProviderConfig {
  providerId: string;
  apiKey: string;
  apiSecret?: string;
  webhookSecret?: string;
  region?: string;
  currency?: string;
}

export abstract class BaseBillingProvider {
  protected config: BillingProviderConfig;

  constructor(config: BillingProviderConfig) {
    this.config = config;
  }

  abstract getProviderName(): string;

  // Customer Management
  abstract createCustomer(data: Partial<BillingCustomer>): Promise<BillingCustomer>;
  abstract getCustomer(id: string): Promise<BillingCustomer>;
  abstract updateCustomer(id: string, data: Partial<BillingCustomer>): Promise<BillingCustomer>;
  abstract deleteCustomer(id: string): Promise<boolean>;

  // Subscription Management
  abstract createSubscription(customerId: string, planId: string): Promise<UnifiedSubscription>;
  abstract getSubscription(id: string): Promise<UnifiedSubscription>;
  abstract updateSubscription(
    id: string,
    updates: Partial<UnifiedSubscription>
  ): Promise<UnifiedSubscription>;
  abstract cancelSubscription(id: string, atPeriodEnd?: boolean): Promise<UnifiedSubscription>;
  abstract pauseSubscription(id: string): Promise<UnifiedSubscription>;
  abstract resumeSubscription(id: string): Promise<UnifiedSubscription>;

  // Invoice Management
  abstract getInvoice(id: string): Promise<UnifiedInvoice>;
  abstract listInvoices(customerId: string): Promise<UnifiedInvoice[]>;
  abstract voidInvoice(id: string): Promise<boolean>;

  // Product/Plan Management
  abstract createPlan(plan: Partial<PricePlan>): Promise<PricePlan>;
  abstract getPlan(id: string): Promise<PricePlan>;

  // Checkout
  abstract createCheckoutSession(params: {
    customerId?: string;
    planId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession>;

  // Webhooks
  abstract verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean>;
  abstract parseWebhookEvent(payload: string): Promise<{ type: string; data: any }>;
}
