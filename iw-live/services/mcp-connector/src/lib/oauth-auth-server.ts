/**
 * OAuth 2.0 authorization server for MCP clients.
 * Issues RS256 JWTs via the shared gateway JWT helper.
 * Supports: authorization_code, client_credentials, refresh_token grants.
 * Client registry backed by D1 (oauth_clients table).
 */

import { signJWT, PUBLIC_JWK } from "../../../gateway/src/lib/jwt";
import { MCP_OAUTH_SCOPES } from "./oauth-constants";
import {
  getClient,
  verifyClientSecret,
  isRedirectUriAllowed,
  resolveScopes,
} from "./oauth-clients";
import { issueRefreshToken, consumeRefreshToken } from "./oauth-refresh";

type OAuthStore = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
};

export type OAuthAuthServerEnv = {
  OAUTH_ISSUER?: string;
  OAUTH_RESOURCE?: string;
  OAUTH_PRIVATE_KEY?: string;
  OAUTH_STATE_KV?: OAuthStore;
  MCP_IDEMPOTENCY?: OAuthStore;
  DB?: D1Database;
};

function oauthStore(env: OAuthAuthServerEnv): OAuthStore | undefined {
  return env.OAUTH_STATE_KV || env.MCP_IDEMPOTENCY;
}

function issuerForRequest(url: URL, env: OAuthAuthServerEnv): string {
  return (env.OAUTH_ISSUER || `https://${url.hostname}`).replace(/\/$/, "");
}

function resourceForRequest(url: URL, env: OAuthAuthServerEnv): string {
  const host = url.hostname;
  if (env.OAUTH_RESOURCE) return env.OAUTH_RESOURCE.replace(/\/$/, "");
  if (host.startsWith("auth.")) return `https://${host.replace("auth.", "mcp.")}`;
  return `https://${host}`;
}

export function authorizationServerMetadata(url: URL, env: OAuthAuthServerEnv) {
  const issuer = issuerForRequest(url, env);
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    scopes_supported: [...MCP_OAUTH_SCOPES],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "client_credentials", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
  };
}

export function protectedResourceMetadata(url: URL, env: OAuthAuthServerEnv) {
  const resource = resourceForRequest(url, env);
  const issuer = issuerForRequest(url, env);
  return {
    resource,
    authorization_servers: [issuer],
    scopes_supported: [...MCP_OAUTH_SCOPES],
  };
}

export function jwksDocument() {
  return { keys: [PUBLIC_JWK] };
}

