# IntegrateWise System Architecture - Visual Diagrams

## 1. Three-Spine Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNIFIED LIFECYCLE (All Three Spines)                      │
└─────────────────────────────────────────────────────────────────────────────┘

                              HUMAN SPINE (L1)
                         Ground Truth Layer
                    ┌──────────────────────────────┐
                    │ User creates quarterly goal  │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │         INTAKE PHASE          │
                    │  Signal enters the system    │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │       PROMOTION PHASE        │
                    │   Validates, ready to act    │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │        MEMORY PHASE          │
                    │  Stored as ground truth      │
                    └──────────────┬───────────────┘
                                   │
     ┌─────────────────────────────┼─────────────────────────────┐
     │                             │                             │
     │                  ┌──────────┴───────────┐                │
     │                  │        DECAY PHASE    │                │
     │                  │  Aged signals archived│                │
     │                  └──────────┬────────────┘                │
     │                             │                             │
     │         ┌───────────────────┴──────────────────┐          │
     │         │      CONTINUITY PHASE                │          │
     │         │  Outcome stored in continuity graph  │          │
     │         │  (For next cycle learning)           │          │
     │         └────────────────────────────────────┬─┘          │
     │                                              │            │
     │                                    ┌─────────┴─────┐     │
     │                                    │ COMPOUNDS INTO │     │
     │                                    │ AI SPINE + COL │     │
     │                                    │ LABORATION     │     │
     │                                    └────────────────┘    │
     │                                                           │
     │                   AI SPINE (L3)              COLLABORATION │ (L2)
     │              Intelligence Layer        Joint Decision      │
     │   ┌──────────────────────────────┐  ┌────────────────┐   │
     │   │Twin analyzes churn pattern   │  │ Human approves │   │
     │   │→ reasoning trace generated   │→ │ AI proposal    │──┘
     │   │→ proposal with confidence    │  │ → joint outcome│
     │   │→ all three flow through same │  │ → memory       │
     │   │  5-phase lifecycle           │  │   compounds    │
     │   └──────────────────────────────┘  └────────────────┘
     │
     └──────────────────────────────────────────────────────────┘
                              │
                              ↓
                   ⚙️ SYSTEM LEARNING LOOP ⚙️
                   (Outcomes feed back in)
```

---

## 2. Monorepo Structure

```
┌────────────────────────────────────────────────────────────────┐
│                  INTEGRATEWISE MONOREPO                         │
└────────────────────────────────────────────────────────────────┘

┌─ APPS (User-Facing) ──────────────────────────────────────────┐
│  ├─ web/              Next.js 16 SPA (Next.js 16 App Router)  │
│  │  ├─ Layer Switcher (Human/AI/Collaborate/Approve)          │
│  │  ├─ Domain Workbenches (CS, Sales, Marketing, RevOps, etc) │
│  │  ├─ Twin Chat Interface                                    │
│  │  ├─ Cognitive Overlay (L2)                                 │
│  │  ├─ Memory Search                                          │
│  │  └─ Approval Center                                        │
│  │                                                             │
│  ├─ desktop/          Electron desktop app                    │
│  ├─ mobile/           React Native iOS/Android                │
│  └─ local-monitor/    Node.js folder watcher                  │
└───────────────────────────────────────────────────────────────┘

