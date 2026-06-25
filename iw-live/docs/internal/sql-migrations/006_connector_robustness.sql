-- Connector Robustness Tables
-- Table for tracking connector health and failures
CREATE TABLE IF NOT EXISTS connector_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    tool_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload_hash TEXT,
    error_code TEXT,
    error_message TEXT,
    error_details JSONB,
    status TEXT DEFAULT 'needs_review',
    -- 'needs_review', 'resolved', 'ignored', 'retrying'
    severity TEXT DEFAULT 'medium',
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Table for connector configuration
CREATE TABLE IF NOT EXISTS connector_config (
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    tool_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    api_base TEXT,
    retry_policy JSONB DEFAULT '{"max_attempts": 3, "backoff": "exponential", "initial_delay_ms": 1000}',
    throttling_config JSONB DEFAULT '{"rate_limit_per_min": 60}',
    feature_flags JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, tool_name)
);
-- Add index for health monitoring
CREATE INDEX IF NOT EXISTS idx_connector_failures_tenant_tool ON connector_failures(tenant_id, tool_name, status);
CREATE INDEX IF NOT EXISTS idx_connector_failures_created ON connector_failures(created_at);