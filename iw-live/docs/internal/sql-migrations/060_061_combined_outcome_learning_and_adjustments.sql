-- ============================================================================
-- Combined Migration: 060 + 061
-- Description: Outcome Learning (AI Config + Rule Effectiveness) + Readiness Adjustments
-- Created: 2026-03-23
-- Apply this single file in Supabase SQL Editor instead of 060 and 061 separately
-- ============================================================================

-- ============================================================================
-- PART 1: Outcome Learning & AI Configuration (from 060)
-- ============================================================================

-- AI Model Configuration (per-tenant/user OpenRouter model selection)
CREATE TABLE IF NOT EXISTS ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Model selections (OpenRouter model IDs)
    default_model VARCHAR(100) DEFAULT 'anthropic/claude-3.5-sonnet',
    twin_model VARCHAR(100) DEFAULT 'anthropic/claude-3.5-sonnet',
    brainstorm_model VARCHAR(100) DEFAULT 'anthropic/claude-3.5-sonnet',
    extraction_model VARCHAR(100) DEFAULT 'anthropic/claude-3.5-haiku',
    
    -- Generation parameters
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 4096 CHECK (max_tokens > 0 AND max_tokens <= 8192),
    
    -- Cost optimization: 'speed' | 'balanced' | 'quality'
    cost_optimization VARCHAR(20) DEFAULT 'balanced' CHECK (cost_optimization IN ('speed', 'balanced', 'quality')),
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_tenant_user_config UNIQUE (tenant_id, user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_config_tenant ON ai_config(tenant_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_config_tenant_user ON ai_config(tenant_id, user_id) WHERE is_active = true;

COMMENT ON TABLE ai_config IS 'Per-tenant/user AI model configuration for OpenRouter integration';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ai_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_config_updated_at ON ai_config;
CREATE TRIGGER trigger_ai_config_updated_at
    BEFORE UPDATE ON ai_config
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_config_updated_at();

-- Rule Effectiveness Tracking (Outcome Learning)
CREATE TABLE IF NOT EXISTS rule_effectiveness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Rule identification
    rule_id VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50), -- 'signal_rule', 'situation_rule', 'escalation_rule'
    entity_type VARCHAR(50), -- 'contact', 'account', 'deal', etc.
    
    -- Effectiveness metrics
    total_triggered INTEGER DEFAULT 0 CHECK (total_triggered >= 0),
    successful_outcomes INTEGER DEFAULT 0 CHECK (successful_outcomes >= 0),
    failed_outcomes INTEGER DEFAULT 0 CHECK (failed_outcomes >= 0),
    
    -- Performance metrics
    effectiveness_score INTEGER DEFAULT 0 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
    avg_execution_time_ms INTEGER DEFAULT 0 CHECK (avg_execution_time_ms >= 0),
    
    -- Temporal tracking
    first_triggered_at TIMESTAMPTZ,
    last_triggered_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_tenant_rule UNIQUE (tenant_id, rule_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rule_effectiveness_tenant ON rule_effectiveness(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rule_effectiveness_score ON rule_effectiveness(tenant_id, effectiveness_score) WHERE effectiveness_score < 50;
CREATE INDEX IF NOT EXISTS idx_rule_effectiveness_entity ON rule_effectiveness(tenant_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_rule_effectiveness_last_triggered ON rule_effectiveness(tenant_id, last_triggered_at DESC);

COMMENT ON TABLE rule_effectiveness IS 'Tracks AI rule effectiveness for Outcome Learning system';

-- Trigger to update updated_at and calculate effectiveness_score
CREATE OR REPLACE FUNCTION update_rule_effectiveness()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    
    -- Calculate effectiveness score
    IF NEW.total_triggered > 0 THEN
        NEW.effectiveness_score := (NEW.successful_outcomes * 100 / NEW.total_triggered);
    ELSE
        NEW.effectiveness_score := 0;
    END IF;
    
    -- Set first_triggered_at on first trigger
    IF NEW.total_triggered = 1 AND NEW.first_triggered_at IS NULL THEN
        NEW.first_triggered_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rule_effectiveness_update ON rule_effectiveness;
CREATE TRIGGER trigger_rule_effectiveness_update
    BEFORE UPDATE ON rule_effectiveness
    FOR EACH ROW
    EXECUTE FUNCTION update_rule_effectiveness();

-- Trigger for inserts
DROP TRIGGER IF EXISTS trigger_rule_effectiveness_insert ON rule_effectiveness;
CREATE TRIGGER trigger_rule_effectiveness_insert
    BEFORE INSERT ON rule_effectiveness
    FOR EACH ROW
    EXECUTE FUNCTION update_rule_effectiveness();

-- Drift Event Enhancement (add link to rule_effectiveness)
ALTER TABLE drift_events 
    ADD COLUMN IF NOT EXISTS rule_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS suggested_action TEXT,
    ADD COLUMN IF NOT EXISTS auto_adjust_applied BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_drift_events_rule ON drift_events(tenant_id, rule_id) WHERE rule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drift_events_auto_adjust ON drift_events(tenant_id, auto_adjust_applied) WHERE auto_adjust_applied = false;

COMMENT ON COLUMN drift_events.rule_id IS 'Links drift to the rule that may have caused it';
COMMENT ON COLUMN drift_events.suggested_action IS 'Suggested remediation action from auto-adjust';
COMMENT ON COLUMN drift_events.auto_adjust_applied IS 'Whether an automatic adjustment was applied';

-- Row Level Security Policies for Part 1
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_effectiveness ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_config_tenant_isolation ON ai_config
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY rule_effectiveness_tenant_isolation ON rule_effectiveness
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Seed Default AI Config for Existing Tenants
INSERT INTO ai_config (tenant_id, user_id, default_model, twin_model, brainstorm_model, extraction_model)
SELECT 
    t.id as tenant_id,
    NULL as user_id, -- tenant default
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3.5-haiku'
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM ai_config ac 
    WHERE ac.tenant_id = t.id AND ac.user_id IS NULL
);

-- ============================================================================
-- PART 2: Readiness Adjustments (from 061)
-- ============================================================================

-- Readiness Adjustments (Constitutional Clause 3: Reversible Readiness)
CREATE TABLE IF NOT EXISTS readiness_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Target entity
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID, -- Optional: specific entity affected
    
    -- Adjustment details
    adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN (
        'confidence_threshold',    -- Tightened/loosened confidence threshold
        'rule_threshold',          -- Changed rule trigger threshold
        'sampling_rate',           -- Adjusted data sampling rate
        'auto_execute',            -- Toggled auto-execution
        'manual_override',         -- Human-made adjustment
        'pattern_based',           -- ML-detected pattern adjustment
        'temporal_rule',           -- Time-based rule change
        'performance_optimize'     -- Performance optimization
    )),
    
    -- Values (stored as text for flexibility)
    previous_value TEXT NOT NULL,
    new_value TEXT NOT NULL,
    
    -- Trigger information
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN (
        'auto_drift_pattern',      -- Automatically detected drift pattern
        'auto_effectiveness',      -- Automatically detected low effectiveness
        'auto_performance',        -- Automatically detected performance issue
        'manual_approval',         -- Human approved suggestion
        'manual_direct',           -- Human made direct change
        'system_init',             -- System initialization
        'rollback',                -- Rollback of previous adjustment
        'drift_event'              -- Triggered by drift event
    )),
    trigger_id UUID, -- Reference to drift_event, rule_effectiveness, etc.
    
    -- Reversibility (Constitutional requirement)
    is_reversible BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'reversed', 'expired', 'superseded')),
    
    -- Reversal tracking
    reversed_at TIMESTAMPTZ,
    reversed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reversal_reason TEXT,
    reversed_by_adjustment_id UUID REFERENCES readiness_adjustments(id) ON DELETE SET NULL,
    
    -- Metadata
    reason TEXT NOT NULL, -- Human-readable reason for adjustment
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ, -- Optional expiration for temporary adjustments
    
    -- Performance tracking
    effectiveness_before INTEGER CHECK (effectiveness_before BETWEEN 0 AND 100),
    effectiveness_after INTEGER CHECK (effectiveness_after BETWEEN 0 AND 100),
    
    -- JSONB for extensible metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_readiness_adj_tenant ON readiness_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_readiness_adj_entity ON readiness_adjustments(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_readiness_adj_type ON readiness_adjustments(tenant_id, adjustment_type);
CREATE INDEX IF NOT EXISTS idx_readiness_adj_trigger ON readiness_adjustments(tenant_id, trigger_type, trigger_id);
CREATE INDEX IF NOT EXISTS idx_readiness_adj_status ON readiness_adjustments(tenant_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_readiness_adj_created ON readiness_adjustments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_readiness_adj_reversible ON readiness_adjustments(tenant_id, is_reversible, status) 
    WHERE is_reversible = true AND status = 'active';

COMMENT ON TABLE readiness_adjustments IS 'Tracks reversible adjustments made by auto-adjust system (Constitutional Clause 3)';
COMMENT ON COLUMN readiness_adjustments.is_reversible IS 'Whether this adjustment can be undone (Constitutional requirement)';
COMMENT ON COLUMN readiness_adjustments.status IS 'Current status: active, reversed, expired, or superseded';

-- Adjustment History View (for audit trail)
CREATE OR REPLACE VIEW readiness_adjustment_history AS
SELECT 
    ra.*,
    t.name as tenant_name,
    u.email as created_by_email,
    ru.email as reversed_by_email,
    CASE 
        WHEN ra.status = 'active' AND ra.is_reversible THEN 'can_reverse'
        WHEN ra.status = 'reversed' THEN 'reversed'
        ELSE 'locked'
    END as reversal_status
FROM readiness_adjustments ra
LEFT JOIN tenants t ON ra.tenant_id = t.id
LEFT JOIN auth.users u ON ra.reversed_by = u.id
LEFT JOIN auth.users ru ON ra.reversed_by = ru.id;

-- Function to reverse an adjustment (maintains audit trail)
CREATE OR REPLACE FUNCTION reverse_adjustment(
    p_adjustment_id UUID,
    p_reversed_by UUID,
    p_reason TEXT
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_original readiness_adjustments%ROWTYPE;
    v_reversal_id UUID;
BEGIN
    -- Get original adjustment
    SELECT * INTO v_original FROM readiness_adjustments WHERE id = p_adjustment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Adjustment not found';
    END IF;
    
    IF NOT v_original.is_reversible THEN
        RAISE EXCEPTION 'Adjustment is not reversible';
    END IF;
    
    IF v_original.status != 'active' THEN
        RAISE EXCEPTION 'Adjustment is not active (status: %)', v_original.status;
    END IF;
    
    -- Create reversal adjustment (swaps previous/new values)
    INSERT INTO readiness_adjustments (
        tenant_id,
        entity_type,
        entity_id,
        adjustment_type,
        previous_value,
        new_value,
        trigger_type,
        trigger_id,
        is_reversible,
        status,
        reason,
        reversed_by_adjustment_id
    ) VALUES (
        v_original.tenant_id,
        v_original.entity_type,
        v_original.entity_id,
        v_original.adjustment_type,
        v_original.new_value, -- swapped
        v_original.previous_value, -- swapped
        'rollback',
        p_adjustment_id,
        true,
        'active',
        p_reason,
        p_adjustment_id
    )
    RETURNING id INTO v_reversal_id;
    
    -- Mark original as reversed
    UPDATE readiness_adjustments
    SET 
        status = 'reversed',
        reversed_at = now(),
        reversed_by = p_reversed_by,
        reversal_reason = p_reason,
        reversed_by_adjustment_id = v_reversal_id
    WHERE id = p_adjustment_id;
    
    RETURN v_reversal_id;
END;
$$;

COMMENT ON FUNCTION reverse_adjustment IS 'Reverses an adjustment per Constitutional Clause 3 (Reversible Readiness)';

-- Row Level Security for Readiness Adjustments
ALTER TABLE readiness_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY readiness_adj_tenant_isolation ON readiness_adjustments
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Auto-adjust Statistics View
CREATE OR REPLACE VIEW auto_adjust_statistics AS
SELECT 
    tenant_id,
    adjustment_type,
    trigger_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE status = 'reversed') as reversed_count,
    AVG(effectiveness_before) FILTER (WHERE effectiveness_before IS NOT NULL) as avg_effectiveness_before,
    AVG(effectiveness_after) FILTER (WHERE effectiveness_after IS NOT NULL) as avg_effectiveness_after,
    MAX(created_at) as last_adjustment_at
FROM readiness_adjustments
GROUP BY tenant_id, adjustment_type, trigger_type;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    -- Verify Part 1 tables exist
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_config');
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rule_effectiveness');
    
    -- Verify Part 2 tables exist
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'readiness_adjustments');
    
    RAISE NOTICE '✅ Combined Migration 060+061 applied successfully';
    RAISE NOTICE 'Tables created: ai_config, rule_effectiveness, readiness_adjustments';
    RAISE NOTICE 'Views created: readiness_adjustment_history, auto_adjust_statistics';
    RAISE NOTICE 'Function created: reverse_adjustment()';
END;
$$;
