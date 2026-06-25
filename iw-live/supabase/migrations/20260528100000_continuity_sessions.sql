-- Continuity Session Store — replaces CouchDB session_memory_* databases
-- Session containers, events, and checkpoints in Postgres + JSONB.
-- Tenant isolation via tenant_id column + RLS.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SESSION_CONTAINERS
-- Lifecycle index for a conversation session.
-- ============================================================================

CREATE TABLE IF NOT EXISTS memory.session_containers (
  id                 TEXT PRIMARY KEY,              -- Generated session ID (e.g., sess:xxx)
  tenant_id          UUID NOT NULL,
  user_id            TEXT NOT NULL,
  account_id         TEXT,
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_event_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_count        INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'promoting')),
  tags               JSONB NOT NULL DEFAULT '[]',
  summary            TEXT,
  triage_status      TEXT CHECK (triage_status IN ('pending', 'in_review', 'approved', 'rejected')),
  triage_outcome     TEXT CHECK (triage_outcome IN (
    'retain_ephemeral', 'summarize', 'promote_to_knowledge',
    'attach_artifact', 'update_doctrine', 'generate_projection', 'archive'
  )),
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sc_tenant_idx       ON memory.session_containers(tenant_id);
CREATE INDEX IF NOT EXISTS sc_user_idx         ON memory.session_containers(user_id);
CREATE INDEX IF NOT EXISTS sc_status_idx       ON memory.session_containers(status);
CREATE INDEX IF NOT EXISTS sc_last_event_idx   ON memory.session_containers(last_event_at DESC);
CREATE INDEX IF NOT EXISTS sc_triage_idx       ON memory.session_containers(triage_status)
  WHERE triage_status IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION memory.update_session_container_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS session_containers_updated_at ON memory.session_containers;
CREATE TRIGGER session_containers_updated_at
  BEFORE UPDATE ON memory.session_containers
  FOR EACH ROW EXECUTE FUNCTION memory.update_session_container_updated_at();

-- ============================================================================
-- 2. SESSION_EVENTS
-- Append-only event log within a session.
-- ============================================================================

CREATE TABLE IF NOT EXISTS memory.session_events (
  id                 TEXT PRIMARY KEY,              -- Generated event ID (e.g., event:cognition:xxx)
  tenant_id          UUID NOT NULL,
  session_id         TEXT NOT NULL,
  user_id            TEXT NOT NULL,
  account_id         TEXT,
  event_type         TEXT NOT NULL,
  source             TEXT NOT NULL,
  content            JSONB NOT NULL DEFAULT '{}',
  metadata           JSONB NOT NULL DEFAULT '{}',
  lineage            JSONB NOT NULL DEFAULT '{}',
  seq                INTEGER,                      -- Sequence number within session
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS se_session_idx      ON memory.session_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS se_tenant_idx       ON memory.session_events(tenant_id);
CREATE INDEX IF NOT EXISTS se_type_idx         ON memory.session_events(event_type);
CREATE INDEX IF NOT EXISTS se_user_idx         ON memory.session_events(user_id);
CREATE INDEX IF NOT EXISTS se_created_idx      ON memory.session_events(created_at DESC);

-- Unique constraint: one event ID per tenant (idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS se_tenant_id_idx ON memory.session_events(tenant_id, id);

-- ============================================================================
-- 3. CONTINUITY_CHECKPOINTS
-- Periodic snapshots for fast session resumption.
-- ============================================================================

CREATE TABLE IF NOT EXISTS memory.continuity_checkpoints (
  id                 TEXT PRIMARY KEY,
  tenant_id          UUID NOT NULL,
  session_id         TEXT NOT NULL,
  user_id            TEXT NOT NULL,
  checkpoint_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_range        JSONB NOT NULL DEFAULT '{}',   -- { "from": "event:...", "to": "event:..." }
  compressed_state   TEXT,                           -- JSON-stringified state summary
  model_context_window TEXT,                         -- For AI session resumption
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cc_session_idx      ON memory.continuity_checkpoints(session_id, checkpoint_at DESC);
CREATE INDEX IF NOT EXISTS cc_tenant_idx       ON memory.continuity_checkpoints(tenant_id);

-- ============================================================================
-- 4. RLS
-- ============================================================================

ALTER TABLE memory.session_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory.session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory.continuity_checkpoints ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "service_role_sc_full" ON memory.session_containers
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_se_full" ON memory.session_events
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_cc_full" ON memory.continuity_checkpoints
  TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read their own sessions
CREATE POLICY "auth_sc_read_own" ON memory.session_containers
  FOR SELECT TO authenticated USING (tenant_id = auth.uid());
CREATE POLICY "auth_se_read_own" ON memory.session_events
  FOR SELECT TO authenticated USING (tenant_id = auth.uid());

-- ============================================================================
-- 5. VIEWS
-- ============================================================================

-- Active sessions with recent activity
CREATE OR REPLACE VIEW memory.active_sessions AS
  SELECT id, tenant_id, user_id, account_id, started_at, last_event_at,
         event_count, status, tags, summary, triage_status, created_at
  FROM memory.session_containers
  WHERE status = 'active'
  ORDER BY last_event_at DESC;

-- Pending triage queue
CREATE OR REPLACE VIEW memory.pending_triage AS
  SELECT id, tenant_id, user_id, event_count, summary, tags,
         last_event_at, created_at
  FROM memory.session_containers
  WHERE status = 'closed' AND triage_status = 'pending'
  ORDER BY last_event_at ASC;
