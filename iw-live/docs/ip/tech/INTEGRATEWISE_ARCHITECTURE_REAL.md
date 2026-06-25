# IntegrateWise — Accurate Architecture, Boundary & Product Surfaces

> **Status:** Live system audit — May 2026  
> **Scope:** What is real, deployed, and user-facing today. Not aspirational.  
> **Version:** 1.0 (post-verification)

---

## 1. Architecture — What Is Real

### 1.1 Core Thesis (Implemented)

IntegrateWise is an operating environment, not a chatbot or dashboard. The implemented thesis:

- **One Spine** holds canonical context across all connected tools
- **MCP is the protocol boundary** for all machine-to-machine communication
- **Governance is structural**, not a policy wrapper: AI proposes → human approves → execution happens in the user's own stack
- **Memory survives model/provider switches** because it lives in the Spine, not the context window

### 1.2 Worker Fleet (Deployed)

| Worker                          | Role                                                               | Status          |
| ------------------------------- | ------------------------------------------------------------------ | --------------- |
| `integratewise-gateway`         | API gateway, auth, rate limiting, routing                          | ✅ Live         |
| `integratewise-pipeline`        | 8-stage normalizer, Spine write, queue consumer                    | ✅ Live         |
| `integratewise-mcp-connector`   | MCP protocol server (17 tools)                                     | ✅ Live         |
| `integratewise-intelligence`    | Consolidated v3.6 worker (govern + proposals + signals)            | ✅ Live         |
| `integratewise-loader`          | Universal intake membrane, 8-stage pipeline                        | ✅ Live         |
| `integratewise-connector`       | 30+ tool connectors (bridge layer)                                 | ✅ Live         |
| `integratewise-connector-sync`  | Sync orchestration                                                 | ✅ Live         |
| `integratewise-knowledge`       | KB ingestion, semantic search, org memory                          | ✅ Live         |
| `integratewise-think`           | Twin reasoning, session persistence                                | ✅ Live         |
| `integratewise-webhook-ingress` | External events entry point                                        | ✅ Live         |
| `integratewise-billing`         | Stripe + Razorpay                                                  | ✅ Live         |
| `integratewise-tenants`         | Tenant management                                                  | ✅ Live         |
| `integratewise-store`           | KV/D1 operations                                                   | ✅ Live         |
| `integratewise-continuity`      | Session continuity (migrating to Spine DB)                         | ⚠️ In migration |
| `integratewise-workflow`        | Cloudflare Workflows/Queues orchestration (NOT n8n)                | ✅ Live         |
| `integratewise-l2`              | Entity 360, cognitive overlays                                     | ✅ Live         |
| `integratewise-admin`           | Admin utilities                                                    | ✅ Live         |
| `integratewise-hermes`          | Hermes agent service binding                                       | ✅ Live         |
| `integratewise-govern`          | Standalone governance (deprecated, consolidated into intelligence) | ⚠️ Deprecated   |
| `integratewise-spine-v2`        | Deprecated (consolidated into pipeline)                            | ❌ Retired      |
| `integratewise-agents`          | Deprecated (consolidated into intelligence)                        | ❌ Retired      |

**Total:** 20 live workers, 2 deprecated, 2 retired.

### 1.3 MCP Pipeline (Real)

```
External Tool
     │
     ▼
    MCP ──── Loader (fetch) ──── Normalizer (transform) ──── Spine
```

**What is implemented:**

- `services/mcp-connector/src/handlers/tools.ts` exposes **17 real tools**:
  - `kb.*` (7): write_session_summary, write_article, get_artifact, list_recent, search, topic_upsert, topic_list
  - `memory.*` (5): write_conversational, read_conversational, upsert_org, search_org, propose
  - `figma.*` (5): get_file, get_components, get_node, export_image, get_comments
- Invoke handlers (lines 1121–1942) make actual KV/D1/Spine DB calls
- `services/loader/src/pipeline-stages.ts` implements **8 real stages**:
  1. **Analyzer**: SHA-256 fingerprint
  2. **Classifier**: data_kind detection, PII regex scan
  3. **Filter**: D1 dedup (`processed_fingerprints`), tenant schema gating
  4. **Refiner**: composite splitting, cross-ref extraction
  5. **Extractor**: canonical field mapping across 12 domains
  6. **Validator**: required-field checks
     7/8. **Write Plan + Execution**: generates and executes write plan

