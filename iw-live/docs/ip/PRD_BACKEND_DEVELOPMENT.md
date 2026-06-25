# PRD — Backend Layer Development (Complete)

> **Date:** June 5, 2026 | **Authority:** Nirmal (Founder)
> **Objective:** Make all backend layers development-complete before any frontend wiring.
> **Reference:** `docs/tech/INTEGRATEWISE_PRODUCT_ARCHITECTURE.md` (Sections A–D)

---

## 1. Goal

Complete the backend so that every projection endpoint returns real data from real schemas.
No stubs. No mocks. No "TODO" in production paths. Every layer works end-to-end independently
before the frontend touches it.

---

## 2. Success Criteria

```
When this PRD is complete:
  ✅ Any frontend store can call its projection endpoint and get real structured data
  ✅ A user can sign up, connect a tool, and see real Spine data in D1
  ✅ Memory loop captures → promotes → indexes → retrieves end-to-end
  ✅ Governance board has tasks, proposals, decisions flowing through
  ✅ Twin can assemble Entity 360 (Spine + Memory + Signals) from live data
  ✅ All services compile, deploy, and respond to health checks
```

---

## 3. Deliverables (Ordered by Dependency)

### 3.1 D1 Schema — Complete Data Layer

All tables needed by the system must exist in D1 (integratewise-spine-cache).

```
MIGRATION 0001: tenants, tenant_users, workspaces                    ✅ DONE
MIGRATION 0002: tenant_spine_config
  - tenant_id TEXT PRIMARY KEY
  - domains TEXT (JSON array)
  - industry TEXT
  - schema_version TEXT
  - allowed_entity_types TEXT (JSON array)
  - connector_configs TEXT (JSON object)
  - connected_connectors TEXT (JSON array)
  - subscription_tier TEXT DEFAULT 'free'
  - created_at, updated_at

MIGRATION 0003: spine_entities (the Spine in D1)
  - id TEXT PRIMARY KEY
  - tenant_id TEXT NOT NULL
  - entity_type TEXT NOT NULL
  - name TEXT NOT NULL
  - source TEXT NOT NULL
  - source_id TEXT NOT NULL
  - health_score INTEGER
  - health_trend TEXT
  - arr INTEGER
  - tier TEXT
  - status TEXT
  - data TEXT (JSON — all entity-specific fields)
  - metadata TEXT (JSON)
  - created_at, updated_at
  - UNIQUE(tenant_id, source, source_id)
  INDEXES: tenant_id, entity_type, tenant_id+entity_type

MIGRATION 0004: signals
  - id TEXT PRIMARY KEY
  - tenant_id TEXT NOT NULL
  - entity_id TEXT
  - entity_name TEXT
  - type TEXT NOT NULL
  - severity TEXT NOT NULL
  - title TEXT
  - body TEXT
  - evidence TEXT (JSON array)
  - data TEXT (JSON)
  - status TEXT DEFAULT 'active'
  - created_at TEXT
  INDEXES: tenant_id, tenant_id+entity_id, tenant_id+severity

MIGRATION 0005: proposals
  - id TEXT PRIMARY KEY
  - tenant_id TEXT NOT NULL
  - entity_id TEXT
  - entity_name TEXT
  - title TEXT NOT NULL
  - body TEXT
  - confidence REAL
  - risk REAL
  - category TEXT
  - evidence TEXT (JSON array)
  - state TEXT DEFAULT 'pending'
  - proposed_by TEXT DEFAULT 'twin'
  - reviewed_by TEXT
  - reviewed_at TEXT
  - created_at, updated_at
  INDEXES: tenant_id+state, tenant_id+entity_id

MIGRATION 0006: governance (tasks + decisions + outcomes)
  tasks:
  - id TEXT PRIMARY KEY
  - tenant_id TEXT NOT NULL
  - title TEXT NOT NULL
  - description TEXT
  - owner TEXT NOT NULL (human | twin | team)
  - status TEXT DEFAULT 'pending'
  - priority TEXT DEFAULT 'medium'
  - entity_refs TEXT (JSON array)
  - procedures TEXT (JSON array of {step, description, completed})
  - knowledge_refs TEXT (JSON array)
  - assignee TEXT
  - due_date TEXT
  - outcomes TEXT (JSON array)
  - created_at, updated_at
  INDEXES: tenant_id+status, tenant_id+owner

  decisions:
  - id TEXT PRIMARY KEY
  - tenant_id TEXT NOT NULL
  - title TEXT NOT NULL
  - body TEXT
  - approved_by TEXT
  - evidence TEXT (JSON array)
  - expected_outcome TEXT
  - actual_outcome TEXT
  - entity_refs TEXT (JSON array)
  - source_proposal_id TEXT
  - created_at TEXT
  INDEXES: tenant_id

MIGRATION 0007: memory_metadata (D1 mirror for human browse)
  - id TEXT PRIMARY KEY
  - tenant_id TEXT NOT NULL
  - category TEXT NOT NULL
  - title TEXT NOT NULL
  - entity_refs TEXT (JSON array)
  - confidence REAL
  - governance_state TEXT DEFAULT 'staging'
  - source TEXT
  - r2_key TEXT (pointer to R2 content)
  - vectorize_indexed INTEGER DEFAULT 0
  - created_at, updated_at
  INDEXES: tenant_id+category, tenant_id+governance_state

MIGRATION 0008: connectors_d1 (connection status for D1-first users)
  - id TEXT PRIMARY KEY
  - tenant_id TEXT NOT NULL
  - provider TEXT NOT NULL
  - status TEXT DEFAULT 'connected'
  - flow_type TEXT (A | B | C)
  - nango_connection_id TEXT
  - last_sync_at TEXT
  - sync_error TEXT
  - metadata TEXT (JSON)
  - created_at, updated_at
  - UNIQUE(tenant_id, provider)
  INDEXES: tenant_id
```

