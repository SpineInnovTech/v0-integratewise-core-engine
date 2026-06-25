-- Composite indexes for common multi-column query patterns.
-- These cover the most frequent tenant-scoped filter + sort combinations
-- used by the dashboard, signal feed, action queue, and audit views.

CREATE INDEX IF NOT EXISTS idx_entities_tenant_type_status
  ON public.entities (tenant_id, entity_type, status);

CREATE INDEX IF NOT EXISTS idx_signals_tenant_severity_status
  ON public.signals (tenant_id, severity, status);

CREATE INDEX IF NOT EXISTS idx_actions_tenant_status_created
  ON public.actions (tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_action_time
  ON public.audit_log (tenant_id, action, created_at DESC);