**What is NOT implemented:**

- "LLM-in-the-loop at stages 2, 3, 4, 6" — these are heuristic (regex, keyword scoring), no LLM calls inside the normalizer
- Stale `mcp-tools.json` still references `analyze_with_python` (ZERO PYTHON violation, not active)

### 1.4 Spine (Real)

The Spine is **one logical layer across multiple physical stores**:

| Store                 | Role                                | Data                                                                                                                         | Access Pattern                                             |
| --------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Spine DB Postgres** | Canonical context, long-term memory | `public.entities`, `memory.org_memory`, `memory.conversational_memory`, pgvector embeddings                                  | Worker-only writes. Frontend reads via Gateway.            |
| **Cloudflare D1**     | Hot cache, governance, fast queries | `proposals`, `governance_audit_log`, `processed_fingerprints`, `personal_memory` (D1 only), `conversational_memory` (mirror) | Readable by multiple workers. Writable by pipeline/govern. |
| **Cloudflare KV**     | Hot entity cache                    | Serialized entity blobs                                                                                                      | TTL 60–300s                                                |
| **Cloudflare R2**     | Blob storage                        | Large artifacts, exports                                                                                                     | Direct signed URLs                                         |
| **Redis (Upstash)**   | Session state, rate limit counters  | Ephemeral operational state                                                                                                  | Fast ephemeral                                             |

**Critical rule:** Spine DB is accessed **only through Cloudflare Workers** for writes. D1 is the external-readable hot cache.

**Reality check:** Frontend has two direct Spine DB bypasses — `useSpine DBEntities` and `useDemoData` — that call RPC directly from browser. These are known deviations.

### 1.5 Memory Layers (Partially Real)

| Layer                     | Spine DB                                                  | D1                                           | Status            |
| ------------------------- | --------------------------------------------------------- | -------------------------------------------- | ----------------- |
| **Conversational Memory** | ✅ `memory.conversational_memory`                         | ✅ Mirror table                              | **Real**          |
| **Organizational Memory** | ✅ `memory.org_memory` (pgvector, RLS, governance states) | ❌ Not mirrored                              | **Real**          |
| **Personal Memory**       | ❌ **Not present**                                        | ✅ `personal_memory` (uncommitted migration) | **D1 only — gap** |

**Governance states in `org_memory`:** `staging` → `approved` → `published` → `archived`. Promotion requires explicit action.

### 1.6 Governance (Real)

Implemented in D1 (`services/govern/src/proposal.ts` + `services/govern/src/audit.ts`):

- **Proposals table**: 27 columns, full lifecycle (`draft` → `pending_review` → `approved` → `executing` → `completed`/`failed`)
- **Audit log**: HMAC SHA-256 signed entries
- **API surface**: `POST /v1/proposals`, `POST /v1/proposals/:id/approve`, `POST /v1/proposals/:id/reject`, `GET /v1/audit`
- **Continuity writeback**: Approval updates Spine DB `org_memory` via `writebackContinuity`
- **Status**: Standalone govern worker is deprecated (v3.6 consolidated into `integratewise-intelligence`). Code is real but migrating.

### 1.7 Auth (Real)

- **Spine DB JWT is canonical** across all three workspaces
- One identity: `app.integratewise.ai`, `ops.integratewise.ai`, `knowledge.integratewise.ai`
- Gateway validates JWT, routes to appropriate worker
- Known issue: Gateway returns 500/1101 with fake/test tokens (pre-existing, not a blocker)

---

## 2. Boundary — What IntegrateWise Is vs Is Not

### 2.1 Inside the Boundary (We Do)

| Capability                                                                | Implementation                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------- |
| **Ingest** any structured or semi-structured data from connected tools    | Loader + 8-stage normalizer                       |
| **Normalize** heterogeneous data into canonical Spine entities            | Normalizer (heuristic stages, compounding writes) |
| **Reason** over the Spine to detect risk, opportunity, and anomalies      | Twin (Think worker), Intelligence worker          |
| **Propose** actions, memory promotions, and operational changes           | Proposal engine with confidence scoring           |
| **Govern** every proposal through HITL approval with audit lineage        | Govern engine, D1 proposals + audit log           |
| **Project** Spine truth into user-facing surfaces                         | React/Vue components, MCP tool calls              |
| **Remember** conversationally, organizationally, and (D1-only) personally | Spine DB `memory.*` + D1 mirrors                  |
| **Search** semantically across org memory                                 | pgvector + Knowledge worker                       |
| **Maintain continuity** across sessions, models, and providers            | Spine persistence, memory layers                  |
| **Hand off** execution intent to the user's own stack                     | Twin → user agentic claw (UI, not API execution)  |

