-- Identity Resolution Tables (D1)
-- Used by S7.5 to detect potential cross-source duplicates

CREATE TABLE IF NOT EXISTS entity_signatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  source_system TEXT NOT NULL,
  external_id TEXT NOT NULL,
  signature TEXT NOT NULL,
  email TEXT DEFAULT '',
  domain TEXT DEFAULT '',
  name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE(tenant_id, entity_type, source_system, external_id)
);

CREATE INDEX IF NOT EXISTS idx_sig_tenant_type ON entity_signatures(tenant_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_sig_email ON entity_signatures(tenant_id, entity_type, email) WHERE email != '';
CREATE INDEX IF NOT EXISTS idx_sig_domain ON entity_signatures(tenant_id, entity_type, domain) WHERE domain != '';
CREATE INDEX IF NOT EXISTS idx_sig_signature ON entity_signatures(tenant_id, entity_type, signature);

CREATE TABLE IF NOT EXISTS merge_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  source_a TEXT NOT NULL,
  external_id_a TEXT NOT NULL,
  source_b TEXT NOT NULL,
  external_id_b TEXT NOT NULL,
  confidence REAL NOT NULL,
  matched_fields TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(tenant_id, entity_type, source_a, external_id_a, source_b, external_id_b)
);

CREATE INDEX IF NOT EXISTS idx_merge_tenant_status ON merge_candidates(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_merge_entity ON merge_candidates(tenant_id, entity_type, status);
