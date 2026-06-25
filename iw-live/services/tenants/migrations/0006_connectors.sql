-- 0006_connectors.sql — D1 connectors table (OAuth token store)
-- Cloudflare-only (DECISION 22): the connectors token store now lives in D1
-- (integratewise-spine-cache) instead of the legacy PostgREST plane. Tokens are
-- stored encrypted (tokens_encrypted=1) exactly as before; only the plane changes.
--
-- tenant_id / provider_workspace_id are normalized to '' / 'default' (never NULL)
-- so the UNIQUE conflict key works under SQLite (NULLs are distinct in SQLite).

CREATE TABLE IF NOT EXISTS connectors (
  id                       TEXT PRIMARY KEY,
  user_id                  TEXT NOT NULL,
  tenant_id                TEXT NOT NULL DEFAULT '',
  provider                 TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'connected',
  access_token             TEXT,
  refresh_token            TEXT,
  token_type               TEXT,
  expires_at               TEXT,
  provider_user_id         TEXT,
  provider_workspace_id    TEXT NOT NULL DEFAULT 'default',
  provider_workspace_name  TEXT,
  scopes                   TEXT,            -- JSON array
  sync_enabled             INTEGER NOT NULL DEFAULT 1,
  tokens_encrypted         INTEGER NOT NULL DEFAULT 0,
  last_sync_at             TEXT,
  sync_error               TEXT,
  metadata                 TEXT NOT NULL DEFAULT '{}',  -- JSON object
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);

-- Conflict target used by the upsert: (tenant_id, user_id, provider, provider_workspace_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_connectors_conflict
  ON connectors (tenant_id, user_id, provider, provider_workspace_id);

CREATE INDEX IF NOT EXISTS idx_connectors_user ON connectors (user_id);
CREATE INDEX IF NOT EXISTS idx_connectors_user_provider ON connectors (user_id, provider);
CREATE INDEX IF NOT EXISTS idx_connectors_tenant ON connectors (tenant_id);
