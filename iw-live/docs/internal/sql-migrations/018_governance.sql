-- Migration: 018_governance.sql
-- Description: Governance policy tables for action approval workflows
-- Created: 2026-01-29

-- =============================================================================
-- GOVERNANCE POLICIES TABLE
-- Defines approval rules and automation thresholds for different action types
-- =============================================================================

CREATE TABLE IF NOT EXISTS governance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  policy_name VARCHAR(100) NOT NULL,
  action_type_pattern VARCHAR(100),
  min_severity VARCHAR(20),
  required_roles TEXT[],
  auto_approve BOOLEAN DEFAULT false,
  max_auto_amount DECIMAL(15,2),
  require_evidence_count INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- GOVERNANCE AUDIT LOG TABLE
-- Immutable audit trail for all governance decisions
-- =============================================================================

CREATE TABLE IF NOT EXISTS governance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  action_id UUID,
  decision_type VARCHAR(20),
  decided_by UUID,
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  evidence_snapshot JSONB,
  policy_applied UUID REFERENCES governance_policies(id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_governance_audit_tenant ON governance_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_governance_audit_action ON governance_audit_log(action_id);
