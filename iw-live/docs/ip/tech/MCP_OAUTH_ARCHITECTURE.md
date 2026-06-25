# MCP OAuth 2.0 Architecture

> Last updated: 2026-06-09
> Classification: internal
> Authority: Nirmal (Founder)

---

## Overview

- MCP connector (`mcp.integratewise.ai`) owns the OAuth 2.0 authorization server
- MCP protocol endpoint is the root: `POST https://mcp.integratewise.ai/` — `/mcp` is kept for backward compatibility only
- Gateway (`auth.integratewise.ai`) proxies OAuth traffic to MCP connector via service binding
- Both subdomains serve the same OAuth flow — MCP holds the crypto keys
- RS256 JWT tokens signed with shared key pair (`gateway/src/lib/jwt.ts`)

---

## Deployment Status (June 9, 2026)

- MCP Connector deployed: Version eb8137b4-99fd-4cd3-bb81-311caa3bd6f1
- Gateway deployed: Version 329b3793-c4d8-48e1-bec1-b47a50c5848a
- D1 Migration applied: oauth_clients, oauth_refresh_tokens, oauth_revocations tables live
- Token issuance verified: client_credentials grant working end-to-end
- MCP tools/list verified: 18 tools returned via authenticated POST /

---

## Domain Responsibilities

| Subdomain               | Auth Type                    | Audience                                         |
| ----------------------- | ---------------------------- | ------------------------------------------------ |
| `auth.integratewise.ai` | Gateway proxies to MCP OAuth | AI agents via browser consent                    |
| `mcp.integratewise.ai`  | Native OAuth 2.0 endpoints   | AI agents direct (Claude, ChatGPT, Cursor, Kiro) |

---

## OAuth Endpoints (served by MCP connector)

- `POST /` — MCP JSON-RPC protocol (primary endpoint)
- `POST /mcp` — MCP JSON-RPC protocol (backward compatibility)
- `GET /.well-known/oauth-authorization-server` — discovery metadata
- `GET /.well-known/oauth-protected-resource` — protected resource metadata
- `GET /.well-known/jwks.json` — public key for token verification
- `GET /oauth/authorize` — consent page (renders HTML form)
- `POST /oauth/authorize/confirm` — form submission → issues auth code
- `POST /oauth/token` — exchanges code/credentials/refresh_token for JWT
- `POST /oauth/revoke` — RFC 7009 token revocation

---

## Supported Grant Types

1. `authorization_code` — interactive consent flow for AI clients
2. `client_credentials` — machine-to-machine (no user interaction)
3. `refresh_token` — rotate access without re-authorization (30-day TTL)

---

## Token Format

- RS256 JWT (asymmetric — public key in JWKS, private key in Worker secrets)
- Claims: `iss`, `aud`, `sub`, `tenant_id`, `role`, `scope`, `exp`, `iat`
- Access token TTL: 1 hour
- Refresh token TTL: 30 days (stored hashed in D1, rotated on use)

---

## Scope Enforcement

Scopes map to MCP tool access:

- `mcp:tools` — superscope, grants access to all tools
- `mcp:resources` — read-only access to Spine entities, signals, proposals
- `tenant:read` / `tenant:write` — tenant-scoped data access
- `memory:read` / `memory:write` — memory layer access

Tool-level enforcement in `oauth-scopes.ts` — `tools/list` response is filtered to visible tools based on token scope.

---

## Client Registry (D1)

- Table: `oauth_clients` in `integratewise-spine-cache`
- Fields: `client_id`, `client_secret_hash` (SHA-256), `redirect_uris`, `allowed_scopes`, `grant_types`
- Validation: redirect_uri allowlist, scope intersection, grant_type restriction
- Registration: via `scripts/register-oauth-client.ts` or direct D1 SQL

---

## Refresh Token Storage (D1)

- Table: `oauth_refresh_tokens` in `integratewise-spine-cache`
- Tokens stored as SHA-256 hashes (plaintext never persisted)
- Rotation: old token revoked when new one is issued
- Revocation audit: `oauth_revocations` table

---

## Gateway Integration

- Gateway validates MCP tokens at the edge (signature + expiry check via `verifyJWT`)
- Enriches requests with `x-tenant-id`, `x-user-id`, `x-user-role`, `x-oauth-scope` headers
- Forwards to MCP connector via `CONNECTOR` service binding
- If Gateway is down, MCP connector still serves OAuth directly on `mcp.integratewise.ai`

---

## Auth Cascade (MCP connector verifyAuth)

Priority order:

1. Service binding (`cf-worker` header) → Admin role
2. Cloudflare Access JWT (`CF-Access-JWT-Assertion`) → Member role
3. IntegrateWise OAuth JWT (`iss` contains "integratewise.") → role from token + scope
4. Triage Bot API key → TriageBot + Admin roles
5. MCP Connector API key → Admin role
6. Supabase JWT → tenant from claims

---

## Migration

Deploy D1 schema:

```bash
wrangler d1 execute integratewise-spine-cache --file services/mcp-connector/migrations/0001_oauth_tables.sql
```

---

## Client Configuration (Claude Desktop example)

```json
{
  "mcpServers": {
    "integratewise": {
      "url": "https://mcp.integratewise.ai",
      "auth": {
        "type": "oauth2",
        "client_id": "claude-desktop-iw",
        "client_secret": "your-secret",
        "authorize_url": "https://mcp.integratewise.ai/oauth/authorize",
        "token_url": "https://mcp.integratewise.ai/oauth/token",
        "scope": "mcp:tools mcp:resources memory:read"
      }
    }
  }
}
```

---

## Files

- `services/mcp-connector/src/lib/oauth-auth-server.ts` — authorization server (consent, token exchange)
- `services/mcp-connector/src/lib/oauth-clients.ts` — D1 client registry
- `services/mcp-connector/src/lib/oauth-refresh.ts` — refresh token management
- `services/mcp-connector/src/lib/oauth-scopes.ts` — scope-to-tool enforcement
- `services/mcp-connector/src/lib/oauth-middleware.ts` — resource server middleware
- `services/mcp-connector/src/lib/oauth-constants.ts` — scopes, path detection, WWW-Authenticate
- `services/mcp-connector/migrations/0001_oauth_tables.sql` — D1 schema
- `services/gateway/src/lib/jwt.ts` — RS256 sign/verify (shared key pair)
- `services/gateway/src/index.ts` — OAuth proxy for auth.integratewise.ai
