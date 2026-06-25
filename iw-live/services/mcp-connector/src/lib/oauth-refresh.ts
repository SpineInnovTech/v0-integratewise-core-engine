/**
 * OAuth 2.0 Refresh Token management backed by D1.
 *
 * Refresh tokens are hashed before storage (never stored plaintext).
 * Supports rotation: issuing a new refresh token invalidates the old one.
 */

const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface RefreshTokenRecord {
  token_hash: string;
  client_id: string;
  tenant_id: string;
  user_id: string | null;
  scopes: string;
  expires_at: number;
  created_at: number;
  revoked: boolean;
}

/**
 * Generate an opaque refresh token string.
 */
export function generateRefreshToken(): string {
  return `rt_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * Hash a refresh token for storage (SHA-256).
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Store a new refresh token in D1.
 * Returns the plaintext token (only returned once — never stored).
 */
export async function issueRefreshToken(
  db: D1Database,
  params: {
    client_id: string;
    tenant_id: string;
    user_id?: string;
    scopes: string;
  }
): Promise<string> {
  const plainToken = generateRefreshToken();
  const tokenHash = await hashToken(plainToken);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + REFRESH_TOKEN_TTL_SECONDS;

  await db
    .prepare(
      `INSERT INTO oauth_refresh_tokens (token_hash, client_id, tenant_id, user_id, scopes, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      tokenHash,
      params.client_id,
      params.tenant_id,
      params.user_id || null,
      params.scopes,
      expiresAt,
      now
    )
    .run();

  return plainToken;
}

/**
 * Validate and consume a refresh token (rotation: old token is revoked).
 * Returns the record if valid, null if invalid/expired/revoked.
 */
export async function consumeRefreshToken(
  db: D1Database,
  token: string
): Promise<RefreshTokenRecord | null> {
  const tokenHash = await hashToken(token);
  const now = Math.floor(Date.now() / 1000);

  const row = await db
    .prepare(
      "SELECT * FROM oauth_refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > ?"
    )
    .bind(tokenHash, now)
    .first();

  if (!row) return null;

  // Revoke old token (rotation)
  await db
    .prepare("UPDATE oauth_refresh_tokens SET revoked = 1 WHERE token_hash = ?")
    .bind(tokenHash)
    .run();

  // Log revocation for audit
  await db
    .prepare(
      "INSERT OR IGNORE INTO oauth_revocations (token_hash, client_id, reason) VALUES (?, ?, ?)"
    )
    .bind(tokenHash, row.client_id as string, "rotated")
    .run();

  return {
    token_hash: tokenHash,
    client_id: row.client_id as string,
    tenant_id: row.tenant_id as string,
    user_id: (row.user_id as string) || null,
    scopes: row.scopes as string,
    expires_at: row.expires_at as number,
    created_at: row.created_at as number,
    revoked: false,
  };
}

/**
 * Revoke all refresh tokens for a client (e.g., on secret rotation or security event).
 */
export async function revokeAllClientTokens(db: D1Database, clientId: string): Promise<number> {
  const result = await db
    .prepare("UPDATE oauth_refresh_tokens SET revoked = 1 WHERE client_id = ? AND revoked = 0")
    .bind(clientId)
    .run();

  return result.meta.changes || 0;
}

/**
 * Revoke a specific refresh token by plaintext value.
 */
export async function revokeRefreshToken(db: D1Database, token: string): Promise<boolean> {
  const tokenHash = await hashToken(token);
  const result = await db
    .prepare("UPDATE oauth_refresh_tokens SET revoked = 1 WHERE token_hash = ?")
    .bind(tokenHash)
    .run();

  return (result.meta.changes || 0) > 0;
}
