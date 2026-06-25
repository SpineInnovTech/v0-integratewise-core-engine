-- Migration: 077_unique_tenant_onboarding_state
-- Description: Add UNIQUE constraint on tenant_onboarding_state.tenant_id
-- so that upsert with onConflict: "tenant_id" works correctly.
-- Without this, Supabase upsert silently fails because there's no
-- UNIQUE index to resolve conflicts.

DO $$
BEGIN
  -- Only add if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenant_onboarding_state_tenant_id_key'
  ) THEN
    ALTER TABLE public.tenant_onboarding_state
      ADD CONSTRAINT tenant_onboarding_state_tenant_id_key UNIQUE (tenant_id);
  END IF;
END $$;
