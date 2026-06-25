-- HA/DR Infrastructure Tables
-- Run this migration to add outbox and audit support

-- Outbox events table for reliable delivery
CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Index for efficient polling
CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON outbox_events (status, created_at) WHERE status IN ('pending', 'failed');

-- Audit log for state reconstruction
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_id VARCHAR(100),
  correlation_id VARCHAR(100)
);

-- Index for audit lookups
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_log (changed_at DESC);

-- Migration version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT
);

-- Insert this migration version
INSERT INTO schema_migrations (version, description)
VALUES ('008', 'HA/DR infrastructure tables')
ON CONFLICT (version) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies (service role only for these tables)
CREATE POLICY "outbox_service_access" ON outbox_events FOR ALL USING (true);
CREATE POLICY "audit_service_access" ON audit_log FOR ALL USING (true);