### 3.2 Auth Flow — CF Edge JWT

```
ENDPOINT: POST /api/v1/auth/signup
  Body: { email, password, name }
  Action: creates tenant + user in D1, issues JWT
  Returns: { token, tenant_id, user_id }

ENDPOINT: POST /api/v1/auth/login
  Body: { email, password }
  Action: validates credentials (D1 lookup), issues JWT
  Returns: { token, tenant_id, user_id }

ENDPOINT: POST /api/v1/auth/google
  Body: { google_token }
  Action: validates Google token, finds/creates user in D1, issues JWT
  Returns: { token, tenant_id, user_id }

ENDPOINT: GET /api/v1/auth/me
  Headers: Authorization: Bearer <jwt>
  Returns: { user_id, tenant_id, email, name, role, plan }

JWT STRUCTURE:
  sub: user_id
  tenant_id: tenant_id
  role: owner | admin | member
  plan: free | starter | pro | enterprise
  iat, exp (24h)

LOCATION: services/gateway/src/auth.ts (new file)
  Uses: services/tenants D1 tables for user lookup
  Uses: lib/jwt.ts for signJWT (already exists)
```

### 3.3 Onboarding Endpoint

```
ENDPOINT: POST /api/v1/onboarding/initialize
  Headers: Authorization: Bearer <jwt>
  Body: {
    domain: string,
    industry: string,
    department: string,
    company_size: string,
    workspace_name: string,
    connectors: [{ provider, entityTypes, flowType }]
  }
  Action:
    1. Write tenant_spine_config to D1
    2. Update tenant name/settings in D1
    3. For each connector: create connectors_d1 record
    4. Return { tenant_config, next_step: 'connect' }

ENDPOINT: POST /api/v1/onboarding/connect
  Headers: Authorization: Bearer <jwt>
  Body: { provider: string }
  Action:
    1. Call Nango createConnectSession (gets session token)
    2. Return { session_token, integration_id }
    3. Frontend opens Nango Connect UI with token
    4. After connect: Nango webhook → /nango/webhook → triggers creamy sync

LOCATION: services/gateway/src/onboarding.ts (new file)
  Or: extend services/tenants with these routes
```

### 3.4 Pipeline — Spine Write to D1

The Pipeline currently writes to Supabase. For initial users it must also write to D1.

