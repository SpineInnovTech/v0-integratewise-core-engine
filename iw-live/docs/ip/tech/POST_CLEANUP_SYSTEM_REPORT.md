# IntegrateWise — Post-Cleanup System Report

> What the system looks like after all 11 collision categories are resolved.
> This is the target state. Every path is singular. Every file has one job.

---

## THE SYSTEM AFTER CLEANUP

### One Data Read Path

Every frontend view reads data the same way:

```
Frontend View
    │
    ▼
useWorkspaceEntities("entity_type")
    │  (delegates internally)
    ▼
useSpine DBEntities → spineDb.rpc("get_workspace_entities")
    │
    ▼
Spine DB PostgreSQL (RLS scoped by tenant_id via auth.uid())
```

No Gateway. No BFF. No Hydration Fabric. No SpineProvider. One hook, one RPC, one DB call.

For composite views (multiple entity types):

```
useWorkspaceEntitiesBatch(["account_master", "task_item", "risk"])
    │
    ▼
spineDb.rpc("get_workspace_entities", { p_entity_types: [...] })
    │
    ▼
ONE DB call returns all entity types
```

For product-scoped views:

```
useProductEntities("data_sentinel")
    │
    ▼
spineDb.rpc("get_product_entities", { p_product_id: "..." })
```

**What's eliminated:**

- useHydrateProjection (18 consumers migrated)
- useSpineEntities in spine-client.tsx (deleted)
- useSpineEntities in useCognitiveData.ts (deleted)
- All apiFetch calls for entity reads (295 calls audited, workspace reads converted)
- useModuleDataContext dependency on SpineProvider (reads from Spine DB directly)

**What stays on Gateway (writes + L2 cognitive):**

- All writes (POST /api/v1/workspace/entities, etc.)
- L2 cognitive operations (signals, situations, approvals, Flow C triage)
- Admin operations (RBAC, tenant management)
- Billing operations

---

### One Schema Source of Truth

```
packages/types/src/schema.ts
    │
    │  DOMAIN_SPINE_CONFIG (12 domains × entity types + priority fields)
    │  getSpineConfig(industry, department)
    │  INDUSTRY_SPINE_BASE (11 industry overlays)
    │  ORGANIC_CAPABILITY_MAP (what frontend shows per domain)
    │
    ├── Consumed by: Normalizer (S1 schema resolution, S3 filter, S5 extract)
    ├── Consumed by: Spine-v2 (ENTITY_TYPE_TO_TABLE derives from this)
    ├── Consumed by: entity_type_map SQL table (migration 070, derives from this)
    └── Consumed by: Frontend (via Spine DB RPC, never directly)
```

**What's eliminated:**

- DOMAIN_SPINE_CONFIG duplicate in services/workflow/src/index.ts (deleted, imports from packages/types)
- ADAPTIVE_DOMAIN_TO_ENTITY_TYPES in adaptive-schema.ts (synced to 12 domains, derives from schema.ts)
- spineProjection in domain-types.ts (removed — Spine DB RPC bypasses it entirely)

**What stays:**

- ENTITY_TYPE_TO_TABLE in spine-v2 (needed for write routing, aligned with schema.ts)
- entity_type_map SQL table (needed for RPC, aligned with ENTITY_TYPE_TO_TABLE)
- domain-data-registry.ts (seed data, not schema — clearly labeled)

---

### One Entity 360 Path

```
Frontend (Entity360View.tsx)
    │
    ▼
spineDb.rpc("get_entity_360", { p_entity_id: "..." })
    │  OR
apiFetch("/api/entity360/:id") → Gateway → Spine-v2
    │
    ▼
Spine-v2: assembleEntity360()
    │
    ├── Truth: spine.entities + department table
    ├── Context: context_extractions
    ├── Knowledge Memory: consolidated_memories (Flow C, governed)
    ├── Signals: signals table
    └── Relationships: entity graph
    │
    ▼
KV Cache (60s TTL)
    │
    ▼
Entity 360 Response (all layers assembled)
```

**What's eliminated:**

- Think's thin Entity360Client (entity360-client.ts) — deleted, Think calls Spine-v2 assembler via service binding
- Third path in cognitive-brain.ts:2037 — deleted, uses Spine-v2 assembler
- Frontend calling Think directly for Entity 360 — redirected to Spine-v2

