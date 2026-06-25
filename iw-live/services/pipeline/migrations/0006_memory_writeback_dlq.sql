-- Migration: 0006_memory_writeback_dlq
-- Dead Letter Queue for failed memory writeback operations.
-- Used by iw-agent-runtime /v1/execution-packages/:id/complete endpoint.
-- Records that failed retry (3 attempts with exponential backoff) land here for manual replay.

CREATE TABLE IF NOT EXISTS memory_writeback_dlq (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  handoff_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  error TEXT,
  replayed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_dlq_tenant
  ON memory_writeback_dlq(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_memory_dlq_pending
  ON memory_writeback_dlq(replayed_at)
  WHERE replayed_at IS NULL;
