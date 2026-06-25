-- Migration: 0003_handoff_packages
-- Canonical Handoff Contract storage (external-customer-surface-completion Phase 5).
-- Stores the async lifecycle state machine for approved proposals dispatched to customers.

CREATE TABLE IF NOT EXISTS handoff_packages (
  package_id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  tenant_class TEXT NOT NULL CHECK (tenant_class IN ('customer_zero', 'external')) DEFAULT 'external',
  adapter_target TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN (
    'PROPOSED', 'APPROVED', 'EXECUTING',
    'AWAITING_OUTCOME', 'COMPLETED', 'FAILED', 'CANCELLED'
  )),
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_handoff_pkg_tenant_state
  ON handoff_packages(tenant_id, state);

CREATE INDEX IF NOT EXISTS idx_handoff_pkg_proposal
  ON handoff_packages(proposal_id);

CREATE TABLE IF NOT EXISTS handoff_state_log (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  actor TEXT NOT NULL,
  reason TEXT,
  occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_handoff_state_log_pkg
  ON handoff_state_log(package_id, occurred_at);
