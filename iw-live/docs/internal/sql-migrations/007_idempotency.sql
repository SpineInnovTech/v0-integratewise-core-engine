-- Add unique constraint for idempotency on events
-- We use a combination of tenant_id, source_system, and idempotency_key to prevent duplicates
ALTER TABLE events
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_idempotency ON events(tenant_id, source_system, idempotency_key)
WHERE idempotency_key IS NOT NULL;
-- Log for tracking outgoing action idempotency
CREATE TABLE IF NOT EXISTS action_idempotency (
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    action_type TEXT NOT NULL,
    idempotency_key TEXT PRIMARY KEY,
    execution_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);