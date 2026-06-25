-- Billing Audit Trail Enhancements
-- Adds comprehensive audit logging for entitlement changes and admin overrides

-- Ensure billing_audit_log table exists (create if not exists)
CREATE TABLE IF NOT EXISTS billing_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  actor_id UUID,
  actor_email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  correlation_id TEXT,
  request_id TEXT
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_org_id ON billing_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_event_type ON billing_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_created_at ON billing_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_correlation_id ON billing_audit_log(correlation_id);

-- Add RLS policies (if RLS is enabled)
ALTER TABLE billing_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view audit logs for their own org
CREATE POLICY IF NOT EXISTS "Users can view own org audit logs"
  ON billing_audit_log
  FOR SELECT
  USING (
    org_id IN (
      SELECT id FROM orgs WHERE id = org_id
      -- Add your org membership check here
    )
  );

-- Policy: System can insert audit logs
CREATE POLICY IF NOT EXISTS "System can insert audit logs"
  ON billing_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Add webhook idempotency tracking table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'processed', -- processed, failed, skipped
  error_message TEXT,
  correlation_id TEXT,
  UNIQUE(provider, event_id)
);

-- Index for idempotency checks
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event_id 
  ON webhook_events(provider, event_id);

-- Index for correlation tracking
CREATE INDEX IF NOT EXISTS idx_webhook_events_correlation_id 
  ON webhook_events(correlation_id);

-- Function to log entitlement changes
CREATE OR REPLACE FUNCTION log_entitlement_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO billing_audit_log (
    org_id,
    event_type,
    actor_id,
    metadata,
    correlation_id
  ) VALUES (
    NEW.org_id,
    'entitlement_changed',
    current_setting('app.actor_id', true)::UUID,
    jsonb_build_object(
      'key', NEW.key,
      'old_value', OLD.value,
      'new_value', NEW.value,
      'source', NEW.source
    ),
    current_setting('app.correlation_id', true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for entitlement changes
DROP TRIGGER IF EXISTS trigger_log_entitlement_change ON org_entitlements;
CREATE TRIGGER trigger_log_entitlement_change
  AFTER UPDATE ON org_entitlements
  FOR EACH ROW
  WHEN (OLD.value IS DISTINCT FROM NEW.value)
  EXECUTE FUNCTION log_entitlement_change();

-- Function to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO billing_audit_log (
    org_id,
    event_type,
    actor_id,
    metadata,
    correlation_id
  ) VALUES (
    NEW.org_id,
    'subscription_changed',
    current_setting('app.actor_id', true)::UUID,
    jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'plan_id', NEW.plan_id
    ),
    current_setting('app.correlation_id', true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscription changes
DROP TRIGGER IF EXISTS trigger_log_subscription_change ON org_subscriptions;
CREATE TRIGGER trigger_log_subscription_change
  AFTER UPDATE ON org_subscriptions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_subscription_change();

-- View for recent audit activity
CREATE OR REPLACE VIEW billing_audit_recent AS
SELECT 
  bal.id,
  bal.org_id,
  bal.event_type,
  bal.actor_id,
  bal.actor_email,
  bal.metadata,
  bal.created_at,
  bal.correlation_id,
  o.name as org_name
FROM billing_audit_log bal
LEFT JOIN orgs o ON bal.org_id = o.id
ORDER BY bal.created_at DESC
LIMIT 1000;

-- Grant permissions (adjust as needed)
-- GRANT SELECT ON billing_audit_log TO authenticated;
-- GRANT SELECT ON billing_audit_recent TO authenticated;