**What stays:**

- Spine-v2 assembleEntity360() — THE assembler (rich, cached, relationships included)
- Twin 360 endpoint (/v1/twin/360/:entityId) — calls Spine-v2 assembler, then evaluates triggers
- Frontend Entity360View — calls Spine-v2 (not Think)

---

### One HITL / Approval Path

```
Twin generates insight
    │
    ▼
Think writes to Spine DB `actions` table (status: pending_approval)
    │
    ▼
Frontend reads pending actions (Spine DB direct: spineDb.from("actions").select("*").eq("status", "pending_approval"))
    │
    ▼
User approves/rejects in L2 overlay
    │
    ▼
Frontend calls: POST /api/v1/cognitive/hitl/approve (Gateway → Workflow)
    │
    ▼
Workflow handleApproval():
    ├── Approve: generates approval_token → ACT_QUEUE
    ├── Reject: writes to decision_memory → notifies Think (ADJUST)
    │
    ▼
Act service receives from ACT_QUEUE:
    ├── Validates approval_token
    ├── Calls Govern for policy check
    ├── Executes via Connector (external tool)
    ├── Re-ingests result to Pipeline (REPEAT)
    └── Sends outcome feedback to Think (ADJUST)
```

**What's eliminated:**

- POST /v1/approve + POST /v1/reject on Govern (consolidated into Workflow path)
- POST /api/v1/cognitive/act/approve (consolidated into Workflow path)
- POST /api/v1/l2/recommendations/:id/decision (consolidated into Workflow path)
- HITLGateDO Durable Object direct path (consolidated — all approvals go through Spine DB-backed Workflow)

**What stays:**

- ONE approval endpoint: POST /api/v1/cognitive/hitl/approve
- ONE rejection endpoint: POST /api/v1/cognitive/hitl/reject
- Govern policy check (called by Act, not directly by frontend)
- Act execution (called by ACT_QUEUE, not directly by frontend)

---

### One L2 Overlay

```
workspace-shell-new.tsx
    │
    ▼
L2DrawerProvider (l2-drawer-animated.tsx)
    │
    ├── ⌘J keyboard shortcut
    ├── Bottom bar trigger
    ├── Event listeners (iw:evidence:open, iw:cognitive:open)
    │
    ▼
Surface tabs: Spine | Context | Knowledge | Entity 360 | Think | Act | Adjust | Twin
    │
    ▼
Panel components from l2/cognitive/panels/
    │
    ├── SpinePanel, ContextPanel, KnowledgePanel
    ├── ThinkPanel, EvidencePanel, SignalsPanel
    ├── MemoryPanel, AuditPanel
    ├── PolicyPanel, CorrectRedoPanel
    ├── WorkflowsPanel, ProactiveTwinPanel
    └── ActSurface (HITL approval queue — merged from CognitiveLayer.tsx)
```

**What's eliminated:**

- intelligence-overlay-new.tsx (deleted — orphan)
- CognitiveLayer.tsx (HITL approval code merged into l2-drawer-animated, file deleted)
- l2-drawer.tsx (deleted — duplicate of l2-drawer-animated)

**What stays:**

- l2-drawer-animated.tsx — THE L2 overlay (active, imported by workspace-shell-new)
- All panel components in l2/cognitive/panels/ (unchanged)

---

### Clean File Structure

**l1/views/ — 5 active files (31 orphans deleted):**

- entity-browser.tsx
- Entity360View.tsx
- duplicate-resolution-view.tsx
- knowledge-hub.tsx
- product-view.tsx

**l1/domains/ — 12 domains, no dead shells:**

- Each domain has: dashboard.tsx, views/, modules.ts
- shell.tsx files deleted (content-router handles all routing)
- No duplicate executive dashboards

**l1/navigation/ — 1 command palette:**

- command-palette.tsx (the active one)
- l1/command-palette.tsx deleted
- l1/command-palette/ directory deleted

**l2/ — 1 overlay, clean panels:**

