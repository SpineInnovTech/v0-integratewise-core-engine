# Platform Verification & Validation — Backend (Spine + Memory + Data Plane)

> Status: B — Derived (per `docs/CANON.md`). Evidence-grounded snapshot.
> Scope: **backend platform only** (no UI). Excavate → Validate → Verify.
> Method: read of real source + `wrangler.toml` + migrations (file:line cited). Not a live runtime test — where runtime proof is still required it is called out explicitly.
> The distinction this report enforces: **"returns 200"** vs **"is actually wired correctly and will work after deployment."**

---

## 0. How to read this

Each subsystem gets one of three verdicts:

- ✅ **WORKS** — code + bindings + schema are consistent and will function after deploy.
- 🟡 **200-ONLY / PARTIAL** — endpoint responds, but a real user flow is incomplete, environment-dependent, or silently no-ops.
- 🔴 **BROKEN / BLOCKER** — will fail or silently drop work after deploy.

---

## 1. Two-View System Map (grounded in code)

### View A — Systems View (what nobody sees)

```
                         ┌─────────────────────────────────────────────┐
  Client (any surface) ─▶│  GATEWAY  (worker: gateway)                  │
                         │  - JWT verify (RS256) OR Cf-Access assertion │
                         │  - tenant_id derived SERVER-SIDE from D1     │
                         │  - x-tenant-id OVERWRITTEN before forward    │
                         │  - IP + tenant + AI-route rate limits (KV)   │
                         └───────────────┬─────────────────────────────┘
                                         │ service bindings (no public bypass)
        ┌────────────────┬───────────────┼───────────────┬───────────────┐
        ▼                ▼               ▼               ▼               ▼
   PIPELINE         INTELLIGENCE      KNOWLEDGE        BFF / L2      AGENT_RUNTIME
 (Spine writer)   (think/act/govern) (memory/RAG)   (workspace)   (Twin / brain)
        │                │               │
        ▼                ▼               ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  DATA PLANE — single canonical D1: integratewise-spine-cache       │
   │  (id ed1f534a-df1e-4783-8a74-8d6d70d067ff)                         │
   │  Spine partitions: decide_data | build_data | grow_data |          │
   │                    run_data | cross_data   (+ spine_vault encrypted)│
   │  KV: RATE_LIMITS, SESSIONS, SIGNAL_CACHE, METRICS, SCHEMA_CACHE …   │
   │  R2: integratewise-files-prod (files/artifacts)                     │
   │  Vectorize: integratewise-knowledge (semantic search)               │
   │  Queues: pipeline-process, memory-promote, accelerator-trigger,     │
   │          memory-consolidation-tasks, signals, ops-dlq …             │
   └──────────────────────────────────────────────────────────────────┘
```

Resolver (deterministic, pure): `getDomainForType()` →
`services/pipeline/src/spine/index.ts:395`. Same function governs read and write
partition selection, so reads and writes cannot split-brain.

### View B — User Surfaces View (projections)

All frontends are **projections** of the same Spine; they never touch raw tool tables.
Surface → gateway contract:

| Surface | Entry (gateway) | Backing service |
|---|---|---|
| Workbench / dashboard "first victory" entities | `GET /api/v1/pipeline/entities` | PIPELINE (D1-direct, `index.ts:1703`) |
| Workspace schema / connector config | `/api/v1/workspace/*` | gateway `workspace-spine.ts` (D1-direct) |
| Memory Hub (search / propose / triage) | `/api/v1/cognitive/memory/*`, `/api/v1/knowledge/*` | KNOWLEDGE |
| Twin (reason + propose) | `/api/v1/cognitive/twin/*` | AGENT_RUNTIME |
| Approval Center (hard gate) | `/api/v1/cognitive/govern/*`, `/v1/twin/handoff` | INTELLIGENCE + gateway `twin-handoff.ts` |
| Signals / Insights | `/api/v1/cognitive/signals`, `/insights` | INTELLIGENCE |

