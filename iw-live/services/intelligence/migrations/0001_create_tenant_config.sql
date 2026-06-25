-- Migration: Create tenant_config table for tenant classification
-- Required by: S11 bypass guard, HandoffTimeoutDO, governance policy routing
-- Default tenant_class is 'external' (fail-safe: deny native execution)

CREATE TABLE IF NOT EXISTS tenant_config (
  tenant_id TEXT PRIMARY KEY,
  tenant_class TEXT NOT NULL CHECK (tenant_class IN ('customer_zero', 'external')) DEFAULT 'external',
  awaiting_outcome_timeout_seconds INTEGER NOT NULL DEFAULT 3600,
  governance_policy_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed Customer Zero
INSERT OR IGNORE INTO tenant_config (tenant_id, tenant_class, created_at, updated_at)
VALUES ('iw-customer-zero', 'customer_zero', datetime('now'), datetime('now'));
