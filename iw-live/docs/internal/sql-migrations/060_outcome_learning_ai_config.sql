-- Migration: 060_outcome_learning_ai_config.sql
-- Description: Outcome Learning tables (rule_effectiveness) and AI Model Configuration (ai_config)
-- Created: 2026-03-23
-- 
-- Dependencies: 
--   - 056_neon_hardening_actions_govern.sql (actions table with approval columns)
--   - 040_decision_memory.sql (decision_memory table)

-- ============================================================================
-- AI Model Configuration (per-tenant/user OpenRouter model selection)
-- ============================================================================

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

-- ============================================================================
-- Rule Effectiveness Tracking (Outcome Learning)
-- ============================================================================

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

-- ============================================================================
-- Drift Event Enhancement (add link to rule_effectiveness)
-- ============================================================================

-- Add rule_id reference to drift_events if not exists
ALTER TABLE drift_events 
    ADD COLUMN IF NOT EXISTS rule_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS suggested_action TEXT,
    ADD COLUMN IF NOT EXISTS auto_adjust_applied BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_drift_events_rule ON drift_events(tenant_id, rule_id) WHERE rule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drift_events_auto_adjust ON drift_events(tenant_id, auto_adjust_applied) WHERE auto_adjust_applied = false;

COMMENT ON COLUMN drift_events.rule_id IS 'Links drift to the rule that may have caused it';
COMMENT ON COLUMN drift_events.suggested_action IS 'Suggested remediation action from auto-adjust';
COMMENT ON COLUMN drift_events.auto_adjust_applied IS 'Whether an automatic adjustment was applied';

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_effectiveness ENABLE ROW LEVEL SECURITY;

-- ai_config policies
CREATE POLICY ai_config_tenant_isolation ON ai_config
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- rule_effectiveness policies  
CREATE POLICY rule_effectiveness_tenant_isolation ON rule_effectiveness
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- ============================================================================
-- Seed Default AI Config for Existing Tenants
-- ============================================================================

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
-- Verification
-- ============================================================================

DO $$
BEGIN
    -- Verify tables exist
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_config');
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rule_effectiveness');
    
    RAISE NOTICE 'Migration 060_outcome_learning_ai_config applied successfully';
END;
$$;
