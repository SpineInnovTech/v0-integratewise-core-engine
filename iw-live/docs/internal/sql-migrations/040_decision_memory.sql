-- Migration: 040_decision_memory.sql
-- Description: Decision Memory Layer for Organizational Learning
-- Created: 2026-02-08
-- Part of: Cognitive Brain Specification
--
-- CONSTITUTIONAL COMPLIANCE:
--   Clause 1 (Temporal Truth): All decisions are time-indexed with evidence_snapshot
--   Clause 4 (Decision Replay): Evidence hash ensures reproducibility
--   See: docs/CANONICAL_OS_LAYER_MODEL.md

-- =============================================================================
-- DECISION MEMORY: Core decision objects
-- Captures WHY decisions were made, under WHAT conditions, with WHAT confidence
-- =============================================================================
CREATE TABLE IF NOT EXISTS decision_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Decision identity
    decision_type VARCHAR(30) NOT NULL CHECK (decision_type IN (
        'strategic', 'operational', 'tactical', 'reactive', 'preventive'
    )),
    decision_domain VARCHAR(50) NOT NULL, -- 'renewal', 'churn', 'expansion', 'support', etc.
    decision_title VARCHAR(255) NOT NULL,
    decision_summary TEXT,
    
    -- Entity context
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- TEMPORAL TRUTH: Evidence snapshot is time-indexed and immutable
    evidence_snapshot JSONB NOT NULL DEFAULT '{}',
    evidence_hash VARCHAR(64) NOT NULL, -- SHA256 of snapshot for integrity (Clause 4)
    evidence_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When evidence was captured (Clause 1)
    
    -- Signals present at decision (time-indexed)
    signals_present JSONB NOT NULL DEFAULT '[]',
    situations_active JSONB NOT NULL DEFAULT '[]',
    total_signal_strength DECIMAL(4,3) CHECK (total_signal_strength BETWEEN 0 AND 1),
    
    -- Reasoning chain (enables replay - Clause 4)
    fusion_id UUID REFERENCES bridge_fusions(id),
    reasoning_chain JSONB NOT NULL DEFAULT '[]',
    confidence_at_decision DECIMAL(4,3) CHECK (confidence_at_decision BETWEEN 0 AND 1),
    alternatives_considered JSONB NOT NULL DEFAULT '[]',
    
    -- Policy state at decision time (Clause 4)
    policy_snapshot JSONB NOT NULL DEFAULT '{}',
    trust_score_at_decision DECIMAL(4,3),
    autonomy_level_at_decision VARCHAR(20),
    
    -- Human input
    decided_by UUID NOT NULL,
    override_reason TEXT,
    approval_mode VARCHAR(20) NOT NULL CHECK (approval_mode IN (
        'manual', 'ai_suggested', 'auto_approved', 'escalated'
    )),
    approval_delay_ms INTEGER, -- How long human took to decide
    
    -- Action linkage
    action_id UUID,
    action_type VARCHAR(100),
    action_params JSONB,
    execution_status VARCHAR(20),
    
    -- Outcome tracking (filled later)
    expected_outcome JSONB,
    actual_outcome JSONB,
    outcome_delta DECIMAL(10,4),
    outcome_measured_at TIMESTAMPTZ,
    time_horizon_days INTEGER DEFAULT 30,
    
    -- Learning signals (filled after outcome)
    was_correct VARCHAR(20) CHECK (was_correct IN ('correct', 'incorrect', 'partial', 'pending')),
    should_have_done TEXT,
    pattern_tags TEXT[] DEFAULT '{}',
    reusability_score DECIMAL(3,2) CHECK (reusability_score BETWEEN 0 AND 1),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for decision retrieval
CREATE INDEX idx_decision_memory_tenant ON decision_memory(tenant_id);
CREATE INDEX idx_decision_memory_entity ON decision_memory(entity_type, entity_id);
CREATE INDEX idx_decision_memory_domain ON decision_memory(tenant_id, decision_domain);
CREATE INDEX idx_decision_memory_type ON decision_memory(decision_type);
CREATE INDEX idx_decision_memory_correctness ON decision_memory(was_correct) WHERE was_correct IS NOT NULL;
CREATE INDEX idx_decision_memory_patterns ON decision_memory USING GIN(pattern_tags);
CREATE INDEX idx_decision_memory_created ON decision_memory(created_at DESC);

-- =============================================================================
-- DECISION PATTERNS: Extracted reusable decision patterns
-- =============================================================================
CREATE TABLE IF NOT EXISTS decision_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Pattern identity
    pattern_name VARCHAR(255) NOT NULL,
    pattern_domain VARCHAR(50) NOT NULL,
    pattern_description TEXT NOT NULL,
    
    -- Trigger conditions (when to apply this pattern)
    trigger_signals JSONB NOT NULL DEFAULT '[]', -- Signal types that trigger
    trigger_conditions JSONB NOT NULL DEFAULT '{}', -- Additional context conditions
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    
    -- Recommended action
    recommended_action_type VARCHAR(100) NOT NULL,
    recommended_params_template JSONB NOT NULL DEFAULT '{}',
    
    -- Evidence of pattern validity
    source_decision_ids UUID[] DEFAULT '{}',
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    success_rate DECIMAL(4,3) GENERATED ALWAYS AS (
        CASE WHEN success_count + failure_count > 0 
        THEN success_count::DECIMAL / (success_count + failure_count)
        ELSE 0 END
    ) STORED,
    
    -- Pattern lifecycle
    status VARCHAR(20) DEFAULT 'learning' CHECK (status IN (
        'learning', 'validated', 'promoted', 'deprecated'
    )),
    min_samples_for_validation INTEGER DEFAULT 5,
    last_applied_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decision_patterns_tenant ON decision_patterns(tenant_id);
