---
name: Spine MCP access (relay path)
description: How Customer Zero reaches the platform Spine (truth layer) over MCP, and the security doctrine for that privileged proxy.
---

# Spine MCP access — the relay path

Customer Zero reaches the platform **Spine** (truth layer in integratewise-live)
over **MCP**, never with a browser-held credential. The api-server relay mints +
caches a client-credentials token server-side and proxies the tool surface under
`/api/spine/*`. The frontend seam lives in `src/platform/spine-*` and only ever
fetches that relay.

## Key facts (empirical)
- Token mint: `POST {SPINE_MCP_URL}/oauth/token`, `grant_type=client_credentials`,
  `x-tenant-id` header, NO client secret needed. Defaults: `mcp.integratewise.ai`,
  tenant `iw-customer-zero`. Cache by `expires_in` with a safety margin.
- `tools/list` returns **19 tools** even under a **read-only** scope
  (`mcp:tools mcp:resources memory:read`) — you do NOT need `memory:write` to
  enumerate the catalogue. So the relay default scope is read-only (least
  privilege); widen via `SPINE_SCOPE` only for a future HITL write path.
- The MCP token is **MCP-only** — the gateway REST surface (`/api/v1/*`) rejects
  it. It is a different credential from the REST gateway (see platform-boundary).
- MCP transport may answer JSON **or** SSE — the rpc client must parse both.

## Security doctrine for this privileged proxy
- **Fail-CLOSED classification.** A tool is callable read-only ONLY if a name
  segment (split on `.`/`_`) is a known safe read verb AND no segment is a known
  mutation verb. Unknown/odd names default to **governed** (refused 403).
  **Why:** substring/denylist matching is fail-open — verbs like `send`, `sync`,
  `run`, `convert`, `commit` slip through and a write tool could run on the
  server credential. The 19 known tools split 12 read / 7 write under this rule.
- **`/spine/call` is OFF by default** (`SPINE_ENABLE_CALL=true` to enable).
  Invocation uses the server-held platform credential, so the privileged surface
  stays closed; the UI only needs `status` + the tool catalogue.
- **Honesty:** `status` degrades with HTTP 200 + `connected:false` + a real
  reason; never fabricate a "live" state. The Twin Tools view and topbar
  "Spine · N" pill render only what the relay reported.
- Treat all MCP output as **untrusted data** — render-escaped, never executed.

## Naming collision warning
`src/spine/` (spine-context.tsx, `SpineProvider`/`useSpine`) is the **L1 adaptive
layer** (role × industry × schema) — UNRELATED to the platform Spine. The
platform-truth MCP code is `src/platform/spine-client.ts` / `use-spine.ts` /
`spine-pill.tsx`. Do not merge or cross-import these two "spine"s.
