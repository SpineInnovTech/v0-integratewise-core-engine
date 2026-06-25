-- Migration: Enterprise Resilience Patterns
-- Created: 2025-01-XX
-- Description: Tables for circuit breaker, outbox, identity mapping, governance, embeddings, and billing

-- ============================================
-- OUTBOX PATTERN (Reliable Event Delivery)
-- ============================================

CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  destination_url TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter'))
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_events(status, next_retry_at) 
  WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_outbox_tenant ON outbox_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_outbox_type ON outbox_events(event_type);

-- Dead letter queue view
CREATE OR REPLACE VIEW outbox_dead_letters AS
SELECT * FROM outbox_events WHERE status = 'dead_letter';

-- ============================================
-- IDENTITY MAPPING (Entity Deduplication)
-- ============================================

CREATE TABLE IF NOT EXISTS canonical_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}',
  signature TEXT,
  canonical_id UUID REFERENCES canonical_entities(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS entity_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id UUID NOT NULL REFERENCES canonical_entities(id),
  merged_id UUID NOT NULL REFERENCES canonical_entities(id),
  confidence NUMERIC(3,2) NOT NULL,
  strategy TEXT NOT NULL,
  merged_by UUID REFERENCES profiles(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(canonical_id, merged_id)
);

CREATE INDEX IF NOT EXISTS idx_canonical_signature ON canonical_entities(signature);
CREATE INDEX IF NOT EXISTS idx_canonical_type_tenant ON canonical_entities(type, tenant_id);
CREATE INDEX IF NOT EXISTS idx_canonical_source ON canonical_entities(source, tenant_id);
CREATE INDEX IF NOT EXISTS idx_merges_canonical ON entity_merges(canonical_id);

-- ============================================
-- GOVERNANCE ENGINE (Data Quality Rules)
-- ============================================

CREATE TABLE IF NOT EXISTS governance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  conditions JSONB NOT NULL DEFAULT '[]',
  action TEXT NOT NULL CHECK (action IN ('allow', 'redact', 'mask', 'flag', 'reject', 'transform', 'encrypt')),
  action_config JSONB,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS governance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES governance_rules(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  original_data JSONB,
  processed_data JSONB,
  flags TEXT[],
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_governance_rules_tenant ON governance_rules(tenant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_governance_audit_entity ON governance_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_governance_audit_tenant ON governance_audit_log(tenant_id, created_at);

-- Default governance rules
INSERT INTO governance_rules (id, name, description, priority, enabled, conditions, action)
VALUES 
  (gen_random_uuid(), 'Redact SSN', 'Automatically redact Social Security Numbers', 100, true, 
   '[{"field": "*", "operator": "is_ssn", "value": null}]'::jsonb, 'redact'),
  (gen_random_uuid(), 'Mask Credit Cards', 'Mask credit card numbers showing only last 4 digits', 99, true,
   '[{"field": "*", "operator": "is_credit_card", "value": null}]'::jsonb, 'mask'),
  (gen_random_uuid(), 'Flag PII', 'Flag records containing any PII for review', 50, true,
   '[{"field": "*", "operator": "is_pii", "value": null}]'::jsonb, 'flag')
ON CONFLICT DO NOTHING;

-- ============================================
-- EMBEDDINGS (Vector Search)
-- ============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_id, tenant_id)
);

-- Vector similarity index (IVFFlat for large datasets)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_embeddings_search ON embeddings USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_embeddings_tenant ON embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings(source, tenant_id);

-- ============================================
-- BILLING SERVICE
-- ============================================

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

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_usage_tenant_metric ON usage_records(tenant_id, metric_key, timestamp);

-- Seed default plans
INSERT INTO plans (id, name, slug, price_monthly, price_yearly, features, limits, sort_order)
VALUES 
  ('free', 'Free', 'free', 0, 0, 
   '[{"key": "integrations", "name": "2 Integrations", "included": true, "limit": 2}, {"key": "users", "name": "1 User", "included": true, "limit": 1}]'::jsonb,
   '{"users": 1, "integrations": 2, "apiCallsPerMonth": 1000, "storageGb": 1, "aiQueriesPerMonth": 100, "dataRetentionDays": 7}'::jsonb, 0),
  ('pro', 'Pro', 'pro', 4900, 49000,
   '[{"key": "integrations", "name": "10 Integrations", "included": true, "limit": 10}, {"key": "users", "name": "5 Users", "included": true, "limit": 5}, {"key": "api", "name": "API Access", "included": true}]'::jsonb,
   '{"users": 5, "integrations": 10, "apiCallsPerMonth": 50000, "storageGb": 10, "aiQueriesPerMonth": 1000, "dataRetentionDays": 30}'::jsonb, 1),
  ('business', 'Business', 'business', 19900, 199000,
   '[{"key": "integrations", "name": "Unlimited", "included": true}, {"key": "users", "name": "Unlimited", "included": true}, {"key": "sso", "name": "SSO/SAML", "included": true}]'::jsonb,
   '{"users": -1, "integrations": -1, "apiCallsPerMonth": 500000, "storageGb": 100, "aiQueriesPerMonth": 10000, "dataRetentionDays": 365}'::jsonb, 2),
  ('enterprise', 'Enterprise', 'enterprise', 0, 0,
   '[{"key": "everything", "name": "Everything in Business", "included": true}, {"key": "sla", "name": "SLA", "included": true}, {"key": "onprem", "name": "On-Premise Option", "included": true}]'::jsonb,
   '{"users": -1, "integrations": -1, "apiCallsPerMonth": -1, "storageGb": -1, "aiQueriesPerMonth": -1, "dataRetentionDays": -1}'::jsonb, 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CIRCUIT BREAKER STATE (Optional persistence)
-- ============================================

CREATE TABLE IF NOT EXISTS circuit_breaker_state (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'closed' CHECK (state IN ('closed', 'open', 'half-open')),
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE outbox_events IS 'Transactional outbox for reliable event delivery';
COMMENT ON TABLE canonical_entities IS 'Unified entity records after identity resolution';
COMMENT ON TABLE entity_merges IS 'History of entity merge operations';
COMMENT ON TABLE governance_rules IS 'Data quality and compliance rules';
COMMENT ON TABLE governance_audit_log IS 'Audit trail of governance actions';
COMMENT ON TABLE embeddings IS 'Vector embeddings for semantic search';
COMMENT ON TABLE plans IS 'Subscription plans and pricing';
COMMENT ON TABLE subscriptions IS 'Active tenant subscriptions';
COMMENT ON TABLE invoices IS 'Billing invoices synced from Stripe';
COMMENT ON TABLE usage_records IS 'Metered usage tracking';
COMMENT ON TABLE circuit_breaker_state IS 'Persistent state for circuit breakers';
