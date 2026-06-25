-- Migration: 043_reality_drift_detection.sql
-- Description: Reality Drift Detection for Model-Reality Divergence
-- Created: 2026-02-08
-- Part of: Cognitive Brain Specification
--
-- CONSTITUTIONAL COMPLIANCE:
--   Clause 1 (Temporal Truth): Beliefs are time-indexed with valid_from
--   Clause 3 (Reversible Readiness): Adjustments can undo themselves
--   Clause 4 (Decision Replay): Full state reconstruction possible
--   See: docs/CANONICAL_OS_LAYER_MODEL.md

-- =============================================================================
-- MODEL BELIEFS: What the system believes is true at any point
-- =============================================================================
CREATE TABLE IF NOT EXISTS model_beliefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- What we believe
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    
    -- Belief value (Clause 1: time-indexed)
    believed_value JSONB NOT NULL,
    believed_type VARCHAR(30) CHECK (believed_type IN (
        'point', 'range', 'categorical', 'probability'
    )),
    
    -- Confidence in belief
    confidence DECIMAL(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    evidence_quality VARCHAR(20) CHECK (evidence_quality IN (
        'strong', 'moderate', 'weak', 'inferred'
    )),
    
    -- Source tracking (Clause 2: Source Trust Physics)
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(255),
    source_reliability_at_creation DECIMAL(4,3),
    
    -- Temporal validity (Clause 1)
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Lineage
    supersedes_belief_id UUID REFERENCES model_beliefs(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_model_beliefs_tenant ON model_beliefs(tenant_id);
CREATE INDEX idx_model_beliefs_entity ON model_beliefs(entity_type, entity_id);
CREATE INDEX idx_model_beliefs_active ON model_beliefs(valid_until) WHERE valid_until IS NULL;
CREATE INDEX idx_model_beliefs_temporal ON model_beliefs(valid_from, valid_until);

-- =============================================================================
-- REALITY OBSERVATIONS: What we observe from the real world
-- =============================================================================
CREATE TABLE IF NOT EXISTS reality_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- What we observed
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    observed_value JSONB NOT NULL,
    
    -- Observation metadata
    observation_source VARCHAR(100) NOT NULL, -- 'api_sync', 'manual_update', 'signal'
    observation_timestamp TIMESTAMPTZ DEFAULT NOW(),
    observation_confidence DECIMAL(4,3) DEFAULT 1.0,
    
    -- Processing status
    processed BOOLEAN DEFAULT FALSE,
    drift_detected BOOLEAN,
    drift_event_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reality_observations_tenant ON reality_observations(tenant_id);
CREATE INDEX idx_reality_observations_entity ON reality_observations(entity_type, entity_id);
CREATE INDEX idx_reality_observations_unprocessed ON reality_observations(processed) WHERE processed = FALSE;

-- =============================================================================
-- DRIFT EVENTS: When reality diverges from model
-- =============================================================================
CREATE TABLE IF NOT EXISTS drift_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- What drifted
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    
    -- The divergence
    model_belief_id UUID REFERENCES model_beliefs(id),
    believed_value JSONB NOT NULL,
    observed_value JSONB NOT NULL,
    
    -- Drift measurement
    drift_magnitude DECIMAL(8,4) NOT NULL,
    drift_type VARCHAR(30) CHECK (drift_type IN (
        'value_change', 'sudden_shift', 'gradual_drift',
        'missing_data', 'conflict', 'unexpected_pattern'
    )),
    
    -- Impact assessment
    severity VARCHAR(20) CHECK (severity IN (
        'critical', 'high', 'medium', 'low'
    )),
    affected_decisions JSONB DEFAULT '[]',
    affected_predictions JSONB DEFAULT '[]',
    
    -- Response action (Clause 3: Reversible Readiness)
    response_action VARCHAR(30) CHECK (response_action IN (
        'update_belief', 'flag_for_review', 'trigger_recalc',
        'pause_automations', 'revert_adjustment', 'no_action'
    )),
    response_status VARCHAR(20) DEFAULT 'pending' CHECK (response_status IN (
        'pending', 'in_progress', 'resolved', 'ignored'
    )),
    
    -- Resolution tracking
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,
    
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drift_events_tenant ON drift_events(tenant_id);
CREATE INDEX idx_drift_events_entity ON drift_events(entity_type, entity_id);
CREATE INDEX idx_drift_events_severity ON drift_events(severity);
CREATE INDEX idx_drift_events_unresolved ON drift_events(response_status) 
    WHERE response_status IN ('pending', 'in_progress');
CREATE INDEX idx_drift_events_detected ON drift_events(detected_at DESC);

-- =============================================================================
-- DRIFT DETECTION RULES: Configurable thresholds per domain
-- =============================================================================
CREATE TABLE IF NOT EXISTS drift_detection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- NULL = global default
    
    -- Rule targeting
    rule_name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    attribute_pattern VARCHAR(200), -- Regex for attribute matching
    
    -- Detection thresholds
    numeric_threshold DECIMAL(8,4), -- For numeric values
    percentage_threshold DECIMAL(5,2), -- For relative changes
    categorical_change BOOLEAN DEFAULT TRUE, -- Any change triggers drift
    
    -- Timing
    min_age_hours INTEGER DEFAULT 1, -- Don't detect drift on very recent beliefs
    max_detection_frequency_hours INTEGER DEFAULT 24, -- Avoid spam
    
    -- Response configuration
    severity_level VARCHAR(20) DEFAULT 'medium',
    auto_response VARCHAR(30) DEFAULT 'flag_for_review',
    
    -- Rule status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'paused', 'deprecated'
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drift_rules_entity ON drift_detection_rules(entity_type);
CREATE INDEX idx_drift_rules_status ON drift_detection_rules(status);

-- =============================================================================
-- READINESS ADJUSTMENTS: Track all adjustments for reversibility (Clause 3)
-- =============================================================================
CREATE TABLE IF NOT EXISTS readiness_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- What was adjusted
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL, -- 'readiness_score', 'trust_level', 'autonomy_limit'
    
    -- State change (Clause 3: full reversibility)
    previous_value JSONB NOT NULL,
    new_value JSONB NOT NULL,
    
    -- Cause
    trigger_type VARCHAR(30) CHECK (trigger_type IN (
        'drift_event', 'manual', 'signal', 'scheduled', 'cascading'
    )),
    trigger_id UUID, -- Reference to triggering event
    
    -- Reversibility
    is_reversible BOOLEAN DEFAULT TRUE,
    reversed_at TIMESTAMPTZ,
    reversed_by_adjustment_id UUID REFERENCES readiness_adjustments(id),
    reversal_reason TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'reversed', 'superseded'
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

CREATE INDEX idx_readiness_adjustments_tenant ON readiness_adjustments(tenant_id);
CREATE INDEX idx_readiness_adjustments_entity ON readiness_adjustments(entity_type, entity_id);
CREATE INDEX idx_readiness_adjustments_trigger ON readiness_adjustments(trigger_type, trigger_id);
CREATE INDEX idx_readiness_adjustments_reversible ON readiness_adjustments(is_reversible, status)
    WHERE is_reversible = TRUE AND status = 'active';

-- =============================================================================
-- FUNCTION: Detect drift for a specific entity
-- =============================================================================
CREATE OR REPLACE FUNCTION detect_entity_drift(
    p_tenant_id UUID,
    p_entity_type VARCHAR,
    p_entity_id UUID
) RETURNS TABLE (
    drift_event_id UUID,
    attribute_name VARCHAR,
    believed_value JSONB,
    observed_value JSONB,
    drift_magnitude DECIMAL,
    severity VARCHAR,
    response_action VARCHAR
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH current_beliefs AS (
        SELECT mb.id, mb.attribute_name, mb.believed_value, mb.confidence
        FROM model_beliefs mb
        WHERE mb.tenant_id = p_tenant_id
          AND mb.entity_type = p_entity_type
          AND mb.entity_id = p_entity_id
          AND mb.valid_until IS NULL
    ),
    latest_observations AS (
        SELECT DISTINCT ON (ro.attribute_name)
            ro.id, ro.attribute_name, ro.observed_value
        FROM reality_observations ro
        WHERE ro.tenant_id = p_tenant_id
          AND ro.entity_type = p_entity_type
          AND ro.entity_id = p_entity_id
          AND ro.processed = FALSE
        ORDER BY ro.attribute_name, ro.observation_timestamp DESC
    ),
    drift_candidates AS (
        SELECT 
            cb.id AS belief_id,
            cb.attribute_name,
            cb.believed_value,
            lo.observed_value,
            lo.id AS observation_id,
            -- Calculate drift magnitude
            CASE 
                WHEN cb.believed_value = lo.observed_value THEN 0
                WHEN jsonb_typeof(cb.believed_value) = 'number' 
                     AND jsonb_typeof(lo.observed_value) = 'number' THEN
                    ABS((cb.believed_value::TEXT)::DECIMAL - (lo.observed_value::TEXT)::DECIMAL) /
                    GREATEST(ABS((cb.believed_value::TEXT)::DECIMAL), 1)
                ELSE 1.0 -- Categorical changes get full drift magnitude
            END AS calc_magnitude
        FROM current_beliefs cb
        JOIN latest_observations lo ON cb.attribute_name = lo.attribute_name
        WHERE cb.believed_value IS DISTINCT FROM lo.observed_value
    )
    INSERT INTO drift_events (
        tenant_id, entity_type, entity_id, attribute_name,
        model_belief_id, believed_value, observed_value,
        drift_magnitude, drift_type, severity, response_action
    )
    SELECT 
        p_tenant_id,
        p_entity_type,
        p_entity_id,
        dc.attribute_name,
        dc.belief_id,
        dc.believed_value,
        dc.observed_value,
        dc.calc_magnitude,
        CASE 
            WHEN dc.calc_magnitude > 0.5 THEN 'sudden_shift'
            ELSE 'gradual_drift'
        END,
        CASE 
            WHEN dc.calc_magnitude > 0.8 THEN 'critical'
            WHEN dc.calc_magnitude > 0.5 THEN 'high'
            WHEN dc.calc_magnitude > 0.2 THEN 'medium'
            ELSE 'low'
        END,
        CASE 
            WHEN dc.calc_magnitude > 0.5 THEN 'pause_automations'
            ELSE 'update_belief'
        END
    FROM drift_candidates dc
    WHERE dc.calc_magnitude > 0.1 -- Only create event for meaningful drift
    RETURNING 
        drift_events.id,
        drift_events.attribute_name::VARCHAR,
        drift_events.believed_value,
        drift_events.observed_value,
        drift_events.drift_magnitude,
        drift_events.severity::VARCHAR,
        drift_events.response_action::VARCHAR;
END;
$$;

-- =============================================================================
-- FUNCTION: Revert an adjustment (Clause 3: Reversible Readiness)
-- =============================================================================
CREATE OR REPLACE FUNCTION revert_adjustment(
    p_adjustment_id UUID,
    p_reason TEXT DEFAULT 'Manual reversal'
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
    v_original RECORD;
    v_new_adjustment_id UUID;
BEGIN
    -- Get original adjustment
    SELECT * INTO v_original
    FROM readiness_adjustments
    WHERE id = p_adjustment_id
      AND is_reversible = TRUE
      AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Adjustment not found or not reversible';
    END IF;
    
    -- Create reversal adjustment
    INSERT INTO readiness_adjustments (
        tenant_id, entity_type, entity_id, adjustment_type,
        previous_value, new_value,
        trigger_type, trigger_id,
        is_reversible, reversed_by_adjustment_id
    ) VALUES (
        v_original.tenant_id, v_original.entity_type, v_original.entity_id,
        v_original.adjustment_type,
        v_original.new_value, v_original.previous_value, -- Swap values
        'manual', p_adjustment_id,
        TRUE, NULL
    ) RETURNING id INTO v_new_adjustment_id;
    
    -- Mark original as reversed
    UPDATE readiness_adjustments
    SET status = 'reversed',
        reversed_at = NOW(),
        reversed_by_adjustment_id = v_new_adjustment_id,
        reversal_reason = p_reason
    WHERE id = p_adjustment_id;
    
    RETURN v_new_adjustment_id;
END;
$$;

-- =============================================================================
-- VIEW: Drift Dashboard
-- =============================================================================
CREATE OR REPLACE VIEW v_drift_dashboard AS
SELECT 
    de.tenant_id,
    de.entity_type,
    COUNT(*) FILTER (WHERE de.response_status = 'pending') AS pending_drifts,
    COUNT(*) FILTER (WHERE de.severity = 'critical') AS critical_drifts,
    COUNT(*) FILTER (WHERE de.severity = 'high') AS high_drifts,
    COUNT(*) FILTER (WHERE de.detected_at > NOW() - INTERVAL '24 hours') AS drifts_last_24h,
    AVG(de.drift_magnitude) AS avg_drift_magnitude,
    MAX(de.detected_at) AS last_drift_detected
FROM drift_events de
WHERE de.detected_at > NOW() - INTERVAL '30 days'
GROUP BY de.tenant_id, de.entity_type;

-- =============================================================================
-- VIEW: Active Beliefs with Confidence
-- =============================================================================
CREATE OR REPLACE VIEW v_active_beliefs AS
SELECT 
    mb.tenant_id,
    mb.entity_type,
    mb.entity_id,
    mb.attribute_name,
    mb.believed_value,
    mb.confidence,
    mb.evidence_quality,
    mb.source_type,
    mb.valid_from,
    EXTRACT(EPOCH FROM (NOW() - mb.valid_from)) / 3600 AS belief_age_hours
FROM model_beliefs mb
WHERE mb.valid_until IS NULL;

-- =============================================================================
-- RLS Policies
-- =============================================================================
ALTER TABLE model_beliefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY model_beliefs_tenant_isolation ON model_beliefs
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY reality_observations_tenant_isolation ON reality_observations
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY drift_events_tenant_isolation ON drift_events
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY drift_rules_tenant_isolation ON drift_detection_rules
    FOR ALL USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY readiness_adjustments_tenant_isolation ON readiness_adjustments
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
