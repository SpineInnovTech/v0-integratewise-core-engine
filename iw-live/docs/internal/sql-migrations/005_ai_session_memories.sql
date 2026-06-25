-- ============================================================================
-- AI SESSIONS & MEMORY CAPTURE
-- Version: 1.1.0
-- ============================================================================
-- AI Sessions
CREATE TABLE IF NOT EXISTS ai_sessions (
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    session_id TEXT NOT NULL,
    tool_source TEXT NOT NULL,
    user_label TEXT,
    summary TEXT,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    scoring_source_trust_level TEXT DEFAULT 'model_inferred',
    version TEXT DEFAULT 'v1',
    PRIMARY KEY (tenant_id, session_id)
);
-- AI Session Memories
CREATE TABLE IF NOT EXISTS ai_session_memories (
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    session_id TEXT NOT NULL,
    memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_type TEXT NOT NULL,
    -- decision, rule, preference, plan, insight, note
    related_entity_type TEXT,
    -- e.g., 'lead', 'account'
    related_entity_id TEXT,
    text TEXT NOT NULL,
    confidence_score DOUBLE PRECISION,
    scoring_source_trust_level TEXT DEFAULT 'model_inferred',
    source_turn_ids TEXT [],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_by TEXT,
    confirmed_at TIMESTAMPTZ,
    FOREIGN KEY (tenant_id, session_id) REFERENCES ai_sessions(tenant_id, session_id) ON DELETE CASCADE
);
-- Index for searching memories by entity
CREATE INDEX IF NOT EXISTS idx_ai_memories_tenant_entity ON ai_session_memories(
    tenant_id,
    related_entity_type,
    related_entity_id
);