---

## 2. Subsystem Verdicts

### 2.1 Gateway — auth & tenant isolation → ✅ WORKS (isolation), 🟡 PARTIAL (password auth)

**Verified correct (tenant isolation is sound):**
- Every non-public API route requires a verified credential: `Cf-Access-Jwt-Assertion`
  (Zero Trust) **or** RS256 `Authorization: Bearer` JWT — else `401`
  (`services/gateway/src/index.ts:1488-1591`).
- `tenant_id` is derived **server-side** from D1 `tenant_users` (or the signed JWT claim),
  **never** from the client header (`index.ts:1546-1575`).
- Header spoofing is blocked two ways: mismatch → `403 Tenant mismatch`
  (`index.ts:1598-1603`), then `x-tenant-id` is **overwritten** with the server value
  before forwarding (`index.ts:1654`).
- Bindings are complete: `DB`, all 9 service bindings, KV (`RATE_LIMITS`, `SESSIONS`, +4),
  and `OAUTH_PRIVATE_KEY` secret across dev/test/prod (`services/gateway/wrangler.toml`).
- MCP host path independently verifies JWT and injects tenant/user/scope (`index.ts:986-1037`).

**Gaps:**
- 🟡 **Password hashing is not production-grade.** `hashPassword()` =
  `SHA-256(password + "iw-salt-2026")` (`services/gateway/src/auth.ts:408-414`):
  a single static salt, fast unsalted-per-user hash, rainbow-table exposed. The code
  itself flags "upgrade to scrypt/argon2id". **This is the real meaning of "auth is not
  there yet"** — the isolation model is correct, the credential storage is not.
  → **P0 before real users.** Move to PBKDF2 (WebCrypto, edge-native) or Argon2id.
- 🟡 Stale comment in `getTenantsDb()` (`auth.ts:397-402`) says the gateway has no `DB`
  binding "we need to add it." It **does** (`wrangler.toml` `DB = integratewise-spine-cache`).
  Comment is misleading, not a bug.
- 🟡 Login is only IP-throttled (100/min); no per-account lockout / backoff.

### 2.2 Spine — resolver + partitioned writes → ✅ WORKS

- `getDomainForType()` is pure & deterministic; maps entity types to the 5 partitions and
  defaults to `cross` (`spine/index.ts:395-431`).
- `writeToSpine()` resolves type → strict UPSERT into `${domain}_data` with `ON CONFLICT`
  merge (`spine/index.ts:441-560`); **throws** on unmapped types (no silent misfiling).
- Free/personal plans write to encrypted `spine_vault` via `vaultWrite(... SPINE_ENCRYPTION_KEY)`
  — no plaintext entity data in D1 for those tenants (`spine/index.ts:473-503`).
- **Single canonical DB confirmed:** gateway `DB`, pipeline `CACHE_DB`, and knowledge `DB`
  all point to `integratewise-spine-cache` / `ed1f534a-…` — no split-brain across services.
- Schema exists: all 5 partitions created in
  `services/pipeline/migrations/0003_entity_spine.sql:16-222`; `tenant_spine_config` in
  `services/tenants/migrations/0002_tenant_spine_config.sql`.

### 2.3 Memory Lifecycle → 🟡 PARTIAL (prod ok, dev/base broken; no active aging driver)

**Implemented (real, not stubbed):**
- **Intake/Triage:** `triageConversation()` (`knowledge/src/triage-bot.ts:80`), endpoints
  `/v1/triage/run|session|status`, `PATCH /v1/knowledge/triage/:id`
  (`knowledge/src/index.ts`), and `/v1/continuity/sessions/:id/triage` (`continuity/src/index.ts:519`).
- **Promotion:** governed `memory-promote` queue. Producer = INTELLIGENCE
  (`action-loop.ts:305` → `env.MEMORY_PROMOTE.send(...)`, declared in
  `intelligence/wrangler.toml` base/test/prod). Consumer = PIPELINE
  (`pipeline/src/memory-promoter.ts:382`, `index.ts:1992 if (queueName === "memory-promote")`).
  → **This loop is wired correctly and works after deploy.** ✅
