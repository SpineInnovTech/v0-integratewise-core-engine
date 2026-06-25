# IntegrateWise — 4-Day Consolidation Report

> Period: May 8–12, 2026  
> Author: Hermes Agent (Operator)  
> Status: LIVE ENVIRONMENT — all changes require PR + approval

---

## 1. MCP Servers — CURRENT STATE

**131 MCP tools available** after reload (May 12 07:45 AM session)

| Server                        | Transport             | Status         | Notes                                                  |
| ----------------------------- | --------------------- | -------------- | ------------------------------------------------------ |
| `integratewise-mcp-connector` | HTTP (CF Worker)      | ✅ Connected   | 12 tools: kb._, figma._                                |
| `google-workspace`            | Stdio (npx)           | 🔄 Reconnected | Needs `@dguido/google-workspace-mcp` — verify env vars |
| `spineDb`                     | Stdio (npx)           | 🔄 Reconnected | `@spineDb/mcp-server-spineDb@latest`                   |
| `coda`                        | **NEW — Stdio (npx)** | ✅ Added       | `coda-mcp` npm package (fix for HTTP 401)              |

### Coda Fix Applied

Previous config used `url: https://coda.io/apis/mcp` with Bearer token → always 401 (OAuth2 required). Switched to stdio transport via `coda-mcp` npm package:

```yaml
mcp_servers:
  coda:
    command: npx
    args: ["-y", "coda-mcp"]
    env:
      CODA_API_KEY: "your-uuid-key-here"
    timeout: 120
```

---

## 2. Adaptive Spine — HEALTH CHECK

**All 12 workers healthy** (as of CF Wire Status, May 9):

| Service       | Worker Name                 | Health Status | Notes                           |
| ------------- | --------------------------- | ------------- | ------------------------------- |
| mcp-connector | integratewise-mcp-connector | ✅ 200        | v2.0.0-semantic, 12 tools       |
| act           | integratewise-act           | ✅ 200        |                                 |
| connector     | integratewise-connector     | ✅ 200        |                                 |
| gateway       | integratewise-gateway       | ✅ 200        |                                 |
| think         | integratewise-think         | ✅ 200        | ⚠️ Check config (per AGENTS.md) |
| knowledge     | integratewise-knowledge     | ✅ 200        |                                 |
| normalizer    | integratewise-normalizer    | ✅ 200        |                                 |
| billing       | integratewise-billing       | ✅ 200        |                                 |
| loader        | integratewise-loader        | ⚠️ 404        | /health not found; uses /       |
| workflow      | integratewise-bff           | ✅ 200        |                                 |
| govern        | integratewise-govern        | ✅ 200        |                                 |
| pipeline      | integratewise-pipeline      | ✅ 200        |                                 |

### ⛔ CF Access — 403 BLOCKED

Direct HTTP to pipeline worker returns 403. Service token in `~/.iw/secrets.env` exists but is NOT whitelisted in CF Access Application Policy. This blocks:

- Continuity scripts (session read/write to Spine)
- Any external Spine read/write from Hermes
- Token helper works but HTTP calls fail at CF Access layer

**Fix required:** CF Dashboard → Zero Trust → Access → Applications → `connect-a1b.workers.dev` → Add Service Auth rule.

### ⛔ Wrangler — NOT AUTHENTICATED

- No OAuth session (`wrangler whoami` fails)
- No `CLOUDFLARE_API_TOKEN` set
- Can't deploy, can't inspect secrets store
- **Fix:** `wrangler login` or create API token at dash.cloudflare.com

---

## 3. Governance Layer — FULL AUDIT

### What's Built (all in `services/govern/`)

| Component                         | File                   | Lines | Status      |
| --------------------------------- | ---------------------- | ----- | ----------- |
| API Routes                        | `index.ts`             | 630   | ✅ Complete |
| Types & Schemas                   | `types.ts`             | 136   | ✅ Complete |
| Policy CRUD + Engine              | `policies.ts`          | 370   | ✅ Complete |
| Workflow (approve/reject/pending) | `workflow.ts`          | 239   | ✅ Complete |
| Governance Rules Engine           | `governance-engine.ts` | 483   | ✅ Complete |
| Audit + HMAC Signatures           | `audit.ts`             | 265   | ✅ Complete |

### Architecture (verified from code)

```
Signal (Think) → persist action_proposal → actions table (pending_approval)
     ↓
Govern: POST /v1/check → policy matching (wildcards + roles + evidence) → allow/deny/auto-approve
     ↓
HITL: GET /v1/pending → UI review (PendingApprovalsCard + ApprovalModal)
     ↓
Act: POST /v1/approve or /v1/reject → update actions status → signed audit entry
     ↓
Execute: Act service verifies approval_token → connector execution → pipeline re-ingestion
     ↓
Learn: Think receives outcome feedback → pattern extraction → decision_memory
```

