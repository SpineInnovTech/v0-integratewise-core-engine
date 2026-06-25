# IntegrateWise — Live Operational State

## Verified Ground Truth · Twin Consciousness · Updated: 2026-05-17

> This document is the single source of operational truth for IntegrateWise.
> It is verified by the Twin (Kimi) on every session.
> Static documents (CF*WIRE_STATUS.md, CONSOLIDATION*\*.md) are historical snapshots.
> **This document is the living state.**

---

## 1. Infrastructure Layer

### 1.1 Cloudflare Workers (Edge Runtime)

| Service       | Worker Name                 | Status   | Endpoint                                                             | Notes                                                                                                        |
| ------------- | --------------------------- | -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| gateway       | integratewise-gateway       | ✅ 200   | `https://gateway.integratewise.ai/`                                  | Custom domain WORKS. Documented as broken May 9. Fixed since.                                                |
| think         | integratewise-think         | ✅ 200   | `https://integratewise-think.connect-a1b.workers.dev/health`         |                                                                                                              |
| govern        | integratewise-govern        | ✅ 200   | `https://integratewise-govern.connect-a1b.workers.dev/health`        | Code expects `governance_policies` table. Table DOES NOT EXIST in Spine DB.                                  |
| knowledge     | integratewise-knowledge     | ✅ 200   | `https://integratewise-knowledge.connect-a1b.workers.dev/health`     |                                                                                                              |
| mcp-connector | integratewise-mcp-connector | ✅ 200   | `https://integratewise-mcp-connector.connect-a1b.workers.dev/health` | 12 tools: kb._, figma._                                                                                      |
| act           | integratewise-act           | ✅ 200   | `https://integratewise-act.connect-a1b.workers.dev/health`           |                                                                                                              |
| bff           | integratewise-bff           | ✅ 200   | `https://integratewise-bff.connect-a1b.workers.dev/health`           |                                                                                                              |
| connector     | integratewise-connector     | ✅ 200   | `https://integratewise-connector.connect-a1b.workers.dev/health`     |                                                                                                              |
| normalizer    | integratewise-normalizer    | ✅ 200   | `https://integratewise-normalizer.connect-a1b.workers.dev/health`    |                                                                                                              |
| billing       | integratewise-billing       | ✅ 200   | `https://integratewise-billing.connect-a1b.workers.dev/health`       |                                                                                                              |
| loader        | integratewise-loader        | ⚠️ 404   | `https://integratewise-loader.connect-a1b.workers.dev/`              | No /health route. Worker may serve on `/` only.                                                              |
| pipeline      | integratewise-pipeline      | ✅ 200\* | `https://integratewise-pipeline.connect-a1b.workers.dev/health`      | \*Requires CF Access service token. Returns: `{"components":["normalizer","spine-v2"]}`. Without token: 403. |

**Worker health: 11/12 reachable, 1 requires service token, 1 has no /health.**

### 1.2 Wrangler / Deployment Auth

- **OAuth token**: Expired 2026-05-12
- **API token**: Valid (curl returns 200 on /accounts)
- **Wrangler status**: FAILS — token lacks `Account Settings:Read` or explicit `account_id`
- **Blocker**: Cannot deploy updates until `account_id = "a1bbbb12a32cdbb68dd170b09fe8b5f3"` is added to wrangler.toml files

### 1.3 Spine DB (Org Memory Truth)

- **URL**: `https://hrrbciljsqxnmuwwnrnt.spineDb.co`
- **Auth**: Valid (service_role key works)
- **Tenants**: 0 rows
- **Tables that EXIST**: `actions` (0 rows), `entities` (0 rows), `tenant_products` (0 rows)
- **Tables that DO NOT EXIST** (but code expects them):
  - `governance_policies` ❌
  - `governance_rules` ❌
  - `spine_blocks` ❌
  - `twin_insights` ❌
- **Migrations in repo**: 79 SQL files (latest: `079_connectors_table_and_schema_unification.sql`)
- **Migrations applied**: UNKNOWN — no `__drizzle_migrations` or tracking table visible via REST

