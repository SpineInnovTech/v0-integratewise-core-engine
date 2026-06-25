-- Billing Schema: Subscription & Pricing Module
-- Plans, subscriptions, invoices, payments, and entitlements

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

CREATE INDEX idx_plans_code ON plans(code);
CREATE INDEX idx_plans_is_active ON plans(is_active);

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

CREATE INDEX idx_org_subscriptions_org_id ON org_subscriptions(org_id);
CREATE INDEX idx_org_subscriptions_status ON org_subscriptions(status);
CREATE INDEX idx_org_subscriptions_period_end ON org_subscriptions(current_period_end);

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

CREATE INDEX idx_invoices_org_id ON invoices(org_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_corr_id ON invoices(corr_id);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);

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

CREATE UNIQUE INDEX idx_payments_provider_payment_id ON payments(provider, provider_payment_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);

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

CREATE INDEX idx_entitlements_org_id ON entitlements(org_id);
CREATE INDEX idx_entitlements_key ON entitlements(key);
CREATE INDEX idx_entitlements_source ON entitlements(source);

-- =====================================================
-- 6. Audit Log for Billing Events
-- =====================================================
CREATE TABLE IF NOT EXISTS billing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- subscribe, change_plan, cancel, payment_success, payment_failed
  actor_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_billing_audit_log_org_id ON billing_audit_log(org_id);
CREATE INDEX idx_billing_audit_log_event_type ON billing_audit_log(event_type);
CREATE INDEX idx_billing_audit_log_created_at ON billing_audit_log(created_at DESC);

-- =====================================================
-- 7. Row Level Security (RLS) Policies
-- =====================================================

-- Plans are public readable (no org_id)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY plans_public_read ON plans FOR SELECT USING (true);

-- Org subscriptions scoped by org_id
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_subscriptions_tenant_isolation ON org_subscriptions
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- Invoices scoped by org_id
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_tenant_isolation ON invoices
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- Payments scoped via invoice
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_tenant_isolation ON payments
  FOR ALL USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE org_id = current_setting('app.current_org_id', true)::UUID
    )
  );

-- Entitlements scoped by org_id
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY entitlements_tenant_isolation ON entitlements
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- Audit log scoped by org_id
ALTER TABLE billing_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY billing_audit_log_tenant_isolation ON billing_audit_log
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

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

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_subscriptions_updated_at
  BEFORE UPDATE ON org_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. Helper Functions
-- =====================================================

-- Get active subscription for org
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

-- Get entitlements for org
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

-- Check if org has entitlement
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

-- Get entitlement value
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

COMMENT ON TABLE plans IS 'Subscription plans available for purchase';
COMMENT ON TABLE org_subscriptions IS 'Active subscriptions per organization';
COMMENT ON TABLE invoices IS 'Invoices generated for subscriptions';
COMMENT ON TABLE payments IS 'Payment records linked to invoices';
COMMENT ON TABLE entitlements IS 'Feature entitlements and limits per organization';
COMMENT ON TABLE billing_audit_log IS 'Audit trail for billing events';
