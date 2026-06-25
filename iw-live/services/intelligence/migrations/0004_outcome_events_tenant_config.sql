-- Migration: 0004_outcome_events_tenant_config
-- Outcome Ingestion API + Tenant Config (external-customer-surface-completion Phase 6).
-- outcome_events: records return-loop outcomes from customer execution environments.
-- tenant_config: tenant_class (customer_zero vs external) + timeout configuration.

CREATE TABLE IF NOT EXISTS outcome_events (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'partial')),
  evidence_json TEXT,
  source TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  verified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_outcome_events_package
  ON outcome_events(package_id);

CREATE INDEX IF NOT EXISTS idx_outcome_events_idempotency
  ON outcome_events(idempotency_key);

CREATE TABLE IF NOT EXISTS tenant_config (
  tenant_id TEXT PRIMARY KEY,
  tenant_class TEXT NOT NULL CHECK (tenant_class IN ('customer_zero', 'external')) DEFAULT 'external',
  awaiting_outcome_timeout_seconds INTEGER NOT NULL DEFAULT 3600,
  governance_policy_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
