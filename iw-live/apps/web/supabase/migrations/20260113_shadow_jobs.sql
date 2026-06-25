-- IQCLONE-010: Shadow Jobs Table
-- Background jobs for shadow syncs and scheduled syncs

CREATE TABLE IF NOT EXISTS shadow_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  connection_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('shadow_sync', 'scheduled_sync', 'backfill')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  idempotency_key TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL,
  result JSONB,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shadow_jobs_workspace_id ON shadow_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shadow_jobs_status ON shadow_jobs(status);
CREATE INDEX IF NOT EXISTS idx_shadow_jobs_scheduled_at ON shadow_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_shadow_jobs_idempotency_key ON shadow_jobs(idempotency_key);

-- Function to get jobs ready to run
CREATE OR REPLACE FUNCTION get_jobs_ready_to_run()
RETURNS TABLE (
  id UUID,
  workspace_id UUID,
  connection_id UUID,
  type TEXT,
  status TEXT,
  idempotency_key TEXT,
  config JSONB,
  scheduled_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sj.id,
    sj.workspace_id,
    sj.connection_id,
    sj.type,
    sj.status,
    sj.idempotency_key,
    sj.config,
    sj.scheduled_at
  FROM shadow_jobs sj
  WHERE sj.status = 'pending'
    AND (sj.scheduled_at IS NULL OR sj.scheduled_at <= NOW())
  ORDER BY sj.scheduled_at ASC NULLS LAST
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;
