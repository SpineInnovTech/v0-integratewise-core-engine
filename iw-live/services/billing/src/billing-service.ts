/**
 * Billing Service
 *
 * Subscription management, usage tracking, and Stripe integration.
 * Handles plans, invoices, and payment processing.
 *
 * @integratewise/billing
 */

export interface Plan {
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

export interface SKU {
  id: string;
  product_code: string;
  name: string;
  description?: string;
  tier: "free" | "starter" | "professional" | "enterprise" | "addon";
  billing_type: "one_time" | "recurring";
  billing_interval?: "monthly" | "yearly";
  price_cents: number;
  currency: string;
  stripe_price_id?: string;
  razorpay_plan_id?: string;
  features: string[] | string;
  limits: Record<string, number>;
  sort_order: number;
  status: "active" | "inactive" | "archived";
  created_at?: string;
  updated_at?: string;
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

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  billingInterval: "monthly" | "yearly";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  stripeInvoiceId: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: InvoiceStatus;
  periodStart: Date;
  periodEnd: Date;
  dueDate?: Date;
  paidAt?: Date;
  invoiceUrl?: string;
  invoicePdf?: string;
  createdAt: Date;
}

export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";

export interface UsageRecord {
  id: string;
  tenantId: string;
  metricKey: UsageMetric;
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export type UsageMetric =
  | "api_calls"
  | "ai_queries"
  | "storage_bytes"
  | "integrations"
  | "users"
  | "data_syncs";

/**
 * Default plans
 */
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    slug: "free",
    description: "Perfect for trying out IntegrateWise",
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: "",
    stripePriceIdYearly: "",
    features: [
      { key: "integrations", name: "2 Integrations", included: true, limit: 2 },
      { key: "users", name: "1 User", included: true, limit: 1 },
      { key: "support", name: "Community Support", included: true },
      { key: "api", name: "API Access", included: false },
    ],
    limits: {
      users: 1,
      integrations: 2,
      apiCallsPerMonth: 1000,
      storageGb: 1,
      aiQueriesPerMonth: 100,
      dataRetentionDays: 7,
    },
    isActive: true,
    sortOrder: 0,
  },
  {
    id: "starter",
    name: "Starter",
    slug: "starter",
    description: "For growing teams",
    priceMonthly: 29,
    priceYearly: 319,
    stripePriceIdMonthly: "price_starter_monthly",
    stripePriceIdYearly: "price_starter_yearly",
    features: [
      { key: "integrations", name: "10 Integrations", included: true, limit: 10 },
      { key: "users", name: "5 Users", included: true, limit: 5 },
      { key: "support", name: "Email Support", included: true },
      { key: "api", name: "API Access", included: true },
      { key: "ai", name: "AI Insights", included: true },
    ],
    limits: {
      users: 5,
      integrations: 10,
      apiCallsPerMonth: 50000,
      storageGb: 10,
      aiQueriesPerMonth: 1000,
      dataRetentionDays: 30,
    },
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "growth",
    name: "Growth",
    slug: "growth",
    description: "Scale your operations",
    priceMonthly: 79,
    priceYearly: 869,
    stripePriceIdMonthly: "price_growth_monthly",
    stripePriceIdYearly: "price_growth_yearly",
    features: [
      { key: "integrations", name: "Unlimited Integrations", included: true },
      { key: "users", name: "Unlimited Users", included: true },
      { key: "support", name: "Priority Support", included: true },
      { key: "api", name: "API Access", included: true },
      { key: "ai", name: "Advanced AI", included: true },
      { key: "sso", name: "SSO/SAML", included: true },
      { key: "audit", name: "Audit Logs", included: true },
    ],
    limits: {
      users: -1, // Unlimited
      integrations: -1,
      apiCallsPerMonth: 500000,
      storageGb: 100,
      aiQueriesPerMonth: 10000,
      dataRetentionDays: 365,
    },
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    slug: "enterprise",
    description: "Custom solutions for large teams",
    priceMonthly: 0, // Custom pricing
    priceYearly: 0,
    stripePriceIdMonthly: "",
    stripePriceIdYearly: "",
    features: [
      { key: "integrations", name: "Unlimited Integrations", included: true },
      { key: "users", name: "Unlimited Users", included: true },
      { key: "support", name: "Dedicated Support", included: true },
      { key: "api", name: "API Access", included: true },
      { key: "ai", name: "Custom AI Models", included: true },
      { key: "sso", name: "SSO/SAML", included: true },
      { key: "audit", name: "Audit Logs", included: true },
      { key: "sla", name: "SLA", included: true },
      { key: "onprem", name: "On-Premise Option", included: true },
    ],
    limits: {
      users: -1,
      integrations: -1,
      apiCallsPerMonth: -1,
      storageGb: -1,
      aiQueriesPerMonth: -1,
      dataRetentionDays: -1,
    },
    isActive: true,
    sortOrder: 3,
  },
];

/**
 * Check if usage is within plan limits
 */
