-- ============================================================================
-- D1 Schema: Governed Cognition Proposals
--
-- SQLite dialect for Cloudflare D1 (edge-local governance queue).
-- Replaces Supabase REST for proposal CRUD — zero network hop.
--
-- RULES:
--   - All IDs are TEXT (UUIDs generated in Worker)
--   - Timestamps are TEXT (ISO 8601)
--   - JSON fields use native SQLite JSON (D1 supports JSON1 extension)
--   - Enums are TEXT with CHECK constraints
--   - No RLS — app-level authorization in Worker
--   - Lineage is immutable: no hard deletes
-- ============================================================================

-- ─── Proposals Table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposals (
  -- Identity
  id                        TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL,

  -- Lifecycle
  status                    TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'executing', 'completed', 'failed', 'superseded')),
  governance_level          TEXT NOT NULL DEFAULT 'manual'
    CHECK (governance_level IN ('auto', 'manual', 'restricted')),

  -- Cognition origin
  originating_entity_id     TEXT NOT NULL,
  originating_entity_type   TEXT NOT NULL,
  originating_signal        TEXT NOT NULL,  -- JSON: ProposalSignalLink

  -- Lineage (immutable chain)
  lineage_id                TEXT NOT NULL,
  parent_proposal_id        TEXT REFERENCES proposals(id) ON DELETE SET NULL,

  -- Governed intent
  action_type               TEXT NOT NULL
    CHECK (action_type IN ('notify', 'create_task', 'update_entity', 'escalate', 'schedule_call', 'trigger_workflow', 'draft_communication', 'create_record', 'archive_entity', 'request_data', 'custom')),
  action_target             TEXT NOT NULL DEFAULT '{}',  -- JSON
  action_parameters         TEXT NOT NULL DEFAULT '{}',  -- JSON
  action_description        TEXT NOT NULL DEFAULT '',

  -- Confidence + reasoning
  confidence                REAL NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  reasoning_summary         TEXT NOT NULL DEFAULT '',
  evidence_count            INTEGER NOT NULL DEFAULT 0,

  -- Governance
  policy_id                 TEXT,
  review_deadline           TEXT,  -- ISO 8601
  reviewed_by               TEXT,
  reviewed_at               TEXT,  -- ISO 8601
  review_notes              TEXT,

  -- Execution
  execution_result          TEXT,  -- JSON: ProposalExecutionResult

  -- Continuity writeback
  continuity_writeback      TEXT,  -- JSON: ProposalContinuityWriteback

  -- Ops projection
  ops_priority              TEXT NOT NULL DEFAULT 'medium'
    CHECK (ops_priority IN ('low', 'medium', 'high', 'critical')),
  ops_surface               TEXT NOT NULL DEFAULT 'queue'
    CHECK (ops_surface IN ('queue', 'tile', 'notification', 'command_center', 'timeline')),

  -- Timestamps
  created_at                TEXT NOT NULL,
  updated_at                TEXT NOT NULL
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

-- Primary query: tenant + status (Ops queue)
CREATE INDEX IF NOT EXISTS idx_proposals_tenant_status
  ON proposals (tenant_id, status, ops_priority DESC, created_at ASC);

-- Lineage chain lookup
CREATE INDEX IF NOT EXISTS idx_proposals_lineage
  ON proposals (tenant_id, lineage_id, created_at ASC);

-- Entity-scoped proposals
CREATE INDEX IF NOT EXISTS idx_proposals_entity
  ON proposals (tenant_id, originating_entity_id, originating_entity_type);

-- Ops surface routing
CREATE INDEX IF NOT EXISTS idx_proposals_ops_surface
  ON proposals (tenant_id, ops_surface, status);

-- ─── Governance Audit Log Table ──────────────────────────────────────────────
-- Local D1 mirror of governance decisions for fast edge lookups.
-- Canonical audit trail remains in Supabase (long-term storage).
-- NOTE: Named governance_audit_log to avoid conflict with existing audit_log table.

CREATE TABLE IF NOT EXISTS governance_audit_log (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  action_id       TEXT,
  policy_id       TEXT,
  user_id         TEXT NOT NULL,
  decision        TEXT NOT NULL
    CHECK (decision IN ('allowed', 'denied', 'approved', 'rejected', 'auto_approved')),
  reason          TEXT,
  action_type     TEXT,
  metadata        TEXT NOT NULL DEFAULT '{}',  -- JSON
  signature       TEXT,
  correlation_id  TEXT,
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gov_audit_tenant ON governance_audit_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gov_audit_action ON governance_audit_log (action_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gov_audit_user ON governance_audit_log (tenant_id, user_id, created_at DESC);

-- ─── Execution Packages Table (first-class Spine object) ─────────────────────
-- Execution Package lifecycle: the handoff artifact from Twin.
-- Created on approval of proposal. Exported to customer env or CZ L5/L6.
-- Outcome flows back to memory.
-- Stored in central spine D1.

CREATE TABLE IF NOT EXISTS execution_packages (
  id                  TEXT PRIMARY KEY,
  tenant_id           TEXT NOT NULL,
  title               TEXT NOT NULL,
  status              TEXT NOT NULL
    CHECK (status IN ('draft', 'approved', 'exported', 'awaiting_outcome', 'completed', 'failed', 'archived')),
  proposal_id         TEXT,
  approval_id         TEXT,
  workflow_json       TEXT NOT NULL DEFAULT '{}',  -- array of workflow steps
  tools_json          TEXT NOT NULL DEFAULT '[]',
  context_json        TEXT NOT NULL DEFAULT '{}',
  exported_at         TEXT,
  completed_at        TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exec_pkg_tenant_status ON execution_packages (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_pkg_proposal ON execution_packages (tenant_id, proposal_id);
CREATE INDEX IF NOT EXISTS idx_exec_pkg_approval ON execution_packages (approval_id);
