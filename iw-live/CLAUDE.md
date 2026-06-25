# IntegrateWise — IW Continuity Bridge Agent Guide

> **Architecture v3.7 (June 2026 state)** — last updated June 11, 2026
> **Founder & CEO:** Nirmal Prince J | IntegrateWise LLP | Bengaluru, India
> **Authority:** This guide must stay consistent with the constitutional doctrine in
> `IntegrateWise - Memory/Intake/AGENTS.md`. If anything here conflicts with a locked
> DECISION there, the constitutional doc wins — fix this file.

## Repository Overview

This is the **IntegrateWise** unified monorepo (`integratewise-live`). The product is the **IW Continuity Bridge** — the shared, normalized, governed memory across every AI, tool, and session, built on the Spine and powered by governed AI.

> **Identity rule (v3.7, 2026-06-12):** The product name is **IW Continuity Bridge**. It is NOT an OS, NOT a platform, NOT a tool — a bridge gives every AI and tool one continuous, governed context. The Spine is the adaptive intelligence layer underneath (synonyms: Adaptive Spine, Unified Intelligence Layer). Never say "IntegrateWise OS", "Cognitive OS", or "we are a platform" in code, comments, or docs. ("Knowledge Workspace" may be used as a plain-language descriptor, but the product name is Continuity Bridge.)

**Infrastructure (LOCKED — v3.7, June 12 2026):** **100% Cloudflare** (Workers + Pages + Queues + D1 + KV + R2 + Vectorize + AI Search + Durable Objects). The product has **no Supabase, no dual-write, no CouchDB, no n8n, no OpenWebUI, no VPS.** Auth is CF Gateway credential auth (RS256 JWT), not Supabase. Twin runs entirely in Cloudflare (`services/iw-agent-runtime`). Deployment is Cloudflare-only — repo connected to GitHub; push to main triggers Pages + Workers; `wrangler deploy --config wrangler.toml` for workers. Secrets in Cloudflare Dashboard. **Ops-plane exception:** IntegrateWise's own operations (Customer Zero) may use Hostinger/VPS — that is internal ops, never the product. ⚠️ **Migration note:** ~71 files still reference Supabase (legacy); it is being removed — do not add new Supabase usage.

### Data Architecture (v3.7 — Cloudflare-only, see AGENTS.md DECISION 22)

- **Cloudflare is the single plane.** D1 + KV + R2 + Vectorize + AI Search + Durable Object SQLite hold all state. The app and Twin read **projections assembled from the Spine (D1)** — never raw tool tables, never an ETL copy.
- **No Supabase, no dual-write.** The "Supabase fortress" and "CF → CF MCP Worker → Supabase" write-path are RETIRED (DECISION 22). Single source of truth lives in Cloudflare. (Legacy Supabase code is being migrated off.)
- **CouchDB: permanently removed (May 2026).** Firestore: v0/GCP monitoring only, never a truth or write target.
- **MCP is the internal protocol** (DECISION 3). The Normalizer emits MCP tool calls, not JSON blobs. The connector layer is temporary scaffolding that shrinks as tools adopt MCP natively.
- **Neon / Supabase** appear in legacy code/env only — do **not** treat them as primary DBs. Single source of truth for infra: **`docs/INFRASTRUCTURE_MAP.md`**.

**The four founding pieces (IMMUTABLE, August 2025):** Loader → Normalizer → Spine → Trait Detection + Resource Type Resolution. 18 core traits, 7 canonical resource types. Connectors are neutralized into IW resource types, never tool-specific objects.

**App domain:** **https://app.integratewise.ai** — Vite + React SPA with signup/auth/login, onboarding, and workspace. API traffic goes through the Gateway; configure `VITE_API_BASE_URL` (e.g. `https://gateway.dev.integratewise.ai`). Marketing lives in the external `integratewise-marketing` repo.

## Codebase Structure

