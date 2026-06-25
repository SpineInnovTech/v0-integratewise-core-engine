# IntegrateWise

**IntegrateWise is the IW Continuity Bridge — a shared, normalized, governed knowledge workspace over the Spine, empowered by AI — so your tools finally talk to each other, AI has the full picture, and you stop being the integration between your own systems.**

IntegrateWise connects the tools your team already uses — CRM, support, finance, messaging, documents, and AI assistants — into one live, intelligent workspace. The moment you connect your first app, your real data flows in. Your workspace arrives pre-filled, not empty. AI reads across every connected system simultaneously, surfaces what matters — risks, opportunities, patterns — with the evidence behind every insight. And it never acts alone. Every recommendation waits for your approval. You don't replace your tools. You finally make them work together.

_Work is hard. It shouldn't be because your tools don't talk to each other._

---

**Company:** IntegrateWise LLP  
**Founder & CEO:** Nirmal Prince J  
**Location:** Bengaluru, India

## Live Surfaces

| Surface            | URL                                                            | Purpose                                                                        |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| App                | [app.integratewise.ai](https://app.integratewise.ai)           | Authenticated workspace and product experience                                 |
| Platform Landing   | [platform.integrate-voice.ai](https://platform.integrate-voice.ai) | Public platform landing page and founder metrics dashboard                     |
| Marketing (public) | [integratewise.ai](https://integratewise.ai)                   | Public site and signup funnel (external repository: `integratewise-marketing`) |
| Gateway            | [gateway.integratewise.ai](https://gateway.integratewise.ai)   | Single ingress for API traffic                                                 |

## What This Repo Contains

This repository is the active IntegrateWise monorepo.

- **Main product SPA:** `apps/web` contains auth, onboarding, docs entry points, and workspace UI.
- **Gateway-first backend:** `services/gateway` routes requests to the rest of the Cloudflare Worker stack.
- **Spine-centered architecture:** structured tools, unstructured knowledge, and AI interactions all feed the same system of context.
- **Governed AI execution:** the system can think, propose, and prepare actions, but execution stays approval-gated.
- **Customer support intake:** enquiries, newsletter, support, and feedback are handled through the live Gateway + admin-backed support model.

## Memory & Logging Architecture

**Continuity Bridge maintains two classes of memory:**

### Tenant Memory (Cloud-first)
- **User/Tenant data:** All entity data, signals, decisions, and context stored in the Spine (D1 for edge, Fortress for SSOT)
- **Activity logs:** Comprehensive audit trail recorded in Cloud-native tables (`audit_logs`, `governance_audit_log`, `spine_audit_log`)
- **Access:** Read-only for external AIs (ChatGPT, Claude, Perplexity) via MCP; write-gated for internal systems (TriageBot, Consolidation)
- **Governance:** Every action (propose, approve, execute) is logged with actor, timestamp, reasoning, and outcome

### System Memory (Cloud-only, per-tenant isolated)
- **Consolidation lifecycle:** Memory triage (via TriageBot), promotion (staging → active), aging (decay), and archival
- **No local agent state:** v0 internal memories are isolated to development only
- **Encryption:** Free/personal user data encrypted in vault; Fortress SSOT for enterprise
- **Compliance:** Per-tenant isolation ensures GDPR/SOC2 compliance

**All logs flow through Cloudflare:**
- Direct writes: services write to Spine D1 + Fortress Supabase
- Queue-mediated: normalizer, pipeline, and consolidation jobs enqueue → process → commit to Cloud
- No local logging beyond development console; production is 100% Cloud audit trail

For logging details, see [`docs/operations/LOGGING_AND_AUDIT.md`](docs/operations/LOGGING_AND_AUDIT.md).

---

## Canonical Architecture

The authoritative architecture lives in code plus a small set of canon docs (read these first):

- **Product front door:** [`docs/architecture/PRODUCT_ARCHITECTURE.md`](docs/architecture/PRODUCT_ARCHITECTURE.md)
- **Spine data model:** [`docs/architecture/SPINE_MODEL.md`](docs/architecture/SPINE_MODEL.md)
- **Layers & stages:** [`docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md`](docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md)
- **Locked decisions, services, bindings:** [`AGENTS.md`](AGENTS.md)

Product plane is 100% Cloudflare (D1/KV/R2/Vectorize/AI Search/Durable Objects). The Twin is
Cloudflare-native (`services/iw-agent-runtime`).

## The Product in Two Perspectives: User Views vs. Systems Engine

IntegrateWise is documented and understood through two distinct dimensions:

### 👤 1. The User Views (Operating Surface)

This is what the user experiences, designed to eliminate information overload and present a unified workspace:

- **The Onboarding Flow (`OnboardingFlow.tsx`)**: A ~2-minute guided path where users seed workspace goals and authorize tools (creating instant tenant context).
- **The Domain Workbenches (`DepartmentWorkbench.tsx`)**: Dense, configuration-driven surfaces mapped to specific departments (Customer Success, Sales, RevOps, BizOps) displaying role-scoped metrics, entity timelines, and health rings.
- **The Command Palette (`CommandPalette.tsx` / `⌘K`)**: A quick-action bar for live Spine entity search, quick navigation, and action creation.
- **The L2 Cognitive Drawer (`⌘J`)**: A floating panel housing the proactive **Think** reasoning tool, the **Triage Inbox** for Flow C human review, and real-time operational **Signals / Approvals (HITL)**.
- **The Playbook Boundary**: When actions are approved, the user is handed a functional, client-side executable **Playbook (JSON)** to run locally, protecting security credentials.

### ⚙️ 2. The Systems Side (Backend Engine)

This is the serverless Cloudflare Workers infrastructure driving the workspace:

- **Ingestion Ingress (`CONNECTOR` / Loader)**: Secure webhook receivers and scheduled API pullers that enqueue raw events without running data-transformation logic.
- **8-Stage Pipeline (`PIPELINE` / Normalizer)**: A queue consumer that classifies, refining-filters, and neutralizes incoming raw data into standard resource schemas.
- **Edge Memory Plane (D1 & KV)**: Holds indexed SQLite domain tables (`decide_data`, `build_data`, `grow_data`, `run_data`, `cross_data`) and hot entity KV caches, serving the Twin's morning context builder in milliseconds.
- **Fortress DB (Supabase SSOT)**: Authoritative row-level-isolated PostgreSQL backend. Direct writes/queries from downstream workers are prohibited; all updates must proxy through the pipeline's `/api/v1/db-proxy` endpoint.
- **Zero Trust Service Bindings**: Downstream workers are unexposed to the public internet, routing requests internally via Cloudflare edge bindings. Public traffic enters strictly through the **Gateway** (`gateway.integratewise.ai`).

---

## Core Loop

`Connect tools → Data flows in → Engine normalises → Spine stores truth → Intelligence surfaces what matters → User reviews and approves → Action executes → System learns`

Every cycle makes the next one smarter. AI learns from human decisions. The Spine grows with the business.

## Data Flows

- **Flow A** — structured truth: CRM, billing, support, finance, project systems
- **Flow B** — unstructured context: documents, emails, notes, files
- **Flow C** — AI interactions: sessions and agents that read grounded context and write only through governed paths

## Architecture At A Glance

### Three-Layer Architecture (L0 → L1 → L2)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ L0: ONBOARDING                                                              │
│ Tenant creation → Plan selection → Domain Accelerator → Connector OAuth    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ L1: WORKSPACE (Frontend)                                                    │
│ Today View, Accounts, Tasks, Health Cards — Organic views only             │
│ NO entity_type, NO field names, NO schema knowledge                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │ HTTPS/JSON
                                       │ API Contracts
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ L1: WORKFLOW (Backend BFF)                                                  │
│ Schema → Organic transformation (entity_type/health_score → "85% Healthy") │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│ L2: INTELLIGENCE │        │ SYNC & PIPELINE  │        │ SPINE (Supabase) │
│ Twin, Predictions│        │ Paywall-gated    │        │ SSOT — Schema    │
│ ⌘J Overlay       │        │ Domain-scoped    │        │ Backend IP       │
└──────────────────┘        └──────────────────┘        └──────────────────┘
```

### Frontend (L1 Workspace + Public Surfaces)

- **`apps/web`**: Main SPA (Vite 6, React 18, TypeScript)
  - **Authenticated routes:** `/app/*` (workspace, workbenches, approvals)
  - **Public routes:** `/landing` (platform marketing), `/dashboard` (founder metrics + system health)
  - **Schema-free**: Only organic views ("85% Healthy", "$2.4M")
  - **APIs**: Only `/api/v1/workspace/*` and `/api/v1/twin/*`
  - **No sync knowledge**: Sees data freshness, not sync state
- **`apps/desktop`**: placeholder
- **`apps/mobile`**: placeholder

### Core Services

| Service                     | Layer    | Purpose                          | Frontend-Accessible |
| --------------------------- | -------- | -------------------------------- | ------------------- |
| **`services/gateway`**      | Ingress  | JWT, routing, response filtering | ✅ All traffic      |
| **`services/workflow`**     | L1 BFF   | Schema → Organic transformation  | ✅ `/workspace/*`   |
| **`services/intelligence`** | L2       | Twin, predictions, insights      | ✅ `/twin/*`        |
| **`services/connector`**    | Backend  | Paywall-gated sync               | ❌ Internal only    |
| **`services/pipeline`**     | Backend  | 8-stage normalization            | ❌ Internal only    |
| **`services/knowledge`**    | Backend  | Flow B (docs, context)           | ⚠️ Via L1 only      |
| **`services/admin`**        | Internal | Tenant/plan management           | ❌ Internal only    |

### Shared packages

`packages/` contains shared types, connector contracts, database helpers, tenancy utilities, analytics, RBAC, UI packages, and supporting libraries.

**Key packages:**

- `packages/types/src/sync-entitlements.ts` — Plan-based sync limits
- `packages/types/src/api-contracts.ts` — Frontend-safe API types
- `packages/accelerators/src/sync-registry.ts` — Domain Accelerator scoping
- `packages/lib/src/` — Correlation, logging, idempotency

### Infrastructure

- **Frontend:** Cloudflare Pages
- **Edge/Workers:** Cloudflare Workers, Queues, KV, D1, R2
- **System of record:** Supabase Auth + PostgreSQL + pgVector
- **Workspace tooling:** pnpm workspaces + Turborepo

---

## Frontend-Backend Separation

**CRITICAL: Frontend and Backend are DISCONNECTED worlds.**

### Schema is Backend IP

| Backend Knows                       | Frontend Knows                    |
| ----------------------------------- | --------------------------------- |
| `entity_type` (account, risk, task) | Display names ("Account", "Risk") |
| Field names (`health_score`, `arr`) | Formatted values ("85%", "$2.4M") |
| Schema structure                    | Organic views only                |
| Sync configuration                  | Data freshness indicators         |

### Example Transformation

```typescript
// Backend (Spine) — Schema-aware
{
  entity_type: "account",
  data: {
    health_score: 85,
    arr: 2400000,
    renewal_date: "2026-06-15"
  }
}

// BFF Transformer → Frontend receives:
{
  name: "Acme Inc",
  health: {
    score: "85%",
    label: "Healthy",
    trend: "up",
    change: "+5% from last week"
  },
  revenue: {
    amount: "$2.4M",
    trend: "stable"
  }
}
```

**Read:** `docs/FRONTEND_BACKEND_SEPARATION.md`

---

## Paywall-Gated Sync & Domain Accelerators

All data synchronization is gated by subscription plan and scoped by Domain Accelerators.

### Plan Tiers

| Plan           | Sync Frequency     | Historical | Connectors | Records/Mo | Accelerators |
| -------------- | ------------------ | ---------- | ---------- | ---------- | ------------ |
| **Free**       | Daily (24h)        | 30 days    | 1          | 10,000     | Foundation   |
| **Starter**    | 4-hour             | 90 days    | 3          | 50,000     | +CS Growth   |
| **Pro**        | 1-hour + webhooks  | 1 year     | 10         | 500,000    | All standard |
| **Enterprise** | 15-min + real-time | Unlimited  | Unlimited  | Unlimited  | All + Custom |

### Domain Accelerators

| Accelerator       | Min Plan | Primary Entities         | Key Signals                      |
| ----------------- | -------- | ------------------------ | -------------------------------- |
| **Foundation**    | Free     | account, contact         | —                                |
| **CS Growth**     | Starter  | +risk, task, engagement  | health_drop, renewal_risk, churn |
| **SaaS Vertical** | Starter  | +subscription, usage     | trial_conversion, expansion      |
| **Revenue Intel** | Pro      | +opportunities, forecast | deal_at_risk, forecast_change    |

**Read:** `docs/PAYWALL_SYNC_DOMAIN_ACCELERATORS.md`

## Monorepo Layout

```text
apps/
  web/                Main SPA: workspace, onboarding, support, and authentication entry points
  desktop/            Placeholder
  mobile/             Placeholder
services/             Cloudflare Workers and service modules
packages/             Shared TypeScript packages
docs/                 Current architecture, product docs, runbooks, playbooks
sql-migrations/       Supabase PostgreSQL and D1 migrations
scripts/              Deployment and utility scripts
public/               Static assets and grounding/reference material
```

For placement rules and ownership boundaries, start with [docs/REPO_STRUCTURE.md](docs/REPO_STRUCTURE.md).

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9.x

### Install

```bash
pnpm install
```

### Run the main web app

```bash
pnpm --filter @integratewise/web dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run with live backend services

Set the frontend environment values first:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for the full local setup flow, Cloudflare deployment notes, and environment wiring.

## Code Hygiene

**Attribution and Borrowed Code**

If code is adapted from external sources (open-source libraries, examples, or reference implementations), always:

1. **Document the origin** — add a comment at the top of the file or function:
   ```typescript
   // Based on: https://github.com/example/library (MIT License)
   // Adapted for tenant isolation and Cloud-first architecture
   ```

2. **Link to the source** — include the repository URL and license

3. **Note modifications** — explain what was changed for our use case

All code should be original, well-documented, and free of licensing conflicts. If in doubt, open an issue or reach out to the team.

**Development Best Practices**

- **Cloud-first:** All logs and state go to Cloudflare (D1/KV/Supabase) — no local file storage
- **Per-tenant isolation:** Never store shared state; all queries filter by `tenant_id`
- **Zero console.error in production:** Use the audit trail and governance logs instead
- **Type-safe:** Keep `pnpm typecheck` at 0 errors
- **No secrets in code:** Use environment variables + Cloudflare secure storage

---

## Common Commands

| Task                     | Command                                |
| ------------------------ | -------------------------------------- |
| Install dependencies     | `pnpm install`                         |
| Run everything via Turbo | `pnpm dev`                             |
| Run the web app only     | `pnpm --filter @integratewise/web dev` |
| Build the repo           | `pnpm build`                           |
| Lint                     | `pnpm lint`                            |
| Type check               | `pnpm typecheck`                       |
| Run tests                | `pnpm test`                            |
| Run formatting           | `pnpm format`                          |
| Run preflight checks     | `pnpm preflight`                       |

## Current Product Surfaces

The main activation and product journeys live in `apps/web`:

- signup and onboarding
- demo and product-tour flows
- docs entry points
- in-app help, support, enquiries, and feedback intake

## User Journey And Stages

IntegrateWise has one continuous journey from first visit to governed operation inside the workspace.
At the app-shell level, the authenticated stage flow is `login -> signup -> onboarding -> loading -> workspace`.

| Stage                              | User goal                                               | Primary surfaces                                     | What the system does                                                                         |
| ---------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Discover (Marketing)               | Understand the product and decide if it fits            | External `integratewise-marketing` site              | explains Spine, role-shaped workspaces, governed AI, and implementation model                |
| Convert (Marketing)                | Start a workspace or reach the team                     | External `integratewise-marketing` signup funnel     | captures signup intent, enquiries, and demo interest                                         |
| Authenticate                       | Create or restore an account                            | Supabase auth through the app shell                  | establishes session, tenant context, and route into onboarding or the workspace              |
| Onboard (L0)                       | Define the workspace foundation                         | onboarding flow in `apps/web`                        | collects workspace identity, domain context, tool choices, and initial setup inputs          |
| Hydrate                            | Prepare the first usable system state                   | loading and initialization flow                      | initializes the Spine, triggers sync/setup, and prepares readiness for first use             |
| Operate (L1)                       | Use the workspace on top of shared truth                | workspace shell and domain views                     | shows tenant data, entities, views, timelines, and operational surfaces                      |
| Think And Review (L2)              | Turn context into signals and recommendations           | cognitive surfaces, signals, briefs, recommendations | generates grounded suggestions from the Spine and surrounding knowledge                      |
| Govern And Act (L3 execution path) | Approve and execute safely                              | approval flows, actions, downstream integrations     | applies policy and approval gates before any write or execution happens                      |
| Support And Improve                | Ask questions, report issues, and feed the product loop | help widget, support intake, docs, feedback flows    | records support, enquiries, bug reports, feature requests, CSAT, and NPS with tenant context |

### Stage Summary

1. **Marketing and education**
   A prospect lands on the external `integratewise-marketing` site, understands the Spine narrative, and signs up.
2. **Signup and authentication**
   The user creates or restores an authenticated session and is routed into the right app state.
3. **Onboarding and foundation**
   The workspace is configured at L0 so the tenant has a defined context, schema direction, and initial connector scope.
4. **Hydration and readiness**
   The system initializes the Spine-backed workspace and prepares the first usable experience rather than dropping the user into an empty shell.
5. **Operational workspace**
   The user works from a shared truth layer instead of jumping across disconnected systems.
6. **Cognitive assistance**
   IntegrateWise surfaces evidence, signals, and AI-backed recommendations grounded in the Spine.
7. **Governed action**
   Actions remain approval-gated, auditable, and policy-aware before execution.
8. **Support and feedback loop**
   The same product supports enquiries, support tickets, and feedback so the customer journey continues after activation.

## Full Path: From Discovery To Daily Sync

This is the complete working path through the product and runtime:

`discover -> convert -> authenticate -> onboard -> initialize Spine -> connect tools -> sync -> normalize -> store in Spine -> read through workspace and Entity 360 -> think -> approve -> act -> support and learn`

### End-to-end system path

| Step | User or system event                               | Main components                                                                       | Result                                                                              |
| ---- | -------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1    | Visitor discovers IntegrateWise                    | External `integratewise-marketing` site                                               | user understands the Spine narrative and enters the signup funnel                   |
| 2    | User signs up or logs in                           | Supabase auth + app shell                                                             | session and tenant context are established                                          |
| 3    | Onboarding defines the foundation                  | onboarding flow + `POST /api/v1/workspace/initialize`                                 | `tenant_spine_config` is created or updated with tenant context and workspace setup |
| 4    | Spine initialization seeds the adaptive model      | `POST /api/v1/workspace/initialize-spine`                                             | initial schema observations are written to `spine_schema_registry`                  |
| 5    | Schema Router resolves the allowed operating model | workflow service + baseline config + `spine_schema_registry`                          | tenant-specific allowed entity types and fields are resolved                        |
| 6    | Connector authentication and setup begins          | connector catalog + OAuth + sync triggers                                             | the tenant connects real systems without replacing them                             |
| 7    | Initial sync starts with phased ingestion          | connector -> loader -> queue                                                          | sync begins with creamy data, then needed history, then delta freshness             |
| 8    | Data moves through the 8-stage pipeline            | analyze -> classify -> filter -> refine -> extract -> validate -> sanity -> sectorize | raw source data becomes scoped, canonical, and tenant-safe                          |
| 9    | Normalizer writes the canonical result             | normalizer + Spine write path                                                         | data is pruned to the resolved schema and written into the Spine                    |
| 10   | Schema grows through observations                  | Spine write path + observation recording                                              | new tenant-specific fields and entity observations extend the adaptive model        |
| 11   | Workspace reads from shared truth                  | workflow/BFF + workspace shell + Entity 360                                           | users see timelines, entities, dashboards, signals, and grounded context            |
| 12   | AI thinks on top of context                        | intelligence + cognitive surfaces                                                     | the system produces suggestions, briefs, and recommendations                        |
| 13   | Governance controls execution                      | govern + approval flows + action handlers                                             | no downstream action executes without approval and policy checks                    |
| 14   | Support and feedback close the loop                | help widget + support intake + feedback architecture                                  | the product captures support, bugs, requests, CSAT, and NPS with tenant context     |

### Adaptive Schema And Sync Flow

#### Core workflow

1. **Connector added**
   A new tool connection starts schema discovery and sync preparation.
2. **Schema seed and growth**
   Onboarding seeds baseline schema expectations, and later writes grow the tenant model through schema observations.
3. **Phase 1 sync: creamy**
   The first high-value records are fetched to make the workspace useful quickly.
4. **Phase 2 sync: needed/backfill**
   Historical records are pulled in a controlled follow-up pass.
5. **Phase 3 sync: delta**
   Ongoing changes keep the workspace fresh through incremental updates.

#### Component roles

| Component                | Role in the path                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Schema Router            | Resolves baseline industry/department schema plus tenant-grown schema from `spine_schema_registry`        |
| Loader                   | Starts phased ingestion and hands work into the 8-stage pipeline                                          |
| Pipeline                 | Processes source data through analyze, classify, filter, refine, extract, validate, sanity, and sectorize |
| Normalizer               | Restricts writes to allowed entity types and canonical fields for the resolved tenant schema              |
| Spine                    | Stores canonical context, relationships, evidence, and schema observations                                |
| Workspace and Entity 360 | Read the unified context back out for users and intelligence                                              |
| Intelligence and Govern  | Produce recommendations and keep all execution approval-controlled                                        |

## Source-Of-Truth Docs

### Start here (New Architecture)

- **[docs/FRONTEND_BACKEND_SEPARATION.md](docs/FRONTEND_BACKEND_SEPARATION.md)**: ⭐ CRITICAL — Frontend/Backend separation architecture
- **[docs/PAYWALL_SYNC_DOMAIN_ACCELERATORS.md](docs/PAYWALL_SYNC_DOMAIN_ACCELERATORS.md)**: ⭐ CRITICAL — Paywall-gated sync, Domain Accelerators
- **[docs/THREE_LAYER_ARCHITECTURE.md](docs/THREE_LAYER_ARCHITECTURE.md)**: ⭐ CRITICAL — L0 (Onboard) → L1 (Workspace) → L2 (Intelligence)
- [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md): Install, run, build, and deploy basics
- [docs/API_ROUTES.md](docs/API_ROUTES.md): Current Gateway route map
- [AGENTS.md](AGENTS.md): Agent behavior, coding constraints, and workflow rules

### Reference

- [docs/README.md](docs/README.md): Documentation index and precedence order
- [docs/TECHNICAL_DOCUMENT.md](docs/TECHNICAL_DOCUMENT.md): Architecture summary, terminology, and key code paths
- [docs/INFRASTRUCTURE_MAP.md](docs/INFRASTRUCTURE_MAP.md): Current production infrastructure
- [docs/REPO_STRUCTURE.md](docs/REPO_STRUCTURE.md): Where code belongs in the monorepo

### Architecture

- [docs/architecture/SYSTEM_ARCHITECTURE_INDEX.md](docs/architecture/SYSTEM_ARCHITECTURE_INDEX.md): architecture entry point
- [docs/architecture/INITIAL_HYDRATION_AND_ENTITY360_BOUNDARY.md](docs/architecture/INITIAL_HYDRATION_AND_ENTITY360_BOUNDARY.md): hydration and Entity 360 boundary
- [docs/architecture/SPINE_AS_FOUNDATION_ARCHITECTURE.md](docs/architecture/SPINE_AS_FOUNDATION_ARCHITECTURE.md): Spine as the system foundation
- [docs/architecture/CUSTOMER_SUPPORT_AND_FEEDBACK_ARCHITECTURE.md](docs/architecture/CUSTOMER_SUPPORT_AND_FEEDBACK_ARCHITECTURE.md): live support, enquiries, feedback, and Zendesk-backed intake model

### Operations

- [docs/runbooks/README.md](docs/runbooks/README.md): incident, rollback, OAuth, sync/DLQ, and recovery runbooks
- [docs/playbooks/README.md](docs/playbooks/README.md): release, connector rollout, and tenant onboarding playbooks
- [docs/SECRETS_CHECKLIST.md](docs/SECRETS_CHECKLIST.md): Cloudflare and service secret setup

### Repo guidance

- [CLAUDE.md](CLAUDE.md): engineering navigation and repo reference
- [AGENTS.md](AGENTS.md): agent behavior, coding constraints, and workflow rules

## Deployment Notes

- Cloudflare is the deployment surface for frontend and Workers.
- Supabase is the system of record for auth, Spine data, audit, and core product state.
- Production secrets belong in the Cloudflare Dashboard and related managed environments, not in Git.
- This repo should remain the active source of truth; archive and legacy material in `docs/` is background only.

## License And Company

IntegrateWise LLP, Bengaluru, India.

For the company and product narrative, see [docs/INTEGRATEWISE_PORTFOLIO.md](docs/INTEGRATEWISE_PORTFOLIO.md).
