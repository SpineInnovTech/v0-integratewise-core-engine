-- Loader D1 Schema: Fingerprint deduplication table
-- Used by Stage 3 (Filter) to reject duplicate payloads.

CREATE TABLE
IF NOT EXISTS processed_fingerprints
(
  fingerprint TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source TEXT NOT NULL,
  entity_type TEXT,
  created_at TEXT NOT NULL DEFAULT
(datetime
('now'))
);

CREATE INDEX
IF NOT EXISTS idx_fp_tenant ON processed_fingerprints
(tenant_id);
CREATE INDEX
IF NOT EXISTS idx_fp_created ON processed_fingerprints
(created_at);