- **Org memory:** `org_memory` table (`intelligence/migrations/d1_knowledge.sql:15`),
  `governance_state` defaults `staging`; continuity surfaces **only `approved`** rows
  (test: `continuity-assembler.integration.test.ts:111`). Promotion gate + lineage in
  `knowledge/src/synthesis/promotion-gate.ts`, `lineage-tracker.ts`.
- **Consolidation:** hourly/daily/weekly logic in `knowledge/src/memory-consolidator.ts`
  (`processHourly/Daily/WeeklyConsolidation`, `storeConsolidatedMemory`), backed by a
  `MemoryConsolidator` Durable Object + `STATE` KV for locks/last-run.

**Gaps:**
- 🔴 **Consolidation consumer is disabled in the base/default env** (used by `deploy:dev`).
  `knowledge/wrangler.toml:45-46` comments out the `memory-consolidation-tasks` consumer;
  it is only enabled in `env.test` (`:114`) and `env.prod` (`:180`). Knowledge still
  **produces** to that queue in base (`:50`). Net effect: in dev/base, consolidation tasks
  enqueue (caller gets 200) but **nothing consumes them** — they expire unprocessed.
  Prod is fine. → Re-enable the base-env consumer (or stop producing in base) so dev mirrors prod.
- 🔴 **No active aging/decay driver.** Schema supports it (`ai_memories.expires_at`,
  `confidence`, `governance_state`, `status active|archived` — `knowledge/src/schema/ai-conversations.sql`).
  But **all cron triggers are commented out** (`knowledge/wrangler.toml:93-94`,
  `intelligence:13`, `continuity:43`). So `active → aging → archived` transitions and
  scheduled consolidation never fire on their own; only event/queue-driven consolidation runs,
  and only where the consumer is enabled. Decay is currently **passive** (read-time
  `expires_at` filtering) at best. → Enable a cron (e.g. `"0 * * * *"`) to drive aging + sweeps.

### 2.4 Data Plane bindings (D1 / KV / R2 / Vectorize / Queues / Secrets) → ✅ WORKS, 🟡 two notes

- **D1:** single spine-cache DB across gateway/pipeline/knowledge. ✅
- **KV:** RATE_LIMITS, SESSIONS, SIGNAL_CACHE, METRICS, SCHEMA_CACHE, STATE — all bound. ✅
- **R2:** `integratewise-files-prod` bound in connector, knowledge, intelligence, store
  (staging variant in test). ✅
- **Vectorize:** `integratewise-knowledge` index bound in knowledge (`:88`) + folder-watcher. ✅
- **Queues:** producer/consumer topology consistent for `pipeline-process` and `memory-promote`. ✅
- **Secrets:** all OAuth/webhook secrets + `OAUTH_PRIVATE_KEY` via Cloudflare Secrets Store
  (`store_id 1fd83fc5…`). `readSecret()` correctly handles both Secrets-Store bindings and
  plain strings (`auth.ts:496-507`). ✅
- 🟡 **AI Search / Vectorize in INTELLIGENCE is commented out** (`intelligence/wrangler.toml:76-78`)
  while intelligence **code references** AI Search / autorag (`intelligence/src/lib/ai-router.ts`,
  `memory/evolutionary-memory.ts`, `workflows/triage-workflow.ts`). Any path that calls the
  missing binding will throw at runtime. → Either bind it or guard the call sites.
- 🟡 **`SPINE_ENCRYPTION_KEY` must exist** wherever `writeToSpine` runs for free/personal
  tenants; if absent, vault writes are silently skipped (`spine/index.ts:476`). Confirm it is
  set as a secret on the pipeline worker.

### 2.5 Deploy-readiness → 🟡 PARTIAL (real blockers)

