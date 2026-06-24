---
name: Platform boundary (universal front-end)
description: How artifacts/integratewise talks to the platform gateway — the auth seam and honest connection states
---

`src/platform/` is the single boundary between the front-end and the Cloudflare gateway.

- `gateway-client.ts` — typed fetch wrapper. Every non-2xx and every network/CORS error
  becomes a typed `GatewayError` (status 0 = unreachable, code `"aborted"` = cancelled,
  401/403 = unauthorized). NO silent fallback to empty data — callers must render honest states.
- `token-provider.ts` — token seam, modes `demo | provided-token | platform`. `provided-token`
  = a dev JWT in localStorage (`iw.platform.token.v1`). `platform` (OAuth) not yet wired.
  JWT decode is display-only (no verification — the gateway is the only authority).
- `platform-context.tsx` — `PlatformProvider` live-probes `/health`, then the auth-walled
  session path; exposes honest state `checking | connected | not_authenticated | offline`
  plus the typed client. The probe uses a monotonic id + shared AbortController so a stale
  refresh can never overwrite newer state.
- `connection-pill.tsx` — honest topbar indicator; the JWT-paste affordance is gated behind
  `import.meta.env.DEV || VITE_ALLOW_TOKEN_PASTE` (never ship credential-paste to prod).

**Decisions:**
- "connected" is shown ONLY after an auth-walled endpoint accepts the token. The session path
  is `GATEWAY_SESSION_PATH` (env `VITE_GATEWAY_SESSION_PATH`, default `/api/v1/health`).
  **Swap the default to the real identity endpoint (e.g. `/api/v1/me`) once the contract is pinned.**
- Do NOT adopt the heavyweight Supabase-shaped `temp_apps_web` gateway-adapter. This minimal
  typed client is the chosen seam.
- Demo mode is reported as "not connected", never disguised as live.
