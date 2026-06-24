---
name: Gateway empirical facts
description: Observed runtime behavior of the live IntegrateWise platform gateway and its auth wall
---

The platform gateway is live at `https://gateway.integratewise.ai` (override via `VITE_GATEWAY_URL`).

- `GET /health` → 200, public, and CORS-open to the browser (the dev preview's connection
  pill reaches it directly). Returns `{ status, service, ts }`.
- `GET /api/v1/*` → behind an RS256 / Cloudflare-Access JWT wall. Without a credential it
  returns 401 "Missing JWT". So the whole `/api/v1` surface requires a platform-issued JWT;
  a 200 there means the edge accepted (verified) the token.
- Clerk secrets exist in env (`CLERK_*`) but DO NOT satisfy the gateway — different issuer.
  There is no platform token / OAuth client / gateway URL config in env yet.
- Three conflicting endpoint contracts exist (platform diagram vs `temp_apps_web`
  gateway-adapter table-map vs workspace-api). They **cannot be resolved without an authed
  probe** — pin the real contract only after a valid JWT is available.

**Why it matters:** lighting up real gateway data needs (a) a valid platform JWT or OAuth
config and (b) contract verification — both only the user/platform side can supply. Build
honest UI meanwhile; never fake live data.