export function renderAuthorizeConsentHtml(params: {
  client_id?: string | null;
  redirect_uri: string;
  state?: string | null;
  scope: string;
}) {
  const { client_id, redirect_uri, state, scope } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IntegrateWise — Authorize MCP</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0d0f1a; color: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #151929; border: 1px solid #2a3147; border-radius: 16px; padding: 32px; max-width: 420px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
    h1 { margin: 0 0 8px; font-size: 1.4rem; }
    p { color: #9ca3af; line-height: 1.5; }
    label { display: block; margin-top: 16px; font-size: .85rem; color: #d1d5db; }
    input, select { width: 100%; margin-top: 6px; padding: 10px 12px; border-radius: 8px; border: 1px solid #374151; background: #0f1320; color: #fff; box-sizing: border-box; }
    button { margin-top: 24px; width: 100%; padding: 12px; border: 0; border-radius: 10px; background: linear-gradient(90deg,#4154A3,#EB4379); color: #fff; font-weight: 600; cursor: pointer; }
    .scopes { margin-top: 12px; font-size: .8rem; color: #6b7280; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authorize MCP Connection</h1>
    <p>An AI client${client_id ? ` (${client_id})` : ""} is requesting access to your IntegrateWise workspace tools and memory.</p>
    <form method="POST" action="/oauth/authorize/confirm">
      <input type="hidden" name="client_id" value="${client_id || ""}">
      <input type="hidden" name="redirect_uri" value="${redirect_uri}">
      <input type="hidden" name="state" value="${state || ""}">
      <input type="hidden" name="scope" value="${scope}">
      <label>Tenant ID
        <input name="tenant_id" required placeholder="iw-customer-zero" value="iw-customer-zero">
      </label>
      <div class="scopes">Scopes: ${scope || MCP_OAUTH_SCOPES.join(" ")}</div>
      <button type="submit">Authorize</button>
    </form>
  </div>
</body>
</html>`;
}

export async function handleAuthorizeConfirm(
  request: Request,
  env: OAuthAuthServerEnv
): Promise<Response> {
  const formData = await request.formData();
  const clientId = formData.get("client_id")?.toString() || "";
  const redirect_uri = formData.get("redirect_uri")?.toString();
  const state = formData.get("state")?.toString() || "";
  const tenant_id = formData.get("tenant_id")?.toString();
  const scope = formData.get("scope")?.toString() || "mcp:tools mcp:resources";

  if (!redirect_uri || !tenant_id) {
    return new Response("Missing redirect_uri or tenant_id", { status: 400 });
  }

  // Validate client against D1 registry if DB is available
  let resolvedScope = scope;
  if (env.DB && clientId) {
    const client = await getClient(env.DB, clientId);
    if (client) {
      if (!isRedirectUriAllowed(client, redirect_uri)) {
        return new Response("Invalid redirect_uri for this client", { status: 400 });
      }
      resolvedScope = resolveScopes(client, scope);
    }
    // If client not found in DB, still allow (backward compat for unregistered clients)
  }

  const code = `code_${crypto.randomUUID().replace(/-/g, "")}`;
  const store = oauthStore(env);
  if (store) {
    await store.put(
      `oauth_code:${code}`,
      JSON.stringify({
        client_id: clientId,
        tenant_id,
        scope: resolvedScope,
        expires_at: Date.now() + 10 * 60 * 1000,
      }),
      { expirationTtl: 600 }
    );
  }

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", code);
  if (state) redirectUrl.searchParams.set("state", state);

  return Response.redirect(redirectUrl.toString(), 302);
}

export async function handleTokenExchange(
  request: Request,
  env: OAuthAuthServerEnv
): Promise<Response> {
  const url = new URL(request.url);
  const issuer = issuerForRequest(url, env);
  const audience = resourceForRequest(url, env);

  let body: Record<string, string> = {};
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    for (const [key, value] of formData.entries()) {
      body[key] = value.toString();
    }
  } else {
    body = (await request.json().catch(() => ({}))) as Record<string, string>;
  }

  const grant_type = body.grant_type;
  let tenant_id = "";
  let scope = "";
  let clientId = body.client_id || "";

  // Client authentication (Basic auth or body params)
  const authHeader = request.headers.get("Authorization") || "";
  let clientSecret = body.client_secret || "";
  if (authHeader.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice(6));
    const colonIdx = decoded.indexOf(":");
    if (colonIdx > 0) {
      clientId = decodeURIComponent(decoded.slice(0, colonIdx));
      clientSecret = decodeURIComponent(decoded.slice(colonIdx + 1));
    }
  }

  // Validate client if D1 is available and client_id is provided
  if (env.DB && clientId) {
    const client = await getClient(env.DB, clientId);
    if (client) {
      // Verify secret if provided
      if (clientSecret) {
        const secretValid = await verifyClientSecret(client, clientSecret);
        if (!secretValid) {
          return jsonError(401, "invalid_client", "Client authentication failed");
        }
      }
      // Verify grant type is allowed
      if (!client.grant_types.includes(grant_type || "")) {
        return jsonError(400, "unauthorized_client", "Grant type not allowed for this client");
      }
    }
  }

  if (grant_type === "authorization_code") {
    const code = body.code;
    if (!code) {
      return jsonError(400, "invalid_request", "Missing code");
    }

    const store = oauthStore(env);
    const cachedRaw = store ? await store.get(`oauth_code:${code}`) : null;
    if (!cachedRaw) {
      return jsonError(400, "invalid_grant", "Invalid or expired authorization code");
    }

    const cached = JSON.parse(cachedRaw);
    tenant_id = cached.tenant_id;
    scope = cached.scope;
    clientId = cached.client_id || clientId;
    if (store) await store.delete(`oauth_code:${code}`);
  } else if (grant_type === "client_credentials") {
    tenant_id = request.headers.get("x-tenant-id") || body.tenant_id || "integratewise";
    scope = body.scope || "mcp:tools mcp:resources";

    // For client_credentials, resolve scopes against client registry
    if (env.DB && clientId) {
      const client = await getClient(env.DB, clientId);
      if (client) {
        scope = resolveScopes(client, scope);
        tenant_id = client.tenant_id;
      }
    }
  } else if (grant_type === "refresh_token") {
    const refreshToken = body.refresh_token;
    if (!refreshToken) {
      return jsonError(400, "invalid_request", "Missing refresh_token");
    }

    if (!env.DB) {
      return jsonError(500, "server_error", "Refresh tokens require D1 database");
    }

    const record = await consumeRefreshToken(env.DB, refreshToken);
    if (!record) {
      return jsonError(400, "invalid_grant", "Invalid, expired, or revoked refresh token");
    }

    // Verify client_id matches the one that issued the refresh token
    if (clientId && clientId !== record.client_id) {
      return jsonError(400, "invalid_grant", "Refresh token does not belong to this client");
    }

    tenant_id = record.tenant_id;
    scope = record.scopes;
    clientId = record.client_id;
  } else {
    return jsonError(400, "unsupported_grant_type", "Grant type not supported");
  }

  const expires_in = 3600;
  const access_token = await signJWT(
    {
      iss: issuer,
      aud: audience,
      sub: clientId || "mcp-client",
      tenant_id,
      role: grant_type === "client_credentials" ? "Admin" : "Member",
      scope,
      exp: Math.floor(Date.now() / 1000) + expires_in,
    },
    env.OAUTH_PRIVATE_KEY
  );

  // Issue refresh token if D1 is available (for authorization_code and refresh_token grants)
  let refresh_token: string | undefined;
  if (env.DB && (grant_type === "authorization_code" || grant_type === "refresh_token")) {
    refresh_token = await issueRefreshToken(env.DB, {
      client_id: clientId || "mcp-client",
      tenant_id,
      scopes: scope,
    });
  }

  const responseBody: Record<string, unknown> = {
    access_token,
    token_type: "Bearer",
    expires_in,
    scope,
  };

  if (refresh_token) {
    responseBody.refresh_token = refresh_token;
  }

  return new Response(JSON.stringify(responseBody), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });
}

function jsonError(status: number, error: string, error_description: string) {
  return new Response(JSON.stringify({ error, error_description }), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
