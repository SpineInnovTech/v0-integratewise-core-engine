/**
 * OAuth Token Refresh Module
 *
 * Resolves FIX-001: tokens stored with expires_at and refresh_token
 * during OAuth callback (tenants service) but NEVER refreshed before
 * connector API calls.
 *
 * v2 improvements:
 * - Uses shared crypto from @integratewise/lib/crypto (no duplicated AES code)
 * - Includes client_id + client_secret in refresh grant (reads from connector metadata)
 * - KV-based token caching (50-min TTL) + D1 connectors table (DECISION 22) — no Supabase in hot path.
 *
 * Usage:
 *   const token = await getValidAccessToken(env, tenantId, provider);
 *   // token is guaranteed non-expired (or throws if refresh fails)
 */

import { encryptToken, decryptToken } from "@integratewise/lib/crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConnectorTokenRow {
  id: string;
  tenant_id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  expires_at: string | null;
  tokens_encrypted: boolean;
  status: string;
  provider_workspace_id: string | null;
  metadata: Record<string, unknown> | null;
}

export interface TokenRefreshEnv {
  /** D1 connectors token store (integratewise-spine-cache) — DECISION 22, no Supabase. */
  EDGE_DB: D1Database;
  TOKEN_ENCRYPTION_KEY?: string;
  /** KV namespace for caching decrypted tokens (uses CONNECTOR_STATUS binding) */
  CONNECTOR_STATUS?: KVNamespace;
}

export class TokenExpiredError extends Error {
  constructor(provider: string, reason: string) {
    super(`Token refresh failed for ${provider}: ${reason}`);
    this.name = "TokenExpiredError";
  }
}

// Buffer in ms — refresh if token expires within this window
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

// KV cache TTL — 50 minutes (tokens typically expire in 60, buffer is 5)
const TOKEN_CACHE_TTL_SECONDS = 50 * 60; // 50 minutes

// ---------------------------------------------------------------------------
// KV Token Cache
// ---------------------------------------------------------------------------

function tokenCacheKey(tenantId: string, provider: string, workspaceId?: string): string {
  const base = `token:${tenantId}:${provider}`;
  return workspaceId ? `${base}:${workspaceId}` : base;
}

async function getCachedToken(
  kv: KVNamespace | undefined,
  tenantId: string,
  provider: string,
  workspaceId?: string
): Promise<string | null> {
  if (!kv) return null;
  try {
    return await kv.get(tokenCacheKey(tenantId, provider, workspaceId));
  } catch {
    return null; // KV failure is non-fatal — fall through to D1 store
  }
}

async function setCachedToken(
  kv: KVNamespace | undefined,
  tenantId: string,
  provider: string,
  plaintext: string,
  workspaceId?: string,
  ttlSeconds: number = TOKEN_CACHE_TTL_SECONDS
): Promise<void> {
  if (!kv) return;
  try {
    await kv.put(tokenCacheKey(tenantId, provider, workspaceId), plaintext, {
      expirationTtl: ttlSeconds,
    });
  } catch {
    // KV write failure is non-fatal
  }
}

async function invalidateCachedToken(
  kv: KVNamespace | undefined,
  tenantId: string,
  provider: string,
  workspaceId?: string
): Promise<void> {
  if (!kv) return;
  try {
    await kv.delete(tokenCacheKey(tenantId, provider, workspaceId));
  } catch {
    // KV delete failure is non-fatal
  }
}

// ---------------------------------------------------------------------------
// Provider token endpoint registry (self-contained — mirrors oauth-configs.ts)
// Only oauth2 providers with refresh_token support are listed here.
// ---------------------------------------------------------------------------

