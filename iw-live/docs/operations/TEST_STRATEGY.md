# Test Strategy — Unit CI vs Live Verification

> **Tier:** B (Derived). References Canon: `AGENTS.md`, `docs/CANON.md`.
> **Date:** June 12, 2026

## The split (Option A)

```text
Unit CI  (.github/workflows/ci.yml)          — runs on every push/PR, BLOCKING on guardrails
  Validate (blocking):  doctrine · typecheck · lint · build      ← all green
  Unit Tests (non-blocking signal): active-package vitest        ← see harness debt below

Live Verification  (.github/workflows/live-verification.yml)     — manual / post-deploy
  e2e:          Projection-context regression (CS persona) + Playwright suite
                (onboarding · workspace · gateway-wiring)
  integration:  Flow A/B/C (needs deployed infra)
```

### First-class guard: Projection Context (CS persona)

`apps/web/e2e/projection-context.spec.ts` runs as the **first** step of the `e2e` job. It asserts a
CUSTOMER_SUCCESS persona resolves to ONE context across header/nav/workbench
(`data-iw-projection-department` === `data-iw-active-domain` === `CUSTOMER_SUCCESS`; no
"Business Operations" leak). Proven **bidirectional locally**: it passes with the single-authority
seed in `useProjection()` and **fails** if that seed regresses (falls back to `bizops`). This moves
the `CUSTOMER_SUCCESS → Business Operations` defect from known-bug to guarded regression
(`PROJECTION_MODEL.md` §5, `CURRENT_CONTEXT_FLOW.md`).

Runtime env note: the test boots the full SPA, which needs runtime config. Locally it uses the
repo `.env`. In CI the `e2e` job is **non-blocking** (`continue-on-error`) and reads
`PLAYWRIGHT_BASE_URL` / `VITE_*` from secrets — point it at a deployed app for true live
verification, or supply the `VITE_*` secrets so the dev server boots. `playwright.config.ts` starts
the dev server unless `PLAYWRIGHT_BASE_URL` is set. The local run is the authoritative guard today.

**Why:** deprecated services and integration tests cannot pass on a bare runner, so they must not
fail "Build & Validate." The real guardrails (doctrine/typecheck/lint/build) are green and block
merges; everything that needs a deployed stack or full runtime moves to Live Verification.

## Excluded from unit CI (run in Live Verification or deprecated)

- **Deprecated services** (merged per v3.6, `AGENTS.md`): `act`, `normalizer`, `think`, `govern`,
  `store`, `loader`, `agents`.
- **integration-tests**: Flow A/B/C E2E — require deployed endpoints + secrets.

## Known unit-test harness debt (tracked — non-blocking until fixed)

These are **test-environment** issues, not product regressions. Unit tests run as a non-blocking
signal until each is repaired:

| Package         | Symptom                                                                    | Fix direction                                    |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| `mcp-connector` | module calls `process.exit` when `CODA_API_TOKEN` unset at import          | guard import / inject test env                   |
| `intelligence`  | vitest cannot resolve `cloudflare:workers` (bulk-swarm.ts)                 | `@cloudflare/vitest-pool-workers` or alias/mocks |
| `gateway`       | Node-22 fetch requires `duplex` on body; content-type assertion drift      | update test harness to Node-22 fetch semantics   |
| `pipeline`      | `pipeline.test.ts` routing mock — `spine/index` mock missing named exports | complete the `vi.mock` exports                   |

When a package's harness is fixed, it should pass in unit CI; once all are green, flip the
`unit-tests` job to blocking (remove `continue-on-error`).

## Local commands

```bash
pnpm run typecheck     # 37 packages + web — green
pnpm run lint          # green
pnpm run build         # green
node scripts/check-doctrine.mjs   # doctrine drift gate — green
pnpm exec turbo test --continue   # full test signal (includes known-debt suites)
```
