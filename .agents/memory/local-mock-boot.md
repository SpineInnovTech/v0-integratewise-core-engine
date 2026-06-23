---
name: local-mock offline boot
description: How the adopted apps/web frontend boots fully offline in this repo, and the two-auth-layer trap that makes "no network at boot" non-obvious.
---

# local-mock offline boot

The frontend was adopted whole from the platform's `apps/web` (real, gateway-wired UI). A single env flag, `VITE_SPINE_PROVIDER=local-mock` (in the artifact's `.env`), is the master switch that makes the whole app boot offline: the spine client serves simulated records, the gateway client skips its "missing VITE_API_BASE_URL" throw, and auth mints a synthetic session.

**Why:** Phase-A goal is to render the real shell with zero network and zero authorized mutations before the live Cloudflare gateway is wired (Phase B). Flipping to the gateway = set `VITE_SPINE_PROVIDER=gateway-proxy` + `VITE_API_BASE_URL`.

## The two-auth-layer trap (the non-obvious part)
There are TWO parallel auth systems in the adopted code, and BOTH must be satisfied or you get a stray network call / wrong gate:
- `src/contexts/auth-context.tsx` wraps the `authManager` singleton and is the **login-vs-shell gate** at the App root (`isAuthenticated = user !== null`).
- `src/components/core/auth/auth-provider.tsx` exposes `useAuth` and is what **`AppShell` actually consumes** (`refreshSession`, `user.app_metadata.tenant_id`). Its `refreshSession()` calls `authManager.refreshToken()`.

So neutralizing auth for offline boot must happen **inside `authManager`**, not in either provider, because the AppShell provisioning loop calls `refreshToken()` directly. Guard points in `auth-manager.ts`, all gated on `IS_LOCAL_MOCK`:
1. Constructor mints a tenant-zero session offline instead of silent-refresh.
2. `_doRefresh()` short-circuits — returns the current token, never fetches `/api/v1/auth/me`. (This is the one that actually killed the boot 401, because the provisioning loop calls it.)
3. `_scheduleProactiveRefresh()` returns early.

**setTimeout overflow gotcha:** the mock JWT uses a ~1-year `exp`. `exp - 5min` in ms exceeds the 32-bit `setTimeout` limit (~24.8 days) and would fire *immediately*, triggering a refresh → network call. That's the real reason `_scheduleProactiveRefresh` must no-op in local-mock, not just for tidiness.

## Operating identity
local-mock mints tenant-zero **`iw-customer-zero`** (admin/god view), email `connect@integratewise.ai`, via a decode-only unsigned JWT (`header.payload.local-mock`) — never sent to or verified by a real gateway. AppShell logs `tenant_id resolved during provisioning, attempt 1 iw-customer-zero` and lands on the real onboarding flow.

## Verifying offline boot
Restart the `artifacts/integratewise: web` workflow, screenshot `/app`. Console should show only the Spine `local-mock` init + the tenant-zero provisioning line — **no 401, no resource errors**. Any `401` means a caller reached `auth-manager`'s gateway path; trace it back through the two auth layers above.