const TOKEN_ENDPOINTS: Record<string, string> = {
  salesforce: "https://login.salesforce.com/services/oauth2/token",
  hubspot: "https://api.hubapi.com/oauth/v1/token",
  pipedrive: "https://oauth.pipedrive.com/oauth/token",
  "zoho-crm": "https://accounts.zoho.com/oauth/v2/token",
  freshsales: "https://auth.freshworks.com/oauth/token",
  zendesk: "https://zendesk.com/oauth/tokens", // needs subdomain
  freshdesk: "https://freshdesk.com/oauth/token", // needs subdomain
  front: "https://app.frontapp.com/oauth/token",
  helpscout: "https://api.helpscout.net/v2/oauth2/token",
  intercom: "https://api.intercom.io/auth/eagle/token",
  stripe: "https://connect.stripe.com/oauth/token",
  quickbooks: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
  xero: "https://identity.xero.com/connect/token",
  freshbooks: "https://api.freshbooks.com/auth/oauth/token",
  "hubspot-marketing": "https://api.hubapi.com/oauth/v1/token",
  mailchimp: "https://login.mailchimp.com/oauth2/token",
  klaviyo: "https://a.klaviyo.com/oauth/token",
  "google-analytics": "https://oauth2.googleapis.com/token",
  jira: "https://auth.atlassian.com/oauth/token",
  asana: "https://app.asana.com/-/oauth_token",
  linear: "https://api.linear.app/oauth/token",
  monday: "https://auth.monday.com/oauth/token",
  clickup: "https://api.clickup.com/api/v2/oauth/token",
  github: "https://github.com/login/oauth/access_token",
  gitlab: "https://gitlab.com/oauth/token",
  bitbucket: "https://bitbucket.org/site/oauth2/access_token",
  shopify: "https://shopify.myshopify.com/admin/oauth/access_token", // needs shop
  bigcommerce: "https://login.bigcommerce.com/oauth2/token",
  figma: "https://www.figma.com/api/oauth/token",
  gmail: "https://oauth2.googleapis.com/token",
  outlook: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  slack: "https://slack.com/api/oauth.v2.access",
  teams: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  discord: "https://discord.com/api/oauth2/token",
  zoom: "https://zoom.us/oauth/token",
  "google-calendar": "https://oauth2.googleapis.com/token",
  notion: "https://api.notion.com/v1/oauth/token",
  "google-drive": "https://oauth2.googleapis.com/token",
  dropbox: "https://api.dropboxapi.com/oauth2/token",
  onedrive: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  airtable: "https://airtable.com/oauth2/v1/token",
  calendly: "https://auth.calendly.com/oauth/token",
  bamboohr: "https://bamboohr.com/token/oauth", // needs subdomain
  "whatsapp-business": "https://graph.facebook.com/v18.0/oauth/access_token",
};

// ---------------------------------------------------------------------------
// Core: getValidAccessToken
// ---------------------------------------------------------------------------

/**
 * Returns a valid (non-expired) access token for the given tenant + provider.
 *
 * Flow:
 * 1. Check KV cache for a previously decrypted, still-valid token.
 * 2. If miss, fetch connector row from D1 `connectors` table (migration 0006 in tenants/, CF-only per DECISION 22).
 * 3. If no `expires_at` or token is still fresh -> decrypt, cache, return.
 * 4. If expired or within EXPIRY_BUFFER_MS -> use refresh_token to get new tokens.
 * 5. Persist refreshed tokens to D1 and KV cache.
 *
 * Throws `TokenExpiredError` if refresh is impossible (no refresh_token, provider
 * error, etc.) -- caller should mark connector as disconnected and notify user.
 *
 * Note: Nango is the primary token source in loader; this D1 path is the legacy/raw fallback.
 */
