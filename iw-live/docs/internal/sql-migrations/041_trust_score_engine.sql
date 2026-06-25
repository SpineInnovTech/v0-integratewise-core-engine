-- Migration: 041_trust_score_engine.sql
-- Description: Organizational Trust Score Engine for Autonomy Control
-- Created: 2026-02-08
-- Part of: Cognitive Brain Specification
--
-- CONSTITUTIONAL COMPLIANCE:
--   Clause 2 (Source Trust Physics): Source reliability tracking
--   Clause 3 (Reversible Readiness): Trust degradation triggers capability regression
--   Clause 5 (Autonomy Kill Hierarchy): Override levels implemented
--   See: docs/CANONICAL_OS_LAYER_MODEL.md

-- =============================================================================
-- SIGNAL ACCURACY LOG: Track signal correctness over time
-- Source Trust Physics: Not all observations are equal
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_accuracy_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Signal reference
    signal_id UUID NOT NULL,
    signal_type VARCHAR(100) NOT NULL,
    signal_key VARCHAR(100) NOT NULL,
    signal_strength DECIMAL(4,3),
    
    -- Entity context
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Accuracy evaluation
    was_accurate VARCHAR(20) NOT NULL CHECK (was_accurate IN (
        'accurate', 'inaccurate', 'early', 'late', 'noise', 'pending'
    )),
    accuracy_notes TEXT,
    
    -- Timing (Clause 1: Temporal Truth)
    signal_generated_at TIMESTAMPTZ NOT NULL,
    outcome_observed_at TIMESTAMPTZ,
    evaluation_delay_days INTEGER,
    
    -- Evaluator
    evaluated_by VARCHAR(30), -- 'system', 'human', 'outcome_tracker'
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signal_accuracy_tenant ON signal_accuracy_log(tenant_id);
CREATE INDEX idx_signal_accuracy_type ON signal_accuracy_log(signal_type, signal_key);
CREATE INDEX idx_signal_accuracy_entity ON signal_accuracy_log(entity_type, entity_id);
CREATE INDEX idx_signal_accuracy_result ON signal_accuracy_log(was_accurate);

-- =============================================================================
-- SOURCE RELIABILITY: Track trust per data source (Clause 2)
-- =============================================================================
CREATE TABLE IF NOT EXISTS source_reliability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Source identity
    source_type VARCHAR(50) NOT NULL, -- 'salesforce', 'zendesk', 'manual', 'api', etc.
    source_id VARCHAR(100), -- Specific connector instance
    
    -- Reliability metrics
    reliability_score DECIMAL(4,3) DEFAULT 0.5 CHECK (reliability_score BETWEEN 0 AND 1),
    observation_count INTEGER DEFAULT 0,
    accurate_count INTEGER DEFAULT 0,
    conflict_count INTEGER DEFAULT 0,
    
    -- Staleness tracking
    last_sync_at TIMESTAMPTZ,
    avg_sync_interval_hours DECIMAL(10,2),
    staleness_penalty DECIMAL(3,2) DEFAULT 0, -- Reduces score over time
    
    -- Conflict resolution
    override_priority INTEGER DEFAULT 50, -- Higher = wins conflicts
    is_authoritative BOOLEAN DEFAULT false, -- Final word on conflicts
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'degraded', 'untrusted', 'disabled'
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, source_type, source_id)
);

CREATE INDEX idx_source_reliability_tenant ON source_reliability(tenant_id);
CREATE INDEX idx_source_reliability_status ON source_reliability(status);

