-- ============================================================================
-- CANONICAL ARTIFACTS MIGRATION (Structured Plane)
-- Version: 1.0.0
-- ============================================================================
-- 0. EVENTS (The Raw Source of Truth for the Spine)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    event_type TEXT NOT NULL,
    -- e.g., 'billing.payment_failed'
    source_system TEXT NOT NULL,
    -- e.g., 'stripe'
    payload JSONB DEFAULT '{}',
    entity_type TEXT,
    -- 'account', 'person', etc.
    entity_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 1. EVIDENCE REFERENCES
-- Links any cross-plane evidence (A/B/C) to a situation or proposal
CREATE TABLE IF NOT EXISTS evidence_refs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    source_plane TEXT NOT NULL,
    -- structured, unstructured, chat
    source_type TEXT NOT NULL,
    -- event, document, session_memory
    source_id TEXT NOT NULL,
    display_label TEXT,
    tool_name TEXT,
    trust_level TEXT DEFAULT 'model_inferred',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. SIGNALS
-- Derived metrics computed from raw events
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    signal_key TEXT NOT NULL,
    -- e.g., 'billing.payment_failed'
    entity_type TEXT NOT NULL,
    -- 'account', 'person', etc.
    entity_id TEXT NOT NULL,
    metric_value NUMERIC,
    metric_unit TEXT,
    band TEXT,
    -- good, warning, critical
    thresholds_used JSONB DEFAULT '{}',
    deltas JSONB DEFAULT '{}',
    inputs JSONB DEFAULT '{}',
    evidence_ref_ids UUID [] DEFAULT '{}',
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. SITUATIONS
-- Aggregated signals that require attention or action
CREATE TABLE IF NOT EXISTS situations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    situation_key TEXT NOT NULL,
    -- e.g., 'billing.at_risk'
    signal_ids UUID [] DEFAULT '{}',
    title TEXT NOT NULL,
    summary TEXT,
    severity TEXT DEFAULT 'medium',
    -- low, medium, high, critical
    status TEXT DEFAULT 'open',
    -- open, resolved, dismissed
    evidence_ref_ids UUID [] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. ACTION PROPOSALS
-- Machine-generated suggestions for resolving a situation
CREATE TABLE IF NOT EXISTS action_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    situation_id UUID NOT NULL REFERENCES situations(id) ON DELETE CASCADE,
    proposal_rank INTEGER DEFAULT 1,
    action_type TEXT NOT NULL,
    -- e.g., 'billing.apply_grace_period'
    parameters JSONB DEFAULT '{}',
    autonomy_level TEXT DEFAULT 'manual',
    -- manual, semi_auto, auto
    required_capabilities TEXT [] DEFAULT '{}',
    confidence_score NUMERIC(3, 2),
    evidence_ref_ids UUID [] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 5. AGENT DECISIONS
-- The final decision (human or agent) on a proposal
CREATE TABLE IF NOT EXISTS agent_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    situation_id UUID NOT NULL REFERENCES situations(id) ON DELETE CASCADE,
    action_proposal_id UUID NOT NULL REFERENCES action_proposals(id) ON DELETE CASCADE,
    decision_status TEXT NOT NULL,
    -- approved, rejected, modified
    decision_source TEXT DEFAULT 'human',
    -- human, agent
    decided_by TEXT,
    -- person_id or agent_id
    decided_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    evidence_ref_ids UUID [] DEFAULT '{}',
    act_execution_status TEXT DEFAULT 'pending',
    -- pending, success, failed
    act_execution_details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signals_tenant ON signals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_signals_entity ON signals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_signals_computed_at ON signals(computed_at);
CREATE INDEX IF NOT EXISTS idx_situations_tenant ON situations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_situations_status ON situations(status);
CREATE INDEX IF NOT EXISTS idx_situations_severity ON situations(severity);
CREATE INDEX IF NOT EXISTS idx_action_proposals_situation ON action_proposals(situation_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_situation ON agent_decisions(situation_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_proposal ON agent_decisions(action_proposal_id);
CREATE INDEX IF NOT EXISTS idx_evidence_refs_tenant ON evidence_refs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_refs_source ON evidence_refs(source_plane, source_id);