CREATE INDEX idx_decision_patterns_domain ON decision_patterns(pattern_domain);
CREATE INDEX idx_decision_patterns_status ON decision_patterns(status);
CREATE INDEX idx_decision_patterns_success ON decision_patterns(success_rate DESC);

-- =============================================================================
-- DECISION SIMILARITY: For pattern matching on new decisions
-- =============================================================================
CREATE TABLE IF NOT EXISTS decision_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES decision_memory(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Searchable text representation
    searchable_text TEXT NOT NULL,
    
    -- Embedding vectors would be stored here (using pgvector if available)
    -- evidence_embedding VECTOR(1536),
    -- reasoning_embedding VECTOR(1536),
    -- outcome_embedding VECTOR(1536),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decision_embeddings_tenant ON decision_embeddings(tenant_id);
CREATE INDEX idx_decision_embeddings_decision ON decision_embeddings(decision_id);

-- =============================================================================
-- FUNCTION: Find similar past decisions for a given context
-- =============================================================================
CREATE OR REPLACE FUNCTION find_similar_decisions(
    p_tenant_id UUID,
    p_entity_type VARCHAR,
    p_decision_domain VARCHAR,
    p_signals JSONB,
    p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    decision_id UUID,
    decision_title VARCHAR,
    similarity_score DECIMAL,
    was_correct VARCHAR,
    action_taken VARCHAR,
    outcome_delta DECIMAL,
    created_at TIMESTAMPTZ
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dm.id,
        dm.decision_title,
        -- Simple similarity: count matching signals
        COALESCE((
            SELECT COUNT(*)::DECIMAL / GREATEST(jsonb_array_length(dm.signals_present), 1)
            FROM jsonb_array_elements(dm.signals_present) sp
            WHERE sp->>'signal_type' IN (
                SELECT jsonb_array_elements_text(p_signals)
            )
        ), 0) AS similarity_score,
        dm.was_correct,
        dm.action_type,
        dm.outcome_delta,
        dm.created_at
    FROM decision_memory dm
    WHERE dm.tenant_id = p_tenant_id
      AND dm.entity_type = p_entity_type
      AND dm.decision_domain = p_decision_domain
      AND dm.was_correct IS NOT NULL  -- Only decisions with known outcomes
    ORDER BY similarity_score DESC, dm.created_at DESC
    LIMIT p_limit;
END;
$$;

-- =============================================================================
-- FUNCTION: Get org decision DNA (aggregate patterns)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_org_decision_dna(
    p_tenant_id UUID,
    p_decision_domain VARCHAR DEFAULT NULL
) RETURNS TABLE (
    domain VARCHAR,
    total_decisions BIGINT,
    success_rate DECIMAL,
    avg_confidence DECIMAL,
    avg_decision_time_ms DECIMAL,
    most_common_action VARCHAR
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dm.decision_domain::VARCHAR,
        COUNT(*)::BIGINT,
        AVG(CASE WHEN dm.was_correct = 'correct' THEN 1 
                 WHEN dm.was_correct = 'incorrect' THEN 0 
                 ELSE 0.5 END)::DECIMAL,
        AVG(dm.confidence_at_decision)::DECIMAL,
        AVG(dm.approval_delay_ms)::DECIMAL,
        MODE() WITHIN GROUP (ORDER BY dm.action_type)::VARCHAR
    FROM decision_memory dm
    WHERE dm.tenant_id = p_tenant_id
      AND (p_decision_domain IS NULL OR dm.decision_domain = p_decision_domain)
      AND dm.was_correct IS NOT NULL
    GROUP BY dm.decision_domain;
END;
$$;

-- =============================================================================
-- FUNCTION: Record decision with outcome update
-- =============================================================================
CREATE OR REPLACE FUNCTION update_decision_outcome(
    p_decision_id UUID,
    p_actual_outcome JSONB,
    p_was_correct VARCHAR,
    p_should_have_done TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    UPDATE decision_memory
    SET 
        actual_outcome = p_actual_outcome,
        was_correct = p_was_correct,
        should_have_done = p_should_have_done,
        outcome_measured_at = NOW(),
        updated_at = NOW()
    WHERE id = p_decision_id;
    
    -- Update related pattern success/failure counts
    UPDATE decision_patterns dp
    SET 
        success_count = success_count + CASE WHEN p_was_correct = 'correct' THEN 1 ELSE 0 END,
        failure_count = failure_count + CASE WHEN p_was_correct = 'incorrect' THEN 1 ELSE 0 END,
        updated_at = NOW()
    WHERE p_decision_id = ANY(dp.source_decision_ids);
END;
$$;

-- =============================================================================
-- VIEW: Decision Memory Dashboard
-- =============================================================================
CREATE OR REPLACE VIEW v_decision_memory_dashboard AS
SELECT
    dm.tenant_id,
    dm.decision_domain,
    dm.entity_type,
    COUNT(*) AS total_decisions,
    COUNT(*) FILTER (WHERE dm.was_correct = 'correct') AS correct_count,
    COUNT(*) FILTER (WHERE dm.was_correct = 'incorrect') AS incorrect_count,
    COUNT(*) FILTER (WHERE dm.was_correct = 'pending' OR dm.was_correct IS NULL) AS pending_count,
    AVG(dm.confidence_at_decision) AS avg_confidence,
    AVG(dm.approval_delay_ms) AS avg_decision_time_ms
FROM decision_memory dm
GROUP BY dm.tenant_id, dm.decision_domain, dm.entity_type;

-- =============================================================================
-- RLS Policies
-- =============================================================================
ALTER TABLE decision_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY decision_memory_tenant_isolation ON decision_memory
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY decision_patterns_tenant_isolation ON decision_patterns
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY decision_embeddings_tenant_isolation ON decision_embeddings
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
