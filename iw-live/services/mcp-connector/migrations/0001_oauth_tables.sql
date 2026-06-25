-- OAuth 2.0 tables for MCP connector (D1: integratewise-spine-cache)
-- Adds client registry, refresh tokens, and revocation support.

-- Registered OAuth clients (applications that can request access)
CREATE TABLE IF NOT EXISTS oauth_clients (
  client_id TEXT PRIMARY KEY,
  client_secret_hash TEXT NOT NULL,
  client_name TEXT NOT NULL,
  redirect_uris TEXT NOT NULL DEFAULT '[]',    -- JSON array of allowed redirect URIs
  allowed_scopes TEXT NOT NULL DEFAULT '[]',   -- JSON array of permitted scopes
  tenant_id TEXT NOT NULL,
  grant_types TEXT NOT NULL DEFAULT '["authorization_code"]', -- JSON array
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Refresh tokens (long-lived, rotatable)
CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
  token_hash TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  scopes TEXT NOT NULL DEFAULT '',
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (client_id) REFERENCES oauth_clients(client_id)
);

-- Token revocation log (for audit + immediate invalidation)
CREATE TABLE IF NOT EXISTS oauth_revocations (
  token_hash TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  reason TEXT,
  revoked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for refresh token lookup by client
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_client ON oauth_refresh_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_tenant ON oauth_refresh_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oauth_clients_tenant ON oauth_clients(tenant_id);