```
CHANGE: services/pipeline (the 8-stage Normalizer output)
  After normalization: write entity to D1 spine_entities table
  Pattern:
    INSERT INTO spine_entities (id, tenant_id, entity_type, name, source, source_id, data, ...)
    ON CONFLICT (tenant_id, source, source_id) DO UPDATE SET ...

  This is the Spine write path for D1-first users.
  For promoted users: dual-write (D1 + Supabase).

SIGNAL GENERATION:
  After Spine write, if health_score changed or entity state changed:
    INSERT INTO signals (id, tenant_id, entity_id, type, severity, ...)
  Signal types: health_drop, renewal_approaching, engagement_drop, etc.
  These are what /v1/signals returns and what /desk shows.
```

### 3.5 Service Route Verification

Every downstream service must respond correctly to the paths the projection layer calls.

```
INTELLIGENCE SERVICE:
  GET /v1/signals?tenant_id=X&severity=Y&limit=Z           ✅ EXISTS (think)
  GET /v1/proposals?tenant_id=X&status=Y&limit=Z           ✅ EXISTS (govern)
  POST /v1/proposals (create proposal)                      ✅ EXISTS (govern)
  POST /v1/proposals/:id/approve                            ✅ EXISTS (govern)
  POST /v1/proposals/:id/reject                             ✅ EXISTS (govern)
  POST /v1/triage (trigger TriageWorkflow)                  ✅ EXISTS

PIPELINE SERVICE:
  GET /v1/spine/entities/:entityId                          ⬜ NEEDS BUILDING
    Read from D1 spine_entities WHERE id = ?
    Return: full entity object with parsed JSON fields

  POST /v1/spine/write                                      ⬜ NEEDS BUILDING
    Accept normalized entity from Normalizer
    Write to D1 spine_entities
    Generate signal if state changed
    Return: { written: true, entity_id, signal_generated: bool }

KNOWLEDGE SERVICE:
  GET /v1/memory/search?entity_id=X&limit=Y                ⬜ NEEDS BUILDING
    Query Vectorize with entity_id filter
    Return: top K memory entries (title, category, body snippet, confidence)

  GET /v1/memory/org?category=X&limit=Y                    ⬜ NEEDS BUILDING
    Query D1 memory_metadata WHERE category = X
    Return: metadata list (for human browse)

BFF/WORKFLOW SERVICE:
  GET /v1/tasks?tenant_id=X&limit=Y                        ⬜ NEEDS BUILDING
    Query D1 tasks table
    Return: task list with parsed procedures/outcomes

  POST /v1/tasks                                            ⬜ NEEDS BUILDING
    Create task in D1

  PATCH /v1/tasks/:id                                       ⬜ NEEDS BUILDING
    Update task status, procedures, outcomes

  GET /v1/decisions?tenant_id=X&limit=Y                    ⬜ NEEDS BUILDING
    Query D1 decisions table
    Return: decision list
```

### 3.6 Nango Live Connection

```
PREREQUISITE: NANGO_SECRET_KEY added to Cloudflare Secrets Store
  Secret store ID: 1fd83fc5881e4cd296ae3c2fbe80693c
  Secret name: NANGO_SECRET_KEY

NANGO DASHBOARD:
  Configure integrations: hubspot, jira (minimum for demo)
  Set webhook URL: https://gateway.integratewise.ai/nango/webhook
  Connection ID pattern: tenant_id

VERIFICATION:
  POST /internal/nango/session → returns { session_token }
  Frontend opens Nango UI → user authorizes → webhook fires
  Webhook → connector-sync triggers creamy sync
  Pipeline writes to D1 spine_entities
  GET /api/v1/projections/morning-context → shows real signals
```

### 3.7 Memory Loop End-to-End

```
WRITE PATH (code-complete from this session):
  memory.write_conversational → Pipeline db-proxy → D1
  memory.propose → D1 proposals table
  TriageWorkflow → R2 + Vectorize + D1 memory_metadata (atomic write)

READ PATH (needs verification):
  /v1/memory/search → Vectorize query → returns results
  /v1/memory/org → D1 memory_metadata → returns metadata list

INITIAL LOAD (needs trigger):
  memory-repo sync script → batch → memory.write_conversational
  → memory.propose (per doc, confidence 0.85)
  → TriageWorkflow auto-approves
  → R2 + Vectorize + D1

VERIFICATION:
  After initial load: Vectorize index has entries
  Twin can query: "what do we know about X" → gets results from Vectorize
  Entity 360: memory panel shows relevant entries for entity
```

