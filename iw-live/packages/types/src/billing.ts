/**
 * Billing and Payment Types
 * Shared types for SKU, pricing, and payment system
 *
 * @integratewise/types/billing
 */

// ============================================================================
// SKU (Stock Keeping Unit) Types
// ============================================================================

export type BillingType = "one_time" | "recurring";
export type BillingInterval = "monthly" | "yearly";
export type SkuTier = "free" | "starter" | "professional" | "enterprise" | "addon";
export type SkuStatus = "active" | "inactive" | "archived";
export type PaymentGateway = "stripe" | "razorpay";
export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";
export type SubscriptionStatus = "active" | "trial" | "past_due" | "cancelled" | "expired";

export interface SKU {
  id: string;
  product_code: string;
  name: string;
  description?: string;
  tier: SkuTier;
  billing_type: BillingType;
  billing_interval?: BillingInterval;
  price_cents: number;
  currency: string; // 'usd', 'inr', etc.
  stripe_price_id?: string;
  razorpay_plan_id?: string;
  features: string[] | string; // JSON array or parsed array
  limits: Record<string, number>; // e.g., { connectors: 10, users: 3, storage_mb: 1000 }
  sort_order: number;
  status: SkuStatus;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Payment Transaction Types
// ============================================================================

export interface PaymentTransaction {
  id: string;
  tenant_id: string;
  sku_id: string;
  gateway: PaymentGateway;
  gateway_session_id?: string; // Stripe session ID or Razorpay order ID
  gateway_payment_id?: string; // Stripe payment ID or Razorpay payment ID
  amount_cents: number;
  currency: string;
  status: TransactionStatus;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// Subscription Types
// ============================================================================

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  sku_id: string;
  status: SubscriptionStatus;
  activated_at: string;
  expires_at?: string;
  cancelled_at?: string;
  gateway?: PaymentGateway;
  gateway_subscription_id?: string;
}

// ============================================================================
// Checkout Request/Response Types
// ============================================================================

export interface CheckoutRequest {
  sku_id: string;
  gateway: PaymentGateway;
  success_url?: string;
  cancel_url?: string;
}

export interface StripeCheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface RazorpayCheckoutResponse {
  order_id: string;
  key_id: string;
  amount: number;
  currency: string;
}

export type CheckoutResponse = StripeCheckoutResponse | RazorpayCheckoutResponse;

// ============================================================================
// Webhook Event Types
// ============================================================================

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, any>;
  };
}

export interface RazorpayWebhookEvent {
  event: string;
  payload: {
    payment?: {
      entity: Record<string, any>;
    };
    subscription?: {
      entity: Record<string, any>;
    };
  };
}

// ============================================================================
// Plan/Pricing Types
// ============================================================================

export interface BillingPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  features: PlanFeature[];
  limits: PlanLimits;
  isActive: boolean;
  sortOrder: number;
}

export interface PlanFeature {
  key: string;
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
}

export interface PlanLimits {
  users: number;
  integrations: number;
  apiCallsPerMonth: number;
  storageGb: number;
  aiQueriesPerMonth: number;
  dataRetentionDays: number;
}

// ============================================================================
// Entitlements Types
// ============================================================================

export interface Entitlements {
  plan: string;
  planName: string;
  limits: PlanLimits;
  usage: Record<string, number>;
  remaining: {
    apiCallsPerMonth: number;
    aiQueriesPerMonth: number;
    users: number;
    integrations: number;
    storageGb: number;
  };
  features: string[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ListPlansResponse {
  plans: SKU[];
}

export interface GetSubscriptionResponse {
  subscription: TenantSubscription & {
    sku_name?: string;
    product_code?: string;
    tier?: string;
  };
}

export interface ListSubscriptionsResponse {
  subscriptions: (TenantSubscription & {
    sku_name?: string;
    product_code?: string;
    tier?: string;
  })[];
}

export interface CreateCheckoutResponse {
  checkout_url?: string;
  session_id?: string;
  order_id?: string;
  key_id?: string;
  amount?: number;
  currency?: string;
}

export interface BillingErrorResponse {
  error: string;
  details?: string;
}
