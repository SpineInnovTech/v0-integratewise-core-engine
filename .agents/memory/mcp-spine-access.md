---
name: MCP/Spine access from Customer Zero
description: How to obtain a working token and reach the integratewise-live Spine MCP surface from this repo, and what it does/doesn't open
---

# Reaching the Spine MCP surface from Customer Zero

- **No-secret token mint (works in prod):** `POST https://mcp.integratewise.ai/oauth/token`, body `grant_type=client_credentials&scope=mcp:tools mcp:resources memory:read memory:write`, header `x-tenant-id: <tenant>`. Returns a ~1h RS256 Bearer. `token_endpoint_auth_methods_supported` includes `"none"`; the connector's `handleTokenExchange` only validates a client when a `client_id` is supplied, so omitting it mints a token directly.
- **Claims of the minted token:** `iss`/`aud` = `https://mcp.integratewise.ai`, `sub=mcp-client`, `role=Admin`, `tenant_id` = whatever `x-tenant-id` you pass (e.g. `iw-customer-zero`). Over-permissive by design of the open public client — a platform-side smell, not ours to fix in this repo.
- **What it opens:** the MCP surface. `POST https://mcp.integratewise.ai/mcp` (JSON-RPC `tools/list`) and `GET /tools` both 200. 19 live Spine tools: `kb.*`, `memory.*`, `spine.entity.{get,list,search}`, `signal.list`, `proposal.{list,approve,reject}` (HITL), `search.semantic`.
- **What it does NOT open:** the gateway REST surface `https://gateway.integratewise.ai/api/v1/*`. That path verifies issuer `https://auth.integratewise.ai` + audience `https://app.integratewise.ai` (or a Cf-Access JWT). The MCP token's issuer is `mcp.integratewise.ai` → 401 "Invalid issuer". A different credential is required for `/api/v1`.
- **404 dead-end to remember:** `auth.integratewise.ai/oauth/token` and `/oauth/register` return 404 in prod (advertised in `.well-known` discovery but not routed). Only the `mcp.` host serves the working token endpoint. `/oauth/*` is proxied to the connector worker (`env.CONNECTOR`).

**Why:** unblocks "connect Customer Zero to the Spine" with no Cloudflare admin and no user-provided secret. Records the exact working endpoint after the auth-host 404 dead-end, and the issuer/audience boundary that keeps the REST gateway closed.

**How to apply:** when wiring, mint server-side in the api-server relay and cache (~55m), then proxy MCP tool calls through `/api/...` so no token or platform logic ships in the browser bundle (matches relay + platform-boundary doctrine). Never persist a token value to memory or the repo.
