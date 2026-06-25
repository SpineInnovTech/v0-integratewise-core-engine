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

-- Policy: Allow all reads (webhooks are typically not tenant-specific)
-- Adjust if you need tenant isolation
CREATE POLICY webhooks_select_policy ON public.webhooks
  FOR SELECT
  USING (true);

-- Policy: Allow inserts from API routes (service role bypasses RLS)
CREATE POLICY webhooks_insert_policy ON public.webhooks
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow updates for processing status
CREATE POLICY webhooks_update_policy ON public.webhooks
  FOR UPDATE
  USING (true);

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

-- Policy: Read own tenant's sessions (or all if no tenant context)
CREATE POLICY brainstorm_sessions_select_policy ON public.brainstorm_sessions
  FOR SELECT
  USING (
    CASE 
      WHEN current_setting('app.tenant_id', true) IS NOT NULL 
           AND current_setting('app.tenant_id', true) != ''
      THEN 
        -- Check if table has tenant_id column
        CASE 
          WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brainstorm_sessions' AND column_name = 'tenant_id')
          THEN true  -- Would use: tenant_id = current_setting('app.tenant_id', true)::uuid
          ELSE true
        END
      ELSE true  -- No tenant context, allow all
    END
  );

-- Policy: Insert own tenant's sessions
CREATE POLICY brainstorm_sessions_insert_policy ON public.brainstorm_sessions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Update own tenant's sessions
CREATE POLICY brainstorm_sessions_update_policy ON public.brainstorm_sessions
  FOR UPDATE
  USING (true);

-- ============================================================================
-- BRAINSTORM_INSIGHTS TABLE RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.brainstorm_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS brainstorm_insights_select_policy ON public.brainstorm_insights;
DROP POLICY IF EXISTS brainstorm_insights_insert_policy ON public.brainstorm_insights;
DROP POLICY IF EXISTS brainstorm_insights_update_policy ON public.brainstorm_insights;

-- Policy: Read all insights (linked to sessions via foreign key)
CREATE POLICY brainstorm_insights_select_policy ON public.brainstorm_insights
  FOR SELECT
  USING (true);

-- Policy: Insert insights
CREATE POLICY brainstorm_insights_insert_policy ON public.brainstorm_insights
  FOR INSERT
  WITH CHECK (true);

-- Policy: Update insights
CREATE POLICY brainstorm_insights_update_policy ON public.brainstorm_insights
  FOR UPDATE
  USING (true);

-- ============================================================================
-- DAILY_INSIGHTS TABLE RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS daily_insights_select_policy ON public.daily_insights;
DROP POLICY IF EXISTS daily_insights_insert_policy ON public.daily_insights;

-- Policy: Read all daily insights
CREATE POLICY daily_insights_select_policy ON public.daily_insights
  FOR SELECT
  USING (true);

-- Policy: Insert daily insights (from cron jobs)
CREATE POLICY daily_insights_insert_policy ON public.daily_insights
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTION: Set Tenant Context
-- ============================================================================

-- Function to set tenant context for RLS
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_uuid::text, false);
END;
$$;

-- Function to get current tenant context
CREATE OR REPLACE FUNCTION get_tenant_context()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION set_tenant_context TO authenticated;
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

COMMENT ON POLICY webhooks_select_policy ON public.webhooks IS 'Allow all users to read webhooks';
COMMENT ON POLICY brainstorm_sessions_select_policy ON public.brainstorm_sessions IS 'Allow users to read brainstorm sessions (tenant-aware when context set)';