- 🔴 **`deploy:prod` is incomplete vs gateway's service bindings.** It deploys pipeline,
  connector, knowledge, continuity, intelligence, gateway (`package.json:23`) — but **not**
  `integratewise-bff`, `l2`, `iw-agent-runtime`, `connector-sync`,
  `integratewise-webhook-ingress`, or `integratewise-mcp-connector`. The gateway declares
  `[[services]]` bindings to all of those; Wrangler **fails the gateway deploy** if a bound
  service worker does not already exist. They must be deployed by a separate step/script, or
  the gateway deploy breaks. → Make one ordered deploy manifest that covers every bound worker.
- 🔴 **CONNECTOR binding points at the wrong-named worker for this deploy set.** Gateway
  `CONNECTOR → service "integratewise-mcp-connector"` (`wrangler.toml:230-232`), but
  `deploy:*` deploys the worker named `connector` (`services/connector`, name=`connector`),
  not `integratewise-mcp-connector`. Confirm which worker actually serves connector traffic
  and align the binding + deploy set.
- 🟡 **Migration orchestration is decentralized and order-sensitive.** Migrations live under
  `services/*/migrations` with **overlapping numeric prefixes** (both intelligence and pipeline
  have `0001/0002/0003`) but all target the **same** DB. Cross-service ordering matters:
  e.g. `pipeline/migrations/0005_org_memory_continuity_columns.sql` ALTERs `org_memory`, which
  is **created** by `intelligence/migrations/d1_knowledge.sql`. If pipeline migrations apply
  before intelligence's, the ALTER fails. Scripts also mix `d1 migrations apply` (per-dir
  bookkeeping) with raw `d1 execute --file` (`scripts/deploy-rc1.sh`). Most tables use
  `IF NOT EXISTS` so re-runs are safe, but **ordering is not centrally guaranteed.**
  → Author a single ordered migration manifest applied to `integratewise-spine-cache`.
- ✅ Drift gates exist and are meaningful: `check:doctrine`, `verify:continuity`
  (`package.json:14-16`).

---

## 3. Customer Zero (Tenant 0) status

- Resolution exists: `@integratewise.ai` emails → `iw-customer-zero` with all-layer enterprise
  profile (`gateway/src/index.ts:1506-1516`, `customer-zero.ts:resolveCustomerZeroProfile`,
  `ensureCustomerZeroMembership`).
- Bootstrap exists: `scripts/enable-customer-zero.mjs` (runs `d1 migrations apply` +
  verification) and `scripts/initial-memory-load.ts` (seeds memory via `d1 execute`).
- Verdict: 🟡 Tenant 0 is **modeled and bootstrappable**, but a full "real user can do the same
  flow end-to-end" proof depends on resolving the §2.5 deploy blockers and the §2.3 memory
  consumer/cron gaps. Recommend a scripted smoke test (signup → connector → spine write →
  entity360 read → triage → promote → org-memory read) run against a deployed `env.prod`.

---

## 4. Priority Issue Register

| # | Sev | Issue | Evidence | Fix |
|---|-----|-------|----------|-----|
| 1 | P0 | Password hashing SHA-256 + static salt | `auth.ts:408` | PBKDF2/Argon2id, per-user salt |
| 2 | P0 | `deploy:prod` omits bound workers (bff/l2/agent-runtime/webhook-ingress/connector-sync/mcp-connector) | `package.json:23` vs gateway `[[services]]` | Single ordered deploy manifest |
| 3 | P0 | CONNECTOR binding → `integratewise-mcp-connector`, not in deploy set | gateway `wrangler.toml:230` | Align binding + deploy |
| 4 | P1 | Consolidation consumer disabled in base/dev env | `knowledge/wrangler.toml:45` | Re-enable base consumer |
| 5 | P1 | No active aging/decay cron (all crons commented) | `knowledge:93`, `intelligence:13`, `continuity:43` | Enable hourly cron |
| 6 | P1 | Decentralized, order-sensitive migrations on one DB | `services/*/migrations`, `scripts/deploy-rc1.sh` | Ordered migration manifest |
| 7 | P2 | Intelligence AI Search/Vectorize commented but code calls it | `intelligence/wrangler.toml:76` | Bind or guard call sites |
| 8 | P2 | Confirm `SPINE_ENCRYPTION_KEY` secret on pipeline | `spine/index.ts:476` | Set secret; fail-loud if missing |

