-- Migration: 025_layer2_cognitive_complete.sql
-- Description: Complete Layer 2 (Cognitive Layer) schema for Bridge, Adjust, and enhanced Govern
-- Created: 2026-02-02
-- =============================================================================
-- BRIDGE LAYER: 3-Plane Signal Fusion
-- Combines Spine (Structured), Context (Unstructured), and Knowledge (AI Chats)
-- =============================================================================
CREATE TABLE IF NOT EXISTS bridge_fusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Fusion metadata
    fusion_type VARCHAR(50) NOT NULL,
    -- 'signal_correlation', 'entity_enrichment', 'insight_synthesis'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    -- Source planes (which ones contributed)
    spine_sources JSONB DEFAULT '[]',
    -- Array of {table, record_id, confidence}
    context_sources JSONB DEFAULT '[]',
    -- Array of {artifact_id, snippet, confidence}
    knowledge_sources JSONB DEFAULT '[]',
    -- Array of {session_id, insight_id, confidence}
    -- Fusion result
    fused_insight TEXT NOT NULL,
    confidence_score DECIMAL(3, 2) NOT NULL CHECK (
        confidence_score BETWEEN 0 AND 1
    ),
    -- Linkage
    entity_type VARCHAR(50),
    entity_id UUID,
    situation_id UUID,
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    -- 'active', 'consumed', 'expired'
    consumed_by_action_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);
CREATE INDEX idx_bridge_fusions_tenant ON bridge_fusions(tenant_id);
CREATE INDEX idx_bridge_fusions_entity ON bridge_fusions(entity_type, entity_id);
CREATE INDEX idx_bridge_fusions_status ON bridge_fusions(status)
WHERE status = 'active';
-- =============================================================================
-- ADJUST LAYER: Feedback Loop & Learning
-- Captures outcomes and feeds back to improve the system
-- =============================================================================
-- Feedback logs from users on actions taken
CREATE TABLE IF NOT EXISTS feedback_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- What was acted upon
    action_id UUID,
    situation_id UUID,
    fusion_id UUID REFERENCES bridge_fusions(id),
    -- Feedback data
    feedback_type VARCHAR(30) NOT NULL,
    -- 'outcome_positive', 'outcome_negative', 'correction', 'refinement'
    feedback_rating INTEGER CHECK (
        feedback_rating BETWEEN 1 AND 5
    ),
    feedback_text TEXT,
    -- Metadata
    provided_by UUID,
    provided_at TIMESTAMPTZ DEFAULT NOW(),
    -- Processing status
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    learning_insight_id UUID
);
CREATE INDEX idx_feedback_logs_tenant ON feedback_logs(tenant_id);
CREATE INDEX idx_feedback_logs_action ON feedback_logs(action_id);
CREATE INDEX idx_feedback_unprocessed ON feedback_logs(processed)
WHERE processed = false;
-- Learning insights derived from feedback
CREATE TABLE IF NOT EXISTS learning_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Learning metadata
    insight_type VARCHAR(50) NOT NULL,
    -- 'model_calibration', 'threshold_adjustment', 'pattern_discovery', 'rule_refinement'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    -- Contributing feedback
    feedback_ids UUID [] DEFAULT '{}',
    sample_count INTEGER DEFAULT 1,
    -- Impact tracking
    affected_signals TEXT [],
    affected_rules TEXT [],
    -- Confidence & status  
    confidence DECIMAL(3, 2) NOT NULL CHECK (
        confidence BETWEEN 0 AND 1
    ),
    status VARCHAR(20) DEFAULT 'proposed',
    -- 'proposed', 'approved', 'applied', 'rejected'
    -- Approval workflow
    proposed_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    applied_at TIMESTAMPTZ,
    -- Change tracking
    before_state JSONB,
    after_state JSONB
);
CREATE INDEX idx_learning_insights_tenant ON learning_insights(tenant_id);
CREATE INDEX idx_learning_insights_status ON learning_insights(status);
-- Calibration history for tracking adjustments over time
CREATE TABLE IF NOT EXISTS calibration_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- What was calibrated
    target_type VARCHAR(50) NOT NULL,
    -- 'signal_threshold', 'rule_condition', 'model_weight', 'confidence_baseline'
    target_id TEXT NOT NULL,
    -- Change details
    previous_value JSONB NOT NULL,
    new_value JSONB NOT NULL,
    change_reason TEXT,
    -- Source
    triggered_by VARCHAR(30),
    -- 'feedback', 'auto_tuning', 'manual', 'policy'
    learning_insight_id UUID REFERENCES learning_insights(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_calibration_tenant ON calibration_history(tenant_id);
CREATE INDEX idx_calibration_target ON calibration_history(target_type, target_id);
-- =============================================================================
-- ENHANCED GOVERNANCE: Approval Queue & Policy Enforcement
-- =============================================================================
-- Approval queue for pending actions  
CREATE TABLE IF NOT EXISTS approval_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Action details
    action_id UUID NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_title VARCHAR(255) NOT NULL,
    action_description TEXT,
    action_payload JSONB,
    -- Context
    situation_id UUID,
    entity_type VARCHAR(50),
    entity_id UUID,
    -- Risk assessment
    severity VARCHAR(20),
    -- 'low', 'medium', 'high', 'critical'
    estimated_impact DECIMAL(15, 2),
    risk_factors JSONB DEFAULT '[]',
    -- Evidence
    evidence_refs JSONB DEFAULT '[]',
    -- Array of {type, id, confidence}
    -- Status & workflow
    status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'approved', 'rejected', 'escalated', 'expired'
    priority INTEGER DEFAULT 5,
    -- 1-10, 10 being highest
    -- Assignment
    assigned_to UUID,
    required_role VARCHAR(50),
    -- Policy reference
    policy_id UUID REFERENCES governance_policies(id),
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    due_by TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    decided_at TIMESTAMPTZ,
    decided_by UUID,
    decision_reason TEXT
);
CREATE INDEX idx_approval_queue_tenant ON approval_queue(tenant_id);
CREATE INDEX idx_approval_queue_status ON approval_queue(status)
WHERE status = 'pending';
CREATE INDEX idx_approval_queue_assigned ON approval_queue(assigned_to)
WHERE status = 'pending';
CREATE INDEX idx_approval_queue_due ON approval_queue(due_by)
WHERE status = 'pending';
-- Policy evaluation logs
CREATE TABLE IF NOT EXISTS policy_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- What was evaluated
    action_id UUID NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    -- Evaluation result
    policies_matched UUID [],
    final_decision VARCHAR(20),
    -- 'auto_approve', 'require_approval', 'auto_reject'
    decision_reason TEXT,
    -- Matching details
    evaluation_details JSONB,
    -- Full breakdown of which policies matched and why
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_policy_eval_tenant ON policy_evaluations(tenant_id);
CREATE INDEX idx_policy_eval_action ON policy_evaluations(action_id);
-- =============================================================================
-- AUDIT TRAIL ENHANCEMENTS  
-- =============================================================================
-- Comprehensive audit trail for all system events
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Event classification
    event_category VARCHAR(50) NOT NULL,
    -- 'action', 'decision', 'access', 'config', 'integration'
    event_type VARCHAR(100) NOT NULL,
    event_subtype VARCHAR(100),
    -- Actor
    actor_type VARCHAR(20) NOT NULL,
    -- 'user', 'system', 'api', 'schedule'
    actor_id UUID,
    actor_details JSONB,
    -- Target
    target_type VARCHAR(50),
    target_id UUID,
    target_name VARCHAR(255),
    -- Event data
    before_state JSONB,
    after_state JSONB,
    metadata JSONB DEFAULT '{}',
    -- Classification
    severity VARCHAR(20) DEFAULT 'info',
    -- 'debug', 'info', 'warning', 'error', 'critical'
    is_system_event BOOLEAN DEFAULT false,
    -- Compliance
    retention_days INTEGER DEFAULT 365,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_trail_tenant ON audit_trail(tenant_id);