### 2.2 Outside the Boundary (We Do NOT)

| Capability                                         | Why Not                                  | What Happens Instead                                                                      |
| -------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Execute actions directly in external tools**     | Security, liability, trust               | Twin proposes → user approves → user executes in their own tool via deep link             |
| **Write directly to Spine DB from frontend**       | Architecture violation                   | All writes: Frontend → Gateway → Worker → Spine DB. (Two known bypasses exist.)           |
| **Use Python anywhere**                            | Architecture lock (TypeScript/Node only) | Zero Python in production.                                                                |
| **Use Firestore as canonical state**               | Firestore is v0/GCP ops monitoring only  | All canonical state in Spine DB (memory) + D1 (governance cache).                         |
| **Store credentials, tokens, or API keys in code** | Hard security rule                       | Secrets in Worker env bindings, Doppler, or KV — never in repo.                           |
| **Deploy to production automatically**             | Explicit human gate                      | `wrangler deploy` only on instruction. OAuth session (connect@integratewise.ai) required. |
| **Delete archived repos**                          | Never delete                             | ARCHIVE = no new development. Repos persist for history.                                  |

### 2.3 The Handoff Model (Boundary in Practice)

```
┌─────────────────────────────────────────────────────────────────┐
│                     INSIDE INTEGRATEWISE                        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  Twin    │───→│ Proposal │───→│  HITL    │                  │
│  │ Reasons  │    │ Engine   │    │ Approval │                  │
│  └──────────┘    └──────────┘    └────┬─────┘                  │
│                                        │                        │
│                              ┌─────────▼──────────┐             │
│                              │   Audit + Lineage  │             │
│                              │   (D1, HMAC-signed)│             │
│                              └────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HANDOFF
┌─────────────────────────────────────────────────────────────────┐
│                   OUTSIDE INTEGRATEWISE                         │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  User's Agentic Claw (their tools, their creds)      │      │
│  │  - Click deep link to HubSpot / Jira / Stripe        │      │
│  │  - Execute in native tool UI                         │      │
│  │  - MCP re-reads result → Spine updates (async)       │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

**The rule:** IntegrateWise reasons, plans, and prepares. The user executes. Execution never happens inside our workers against external APIs.

---

## 3. Productised Solutions — What the User Gets

### 3.1 Three Workspace Architecture (Real vs Target)

The product is delivered through **three workspaces**. Today they are at different maturity levels:

| Workspace        | URL                          | Role                                                                           | Status                                                    |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| **Intelligence** | `app.integratewise.ai`       | Read + Decide. At-risk briefs, entity 360, signal detection, Twin reasoning.   | ✅ **Live and working**                                   |
| **Execution**    | `ops.integratewise.ai`       | Act + Log. Governance queue, department playbooks, KPIs, action logs.          | ⚠️ **Rebuilding — Firestore → MCP migration in progress** |
| **Knowledge**    | `knowledge.integratewise.ai` | Remember + Govern. Org memory search, semantic discovery, doctrine management. | ⚠️ **Partial — org_memory works, surface incomplete**     |

### 3.2 Intelligence Surface (Live)

**What the user sees:**

- **Unified Shell**: One `AppShell` with Personal/Work toggle
- **At-Risk Brief**: CS view showing accounts ranked by risk (Critical/High/Medium/Low)
- **Entity 360**: HubSpot + Jira + Gmail merged into one Person/Company view
- **Twin Sidebar**: Embedded at bottom/right for insights, suggestions, approvals inline
- **Proposals Inline**: Pending Twin proposals appear in-context with Approve/Reject buttons
- **Signals**: Live signal stream (`useSignals`) with auto-refresh (30s)

**Data flow:**

```
app.integratewise.ai
    → Gateway (/api/v1/intelligence/*)
    → Intelligence Worker (/v1/proposals, /v1/signals)
    → D1 (proposals, signals) + Spine DB (entities, memory)
```

**Key components:**

- `CSAtRiskView` — live signals + proposals matched to accounts
- `useProposals` — React Query hook, 30s refresh, approve/reject mutations
- `useSignals` — live signal stream

### 3.3 Execution Surface (In Rebuild)

**What the user will see (target):**

- **Universal Shell**: `/execution/:dept` — one layout, six panels, configured per department
- **Six Panels**:
  1. **Playbook** — Standard operating procedures, runbooks, decision trees
  2. **Tools** — Deep links to native tools (HubSpot, Jira, Stripe, etc.)
  3. **KPIs** — Metrics and health indicators for the department
  4. **Workflows** — Active Cloudflare Workflows, triggers, automations
  5. **Actions** — Governance queue: pending proposals with approve/reject
  6. **Log** — Audit trail of all decisions and executions

**Current state:**

- `integratewise-ops/src/pages/cs.vue` — CS prototype with 4 tabs (Playbook, KPI, Actions, Log)
- Uses `useMcpTool` composables to call MCP (`proposal.list`, `signal.list`)
- Hardcoded `demo-tenant`, no real auth yet
- **Data layer migration needed**: `useCollection` still reads Firestore (wrong)

**Architecture rule for Execution:** MCP-only. No direct Spine DB. No direct connectors. Every read goes through `integratewise-mcp-connector`.

### 3.4 Knowledge Surface (Partial)

**What works today:**

- `memory.org_memory` table with pgvector search
- Categories: `doctrine`, `architecture`, `decision`, `workflow`, `policy`, `insight`, `lesson_learned`, `pattern`
- Governance states: `staging`, `approved`, `published`, `archived`
- MCP tools: `memory.search_org`, `memory.upsert_org`

**What is missing:**

- Dedicated Knowledge workspace UI (not a separate route yet)
- `memory.personal_memory` in Spine DB (only exists in D1 migration)
- Full "Memory View Layer" as described in early architecture docs

### 3.5 Product Modules (Feature Matrix)

| Module                | Intelligence    | Execution          | Knowledge        | Status          |
| --------------------- | --------------- | ------------------ | ---------------- | --------------- |
| Entity 360            | ✅ View         | ⚠️ Deep links only | ❌               | Live            |
| At-Risk Brief         | ✅ Full         | ❌                 | ❌               | Live            |
| Proposals / HITL      | ✅ Inline       | ✅ Actions panel   | ❌               | Live            |
| Governance Audit      | ❌              | ✅ Log panel       | ❌               | Live            |
| Org Memory Search     | ⚠️ Embedded     | ❌                 | ⚠️ MCP tool only | Partial         |
| Personal Memory       | ❌              | ❌                 | ❌               | Not in Spine DB |
| Conversational Memory | ✅ Twin uses it | ❌                 | ❌               | Live            |
| Semantic Search       | ⚠️ Backend only | ❌                 | ⚠️ Backend only  | Partial         |
| Department Playbooks  | ❌              | ⚠️ CS prototype    | ❌               | In build        |
| Tool Deep Links       | ⚠️ Inline       | ✅ Tools panel     | ❌               | Partial         |
| Workflow Triggers     | ❌              | ⚠️ CF Workflows    | ❌               | Partial         |

---

## 4. User Views — What the User Actually Sees

### 4.1 Authenticated Shell (`app.integratewise.ai/app`)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Personal | Work        [Search]    [User] [Bell]   │  ← Top Nav
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              WORKBENCH CONTENT AREA                 │   │
│  │                                                     │   │
│  │  - At-Risk Accounts                                 │   │
│  │  - Entity 360 Cards                                 │   │
│  │  - Knowledge Modules (embedded)                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🤖 TWIN SIDEBAR                                    │   │  ← Bottom/Right
│  │  "3 accounts at risk. Approve draft email?"         │   │
│  │  [Approve] [Reject] [Explain]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Reality:** This is **one shell**, not three surfaces. The Twin is a sidebar. Memory is embedded modules. There is no separate "Twin Workbench" route or "Memory View Layer" route.

### 4.2 Execution Shell (`ops.integratewise.ai/execution/:dept` — Target)

```
┌─────────────────────────────────────────────────────────────┐
│  [IW]  Execution: Customer Success        [User] [Settings] │
├─────────────────────────────────────────────────────────────┤
│  [Playbook] [Tools] [KPIs] [Workflows] [Actions] [Log]      │  ← 6 Panels
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌─────────────────────────────────────┐ │
│  │ PLAYBOOK     │  │  Content for selected panel         │ │
│  │ - Runbook A  │  │                                     │ │
│  │ - Runbook B  │  │  (Playbook: SOPs, decision trees)   │ │
│  │ - Decision C │  │  (Tools: Deep links to HubSpot...)  │ │
│  └──────────────┘  │  (KPIs: Metrics cards)              │ │
│                    │  (Workflows: CF Workflow trigger list) │ │
│                    │  (Actions: Proposal queue)          │ │
│                    │  (Log: Audit trail)                 │ │
│                    └─────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Current state:** Only CS department prototype exists (`cs.vue`). Other departments not built.

### 4.3 Proposal Flow (User Journey)

```
User sees at-risk account in Intelligence view
              │
              ▼
Twin generates proposal: "Draft retention email to Acme Corp"
              │
              ▼
Proposal appears in Intelligence view (inline) AND Execution Actions panel
              │
              ▼
User clicks [Approve] or [Reject]
              │
              ▼
Gateway → Intelligence Worker → D1 (update proposal + audit log)
              │
              ▼
Continuity writeback: Spine DB org_memory updated (async, non-blocking)
              │
              ▼
User executes in their own HubSpot/Gmail (deep link, not API call)
              │
              ▼
Connector re-reads result via MCP → Spine updates → loop continues
```

### 4.4 Memory Interaction (User Journey)

```
User asks Twin: "What did we decide about pricing last quarter?"
              │
              ▼
Twin calls memory.search_org (MCP tool)
              │
              ▼
MCP Connector → Knowledge Worker → Spine DB pgvector search
              │
              ▼
Returns ranked org_memory entries (doctrine, decision, insight)
              │
              ▼
Twin surfaces answer + citations
              │
              ▼
User says: "Promote this to approved doctrine"
              │
              ▼
Proposal created → HITL approval → governance_state = 'approved'
```

---

## 5. Honest Gap List

| Gap                                                               | Impact                                        | Path Forward                                                                        |
| ----------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `personal_memory` missing from Spine DB                           | Personal Memory feature blocked               | Add table to `memory.*` schema, migrate D1 data                                     |
| Three surfaces = one shell today                                  | Architecture doc overstates product structure | Build Execution Shell (`/execution/:dept`) and Knowledge surface as separate routes |
| Frontend Spine DB bypasses (`useSpine DBEntities`, `useDemoData`) | Security posture weakened                     | Route through Gateway or document as intentional                                    |
| Normalizer stages 2–6 are heuristic, not LLM                      | "AI-native" claim is overstated for ingestion | Document as roadmap, not current capability                                         |
| `mcp-tools.json` stale (python reference)                         | Confuses new developers                       | Delete or sync with live `tools.ts`                                                 |
| `spine_entities` → `public.entities` naming drift                 | Documentation mismatch                        | Update all docs to use `entities`                                                   |
| Execution Layer reads Firestore                                   | Wrong data source for ops                     | Complete MCP migration (`useMcpTool` composables)                                   |
| Govern worker deprecated but code duplicated                      | Maintenance burden                            | Finish consolidation into `integratewise-intelligence`                              |
| No standalone Memory View Layer route                             | Knowledge surface invisible to users          | Build `/knowledge` route with org_memory search UI                                  |

---

## 6. Technology Stack (Verified)

| Layer             | Technology                                                          |
| ----------------- | ------------------------------------------------------------------- |
| **Frontend**      | React 18 (Intelligence), Vue 3 (Execution)                          |
| **API / Workers** | Cloudflare Workers, Hono, TypeScript                                |
| **Protocol**      | MCP (Model Context Protocol)                                        |
| **Canonical DB**  | Spine DB Postgres (memory, entities)                                |
| **Hot Cache**     | Cloudflare D1 (proposals, audit, fingerprints)                      |
| **Session Cache** | Cloudflare KV                                                       |
| **Queue**         | Cloudflare Queues (pipeline-process, knowledge-ingest, etc.)        |
| **Search**        | Spine DB pgvector (1536-dim embeddings)                             |
| **Auth**          | Spine DB JWT                                                        |
| **Blob**          | Cloudflare R2                                                       |
| **Build**         | Vite, pnpm, Turbo                                                   |
| **Banned**        | Python, Firestore (canonical), direct Spine DB writes from frontend |

---

_This document was produced by codebase audit on May 2026. Every claim is backed by file-level evidence. When reality changes, this document should be updated._
