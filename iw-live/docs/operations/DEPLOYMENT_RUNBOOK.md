# Deployment Runbook — Cloudflare (P1 unblock)

> **Tier:** B (Operations). Canon: `AGENTS.md` (HARD RULE 3 — deploy), `docs/operations/CF_WIRE_STATUS.md`.
> **Date:** June 12, 2026 | **Purpose:** Make the blocked frontend deploy + Live Verification a true
> release gate. The code/workflows are ready; the only blockers are **credentials/secrets** (your
> dashboard action). No token or account-ID values appear in this file (HARD RULE 2).

---

## TL;DR — what's blocked and why

```text
Code ✓   Workflows ✓   Tests ✓   Live Verify (wired, non-blocking)   Pages Deploy ✗ (token scopes)
```

The Pages deploy fails with `Authentication error [code: 10000]` / missing `User → Memberships → Read`.
That's a **token-scope** problem, not a code problem. Fix the token + a few secrets and the whole
deploy + verification chain turns green.

---

## Fix 1 — Cloudflare API token (the actual blocker)

`wrangler pages deploy` needs a token that can edit Pages **and** read the user/membership it runs as.
Create/edit the token in the Cloudflare dashboard (My Profile → API Tokens) with these permissions:

| Scope                                               | Permission |
| --------------------------------------------------- | ---------- |
| Account → **Cloudflare Pages**                      | **Edit**   |
| User → **Memberships**                              | **Read**   |
| User → **User Details**                             | **Read**   |
| (workers deploy only) Account → **Workers Scripts** | **Edit**   |

Account resource: the IntegrateWise account (id is in `AGENTS.md` / dashboard — do not paste it into code).

Then set it as the GitHub repo secret **`CLOUDFLARE_API_TOKEN`** (Settings → Secrets and variables →
Actions). Also confirm **`CLOUDFLARE_ACCOUNT_ID`** secret is set to the IntegrateWise account id.

> The classic "Edit Cloudflare Workers" template often omits **User → Memberships → Read**, which is
> exactly the `code 10000` failure. Add it explicitly.

## Fix 2 — VITE\_\* build secrets (so the deployed app actually boots)

The build embeds runtime config. Without these the deployed SPA boots blank/stuck (the same reason
the Live Verification e2e can't reach the workspace on a bare runner). Set as GitHub secrets:

| Secret                                                      | Used for                                              |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| `VITE_API_BASE_URL`                                         | gateway base (e.g. the auth/gateway URL)              |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`              | legacy client bootstrap (until de-Supabase completes) |
| `VITE_STREAM_URL`                                           | stream gateway (optional)                             |
| `VITE_POSTHOG_KEY` · `VITE_SENTRY_DSN` · `VITE_LANDING_URL` | optional analytics/links                              |

(Names only — values live in Cloudflare/GitHub secrets, never in the repo.)

## Fix 3 — confirm the Pages project exists

Workflows deploy to `--project-name=integratewise`. Confirm a Pages project named **`integratewise`**
exists in the account (Cloudflare → Workers & Pages). Landing uses `integratewise-landing`.

---

## Verify (after the fixes)

1. **Frontend preview deploy** — push to a `feat/**` branch or run _Deploy Frontend — Preview Only_.
   Expect a `*.integratewise.pages.dev` preview URL in the run summary. (Prod promotion stays manual.)
2. **Live Verification becomes real** — set the GitHub secret **`PLAYWRIGHT_BASE_URL`** to the preview
   (or `app.integratewise.ai`) and run _Live Verification → e2e_. The CS-persona projection guard then
   runs against a real deployed app instead of a bare dev server.
3. **Health check** — `deploy-cloudflare.yml` already curls `/deployment.json` and `gateway/health`.

---

## What is NOT automated (by design)

- **Production promotion** to `app.integratewise.ai` is **manual** by Nirmal via the Cloudflare
  dashboard (workflows deploy preview-only; HARD RULE 3 — preview first, then promote).
- **Local wrangler:** `unset CLOUDFLARE_API_TOKEN` before any local `wrangler` command so the
  OAuth session (connect@integratewise.ai) is used (AGENTS.md). CI uses the token instead.

---

## The cascade (why this is P1)

```text
Fix token + VITE_* secrets
   ├─▶ Frontend preview deploys (green)
   │      └─▶ PLAYWRIGHT_BASE_URL set → Live Verification runs against real app
   │             └─▶ CS-persona projection guard becomes a true release gate
   └─▶ Deployed SPA boots with real config (no blank/stuck workspace)
```

One credential fix unblocks deploy, live verification, and the regression gate together.
