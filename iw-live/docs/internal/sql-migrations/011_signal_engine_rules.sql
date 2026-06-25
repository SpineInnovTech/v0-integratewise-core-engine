-- Signal & Situation Engine Definitions
-- 1. Example Signal Rules (Logic for processing events)
CREATE TABLE IF NOT EXISTS signal_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    -- NULL means global system rule
    event_type_match TEXT NOT NULL,
    -- e.g. 'stripe.invoice.payment_failed'
    signal_key TEXT NOT NULL,
    -- e.g. 'billing.payment_failed'
    severity_score INTEGER DEFAULT 50,
    -- 0-100
    aggregation_window_sec INTEGER DEFAULT 0,
    -- 0 = immediate, >0 = aggregate over time
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Situation Escalation Rules (Logic for combining signals)
CREATE TABLE IF NOT EXISTS situation_escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    situation_key TEXT NOT NULL,
    -- e.g. 'at_risk.billing_churn'
    required_signal_keys TEXT [] NOT NULL,
    -- e.g. ['billing.payment_failed', 'usage.low']
    min_severity_threshold INTEGER DEFAULT 60,
    escalation_autonomy TEXT DEFAULT 'manual',
    -- manual, semi_auto, auto
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. Seed some default rules
INSERT INTO signal_rules (event_type_match, signal_key, severity_score)
VALUES (
        'stripe.invoice.payment_failed',
        'billing.payment_failed',
        70
    ),
    (
        'stripe.subscription.deleted',
        'billing.subscription_cancelled',
        100
    ),
    (
        'salesforce.lead.upsert',
        'sales.lead_velocity',
        30
    );
INSERT INTO situation_escalation_rules (
        situation_key,
        required_signal_keys,
        min_severity_threshold,
        escalation_autonomy
    )
VALUES (
        'at_risk.billing_failure',
        ARRAY ['billing.payment_failed'],
        50,
        'semi_auto'
    );
-- 4. Evidence Matrix View (For Think to quickly group events)
CREATE OR REPLACE VIEW vw_evidence_matrix AS
SELECT tenant_id,
    entity_type,
    entity_id,
    event_type,
    count(*) as event_count,
    max(received_at) as last_seen
FROM events
GROUP BY tenant_id,
    entity_type,
    entity_id,
    event_type;