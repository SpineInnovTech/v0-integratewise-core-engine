-- AI Usage Tracking
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    model_name TEXT NOT NULL,
    model_version TEXT,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost_usd DECIMAL(12, 6) DEFAULT 0,
    tool_context TEXT,
    -- which tool triggered the call (e.g. 'think:billing')
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant_date ON ai_usage(tenant_id, created_at);