- cognitive/l2-drawer-animated.tsx (THE overlay)
- cognitive/panels/ (all panel components)
- approvals/ (approval components, evidence-drawer.tsx kept)
- knowledge/ (knowledge components)
- No orphan overlays, no duplicate drawers

---

### Service Architecture (Consolidated)

```
ACTIVE WORKERS (7):
├── integratewise-gateway        — API routing, auth, CORS
├── integratewise-bff            — Workflow service (HITL, DOs, real-time)
├── integratewise-intelligence   — Think + Act + Govern + Agents (consolidated)
├── integratewise-pipeline       — Normalizer + Spine-v2 (consolidated)
├── integratewise-knowledge      — Knowledge service + Memory Consolidator
├── integratewise-connector      — Connector + Loader + MCP + Store (consolidated)
└── integratewise-connector-sync — Connector sync scheduling

QUEUES (9, all properly consumed):
├── pipeline-process       → pipeline
├── knowledge-ingest       → knowledge
├── intelligence-events    → intelligence
├── intelligence-act       → intelligence
├── signals                → intelligence
├── accelerator-trigger    → pipeline
├── ops-dlq                → intelligence
├── connector-sync         → connector-sync
└── memory-consolidation   → knowledge
```

**What's eliminated:**

- 6 deprecated wrangler.toml files (act, agents, govern, normalizer, spine-v2, think)
- Worker name collision (integratewise-mcp-connector — one wrangler.toml kept)
- Placeholder D1 ID in mcp-connector

---

### Database Architecture (Resolved)

```
READS: get_workspace_entities() RPC
    │
    ├── Checks entity_type_map for schema routing
    ├── If Architecture A table exists → reads from domain schema (e.g., cs.account_health)
    ├── If Architecture A table missing → falls back to public.entities (Architecture B)
    └── Returns unified result regardless of which architecture stores the data

WRITES: Spine-v2 writeToSpine()
    │
    ├── Tries Architecture A table first (domain schema)
    ├── Falls back to public.entities if schema table doesn't exist
    └── Logs which path was used (fallback tracking)
```

The split-brain is acknowledged and handled gracefully. Both architectures coexist. The RPC abstracts the difference. Over time, Architecture A tables can be created for the missing 93 entity types, but the system works correctly with the fallback.

---

## FUNCTIONALITY AFTER CLEANUP

### What Works End-to-End

**1. Onboarding → Workspace**

- User signs up (Spine DB Auth)
- Selects department + industry (OnboardingFlow.tsx)
- tenant_spine_config activates (schema resolves)
- Connects first tool (OAuth)
- Loader extracts data → Pipeline processes (S1-S8) → Spine populates
- Workspace renders with real data (Spine DB direct reads)
- L1 sections hydrate per connector

**2. Entity 360 → Twin → AI Insights**

- Entity 360 assembles from Spine-v2 (Truth + Context + Knowledge Memory + Signals)
- Twin evaluates 10 triggers against assembled data
- Proactive insights written to signals table
- Frontend picks up new insights via Spine DB Realtime subscription
- Insights appear in L2 overlay and notification badge

**3. HITL Approval → Act → Repeat**

- Twin proposes action → written to actions table (pending_approval)
- User sees pending action in L2 overlay
- User approves → Workflow generates token → ACT_QUEUE
- Act validates token → Govern policy check → Connector executes on external tool
- Result re-ingested through Pipeline → Spine updates → Entity 360 updates
- Twin re-evaluates → loop continues

**4. Flow C → Knowledge Memory**

- AI session ends → Knowledge service triage
- Triage Bot scores confidence (Workers AI)
- > = 0.85 confidence → auto-approve
- < 0.5 confidence → auto-discard
- Between → pending in Triage Inbox (Knowledge Hub)
- User approves → Memory Consolidator → consolidated_memories
- Entity 360 reads from consolidated_memories (governed knowledge)
- Twin uses verified memory for reasoning

**5. 20 Products Across 3 Surfaces**

- Product catalog in Spine DB (migration 071)
- Product-scoped navigation (migration 072)
- Generic ProductView auto-renderer for products without custom views
- 3 custom views: SuccessPilot (csm-accounts-hub), ChurnShield (intelligence-center), SuccessCommand (strategic-account-success)
- 15 generic product views via ProductView wrapper

