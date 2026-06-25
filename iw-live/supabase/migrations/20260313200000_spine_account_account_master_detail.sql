-- =============================================================================
-- Extend spine.account to Account_Master level of detail (Accounts Intelligence)
-- Same level of detail as PDF: CSM narrative, contract/renewal, ARR/ACV, health,
-- executive sponsors, primary contact, engagement cadence, etc.
-- =============================================================================

ALTER TABLE spine.account
  ADD COLUMN IF NOT EXISTS csm_narrative TEXT,
  ADD COLUMN IF NOT EXISTS contract_type TEXT,
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,
  ADD COLUMN IF NOT EXISTS contract_end_date DATE,
  ADD COLUMN IF NOT EXISTS renewal_date DATE,
  ADD COLUMN IF NOT EXISTS days_to_renewal INTEGER,
  ADD COLUMN IF NOT EXISTS renewal_risk_level TEXT,
  ADD COLUMN IF NOT EXISTS arr NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS acv NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS customer_success_manager TEXT,
  ADD COLUMN IF NOT EXISTS account_executive TEXT,
  ADD COLUMN IF NOT EXISTS solutions_architect TEXT,
  ADD COLUMN IF NOT EXISTS executive_sponsor_customer TEXT,
  ADD COLUMN IF NOT EXISTS executive_sponsor_mulesoft TEXT,
  ADD COLUMN IF NOT EXISTS health_score INTEGER CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100)),
  ADD COLUMN IF NOT EXISTS health_score_trend TEXT,
  ADD COLUMN IF NOT EXISTS health_score_change NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS sp_rating TEXT,
  ADD COLUMN IF NOT EXISTS customer_annual_revenue NUMERIC(15,0),
  ADD COLUMN IF NOT EXISTS employee_count INTEGER,
  ADD COLUMN IF NOT EXISTS primary_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS primary_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS primary_contact_role TEXT,
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS last_engagement_date DATE,
  ADD COLUMN IF NOT EXISTS next_engagement_due DATE,
  ADD COLUMN IF NOT EXISTS engagement_cadence TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT,
  ADD COLUMN IF NOT EXISTS modified_by TEXT;

COMMENT ON COLUMN spine.account.csm_narrative IS 'Accounts Intelligence: rich text view of what is going on with the account.';
COMMENT ON COLUMN spine.account.renewal_date IS 'Accounts Intelligence: renewal date for contract.';
COMMENT ON COLUMN spine.account.health_score IS 'Accounts Intelligence: 0-100 health score.';
COMMENT ON COLUMN spine.account.executive_sponsor_customer IS 'Accounts Intelligence: executive sponsor (customer side).';
COMMENT ON COLUMN spine.account.executive_sponsor_mulesoft IS 'Accounts Intelligence: executive sponsor (MuleSoft/IntegrateWise side).';
