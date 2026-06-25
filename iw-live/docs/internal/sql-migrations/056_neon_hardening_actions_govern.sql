-- Migration: 056_neon_hardening_actions_govern.sql
-- Description: Harden public.actions for govern service (Neon hub alignment)
-- Govern workflow expects: tenant_id, action_type, created_by, approved_by, approved_at,
--   approval_reason, rejected_by, rejected_at, rejection_reason, updated_at.
-- 041_create_think_engine created actions with situation_id, title, type, payload; missing tenant_id and approval columns.
-- Created: 2026-03 (Neon → Supabase migration step 2)

-- Add tenant_id (required for govern tenant scoping)
ALTER TABLE actions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_actions_tenant_id ON actions(tenant_id) WHERE tenant_id IS NOT NULL;

-- Alias or add action_type (govern uses action_type; 041 has "type")
ALTER TABLE actions ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
UPDATE actions SET action_type = type WHERE action_type IS NULL AND type IS NOT NULL;
COMMENT ON COLUMN actions.action_type IS 'Govern: action type; may mirror type';

-- Parameters (govern uses parameters; 041 has payload)
ALTER TABLE actions ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;
UPDATE actions SET parameters = payload WHERE (parameters IS NULL OR parameters = '{}'::jsonb) AND payload IS NOT NULL AND payload != '{}'::jsonb;

-- created_by (govern audit)
ALTER TABLE actions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Approval columns (govern approveAction / rejectAction)
ALTER TABLE actions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS approval_token TEXT;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS approval_reason TEXT;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- target_tool (HITL path: connector/tool for write-back)
ALTER TABLE actions ADD COLUMN IF NOT EXISTS target_tool VARCHAR(50);

-- updated_at for audit
ALTER TABLE actions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_actions_status_tenant ON actions(tenant_id, status) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON actions(created_at DESC);