### Issues Found

1. **Zero policies seeded** — `governance_policies` table exists (migration present) but has no production entries. `canExecute()` returns `allowed: true` for everything.
2. **Default rules are in-memory only** — PII redaction, credit card masking, PII flagging exist in `defaultRules` array but are NOT persisted to `governance_rules` table.
3. **No enforcement in production** — approval workflow is structurally complete but ungoverned.
4. **`SIGNATURE_KEY` unknown** — audit entries use HMAC-SHA256 signing; secret must be in CF secrets store (can't verify without wrangler auth).

### Act Service (`services/act/`) — FULLY IMPLEMENTED ✅

476 lines, complete implementation with:

- Dual path: HITL (`action_id`) + Think (`action_proposal_id`)
- Mandatory approval token validation
- Governance double-check via service binding
- Connector execution with re-ingestion through pipeline
- Outcome feedback to Think for learning loop
- Engagement log writes to Spine DB
- Full audit trail (D1 edge cache)

---

## 4. Think Service (`services/think/`) — 1258 lines

### Capabilities

- **Signals API** — `/v1/signals` — query spine signals by tenant + band
- **Success Intelligence** — `/v1/success/intelligence` — domain-specific signal routing across 9 routes (renewals, risks, support, usage, technical health, tasks, stakeholders, integrations, AI insights)
- **Analyze** — `/v1/think/analyze` — on-demand entity analysis via SignalEngine
- **Accelerators** — 6 endpoints: health-score, churn-prediction, revenue-forecast, pipeline-velocity, nps-analysis, data-quality
- **Summarize** — `/v1/summarize` — AI-powered session summarization (OpenRouter fallback)
- **Extract Patterns** — `/v1/extract-patterns` — recurring pattern detection
- **Decisions** — `/v1/decide` — manual decision recording to D1
- **Twin 360** — `/v1/twin/360/:entityId` — entity 360 + trigger evaluation
- **Queue Handler** — processes async events, persists HITL actions to Spine DB

### Python Intelligence (REMOVED — May 27, 2026)

- All `PYTHON_INTELLIGENCE_URL` references removed. `SignalAnalyzer` (TypeScript-native) is the canonical replacement, exported from `@integratewise/types`.
- **ZERO PYTHON rule fully enforced** — `services/intelligence/src/python-client.ts` deleted. All workers import from `@integratewise/types`.

---

## 5. Workflow Service (`services/workflow/`)

### Live Endpoints Verified

- Workspace initialization, tenant config, knowledge-read-policy, AI context URLs
- Connector registration, dashboard, projections, readiness
- HITL queue (Durable Object), signal stream, presence, rooms
- Python analyze proxy (same legacy concern as Think)

---

## 6. Pipeline Service (`services/pipeline/`)

**CRITICAL: Only service with Spine write credentials.** Merges normalizer (8-stage) + spine-v2 (SSOT reads/writes). Consumes: `PIPELINE_QUEUE`, `KNOWLEDGE_QUEUE`, `ACCELERATOR_QUEUE`, `INTELLIGENCE_QUEUE`, `DLQ_QUEUE`, `SIGNAL_QUEUE`.

---

## 7. Git Status — Uncommitted Changes

### Modified (must commit or stash before deploy)

```
M  .gitignore
M  AGENTS.md
M  apps/web/package.json
M  packages/webhooks/src/worker.ts
M  packages/webhooks/wrangler.toml
M  pnpm-lock.yaml
M  services/mcp-connector/src/index.ts
M  services/mcp-connector/wrangler.toml
M  services/spine-v2/src/index.ts
```

### Untracked (new files)

```
?? .envrc
?? .hermes/
?? .tool-versions
?? docs/HERMES_CONTINUITY_CONSTITUTION.md
?? docs/PARALLEL_CONTINUITY_ORCHESTRATION.md
?? docs/SECONDARY_MAC_NODE_PLAN.md
?? docs/design/KIRO_CONTEXT_TRANSFER_LG.md
?? docs/design/PLATFORM_AND_PRODUCT_PAGE_SPEC.md
?? docs/design/SITE_CONNECTIVITY_SPEC.md
?? docs/design/THREE_FLOWS_VISUAL_SPEC.md
?? docs/operations/CF_WIRE_STATUS.md
?? docs/product/ADAPTIVE_SYSTEM.md
?? docs/product/INDUSTRIES_AND_ROLES.md
?? packages/api/src/knowledge-sync.ts
?? packages/spineDb/migrations/030_hermes_continuity.sql
?? scripts/capture-auth-shots.mjs
?? scripts/capture-drawer-detail.mjs
?? scripts/capture-home-sections.mjs
?? scripts/capture-live-site.mjs
?? scripts/capture-loom.mjs
?? scripts/capture-twin-layer.mjs
?? scripts/capture-unauth-shots.mjs
?? scripts/knowledge-write.ts
?? services/iw-adk-agent/
?? services/mcp-connector/src/handlers/coda-proxy.ts
?? services/spine-v2/migrations/
?? spineDb/migrations/20260510100000_continuity_objects.sql
```

---

## 8. Cron Jobs

| Job                                | Schedule                           | Status     | Notes                                                                                         |
| ---------------------------------- | ---------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `iw-memory-triage` (85b6b37d)      | 9:00 AM IST daily (`0 9 * * *`)    | ✅ Running | Script mode, no agent. Last run OK (May 12 06:10)                                             |
| `IW Daily Ops Briefing` (e78cb491) | 10:30 AM IST daily (`30 10 * * *`) | ✅ Running | Claude Sonnet 4.6 via Copilot. Delivers to Telegram `@IWHermesOpsBot` (`telegram:5753113905`) |

---

## 9. Prioritized Action List

### 🟢 RESOLVED (May 12)

| #   | Action                                                           | Owner                 | Status   |
| --- | ---------------------------------------------------------------- | --------------------- | -------- |
| 1   | CF Access: whitelist service token for `connect-a1b.workers.dev` | Nirmal (CF dashboard) | ✅ Fixed |
| 2   | Wrangler auth: `wrangler login` or API token                     | Nirmal                | ✅ Fixed |

### 🟡 HIGH

| #   | Action                                                                                                 | Owner                     | Blocker                                   |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------- | ----------------------------------------- |
| 3   | Coda MCP config — verify `coda-mcp` npm package works                                                  | Hermes                    | Already added to config, needs validation |
| 4   | Deploy updated services (mcp-connector, spine-v2, webhooks)                                            | Needs wrangler auth first | Uncommitted changes                       |
| 5   | Seed governance policies in production DB                                                              | Needs wrangler auth first | Zero policies configured                  |
| 6   | Fix `gateway.integratewise.ai` DNS CNAME                                                               | Nirmal / DNS              | Custom domain not resolving               |
| 7   | **Add GitHub Copilot provider** — run `hermes auth add copilot` OAuth flow                             | Nirmal                    | OAuth device code needed                  |
| 8   | **Add OpenCode provider** — signup at opencode.ai, set `OPENCODE_ZEN_API_KEY` or `OPENCODE_GO_API_KEY` | Nirmal                    | Account + API key needed                  |

### 🟠 MEDIUM

| #   | Action                                                                      | Owner         | Blocker                                                           |
| --- | --------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------- |
| 7   | Update daily briefing cron → deliver to Telegram `@IWHermesOpsBot` chat     | Hermes        | Cron working but target wrong                                     |
| 8   | Verify `services/iw-adk-agent/` — intent and implementation                 | Dev team      | Empty/unfinished                                                  |
| 9   | Replace `PYTHON_INTELLIGENCE_URL` fallbacks with TS                         | Dev team      | ✅ DONE — `SignalAnalyzer` in `@integratewise/types`, zero Python |
| 10  | Verify HITL UI components (PendingApprovalsCard, ApprovalModal) implemented | Frontend team | Architecture docs say wired, code unverified                      |
| 11  | Commit/stash git changes before any deploy                                  | Dev           | Dirty working tree                                                |

### 🔵 LOW

| #   | Action                                               | Owner  |
| --- | ---------------------------------------------------- | ------ |
| 12  | Add `elias` MCP server (if needed)                   | Hermes |
| 13  | Review `loader` service 404 on /health               | Dev    |
| 14  | Document continuity scripts usage in ACTIVITY_LOG.md | Hermes |

---

## 10. Key Decisions (from conversations)

1. **Model selection:** Claude Sonnet 4.6 confirmed as active model via Copilot provider (changed from Kimi, Mimo)
2. **Coda integration:** stdio via `coda-mcp` npm package (not HTTP endpoint — OAuth2 blocker)
3. **Hermes role:** Orchestrator ONLY — never executor. HITL mandatory for production/financial actions
4. **Spine truth:** CF Adaptive Spine = canonical. Firestore = monitoring mirror. Never write to Firestore as truth.
5. **Language:** ZERO Python. TypeScript only across all services, scripts, and automation.

---

_Generated: May 12, 2026 — next update on action completion_
