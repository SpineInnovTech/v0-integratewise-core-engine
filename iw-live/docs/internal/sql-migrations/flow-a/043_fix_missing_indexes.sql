-- Migration: 043_fix_missing_indexes.sql
-- Description: Add missing indexes on foreign key columns for query performance
-- Created: 2026-03-08

CREATE INDEX IF NOT EXISTS idx_spine_events_raw_webhook ON spine_events(raw_webhook_id);
CREATE INDEX IF NOT EXISTS idx_governance_policies_tenant ON governance_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_governance_audit_decided_by ON governance_audit_log(decided_by);
CREATE INDEX IF NOT EXISTS idx_governance_audit_policy ON governance_audit_log(policy_applied);