-- =============================================================================
-- TRUST SCORES: Computed trust scores per entity/domain
-- =============================================================================
CREATE TABLE IF NOT EXISTS trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Scope (can be entity-level or domain-level)
    scope_type VARCHAR(30) NOT NULL CHECK (scope_type IN (
        'entity', 'domain', 'action_type', 'department', 'org_wide'
    )),
    scope_entity_type VARCHAR(50),
    scope_entity_id UUID,
    scope_domain VARCHAR(50),
    scope_department VARCHAR(50),
    
    -- Component scores (0.0 to 1.0)
    data_completeness_score DECIMAL(4,3) DEFAULT 0,
    field_stability_score DECIMAL(4,3) DEFAULT 0,
    signal_accuracy_score DECIMAL(4,3) DEFAULT 0,
    decision_outcome_score DECIMAL(4,3) DEFAULT 0,
    policy_sensitivity_score DECIMAL(4,3) DEFAULT 0,
    source_reliability_score DECIMAL(4,3) DEFAULT 0, -- NEW: Clause 2
    
    -- Component weights (customizable per org)
    weight_data_completeness DECIMAL(3,2) DEFAULT 0.20,
    weight_field_stability DECIMAL(3,2) DEFAULT 0.10,
    weight_signal_accuracy DECIMAL(3,2) DEFAULT 0.20,
    weight_decision_outcome DECIMAL(3,2) DEFAULT 0.20,
    weight_policy_sensitivity DECIMAL(3,2) DEFAULT 0.10,
    weight_source_reliability DECIMAL(3,2) DEFAULT 0.20, -- NEW: Clause 2
    
    -- Computed trust score
    trust_score DECIMAL(4,3) GENERATED ALWAYS AS (
        (data_completeness_score * weight_data_completeness) +
        (field_stability_score * weight_field_stability) +
        (signal_accuracy_score * weight_signal_accuracy) +
        (decision_outcome_score * weight_decision_outcome) +
        (policy_sensitivity_score * weight_policy_sensitivity) +
        (source_reliability_score * weight_source_reliability)
    ) STORED,
    
    -- Derived autonomy level
    autonomy_level VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN (
                (data_completeness_score * weight_data_completeness) +
                (field_stability_score * weight_field_stability) +
                (signal_accuracy_score * weight_signal_accuracy) +
                (decision_outcome_score * weight_decision_outcome) +
                (policy_sensitivity_score * weight_policy_sensitivity) +
                (source_reliability_score * weight_source_reliability)
            ) < 0.30 THEN 'manual'
            WHEN (
                (data_completeness_score * weight_data_completeness) +
                (field_stability_score * weight_field_stability) +
                (signal_accuracy_score * weight_signal_accuracy) +
                (decision_outcome_score * weight_decision_outcome) +
                (policy_sensitivity_score * weight_policy_sensitivity) +
                (source_reliability_score * weight_source_reliability)
            ) < 0.50 THEN 'suggestions'
            WHEN (
                (data_completeness_score * weight_data_completeness) +
                (field_stability_score * weight_field_stability) +
                (signal_accuracy_score * weight_signal_accuracy) +
                (decision_outcome_score * weight_decision_outcome) +
                (policy_sensitivity_score * weight_policy_sensitivity) +
                (source_reliability_score * weight_source_reliability)
            ) < 0.70 THEN 'assisted'
            WHEN (
                (data_completeness_score * weight_data_completeness) +
                (field_stability_score * weight_field_stability) +
                (signal_accuracy_score * weight_signal_accuracy) +
                (decision_outcome_score * weight_decision_outcome) +
                (policy_sensitivity_score * weight_policy_sensitivity) +
                (source_reliability_score * weight_source_reliability)
            ) < 0.85 THEN 'supervised'
            ELSE 'autonomous'
        END
    ) STORED,
    
    -- Sample counts (for cold start handling)
    decision_sample_count INTEGER DEFAULT 0,
    signal_sample_count INTEGER DEFAULT 0,
    
    -- Metadata
    last_computed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_trust_scores_scope ON trust_scores(
    tenant_id, scope_type, scope_entity_type, scope_entity_id, scope_domain, scope_department
);
CREATE INDEX idx_trust_scores_tenant ON trust_scores(tenant_id);
CREATE INDEX idx_trust_scores_autonomy ON trust_scores(autonomy_level);

-- =============================================================================
-- AUTONOMY OVERRIDES: Clause 5 - Kill Hierarchy
-- =============================================================================
CREATE TABLE IF NOT EXISTS autonomy_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Override level (Clause 5 hierarchy)
    override_level VARCHAR(20) NOT NULL CHECK (override_level IN (
        'entity', 'domain', 'department', 'org', 'emergency'
    )),
    
    -- Scope (depends on level)
    scope_entity_type VARCHAR(50),
    scope_entity_id UUID,
    scope_domain VARCHAR(50),
    scope_department VARCHAR(50),
    
    -- Override configuration
    override_action VARCHAR(30) NOT NULL CHECK (override_action IN (
        'disable_all', 'manual_only', 'suggestions_only', 'reduce_autonomy'
    )),
    target_autonomy_level VARCHAR(20), -- If reduce_autonomy
    
    -- Context
    reason TEXT NOT NULL,
    duration_hours INTEGER, -- NULL = indefinite
    expires_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    activated_by UUID NOT NULL,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_by UUID,
    deactivated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_autonomy_overrides_tenant ON autonomy_overrides(tenant_id);
