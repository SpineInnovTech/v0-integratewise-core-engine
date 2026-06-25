-- 041_create_think_engine.sql
-- Create "Think" layer tables for Situations, Actions, and Links
-- 1. Situations (The "Why" / Problem / Opportunity)
CREATE TABLE IF NOT EXISTS situations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    severity VARCHAR(20) CHECK (
        severity IN ('critical', 'high', 'medium', 'low', 'info')
    ),
    status VARCHAR(20) DEFAULT 'open',
    -- open, investigating, resolved, ignored
    detected_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    owner_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);
-- 2. Actions (The "What" / Proposals)
-- Distinct from 'tasks' because these might be unapproved proposals
CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    situation_id UUID REFERENCES situations(id) ON DELETE
    SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        type VARCHAR(50),
        -- email_draft, task_creation, slack_msg, meeting_invite
        status VARCHAR(20) DEFAULT 'proposed',
        -- proposed, approved, executed, rejected
        payload JSONB DEFAULT '{}'::jsonb,
        -- Content of the action (e.g. email body, task details)
        priority VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMPTZ DEFAULT now(),
        executed_at TIMESTAMPTZ
);
-- 3. Artifact Links (Connecting Entities to "Context")
-- "Context" = Evidence + Library (Docs, Files, Emails)
CREATE TABLE IF NOT EXISTS artifact_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_table VARCHAR(50) NOT NULL,
    -- 'documents', 'drive_files', 'emails'
    artifact_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    -- 'deal', 'client', 'situation', 'task'
    entity_id UUID NOT NULL,
    tenant_id UUID,
    -- Optional organizational scoping
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Create a composite index for fast lookups by entity
    CONSTRAINT unique_artifact_link UNIQUE (
        artifact_table,
        artifact_id,
        entity_type,
        entity_id
    )
);
-- 4. Session Links (Connecting AI Sessions to Entities)
-- "IQ Hub" Memory linking
CREATE TABLE IF NOT EXISTS session_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_session_link UNIQUE (session_id, entity_type, entity_id)
);
-- 5. Evidence Refs (Connecting Situations to Supporting Data)
-- "Evidence Panel" sources
CREATE TABLE IF NOT EXISTS evidence_refs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    situation_id UUID NOT NULL REFERENCES situations(id) ON DELETE CASCADE,
    ref_type VARCHAR(50) NOT NULL,
    -- 'spine' (Metric), 'context' (Doc), 'knowledge' (Session)
    ref_table VARCHAR(50) NOT NULL,
    -- 'metrics', 'documents', 'ai_sessions', 'calendar_events'
    ref_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_evidence_ref UNIQUE (situation_id, ref_type, ref_table, ref_id)
);
-- Enable RLS
ALTER TABLE situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_refs ENABLE ROW LEVEL SECURITY;
-- Creating generic policies (open for internal users for now)
CREATE POLICY "situations_all" ON situations FOR ALL USING (true);
CREATE POLICY "actions_all" ON actions FOR ALL USING (true);
CREATE POLICY "artifact_links_all" ON artifact_links FOR ALL USING (true);
CREATE POLICY "session_links_all" ON session_links FOR ALL USING (true);
CREATE POLICY "evidence_refs_all" ON evidence_refs FOR ALL USING (true);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_situations_status ON situations(status);
CREATE INDEX IF NOT EXISTS idx_actions_situation ON actions(situation_id);
CREATE INDEX IF NOT EXISTS idx_artifact_links_entity ON artifact_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_session_links_entity ON session_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_evidence_refs_situation ON evidence_refs(situation_id);