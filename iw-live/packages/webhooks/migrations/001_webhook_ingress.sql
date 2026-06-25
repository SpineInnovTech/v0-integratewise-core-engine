-- IntegrateWise Webhook Ingress Schema
-- Migration: 001_webhook_ingress.sql
-- Description: Core tables for webhook event processing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Main events log table
-- Stores all incoming webhook events from all providers
-- ============================================================================
CREATE TABLE IF NOT EXISTS events_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Provider identification
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,

    -- Payload storage
    payload JSONB NOT NULL,
    headers JSONB,
    raw_body TEXT,

    -- Processing metadata
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    -- Deduplication
    dedupe_hash VARCHAR(64) NOT NULL UNIQUE,

    -- Verification
    signature_valid BOOLEAN DEFAULT FALSE,

    -- Processing status
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'retrying')),

    -- Error tracking
    error_message TEXT,
    error_count INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Retry queue for failed events
-- Events that fail processing are moved here for retry
-- ============================================================================
CREATE TABLE IF NOT EXISTS retries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events_log(id) ON DELETE CASCADE,

    -- Retry scheduling
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMPTZ NOT NULL,

    -- Backoff tracking
    last_error TEXT,
    last_attempt_at TIMESTAMPTZ,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'exhausted')),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Dead letter queue for events that exhaust retries
-- Manual review required for these events
-- ============================================================================
CREATE TABLE IF NOT EXISTS dlq (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events_log(id) ON DELETE CASCADE,

    -- Original event data (denormalized for easy access)
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,

    -- Failure details
    final_error TEXT,
    total_attempts INTEGER NOT NULL,

    -- Manual review
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(100),
    resolution TEXT,
    resolution_status VARCHAR(20) CHECK (resolution_status IN ('pending', 'resolved', 'ignored', 'reprocessed')),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- AI messages table
-- Stores AI-related webhook events and responses
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events_log(id) ON DELETE SET NULL,

    -- Message content
    provider VARCHAR(50) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,

    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    response JSONB,

    -- Tokens/costs tracking
    tokens_input INTEGER,
    tokens_output INTEGER,
    cost_usd DECIMAL(10, 6),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Provider configuration table
-- Stores provider-specific settings and secrets metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS provider_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL UNIQUE,

    -- Configuration
    enabled BOOLEAN DEFAULT TRUE,
    webhook_url TEXT,
    signature_header VARCHAR(100),
    signature_algorithm VARCHAR(50),

    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 1000,

    -- Metadata
    description TEXT,
    documentation_url TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================

-- Events log indexes
CREATE INDEX IF NOT EXISTS idx_events_log_provider ON events_log(provider);
CREATE INDEX IF NOT EXISTS idx_events_log_event_type ON events_log(event_type);
CREATE INDEX IF NOT EXISTS idx_events_log_received_at ON events_log(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_log_status ON events_log(status);
CREATE INDEX IF NOT EXISTS idx_events_log_dedupe_hash ON events_log(dedupe_hash);
CREATE INDEX IF NOT EXISTS idx_events_log_provider_received ON events_log(provider, received_at DESC);

-- Retry queue indexes
CREATE INDEX IF NOT EXISTS idx_retries_next_retry ON retries(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_retries_event_id ON retries(event_id);
CREATE INDEX IF NOT EXISTS idx_retries_status ON retries(status);

-- DLQ indexes
CREATE INDEX IF NOT EXISTS idx_dlq_provider ON dlq(provider);
CREATE INDEX IF NOT EXISTS idx_dlq_created_at ON dlq(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dlq_resolution_status ON dlq(resolution_status);

-- AI messages indexes
CREATE INDEX IF NOT EXISTS idx_ai_messages_provider ON ai_messages(provider);
CREATE INDEX IF NOT EXISTS idx_ai_messages_processed ON ai_messages(processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at DESC);

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_log_updated_at
    BEFORE UPDATE ON events_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retries_updated_at
    BEFORE UPDATE ON retries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dlq_updated_at
    BEFORE UPDATE ON dlq
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_messages_updated_at
    BEFORE UPDATE ON ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_config_updated_at
    BEFORE UPDATE ON provider_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed provider configurations
-- ============================================================================

INSERT INTO provider_config (provider, signature_header, signature_algorithm, description, documentation_url)
VALUES
    ('razorpay', 'x-razorpay-signature', 'HMAC-SHA256', 'Razorpay payment webhooks', 'https://razorpay.com/docs/webhooks/'),
    ('stripe', 'stripe-signature', 'HMAC-SHA256', 'Stripe payment webhooks', 'https://stripe.com/docs/webhooks'),
    ('github', 'x-hub-signature-256', 'HMAC-SHA256', 'GitHub repository webhooks', 'https://docs.github.com/webhooks'),
    ('vercel', 'x-vercel-signature', 'HMAC-SHA1', 'Vercel deployment webhooks', 'https://vercel.com/docs/webhooks'),
    ('todoist', NULL, NULL, 'Todoist task webhooks', 'https://developer.todoist.com/sync/v9/#webhooks'),
    ('notion', NULL, NULL, 'Notion database webhooks', 'https://developers.notion.com/docs/webhooks'),
    ('ai_relay', 'x-ai-relay-signature', 'HMAC-SHA256', 'Internal AI relay messages', NULL)
ON CONFLICT (provider) DO NOTHING;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE events_log IS 'Main storage for all incoming webhook events';
COMMENT ON TABLE retries IS 'Queue for events that need to be retried';
COMMENT ON TABLE dlq IS 'Dead letter queue for events that exhausted all retries';
COMMENT ON TABLE ai_messages IS 'AI-specific messages for processing';
COMMENT ON TABLE provider_config IS 'Configuration for each webhook provider';

COMMENT ON COLUMN events_log.dedupe_hash IS 'SHA256 hash of provider + raw_body for deduplication';
COMMENT ON COLUMN events_log.signature_valid IS 'Whether the webhook signature was verified successfully';
COMMENT ON COLUMN retries.next_retry_at IS 'When to attempt the next retry (exponential backoff)';
COMMENT ON COLUMN dlq.resolution_status IS 'Manual resolution status for dead-lettered events';
