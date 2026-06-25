-- =============================================================================
-- 075_create_entities_table.sql
-- Create public.entities (Architecture B — generic JSONB entity store)
--
-- Problem:
--   Migration 073's get_workspace_entities() falls back to public.entities
--   (Architecture B) when Architecture A typed tables don't exist. But
--   public.entities itself was never created on production (originally from
--   packages/supabase/migrations/001_core_schema.sql, never applied).
--   Without this table, the A/B fallback ALWAYS returns [] for entity types
--   that lack Architecture A tables (~93 of them).
--
-- Fix:
--   Create public.entities with the canonical schema, indexes, and RLS.
--   The Spine/pipeline writes here for entity types without typed tables.
--   get_workspace_entities() can now fall back to it.
--
-- Schema (matches packages/supabase/migrations/001_core_schema.sql):
--   id, tenant_id, entity_type, name, slug, source, source_id,
--   data (JSONB), tags, status, health_score, last_synced_at,
--   created_at, updated_at
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Create the table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL,
  name            TEXT NOT NULL DEFAULT '',
  slug            TEXT,
  source          TEXT NOT NULL DEFAULT 'manual',
  source_id       TEXT,
  data            JSONB DEFAULT '{}'::jsonb,
  tags            TEXT[] DEFAULT '{}',
  status          TEXT DEFAULT 'active',
  health_score    NUMERIC(3,2),
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------
-- Primary lookup: tenant + entity_type (used by get_workspace_entities)
CREATE INDEX IF NOT EXISTS idx_entities_tenant
  ON public.entities(tenant_id);

CREATE INDEX IF NOT EXISTS idx_entities_type
  ON public.entities(tenant_id, entity_type);

-- Source dedup: tenant + source + source_id (used by Spine upserts)
CREATE INDEX IF NOT EXISTS idx_entities_source
  ON public.entities(tenant_id, source, source_id);

-- Unique constraint for upsert (Spine-v2 uses ON CONFLICT on this)
CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_source_unique
  ON public.entities(tenant_id, source, source_id)
  WHERE source_id IS NOT NULL;

-- Composite: tenant + type + status (used for filtered queries)
CREATE INDEX IF NOT EXISTS idx_entities_tenant_type_status
  ON public.entities(tenant_id, entity_type, status);

-- Updated_at for ORDER BY in get_workspace_entities
CREATE INDEX IF NOT EXISTS idx_entities_updated
  ON public.entities(updated_at DESC NULLS LAST);


-- ---------------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read entities in their tenant
DROP POLICY IF EXISTS "entities_tenant_read" ON public.entities;
CREATE POLICY "entities_tenant_read" ON public.entities
  FOR SELECT TO authenticated
  USING (tenant_id = get_tenant_id());

-- Authenticated users can insert/update entities in their tenant
DROP POLICY IF EXISTS "entities_tenant_write" ON public.entities;
CREATE POLICY "entities_tenant_write" ON public.entities
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS "entities_tenant_update" ON public.entities;
CREATE POLICY "entities_tenant_update" ON public.entities
  FOR UPDATE TO authenticated
  USING (tenant_id = get_tenant_id());

-- Service role: full access (Spine/pipeline writes)
DROP POLICY IF EXISTS "entities_service" ON public.entities;
CREATE POLICY "entities_service" ON public.entities
  FOR ALL TO service_role USING (true);


COMMIT;
