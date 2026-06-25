-- Flow C §17.2: Add approval_status to triage_results for user-approval gate
-- Memory Consolidator promotes only items with approval_status = 'approved'

ALTER TABLE triage_results ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
  CHECK (approval_status IN ('pending', 'approved', 'discarded', 'deferred'));
ALTER TABLE triage_results ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE triage_results ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS triage_results_approval_status_idx ON triage_results(approval_status);
COMMENT ON COLUMN triage_results.approval_status IS 'Flow C: pending|approved|discarded|deferred. Only approved promoted to compounding.';