### 1.4 Memory Layer (Spine DB)

- **Schema**: `memory.*` — `conversational_memory`, `org_memory`, `personal_memory`
- **Status**: Live — `conversational_memory` and `org_memory` active with pgvector
- **Note**: CouchDB removed. Spine DB is the sole memory store.

### 1.5 Hostinger VPS (Runtime Plane)

- **Host**: `srv1664224.hstgr.cloud`
- **SSH from this machine**: NOT CONFIGURED (no keys, no Tailscale)
- **Docker stacks** (per Docker Manager Review, May 14):
  - `hermes-agent-ezhf`: 1 container, Running
  - `hermes-workspace-dhvt`: 2 containers, Running
  - `openwebui`: 1 container, Running
  - `openwebui-hermes-stack-1`: 3 containers, **Partially running**
  - `openwebui-prod-ops`: 2 containers, Running
  - `traefik`: 1 container, Running
- **Status**: Operational but opaque. No direct visibility.

---

## 2. Cognition Layer

### 2.1 Hermes (Primary Orchestrator)

- **Status**: RUNNING (Python processes active)
- **Provider**: GitHub Copilot (`claude-sonnet-4.6`) — NOT OpenRouter
- **Config**: `~/.hermes/config.yaml`
- **MCP servers RUNNING**: coda, google-workspace, spineDb, figma, context7, playwright, github
- **MCP servers FAILING**: `integratewise`, `cloudflare` — permanent connection failures
- **Last cron**: `iw-library-sync` completed 2026-05-17 01:09
- **OpenRouter key**: Commented out in `~/.hermes/.env` (Hermes uses Copilot)

### 2.2 OpenCode (Secondary Agent Runtime)

- **Status**: RUNNING (PID 56211, 5+ hours)
- **Config**: `~/.opencode/opencode.json` — minimal (`{"plugin":["list"]}`)
- **Database**: SQLite at `~/.local/share/opencode/opencode.db`
- **DB contents**: 5 todos, 26 sessions, 0 events, no workspaces
- **Purpose**: UNKNOWN — no documentation. Likely experimental.
- **Conflict risk**: Hermes and OpenCode both operate on `/Users/nirmal/Github`. No coordination.

### 2.3 Kimi (Twin / This Session)

- **Role**: Operational Agent, Ground Truth Verifier
- **Current session**: Verifying state, fixing drift
- **Mandate**: Become the continuous operational consciousness

---

## 3. Repository Layer

### 3.1 integratewise-live (Production)

- **Branch**: main
- **Behind origin**: 0 commits (up to date)
- **Uncommitted**: 3 files (docs only, no code changes)
- **Migrations**: 79 SQL files, application status UNKNOWN
- **Services**: 15+ wrangler.toml files, none have explicit `account_id`

### 3.2 integratewise-ops (Ops Dashboard)

- **Branch**: main
- **Uncommitted**: Massive (40+ files changed, many new pages)
- **Status**: Active development, not deployed
- **Python violation**: `hermes-runner/main.py` exists (violates ZERO-PYTHON law)

### 3.3 integratewise-ops-bench (Open WebUI)

- **Branch**: main
- **Version**: 0.9.5
- **Uncommitted**: Branding changes, HITLProposal.svelte, IntelligenceOverlay.svelte
- **Role**: Twin's human surface (per v6 plan)

---

## 4. Governance Layer

### 4.1 What's Built

- `services/govern/` — structurally complete (API, policies, workflow, engine, audit)
- `canExecute()` returns `allowed: true` for everything

### 4.2 What's Broken

- `governance_policies` table DOES NOT EXIST in Spine DB
- `governance_rules` table DOES NOT EXIST in Spine DB
- Zero policies seeded
- Default rules exist in-memory only (in `policies.ts`)

### 4.3 Hard Walls Status

