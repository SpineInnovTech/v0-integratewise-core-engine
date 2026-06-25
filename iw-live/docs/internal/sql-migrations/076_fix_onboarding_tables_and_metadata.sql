-- =============================================================================
-- 076_fix_onboarding_tables_and_metadata.sql
-- Fix: Create onboarding-required tables + write tenant_id to app_metadata
--
-- Problem:
--   1. completeOnboarding() in Workflow service writes to tenant_onboarding_state
--      and sync_jobs tables — neither exists on production. Causes 500 error
--      that blocks users at the final onboarding step.
--   2. tenant_profiles table referenced in completeOnboarding() doesn't exist.
--   3. tenant_id is never written to user_metadata/app_metadata, so frontend
--      TenantProvider, HydrationFabric, and subscription creation all get undefined.
--
-- Fix:
--   PART 1: Create tenant_onboarding_state (FK to tenants, not auth.users)
--   PART 2: Create sync_jobs table
--   PART 3: Update handle_new_user() trigger to write tenant_id to app_metadata
--
-- No tenant_profiles table is created — Workflow code will be patched separately
-- to be resilient to its absence (it's a legacy reference).
-- =============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: tenant_onboarding_state
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.tenant_onboarding_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'in_progress',
  current_step    TEXT DEFAULT 'welcome',
  completed_steps TEXT[] DEFAULT '{}',
  connectors_config JSONB DEFAULT '[]'::jsonb,
  preferences     JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_state_tenant
  ON public.tenant_onboarding_state(tenant_id);

ALTER TABLE public.tenant_onboarding_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboarding_state_tenant_read" ON public.tenant_onboarding_state;
CREATE POLICY "onboarding_state_tenant_read" ON public.tenant_onboarding_state
  FOR SELECT TO authenticated USING (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS "onboarding_state_service" ON public.tenant_onboarding_state;
CREATE POLICY "onboarding_state_service" ON public.tenant_onboarding_state
  FOR ALL TO service_role USING (true);


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: sync_jobs
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  connector       TEXT NOT NULL,
  flow_type       TEXT DEFAULT 'A',
  phase           TEXT NOT NULL DEFAULT 'creamy',
  status          TEXT NOT NULL DEFAULT 'pending',
  progress        JSONB DEFAULT '{}'::jsonb,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_tenant
  ON public.sync_jobs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_status
  ON public.sync_jobs(tenant_id, status);

ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_jobs_tenant_read" ON public.sync_jobs;
CREATE POLICY "sync_jobs_tenant_read" ON public.sync_jobs
  FOR SELECT TO authenticated USING (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS "sync_jobs_service" ON public.sync_jobs;
CREATE POLICY "sync_jobs_service" ON public.sync_jobs
  FOR ALL TO service_role USING (true);


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3: Update handle_new_user() to write tenant_id to app_metadata
--
-- app_metadata is server-controlled (not user-editable) and becomes
-- user.app_metadata on the frontend. This lets TenantProvider,
-- HydrationFabric, and subscription creation resolve tenant_id.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id    UUID;
  v_org_id       UUID;
  v_team_id      UUID;
  v_user_name    TEXT;
  v_email_prefix TEXT;
  v_slug         TEXT;
BEGIN
  -- Extract user name from metadata or email
  v_user_name := COALESCE(
    NULLIF(new.raw_user_meta_data->>'full_name', ''),
    NULLIF(new.raw_user_meta_data->>'name', ''),
    SPLIT_PART(new.email, '@', 1)
  );

  -- Generate a URL-safe slug from email prefix + first 8 chars of user UUID
  v_email_prefix := LOWER(REGEXP_REPLACE(
    COALESCE(SPLIT_PART(new.email, '@', 1), 'user'),
    '[^a-z0-9]', '-', 'g'
  ));
  v_slug := v_email_prefix || '-' || SUBSTR(new.id::text, 1, 8);

  -- 1. Create tenant
  v_tenant_id := gen_random_uuid();
  INSERT INTO public.tenants (id, name, slug, plan, settings)
  VALUES (
    v_tenant_id,
    COALESCE(NULLIF(v_user_name, ''), 'User') || '''s Workspace',
    v_slug,
    'personal',
    '{}'::jsonb
  );

  -- 2. Create default organization
  v_org_id := gen_random_uuid();
  INSERT INTO public.organizations (org_id, tenant_id, name, slug, is_default)
  VALUES (v_org_id, v_tenant_id, 'Default', v_slug || '-org', true);

  -- 3. Create default team
  v_team_id := gen_random_uuid();
  INSERT INTO public.teams (team_id, org_id, tenant_id, name, is_default)
  VALUES (v_team_id, v_org_id, v_tenant_id, 'Default', true);

  -- 4. Create profile with full tenant+org+team context
  INSERT INTO public.profiles (id, tenant_id, email, full_name, avatar_url, role, org_id, team_id)
  VALUES (
    new.id,
    v_tenant_id,
    new.email,
    COALESCE(v_user_name, ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'owner',
    v_org_id,
    v_team_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- 5. Write tenant_id to app_metadata (server-controlled, not user-editable)
  --    This makes user.app_metadata.tenant_id available on the frontend
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'tenant_id', v_tenant_id::text,
    'org_id', v_org_id::text,
    'team_id', v_team_id::text
  )
  WHERE id = new.id;

  -- 6. Seed initial onboarding state for the tenant
  INSERT INTO public.tenant_onboarding_state (tenant_id, status, current_step)
  VALUES (v_tenant_id, 'in_progress', 'welcome')
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4: Backfill app_metadata + onboarding state for existing users
-- ═══════════════════════════════════════════════════════════════════════════

-- Update app_metadata for all profiles that have tenant_id but user lacks it in metadata
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.id AS user_id, p.tenant_id, p.org_id, p.team_id
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.tenant_id IS NOT NULL
      AND (u.raw_app_meta_data IS NULL OR u.raw_app_meta_data->>'tenant_id' IS NULL)
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
      'tenant_id', r.tenant_id::text,
      'org_id', r.org_id::text,
      'team_id', r.team_id::text
    )
    WHERE id = r.user_id;

    -- Also seed onboarding state if missing
    INSERT INTO public.tenant_onboarding_state (tenant_id, status, current_step)
    VALUES (r.tenant_id, 'in_progress', 'welcome')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

COMMIT;
