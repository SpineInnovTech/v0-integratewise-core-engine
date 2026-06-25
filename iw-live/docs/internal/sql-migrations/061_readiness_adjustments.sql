-- Migration: 061_readiness_adjustments.sql
-- Description: Readiness Adjustments table for Automated Adjustment Loop
-- Tracks reversible adjustments made by the auto-adjust system
-- Created: 2026-03-23

-- ============================================================================
-- Readiness Adjustments (Constitutional Clause 3: Reversible Readiness)
-- ============================================================================

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

-- ============================================================================
-- Adjustment History View (for audit trail)
-- ============================================================================

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

-- ============================================================================
-- Function to reverse an adjustment (maintains audit trail)
-- ============================================================================

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

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE readiness_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY readiness_adj_tenant_isolation ON readiness_adjustments
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- ============================================================================
-- Auto-adjust Statistics View
-- ============================================================================

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
-- Verification
-- ============================================================================

DO $$
BEGIN
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'readiness_adjustments');
    RAISE NOTICE 'Migration 061_readiness_adjustments applied successfully';
END;
$$;
