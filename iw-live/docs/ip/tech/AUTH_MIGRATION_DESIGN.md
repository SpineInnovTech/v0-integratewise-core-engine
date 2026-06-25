# Auth Migration Design: Supabase Auth → Cloudflare Zero Trust

**Status:** COMPLETE — Cloudflare Access (Google + GitHub) + Gateway D1 JWT is live. Zero Supabase auth.  
**Authority:** Nirmal, Founder  
**Date:** June 3, 2026 (migrated; updated 2026-06-09)

> **Outcome:** All authentication now flows through Cloudflare Access SSO and the
> Gateway-issued D1 JWT (RS256). `auth-provider.tsx` was rewritten with zero
> Supabase auth imports. Supabase remains ONLY the fortress DATA record of truth
> (RLS, durability) — it is never an auth path. The inventory below is retained
> as the historical migration record.

---

## Current State (historical — pre-migration)

Every authenticated request in IntegrateWise currently passes through Supabase Auth in some form. The migration target is Cloudflare Zero Trust (Access) for all authentication, with the Gateway remaining the single point of tenant resolution and authorization.

### Auth Touchpoint Inventory

| Layer             | File                                                  | What It Does                                                                                            | Migration Action                                      |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Frontend**      | `apps/web/src/utils/spine/client.ts`                  | Creates Supabase client with PKCE auth flow, `autoRefreshToken`, `persistSession`, `detectSessionInUrl` | Replace with CF Access JWT auth                       |
| **Frontend**      | `apps/web/src/utils/supabase/client.ts`               | Supabase client creation                                                                                | Remove or repurpose                                   |
| **Frontend**      | `apps/web/src/utils/supabase/info.tsx`                | Supabase project ID + anon key                                                                          | Remove                                                |
| **Frontend**      | `apps/web/src/components/core/auth/auth-provider.tsx` | Auth provider wrapping app                                                                              | Rewrite for CF Access                                 |
| **Frontend**      | `apps/web/src/hooks/use-action-realtime.ts`           | Realtime channel with Supabase                                                                          | Keep (database, not auth)                             |
| **Gateway**       | `services/gateway/src/index.ts:66-67`                 | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` bindings                                                   | Remove after migration                                |
| **Gateway**       | `services/gateway/src/index.ts:1580`                  | `verifySupabaseDevToken()` call — dev fallback auth                                                     | Remove entirely                                       |
| **Gateway**       | `services/gateway/src/index.ts:1959`                  | `verifySupabaseDevToken()` function definition                                                          | Remove entirely                                       |
| **Gateway**       | `services/gateway/src/index.ts:1964`                  | `fetch(\`${SUPABASE_URL}/auth/v1/user\`)` — token verification                                          | Replace with CF Access JWT verification               |
| **Gateway**       | `services/gateway/src/index.ts:1985-2014`             | Profile resolution via Supabase REST API                                                                | Move to CF Workers KV/D1                              |
| **MCP Connector** | `services/mcp-connector/src/handlers/tools.ts:31-32`  | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` bindings                                                   | Keep — this is DATA access, not auth                  |
| **MCP Connector** | `services/mcp-connector/src/lib/jwt-verify.ts`        | Supabase JWT verification (243 lines)                                                                   | Remove — replace with CF Access JWT                   |
| **MCP Connector** | `services/mcp-connector/src/lib/access-auth.ts`       | Cloudflare Access OAuth (223 lines)                                                                     | Keep — this IS the target auth                        |
| **Workflow**      | `services/workflow/src/index.ts` (15+ locations)      | `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`                                                 | Keep — database access, not auth                      |
| **Pipeline**      | `services/pipeline/src/index.ts`                      | `createClient` from Supabase                                                                            | Keep — database access, only service with write creds |
| **Spine-v2**      | `services/spine-v2/src/index.ts`                      | `createClient` from Supabase                                                                            | Keep — database access                                |
| **Normalizer**    | `services/normalizer/src/index.ts`                    | Dynamic `createClient` import                                                                           | Keep — database access                                |
| **Loader**        | `services/loader/src/index.ts`                        | Dynamic `createClient` import                                                                           | Keep — database access                                |
| **Connector**     | `services/connector/src/token-refresh.ts`             | `createClient` for token refresh                                                                        | Keep — database access                                |
| **Connector**     | `services/connector/src/routes/internal.ts`           | Dynamic `createClient` import                                                                           | Keep — database access                                |
| **Packages**      | `packages/supabase/src/server.ts`                     | Server-side Supabase client                                                                             | Remove or repurpose                                   |
| **Packages**      | `packages/supabase/src/client.ts`                     | Client-side Supabase client                                                                             | Remove or repurpose                                   |
| **Packages**      | `packages/supabase/src/hooks/index.ts`                | Auth hooks (useAuth, useSession)                                                                        | Rewrite for CF Access                                 |
| **Packages**      | `packages/rbac/src/engine.ts`                         | `createClient` for RBAC queries                                                                         | Keep — database access                                |
| **Packages**      | `packages/db/src/supabase.ts`                         | Database client                                                                                         | Keep — database access                                |

### What Is Auth vs. What Is Data Access

The critical distinction:

- **AUTH** (must migrate): JWT verification, session management, login/logout, token refresh, profile resolution via auth user
- **DATA ACCESS** (keep as-is): Supabase REST queries with service role key, `createClient` for database operations, realtime subscriptions

Most Supabase usage in this codebase is **data access**, not auth. The actual auth surface is small:

1. **Frontend PKCE login flow** — 1 file
2. **Gateway `verifySupabaseDevToken()`** — 1 function + 1 call site
3. **Gateway profile resolution** — 1 function (fetches profile by auth user email/id)
4. **MCP Connector JWT verification** — 1 file (jwt-verify.ts, 243 lines)
5. **Frontend auth provider** — 1 component
6. **Supabase auth hooks** — 1 package

---

## Target State

```
External Request
    │
    ▼
Cloudflare Access (auth.integratewise.ai)
    │  Verifies caller identity
    │  Issues JWT with aud: https://mcp.integratewise.ai
    ▼
Gateway (services/gateway)
    │  Validates JWT (issuer, audience, expiry)
    │  Resolves tenant from token claims or KV
    │  Enforces authorization
    ▼
Internal Services (via Service Bindings)
    │  No auth needed — private network
    ▼
Supabase (data access only)
    │  Pipeline has write credentials
    │  Other services read via Pipeline or Service Bindings
```

### Auth Flow: External MCP Client

```
1. Client hits mcp.integratewise.ai
2. Server returns 401 + WWW-Authenticate: Bearer resource_metadata=...
3. Client fetches /.well-known/oauth-protected-resource
4. Client redirected to auth.integratewise.ai for OAuth
5. Client receives JWT (aud: mcp.integratewise.ai, sub: client_id, scopes: [...])
6. Client calls mcp.integratewise.ai with Authorization: Bearer <token>
7. Gateway validates JWT, resolves tenant, serves MCP tools
```

### Auth Flow: Frontend (apps/web)

```
1. User opens app.integratewise.ai
2. Cloudflare Access intercepts, handles login
3. CF Access issues JWT
4. Frontend receives JWT (via CF Access cookie or header)
5. Frontend sends JWT to Gateway with every API call
6. Gateway validates JWT, resolves tenant
```

### Auth Flow: Internal Worker-to-Worker

```
1. Worker A calls Worker B via Service Binding
2. No JWT needed — private Cloudflare runtime
3. Tenant context passed via binding parameters
4. No public ingress traversed
```

---

## Implementation Phases

### Phase 1: Gateway OAuth Authorization Server (DONE)

The gateway already has OAuth authorization server routes at `auth.integratewise.ai`:

- `services/gateway/src/index.ts` — OAuth metadata, authorize, token endpoints
- `services/gateway/src/lib/jwt.ts` — JWT signing/verification
- `services/gateway/wrangler.toml` — Routes for `auth.integratewise.ai` and `mcp.integratewise.ai`

Status: **Implemented, needs testing and deployment.**

### Phase 2: Remove `verifySupabaseDevToken()` from Gateway

This is the simplest migration step:

1. Remove `verifySupabaseDevToken()` function definition (line 1959)
2. Remove the call site (line 1580)
3. Make CF Access JWT the ONLY auth path in production
4. Keep dev auth as a separate mechanism (e.g., CF Access service tokens for local dev)

**Files to change:**

- `services/gateway/src/index.ts` — Remove function + call site

### Phase 3: Replace MCP Connector JWT Verification

Replace `jwt-verify.ts` (Supabase JWT verification) with CF Access JWT verification:

1. Remove `services/mcp-connector/src/lib/jwt-verify.ts` (243 lines)
2. Update `services/mcp-connector/src/index.ts` to use CF Access JWT validation
3. The existing `access-auth.ts` (Cloudflare Access OAuth, 223 lines) already implements the target pattern

**Files to change:**

- `services/mcp-connector/src/lib/jwt-verify.ts` — Delete
- `services/mcp-connector/src/index.ts` — Update auth middleware

### Phase 4: Move Profile Resolution Off Supabase Auth

Currently the gateway resolves profiles by calling Supabase REST API with the auth user's email/id. Move this to CF Workers KV or D1:

1. Pipeline writes profile data to KV/D1 when users are created/updated
2. Gateway reads profile from KV/D1 instead of Supabase REST
3. Remove `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from Gateway bindings

**Files to change:**

- `services/gateway/src/index.ts` — Replace `fetchProfileById()` and `fetchProfileByEmail()` with KV/D1 reads
- `services/gateway/wrangler.toml` — Add KV/D1 binding for profiles
- `services/pipeline/src/index.ts` — Add profile write to KV/D1 on user creation/update

### Phase 5: Rewrite Frontend Auth

Replace Supabase PKCE auth with CF Access:

1. Remove `apps/web/src/utils/spine/client.ts` — Supabase PKCE client
2. Remove `apps/web/src/utils/supabase/client.ts` and `info.tsx`
3. Rewrite `apps/web/src/components/core/auth/auth-provider.tsx` for CF Access
4. Rewrite `packages/supabase/src/hooks/index.ts` auth hooks
5. Frontend reads JWT from CF Access cookie/header
6. Frontend sends JWT to Gateway with every API call

**Files to change:**

- `apps/web/src/utils/spine/client.ts` — Remove Supabase client creation
- `apps/web/src/utils/supabase/` — Remove directory
- `apps/web/src/components/core/auth/auth-provider.tsx` — Rewrite
- `packages/supabase/src/hooks/index.ts` — Rewrite auth hooks

### Phase 6: Cleanup

1. Remove `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Gateway `Env` interface
2. Remove `packages/supabase/` package or repurpose for database-only usage
3. Update `apps/web/.env.example` to remove Supabase auth vars
4. Update `AGENTS.md` auth architecture section
5. Verify all services still work with Gateway as sole auth entry point

---

## Risk Assessment

| Risk                                                      | Mitigation                                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Breaking login for existing users                         | Keep Supabase auth running in parallel during migration; switchover only after CF Access is verified |
| CF Access not supporting all MCP client auth patterns     | Test with Cursor, Claude Desktop, and custom agents before cutover                                   |
| Profile resolution latency increase (KV vs Supabase REST) | KV reads are sub-millisecond; this is actually faster                                                |
| Dev workflow disruption                                   | Keep dev auth separate; do not require CF Access for local development                               |
| Token refresh for long-lived sessions                     | CF Access handles session management; no custom refresh needed                                       |

---

## Canonical Wording

> IntegrateWise authenticates all external traffic through Cloudflare Zero Trust (Access). The Gateway validates JWTs, resolves tenant context from token claims, and enforces authorization. Internal Worker-to-Worker communication uses Service Bindings with no auth overhead. Profile resolution moves from Supabase Auth to Cloudflare Workers KV, populated by the Pipeline on user creation and update. Supabase remains the data fortress — only the Pipeline holds write credentials; all other services access data through the Gateway or Service Bindings.

---

_Document: Auth Migration Design_  
_Author: Nirmal, Founder_  
_Status: Design complete, ready for implementation._  
_Date: June 3, 2026_
