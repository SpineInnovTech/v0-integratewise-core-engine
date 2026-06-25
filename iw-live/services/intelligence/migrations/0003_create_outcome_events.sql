-- Migration: Create outcome_events table
-- Required by: Outcome Ingestion API, return loop
-- Requirements: 7.5

CREATE TABLE IF NOT EXISTS outcome_events (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL REFERENCES handoff_packages(package_id),
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'partial')),
  evidence_json TEXT,
  source TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  verified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_outcome_events_pkg
  ON outcome_events(package_id);

CREATE INDEX IF NOT EXISTS idx_outcome_events_idempotency
  ON outcome_events(idempotency_key);

-- Add handoff_id and outcome_status to org_memory for execution_memory promotion
-- (ALTER TABLE is idempotent in SQLite with IF NOT EXISTS workaround)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so these may fail if already applied
-- Run with error suppression in migration runner.
