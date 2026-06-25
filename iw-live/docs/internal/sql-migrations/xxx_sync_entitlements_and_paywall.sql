-- ============================================================================
-- Sync Entitlements & Paywall Schema
-- 
-- Tables for plan-based sync gating, Domain Accelerator scoping,
-- and enterprise-grade queue management with DLQ.
-- ============================================================================

-- ============================================================================
-- 1. Tenant Sync Configuration
-- ============================================================================

CREATE TABLE tenant_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Plan context (denormalized for quick access)
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', 'starter', 'professional', 'enterprise')),
  
  -- Active accelerators (array of accelerator IDs)
  active_accelerators TEXT[] NOT NULL DEFAULT '{}',
  
  -- Sync settings (overrides from plan defaults)
  sync_frequency_minutes INTEGER,
  max_historical_days INTEGER,
  max_records_per_sync INTEGER,
  
  -- Feature flags
  supports_webhooks BOOLEAN DEFAULT false,
  supports_two_way_sync BOOLEAN DEFAULT false,
  supports_real_time BOOLEAN DEFAULT false,
  
  -- Usage tracking (current month)
  records_synced_this_month INTEGER DEFAULT 0,
  last_sync_reset_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- Index for tenant lookups
CREATE INDEX idx_tenant_sync_config_tenant ON tenant_sync_config(tenant_id);
CREATE INDEX idx_tenant_sync_config_tier ON tenant_sync_config(plan_tier);

-- Comment
COMMENT ON TABLE tenant_sync_config IS 'Sync configuration and entitlements per tenant based on subscription plan';

-- ============================================================================
-- 2. Connector Sync Jobs
-- ============================================================================

CREATE TABLE connector_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  connector_id TEXT NOT NULL,
  accelerator_id TEXT NOT NULL,
  
  -- Sync configuration
  sync_type TEXT NOT NULL CHECK (sync_type IN ('creamy', 'full', 'delta', 'webhook')),
  entity_types TEXT[] NOT NULL DEFAULT '{}',
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  
  -- Progress
  records_total INTEGER,
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Correlation for tracing
  correlation_id TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sync_jobs_tenant_status ON connector_sync_jobs(tenant_id, status);
CREATE INDEX idx_sync_jobs_correlation ON connector_sync_jobs(correlation_id);
CREATE INDEX idx_sync_jobs_created ON connector_sync_jobs(created_at);
CREATE INDEX idx_sync_jobs_accelerator ON connector_sync_jobs(tenant_id, accelerator_id);

COMMENT ON TABLE connector_sync_jobs IS 'Queue status and progress tracking for connector sync operations';

-- ============================================================================
-- 3. Tenant Sync Usage (Monthly)
-- ============================================================================

CREATE TABLE tenant_sync_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- Format: '2026-03'
  
  -- Usage counters
  records_synced INTEGER DEFAULT 0,
  sync_jobs_completed INTEGER DEFAULT 0,
  sync_jobs_failed INTEGER DEFAULT 0,
  
  -- Storage tracking
  storage_bytes_used BIGINT DEFAULT 0,
  
  -- Quota enforcement
  quota_exceeded BOOLEAN DEFAULT false,
  quota_exceeded_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, year_month)
);

CREATE INDEX idx_sync_usage_tenant ON tenant_sync_usage(tenant_id);
CREATE INDEX idx_sync_usage_month ON tenant_sync_usage(year_month);

COMMENT ON TABLE tenant_sync_usage IS 'Monthly sync usage tracking for quota enforcement';

-- ============================================================================
-- 4. Dead Letter Queue for Failed Syncs
-- ============================================================================

CREATE TABLE sync_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  correlation_id TEXT NOT NULL,
  
  -- Original message payload
  original_payload JSONB NOT NULL,
  
  -- Error details
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  
  -- Context
  stage TEXT NOT NULL, -- Which queue/stage failed
  attempt_count INTEGER NOT NULL,
  
  -- Status for reprocessing
  status TEXT DEFAULT 'pending_reprocess' 
    CHECK (status IN ('pending_reprocess', 'reprocessing', 'archived', 'discarded')),
  
  -- Timestamps
  failed_at TIMESTAMPTZ DEFAULT NOW(),
  reprocessed_at TIMESTAMPTZ,
  
  -- Reprocessing metadata
  reprocess_attempts INTEGER DEFAULT 0,
  reprocess_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for DLQ operations