```
integratewise-live/
├── apps/
│   ├── web/                 # Vite + React 18 SPA (THE frontend — onboarding + workspace + app shell)
│   ├── desktop/             # Placeholder
│   └── mobile/              # Placeholder
├── services/                # Cloudflare Workers (gateway + consolidated downstream)
│   ├── gateway/             # API Gateway — routes ALL requests, JWT verify, tenant isolation,
│   │                        #   CORS, rate limit, AND D1-direct workspace/projection reads
│   ├── pipeline/            # Active Spine Writer — Normalizer + spine-v2 + direct-write,
│   │                        #   writes the Cloudflare Spine (legacy Supabase write-path being removed). Owns ${domain}_data tables.
│   ├── connector/ , mcp-connector/ , connector-sync/  # Intake/Loader + MCP connector + sync
│   ├── intelligence/        # The Mind — Think + Act + Govern + agent runtimes
│   ├── knowledge/           # KB ingestion + org-memory dual-write/search
│   ├── bff/ (legacy stream-gateway role) , l2/ , webhook-ingress/ , continuity/
│   ├── govern/ , act/ , think/ , loader/ , normalizer/ , store/   # Pre-consolidation workers (reference)
│   └── iw-agent-runtime/ , twin-orchestrator/ , folder-watcher/ , tenants/ , billing/ , admin/
├── packages/                # Shared packages (types, db, rbac, connectors, …)
├── docs/                    # Code-derived docs (README, API_ROUTES, GETTING_STARTED, ARCHITECTURE)
├── scripts/                 # Deployment & utility scripts
├── public/                  # Static assets + proof recordings (public/proof/)
├── pnpm-workspace.yaml      # Monorepo workspace definition
├── turbo.json               # Turborepo pipeline config
└── package.json             # Root package
```

> **Consolidation note (DECISION 16, June 2026):** the active edge workers consolidate into
> **gateway, pipeline, connector, intelligence, knowledge**. Older single-purpose workers
> (loader, normalizer, spine-v2, think, act, govern, store) remain in-tree for reference but
> their behavior is absorbed into the consolidated services.

## Architecture

**Layer Stack (canonical — `docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md`):**

- **L0 Onboarding** — identity, workspace, sources → Spine hydration (includes the "Building your Spine…" loader sub-step)
- **L0.5 Always-On Operating Layer** — system health, jobs, routing, policies, guardrails, continuity. No UI; outputs surface in L1/L2. (`iw-agent-runtime` crons/DO alarms + `services/workflow`)
- **L1 User Workbench** — Personal + Work role-scoped projections
- **L2 Intelligence Overlay** — ⌘J Awareness Drawer (signals, approvals, context)
- **L3 Twin Workbench** — native chat surface on Cloudflare AI SDK runtime (`twin-workbench.tsx` + `hooks/use-twin-chat.ts`, streaming `POST /api/v1/cognitive/twin/:userId/chat`). NO OpenWebUI, NO Agent Zero. Pending: reroute remaining "Open Twin" entry points (which still open OWUI) to the native surface; add voice + proposals-in-context
- **L4 Knowledge Workbench** — connected knowledge ecosystem (projection only; truth stays in Spine)
- **L5 Operations Workbench** — plan execution sequences, track operational state
- **L6 Execution / Handoff Workbench** — dispatch approved work / hand off playbooks
- **L7 Governance Workbench** — approvals, proposals, promotions, evidence, audit (HARD GATE)

**Engine Loop:** LOAD → NORMALIZE → STORE (Spine) → THINK → REVIEW & APPROVE (GOVERN) → ACT → REPEAT

**Three Data Flows:** Flow A (Structured Tool Data) | Flow B (Unstructured Docs) | Flow C (AI Chat via MCP — always HITL)

**8-Stage Normalizer:** Analyzer → Classifier → Filter → Refiner → Extractor → Validator → Sanity Scan → Sectorizer

**Govern is a HARD GATE:** No approval token = No execution. No exceptions.

### Dashboard data path (D1-direct projections — "first victory")

The workspace never loads a full dataset to render. It reads a **creamy ≤5 slice** so a fresh
dashboard is never empty:

- `useHydrateProjection(dept)` → `GET /api/v1/workspace/projection/:dept` → **gateway D1-direct**
  (`services/gateway/src/workspace-spine.ts`).
- `useWorkspaceEntitiesBatch([...])` → `POST /api/v1/pipeline/entities/batch` and counts →
  **gateway D1-direct**, reading the Spine domain partitions `${domain}_data`
  (`decide_data | build_data | grow_data | run_data | cross_data`).
- The Normalizer (`services/pipeline` → `writeToEntityCache`) writes entities into the SAME
  `${domain}_data` partitions via `getDomainForType()`. The gateway reader mirrors that mapping
  so reads and writes never split-brain. These are **projections from the Spine, not ETL.**

## Key Files for Agents

### Frontend (`apps/web`)

