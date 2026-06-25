-- ============================================================================
-- D1 SPINE INITIAL SCHEMA (Cognitive Intelligence Layer)
-- Optimized for SQLite/D1
-- ============================================================================
-- 0. TENANTS & AUTH (Minimal for D1)
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 1. EVIDENCE REFERENCES (The Evidence Drawer backend)
CREATE TABLE IF NOT EXISTS evidence_refs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    source_plane TEXT NOT NULL,
    -- structured, unstructured, chat
    source_type TEXT NOT NULL,
    -- event, document, session_memory
    source_id TEXT NOT NULL,
    display_label TEXT,
    tool_name TEXT,
    trust_level TEXT DEFAULT 'model_inferred',
    metadata TEXT DEFAULT '{}',
    -- Store as JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 2. SIGNALS (The Insight Engine)
CREATE TABLE IF NOT EXISTS signals (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    signal_key TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metric_value REAL,
    metric_unit TEXT,
    band TEXT,
    -- good, warning, critical
    thresholds_used TEXT DEFAULT '{}',
    deltas TEXT DEFAULT '{}',
    inputs TEXT DEFAULT '{}',
    evidence_ref_ids TEXT DEFAULT '[]',
    -- JSON array of UUIDs
    computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 3. SITUATIONS (The Brainstorm Layer)
CREATE TABLE IF NOT EXISTS situations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    situation_key TEXT NOT NULL,
    signal_ids TEXT DEFAULT '[]',
    -- JSON array of Signal IDs
    title TEXT NOT NULL,
    summary TEXT,
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    evidence_ref_ids TEXT DEFAULT '[]',
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 4. ACTION PROPOSALS (The Act Layer / Agents)
CREATE TABLE IF NOT EXISTS action_proposals (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    situation_id TEXT NOT NULL,
    proposal_rank INTEGER DEFAULT 1,
    action_type TEXT NOT NULL,
    parameters TEXT DEFAULT '{}',
    autonomy_level TEXT DEFAULT 'manual',
    required_capabilities TEXT DEFAULT '[]',
    confidence_score REAL,
    evidence_ref_ids TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 5. AGENT DECISIONS (Governance & Audit)
CREATE TABLE IF NOT EXISTS agent_decisions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    situation_id TEXT NOT NULL,
    action_proposal_id TEXT NOT NULL,
    decision_status TEXT NOT NULL,
    -- approved, rejected, modified
    decision_source TEXT DEFAULT 'human',
    decided_by TEXT,
    -- person_id or agent_id
    decided_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    evidence_ref_ids TEXT DEFAULT '[]',
    act_execution_status TEXT DEFAULT 'pending',
    act_execution_details TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 6. AUDIT LOG (Immutable Event Stream)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_type TEXT DEFAULT 'agent',
    -- human, agent, system
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    prev_state TEXT,
    new_state TEXT,
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 7. AGENT REGISTRY
CREATE TABLE IF NOT EXISTS agent_registry (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    capabilities TEXT DEFAULT '[]',
    policies TEXT DEFAULT '[]',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 8. IDEMPOTENCY KEYS
CREATE TABLE IF NOT EXISTS idempotency_keys (
    idempotency_key TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    first_processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    process_count INTEGER DEFAULT 1
);
-- 9. CANONICAL VERSIONS
CREATE TABLE IF NOT EXISTS canonical_versions (
    dedup_key TEXT PRIMARY KEY,
    version INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Indexes for performance
CREATE INDEX idx_evidence_refs_match ON evidence_refs(source_plane, source_id);
CREATE INDEX idx_signals_entity ON signals(entity_type, entity_id);
CREATE INDEX idx_situations_status ON situations(status);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_agent_decisions_proposal ON agent_decisions(action_proposal_id);
CREATE INDEX idx_idempotency_tenant ON idempotency_keys(tenant_id, idempotency_key);