┌─ SERVICES (28 Cloudflare Workers) ────────────────────────────┐
│                                                                 │
│  ┌─ DATA INGESTION (S1-S4) ──────────────────────────────────┐ │
│  │ LOADER         Universal intake (MCP-native, no transform) │ │
│  │ CONNECTOR      Tool OAuth + API integration               │ │
│  │ NORMALIZER     8-stage LLM-in-loop pipeline               │ │
│  │ PIPELINE       Entity resolution + Spine writes           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                             ↓                                   │
│  ┌─ INTELLIGENCE (S5-S8) ──────────────────────────────────┐  │
│  │ INTELLIGENCE   Signal analysis + anomalies               │  │
│  │ THINK          Synchronous reasoning                     │  │
│  │ IW-AGENT-RUNTIME Twin orchestration + LLM dispatch      │  │
│  │ CONTINUITY     5-phase lifecycle + memory consolidation  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             ↓                                   │
│  ┌─ GOVERNANCE (S9-S10) ───────────────────────────────────┐  │
│  │ GOVERN         Approval gate (no execution authority)    │  │
│  │ WORKFLOW       Async execution orchestration             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             ↓                                   │
│  ┌─ MEMORY & KNOWLEDGE (S11-S12) ──────────────────────────┐  │
│  │ KNOWLEDGE      Semantic search + vector embeddings       │  │
│  │ HERMES         Memory operations + lifecycle             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ ACCESS & ROUTING ───────────────────────────────────────┐ │
│  │ GATEWAY        Public ingress, auth, routing             │ │
│  │ TENANTS        Tenant provisioning + isolation           │ │
│  │ ADMIN          Internal operations                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ INTEGRATIONS & SUPPORT ─────────────────────────────────┐ │
│  │ MCP-CONNECTOR       External AI access to Spine          │ │
│  │ WEBHOOK-INGRESS     Secure webhook receivers             │ │
│  │ BILLING             Usage tracking + SaaS                │ │
│  │ TELEMETRY           Observability + monitoring           │ │
│  │ FOLDER-WATCHER      Local file monitoring                │ │
│  │ [11+ other workers] ACT, Hermes, Govern, etc            │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

┌─ PACKAGES (Shared Libraries) ─────────────────────────────────┐
│  ├─ types/             Canonical schemas + type definitions    │
│  ├─ db/                Database client abstractions            │
│  ├─ api/               HTTP client utilities                   │
│  ├─ connector-contracts Integration contracts                  │
│  ├─ rbac/              Role-based access control               │
│  ├─ tenancy/           Multi-tenant utilities                  │
│  ├─ hermes-spine-memory Memory operations library             │
│  └─ [3+ other packages]                                        │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Architecture

```
┌───────────────────────────────────────────────────────────────┐
│              DATA FLOW: INGEST → NORMALIZE → SPINE            │
└───────────────────────────────────────────────────────────────┘

EXTERNAL TOOLS (HubSpot, Salesforce, Slack, Jira, etc.)
    │
    ├─ Push: Webhooks → WEBHOOK-INGRESS → LOADER
    └─ Pull: Scheduled → CONNECTOR-SYNC → LOADER
                 │
                 ↓
    ┌─────────────────────────────────────────────┐
    │  LOADER (S1)                                 │
    │  • Receives raw events                       │
    │  • No transformation                         │
    │  • Tracks provenance (source, timestamp)     │
    │  • Enqueues to NORMALIZER                    │
    └─────────────────────────────────────────────┘
                 │
                 ↓
    ┌─────────────────────────────────────────────┐
    │  NORMALIZER (S2-S4)  8-Stage Pipeline        │
    │  1. Intake: Deserialize                      │
    │  2. Classification: Identify entity type     │
    │  3. Entity Resolution: LLM → canonical ID    │
    │  4. Field Mapping: LLM → canonical schema    │
    │  5. Validation: Schema compliance            │
    │  6. Enrichment: LLM → missing fields         │
    │  7. Deduplication: Check if exists           │
    │  8. Emission: Output as MCP call             │
    │                                              │
    │  Cost Model: LLM paid ONCE per entity       │
    └─────────────────────────────────────────────┘
                 │
                 ↓
    ┌─────────────────────────────────────────────┐
    │  PIPELINE (S4)                               │
    │  • Consumes normalized MCP calls             │
    │  • Resolves entity to canonical ID           │
    │  • Writes to D1 domain partitions            │
    │  • Builds relationship graph                 │
    │  • Triggers INTELLIGENCE (signal analysis)   │
    │  • Enqueues to CONTINUITY                    │
    └─────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────────────────────────┐
    │                                              │
    ↓                                              ↓
┌──────────────────────┐        ┌─────────────────────────────┐
│  D1 (Hot, Edge)      │        │  Supabase Fortress (SSOT)   │
│  • person_data       │◄──────►│  • Canonical entities       │
│  • account_data      │        │  • Audit logs               │
│  • opportunity_data  │        │  • Memory tables            │
│  • signal_cache      │        │  • RLS policies             │
│  • continuity_graph  │        │  • Billing logs             │
│  • execution_queue   │        └─────────────────────────────┘
│  • [9 domain parts]  │
└──────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────────┐
    │  INTELLIGENCE (S5)                           │
    │  • Analyzes entity changes                   │
    │  • Detects anomalies                         │
    │  • Generates signals + confidence            │
    │  • Emits to L2 Cognitive Overlay             │
    └─────────────────────────────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────────┐
    │  CONTINUITY (S7)                             │
    │  • Implements 5-phase lifecycle              │
    │  • Triages signals (via TriageBot MCP)       │
    │  • Promotes to active memory                 │
    │  • Ages out stale signals                    │
    │  • Compounds outcomes (human+AI)             │
    └─────────────────────────────────────────────┘
         │
         ↓
    Frontend (L1-L4 Workbenches) ← Spine queries
```

