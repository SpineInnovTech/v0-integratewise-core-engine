-- Ensure profiles table and get_tenant_id() helper exist.
-- profiles is the bridge between auth.users and tenants.
-- Originally from sql-migrations/001_supabase_schema.sql.
-- Required by RPCs in migrations 070-073 and RLS policies in 071-072.

-- Ensure enums exist (idempotent)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'practitioner', 'readonly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'practitioner',
    department TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

-- Profiles: service role full access
DROP POLICY IF EXISTS "profiles_service" ON public.profiles;
CREATE POLICY "profiles_service" ON public.profiles
  FOR ALL TO service_role USING (true);

-- Auto-create profile on signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- get_tenant_id() helper
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_tenant_id() TO authenticated;
