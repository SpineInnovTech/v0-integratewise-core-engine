-- ============================================================================
-- Migration 032: Governed Cognition Proposals (D1 version)
--
-- D1-compatible adaptation of the Supabase proposals table.
-- No ENUMs (D1 doesn't support them) — use TEXT with CHECK constraints.
-- No RLS (D1 doesn't have it) — tenant isolation enforced at the Gateway/Worker level.
--
-- LIFECYCLE: draft → pending_review → approved|rejected → executing → completed|failed|superseded
-- ============================================================================

CREATE TABLE IF NOT EXISTS proposals (
  -- Identity
  id                        TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL,

  -- Lifecycle
  status                    TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('draft','pending_review','approved','rejected','executing','completed','failed','superseded')),
  governance_level          TEXT NOT NULL DEFAULT 'manual'
    CHECK (governance_level IN ('auto','manual','restricted')),

  -- Cognition origin
  originating_entity_id     TEXT NOT NULL,
  originating_entity_type   TEXT NOT NULL,
  originating_signal        TEXT NOT NULL DEFAULT '{}',

  -- Lineage (immutable chain)
  lineage_id                TEXT NOT NULL,
  parent_proposal_id        TEXT,

  -- Governed intent
  action_type               TEXT NOT NULL
    CHECK (action_type IN ('notify','create_task','update_entity','escalate','schedule_call','trigger_workflow','draft_communication','create_record','archive_entity','request_data','custom')),
  action_target             TEXT NOT NULL DEFAULT '{}',
  action_parameters         TEXT NOT NULL DEFAULT '{}',
  action_description        TEXT NOT NULL,

  -- Confidence + reasoning
  confidence                REAL NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  reasoning_summary         TEXT NOT NULL DEFAULT '',
  evidence_count            INTEGER NOT NULL DEFAULT 0,

  -- Governance
  policy_id                 TEXT,
  review_deadline           TEXT,
  reviewed_by               TEXT,
  reviewed_at               TEXT,
  review_notes              TEXT,

  -- Execution
  execution_result          TEXT,

  -- Continuity writeback
  continuity_writeback      TEXT,

  -- Ops projection
  ops_priority              TEXT NOT NULL DEFAULT 'medium'
    CHECK (ops_priority IN ('low','medium','high','critical')),
  ops_surface               TEXT NOT NULL DEFAULT 'queue'
    CHECK (ops_surface IN ('queue','tile','notification','command_center','timeline')),

  -- Timestamps
  created_at                TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Primary query: tenant + status (Ops queue)
CREATE INDEX IF NOT EXISTS idx_proposals_tenant_status
  ON proposals (tenant_id, status, ops_priority, created_at);

-- Lineage chain lookup
CREATE INDEX IF NOT EXISTS idx_proposals_lineage
  ON proposals (tenant_id, lineage_id, created_at);

-- Entity-scoped proposals
CREATE INDEX IF NOT EXISTS idx_proposals_entity
  ON proposals (tenant_id, originating_entity_id, originating_entity_type);

-- Ops surface routing
CREATE INDEX IF NOT EXISTS idx_proposals_ops_surface
  ON proposals (tenant_id, ops_surface, status);
