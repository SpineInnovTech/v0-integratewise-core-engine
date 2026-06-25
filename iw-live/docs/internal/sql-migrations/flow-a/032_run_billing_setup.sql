-- BILLING SETUP: Run this script to create all billing tables and seed plans
-- This combines 030_create_billing_schema.sql and 031_seed_billing_plans.sql

-- =====================================================
-- 1. Plans Table
-- =====================================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'INR' NOT NULL,
  price_cents INT NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'yearly')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plans_code ON plans(code);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);

-- =====================================================
-- 2. Organization Subscriptions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS org_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'past_due', 'canceled')),
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(org_id)
);

CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org_id ON org_subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_status ON org_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_period_end ON org_subscriptions(current_period_end);

-- =====================================================
-- 3. Invoices Table
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  subscription_id UUID REFERENCES org_subscriptions(id),
  amount_cents INT NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void')),
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  corr_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_corr_id ON invoices(corr_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- =====================================================
-- 4. Payments Table
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  provider TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL,
  amount_cents INT NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  received_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider, provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- =====================================================
-- 5. Entitlements Table
-- =====================================================
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('plan', 'promo', 'manual')),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(org_id, key)
);

CREATE INDEX IF NOT EXISTS idx_entitlements_org_id ON entitlements(org_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_key ON entitlements(key);
CREATE INDEX IF NOT EXISTS idx_entitlements_source ON entitlements(source);

-- =====================================================
-- 6. Audit Log for Billing Events
-- =====================================================
CREATE TABLE IF NOT EXISTS billing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  actor_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_billing_audit_log_org_id ON billing_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_event_type ON billing_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_created_at ON billing_audit_log(created_at DESC);

-- =====================================================
-- 7. Row Level Security (RLS) Policies
-- =====================================================

-- Plans are public readable (no org_id)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plans_public_read ON plans;
CREATE POLICY plans_public_read ON plans FOR SELECT USING (true);

-- Org subscriptions - allow all for now (add tenant isolation later)
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_subscriptions_allow_all ON org_subscriptions;
CREATE POLICY org_subscriptions_allow_all ON org_subscriptions FOR ALL USING (true);

-- Invoices - allow all for now
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_allow_all ON invoices;
CREATE POLICY invoices_allow_all ON invoices FOR ALL USING (true);

-- Payments - allow all for now
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_allow_all ON payments;
CREATE POLICY payments_allow_all ON payments FOR ALL USING (true);

-- Entitlements - allow all for now
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS entitlements_allow_all ON entitlements;
CREATE POLICY entitlements_allow_all ON entitlements FOR ALL USING (true);

-- Audit log - allow all for now
ALTER TABLE billing_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS billing_audit_log_allow_all ON billing_audit_log;
CREATE POLICY billing_audit_log_allow_all ON billing_audit_log FOR ALL USING (true);

-- =====================================================
-- 8. Triggers for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_subscriptions_updated_at ON org_subscriptions;
CREATE TRIGGER update_org_subscriptions_updated_at
  BEFORE UPDATE ON org_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entitlements_updated_at ON entitlements;
CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. Helper Functions
-- =====================================================

CREATE OR REPLACE FUNCTION get_active_subscription(p_org_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_code TEXT,
  plan_name TEXT,
  status TEXT,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    os.id,
    p.code,
    p.name,
    os.status,
    os.trial_end,
    os.current_period_start,
    os.current_period_end
  FROM org_subscriptions os
  JOIN plans p ON os.plan_id = p.id
  WHERE os.org_id = p_org_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_org_entitlements(p_org_id UUID)
RETURNS TABLE (
  key TEXT,
  value JSONB,
  source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.key, e.value, e.source
  FROM entitlements e
  WHERE e.org_id = p_org_id
    AND (e.expires_at IS NULL OR e.expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_entitlement(p_org_id UUID, p_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM entitlements
    WHERE org_id = p_org_id
      AND key = p_key
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_entitlement_value(p_org_id UUID, p_key TEXT)
RETURNS JSONB AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM entitlements
  WHERE org_id = p_org_id
    AND key = p_key
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION sync_entitlements_for_subscription(p_org_id UUID, p_plan_code TEXT)
RETURNS VOID AS $$
DECLARE
  v_entitlements JSONB;
BEGIN
  DELETE FROM entitlements
  WHERE org_id = p_org_id AND source = 'plan';

  CASE p_plan_code
    WHEN 'starter' THEN
      v_entitlements := jsonb_build_object(
        'max_workflows', 5,
        'max_integrations', 3,
        'rag_quota_tokens_month', 1000,
        'analytics_level', 'basic',
        'support_sla', 'email_48h',
        'api_access', false,
        'webhooks_enabled', false,
        'team_collaboration', false,
        'custom_integrations', false,
        'white_label', false,
        'on_premise', false
      );
    
    WHEN 'pro-monthly', 'pro-yearly' THEN
      v_entitlements := jsonb_build_object(
        'max_workflows', 50,
        'max_integrations', 999999,
        'rag_quota_tokens_month', 50000,
        'analytics_level', 'advanced',
        'support_sla', 'email_24h',
        'api_access', true,
        'webhooks_enabled', true,
        'team_collaboration', true,
        'custom_integrations', false,
        'white_label', false,
        'on_premise', false
      );
    
    WHEN 'enterprise' THEN
      v_entitlements := jsonb_build_object(
        'max_workflows', 999999,
        'max_integrations', 999999,
        'rag_quota_tokens_month', 999999999,
        'analytics_level', 'enterprise',
        'support_sla', 'priority_4h',
        'api_access', true,
        'webhooks_enabled', true,
        'team_collaboration', true,
        'custom_integrations', true,
        'white_label', true,
        'on_premise', true,
        'dedicated_manager', true
      );
    
    ELSE
      RAISE EXCEPTION 'Unknown plan code: %', p_plan_code;
  END CASE;

  INSERT INTO entitlements (org_id, key, value, source)
  SELECT 
    p_org_id,
    key,
    to_jsonb(value),
    'plan'
  FROM jsonb_each(v_entitlements);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. SEED PLANS DATA
-- =====================================================

INSERT INTO plans (code, name, description, currency, price_cents, interval, is_active, features, metadata) VALUES
(
  'starter',
  'Starter',
  'Perfect for individuals and small teams getting started',
  'INR',
  0,
  'monthly',
  true,
  jsonb_build_array(
    jsonb_build_object('name', 'Up to 5 workflows', 'included', true),
    jsonb_build_object('name', 'Up to 3 integrations', 'included', true),
    jsonb_build_object('name', '1,000 AI tokens/month', 'included', true),
    jsonb_build_object('name', 'Basic analytics', 'included', true),
    jsonb_build_object('name', 'Email support', 'included', true),
    jsonb_build_object('name', 'Community access', 'included', true),
    jsonb_build_object('name', 'Advanced analytics', 'included', false),
    jsonb_build_object('name', 'Priority support', 'included', false),
    jsonb_build_object('name', 'Custom integrations', 'included', false)
  ),
  jsonb_build_object(
    'trial_days', 14,
    'recommended', false,
    'tier', 'starter'
  )
),
(
  'pro-monthly',
  'Pro',
  'For growing teams that need more power and flexibility',
  'INR',
  299900,
  'monthly',
  true,
  jsonb_build_array(
    jsonb_build_object('name', 'Up to 50 workflows', 'included', true),
    jsonb_build_object('name', 'Unlimited integrations', 'included', true),
    jsonb_build_object('name', '50,000 AI tokens/month', 'included', true),
    jsonb_build_object('name', 'Advanced analytics', 'included', true),
    jsonb_build_object('name', 'Priority email support', 'included', true),
    jsonb_build_object('name', 'Custom webhooks', 'included', true),
    jsonb_build_object('name', 'API access', 'included', true),
    jsonb_build_object('name', 'Team collaboration', 'included', true),
    jsonb_build_object('name', 'Dedicated support', 'included', false),
    jsonb_build_object('name', 'Custom SLA', 'included', false)
  ),
  jsonb_build_object(
    'trial_days', 14,
    'recommended', true,
    'tier', 'pro',
    'savings_vs_monthly', 0
  )
),
(
  'pro-yearly',
  'Pro (Yearly)',
  'For growing teams that need more power and flexibility - save 20% with annual billing',
  'INR',
  2879040,
  'yearly',
  true,
  jsonb_build_array(
    jsonb_build_object('name', 'Up to 50 workflows', 'included', true),
    jsonb_build_object('name', 'Unlimited integrations', 'included', true),
    jsonb_build_object('name', '50,000 AI tokens/month', 'included', true),
    jsonb_build_object('name', 'Advanced analytics', 'included', true),
    jsonb_build_object('name', 'Priority email support', 'included', true),
    jsonb_build_object('name', 'Custom webhooks', 'included', true),
    jsonb_build_object('name', 'API access', 'included', true),
    jsonb_build_object('name', 'Team collaboration', 'included', true),
    jsonb_build_object('name', 'Dedicated support', 'included', false),
    jsonb_build_object('name', 'Custom SLA', 'included', false)
  ),
  jsonb_build_object(
    'trial_days', 14,
    'recommended', true,
    'tier', 'pro',
    'savings_vs_monthly', 20,
    'monthly_equivalent', 239920
  )
),
(
  'enterprise',
  'Enterprise',
  'Custom solutions for large organizations with advanced needs',
  'INR',
  999900,
  'monthly',
  true,
  jsonb_build_array(
    jsonb_build_object('name', 'Unlimited workflows', 'included', true),
    jsonb_build_object('name', 'Unlimited integrations', 'included', true),
    jsonb_build_object('name', 'Custom AI token limits', 'included', true),
    jsonb_build_object('name', 'Advanced analytics & reporting', 'included', true),
    jsonb_build_object('name', 'Dedicated account manager', 'included', true),
    jsonb_build_object('name', 'Custom integrations', 'included', true),
    jsonb_build_object('name', 'White-label options', 'included', true),
    jsonb_build_object('name', 'Custom SLA (99.9% uptime)', 'included', true),
    jsonb_build_object('name', 'On-premise deployment option', 'included', true),
    jsonb_build_object('name', 'Priority phone & chat support', 'included', true),
    jsonb_build_object('name', 'Security audit & compliance', 'included', true)
  ),
  jsonb_build_object(
    'trial_days', 30,
    'recommended', false,
    'tier', 'enterprise',
    'custom_pricing', true,
    'contact_sales', true
  )
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  features = EXCLUDED.features,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- Verify setup
SELECT code, name, price_cents, interval FROM plans ORDER BY price_cents;
