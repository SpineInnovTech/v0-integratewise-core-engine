-- Area 1, 2, 7, 10: Operational Hardening Migration
-- 1. Expanded Signal Rules (Area 1)
INSERT INTO signal_rules (event_type_match, signal_key, severity_score)
VALUES -- Lead OS Signals
    (
        'salesforce.lead.upsert',
        'sales.lead_velocity',
        40
    ),
    (
        'stripe.customer.created',
        'sales.new_prospect',
        20
    ),
    (
        'marketing.email.opened',
        'sales.lead_engaged',
        15
    ),
    (
        'marketing.demo.scheduled',
        'sales.demo_booked',
        50
    ),
    -- CS OS Signals
    ('zendesk.ticket.created', 'cs.ticket_volume', 30),
    (
        'zendesk.ticket.priority_high',
        'cs.high_priority_ticket',
        80
    ),
    ('app.usage.drop_30d', 'cs.usage_decline', 70),
    (
        'app.feature.churn_indicator',
        'cs.feature_abandonment',
        60
    ),
    -- Revenue OS Signals
    (
        'stripe.invoice.payment_failed',
        'revenue.payment_fail',
        90
    ),
    (
        'stripe.subscription.updated',
        'revenue.plan_change',
        40
    );
-- 2. Playbooks for Actions (Area 2)
CREATE TABLE IF NOT EXISTS playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    situation_key TEXT UNIQUE NOT NULL,
    -- Ties to situations.situation_key
    title TEXT NOT NULL,
    recommended_action_type TEXT NOT NULL,
    guidance_markdown TEXT,
    parameters_template JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO playbooks (
        situation_key,
        title,
        recommended_action_type,
        guidance_markdown,
        parameters_template
    )
VALUES (
        'at_risk.billing_failure',
        'Billing Recovery Playbook',
        'billing.apply_grace_period',
        '# Recovery Plan
1. Apply a 7-day grace period to prevent immediate lockout.
2. Trigger automated reminder email.
3. If amount > $500, notify CSM for personal outreach.',
        '{"days": 7}'
    ),
    (
        'sales.hot_lead',
        'Sales Outreach Playbook',
        'crm.create_task',
        '# Fast Response Protocol
1. Create a task for Lead Owner.
2. Goal: Contact within 15 minutes of trigger.',
        '{"subject": "High Intent Follow-up", "priority": "high"}'
    );
-- 3. Product Modules & Limits (Area 7)
-- Update existing tenants with clear starter module configs
UPDATE tenants
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{
    "subscription_tier": "starter",
    "modules_limit": 2,
    "max_api_calls_monthly": 10000,
    "max_ai_sessions": 500
}'::jsonb;
-- 4. System Monitoring & Alerts (Area 10)
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    service_name TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    -- 'latency_spike', 'error_rate_high', 'limit_near_threshold'
    severity TEXT DEFAULT 'warning',
    message TEXT,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
-- Index for admin dashboard performance
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON system_alerts(is_resolved)
WHERE (is_resolved = false);