**6. Billing**

- Free subscription created on onboarding
- Plan IDs: free/starter/growth/enterprise
- Entitlement checks (dual-schema read)
- SubscriptionsPage in all 12 domain content maps

**7. 73 Connectors**

- 60+ SaaS connectors
- 6 India/Dubai connectors (Google Sheets, Tally, Razorpay, Vyapar, Khatabook, Shiprocket)
- 6 accelerators (health_score, churn_prediction, revenue_forecast, pipeline_velocity, nps_analysis, data_quality)
- 3 AI connectors (OpenAI, Anthropic, Cohere)
- MCP connector (live endpoint)
- Webhook Ingress (universal)
- 52 sync adapters wired to universalSync()
- OAuth token refresh (44 provider endpoints)

---

## METRICS AFTER CLEANUP

| Metric                             | Before                    | After                                   |
| ---------------------------------- | ------------------------- | --------------------------------------- |
| Data read paths                    | 6 parallel hooks          | 1 (useWorkspaceEntities → Spine DB RPC) |
| Schema sources                     | 5 definitions             | 1 (schema.ts, everything derives)       |
| Entity 360 paths                   | 3 endpoints, 2 assemblers | 1 assembler (Spine-v2), 1 frontend path |
| HITL/approval paths                | 4 frontend endpoints      | 1 (POST /api/v1/cognitive/hitl/approve) |
| L2 overlay implementations         | 4 files                   | 1 (l2-drawer-animated.tsx)              |
| Orphan files in l1/views/          | 31                        | 0                                       |
| Dead domain shells                 | 11                        | 0                                       |
| Duplicate command palettes         | 3                         | 1                                       |
| Duplicate evidence drawers         | 2                         | 1                                       |
| Duplicate onboarding flows         | 2                         | 1                                       |
| Duplicate executive dashboards     | 2                         | 1 (wired version)                       |
| Deprecated wrangler.toml files     | 6                         | 0                                       |
| apiFetch calls for workspace reads | ~50                       | 0 (all Spine DB direct)                 |
| Typecheck                          | 31/31                     | 31/31 (maintained)                      |
| Active workers                     | 7                         | 7 (unchanged, configs cleaned)          |
| Queues                             | 9                         | 9 (unchanged, all properly consumed)    |

---

## WHAT THE USER EXPERIENCES

### Day 1 (After connecting first tool)

L1 Workspace:

- Dashboard shows real data from connected tool
- Only sections with data are visible (progressive hydration)
- Empty sections show "Connect [tool name] to see this data"
- Navigation is clean — no 26-item sidebar, just relevant sections

L2 Cognitive Overlay (⌘J):

- Mostly empty — not enough data for Twin to reason
- Knowledge Hub available (Triage Inbox, Memories, Sessions)
- AI Chat available but limited context

### Week 1 (After connecting 3-4 tools)

L1 Workspace:

- Multiple sections hydrated (accounts, contacts, tasks, calendar, revenue)
- Entity 360 shows assembled profiles with Truth + Context
- Cross-tool data visible in unified views

L2 Cognitive Overlay:

- Twin starts generating proactive insights
- Signals appear in notification badge
- Evidence panels show source attribution
- HITL approval queue starts receiving proposals

### Month 1 (Full stack connected)

L1 Workspace:

- All sections hydrated
- Health scores computed
- Renewal tracking active
- Cross-department visibility (BizOps users)

L2 Cognitive Overlay:

- Full Twin active — 10 triggers evaluating
- Knowledge Memory growing daily (Flow C)
- HITL approval workflow in regular use
- Decision memory accumulating (ADJUST)
- AI Chat deeply contextual

### The Continuous Loop

```
Connect tools → Data flows through Pipeline → Spine populates
    → Entity 360 assembles → Twin reasons → Insights surface
    → Human decides → Actions execute → Tools update
    → Data flows back through Pipeline → Spine updates
    → Entity 360 refreshes → Twin re-evaluates
    → Knowledge Memory grows → System gets smarter
    → No retraining needed → Context always current
```

---

_This is the system after cleanup. One path for everything. No collisions. No confusion. Development and enhancements flow naturally because every developer knows exactly where to look, what to call, and how data moves._