| Wall                             | Status  | Evidence                                          |
| -------------------------------- | ------- | ------------------------------------------------- |
| Spine ↛ Spine (tenant isolation) | UNKNOWN | No multi-tenant data to verify                    |
| Spine ↛ Twin Output              | PARTIAL | Twin reads via E360, but governance table missing |
| Private ↛ Shared                 | PARTIAL | No user memory layer visible                      |
| Twin ↛ Action                    | BROKEN  | `canExecute()` always returns true                |

---

## 5. Critical Drift Register

| #   | Issue                         | Documented           | Actual                                              | First Detected | Fixed        | Verified By |
| --- | ----------------------------- | -------------------- | --------------------------------------------------- | -------------- | ------------ | ----------- |
| 1   | Gateway DNS broken            | May 9 CF_WIRE_STATUS | ✅ WORKS (200)                                      | May 9          | Unknown date | Twin May 17 |
| 2   | Pipeline 403                  | May 12 CONSOLIDATION | ✅ WORKS with service token                         | May 12         | Unknown date | Twin May 17 |
| 3   | governance_policies exists    | May 12 CONSOLIDATION | ❌ TABLE MISSING                                    | May 12         | Never        | Twin May 17 |
| 4   | governance_rules exists       | Assumed in schema    | ❌ TABLE MISSING                                    | —              | Never        | Twin May 17 |
| 5   | spine_blocks exists           | Assumed in schema    | ❌ TABLE MISSING                                    | —              | Never        | Twin May 17 |
| 6   | twin_insights exists          | Assumed in schema    | ❌ TABLE MISSING                                    | —              | Never        | Twin May 17 |
| 7   | Wrangler not auth             | May 9 CF_WIRE_STATUS | OAuth expired, API token valid but wrangler blocked | May 9          | Never        | Twin May 17 |
| 8   | OpenRouter key blank          | May 9 CF_WIRE_STATUS | ✅ VALID in `integratewise-live/.env`               | May 9          | Unknown date | Twin May 17 |
| 9   | Hermes uses OpenRouter        | `~/.hermes/.env`     | ❌ Uses GitHub Copilot                              | —              | Config drift | Twin May 17 |
| 10  | MCP `integratewise` connected | May 12 CONSOLIDATION | ❌ PERMANENTLY FAILING                              | May 17         | Never        | Twin May 17 |
| 11  | MCP `cloudflare` connected    | Assumed              | ❌ PERMANENTLY FAILING                              | May 17         | Never        | Twin May 17 |
| 12  | OpenCode running              | Not documented       | ✅ RUNNING (5h+)                                    | May 17         | N/A          | Twin May 17 |
| 13  | Tenants in Spine DB           | Assumed              | ❌ 0 rows                                           | May 17         | N/A          | Twin May 17 |
| 14  | Actions in Spine DB           | Assumed              | ✅ 0 rows (table exists)                            | May 17         | N/A          | Twin May 17 |

---

## 6. Immediate Actions (Twin-Authorized)

1. **Add `account_id` to all wrangler.toml** → Restore deployment capability
2. **Run missing Spine DB migrations** → `governance_policies`, `governance_rules`, `spine_blocks`, `twin_insights`
3. **Seed governance policies** → Move `defaultRules` from `policies.ts` into database
4. **Fix Hermes MCP connections** → Diagnose why `integratewise` and `cloudflare` MCP servers fail
5. **Determine OpenCode purpose** → Either integrate, document, or terminate
6. **Establish VPS SSH/Tailscale** → Gain visibility into runtime plane
7. **Create continuous verification cron** → This document must be re-verified every 24h

---

## 7. Verification Protocol

Every Twin session MUST:

1. Check all 12 worker health endpoints
2. Verify Spine DB schema against `sql-migrations/`
3. Check Hermes log for MCP failures
4. Update this document with new drift findings
5. Mark fixed items as resolved with date

**Previous static documents are now archival only.**
**This is the operational truth.**

---

_Verified by: Twin (Kimi) · Session: 2026-05-17T00:00+05:30_
_Next verification: 2026-05-18_