export async function getValidAccessToken(
  env: TokenRefreshEnv,
  tenantId: string,
  provider: string,
  providerWorkspaceId?: string
): Promise<string> {
  // 0. Check KV cache first (avoids Supabase hit entirely)
  const cached = await getCachedToken(
    env.CONNECTOR_STATUS,
    tenantId,
    provider,
    providerWorkspaceId
  );
  if (cached) {
    return cached;
  }

  // 1. Fetch connector record from D1 (CF-only token store)
  const sql = providerWorkspaceId
    ? `SELECT * FROM connectors WHERE tenant_id = ? AND provider = ? AND status = 'connected' AND provider_workspace_id = ? LIMIT 1`
    : `SELECT * FROM connectors WHERE tenant_id = ? AND provider = ? AND status = 'connected' LIMIT 1`;
  const binds = providerWorkspaceId
    ? [tenantId, provider, providerWorkspaceId]
    : [tenantId, provider];
  const row = await env.EDGE_DB.prepare(sql)
    .bind(...binds)
    .first<Record<string, unknown>>();

  if (!row) {
    throw new TokenExpiredError(provider, `No connected connector found for tenant ${tenantId}`);
  }

  const connector = {
    ...(row as any),
    metadata:
      typeof row.metadata === "string"
        ? (() => {
            try {
              return JSON.parse(row.metadata as string);
            } catch {
              return {};
            }
          })()
        : (row.metadata ?? {}),
  } as ConnectorTokenRow;
  const encKey = env.TOKEN_ENCRYPTION_KEY;

  // 2. Check if token is still valid
  if (connector.expires_at) {
    const expiresAtMs = new Date(connector.expires_at).getTime();
    const nowMs = Date.now();

    if (expiresAtMs - nowMs > EXPIRY_BUFFER_MS) {
      // Token still fresh -- decrypt, cache, and return
      const plaintext = encKey
        ? await decryptToken(connector.access_token, encKey)
        : connector.access_token;

      // Cache with TTL = min(50min, time-until-expiry - buffer)
      const remainingSeconds = Math.floor((expiresAtMs - nowMs - EXPIRY_BUFFER_MS) / 1000);
      const ttl = Math.min(TOKEN_CACHE_TTL_SECONDS, Math.max(60, remainingSeconds));
      await setCachedToken(
        env.CONNECTOR_STATUS,
        tenantId,
        provider,
        plaintext,
        providerWorkspaceId,
        ttl
      );

      return plaintext;
    }

    // Token is expired or about to expire -- need refresh
    console.log(
      `[token-refresh] Token for ${provider} (tenant ${tenantId}) expires at ${connector.expires_at}, refreshing...`
    );
  } else {
    // No expires_at recorded -- assume token is valid (e.g., API key connectors)
    const plaintext = encKey
      ? await decryptToken(connector.access_token, encKey)
      : connector.access_token;

    // Cache non-expiring tokens with default TTL
    await setCachedToken(env.CONNECTOR_STATUS, tenantId, provider, plaintext, providerWorkspaceId);

    return plaintext;
  }

  // 3. Refresh the token
  if (!connector.refresh_token) {
    throw new TokenExpiredError(
      provider,
      "Token expired and no refresh_token stored. User must re-authenticate."
    );
  }

  // Invalidate stale cache entry before refreshing
  await invalidateCachedToken(env.CONNECTOR_STATUS, tenantId, provider, providerWorkspaceId);

  const refreshToken = encKey
    ? await decryptToken(connector.refresh_token, encKey)
    : connector.refresh_token;

  // Extract client credentials from connector metadata (stored at OAuth callback time)
  const metadata = connector.metadata ?? {};
  const clientId = (metadata.client_id as string) || "";
  const encClientSecret = (metadata.enc_client_secret as string) || "";
  const clientSecret = encClientSecret && encKey ? await decryptToken(encClientSecret, encKey) : "";

  if (!clientId || !clientSecret) {
    console.warn(
      `[token-refresh] Missing client credentials in metadata for ${provider} (tenant ${tenantId}). ` +
        `Refresh may fail. Re-connect the connector to store credentials.`
    );
  }

  const newTokens = await executeTokenRefresh(
    provider,
    refreshToken,
    clientId,
    clientSecret,
    metadata
  );

  // 4. Persist new tokens
  const encryptedAccess = encKey
    ? await encryptToken(newTokens.access_token, encKey)
    : newTokens.access_token;

  const encryptedRefresh =
    newTokens.refresh_token && encKey
      ? await encryptToken(newTokens.refresh_token, encKey)
      : newTokens.refresh_token;

  const newExpiresAt = newTokens.expires_in
    ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
    : null;

  await env.EDGE_DB.prepare(
    `UPDATE connectors SET access_token = ?, refresh_token = COALESCE(?, refresh_token),
       expires_at = ?, tokens_encrypted = ?, metadata = ?, updated_at = ? WHERE id = ?`
  )
    .bind(
      encryptedAccess,
      encryptedRefresh ?? null,
      newExpiresAt,
      encKey ? 1 : 0,
      JSON.stringify({ ...metadata, last_token_refresh: new Date().toISOString() }),
      new Date().toISOString(),
      connector.id
    )
    .run();

  // Cache the new plaintext token
  const cacheTtl = newTokens.expires_in
    ? Math.min(TOKEN_CACHE_TTL_SECONDS, Math.max(60, newTokens.expires_in - 300))
    : TOKEN_CACHE_TTL_SECONDS;
  await setCachedToken(
    env.CONNECTOR_STATUS,
    tenantId,
    provider,
    newTokens.access_token,
    providerWorkspaceId,
    cacheTtl
  );

  console.log(
    `[token-refresh] Successfully refreshed token for ${provider} (tenant ${tenantId}), new expiry: ${newExpiresAt}`
  );

  return newTokens.access_token;
}

