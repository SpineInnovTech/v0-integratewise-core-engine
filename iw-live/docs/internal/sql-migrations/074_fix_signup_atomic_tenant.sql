-- =============================================================================
-- 074_fix_signup_atomic_tenant.sql
-- Fix: Atomic tenant provisioning on signup
--
-- Problem:
--   The handle_new_user() trigger (from migration 20260410150000) inserts into
--   profiles WITHOUT tenant_id, but profiles.tenant_id is NOT NULL.
--   EVERY signup fails at this trigger. No profiles, no tenants, no onboarding.
--
-- Fix:
--   Replace handle_new_user() to atomically create:
--     1. tenants row (personal plan, 14-day trial)
--     2. organizations row (default org)
--     3. teams row (default team)
--     4. profiles row (owner role, linked to tenant/org/team)
--
--   This means Gateway immediately resolves tenant_id from profiles,
--   and all onboarding API calls work through Gateway without changes.
--
-- Backfill:
--   For any auth.users that signed up while the trigger was broken,
--   create tenant+org+team+profile for each.
--
-- No changes needed to:
--   - Gateway (already reads tenant_id from profiles)
--   - Workflow service (already upserts tenant_spine_config with Gateway-provided tenant_id)
--   - Frontend (onboarding flow calls API endpoints through Gateway)
-- =============================================================================

BEGIN;

-- Ensure tenant_plan enum exists (may already exist from 001_supabase_schema.sql)
DO $$ BEGIN
  CREATE TYPE tenant_plan AS ENUM ('personal', 'team', 'org', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 1. Replace the broken trigger function
-- =============================================================================
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

  RETURN new;
END;
$$;


-- =============================================================================
-- 2. Backfill: create tenant+org+team+profile for any auth.users without profiles
--    (catches users who signed up while the trigger was broken)
-- =============================================================================
DO $$
DECLARE
  r RECORD;
  v_tenant_id    UUID;
  v_org_id       UUID;
  v_team_id      UUID;
  v_user_name    TEXT;
  v_email_prefix TEXT;
  v_slug         TEXT;
BEGIN
  FOR r IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    v_user_name := COALESCE(
      NULLIF(r.raw_user_meta_data->>'full_name', ''),
      NULLIF(r.raw_user_meta_data->>'name', ''),
      SPLIT_PART(r.email, '@', 1)
    );

    v_email_prefix := LOWER(REGEXP_REPLACE(
      COALESCE(SPLIT_PART(r.email, '@', 1), 'user'),
      '[^a-z0-9]', '-', 'g'
    ));
    v_slug := v_email_prefix || '-' || SUBSTR(r.id::text, 1, 8);

    v_tenant_id := gen_random_uuid();
    INSERT INTO public.tenants (id, name, slug, plan, settings)
    VALUES (
      v_tenant_id,
      COALESCE(NULLIF(v_user_name, ''), 'User') || '''s Workspace',
      v_slug,
      'personal',
      '{}'::jsonb
    );

    v_org_id := gen_random_uuid();
    INSERT INTO public.organizations (org_id, tenant_id, name, slug, is_default)
    VALUES (v_org_id, v_tenant_id, 'Default', v_slug || '-org', true);

    v_team_id := gen_random_uuid();
    INSERT INTO public.teams (team_id, org_id, tenant_id, name, is_default)
    VALUES (v_team_id, v_org_id, v_tenant_id, 'Default', true);

    INSERT INTO public.profiles (id, tenant_id, email, full_name, avatar_url, role, org_id, team_id)
    VALUES (
      r.id,
      v_tenant_id,
      r.email,
      COALESCE(v_user_name, ''),
      COALESCE(r.raw_user_meta_data->>'avatar_url', ''),
      'owner',
      v_org_id,
      v_team_id
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

COMMIT;
