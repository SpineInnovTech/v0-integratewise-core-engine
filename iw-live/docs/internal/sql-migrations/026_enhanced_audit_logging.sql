-- =============================================================================
-- Migration 026: Enhanced Audit Logging
-- Adds correlation_id to all audit tables and implements retention policies
-- =============================================================================

-- Add correlation_id to general audit_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'correlation_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN correlation_id UUID;
    CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation ON audit_logs(correlation_id);
  END IF;
END $$;

-- Add correlation_id to billing_audit_log table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'billing_audit_log' AND column_name = 'correlation_id'
  ) THEN
    ALTER TABLE billing_audit_log ADD COLUMN correlation_id UUID;
    CREATE INDEX IF NOT EXISTS idx_billing_audit_correlation ON billing_audit_log(correlation_id);
  END IF;
END $$;

-- Add additional audit event types to governance_audit_log
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'governance_audit_log' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE governance_audit_log ADD COLUMN event_type TEXT;
    CREATE INDEX IF NOT EXISTS idx_governance_audit_event_type ON governance_audit_log(event_type);
  END IF;
END $$;

-- Add IP address and user agent to governance audit log for security events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'governance_audit_log' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE governance_audit_log ADD COLUMN ip_address INET;
    ALTER TABLE governance_audit_log ADD COLUMN user_agent TEXT;
  END IF;
END $$;

-- Create audit retention policy function
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS void AS $$
BEGIN
  -- Enterprise: Keep 2 years
  DELETE FROM governance_audit_log
  WHERE tenant_id IN (SELECT id FROM tenants WHERE plan = 'enterprise')
    AND created_at < NOW() - INTERVAL '2 years';

  DELETE FROM audit_logs
  WHERE org_id IN (SELECT id FROM organizations WHERE plan = 'enterprise')
    AND created_at < NOW() - INTERVAL '2 years';

  DELETE FROM billing_audit_log
  WHERE org_id IN (SELECT id FROM organizations WHERE plan = 'enterprise')
    AND created_at < NOW() - INTERVAL '2 years';

  -- Business: Keep 1 year
  DELETE FROM governance_audit_log
  WHERE tenant_id IN (SELECT id FROM tenants WHERE plan = 'business')
    AND created_at < NOW() - INTERVAL '1 year';

  DELETE FROM audit_logs
  WHERE org_id IN (SELECT id FROM organizations WHERE plan = 'business')
    AND created_at < NOW() - INTERVAL '1 year';

  DELETE FROM billing_audit_log
  WHERE org_id IN (SELECT id FROM organizations WHERE plan = 'business')
    AND created_at < NOW() - INTERVAL '1 year';

  -- Pro: Keep 6 months
  DELETE FROM governance_audit_log
  WHERE tenant_id IN (SELECT id FROM tenants WHERE plan = 'pro')
    AND created_at < NOW() - INTERVAL '6 months';

  DELETE FROM audit_logs
  WHERE org_id IN (SELECT id FROM organizations WHERE plan = 'pro')
    AND created_at < NOW() - INTERVAL '6 months';

  DELETE FROM billing_audit_log
  WHERE org_id IN (SELECT id FROM organizations WHERE plan = 'pro')
    AND created_at < NOW() - INTERVAL '6 months';

  -- Free: Keep 30 days
  DELETE FROM governance_audit_log
  WHERE tenant_id IN (SELECT id FROM tenants WHERE plan = 'free')
    AND created_at < NOW() - INTERVAL '30 days';

  DELETE FROM audit_logs
  WHERE org_id IN (SELECT id FROM organizations WHERE plan = 'free')
    AND created_at < NOW() - INTERVAL '30 days';

  DELETE FROM billing_audit_log
  WHERE org_id IN (SELECT id FROM organizations WHERE plan = 'free')
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON COLUMN audit_logs.correlation_id IS 'UUID for request tracing across services';
COMMENT ON COLUMN billing_audit_log.correlation_id IS 'UUID for request tracing across services';
COMMENT ON COLUMN governance_audit_log.correlation_id IS 'UUID for request tracing across services';
COMMENT ON COLUMN governance_audit_log.event_type IS 'Type of audit event (auth, api, data, config, etc.)';
COMMENT ON COLUMN governance_audit_log.ip_address IS 'Client IP address for security events';
COMMENT ON COLUMN governance_audit_log.user_agent IS 'User agent string for security events';
COMMENT ON FUNCTION cleanup_audit_logs() IS 'Tier-based audit log retention cleanup function';