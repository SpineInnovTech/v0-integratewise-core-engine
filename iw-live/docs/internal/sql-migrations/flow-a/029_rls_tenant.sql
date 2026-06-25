-- IntegrateWise OS: Row Level Security (RLS) Policies
-- Tenant isolation and service-role bypass configuration
-- Run after creating the base tables

-- ============================================================================
-- WEBHOOKS TABLE RLS
-- ============================================================================

-- Enable RLS on webhooks table
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS webhooks_read_all ON public.webhooks;
DROP POLICY IF EXISTS webhooks_insert_all ON public.webhooks;
DROP POLICY IF EXISTS webhooks_update_all ON public.webhooks;
DROP POLICY IF EXISTS "Allow all access to webhooks" ON public.webhooks;
DROP POLICY IF EXISTS p_webhooks_tenant ON public.webhooks;

-- Webhooks are server-ingested; only service role should access them.
-- Authenticated users should not directly query webhooks.
CREATE POLICY webhooks_select_policy ON public.webhooks
  FOR SELECT
  USING (false);

CREATE POLICY webhooks_insert_policy ON public.webhooks
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY webhooks_update_policy ON public.webhooks
  FOR UPDATE
  USING (false);

-- ============================================================================
-- BRAINSTORM_SESSIONS TABLE RLS
-- ============================================================================

-- Enable RLS on brainstorm_sessions table
ALTER TABLE public.brainstorm_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS p_sessions_tenant ON public.brainstorm_sessions;
DROP POLICY IF EXISTS brainstorm_sessions_select_policy ON public.brainstorm_sessions;
DROP POLICY IF EXISTS brainstorm_sessions_insert_policy ON public.brainstorm_sessions;
DROP POLICY IF EXISTS brainstorm_sessions_update_policy ON public.brainstorm_sessions;

-- For multi-tenant setups, use tenant_id from app settings
-- Example: SELECT set_config('app.tenant_id', '<tenant-uuid>', false);

-- Policy: Read own tenant's sessions only
CREATE POLICY brainstorm_sessions_select_policy ON public.brainstorm_sessions
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      current_setting('app.tenant_id', true) IS NOT NULL
      AND current_setting('app.tenant_id', true) != ''
      AND tenant_id = current_setting('app.tenant_id', true)::uuid
    )
  );

-- Policy: Insert — user must own the record
CREATE POLICY brainstorm_sessions_insert_policy ON public.brainstorm_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Update — user must own the record
CREATE POLICY brainstorm_sessions_update_policy ON public.brainstorm_sessions
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- BRAINSTORM_INSIGHTS TABLE RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.brainstorm_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS brainstorm_insights_select_policy ON public.brainstorm_insights;
DROP POLICY IF EXISTS brainstorm_insights_insert_policy ON public.brainstorm_insights;
DROP POLICY IF EXISTS brainstorm_insights_update_policy ON public.brainstorm_insights;

-- Policy: Read insights linked to user's sessions
CREATE POLICY brainstorm_insights_select_policy ON public.brainstorm_insights
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.brainstorm_sessions WHERE user_id = auth.uid()
    )
  );

-- Policy: Insert insights for own sessions
CREATE POLICY brainstorm_insights_insert_policy ON public.brainstorm_insights
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.brainstorm_sessions WHERE user_id = auth.uid()
    )
  );

-- Policy: Update insights for own sessions
CREATE POLICY brainstorm_insights_update_policy ON public.brainstorm_insights
  FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.brainstorm_sessions WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- DAILY_INSIGHTS TABLE RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS daily_insights_select_policy ON public.daily_insights;
DROP POLICY IF EXISTS daily_insights_insert_policy ON public.daily_insights;

-- Policy: Read daily insights scoped to tenant
CREATE POLICY daily_insights_select_policy ON public.daily_insights
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Policy: Insert daily insights (service role only — cron jobs bypass RLS)
CREATE POLICY daily_insights_insert_policy ON public.daily_insights
  FOR INSERT
  WITH CHECK (false);

-- ============================================================================
-- HELPER FUNCTION: Set Tenant Context
-- ============================================================================

-- Function to set tenant context for RLS
-- SECURITY: Only callable by service_role. Validates user belongs to tenant.
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid uuid, p_user_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_member boolean;
BEGIN
  -- If a user_id is provided, verify they belong to the tenant
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_id = tenant_uuid AND user_id = p_user_id
    ) INTO v_is_member;

    IF NOT v_is_member THEN
      RAISE EXCEPTION 'User % is not a member of tenant %', p_user_id, tenant_uuid;
    END IF;
  END IF;

  PERFORM set_config('app.tenant_id', tenant_uuid::text, true);
END;
$$;

-- Function to get current tenant context
CREATE OR REPLACE FUNCTION get_tenant_context()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

-- SECURITY: Only service_role can set tenant context (not authenticated users)
REVOKE EXECUTE ON FUNCTION set_tenant_context FROM authenticated;
REVOKE EXECUTE ON FUNCTION set_tenant_context FROM anon;
REVOKE EXECUTE ON FUNCTION set_tenant_context FROM public;
GRANT EXECUTE ON FUNCTION get_tenant_context TO authenticated;

-- ============================================================================
-- NOTES ON SERVICE ROLE BYPASS
-- ============================================================================

-- The Supabase service_role key bypasses RLS by default.
-- Use it only on the server side for admin operations.
-- The anon key respects RLS policies.
--
-- To explicitly bypass RLS in a function:
-- CREATE FUNCTION my_admin_function() ... SECURITY DEFINER ...
--
-- To enforce RLS even for the owner:
-- ALTER TABLE my_table FORCE ROW LEVEL SECURITY;

COMMENT ON POLICY webhooks_select_policy ON public.webhooks IS 'Webhooks are server-only; service_role bypasses RLS';
COMMENT ON POLICY brainstorm_sessions_select_policy ON public.brainstorm_sessions IS 'Users can only read their own brainstorm sessions or sessions in their tenant';
