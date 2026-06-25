-- Migration: 042_simulation_engine.sql
-- Description: Simulation Engine for Outcome Prediction
-- Created: 2026-02-08
-- Part of: Cognitive Brain Specification
--
-- CONSTITUTIONAL COMPLIANCE:
--   Clause 1 (Temporal Truth): Simulations use time-indexed historical data
--   Clause 4 (Decision Replay): Simulations can be replayed with same inputs
--   See: docs/CANONICAL_OS_LAYER_MODEL.md

-- =============================================================================
-- SIMULATION REQUESTS: Track simulation runs
-- =============================================================================
CREATE TABLE IF NOT EXISTS simulation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- What we're simulating
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_params JSONB,
    
    -- Context snapshot (Clause 1: time-indexed)
    context_snapshot JSONB NOT NULL DEFAULT '{}',
    context_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signals_snapshot JSONB NOT NULL DEFAULT '[]',
    
    -- Simulation config
    simulation_type VARCHAR(30) NOT NULL CHECK (simulation_type IN (
        'quick', 'standard', 'deep'
    )),
    monte_carlo_runs INTEGER DEFAULT 100,
    time_horizon_days INTEGER DEFAULT 30,
    
    -- Results
    primary_prediction JSONB,
    alternative_scenarios JSONB DEFAULT '[]',
    historical_matches JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed'
    )),
    computation_time_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_simulation_requests_tenant ON simulation_requests(tenant_id);
CREATE INDEX idx_simulation_requests_entity ON simulation_requests(entity_type, entity_id);
CREATE INDEX idx_simulation_requests_status ON simulation_requests(status);
CREATE INDEX idx_simulation_requests_created ON simulation_requests(created_at DESC);

