---
name: integratewise-live CI & doctrine ratchet
description: How the integratewise-live (Cloudflare platform) repo gates PRs — doctrine ratchet semantics + Validate step order. Use when fixing its CI/typecheck/build from this workspace.
---

# integratewise-live CI & doctrine ratchet

Knowledge about the **separate private repo** `integratewise-live` (the Cloudflare
platform), gathered while fixing its deployment pipeline from this workspace. Not
derivable from iwa-customer-zero's own code.

## Doctrine ratchet (`scripts/check-doctrine.mjs` + `scripts/doctrine-baseline.json`)
- It is a **one-way ratchet** over banned terms (supabase, openwebui, dual-write,
  couchdb, n8n, ETL insert-select / bulk-copy). Compares live count vs baseline.
- **Count goes UP → FAIL** (new drift). **Count goes DOWN → PASS** and it tightens
  the baseline in-memory (in CI that write is discarded; the committed baseline is
  untouched). Equal → pass.
- **Consequence:** removing banned terms is *always* doctrine-safe and needs **no
  baseline edit**. The doctrine-aligned fix for a stray `supabase` ref is to
  **remove it** — never re-add a type field / placeholder to "mask" an error.
- `--update` regenerates the baseline; treat that as forbidden unless the repo owner
  explicitly approves (it would let banned terms creep back in under the new ceiling).

## CI gate: workflow "CI — Build & Validate" (`.github/workflows/ci.yml`)
- Triggers on PRs (and pushes) targeting `main`/`staging`. A feature branch with an
  open PR is validated via the `pull_request` trigger, not `push`.
- **Validate** job = the blocking gate. Steps run **sequentially as separate steps**:
  install → **doctrine → typecheck → lint → build**. Any failing step aborts the rest,
  so a typecheck failure *hides* whether lint/build would pass. Get typecheck to zero
  before trusting lint/build are clean.
- **Unit Tests** job is **non-blocking** (`continue-on-error: true`) — known
  pre-existing test-harness debt (see its TEST_STRATEGY.md). Its red ✗ does NOT fail
  the pipeline; don't chase it unless asked.

## Migration context
- Repo is mid **Supabase → Cloudflare D1** migration. A doctrine gate can *mask* a pile
  of typecheck errors when typecheck runs after doctrine and the runner is configured to
  stop early; surfacing the full list may need a temporary `turbo typecheck --continue`
  (revert it once green). D1 query results are on `.results` (not `.data`); replace dead
  Supabase REST helpers with real D1 prepared statements rather than re-typing them.
