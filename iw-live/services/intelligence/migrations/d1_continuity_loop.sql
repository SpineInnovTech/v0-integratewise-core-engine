-- Continuity Loop lineage (spine-hydration-lifecycle Phases 8–12, R17.2 / Property 10).
-- The closed governed-action loop, end to end and traceable:
--   insight_id → proposal_id → decision → execution_id → outcome
-- Cloudflare D1 only (spine-cache). Tenant-isolated + queryable for compliance.

CREATE TABLE IF NOT EXISTS continuity_loop (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  insight_id TEXT,
  proposal_id TEXT NOT NULL,
  decision TEXT,                 -- approve | reject | modify | delegate | schedule
  decided_by TEXT,
  approval_token TEXT,           -- minted on approve/modify; required to execute
  execution_id TEXT,
  execution_status TEXT,         -- executed | handed_off | failed
  outcome TEXT,                  -- positive | negative | mixed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_continuity_loop_tenant ON continuity_loop(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_continuity_loop_proposal ON continuity_loop(proposal_id);