export function isWithinLimits(
  plan: Plan,
  metric: keyof PlanLimits,
  currentUsage: number
): boolean {
  const limit = plan.limits[metric];
  if (limit === -1) return true; // Unlimited
  return currentUsage < limit;
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(
  plan: Plan,
  metric: keyof PlanLimits,
  currentUsage: number
): number {
  const limit = plan.limits[metric];
  if (limit === -1) return 0; // Unlimited shows as 0%
  if (limit === 0) return 100; // Edge case
  return Math.min(100, (currentUsage / limit) * 100);
}

/**
 * SQL queries for billing operations
 */
export const billingQueries = {
  /** Get subscription by tenant */
  getSubscription: `
    SELECT s.*, p.name as plan_name, p.slug as plan_slug
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.tenant_id = $1
    ORDER BY s.created_at DESC
    LIMIT 1
  `,

  /** Create subscription */
  createSubscription: `
    INSERT INTO subscriptions (
      tenant_id, plan_id, status, billing_interval,
      current_period_start, current_period_end,
      stripe_subscription_id, stripe_customer_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `,

  /** Update subscription */
  updateSubscription: `
    UPDATE subscriptions
    SET 
      status = COALESCE($2, status),
      plan_id = COALESCE($3, plan_id),
      current_period_end = COALESCE($4, current_period_end),
      cancel_at_period_end = COALESCE($5, cancel_at_period_end),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `,

  /** Get invoices */
  getInvoices: `
    SELECT * FROM invoices
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,

  /** Create invoice */
  createInvoice: `
    INSERT INTO invoices (
      tenant_id, subscription_id, stripe_invoice_id,
      amount_due, amount_paid, currency, status,
      period_start, period_end, due_date,
      invoice_url, invoice_pdf
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `,

  /** Record usage */
  recordUsage: `
    INSERT INTO usage_records (tenant_id, metric_key, quantity, metadata)
    VALUES ($1, $2, $3, $4)
  `,

  /** Get usage for period */
  getUsage: `
    SELECT 
      metric_key,
      SUM(quantity) as total,
      COUNT(*) as count
    FROM usage_records
    WHERE tenant_id = $1
      AND timestamp >= $2
      AND timestamp < $3
    GROUP BY metric_key
  `,

  /** Get current month usage */
  getCurrentMonthUsage: `
    SELECT 
      metric_key,
      SUM(quantity) as total
    FROM usage_records
    WHERE tenant_id = $1
      AND timestamp >= date_trunc('month', NOW())
    GROUP BY metric_key
  `,
};

/**
 * SQL migration for billing tables
 */
export const BILLING_MIGRATIONS = `
-- Plans Table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_invoice_id TEXT UNIQUE,
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'open',
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  invoice_pdf TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Records Table
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_usage_tenant_metric ON usage_records(tenant_id, metric_key, timestamp);

-- Seed default plans
INSERT INTO plans (id, name, slug, price_monthly, price_yearly, features, limits, sort_order)
VALUES 
  ('free', 'Free', 'free', 0, 0, 
   '[{"key": "integrations", "name": "2 Integrations", "included": true, "limit": 2}]'::jsonb,
   '{"users": 1, "integrations": 2, "apiCallsPerMonth": 1000}'::jsonb, 0),
  ('pro', 'Pro', 'pro', 4900, 49000,
   '[{"key": "integrations", "name": "10 Integrations", "included": true, "limit": 10}]'::jsonb,
   '{"users": 5, "integrations": 10, "apiCallsPerMonth": 50000}'::jsonb, 1),
  ('business', 'Business', 'business', 19900, 199000,
   '[{"key": "integrations", "name": "Unlimited", "included": true}]'::jsonb,
   '{"users": -1, "integrations": -1, "apiCallsPerMonth": 500000}'::jsonb, 2)
ON CONFLICT (id) DO NOTHING;
`;

/**
 * Stripe webhook event types we handle
 */
export const STRIPE_WEBHOOK_EVENTS = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.finalized",
  "checkout.session.completed",
] as const;

export type StripeWebhookEvent = (typeof STRIPE_WEBHOOK_EVENTS)[number];

/**
 * SQL migration for SKU and payment system
 */
export const SKU_MIGRATIONS = `
-- Product SKUs, Payment Transactions, and Tenant Subscriptions
-- See: migrations/20260301_product_skus_and_billing.sql
`;

/**
 * Map Stripe subscription status to our status
 */
export function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    trialing: "trialing",
    incomplete: "incomplete",
    incomplete_expired: "incomplete_expired",
    paused: "paused",
  };
  return statusMap[stripeStatus] || "incomplete";
}

/**
 * Calculate prorated amount for plan change
 */
export function calculateProration(
  currentPlan: Plan,
  newPlan: Plan,
  daysRemaining: number,
  totalDays: number
): number {
  const daysInPeriod = totalDays > 0 ? totalDays : 30;
  const currentDaily = currentPlan.priceMonthly / daysInPeriod;
  const newDaily = newPlan.priceMonthly / daysInPeriod;

  const unusedCredit = currentDaily * daysRemaining;
  const newCharge = newDaily * daysRemaining;

  return Math.round((newCharge - unusedCredit) * 100); // In cents
}
