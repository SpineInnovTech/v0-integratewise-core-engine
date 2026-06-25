-- Area 2.3 & 2.4: Productization & Support Hardening
-- 1. Product SKU Registry (Area 2.3)
CREATE TABLE IF NOT EXISTS product_skus (
    sku_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    limits JSONB NOT NULL,
    -- { "leads_per_month": 100, "signals": 10, "ai_sessions": 50 }
    base_price_monthly NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO product_skus (
        sku_id,
        name,
        description,
        limits,
        base_price_monthly
    )
VALUES (
        'lead_os_starter',
        'Lead OS Starter',
        'Essential lead velocity and demo occupancy intelligence.',
        '{"leads_per_month": 100, "signals": 20, "max_ai_sessions": 50, "autonomy_level": "manual"}',
        499
    ),
    (
        'revenue_os_starter',
        'Revenue OS Starter',
        'Automated billing recovery and churn prevention.',
        '{"managed_accounts": 500, "recovery_flows": 5, "max_ai_sessions": 100, "autonomy_level": "semi_auto"}',
        999
    );
-- 2. Tenant Onboarding Checklist (Area 2.4)
CREATE TABLE IF NOT EXISTS tenant_onboarding (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    sku_id TEXT REFERENCES product_skus(sku_id),
    onboarding_step TEXT NOT NULL,
    -- 'wiring_completed', 'signals_reviewed', 'playbooks_tested'
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);
-- 3. Support & Feedback Hub (Area 2.4)
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    category TEXT NOT NULL,
    -- 'bug', 'feedback', 'connector_issue', 'signal_false_positive'
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    -- 'open', 'in_progress', 'resolved'
    urgency TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. Automatic Doc Generation Log (Area 2.4)
-- Tracks when the system auto-generates or updates internal docs for new signals/actions
CREATE TABLE IF NOT EXISTS auto_doc_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL,
    -- 'signal', 'playbook', 'connector'
    resource_id TEXT NOT NULL,
    doc_path TEXT NOT NULL,
    change_summary TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Index for onboarding dashboard
CREATE INDEX IF NOT EXISTS idx_onboarding_tenant ON tenant_onboarding(tenant_id);