- `src/AppShell.tsx` — App lifecycle (Auth → Onboarding → Loader → Workspace)
- `src/lib/auth-manager.ts` — CF Gateway credential auth (login/signup, JWT in localStorage)
- `src/lib/api-client.ts` — API routes / `apiFetch`
- `src/components/activation/onboarding/OnboardingFlow.tsx` — onboarding state machine
- `src/components/core/hydration/use-hydrate-projection.ts` — projection fetch
- `src/hooks/use-workspace-entities.ts` — entity batch/single reads

### Backend (`services`)

- `services/gateway/src/index.ts` — Gateway router: JWT verify, tenant isolation, CORS, route map, D1-direct intercepts
- `services/gateway/src/workspace-spine.ts` — D1-direct Spine schema hydration + projections + connector catalog
- `services/gateway/src/auth.ts` — credential auth (`/api/v1/auth/login|signup|update`)
- `services/pipeline/src/index.ts` — Normalizer write path, `${domain}_data` reads/writes, `getDomainForType`
- `services/gateway/wrangler.toml` — service bindings to downstream Workers

## API Route Map (gateway `ROUTES` + intercepts)

All routes go through the Gateway. Workspace/projection and dashboard entity reads are served
**D1-direct by the gateway** (bypassing the Supabase-backed BFF); the rest proxy to downstream Workers.

| Route                                                      | Handler / Worker                             |
| ---------------------------------------------------------- | -------------------------------------------- |
| /api/v1/auth/\*                                            | gateway (`auth.ts`) — credential auth        |
| /api/v1/workspace/\*                                       | **gateway D1-direct** (`workspace-spine.ts`) |
| /api/v1/pipeline/entities[/batch\|/counts]                 | **gateway D1-direct** (Spine partitions)     |
| /api/v1/pipeline/\* (other)                                | PIPELINE (`integratewise-pipeline`)          |
| /api/v1/connector/\*, /api/v1/loader/\*                    | CONNECTOR (`integratewise-mcp-connector`)    |
| /api/v1/intelligence/\*, /api/v1/brainstorm                | INTELLIGENCE (`integratewise-intelligence`)  |
| /api/v1/knowledge/\*                                       | KNOWLEDGE (`integratewise-knowledge`)        |
| /api/v1/cognitive/twin\|brain                              | AGENT_RUNTIME (`iw-agent-runtime`)           |
| /api/v1/analytics, /api/v1/cognitive/hitl\|evidence\|audit | BFF (`integratewise-bff`)                    |
| /api/v1/tenants, /api/v1/billing, /api/v1/support          | internal tenants/billing/support             |

## Auth (CF Gateway credential auth — migrated off Supabase OAuth)

Auth is issued and verified by the Cloudflare gateway, not Supabase PKCE. The web app calls
`/api/v1/auth/login` and `/signup` directly, stores the JWT in localStorage, and sends it as a
Bearer token. The gateway verifies the token (issuer `auth.integratewise.ai`, audience
`app.integratewise.ai`), resolves the tenant, and forwards enriched headers downstream. MCP
clients use native OAuth 2.0 on `mcp.integratewise.ai` (DECISION 17).

| Header            | Required | Purpose                             |
| ----------------- | -------- | ----------------------------------- |
| Authorization     | Yes      | Bearer JWT (gateway-issued)         |
| x-tenant-id       | Resolved | Tenant isolation (from JWT/profile) |
| x-view-context    | No       | Domain context (e.g. CTX_CS…)       |
| x-idempotency-key | Writes   | Prevent duplicates                  |
| x-approval-token  | Actions  | Govern gate token                   |

## Quick Start

```bash
# Install dependencies
pnpm install

# Dev (frontend) — runs on localhost:3001
pnpm --filter @integratewise/web dev

# Build
pnpm build

# Deploy frontend — push to main; Cloudflare Pages (connected to GitHub) auto-builds and deploys

# Deploy a Worker (e.g. gateway) — set secrets in Cloudflare, then from the service dir:
npx wrangler deploy --config wrangler.toml
```

> **Scope guard:** Product feature, backend, and web-app work happens in `integratewise-live`.
> `integratewise-ops` is execution/VPS/memory-pipeline tooling only — do not drift there for
> product work. Follow the Agent Continuity Protocol (read lineage + latest handoff, update
> KANBAN, write a handoff, emit triage input) in `IntegrateWise - Memory/Intake/AGENTS.md`.

---

**Last Updated:** June 11, 2026
**Architecture Version:** 3.7 (June 2026 state)
