-- Continuity Objects table — canonical continuity ingestion protocol
-- All governed continuity producers write here via /triage endpoint.
-- This is NOT the Flow C triage_results table (support messages).
-- This is the operational continuity memory layer.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types
DO $$ BEGIN
  CREATE TYPE continuity_type_enum AS ENUM (
    'doctrine', 'architecture', 'workflow', 'campaign',
    'entity_update', 'escalation', 'approval', 'insight',
    'continuity_gap', 'deployment', 'governance_event', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE governance_state_enum AS ENUM (
    'proposed', 'triaged', 'linked', 'governed',
    'approved', 'live', 'projected', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE continuity_scope_enum AS ENUM (
    'canonical', 'marketing', 'brand', 'ops', 'demo'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE continuity_source_enum AS ENUM (
    'manus', 'spark', 'hermes', 'gmail', 'slack',
    'n8n', 'ops_board', 'manual', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Main table
CREATE TABLE IF NOT EXISTS continuity_objects (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  continuity_type    continuity_type_enum NOT NULL DEFAULT 'unknown',
  scope              continuity_scope_enum NOT NULL DEFAULT 'ops',
  governance_state   governance_state_enum NOT NULL DEFAULT 'proposed',
  source             continuity_source_enum NOT NULL DEFAULT 'unknown',
  continuity_weight  SMALLINT NOT NULL DEFAULT 5 CHECK (continuity_weight BETWEEN 1 AND 10),
  content            TEXT NOT NULL,
  entity_refs        JSONB NOT NULL DEFAULT '[]',
  relationships      JSONB NOT NULL DEFAULT '[]',
  lineage            JSONB NOT NULL DEFAULT '[]',
  metadata           JSONB NOT NULL DEFAULT '{}',
  hitl_required      BOOLEAN NOT NULL DEFAULT false,
  hitl_reason        TEXT,
  approved_by        TEXT,
  approved_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS co_type_idx          ON continuity_objects(continuity_type);
CREATE INDEX IF NOT EXISTS co_scope_idx         ON continuity_objects(scope);
CREATE INDEX IF NOT EXISTS co_governance_idx    ON continuity_objects(governance_state);
CREATE INDEX IF NOT EXISTS co_source_idx        ON continuity_objects(source);
CREATE INDEX IF NOT EXISTS co_hitl_idx          ON continuity_objects(hitl_required) WHERE hitl_required = true;
CREATE INDEX IF NOT EXISTS co_created_at_idx    ON continuity_objects(created_at DESC);
CREATE INDEX IF NOT EXISTS co_weight_idx        ON continuity_objects(continuity_weight DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_continuity_object_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS continuity_objects_updated_at ON continuity_objects;
CREATE TRIGGER continuity_objects_updated_at
  BEFORE UPDATE ON continuity_objects
  FOR EACH ROW EXECUTE FUNCTION update_continuity_object_updated_at();

-- View: pending HITL review queue
CREATE OR REPLACE VIEW continuity_hitl_queue AS
  SELECT id, continuity_type, scope, source, continuity_weight, hitl_reason,
         LEFT(content, 200) AS content_preview, created_at
  FROM continuity_objects
  WHERE hitl_required = true
    AND governance_state IN ('proposed', 'triaged')
  ORDER BY continuity_weight DESC, created_at ASC;

-- View: live canonical continuity
CREATE OR REPLACE VIEW continuity_live AS
  SELECT id, continuity_type, scope, source, continuity_weight,
         content, entity_refs, metadata, created_at, updated_at
  FROM continuity_objects
  WHERE governance_state = 'live'
  ORDER BY continuity_weight DESC, updated_at DESC;

-- RLS (tenant isolation is not applicable here — continuity is org-scoped)
ALTER TABLE continuity_objects ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "service_role_full_access" ON continuity_objects
  TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY "authenticated_read" ON continuity_objects
  FOR SELECT TO authenticated USING (true);

-- Only service role can write (triage worker uses service role key)
CREATE POLICY "service_role_insert" ON continuity_objects
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "service_role_update" ON continuity_objects
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