CREATE INDEX idx_dlq_tenant_status ON sync_dead_letter_queue(tenant_id, status);
CREATE INDEX idx_dlq_failed_at ON sync_dead_letter_queue(failed_at);
CREATE INDEX idx_dlq_error_type ON sync_dead_letter_queue(error_type);
CREATE INDEX idx_dlq_correlation ON sync_dead_letter_queue(correlation_id);

COMMENT ON TABLE sync_dead_letter_queue IS 'Dead Letter Queue for failed sync messages awaiting reprocessing';

-- ============================================================================
-- 5. Tenant Backups (Disaster Recovery)
-- ============================================================================

CREATE TABLE tenant_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Backup metadata
  storage_key TEXT NOT NULL, -- R2 object key
  size_bytes BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Content tracking
  tables_included TEXT[] NOT NULL,
  record_count INTEGER,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Created by (for audit)
  created_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backups_tenant ON tenant_backups(tenant_id);
CREATE INDEX idx_backups_status ON tenant_backups(status);

COMMENT ON TABLE tenant_backups IS 'Point-in-time backup metadata for disaster recovery';

-- ============================================================================
-- 6. Restore Operations
-- ============================================================================

CREATE TABLE tenant_restore_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID NOT NULL REFERENCES tenant_backups(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Restore configuration
  mode TEXT NOT NULL CHECK (mode IN ('full', 'partial')),
  tables_restored TEXT[],
  
  -- Results
  records_restored JSONB, -- {table: count}
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  
  -- Audit
  restored_by UUID REFERENCES auth.users(id),
  restored_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_restore_tenant ON tenant_restore_operations(tenant_id);

COMMENT ON TABLE tenant_restore_operations IS 'Audit log for backup restore operations';

-- ============================================================================
-- 7. RLS Policies
-- ============================================================================

ALTER TABLE tenant_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_sync_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_restore_operations ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY tenant_sync_config_isolation ON tenant_sync_config
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY connector_sync_jobs_isolation ON connector_sync_jobs
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_sync_usage_isolation ON tenant_sync_usage
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY sync_dlq_isolation ON sync_dead_letter_queue
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_backups_isolation ON tenant_backups
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE POLICY tenant_restore_isolation ON tenant_restore_operations
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

-- ============================================================================
-- 8. Functions
-- ============================================================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_tenant_sync_config_updated_at
  BEFORE UPDATE ON tenant_sync_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connector_sync_jobs_updated_at
  BEFORE UPDATE ON connector_sync_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to enforce data retention policies
CREATE OR REPLACE FUNCTION enforce_data_retention(
  p_tenant_id UUID,
  p_spine_days INTEGER,
  p_audit_days INTEGER,
  p_events_days INTEGER,
  p_signal_days INTEGER
)
RETURNS TABLE(deleted_spine INTEGER, deleted_audit INTEGER, deleted_events INTEGER, deleted_signals INTEGER) 
AS $$
DECLARE
  v_deleted_spine INTEGER;
  v_deleted_audit INTEGER;
  v_deleted_events INTEGER;
  v_deleted_signals INTEGER;
BEGIN
  -- Delete old spine entities
  WITH deleted AS (
    DELETE FROM spine_entities
    WHERE tenant_id = p_tenant_id
      AND updated_at < NOW() - INTERVAL '1 day' * p_spine_days
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_spine FROM deleted;
  
  -- Delete old audit logs
  WITH deleted AS (
    DELETE FROM governance_audit_log
    WHERE tenant_id = p_tenant_id
      AND created_at < NOW() - INTERVAL '1 day' * p_audit_days
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_audit FROM deleted;
  
  -- Delete old events
  WITH deleted AS (
    DELETE FROM events_log
    WHERE tenant_id = p_tenant_id
      AND created_at < NOW() - INTERVAL '1 day' * p_events_days
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_events FROM deleted;
  
  -- Delete old signals
  WITH deleted AS (
    DELETE FROM signals
    WHERE tenant_id = p_tenant_id
      AND created_at < NOW() - INTERVAL '1 day' * p_signal_days
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_signals FROM deleted;
  
  RETURN QUERY SELECT v_deleted_spine, v_deleted_audit, v_deleted_events, v_deleted_signals;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly usage (run on 1st of month)
CREATE OR REPLACE FUNCTION reset_monthly_sync_usage()
RETURNS void AS $$
BEGIN
  UPDATE tenant_sync_config
  SET 
    records_synced_this_month = 0,
    last_sync_reset_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to record sync usage
CREATE OR REPLACE FUNCTION record_sync_usage(
  p_tenant_id UUID,
  p_records INTEGER
)
RETURNS void AS $$
DECLARE
  v_config tenant_sync_config%ROWTYPE;
  v_current_month TEXT;
BEGIN
  -- Get current month
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get tenant config
  SELECT * INTO v_config FROM tenant_sync_config WHERE tenant_id = p_tenant_id;
  
  -- Update monthly usage counter
  INSERT INTO tenant_sync_usage (tenant_id, year_month, records_synced)
  VALUES (p_tenant_id, v_current_month, p_records)
  ON CONFLICT (tenant_id, year_month)
  DO UPDATE SET 
    records_synced = tenant_sync_usage.records_synced + p_records,
    updated_at = NOW();
  
  -- Update config counter
  UPDATE tenant_sync_config
  SET records_synced_this_month = records_synced_this_month + p_records
  WHERE tenant_id = p_tenant_id;
  
  -- Check quota exceeded
  IF v_config.plan_tier = 'free' AND 
     (v_config.records_synced_this_month + p_records) > 10000 THEN
    UPDATE tenant_sync_usage
    SET quota_exceeded = true, quota_exceeded_at = NOW()
    WHERE tenant_id = p_tenant_id AND year_month = v_current_month;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get DLQ statistics for monitoring
CREATE OR REPLACE FUNCTION get_dlq_statistics(
  p_tenant_id UUID DEFAULT NULL,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  error_type TEXT,
  error_count BIGINT,
  last_occurred TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dlq.error_type,
    COUNT(*) as error_count,
    MAX(dlq.failed_at) as last_occurred
  FROM sync_dead_letter_queue dlq
  WHERE (p_tenant_id IS NULL OR dlq.tenant_id = p_tenant_id)
    AND dlq.failed_at > NOW() - INTERVAL '1 hour' * p_hours
  GROUP BY dlq.error_type
  ORDER BY error_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. Views
-- ============================================================================

-- View: Sync quota status for all tenants
CREATE VIEW v_tenant_sync_quota_status AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  c.plan_tier,
  c.records_synced_this_month,
  CASE c.plan_tier
    WHEN 'free' THEN 10000
    WHEN 'starter' THEN 50000
    WHEN 'professional' THEN 500000
    ELSE NULL -- unlimited
  END as monthly_quota,
  CASE 
    WHEN c.plan_tier = 'enterprise' THEN false
    WHEN c.records_synced_this_month >= 
      CASE c.plan_tier
        WHEN 'free' THEN 10000
        WHEN 'starter' THEN 50000
        WHEN 'professional' THEN 500000
      END THEN true
    ELSE false
  END as quota_exceeded,
  c.active_accelerators,
  c.last_sync_reset_at
FROM tenants t
LEFT JOIN tenant_sync_config c ON t.id = c.tenant_id;

-- View: Sync job summary
CREATE VIEW v_sync_job_summary AS
SELECT 
  tenant_id,
  DATE(created_at) as sync_date,
  sync_type,
  accelerator_id,
  status,
  COUNT(*) as job_count,
  SUM(records_processed) as total_records,
  SUM(records_failed) as failed_records,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM connector_sync_jobs
GROUP BY tenant_id, DATE(created_at), sync_type, accelerator_id, status;

-- ============================================================================
-- 10. Comments & Documentation
-- ============================================================================

COMMENT ON FUNCTION enforce_data_retention IS 'Enforces data retention policies by deleting old records across multiple tables';
COMMENT ON FUNCTION reset_monthly_sync_usage IS 'Resets monthly usage counters - should be called by cron on 1st of month';
COMMENT ON FUNCTION record_sync_usage IS 'Records sync usage and checks quota limits';
COMMENT ON VIEW v_tenant_sync_quota_status IS 'Real-time quota status for all tenants';
