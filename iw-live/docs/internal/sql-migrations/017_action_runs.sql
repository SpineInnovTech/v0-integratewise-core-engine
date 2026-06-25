-- Migration: 017_action_runs.sql
-- Description: Execution history tracking for action runs
-- Created: 2026-01-29

-- =============================================================================
-- ACTION RUNS TABLE
-- Tracks execution history of all actions including status, timing, and results
-- =============================================================================

CREATE TABLE IF NOT EXISTS action_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL,
  decision_id UUID,
  tenant_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, success, failed, cancelled
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  error_details JSONB,
  retry_count INT DEFAULT 0,
  idempotency_key VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, idempotency_key)
);

-- Indexes for efficient querying
CREATE INDEX idx_action_runs_tenant ON action_runs(tenant_id);
CREATE INDEX idx_action_runs_action ON action_runs(action_id);
CREATE INDEX idx_action_runs_status ON action_runs(status);