-- =============================================================================
-- OUTCOME PREDICTIONS: Structured prediction results
-- =============================================================================
CREATE TABLE IF NOT EXISTS outcome_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID NOT NULL REFERENCES simulation_requests(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Prediction type
    scenario_name VARCHAR(100) NOT NULL, -- 'primary', 'wait_7d', 'alternative_action', 'no_action'
    scenario_params JSONB,
    
    -- Core predictions
    win_probability DECIMAL(4,3) CHECK (win_probability BETWEEN 0 AND 1),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    confidence DECIMAL(4,3) CHECK (confidence BETWEEN 0 AND 1),
    
    -- Value predictions
    expected_value DECIMAL(15,2),
    downside_risk DECIMAL(15,2),
    upside_potential DECIMAL(15,2),
    confidence_interval_low DECIMAL(4,3),
    confidence_interval_high DECIMAL(4,3),
    
    -- Distribution data
    outcome_distribution JSONB DEFAULT '[]', -- [{outcome: 'win', probability: 0.62}, ...]
    key_factors JSONB DEFAULT '[]', -- [{factor: 'stakeholder_engaged', impact: 0.3}, ...]
    risk_factors JSONB DEFAULT '[]',
    
    -- Timing recommendations
    optimal_timing VARCHAR(50),
    timing_sensitivity DECIMAL(3,2), -- How much timing matters
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outcome_predictions_simulation ON outcome_predictions(simulation_id);
CREATE INDEX idx_outcome_predictions_tenant ON outcome_predictions(tenant_id);

-- =============================================================================
-- SIMULATION MODELS: Configurable prediction models per domain
-- =============================================================================
CREATE TABLE IF NOT EXISTS simulation_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- NULL = global default
    
    -- Model identity
    model_name VARCHAR(100) NOT NULL,
    domain VARCHAR(50) NOT NULL, -- 'renewal', 'expansion', 'churn', 'support'
    entity_type VARCHAR(50) NOT NULL,
    
    -- Model configuration
    input_signals JSONB NOT NULL DEFAULT '[]', -- Which signals matter
    signal_weights JSONB NOT NULL DEFAULT '{}', -- How much each signal matters
    baseline_probability DECIMAL(4,3) DEFAULT 0.5,
    
    -- Historical calibration (Clause 1: time-indexed learning)
    historical_accuracy DECIMAL(4,3),
    calibration_sample_size INTEGER DEFAULT 0,
    last_calibrated_at TIMESTAMPTZ,
    calibration_data_start TIMESTAMPTZ, -- Temporal range used
    calibration_data_end TIMESTAMPTZ,
    
    -- Model lifecycle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'draft', 'active', 'deprecated'
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_simulation_models_domain ON simulation_models(domain, entity_type);
CREATE INDEX idx_simulation_models_status ON simulation_models(status);

-- =============================================================================
-- SIMULATION ACCURACY LOG: Track prediction accuracy for model improvement
-- =============================================================================
CREATE TABLE IF NOT EXISTS simulation_accuracy_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Simulation reference
    simulation_id UUID NOT NULL REFERENCES simulation_requests(id),
    prediction_id UUID NOT NULL REFERENCES outcome_predictions(id),
    
    -- What was predicted
    predicted_outcome VARCHAR(100) NOT NULL,
    predicted_probability DECIMAL(4,3) NOT NULL,
    predicted_value DECIMAL(15,2),
    
    -- What actually happened
    actual_outcome VARCHAR(100),
    actual_value DECIMAL(15,2),
    
    -- Accuracy assessment
    was_accurate BOOLEAN,
    accuracy_delta DECIMAL(10,4), -- Difference between predicted and actual
    
    -- Timing
    prediction_made_at TIMESTAMPTZ NOT NULL,
    outcome_observed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_simulation_accuracy_tenant ON simulation_accuracy_log(tenant_id);
CREATE INDEX idx_simulation_accuracy_simulation ON simulation_accuracy_log(simulation_id);

-- =============================================================================
-- FUNCTION: Quick simulation with historical pattern matching
-- =============================================================================
CREATE OR REPLACE FUNCTION run_quick_simulation(
    p_tenant_id UUID,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_action_type VARCHAR,
    p_action_params JSONB DEFAULT '{}'
) RETURNS TABLE (
    simulation_id UUID,
    win_probability DECIMAL,
    risk_level VARCHAR,
    confidence DECIMAL,
    expected_value DECIMAL,
    key_factors JSONB,
    historical_match_count INTEGER,
    recommendation TEXT
) LANGUAGE plpgsql AS $$
DECLARE
    v_simulation_id UUID;
    v_historical_success_rate DECIMAL := 0.5;
    v_signal_boost DECIMAL := 0;
    v_completeness_factor DECIMAL := 0.5;
    v_source_reliability DECIMAL := 0.5;
    v_win_prob DECIMAL;
    v_confidence DECIMAL;
    v_match_count INTEGER := 0;
BEGIN
    -- Create simulation record
    INSERT INTO simulation_requests (
        tenant_id, entity_type, entity_id, action_type, action_params,
        simulation_type, monte_carlo_runs, status, context_timestamp
    ) VALUES (
        p_tenant_id, p_entity_type, p_entity_id, p_action_type, p_action_params,
        'quick', 100, 'running', NOW()
    ) RETURNING id INTO v_simulation_id;
    
    -- Get historical success rate from decision_memory (Clause 1: time-indexed)
    SELECT 
        COUNT(*),
        COALESCE(
            AVG(CASE WHEN dm.was_correct = 'correct' THEN 1 
                     WHEN dm.was_correct = 'partial' THEN 0.5 
                     ELSE 0 END),
            0.5
        )
    INTO v_match_count, v_historical_success_rate
    FROM decision_memory dm
    WHERE dm.tenant_id = p_tenant_id
      AND dm.entity_type = p_entity_type
      AND dm.action_type = p_action_type
      AND dm.was_correct IS NOT NULL;
    
    -- Get entity completeness
    SELECT COALESCE(sec.completeness_score::DECIMAL / 100, 0.5)
    INTO v_completeness_factor
    FROM spine_entity_completeness sec
    WHERE sec.entity_id = p_entity_id;
    
    -- Get source reliability average (Clause 2)
    SELECT COALESCE(AVG(sr.reliability_score), 0.5)
    INTO v_source_reliability
    FROM source_reliability sr
    WHERE sr.tenant_id = p_tenant_id
      AND sr.status = 'active';
    
    -- Calculate win probability (weighted model)
    v_win_prob := (v_historical_success_rate * 0.40) + 
                  (v_completeness_factor * 0.25) + 
                  (v_source_reliability * 0.25) + 
                  0.10;
    v_win_prob := GREATEST(0.1, LEAST(0.95, v_win_prob)); -- Clamp to reasonable range
    
    -- Calculate confidence based on sample size
    v_confidence := LEAST(v_match_count::DECIMAL / 20, 1.0);
    IF v_confidence < 0.3 THEN
        v_confidence := 0.3; -- Minimum confidence floor
    END IF;
    
    -- Store prediction
    INSERT INTO outcome_predictions (
        simulation_id, tenant_id, scenario_name,
        win_probability, risk_level, confidence,
        key_factors
    ) VALUES (
        v_simulation_id, p_tenant_id, 'primary',
        v_win_prob,
        CASE 
            WHEN v_win_prob > 0.7 THEN 'low'
            WHEN v_win_prob > 0.5 THEN 'medium'
            WHEN v_win_prob > 0.3 THEN 'high'
            ELSE 'critical'
        END,
        v_confidence,
        jsonb_build_array(
            jsonb_build_object('factor', 'historical_success_rate', 'value', v_historical_success_rate, 'weight', 0.40),
            jsonb_build_object('factor', 'data_completeness', 'value', v_completeness_factor, 'weight', 0.25),
            jsonb_build_object('factor', 'source_reliability', 'value', v_source_reliability, 'weight', 0.25)
        )
    );
    
    -- Mark simulation complete
    UPDATE simulation_requests 
    SET status = 'completed', completed_at = NOW()
    WHERE id = v_simulation_id;
    
    -- Return results
    RETURN QUERY
    SELECT 
        v_simulation_id,
        v_win_prob,
        CASE 
            WHEN v_win_prob > 0.7 THEN 'low'::VARCHAR
            WHEN v_win_prob > 0.5 THEN 'medium'::VARCHAR
            WHEN v_win_prob > 0.3 THEN 'high'::VARCHAR
            ELSE 'critical'::VARCHAR
        END,
        v_confidence,
        (v_win_prob * 10000)::DECIMAL, -- Placeholder expected value
        jsonb_build_array(
            jsonb_build_object('factor', 'historical_success_rate', 'value', v_historical_success_rate),
            jsonb_build_object('factor', 'data_completeness', 'value', v_completeness_factor),
            jsonb_build_object('factor', 'source_reliability', 'value', v_source_reliability)
        ),
        v_match_count,
        CASE
            WHEN v_win_prob > 0.7 AND v_confidence > 0.7 THEN 'Strong recommendation: proceed'
            WHEN v_win_prob > 0.5 THEN 'Moderate confidence: consider proceeding'
            WHEN v_win_prob > 0.3 THEN 'Caution: gather more context before acting'
            ELSE 'High risk: recommend alternative approach'
        END::TEXT;
END;
$$;

-- =============================================================================
-- RLS Policies
-- =============================================================================
ALTER TABLE simulation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_accuracy_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY simulation_requests_tenant_isolation ON simulation_requests
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY outcome_predictions_tenant_isolation ON outcome_predictions
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY simulation_models_tenant_isolation ON simulation_models
    FOR ALL USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY simulation_accuracy_tenant_isolation ON simulation_accuracy_log
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