// ---------------------------------------------------------------------------
// Provider-specific token refresh
// ---------------------------------------------------------------------------

interface RefreshResult {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * POST to the provider's token endpoint with grant_type=refresh_token.
 * Now includes client_id + client_secret in the body (required by most OAuth providers).
 */
async function executeTokenRefresh(
  provider: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  metadata?: Record<string, unknown> | null
): Promise<RefreshResult> {
  let tokenUrl = TOKEN_ENDPOINTS[provider];

  if (!tokenUrl) {
    throw new TokenExpiredError(
      provider,
      `No token endpoint configured for provider "${provider}"`
    );
  }

  // Handle provider-specific URL overrides from metadata
  if (provider === "salesforce" && metadata?.instance_url) {
    tokenUrl = `${metadata.instance_url}/services/oauth2/token`;
  }

  // Standard OAuth2 refresh_token grant — including client credentials
  const bodyParams: Record<string, string> = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  };

  // Most providers require client_id + client_secret in the body
  if (clientId) {
    bodyParams.client_id = clientId;
  }
  if (clientSecret) {
    bodyParams.client_secret = clientSecret;
  }

  const body = new URLSearchParams(bodyParams);

  // Some providers use Basic auth instead of body credentials
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  // Notion uses Basic auth for token refresh
  if (provider === "notion" && clientId && clientSecret) {
    headers["Authorization"] = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
    headers["Content-Type"] = "application/json";
  }

  // GitHub uses JSON
  if (provider === "github") {
    headers["Content-Type"] = "application/json";
    headers["Accept"] = "application/json";
  }

  const requestBody =
    provider === "github" || provider === "notion"
      ? JSON.stringify(Object.fromEntries(body))
      : body.toString();

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown");
    throw new TokenExpiredError(
      provider,
      `Token endpoint returned ${response.status}: ${errorBody}`
    );
  }

  const tokens = (await response.json()) as Record<string, unknown>;

  if (!tokens.access_token || typeof tokens.access_token !== "string") {
    throw new TokenExpiredError(provider, "Token endpoint response missing access_token");
  }

  return {
    access_token: tokens.access_token as string,
    refresh_token: (tokens.refresh_token as string) ?? undefined,
    expires_in: typeof tokens.expires_in === "number" ? tokens.expires_in : undefined,
    token_type: (tokens.token_type as string) ?? undefined,
  };
}
