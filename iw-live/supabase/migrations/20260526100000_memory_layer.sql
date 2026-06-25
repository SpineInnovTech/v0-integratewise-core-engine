-- Memory Layer — conversational_memory, org_memory
-- Replaces CouchDB as the canonical continuity substrate
-- All AI session data writes here. All models read from here.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Schema: memory
CREATE SCHEMA IF NOT EXISTS memory;

-- ============================================================================
-- 1. CONVERSATIONAL_MEMORY
-- Twin chat sessions. Role: user | assistant | system.
-- One row per message. Threaded by session_id.
-- ============================================================================

CREATE TABLE IF NOT EXISTS memory.conversational_memory (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID NOT NULL,
  session_id         TEXT NOT NULL,
  model              TEXT NOT NULL,          -- kimi-2.6, claude-sonnet-4, gpt-4o, etc.
  role               TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content            TEXT NOT NULL,
  metadata           JSONB NOT NULL DEFAULT '{}',
  -- metadata: { turn_number, latency_ms, token_count, source_file, decision_refs }
  embedding          VECTOR(1536),           -- For semantic retrieval
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cm_session_idx    ON memory.conversational_memory(session_id);
CREATE INDEX IF NOT EXISTS cm_tenant_idx     ON memory.conversational_memory(tenant_id);
CREATE INDEX IF NOT EXISTS cm_model_idx      ON memory.conversational_memory(model);
CREATE INDEX IF NOT EXISTS cm_created_idx    ON memory.conversational_memory(created_at DESC);

-- Semantic search index
CREATE INDEX IF NOT EXISTS cm_embedding_idx  ON memory.conversational_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- 2. ORG_MEMORY
-- Promoted institutional knowledge. governance_state: staging | approved | published
-- Extracted from transcripts, triage, and governance decisions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS memory.org_memory (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID NOT NULL,
  topic              TEXT NOT NULL,
  category           TEXT NOT NULL CHECK (category IN (
    'doctrine', 'architecture', 'decision', 'workflow',
    'policy', 'insight', 'lesson_learned', 'pattern'
  )),
  content            TEXT NOT NULL,
  source_session_id  TEXT,                   -- Link back to conversational_memory session
  source_decision_id TEXT,                   -- Link back to decision_memory
  evidence_refs      JSONB NOT NULL DEFAULT '[]',
  governance_state   TEXT NOT NULL DEFAULT 'staging' CHECK (governance_state IN (
    'staging', 'approved', 'published', 'archived'
  )),
  approved_by        TEXT,
  approved_at        TIMESTAMPTZ,
  published_at       TIMESTAMPTZ,
  embedding          VECTOR(1536),           -- For semantic retrieval
  version            INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID,                  -- Self-referential versioning
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS om_tenant_idx     ON memory.org_memory(tenant_id);
CREATE INDEX IF NOT EXISTS om_topic_idx      ON memory.org_memory(topic);
CREATE INDEX IF NOT EXISTS om_category_idx   ON memory.org_memory(category);
CREATE INDEX IF NOT EXISTS om_governance_idx ON memory.org_memory(governance_state);
CREATE INDEX IF NOT EXISTS om_created_idx    ON memory.org_memory(created_at DESC);

-- Semantic search index
CREATE INDEX IF NOT EXISTS om_embedding_idx  ON memory.org_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- 3. VIEWS
-- ============================================================================

-- Approved canonical knowledge
CREATE OR REPLACE VIEW memory.approved_knowledge AS
  SELECT id, tenant_id, topic, category, content, evidence_refs, version, created_at, updated_at
  FROM memory.org_memory
  WHERE governance_state IN ('approved', 'published')
  ORDER BY updated_at DESC;

-- Pending review queue
CREATE OR REPLACE VIEW memory.pending_review AS
  SELECT id, tenant_id, topic, category, LEFT(content, 300) AS content_preview, created_at
  FROM memory.org_memory
  WHERE governance_state = 'staging'
  ORDER BY created_at ASC;

-- ============================================================================
-- 4. RLS
-- ============================================================================

ALTER TABLE memory.conversational_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory.org_memory ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "service_role_cm_full" ON memory.conversational_memory
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_om_full" ON memory.org_memory
  TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read org_memory (approved only)
CREATE POLICY "auth_om_read" ON memory.org_memory
  FOR SELECT TO authenticated USING (governance_state IN ('approved', 'published'));

-- Authenticated users can read their own conversational memory
CREATE POLICY "auth_cm_read_own" ON memory.conversational_memory
  FOR SELECT TO authenticated USING (tenant_id = auth.uid());

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Auto-update org_memory.updated_at
CREATE OR REPLACE FUNCTION memory.update_org_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS org_memory_updated_at ON memory.org_memory;
CREATE TRIGGER org_memory_updated_at
  BEFORE UPDATE ON memory.org_memory
  FOR EACH ROW EXECUTE FUNCTION memory.update_org_memory_updated_at();

-- Promote staging → approved
CREATE OR REPLACE FUNCTION memory.promote_to_approved(
  p_id UUID,
  p_approved_by TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE memory.org_memory
  SET governance_state = 'approved',
      approved_by = p_approved_by,
      approved_at = NOW(),
      version = version + 1
  WHERE id = p_id
    AND governance_state = 'staging';
END;
$$ LANGUAGE plpgsql;

-- Publish approved → published
CREATE OR REPLACE FUNCTION memory.publish(
  p_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE memory.org_memory
  SET governance_state = 'published',
      published_at = NOW()
  WHERE id = p_id
    AND governance_state = 'approved';
END;
$$ LANGUAGE plpgsql;