---

## 4. Request Flow Through Gateway

```
┌──────────────────────────────────────────────────────────────┐
│            REQUEST FLOW: PUBLIC → GATEWAY → WORKER            │
└──────────────────────────────────────────────────────────────┘

INTERNET (Public Users, External AIs, MCP Clients)
    │
    ↓
┌────────────────────────────────────────────────────────────┐
│  GATEWAY (S0)                                               │
│  • SSL/TLS termination                                     │
│  • Request authentication (Supabase auth)                   │
│  • Route authorization (RBAC check)                         │
│  • Request routing to downstream workers                    │
│  • Rate limiting + DDoS protection                          │
│  • Logging + telemetry                                      │
│                                                             │
│  KEY INVARIANT: This is the ONLY public entry point        │
└────────────────────────────────────────────────────────────┘
    │
    ├─ Authenticated ← Gateway verifies JWT token
    │       │
    │       ├─ Route: /api/spine/... → PIPELINE (read Spine)
    │       ├─ Route: /api/twin/...  → IW-AGENT-RUNTIME
    │       ├─ Route: /api/signals/..→ INTELLIGENCE
    │       ├─ Route: /api/memory/... → KNOWLEDGE
    │       ├─ Route: /api/govern/... → GOVERN
    │       ├─ Route: /mcp/tools/...  → MCP-CONNECTOR
    │       └─ Route: /webhooks/...   → WEBHOOK-INGRESS
    │
    └─ Unauthenticated ← No token or invalid
            │
            ├─ Route: /auth/signup    → Supabase Auth (new user)
            ├─ Route: /auth/login     → Supabase Auth (sign in)
            └─ Route: /public-demo    → Demo page (no auth)

┌────────────────────────────────────────────────────────────┐
│  Zero-Trust Internal Routing                               │
│                                                             │
│  All downstream workers communicate via Cloudflare        │
│  Service Bindings (internal, not exposed to internet)      │
│                                                             │
│  NORMALIZER → PIPELINE → INTELLIGENCE ↔ CONTINUITY         │
│             ↔ IW-AGENT-RUNTIME → GOVERN → WORKFLOW        │
│                                 ↔ KNOWLEDGE                │
│                                                             │
│  No worker is directly accessible from the public internet.│
└────────────────────────────────────────────────────────────┘
```

---

## 5. Frontend Layer Architecture

```
┌──────────────────────────────────────────────────────────────┐
│           FRONTEND: Next.js 16 Layered UI                     │
└──────────────────────────────────────────────────────────────┘

USER INTERACTS WITH SINGLE APP
            │
            ├─ LAYER SWITCHER (Sidebar)
            │  ├─ 🔵 Human (L1) - Your decisions & outcomes
            │  ├─ 🟣 AI (L3) - Twin reasoning & proposals
            │  ├─ 🟨 Collaborate (L2) - Joint approvals & memory
            │  └─ 🟢 Approve (L4) - Governance & audit
            │
            ├─ DATA PROJECTION CHANGES (No page reload)
            │
            └─ USER SEES DIFFERENT DATA LENS
                     │
        ┌────────────┼────────────┬────────────┬────────────┐
        │            │            │            │            │
        ↓            ↓            ↓            ↓            ↓
    HUMAN L1      AI L3       COLLAB L2    GOVERN L4    MEMORY L4
    ┌───────┐   ┌──────┐    ┌────────┐  ┌─────────┐  ┌──────────┐
    │Workbench  │Twin Chat  │Approval │ │Governance│ │Memory    │
    │(domain)   │(reasoning)│Center   │ │Dashboard │ │Search    │
    │Goals      │Proposals  │Decisions│ │Audit Log │ │Documents │
    │Entities   │Context    │Outcomes │ │RLS Check │ │Sessions  │
    │Timeline   │Evidence   │Feedback │ │Settings  │ │Entities  │
    │Signals    │Traces     │Credits  │ │Compliance│ │History   │
    └───────┘   └──────┘    └────────┘  └─────────┘  └──────────┘
        │           │           │           │           │
        └───────────┴───────────┴───────────┴───────────┘
                    │
                    ↓
        All query same SPINE backend
        But see different projections
        Based on layer context
```

