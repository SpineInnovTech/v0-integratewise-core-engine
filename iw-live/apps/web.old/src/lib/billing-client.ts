/**
 * Billing API Client
 * Handles all billing-related API calls
 *
 * @integratewise/web/billing-client
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

import type {
  SKU,
  ListPlansResponse,
  CheckoutRequest,
  CheckoutResponse,
  GetSubscriptionResponse,
  ListSubscriptionsResponse,
  Entitlements,
  BillingErrorResponse,
} from "@integratewise/types/billing";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://gateway.integratewise.ai";

export class BillingClient {
  private baseUrl: string;
  private tenantId: string | null = null;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token and tenant context
   */
  setAuth(token: string, tenantId: string) {
    this.token = token;
    this.tenantId = tenantId;
  }

  /**
   * Build headers for authenticated requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (this.tenantId) {
      headers["x-tenant-id"] = this.tenantId;
    }

    return headers;
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = (await response.json()) as BillingErrorResponse;
      throw new Error(
        `Billing API error: ${response.status} ${errorData.error || response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get all active SKUs/plans
   */
  async getPlans(): Promise<SKU[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/billing/plans`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<ListPlansResponse>(response);
    return data.plans;
  }

  /**
   * Create a checkout session with Stripe or Razorpay
   */
  async createCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    if (!this.tenantId) {
      throw new Error("Tenant ID not set. Call setAuth() first.");
    }

    const response = await fetch(`${this.baseUrl}/api/v1/billing/checkout`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    return this.handleResponse<CheckoutResponse>(response);
  }

  /**
   * Get current subscription for tenant
   */
  async getSubscription(): Promise<GetSubscriptionResponse> {
    if (!this.tenantId) {
      throw new Error("Tenant ID not set. Call setAuth() first.");
    }

    const response = await fetch(`${this.baseUrl}/api/v1/billing/subscription`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<GetSubscriptionResponse>(response);
  }

  /**
   * List all subscriptions for tenant (multiple subs possible)
   */
  async listSubscriptions(): Promise<ListSubscriptionsResponse> {
    if (!this.tenantId) {
      throw new Error("Tenant ID not set. Call setAuth() first.");
    }

    const response = await fetch(`${this.baseUrl}/api/v1/billing/subscription`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<ListSubscriptionsResponse>(response);
  }

  /**
   * Get entitlements and usage for tenant
   */
  async getEntitlements(): Promise<Entitlements> {
    if (!this.tenantId) {
      throw new Error("Tenant ID not set. Call setAuth() first.");
    }

    const response = await fetch(`${this.baseUrl}/api/v1/billing/entitlements/${this.tenantId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{ entitlements: Entitlements }>(response);
    return data.entitlements;
  }

  /**
   * Record usage metric
   */
  async recordUsage(metricKey: string, quantity: number, metadata?: Record<string, any>) {
    if (!this.tenantId) {
      throw new Error("Tenant ID not set. Call setAuth() first.");
    }

    const response = await fetch(`${this.baseUrl}/api/v1/billing/usage`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        tenantId: this.tenantId,
        metricKey,
        quantity,
        metadata,
      }),
    });

    return this.handleResponse<{ id: string; message: string }>(response);
  }

  /**
   * Get usage metrics for tenant
   */
  async getUsage(metric?: string, start?: string, end?: string) {
    if (!this.tenantId) {
      throw new Error("Tenant ID not set. Call setAuth() first.");
    }

    const params = new URLSearchParams();
    if (metric) params.append("metric", metric);
    if (start) params.append("start", start);
    if (end) params.append("end", end);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(
      `${this.baseUrl}/api/v1/billing/usage/${this.tenantId}${queryString}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse<{ usage: any[] }>(response);
  }

  /**
   * Get invoices for tenant
   */
  async getInvoices(limit: number = 10) {
    if (!this.tenantId) {
      throw new Error("Tenant ID not set. Call setAuth() first.");
    }

    const response = await fetch(
      `${this.baseUrl}/api/v1/billing/invoices/${this.tenantId}?limit=${limit}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse<{ invoices: any[] }>(response);
  }

  /**
   * Initiate Stripe checkout
   */
  async startStripeCheckout(skuId: string, successUrl?: string, cancelUrl?: string) {
    const checkout = await this.createCheckout({
      sku_id: skuId,
      gateway: "stripe",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if ("checkout_url" in (checkout as any)) {
      // Redirect to Stripe checkout
      window.location.href = (checkout as any).checkout_url;
    } else {
      throw new Error("Invalid Stripe checkout response");
    }
  }

  /**
   * Initiate Razorpay checkout
   */
  async startRazorpayCheckout(
    skuId: string,
    onSuccess?: (paymentId: string) => void,
    onError?: (error: string) => void
  ) {
    const checkout = await this.createCheckout({
      sku_id: skuId,
      gateway: "razorpay",
    });

    if (!("order_id" in (checkout as any))) {
      throw new Error("Invalid Razorpay checkout response");
    }

    // Load Razorpay SDK if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => this.initRazorpayCheckout(checkout, onSuccess, onError);
      document.body.appendChild(script);
    } else {
      this.initRazorpayCheckout(checkout, onSuccess, onError);
    }
  }

  /**
   * Initialize Razorpay checkout
   */
  private initRazorpayCheckout(
    checkout: CheckoutResponse,
    onSuccess?: (paymentId: string) => void,
    onError?: (error: string) => void
  ) {
    if (!("order_id" in checkout)) {
      throw new Error("Invalid Razorpay response");
    }

    const options = {
      key: checkout.key_id,
      order_id: checkout.order_id,
      amount: checkout.amount,
      currency: checkout.currency,
      name: "IntegrateWise",
      description: "Plan Upgrade",
      handler: (response: any) => {
        onSuccess?.(response.razorpay_payment_id);
      },
      prefill: {
        // Could be populated with user data
      },
      theme: {
        color: "#0c0c0c",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", (response: any) => {
      onError?.(response.error.description);
    });
    rzp.open();
  }
}

// Default singleton instance
let billingClient: BillingClient | null = null;

/**
 * Get or create the billing client singleton
 */
export function getBillingClient(): BillingClient {
  if (!billingClient) {
    billingClient = new BillingClient();
  }
  return billingClient;
}

/**
 * Reset billing client (useful for logout)
 */
export function resetBillingClient() {
  billingClient = null;
}
