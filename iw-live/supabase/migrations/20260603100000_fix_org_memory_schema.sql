-- ============================================================================
-- Fix org_memory schema: add missing tier column, fix confidence precision,
-- align governance_state values, and fix key→topic mismatch.
--
-- Migration: 20260603100000
-- Date: 2026-06-03
-- ============================================================================

-- 1. Add missing tier column (silently dropped on write until now)
ALTER TABLE memory.org_memory
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard';

COMMENT ON COLUMN memory.org_memory.tier IS 'Memory tier: standard, elevated, critical. Controls promotion priority and visibility.';

-- 2. Fix confidence precision: NUMERIC(3,2) → NUMERIC(4,3)
--    Current: max 9.99, precision 2 decimal places
--    Target:  0.000-1.000, precision 3 decimal places
ALTER TABLE memory.org_memory
  ALTER COLUMN confidence TYPE NUMERIC(4,3);

-- 3. Fix governance_state CHECK constraint to include all used values
--    Current DB: staging, approved, published, archived
--    Tool writes: draft, pending, approved, rejected
--    Unified set: staging, draft, pending, approved, rejected, published, archived
ALTER TABLE memory.org_memory
  DROP CONSTRAINT IF EXISTS org_memory_governance_state_check;

ALTER TABLE memory.org_memory
  ADD CONSTRAINT org_memory_governance_state_check
  CHECK (governance_state IN (
    'staging', 'draft', 'pending', 'approved', 'rejected', 'published', 'archived'
  ));

-- 4. Add tier to governance_state flow (index for filtering)
CREATE INDEX IF NOT EXISTS IF NOT EXISTS om_tier_idx ON memory.org_memory(tenant_id, tier);

-- 5. Add related_entity_ids index (added in previous migration but no index)
CREATE INDEX IF NOT EXISTS IF NOT EXISTS om_entity_links_idx ON memory.org_memory USING gin(related_entity_ids);