---

## 5. STAGED PLAN A — Dead-code archive (NOT executed — plan only)

Goal: keep the repo clean/robust without breaking live paths. Move to a safe, non-built
`_archive/` (or `services/_legacy/`) excluded from Turbo/Wrangler, never delete in-place.

Candidate archive set (verify "no inbound imports / no wrangler reference" before moving):
- **Pre-consolidation single-purpose workers** superseded by the 5-worker model (DECISION 16):
  `services/loader`, `services/normalizer`, `services/think`, `services/act`, `services/govern`,
  `services/store` — confirm their logic now lives in pipeline/intelligence/connector first.
- **`mcp-connector` vs `connector` duplication** — resolve which is canonical (see issue #3),
  archive the loser.
- **Supabase-era residue** — ~55 `.ts` files still reference Supabase though doctrine
  (DECISION 22) says removed; reconcile against `docs/migrations/DE_SUPABASE_MIGRATION.md` and
  archive dead Supabase clients/adapters. The `migrations/supabase-export/` folder is historical.
- **Commented-out config blocks** (crons, vectorize, queue consumers) — either activate
  (issues #4/#5/#7) or annotate with a dated TODO so they aren't mistaken for dead config.

Procedure per candidate: (1) `grep` for inbound imports + wrangler/service references →
(2) if zero live refs, `Move` to `_archive/<original-path>` → (3) run `turbo build` +
`check:doctrine` + `verify:continuity` → (4) record the move in `docs/operations/ARCHIVE_LOG.md`.

## 6. STAGED PLAN B — Agent handoff summaries (drafts — to send, not auto-sent)

I cannot reach other agents directly. Below are ready-to-send briefs.

**To Lee / Cloudflare agent (infra):**
> Spine runs on one D1 (`integratewise-spine-cache`, `ed1f534a…`). Please (a) confirm all
> workers bound by the gateway exist in the target account/env before gateway deploy
> (bff, l2, iw-agent-runtime, connector-sync, webhook-ingress, mcp-connector); (b) confirm
> Secrets Store `1fd83fc5…` holds `OAUTH_PRIVATE_KEY` + `SPINE_ENCRYPTION_KEY`; (c) enable
> queue consumers for `memory-promote` (pipeline) and `memory-consolidation-tasks` (knowledge)
> in dev to match prod; (d) advise on a single ordered migration apply against the spine DB.

**To Replit agent (build/scripts):**
> Produce one ordered deploy+migrate script: migrate (intelligence → pipeline → tenants order,
> all `--remote` against spine-cache) then deploy all bound workers, then `verify:continuity`.
> Replace the partial `deploy:prod` chain in `package.json`.

**To Figma agent (later, UI surface):**
> Hold. UI is deferred this round. The first surface to design is the **Tenant-0 Workers /
> infra control panel** (read-only): worker health (`/health/ready`), queue depths, spine
> partition counts, memory pipeline (triage→promote→org→aging) state. Spec to follow once
> §2.5 blockers are closed.

> **Cohorts / comms note:** per request, all cross-agent comms and cohort summaries are to be
> (re)written from this document as the single source. This file is that source — update it,
> then regenerate the briefs above.

---

## 7. Bottom line

- **Tenant isolation, Spine resolver/writes, and the core data-plane bindings are correct and
  deploy-safe.** The Spine moat is real.
- **The promote → org-memory loop works in prod.** ✅
- **Three P0s stand between "200" and "real users work the same way after deploy":** weak
  password hashing, an incomplete prod deploy set vs gateway bindings, and the connector
  worker-name mismatch.
- **Two P1s** (dev-env consolidation consumer, missing aging cron) make the memory lifecycle
  fully autonomous.
- Cleanup and agent handoffs are **staged here, not executed.**

---

## 8. Remediation log (applied this pass)

Auth decision updated per product owner: **real auth = Google + GitHub OAuth + Cloudflare
Zero Trust (CF Access) only.** Email/password is NOT a supported entry point.

| # | Fix | Files |
|---|-----|-------|
| P0-1 | Quarantined email/password auth behind `ALLOW_PASSWORD_AUTH` (default OFF → 501 steering users to OAuth). `/me`+`/update` stay always-on. Corrected stale `getTenantsDb` comment (DB binding exists). | `services/gateway/src/auth.ts` |
| P0-2/3 | Fixed gateway **dev** service bindings to match real worker names (`INTELLIGENCE→intelligence`, `CONNECTOR→connector`, `KNOWLEDGE→knowledge`, `L2→l2`, `BFF→workflow`). Removed dangling prod `FOLDER_WATCHER` binding. Added graceful guard in `fetchService` for absent optional bindings. | `services/gateway/wrangler.toml`, `services/gateway/src/projections.ts` |
| — | Same dev binding-name fix in **knowledge** (`THINK→intelligence`, `IQ_HUB→knowledge`) and **iw-agent-runtime** (`CONNECTOR→connector`, `KNOWLEDGE→knowledge`). | `services/knowledge/wrangler.toml`, `services/iw-agent-runtime/wrangler.toml` |
| P1-4 | Enabled dev `knowledge-ingest` + `memory-consolidation-tasks` queue consumers. | `services/knowledge/wrangler.toml` |
| P1-5 | Enabled hourly consolidation/aging cron (`0 * * * *`) for base + prod (named envs don't inherit base triggers). | `services/knowledge/wrangler.toml` |
| P2-7 | Made `AI_SEARCH` types optional to match runtime guards (already degrades gracefully). | `services/intelligence/src/index.ts`, `.../memory/evolutionary-memory.ts` |
| P2-8 | **Fail-loud** vault write: free/personal tenant entity no longer silently dropped when `SPINE_ENCRYPTION_KEY`/`CACHE_DB` missing — now throws instead of reporting false success. | `services/pipeline/src/spine/index.ts` |
| TWIN | **Added missing `/v1/chat/completions` route** to intelligence. The Twin's `gatewayChat` posted here but no handler existed, so every turn silently fell back to the small Workers AI model instead of `gpt-5-mini`. Now proxies to OpenRouter in native OpenAI shape (normalizes `openrouter/` prefix). | `services/intelligence/src/index.ts` |

### Verified-correct as-is (no change needed)
- DOs `TwinAgent` + `TenantBrainDO` exported and registered via `new_sqlite_classes`. ✅
- Gateway `/api/v1/cognitive/twin` → `AGENT_RUNTIME`, rewritten to `/v1/twin/:userId/*`. ✅
- `ai-router.ts` uses the Cloudflare **AI Gateway** URL directly (independent of the gateway worker) — correct. ✅
- Twin model fallback chain: INTELLIGENCE `/v1/chat/completions` → Workers AI `llama-3.1-8b`. ✅

### Still open (need live Cloudflare inventory or separate pass — NOT fixed here)
- **Prod/test cross-env binding reconciliation** across the full fleet (per-env worker names like `connector-sync-prod`, and workers bound but absent from this repo: `workflow`/BFF, `folder-watcher`). Requires the live CF worker list to do safely.
- **De-Supabase tail**: `intelligence` cognitive-brain still references `SUPABASE_SERVICE_KEY` and `storeSignal`→Supabase. Degrades, doesn't block. Tracked in `docs/migrations/DE_SUPABASE_MIGRATION.md`.
- **Decentralized, order-sensitive migrations** on the single Spine DB.
