import { BaseBillingProvider, BillingProviderConfig } from "./provider";
import { StripeBillingProvider } from "./providers/stripe";
import { RazorPayBillingProvider } from "./providers/razorpay";
import {
  BillingCustomer,
  UnifiedSubscription,
  UnifiedInvoice,
  PricePlan,
  CheckoutSession,
} from "./types";

export class SubscriptionManager {
  private providers: Map<string, BaseBillingProvider>;

  constructor(configs: BillingProviderConfig[]) {
    this.providers = new Map();

    for (const config of configs) {
      let provider: BaseBillingProvider;

      switch (config.providerId) {
        case "stripe":
          provider = new StripeBillingProvider(config);
          break;
        case "razorpay":
          provider = new RazorPayBillingProvider(config);
          break;
        default:
          throw new Error(`Unsupported billing provider: ${config.providerId}`);
      }

      this.providers.set(config.providerId, provider);
    }
  }

  getProvider(providerId: string): BaseBillingProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    return provider;
  }

  // Unified API methods that delegate to specific provider

  async createCustomer(
    providerId: string,
    data: Partial<BillingCustomer>
  ): Promise<BillingCustomer> {
    return this.getProvider(providerId).createCustomer(data);
  }

  async createSubscription(
    providerId: string,
    customerId: string,
    planId: string
  ): Promise<UnifiedSubscription> {
    return this.getProvider(providerId).createSubscription(customerId, planId);
  }

  async getSubscription(providerId: string, subscriptionId: string): Promise<UnifiedSubscription> {
    return this.getProvider(providerId).getSubscription(subscriptionId);
  }

  async listInvoices(providerId: string, customerId: string): Promise<UnifiedInvoice[]> {
    return this.getProvider(providerId).listInvoices(customerId);
  }

  async createCheckoutSession(providerId: string, params: any): Promise<CheckoutSession> {
    return this.getProvider(providerId).createCheckoutSession(params);
  }

  async handleWebhook(
    providerId: string,
    payload: string,
    signature: string,
    secret: string
  ): Promise<any> {
    const provider = this.getProvider(providerId);
    const isValid = await provider.verifyWebhookSignature(payload, signature, secret);

    if (!isValid) {
      throw new Error("Invalid webhook signature");
    }

    const event = await provider.parseWebhookEvent(payload);
    // Here we would typically emit this event to our internal event bus or update DB
    return event;
  }
}
