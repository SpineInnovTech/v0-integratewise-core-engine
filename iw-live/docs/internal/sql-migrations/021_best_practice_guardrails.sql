-- Migration: 021_best_practice_guardrails.sql
-- Description: Add best-practice guardrails - correlation_id, idempotency, missing-plane markers
-- Created: 2026-01-29
-- Reference: Best Practice document

-- =============================================================================
-- GUARDRAIL 1: CORRELATION ID EVERYWHERE
-- Critical for end-to-end debugging and tracing
-- =============================================================================

-- Add correlation_id to situations (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'situations' AND column_name = 'correlation_id') THEN
        ALTER TABLE situations ADD COLUMN correlation_id UUID;
        CREATE INDEX idx_situations_correlation ON situations(correlation_id);
    END IF;
END $$;

-- Add correlation_id to actions/proposed_actions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'actions' AND column_name = 'correlation_id') THEN
        ALTER TABLE actions ADD COLUMN correlation_id UUID;
        CREATE INDEX idx_actions_correlation ON actions(correlation_id);
    END IF;
END $$;

-- Add correlation_id to action_runs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'action_runs' AND column_name = 'correlation_id') THEN
        ALTER TABLE action_runs ADD COLUMN correlation_id UUID;
        CREATE INDEX idx_action_runs_correlation ON action_runs(correlation_id);
    END IF;
END $$;

-- Add correlation_id to governance_audit_log
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'governance_audit_log' AND column_name = 'correlation_id') THEN
        ALTER TABLE governance_audit_log ADD COLUMN correlation_id UUID;
        CREATE INDEX idx_governance_audit_correlation ON governance_audit_log(correlation_id);
    END IF;
END $$;

-- Add correlation_id to events (ingress point)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'correlation_id') THEN
        ALTER TABLE events ADD COLUMN correlation_id UUID;
        CREATE INDEX idx_events_correlation ON events(correlation_id);
    END IF;
END $$;

-- Add correlation_id to signals
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'signals' AND column_name = 'correlation_id') THEN
        ALTER TABLE signals ADD COLUMN correlation_id UUID;
        CREATE INDEX idx_signals_correlation ON signals(correlation_id);
    END IF;
END $$;

-- =============================================================================
-- GUARDRAIL 2: IDEMPOTENCY KEYS - Strengthen canonical writes
-- =============================================================================

-- Create idempotency tracking table
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    idempotency_key VARCHAR(500) NOT NULL, -- source:external_id:tenant_id
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    first_processed_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    process_count INT DEFAULT 1,
    UNIQUE(tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup 
ON idempotency_keys(tenant_id, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_entity 
ON idempotency_keys(entity_type, entity_id);

-- Function to check/register idempotency
CREATE OR REPLACE FUNCTION check_idempotency(
    p_tenant_id UUID,
    p_idempotency_key VARCHAR(500),
    p_entity_type VARCHAR(50)
) RETURNS TABLE(is_duplicate BOOLEAN, existing_entity_id UUID) AS $$
DECLARE
    v_existing RECORD;
BEGIN
    -- Check if key exists
    SELECT entity_id INTO v_existing FROM idempotency_keys 
    WHERE tenant_id = p_tenant_id AND idempotency_key = p_idempotency_key;
    
    IF FOUND THEN
        -- Update last seen and count
        UPDATE idempotency_keys 
        SET last_seen_at = NOW(), process_count = process_count + 1
        WHERE tenant_id = p_tenant_id AND idempotency_key = p_idempotency_key;
        
        RETURN QUERY SELECT TRUE, v_existing.entity_id;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GUARDRAIL 3: MISSING-PLANE EVIDENCE MARKERS
-- When a plane has no data, write a marker for UI consistency
-- =============================================================================

-- Add is_missing_plane_marker column to evidence_refs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'evidence_refs' AND column_name = 'is_missing_marker') THEN
        ALTER TABLE evidence_refs ADD COLUMN is_missing_marker BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add plane_status column to track completeness
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'situations' AND column_name = 'plane_status') THEN
        ALTER TABLE situations ADD COLUMN plane_status JSONB DEFAULT '{"A": "unknown", "B": "unknown", "C": "unknown"}'::jsonb;
    END IF;
END $$;

-- =============================================================================
-- VIEWS FOR DEBUGGING AND OBSERVABILITY
-- =============================================================================

-- Correlation trace view: Follow an event through the entire system
CREATE OR REPLACE VIEW v_correlation_trace AS
SELECT 
    correlation_id,
    'event' as stage,
    id as record_id,
    created_at as occurred_at,
    event_type as detail,
    tenant_id
FROM events WHERE correlation_id IS NOT NULL
UNION ALL
SELECT 
    correlation_id,
    'signal' as stage,
    id as record_id,
    computed_at as occurred_at,
    signal_key as detail,
    tenant_id
FROM signals WHERE correlation_id IS NOT NULL
UNION ALL
SELECT 
    correlation_id,
    'situation' as stage,
    id as record_id,
    created_at as occurred_at,
    situation_key as detail,
    tenant_id
FROM situations WHERE correlation_id IS NOT NULL
UNION ALL
SELECT 
    correlation_id,
    'action' as stage,
    id as record_id,
    created_at as occurred_at,
    action_type as detail,
    tenant_id
FROM actions WHERE correlation_id IS NOT NULL
UNION ALL
SELECT 
    correlation_id,
    'action_run' as stage,
    id as record_id,
    started_at as occurred_at,
    status as detail,
    tenant_id
FROM action_runs WHERE correlation_id IS NOT NULL
UNION ALL
SELECT 
    correlation_id,
    'audit' as stage,
    id as record_id,
    decided_at as occurred_at,
    decision_type as detail,
    tenant_id
FROM governance_audit_log WHERE correlation_id IS NOT NULL
ORDER BY correlation_id, occurred_at;

-- Idempotency status view
CREATE OR REPLACE VIEW v_idempotency_status AS
SELECT 
    tenant_id,
    entity_type,
    COUNT(*) as total_keys,
    SUM(CASE WHEN process_count > 1 THEN 1 ELSE 0 END) as duplicates_detected,
    MAX(last_seen_at) as last_activity
FROM idempotency_keys
GROUP BY tenant_id, entity_type;

COMMENT ON TABLE idempotency_keys IS 'Tracks idempotency keys to prevent duplicate canonical writes';
COMMENT ON VIEW v_correlation_trace IS 'Debug view: traces a correlation_id through all system stages';
COMMENT ON VIEW v_idempotency_status IS 'Observability view: idempotency key statistics per tenant/entity';