---

## 6. Approval & Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│          GOVERNANCE & EXECUTION: HITL → Approval → Action   │
└─────────────────────────────────────────────────────────────┘

USER (L1)                  AI (L3)                  SYSTEM
   │                          │                         │
   ├─ Creates goal            │                         │
   │   (or task)              │                         │
   │                          │                         │
   └──────────────────────┬───────────────────────────┬─│
                          │                           │ │
                          ├─ THINK analyzes goal      │ │
                          │                           │ │
                          ├─ IW-AGENT-RUNTIME        │ │
                          │  generates proposal       │ │
                          │  (actions, mutations,     │ │
                          │   success criteria)       │ │
                          │                           │ │
                          └─ Enqueues to GOVERN       │ │
                                                      ↓ │
                    ┌─────────────────────────────────────────┐
                    │  GOVERN (S9) - Approval Gate           │
                    │  Status: PENDING_REVIEW                │
                    │  Waits for human approval               │
                    │  (No execution authority)               │
                    └─────────────────────────────────────────┘
                                 │
                    Human reviews │
                    proposal in   │
                    L4 Approval   │
                    Center        │
                                 │
                    ┌────────────┴───────────┐
                    │                        │
                ✅ APPROVE              ❌ REJECT
                    │                        │
                    ↓                        ↓
            ┌──────────────┐         ┌────────────┐
            │ Status:      │         │ Status:    │
            │ APPROVED     │         │ REJECTED   │
            │              │         │            │
            │ Logged in    │         │ Reason     │
            │ governance_  │         │ recorded   │
            │ audit_log    │         │            │
            └──────────────┘         │ Proposal   │
                    │                │ archived   │
                    ↓                └────────────┘
            ┌──────────────────┐
            │ WORKFLOW (S10)    │
            │ Async execution   │
            │ orchestration     │
            │                   │
            │ • Resolves target │
            │ • Prepares        │
            │   handoff (JSON)  │
            │ • Stages in queue │
            │ • Tracks state    │
            └──────────────────┘
                    │
                    ├─ Local execution (user runs playbook)
                    ├─ Slack action (send message)
                    ├─ HubSpot update (create contact)
                    ├─ Email (send notification)
                    └─ Custom adapter (user's tool)
                    │
                    ↓
            ┌──────────────────┐
            │ Execution        │
            │ feedback sent    │
            │ back to system   │
            │ as signals       │
            └──────────────────┘
                    │
                    ↓
            Signals → INTELLIGENCE
            → CONTINUITY → MEMORY
            → Next cycle learning
```

---

## 7. Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              DEPLOYMENT: Multi-Environment                    │
└──────────────────────────────────────────────────────────────┘

DEV (Localhost)                TEST (Staging)              PROD (Live)
──────────────               ──────────────                ──────────
pnpm dev                     staging.                      app.
localhost:3333               integratewise.ai              integratewise.ai
│                            │                            │
├─ Local D1 mock             ├─ Cloudflare D1              ├─ Cloudflare D1
├─ Local Supabase            ├─ Supabase                   ├─ Supabase
├─ localhost:5432            │  (staging DB)               │  Fortress (SSOT)
│  PostgreSQL                │                            │
└─ Hot reload                ├─ All 28 workers            ├─ All 28 workers
   enabled                   │  deployed                  │  deployed
                             │                            │
                             ├─ Vercel preview            ├─ Vercel prod
                             │  (frontend)                │  (frontend)
                             │                            │
                             └─ Smoke tests run           └─ Monitoring:
                                                            - Sentry
                                                            - Grafana
                                                            - CF Analytics

           ┌─────────────────────────────────────────────┐
           │ Deployment Pipeline                         │
           │                                             │
           │ 1. Git push to branch                       │
           │ 2. GitHub Actions runs tests                │
           │ 3. pnpm preflight (install, lint, build)   │
           │ 4. Deploy to staging (CF Workers)           │
           │ 5. Smoke tests run                          │
           │ 6. PR ready for review                      │
           │ 7. Merge to main                            │
           │ 8. Auto-deploy to production                │
           │ 9. Monitor error rates (Sentry)             │
           │ 10. Monitor latency (Grafana)               │
           └─────────────────────────────────────────────┘
```

---

## 8. Multi-Tenancy & Isolation

```
┌──────────────────────────────────────────────────────────────┐
│         MULTI-TENANCY: Per-Tenant Isolation                  │
└──────────────────────────────────────────────────────────────┘

INTEGRATEWISE SYSTEM
    │
    ├─ Tenant A (Acme Corp)
    │  │
    │  ├─ D1 partitions
    │  │  ├─ person_data (ACL: acme corp only)
    │  │  ├─ account_data
    │  │  ├─ opportunity_data
    │  │  └─ [domain partitions]
    │  │
    │  ├─ Supabase RLS policies
    │  │  ├─ tenant_id = 'acme-corp'
    │  │  ├─ All queries filtered
    │  │  └─ No cross-tenant access
    │  │
    │  ├─ Memory
    │  │  ├─ org_memory (Acme Corp level)
    │  │  ├─ personal_memory (User Alice)
    │  │  └─ conversational_memory (Twin sessions)
    │  │
    │  ├─ RBAC rules
    │  │  ├─ Alice: admin
    │  │  ├─ Bob: analyst
    │  │  └─ Charlie: viewer
    │  │
    │  └─ All 28 services scope to tenant_id
    │
    ├─ Tenant B (BigTech Inc)
    │  │
    │  ├─ D1 partitions
    │  │  ├─ person_data (BTI: bigtechinc.com only)
    │  │  ├─ account_data
    │  │  ├─ opportunity_data
    │  │  └─ [domain partitions]
    │  │
    │  ├─ Supabase RLS policies
    │  │  ├─ tenant_id = 'bigtechinc'
    │  │  ├─ All queries filtered
    │  │  └─ No cross-tenant access
    │  │
    │  ├─ Memory
    │  │  ├─ org_memory (BigTech Inc level)
    │  │  ├─ personal_memory (User Diana)
    │  │  └─ conversational_memory (Twin sessions)
    │  │
    │  ├─ RBAC rules
    │  │  ├─ Diana: admin
    │  │  └─ Eve: analyst
    │  │
    │  └─ All 28 services scope to tenant_id
    │
    └─ [100+ more tenants] ← Independent, never mixed

KEY INVARIANT: Every query includes tenant_id scoping
               At database layer (RLS)
               At worker layer (scoped queries)
               At API layer (user auth → tenant)
               No data leakage between tenants
```

---

## 9. Observability & Monitoring

```
┌──────────────────────────────────────────────────────────────┐
│          OBSERVABILITY: Cloud-First Audit Trail              │
└──────────────────────────────────────────────────────────────┘

ALL 28 WORKERS emit to
    │
    ├─ D1 Tables
    │  ├─ audit_logs (all actions)
    │  ├─ governance_audit_log (approvals)
    │  ├─ spine_audit_log (entity writes)
    │  └─ webhook_deliveries (webhook status)
    │
    ├─ Supabase
    │  ├─ usage_logs (API usage)
    │  ├─ billing_events (charges)
    │  └─ support_tickets (customer issues)
    │
    ├─ Sentry (Errors)
    │  ├─ 5xx errors
    │  ├─ 4xx errors
    │  ├─ LLM failures
    │  └─ Database timeouts
    │
    ├─ Grafana (Metrics)
    │  ├─ P95 latency per worker
    │  ├─ Error rates
    │  ├─ Memory usage
    │  ├─ Database query time
    │  └─ Worker CPU/memory
    │
    ├─ Cloudflare Analytics
    │  ├─ Requests/sec
    │  ├─ Cache hit ratio
    │  ├─ Worker performance
    │  └─ DDoS events
    │
    └─ Custom Telemetry
       ├─ LLM cost tracking
       ├─ Vector search latency
       ├─ Continuity lifecycle duration
       └─ Approval SLA (target: <1min)

NO LOCAL LOGGING
Every action logged to cloud (100% audit trail)
```

---

This document provides visual representation of the complete IntegrateWise system architecture across all dimensions (data flow, services, frontend, multi-tenancy, monitoring).
