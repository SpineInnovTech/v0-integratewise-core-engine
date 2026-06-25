-- ============================================================================
-- IntegrateWise Product SKUs and Payment System
-- ============================================================================
-- Migration Date: 2026-03-01
-- Purpose: Add product catalog, SKU management, and payment transaction tracking
--
-- Tables:
--   - product_skus: Product catalog with SKU definitions and pricing
--   - payment_transactions: Stripe and Razorpay payment transaction tracking
--   - tenant_subscriptions: Subscription management for tenants

-- ============================================================================
-- Product SKUs Table
-- ============================================================================
-- Stores all product SKUs (Stock Keeping Units) with pricing and features
CREATE TABLE IF NOT EXISTS product_skus (
  id TEXT PRIMARY KEY,
  product_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL, -- 'free', 'starter', 'professional', 'enterprise', 'addon'
  billing_type TEXT NOT NULL, -- 'one_time', 'recurring'
  billing_interval TEXT, -- 'monthly', 'yearly', NULL for one_time
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  stripe_price_id TEXT,
  razorpay_plan_id TEXT,
  features TEXT, -- JSON array of feature flags
  limits TEXT, -- JSON object of usage limits
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_skus_code ON product_skus(product_code);
CREATE INDEX IF NOT EXISTS idx_product_skus_tier ON product_skus(tier);
CREATE INDEX IF NOT EXISTS idx_product_skus_status ON product_skus(status);

-- ============================================================================
-- Payment Transactions Table
-- ============================================================================
-- Tracks all payment transactions from Stripe and Razorpay
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sku_id TEXT NOT NULL,
  gateway TEXT NOT NULL, -- 'stripe', 'razorpay'
  gateway_session_id TEXT,
  gateway_payment_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (sku_id) REFERENCES product_skus(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_session ON payment_transactions(gateway_session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON payment_transactions(created_at);

-- ============================================================================
-- Tenant Subscriptions Table
-- ============================================================================
-- Manages subscription state for tenants
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sku_id TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'trial', 'past_due', 'cancelled', 'expired'
  activated_at TEXT NOT NULL,
  expires_at TEXT,
  cancelled_at TEXT,
  gateway TEXT,
  gateway_subscription_id TEXT,
  FOREIGN KEY (sku_id) REFERENCES product_skus(id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_activated_at ON tenant_subscriptions(activated_at);

-- ============================================================================
-- Seed Product SKUs
-- ============================================================================

-- Free tier
INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_free_001', 'IW-FREE-001', 'IntegrateWise Free', 'Get started with basic integration intelligence', 'free', 'recurring', 'monthly', 0, 'usd',
   '["3_connectors","personal_workspace","basic_spine","community_support"]',
   '{"connectors":3,"users":1,"storage_mb":100,"api_calls_month":1000}', 1);

-- Starter tier (Monthly)
INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_starter_m', 'IW-STARTER-M', 'IntegrateWise Starter (Monthly)', 'For individuals and small teams getting serious about integration', 'starter', 'recurring', 'monthly', 2900, 'usd',
   '["10_connectors","personal_work_workspace","full_spine","email_support","basic_ai","5_accelerators"]',
   '{"connectors":10,"users":3,"storage_mb":1000,"api_calls_month":10000}', 2);

-- Starter tier (Yearly)
INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_starter_y', 'IW-STARTER-Y', 'IntegrateWise Starter (Yearly)', 'For individuals and small teams — save 20% annually', 'starter', 'recurring', 'yearly', 27900, 'usd',
   '["10_connectors","personal_work_workspace","full_spine","email_support","basic_ai","5_accelerators"]',
   '{"connectors":10,"users":3,"storage_mb":1000,"api_calls_month":10000}', 3);

-- Professional tier (Monthly)
INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_pro_m', 'IW-PRO-M', 'IntegrateWise Professional (Monthly)', 'For growing teams that need full intelligence capabilities', 'professional', 'recurring', 'monthly', 7900, 'usd',
   '["25_connectors","all_workspaces","full_spine","full_ai","brainstorm","entity_360","progressive_hydration","priority_support","unlimited_accelerators","governance"]',
   '{"connectors":25,"users":10,"storage_mb":10000,"api_calls_month":100000}', 4);

