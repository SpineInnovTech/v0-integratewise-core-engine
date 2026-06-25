-- Migration 033: Add department column to tenant_spine_config
--
-- Context: workspace-spine.ts now stores department alongside domain
-- so that workspace/profile can return the authoritative department
-- for returning users — eliminating the BIZOPS-fallback workspace
-- mismatch bug where CS/Sales users saw "Business Operations".
--
-- The department column stores the raw onboarding department key
-- (e.g. CUSTOMER_SUCCESS, SALES, MARKETING) while domains stores
-- the resolved IW domain array (e.g. ["CUSTOMER_SUCCESS"]).
-- Department is the more precise signal when they differ.

ALTER TABLE tenant_spine_config ADD COLUMN department TEXT;

-- Backfill existing rows: derive department from the first domain stored.
-- This is a best-effort backfill — rows will get the correct value on
-- the next initialize-spine call (next login or re-onboard).
UPDATE tenant_spine_config
SET department = CASE
  WHEN json_extract(domains, '$[0]') IS NOT NULL
    THEN json_extract(domains, '$[0]')
  ELSE 'BIZOPS'
END
WHERE department IS NULL;
