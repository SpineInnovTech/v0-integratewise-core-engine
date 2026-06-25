CREATE TABLE IF NOT EXISTS entity360_cache (
    spine_id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    version INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_cache_workspace ON entity360_cache(workspace_id, expires_at);

DELETE FROM entity360_cache WHERE expires_at < unixepoch();
