-- 029_view_registry_world_scope.sql
-- Adds a registry table suitable for world/department/account-role driven composition.
-- Safe + additive: creates table and indexes only if missing.

CREATE TABLE IF NOT EXISTS view_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,

  -- Core dimensions
  world_scope TEXT NOT NULL CHECK (world_scope IN ('personal','work','accounts','admin')),
  department TEXT,
  account_role TEXT,
  account_id TEXT,

  -- Composition
  modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  kpi_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  situation_templates JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_library JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Rules + gates
  governance_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  rbac_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  plan_gates JSONB NOT NULL DEFAULT '{}'::jsonb,

  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_view_registry_world_scope ON view_registry(world_scope);
CREATE INDEX IF NOT EXISTS idx_view_registry_department ON view_registry(department);
CREATE INDEX IF NOT EXISTS idx_view_registry_account_role ON view_registry(account_role);