CREATE INDEX idx_audit_trail_category ON audit_trail(event_category, event_type);
CREATE INDEX idx_audit_trail_actor ON audit_trail(actor_type, actor_id);
CREATE INDEX idx_audit_trail_target ON audit_trail(target_type, target_id);
CREATE INDEX idx_audit_trail_time ON audit_trail(created_at DESC);
-- =============================================================================
-- SEED SAMPLE POLICIES
-- =============================================================================
INSERT INTO governance_policies (
        policy_name,
        action_type_pattern,
        min_severity,
        required_roles,
        auto_approve,
        max_auto_amount,
        require_evidence_count
    )
VALUES (
        'Auto-approve low impact actions',
        '*',
        'low',
        '{}',
        true,
        1000.00,
        0
    ),
    (
        'Require approval for high value',
        'billing.*',
        'medium',
        ARRAY ['finance_admin'],
        false,
        NULL,
        2
    ),
    (
        'CS escalation require manager',
        'cs.escalate*',
        'high',
        ARRAY ['cs_manager', 'admin'],
        false,
        NULL,
        1
    ),
    (
        'Auto-reject without evidence',
        '*',
        'high',
        '{}',
        false,
        NULL,
        3
    ) ON CONFLICT DO NOTHING;
-- =============================================================================
-- KNOWLEDGE BANK ENHANCEMENTS (For AI Chats integration)
-- =============================================================================
CREATE TABLE IF NOT EXISTS knowledge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Classification
    category VARCHAR(50) NOT NULL,
    -- 'note', 'framework', 'template', 'reference', 'playbook'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    -- Content
    content_markdown TEXT NOT NULL,
    content_embedding vector(1536),
    -- For semantic search
    -- Metadata
    tags TEXT [] DEFAULT '{}',
    source_type VARCHAR(30),
    -- 'manual', 'ai_generated', 'imported', 'brainstorm'
    source_id UUID,
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_knowledge_tenant ON knowledge_entries(tenant_id);
CREATE INDEX idx_knowledge_category ON knowledge_entries(category);
CREATE INDEX idx_knowledge_tags ON knowledge_entries USING gin(tags);
COMMENT ON TABLE bridge_fusions IS 'Layer 2: Bridge component - fuses signals from 3 planes';
COMMENT ON TABLE feedback_logs IS 'Layer 2: Adjust component - captures user feedback';
COMMENT ON TABLE learning_insights IS 'Layer 2: Adjust component - derived learnings from feedback';
COMMENT ON TABLE approval_queue IS 'Layer 2: Govern component - pending actions requiring approval';
COMMENT ON TABLE audit_trail IS 'Layer 2: Full audit trail for compliance';