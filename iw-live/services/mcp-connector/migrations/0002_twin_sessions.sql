-- Twin Sessions and Audit Events tables
-- Per: docs/tech/CLOUDFLARE_ZERO_TRUST_TWIN_OPENWEBUI_PROVISIONING.md §10

CREATE TABLE IF NOT EXISTS twin_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  context_key TEXT NOT NULL,
  source TEXT NOT NULL,
  domain TEXT NOT NULL,
  entity_id TEXT,
  entity_type TEXT,
  entity_name TEXT,
  insight_id TEXT,
  insight_title TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  opened_at TEXT,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_twin_sessions_tenant ON twin_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_twin_sessions_user ON twin_sessions(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_twin_sessions_context_key ON twin_sessions(context_key);

CREATE TABLE IF NOT EXISTS twin_audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_twin_audit_tenant ON twin_audit_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_twin_audit_session ON twin_audit_events(session_id);