CREATE INDEX idx_autonomy_overrides_active ON autonomy_overrides(is_active) WHERE is_active = true;
CREATE INDEX idx_autonomy_overrides_level ON autonomy_overrides(override_level);

-- =============================================================================
-- FUNCTION: Check effective autonomy with override hierarchy (Clause 5)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_effective_autonomy(
    p_tenant_id UUID,
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_domain VARCHAR DEFAULT NULL,
    p_department VARCHAR DEFAULT NULL
) RETURNS TABLE (
    effective_autonomy_level VARCHAR,
    is_overridden BOOLEAN,
    override_reason TEXT,
    override_level VARCHAR
) LANGUAGE plpgsql AS $$
DECLARE
    v_override RECORD;
    v_base_autonomy VARCHAR := 'autonomous';
BEGIN
    -- Get base autonomy from trust scores
    SELECT ts.autonomy_level INTO v_base_autonomy
    FROM trust_scores ts
    WHERE ts.tenant_id = p_tenant_id
      AND (p_entity_id IS NULL OR (ts.scope_entity_id = p_entity_id))
    ORDER BY ts.last_computed_at DESC
    LIMIT 1;
    
    -- Check overrides in hierarchy order (most global first, as they override)
    FOR v_override IN 
        SELECT * FROM autonomy_overrides ao
        WHERE ao.tenant_id = p_tenant_id
          AND ao.is_active = true
          AND (ao.expires_at IS NULL OR ao.expires_at > NOW())
          AND (
            -- Emergency global
            (ao.override_level = 'emergency') OR
            -- Org level
            (ao.override_level = 'org') OR
            -- Department level
            (ao.override_level = 'department' AND ao.scope_department = p_department) OR
            -- Domain level
            (ao.override_level = 'domain' AND ao.scope_domain = p_domain) OR
            -- Entity level
            (ao.override_level = 'entity' AND ao.scope_entity_id = p_entity_id)
          )
        ORDER BY 
          CASE ao.override_level 
            WHEN 'emergency' THEN 1
            WHEN 'org' THEN 2
            WHEN 'department' THEN 3
            WHEN 'domain' THEN 4
            WHEN 'entity' THEN 5
          END
        LIMIT 1
    LOOP
        -- Return overridden result
        RETURN QUERY
        SELECT 
            CASE v_override.override_action
                WHEN 'disable_all' THEN 'disabled'::VARCHAR
                WHEN 'manual_only' THEN 'manual'::VARCHAR
                WHEN 'suggestions_only' THEN 'suggestions'::VARCHAR
                WHEN 'reduce_autonomy' THEN v_override.target_autonomy_level
            END,
            true,
            v_override.reason,
            v_override.override_level;
        RETURN;
    END LOOP;
    
    -- No override found, return base autonomy
    RETURN QUERY
    SELECT 
        COALESCE(v_base_autonomy, 'manual')::VARCHAR,
        false,
        NULL::TEXT,
        NULL::VARCHAR;
END;
$$;

-- =============================================================================
-- VIEW: Trust Dashboard with overrides
-- =============================================================================
CREATE OR REPLACE VIEW v_trust_dashboard AS
SELECT
    ts.tenant_id,
    ts.scope_type,
    ts.scope_domain,
    ts.scope_department,
    ts.trust_score,
    ts.autonomy_level AS base_autonomy_level,
    ts.data_completeness_score,
    ts.signal_accuracy_score,
    ts.source_reliability_score,
    ts.decision_outcome_score,
    ts.decision_sample_count,
    ts.signal_sample_count,
    ts.last_computed_at,
    EXISTS (
        SELECT 1 FROM autonomy_overrides ao 
        WHERE ao.tenant_id = ts.tenant_id 
        AND ao.is_active = true
        AND (ao.expires_at IS NULL OR ao.expires_at > NOW())
    ) AS has_active_override
FROM trust_scores ts
ORDER BY ts.trust_score DESC;

-- =============================================================================
-- RLS Policies
-- =============================================================================
ALTER TABLE signal_accuracy_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_reliability ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY signal_accuracy_tenant_isolation ON signal_accuracy_log
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY source_reliability_tenant_isolation ON source_reliability
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY trust_scores_tenant_isolation ON trust_scores
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY autonomy_overrides_tenant_isolation ON autonomy_overrides
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
