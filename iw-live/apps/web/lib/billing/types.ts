// Billing System Types

export type Currency = 'INR' | 'USD' | 'EUR';

export type PlanInterval = 'monthly' | 'yearly';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled';

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type EntitlementSource = 'plan' | 'promo' | 'manual';

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number | string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  currency: Currency;
  price_cents: number;
  interval: PlanInterval;
  is_active: boolean;
  features: PlanFeature[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  org_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  trial_end: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  canceled_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_amount_cents: number;
  total_cents: number;
  metadata?: Record<string, any>;
}

export interface Invoice {
  id: string;
  org_id: string;
  subscription_id: string | null;
  amount_cents: number;
  currency: Currency;
  status: InvoiceStatus;
  due_at: string | null;
  paid_at: string | null;
  line_items: InvoiceLineItem[];
  corr_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  provider: string;
  provider_payment_id: string;
  amount_cents: number;
  currency: Currency;
  status: PaymentStatus;
  received_at: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Entitlement {
  id: string;
  org_id: string;
  key: string;
  value: any;
  source: EntitlementSource;
  expires_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BillingAuditLog {
  id: string;
  org_id: string;
  event_type: string;
  actor_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// API Request/Response Types

export interface SubscribeRequest {
  org_id: string;
  plan_code: string;
  trial_days?: number;
  payment_method_token?: string;
}

export interface SubscribeResponse {
  subscription_id: string;
  status: SubscriptionStatus;
  trial_end: string | null;
  current_period_end: string;
}

export interface GetSubscriptionResponse {
  subscription: Subscription;
  plan: Plan;
  entitlements: Record<string, any>;
}

export interface ChangePlanRequest {
  org_id: string;
  new_plan_code: string;
  prorate?: boolean;
}

export interface ChangePlanResponse {
  subscription_id: string;
  status: SubscriptionStatus;
  proration_invoice?: Invoice;
}

export interface CancelSubscriptionRequest {
  org_id: string;
  cancel_at_period_end: boolean;
  reason?: string;
}

export interface CancelSubscriptionResponse {
  subscription_id: string;
  status: SubscriptionStatus;
  canceled_at: string | null;
  cancel_at: string | null;
}

export interface WebhookEvent {
  id: string;
  type: string;
  provider: string;
  data: any;
  signature: string;
  timestamp: number;
}

// Entitlement Keys
export const ENTITLEMENT_KEYS = {
  MAX_WORKFLOWS: 'max_workflows',
  MAX_INTEGRATIONS: 'max_integrations',
  RAG_QUOTA_TOKENS_MONTH: 'rag_quota_tokens_month',
  ANALYTICS_LEVEL: 'analytics_level',
  SUPPORT_SLA: 'support_sla',
  API_ACCESS: 'api_access',
  WEBHOOKS_ENABLED: 'webhooks_enabled',
  TEAM_COLLABORATION: 'team_collaboration',
  CUSTOM_INTEGRATIONS: 'custom_integrations',
  WHITE_LABEL: 'white_label',
  ON_PREMISE: 'on_premise',
  DEDICATED_MANAGER: 'dedicated_manager',
} as const;

export type EntitlementKey = typeof ENTITLEMENT_KEYS[keyof typeof ENTITLEMENT_KEYS];

// Helper type for entitlement values
export interface EntitlementValues {
  max_workflows: number;
  max_integrations: number;
  rag_quota_tokens_month: number;
  analytics_level: 'basic' | 'advanced' | 'enterprise';
  support_sla: 'email_48h' | 'email_24h' | 'priority_4h';
  api_access: boolean;
  webhooks_enabled: boolean;
  team_collaboration: boolean;
  custom_integrations: boolean;
  white_label: boolean;
  on_premise: boolean;
  dedicated_manager?: boolean;
}
