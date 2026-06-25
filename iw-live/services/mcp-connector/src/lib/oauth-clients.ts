/**
 * OAuth 2.0 Client Registry backed by D1.
 *
 * Validates client_id, client_secret, redirect_uri, and allowed scopes
 * against registered OAuth clients in the integratewise-spine-cache D1 database.
 */

export interface OAuthClient {
  client_id: string;
  client_secret_hash: string;
  client_name: string;
  redirect_uris: string[];
  allowed_scopes: string[];
  tenant_id: string;
  grant_types: string[];
  is_active: boolean;
}

/**
 * Hash a client secret using SHA-256 for comparison against stored hash.
 */
export async function hashClientSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Look up a client from D1 by client_id.
 */
export async function getClient(db: D1Database, clientId: string): Promise<OAuthClient | null> {
  const row = await db
    .prepare("SELECT * FROM oauth_clients WHERE client_id = ? AND is_active = 1")
    .bind(clientId)
    .first();

  if (!row) return null;

  return {
    client_id: row.client_id as string,
    client_secret_hash: row.client_secret_hash as string,
    client_name: row.client_name as string,
    redirect_uris: JSON.parse((row.redirect_uris as string) || "[]"),
    allowed_scopes: JSON.parse((row.allowed_scopes as string) || "[]"),
    tenant_id: row.tenant_id as string,
    grant_types: JSON.parse((row.grant_types as string) || '["authorization_code"]'),
    is_active: (row.is_active as number) === 1,
  };
}

/**
 * Verify a client_secret against the stored hash.
 */
export async function verifyClientSecret(client: OAuthClient, secret: string): Promise<boolean> {
  const hash = await hashClientSecret(secret);
  return hash === client.client_secret_hash;
}

/**
 * Check if a redirect_uri is in the client's allowed list.
 */
export function isRedirectUriAllowed(client: OAuthClient, redirectUri: string): boolean {
  // If no redirect URIs registered, allow any (for dev/local clients)
  if (client.redirect_uris.length === 0) return true;
  return client.redirect_uris.includes(redirectUri);
}

/**
 * Filter requested scopes down to what the client is allowed.
 * Returns the intersection of requested and allowed scopes.
 */
export function resolveScopes(client: OAuthClient, requestedScope: string): string {
  const requested = requestedScope.split(" ").filter(Boolean);
  if (client.allowed_scopes.length === 0) {
    // No restriction — allow all requested scopes
    return requestedScope;
  }
  const allowed = new Set(client.allowed_scopes);
  const resolved = requested.filter((s) => allowed.has(s));
  return resolved.length > 0 ? resolved.join(" ") : client.allowed_scopes.join(" ");
}

/**
 * Register a new OAuth client (admin operation).
 */
export async function registerClient(
  db: D1Database,
  params: {
    client_id: string;
    client_secret: string;
    client_name: string;
    redirect_uris: string[];
    allowed_scopes: string[];
    tenant_id: string;
    grant_types?: string[];
  }
): Promise<OAuthClient> {
  const secretHash = await hashClientSecret(params.client_secret);

  await db
    .prepare(
      `INSERT INTO oauth_clients (client_id, client_secret_hash, client_name, redirect_uris, allowed_scopes, tenant_id, grant_types)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      params.client_id,
      secretHash,
      params.client_name,
      JSON.stringify(params.redirect_uris),
      JSON.stringify(params.allowed_scopes),
      params.tenant_id,
      JSON.stringify(params.grant_types || ["authorization_code", "client_credentials"])
    )
    .run();

  return {
    client_id: params.client_id,
    client_secret_hash: secretHash,
    client_name: params.client_name,
    redirect_uris: params.redirect_uris,
    allowed_scopes: params.allowed_scopes,
    tenant_id: params.tenant_id,
    grant_types: params.grant_types || ["authorization_code", "client_credentials"],
    is_active: true,
  };
}
