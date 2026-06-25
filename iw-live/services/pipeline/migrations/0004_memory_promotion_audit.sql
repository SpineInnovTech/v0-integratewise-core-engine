-- Migration: 0004_memory_promotion_audit
-- Memory Promotion Engine audit trail (spine-hydration-lifecycle Phase 5, R6.6 / R11.2).
-- Every promotion DECISION — promoted or not — is recorded with the firing signals,
-- score, category, governance state, rationale, and lineage back to the source Spine
-- entity (entity_id). Cloudflare D1 only (spine-cache). Tenant-isolated + queryable.

CREATE TABLE IF NOT EXISTS memory_promotion_audit (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,          -- source Spine entity (lineage_ref)
  signals TEXT NOT NULL DEFAULT '[]', -- JSON array of fired Promotion_Signals
  score REAL NOT NULL DEFAULT 0,
  category TEXT,
  promoted INTEGER NOT NULL DEFAULT 0, -- 1 = promoted to Memory, 0 = retained as Spine data
  governance_state TEXT,             -- approved | staging | n/a
  rationale TEXT,
  decided_by TEXT,                   -- 'memory-promoter' (or a human on override)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mpa_tenant_created
  ON memory_promotion_audit(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_mpa_entity
  ON memory_promotion_audit(tenant_id, entity_id);
