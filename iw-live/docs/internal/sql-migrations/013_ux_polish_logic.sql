-- Area 3: UX Polish Support (Why am I seeing this?)
ALTER TABLE situations
ADD COLUMN IF NOT EXISTS why_it_matters TEXT;
ALTER TABLE situations
ADD COLUMN IF NOT EXISTS evidence_summary JSONB DEFAULT '{}';
-- { "signals": 3, "total_events": 15 }
ALTER TABLE action_proposals
ADD COLUMN IF NOT EXISTS confidence_reasoning TEXT;
ALTER TABLE action_proposals
ADD COLUMN IF NOT EXISTS expected_outcome TEXT;
-- Update existing records if any
UPDATE situations
SET why_it_matters = 'This situation represents a critical operational risk that could lead to data loss or revenue churn.'
WHERE why_it_matters IS NULL;