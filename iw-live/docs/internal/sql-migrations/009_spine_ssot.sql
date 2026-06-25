-- Spine SSOT Consolidation
-- Implementation of "SSOT Schema Coverage" and "Normalizer Efficiency"
-- 1. Lock the Event Contract (Updating events table)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE events
ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE events
ADD COLUMN IF NOT EXISTS normalized_at TIMESTAMPTZ;
ALTER TABLE events
ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ DEFAULT NOW();
-- 2. Normalization Errors (DLQ for bad payloads)
CREATE TABLE IF NOT EXISTS normalization_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    source_system TEXT NOT NULL,
    raw_payload JSONB NOT NULL,
    error_message TEXT NOT NULL,
    handled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. Department-Specific Views (SSOT Coverage)
-- Sales View
CREATE OR REPLACE VIEW vw_sales_accounts AS
SELECT am.*,
    bc.business_model,
    bc.current_stage
FROM account_master am
    LEFT JOIN business_context bc ON am.account_id = bc.account_id
WHERE am.status IN ('Active', 'Prospect', 'Trial');
-- CS View
CREATE OR REPLACE VIEW vw_cs_accounts AS
SELECT am.*,
    phm.metric_value as latest_ticket_volume,
    spt.status as success_plan_status
FROM account_master am
    LEFT JOIN (
        SELECT DISTINCT ON (account_id) account_id,
            metric_value
        FROM platform_health_metrics
        WHERE metric_name = 'Ticket Volume'
        ORDER BY account_id,
            metric_date DESC
    ) phm ON am.account_id = phm.account_id
    LEFT JOIN success_plan_tracker spt ON am.account_id = spt.account_id;
-- 4. Org-Level Feature Provisioning
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS enabled_modules JSONB DEFAULT '["lead_os", "cs_os"]';
-- 5. BYOM (Bring Your Own Model)
CREATE TABLE IF NOT EXISTS tenant_ai_config (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    model_provider TEXT DEFAULT 'openai',
    -- 'openai', 'anthropic', 'custom'
    model_name TEXT DEFAULT 'gpt-4o',
    model_version TEXT,
    api_endpoint TEXT,
    api_key_vault_ref TEXT,
    embedding_model TEXT DEFAULT 'text-embedding-3-small',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 6. Thresholds & Limits
CREATE TABLE IF NOT EXISTS tenant_limits (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    max_file_size_mb INTEGER DEFAULT 25,
    max_docs_per_day INTEGER DEFAULT 100,
    max_embeddings_per_day INTEGER DEFAULT 1000,
    max_total_chunks INTEGER DEFAULT 50000,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tenant_usage_daily (
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    usage_date DATE DEFAULT CURRENT_DATE,
    docs_ingested INTEGER DEFAULT 0,
    chunks_embedded INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    PRIMARY KEY (tenant_id, usage_date)
);
-- 7. Integration State (Polling cursors)
CREATE TABLE IF NOT EXISTS integration_state (
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    connector_id TEXT NOT NULL,
    last_sync_at TIMESTAMPTZ,
    last_page_token TEXT,
    metadata JSONB DEFAULT '{}',
    PRIMARY KEY (tenant_id, connector_id)
);