-- Professional tier (Yearly)
INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_pro_y', 'IW-PRO-Y', 'IntegrateWise Professional (Yearly)', 'For growing teams — save 20% annually', 'professional', 'recurring', 'yearly', 76900, 'usd',
   '["25_connectors","all_workspaces","full_spine","full_ai","brainstorm","entity_360","progressive_hydration","priority_support","unlimited_accelerators","governance"]',
   '{"connectors":25,"users":10,"storage_mb":10000,"api_calls_month":100000}', 5);

-- Enterprise tier
INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_enterprise', 'IW-ENT-001', 'IntegrateWise Enterprise', 'Custom deployment for large organizations', 'enterprise', 'recurring', 'yearly', 0, 'usd',
   '["unlimited_connectors","all_workspaces","full_spine","full_ai","brainstorm","entity_360","progressive_hydration","dedicated_support","sla","custom_integrations","sso","audit_logs","compliance"]',
   '{"connectors":-1,"users":-1,"storage_mb":-1,"api_calls_month":-1}', 6);

-- Accelerator SKUs (One-time purchases)
INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_acc_csm', 'IW-ACC-CSM', 'CSM Playbook Accelerator', 'Pre-built workflows for onboarding, QBRs, renewals', 'addon', 'one_time', NULL, 4900, 'usd',
   '["csm_playbook","qbr_templates","renewal_workflows","health_score_models"]',
   '{}', 10);

INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_acc_sales', 'IW-ACC-SALES', 'Sales Pipeline Accelerator', 'Pipeline stages, email templates, forecasting models', 'addon', 'one_time', NULL, 4900, 'usd',
   '["pipeline_templates","email_sequences","forecast_models","deal_scoring"]',
   '{}', 11);

INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_acc_revops', 'IW-ACC-REVOPS', 'RevOps Analytics Accelerator', 'Revenue dashboards, quota tracking, territory maps', 'addon', 'one_time', NULL, 7900, 'usd',
   '["revenue_dashboards","quota_tracking","territory_maps","attribution_models"]',
   '{}', 12);

INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_acc_marketing', 'IW-ACC-MKTG', 'Marketing Campaigns Accelerator', 'Campaign templates, attribution models, lead scoring', 'addon', 'one_time', NULL, 4900, 'usd',
   '["campaign_templates","attribution_models","lead_scoring","content_calendar"]',
   '{}', 13);

-- India pricing (Razorpay) — INR
INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_starter_m_inr', 'IW-STARTER-M-INR', 'IntegrateWise Starter (Monthly INR)', 'For individuals and small teams in India', 'starter', 'recurring', 'monthly', 199900, 'inr',
   '["10_connectors","personal_work_workspace","full_spine","email_support","basic_ai","5_accelerators"]',
   '{"connectors":10,"users":3,"storage_mb":1000,"api_calls_month":10000}', 20);

INSERT OR IGNORE INTO product_skus (id, product_code, name, description, tier, billing_type, billing_interval, price_cents, currency, features, limits, sort_order)
VALUES
  ('sku_pro_m_inr', 'IW-PRO-M-INR', 'IntegrateWise Professional (Monthly INR)', 'For growing teams in India', 'professional', 'recurring', 'monthly', 599900, 'inr',
   '["25_connectors","all_workspaces","full_spine","full_ai","brainstorm","entity_360","progressive_hydration","priority_support","unlimited_accelerators","governance"]',
   '{"connectors":25,"users":10,"storage_mb":10000,"api_calls_month":100000}', 21);

-- ============================================================================
-- End of migration
-- ============================================================================