### 3.8 R2 Spine Backup (A12 Mitigation)

```
After every Pipeline D1 write:
  Append to R2: spine-backup/{tenant_id}/{YYYY-MM-DD}.jsonl
  Content: one JSON line per entity written
  Retention: 30 days daily, weekly beyond that (cleanup cron)

IMPLEMENTATION:
  services/pipeline — after D1 write, env.FILES.put() one JSONL line
  R2 binding already exists on connector service (integratewise-files-prod)
  Pipeline needs FILES binding added to wrangler.toml
```

---

## 4. Dependency Order (Build Sequence)

```
STEP 1: D1 Migrations (0002–0008)
  No external dependency. Pure SQL.
  Apply: wrangler d1 migrations apply integratewise-spine-cache --remote

STEP 2: Auth flow (signup/login/me)
  Depends on: D1 tenants table (✅ done)
  Depends on: lib/jwt.ts (✅ exists)

STEP 3: Onboarding endpoint
  Depends on: D1 tenant_spine_config (step 1)
  Depends on: Auth flow (step 2)

STEP 4: Pipeline D1 write path
  Depends on: D1 spine_entities table (step 1)
  Depends on: D1 signals table (step 1)

STEP 5: Service route endpoints (Pipeline, Knowledge, BFF)
  Depends on: D1 tables (step 1)
  Depends on: Pipeline write (step 4) for data to exist

STEP 6: Nango live connection
  Depends on: NANGO_SECRET_KEY in secrets (manual)
  Depends on: Pipeline D1 write (step 4)
  Depends on: connector-sync triggering creamy (already wired)

STEP 7: Memory loop verification
  Depends on: Vectorize pipeline (TriageWorkflow — ✅ wired this session)
  Depends on: Knowledge /v1/memory/search endpoint (step 5)
  Depends on: memory-repo sync script invocation (manual or cron)

STEP 8: R2 backup
  Depends on: Pipeline D1 write (step 4)
  Depends on: R2 binding on Pipeline (needs wrangler.toml addition)
```

---

## 5. What Is NOT In Scope

```
✗ Frontend development (separate PRD: IW_FRONTEND_ARCHITECTURE.md)
✗ External LLM MCP access (Phase 2)
✗ Subscription/payment wiring (Phase 2)
✗ mcp.integratewise.ai DNS setup (after memory loop verified)
✗ Agent token issuance for Gemini/Claude/ChatGPT (after MCP DNS)
✗ Advanced chunking strategy (DOC-09 §5.1 — can iterate after basic works)
✗ Docs publication pipeline (Connection 5 — after memory loop)
✗ Folder watcher automation (Connection 2 — after memory loop)
```

---

## 6. Definition of Done

```
For each step to be "done":
  ✅ Code compiles (tsc --noEmit passes)
  ✅ D1 migration applied (--remote)
  ✅ Service responds to health check
  ✅ Endpoint returns correct shape (matches TypeScript interface in IW_FRONTEND_ARCHITECTURE.md)
  ✅ Committed to main with descriptive message
  ✅ Tested with curl or wrangler dev (at minimum)
```

---

## 7. Handoff Notes

```
THIS SESSION COMPLETED:
  ✅ Tenants → D1 migration (applied, Customer Zero seeded)
  ✅ TriageWorkflow → R2 + Vectorize + D1 atomic write
  ✅ BulkCleanupSwarmWorkflow binding enabled
  ✅ Gateway projection endpoints (morning-context, entity360, governance, inbox)
  ✅ Architecture docs (Sections A–D, Frontend Architecture)

NEXT SESSION STARTS AT:
  Step 1 — D1 migrations 0002–0008 (pure SQL, no external deps)
  Then Step 2 — Auth flow
  Then Step 4 — Pipeline D1 write

READ BEFORE STARTING:
  docs/tech/INTEGRATEWISE_PRODUCT_ARCHITECTURE.md
  docs/tech/IW_FRONTEND_ARCHITECTURE.md (Section 4 — API contract)
  services/gateway/src/projections.ts (projection pattern)
  services/tenants/migrations/0001_init_tenants.sql (schema pattern)
```

---

_Backend layers complete = frontend can wire. Not before._
_Build depth-first, not breadth-first._
_Every endpoint must return real data from real schemas._
