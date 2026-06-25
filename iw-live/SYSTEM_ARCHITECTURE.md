# IntegrateWise System Architecture

**Status:** Production v3.8.0  
**Last Updated:** June 25, 2026  
**Authority:** Nirmal Prince J (Founder/CEO) + Engineering Team  

---

## I. EXECUTIVE OVERVIEW

IntegrateWise is a **unified intelligence operating system** that connects fragmented enterprise tools into one coherent, governed, reasoning workspace. The system has three core layers:

1. **User Facing (L1-L4):** Domain workbenches, cognitive overlays, twin reasoning, and memory management
2. **Intelligence Engine (Backend):** 28 Cloudflare Workers orchestrating data ingestion, normalization, analysis, governance, and execution
3. **Data Foundation (Spine):** Normalized canonical entities, relationships, signals, and organizational memory

**Core Axiom:** One Spine. Many projections. The Spine is the source of truth; every surface is a view of it.

---

## II. MONOREPO STRUCTURE

```
integratewise/
├── apps/                          # User-facing applications
│   ├── web/                       # Next.js 16 SPA (auth, workbenches, onboarding)
│   ├── desktop/                   # Electron desktop app
│   ├── mobile/                    # React Native mobile
│   └── local-monitor/             # Local folder watcher
│
├── services/                      # Cloudflare Workers (28 total)
│   ├── gateway/                   # Public ingress, routing, auth
│   ├── connector/                 # External tool integrations
│   ├── connector-sync/            # Scheduled syncs + webhooks
│   ├── loader/                    # Universal intake membrane (MCP-native)
│   ├── normalizer/                # 8-stage LLM-in-the-loop pipeline
│   ├── pipeline/                  # Entity resolution + Spine writes
│   ├── continuity/                # Memory consolidation + lifecycle
│   ├── intelligence/              # Signal analysis + insights
│   ├── think/                     # Synchronous reasoning service
│   ├── iw-agent-runtime/          # Twin orchestration + LLM dispatch
│   ├── knowledge/                 # Semantic search + embeddings
│   ├── govern/                    # Approval gate + governance
│   ├── admin/                     # Internal operations
│   ├── billing/                   # Usage tracking + SaaS management
│   ├── tenants/                   # Tenant provisioning + isolation
│   ├── workflow/                  # Async execution orchestration
│   └── [15+ other workers]        # Hermes, Telemetry, ACT, MCP, etc.
│
├── packages/                      # Shared libraries
│   ├── types/                     # Canonical schemas + type definitions
│   ├── db/                        # Database client abstractions
│   ├── api/                       # HTTP client utilities
│   ├── connector-contracts/       # Integration contracts
│   ├── connector-utils/           # Shared connector logic
│   ├── hermes-spine-memory/       # Memory operations library
│   ├── rbac/                      # Role-based access control
│   ├── tenancy/                   # Multi-tenant utilities
│   ├── lib/                       # General utilities
│   └── [8+ other packages]
│
├── docs/                          # Comprehensive documentation
│   ├── architecture/              # Canonical design docs
│   ├── tech/                      # Technical specifications
│   ├── operations/                # Deployment + monitoring
│   └── migrations/                # Database schemas
│
├── scripts/                       # Deployment + ops scripts
├── configs/                       # Shared configuration
├── migrations/                    # Database migrations
└── pnpm-workspace.yaml            # Monorepo workspace config
```

**Package Manager:** pnpm v9.0.0  
**Build Tool:** Turbo (2.0.0) — orchestrates 28 services + apps in parallel  
**Node Overseer:** Next.js 16 app router for web frontend  

---

## III. THE THREE-SPINE ARCHITECTURE

IntegrateWise implements a unique **three-spine lifecycle** where all signals (human decisions, AI reasoning, and joint approvals) flow through a unified state machine:

### A. Human Spine (L1 - Ground Truth)

**Purpose:** Record human goals, decisions, and outcomes as canonical ground truth.

**Data Storage:** D1/Supabase SPINE table  
**Lifecycle Flow:** INTAKE → PROMOTION → MEMORY → DECAY → CONTINUITY

**Example:** User creates quarterly revenue goal → validated → stored in MEMORY phase → triggers continuity compounding

**Key Entities:**
- Goals
- Outcomes  
- Decisions
- Approvals

---

### B. AI Spine (L3 - Intelligence Layer)

**Purpose:** Generate reasoning traces, proposals, and signals with confidence scores.

**Data Storage:** D1/Supabase AI_SPINE table  
**Lifecycle Flow:** Same as Human Spine (INTAKE through CONTINUITY)

**Example:** Twin analyzes customer churn signal → generates proposal → reasoning trace stored → confidence scored

**Key Entities:**
- REASONING_TRACE: Chain-of-thought + evidence
- PROPOSAL: Recommended actions with success criteria
- SIGNAL: Pattern detection + anomalies
- CONFIDENCE: Probability/reliability metrics

---

### C. Collaboration Spine (L2 - Joint Decision Making)

**Purpose:** Record approvals, feedback, and compounded outcomes from human-AI collaboration.

**Data Storage:** D1/Supabase COLLABORATION_SPINE table  
**Lifecycle Flow:** Same as Human Spine (INTAKE through CONTINUITY)

**Example:** Human approves AI proposal → joint outcome recorded → memory compounds for next cycle

**Key Entities:**
- APPROVAL: Human approval decisions
- FEEDBACK: Human course corrections
- COMPOUND_OUTCOME: Joint decision + outcome
- COLLABORATION_TRACE: Interaction history

---

### D. Unified Lifecycle (All Three Spines)

```
INTAKE
  ↓ (Signal enters the system)
PROMOTION
  ↓ (Validates, resolves, ready to act)
MEMORY
  ↓ (Stored as ground truth)
DECAY
  ↓ (Aged signals archived)
CONTINUITY
  ↓ (Outcome stored in continuity graph for future learning)
```

**Every signal** (human, AI, or collaborative) flows through these five phases. The system guarantees:
- No action without approval (governance gate)
- Full audit trail (all phases logged)
- Learning loop (outcomes feed back into system memory)
- Tenant isolation (all operations scoped to `tenant_id`)

---

## IV. BACKEND SERVICES ARCHITECTURE (28 Workers)

### 4.1 Data Ingestion Pipeline (S1-S4)

#### LOADER (`services/loader/`)
- **Purpose:** Universal intake membrane for all connected tools
- **Protocol:** MCP-native (Model Context Protocol)
- **Responsibility:**
  - Receives webhooks from HubSpot, Salesforce, Slack, etc.
  - Enqueues raw events **without transformation**
  - Tracks provenance (source system, timestamp, version)
  - Routes to normalizer queue
- **Database:** D1 `loader_events` table
- **Key Invariant:** Never reasons. Just intake + provenance.

#### CONNECTOR (`services/connector/`) + CONNECTOR-SYNC (`services/connector-sync/`)
- **Purpose:** Tool integration and scheduled polling
- **Responsibility:**
  - OAuth/API auth to external systems
  - Webhook receiver for push-based integrations
  - Scheduled polling for pull-based integrations
  - Rate limiting + retry logic
- **Supported Tools:** HubSpot, Salesforce, Slack, Gmail, Jira, Linear, Notion, Zendesk, Stripe, etc.
- **Output:** Enqueued raw events to NORMALIZER

#### NORMALIZER (`services/normalizer/`)
- **Purpose:** 8-stage LLM-in-the-loop cognitive pipeline
- **Stages:**
  1. **Intake:** Deserialize raw event
  2. **Classification:** Identify entity type (Contact, Account, Opportunity, etc.)
  3. **Entity Resolution:** LLM stage — match to canonical ID
  4. **Field Mapping:** LLM stage — map tool fields to canonical schema
  5. **Validation:** Check schema compliance
  6. **Enrichment:** LLM stage — detect missing fields, suggest defaults
  7. **Deduplication:** Check if entity already exists
  8. **Emission:** Output as MCP tool call (not JSON)
- **Cost Model:** LLM inference paid **once per entity**, not per tool instance
- **Database:** D1 `normalized_events` table
- **Output:** Enqueued normalized MCP calls to PIPELINE

#### PIPELINE (`services/pipeline/`)
- **Purpose:** Entity resolution, Spine writes, relationship building
- **Responsibility:**
  - Consumes normalized MCP calls
  - Resolves entity to canonical ID (creates new if needed)
  - Writes to D1 domain partitions (`person_data`, `account_data`, etc.)
  - Builds relationship graph
  - Triggers signal analysis
  - Enqueues to CONTINUITY for memory consolidation
- **Database:** D1 (domain partitions) + Supabase Fortress (SSOT)
- **Key Invariant:** All Spine writes proxied through pipeline. Downstream workers cannot write directly.

---

### 4.2 Intelligence & Reasoning (S5-S8)

#### INTELLIGENCE (`services/intelligence/`)
- **Purpose:** Signal analysis, anomaly detection, insights
- **Responsibility:**
  - Analyzes entity changes
  - Detects anomalies (churn risk, opportunity patterns, etc.)
  - Generates signals with confidence scores
  - Enriches with historical context
  - Emits to L2 Cognitive Overlay
- **Storage:** D1 `signal_cache` + AI Search (vector embeddings)
- **Output:** Signals → Cognitive Overlay, Triage Inbox

#### THINK (`services/think/`)
- **Purpose:** Synchronous reasoning endpoint for L2/L3 surfaces
- **Responsibility:**
  - Receives reasoning requests from Twin or Cognitive Overlay
  - Calls LLM with assembled context (Entity 360, signals, memory)
  - Returns chain-of-thought + confidence
  - No execution authority
- **Database:** Reads from Spine, no writes
- **Output:** Reasoning trace → Twin interface

#### IW-AGENT-RUNTIME (`services/iw-agent-runtime/`)
- **Purpose:** Twin orchestration and LLM dispatch
- **Responsibility:**
  - Manages conversational state
  - Assembles context from Spine for each turn
  - Calls LLM (Claude, GPT, etc. via CF AI Gateway)
  - Generates structured proposals
  - No execution authority; pushes proposals to GOVERN
- **Database:** D1 `twin_sessions`, `ai_conversations`
- **Output:** Proposals → Governance queue

#### CONTINUITY (`services/continuity/`)
- **Purpose:** Memory consolidation and lifecycle management
- **Responsibility:**
  - Implements 5-phase lifecycle (INTAKE → PROMOTION → MEMORY → DECAY → CONTINUITY)
  - Triages signals (TriageBot MCP decision)
  - Promotes signals to active memory
  - Ages out stale signals
  - Compounds outcomes (human + AI collaborations)
  - Maintains org_memory, personal_memory, conversational_memory
- **Storage:** D1 `continuity_graph` + Supabase memory tables
- **Output:** Compounded outcomes → Intelligence, Twin context

---

### 4.3 Governance & Execution (S9-S10)

#### GOVERN (`services/govern/`)
- **Purpose:** Approval gate and governance
- **Responsibility:**
  - Receives proposals from Twin, Think, Workflow
  - Routes to approver (human or policy-based)
  - Logs approval decision
  - Marks proposal as `APPROVED` or `REJECTED`
  - **Never executes** — hands off to Workflow
- **Database:** D1 `governance_queue`, `approval_logs`
- **Output:** Approved proposals → Workflow executor

#### WORKFLOW (`services/workflow/`)
- **Purpose:** Async execution orchestration
- **Responsibility:**
  - Receives approved proposals from GOVERN
  - Resolves execution target (Slack, HubSpot, Gmail, etc.)
  - Prepares handoff (canonical JSON contract)
  - Stages in execution queue
  - Tracks execution state
  - Receives execution feedback (via signals)
- **Database:** D1 `execution_queue`, `execution_state`
- **Output:** Handoff contracts → client execution or adapter dispatch

---

### 4.4 Memory & Knowledge (S11-S12 equivalent)

#### KNOWLEDGE (`services/knowledge/`)
- **Purpose:** Semantic search and retrieval augmented generation
- **Responsibility:**
  - Maintains vector embeddings of Spine entities
  - Powers full-text + semantic search
  - Retrieves context for Twin + Think
  - Ingests documents, conversation history
- **Storage:** CF AI Search (vector DB)
- **Output:** Search results → Twin context, L2 Cognitive Overlay

#### HERMES (via `packages/hermes-spine-memory/`)
- **Purpose:** Memory operations and recall
- **Responsibility:**
  - Exposes org_memory, personal_memory APIs
  - Manages memory lifecycle
  - Handles memory eviction + decay
  - Integrates with Continuity
- **Storage:** D1 memory tables + Supabase
- **Output:** Memory objects → Twin, Intelligence, Think

---

### 4.5 Access & Gateway (S0 - Ingress)

#### GATEWAY (`services/gateway/`)
- **Purpose:** Single public ingress, auth, routing
- **Responsibility:**
  - SSL/TLS termination
  - Request authentication (Supabase auth)
  - Route authorization (RBAC from `@integratewise/rbac`)
  - Request routing to downstream workers
  - Rate limiting + DDoS protection
  - Logging + telemetry
- **Storage:** Reads RBAC tables
- **Key Invariant:** All traffic enters via Gateway. No worker is exposed to the public internet.

#### TENANTS (`services/tenants/`)
- **Purpose:** Tenant provisioning and isolation
- **Responsibility:**
  - Provisions new tenant (workspace)
  - Initializes D1 partitions, Supabase schemas
  - Sets up initial RBAC rules
  - Manages domain assignments
  - Enforces row-level security (RLS)
- **Database:** D1 `tenants` table + Supabase `tenant_isolation` policies
- **Output:** Tenant configs → all workers

#### ADMIN (`services/admin/`)
- **Purpose:** Internal operations interface
- **Responsibility:**
  - Tenant management
  - User management
  - Config overrides
  - Manual signal injection (for testing)
  - Emergency governance bypasses (audit-logged)
- **Access:** Internal only, never exposed
- **Output:** Admin commands → pipeline/governance

---

### 4.6 Integrations & Adapters

#### MCP-CONNECTOR (`services/mcp-connector/`)
- **Purpose:** Model Context Protocol for external AI tools
- **Responsibility:**
  - Exposes Spine as MCP tools (read-only for ChatGPT, Claude, etc.)
  - Allows external AIs to query Spine
  - Tracks external AI actions (audit trail)
  - Returns paginated, tenant-filtered results
- **Output:** MCP tools → ChatGPT, Claude, Perplexity, OpenRouter

#### WEBHOOK-INGRESS (`services/webhook-ingress/`)
- **Purpose:** Secure webhook receivers for all connectors
- **Responsibility:**
  - HMAC verification of webhook signatures
  - Enqueues events to Loader
  - Retry logic with exponential backoff
  - Webhook delivery status tracking
- **Database:** D1 `webhook_deliveries`

---

### 4.7 Operations & Support

#### BILLING (`services/billing/`)
- **Purpose:** Usage tracking and SaaS management
- **Responsibility:**
  - Tracks API calls, workers invoked, storage used
  - Computes monthly usage + billing
  - Manages subscription plans
  - Enforces usage limits
- **Database:** Supabase `usage_logs`, `subscriptions`

#### TELEMETRY (`services/telemetry/`)
- **Purpose:** Observability and monitoring
- **Responsibility:**
  - Collects performance metrics
  - Logs errors to Sentry
  - Tracks service health
  - Emits to monitoring dashboard
- **Output:** Grafana dashboards, Sentry alerts

#### FOLDER-WATCHER (`services/folder-watcher/`)
- **Purpose:** Local filesystem monitoring
- **Responsibility:**
  - Monitors local folders for new files
  - Sends file metadata to Loader
  - Triggers document indexing
- **Integration:** `apps/local-monitor` (Node.js app)

---

## V. FRONTEND ARCHITECTURE (Next.js 16)

### 5.1 Application Structure

```
apps/web/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout + providers
│   ├── page.tsx                   # Home/login
│   ├── onboarding/                # Onboarding flow
│   ├── workspace/                 # Main authenticated workspace
│   │   ├── layout.tsx             # Workspace shell
│   │   ├── [domain]/              # Domain-scoped workbench
│   │   ├── settings/              # User settings
│   │   └── memory/                # Memory + search
│   ├── twin/                      # Twin chat interface
│   ├── api/                       # API routes
│   │   ├── auth/                  # Authentication
│   │   ├── spine/                 # Spine queries
│   │   └── sync/                  # Data sync
│   └── public-demo/               # Public demo (no auth)
│
├── components/                    # React components
│   ├── workbench/                 # Domain-specific workbenches
│   ├── twin/                      # Twin reasoning UI
│   ├── cognitive-overlay/         # L2 signals + insights
│   ├── domain-sidebar/            # Layer switcher (L1-L4)
│   ├── entities/                  # Entity 360 views
│   ├── approval/                  # Approval center
│   └── ui/                        # shadcn/ui components
│
├── lib/
│   ├── spine/                     # Spine API client
│   ├── supabase/                  # Supabase client + auth
│   ├── twin/                      # Twin client
│   ├── types/                     # Frontend types
│   └── hooks/                     # Custom React hooks
│
├── middleware.ts                  # Supabase auth middleware
├── vercel.json                    # Vercel config (Next.js)
└── package.json
```

### 5.2 Layer Switcher (Sidebar Navigation)

The **Layer Switcher** is the core navigation metaphor. Four buttons in the sidebar allow users to switch between spines:

1. **Human (Blue)** - L1: Personal goals and decisions
2. **AI (Purple)** - L3: Twin reasoning and proposals
3. **Collaborate (Amber)** - L2: Joint approvals and memory
4. **Approve (Green)** - L4: Governance and audit

**All four layers exist in the same app.** Switching between them changes the data projection without a page reload.

### 5.3 Domain Sidebar

Workbenches are scoped by **domain** (Customer Success, Sales, Marketing, etc.). The domain sidebar includes:

- Active domain indicator
- Domain switcher (if user has multiple domains)
- Spine layer selector (Human/AI/Collaborate/Approve)
- Quick actions (create goal, search, settings)
- Integration status

### 5.4 Key Surfaces

| Surface | Purpose | Data Source | Interaction |
|---------|---------|-------------|-------------|
| **L1 Workbench** | Primary operational interface | Spine (domain partition) | Read/create goals, view entities |
| **L2 Cognitive Overlay** | Intelligence layer (`⌘J`) | Intelligence service signals | Read-only, promote to proposal |
| **L3 Twin Chat** | Reasoning and planning | IW-Agent-Runtime | Chat, ask Twin, get proposals |
| **L4 Memory** | Search + documents | Knowledge service + Hermes | Full-text + semantic search |
| **Approval Center** | Governance | GOVERN service queue | Review, approve, reject proposals |
| **Public Demo** | Non-authenticated demo | Hard-coded sample data | Read-only visualization |

---

## VI. DATA LAYER ARCHITECTURE

### 6.1 Dual Storage Strategy

**D1 (Edge, Hot):**
- Domain partitions (`person_data`, `account_data`, `opportunity_data`, etc.)
- Signal cache
- Twin sessions
- Execution queue
- Continuity graph

**Supabase Fortress (SSOT, Authoritative):**
- Source of truth for all entities
- Audit logs
- Memory tables (org_memory, personal_memory)
- Billing + usage logs
- Row-level security (RLS) for multi-tenancy

### 6.2 Spine Entity Model

**Canonical Entity Types:** 18 core types resolved from any tool

```
PERSON, ACCOUNT, OPPORTUNITY, TICKET, ACTIVITY,
MESSAGE, DOCUMENT, GOAL, WORKFLOW, SIGNAL,
DECISION, APPROVAL, EXECUTION, OUTCOME,
ORGANIZATION, TEAM, RESOURCE, CUSTOM
```

**Canonical Traits:** 18 core attributes common across all entities

```
external_id, name, email, phone, status, owner_id,
created_at, updated_at, source_system, confidence,
tags, custom_fields, relationships, signals
```

**Domain Partitions:** 12 logical domains, each with entity-specific tables

```
CUSTOMER_SUCCESS: person, account, ticket, health_score
SALES: opportunity, activity, deal_stage, forecast
MARKETING: campaign, contact, engagement, lead_score
REVOPS: forecast, quota, territory, pipeline
FINANCE: invoice, expense, budget, forecast
[8+ more]
```

### 6.3 Relationships & Entity 360

**Relationship Graph:**
- Stores: `person` ← works-for → `account`, `person` ← owns → `opportunity`, etc.
- Assembled on read from Spine (no materialized `relationships` table; expensive reads are cached in KV)
- Enables Entity 360: Single view of a person across all connected systems

---

## VII. DEPLOYMENT & OPERATIONS

### 7.1 Environments

```
dev  → localhost (pnpm dev)
test → staging.integratewise.ai (pre-production)
prod → app.integratewise.ai (live)
```

### 7.2 Deployment Targets

**Cloudflare Workers:**
- Deploy with `pnpm deploy:prod` (all 28 workers)
- Staging: `pnpm deploy:test`
- Each worker has own `wrangler.toml`

**Next.js Frontend:**
- Deployed to Vercel (automatic on Git push to main)
- Environment variables via Vercel dashboard
- Staging branch → staging-web.integratewise.ai

**Database:**
- D1: Cloudflare-managed SQLite (auto-replicated)
- Supabase: Direct SQL + managed auth

### 7.3 Monitoring & Alerts

**Observability Stack:**
- Sentry (error tracking)
- Grafana (metrics)
- Cloudflare Analytics
- Custom telemetry service

**Key Metrics:**
- P95 latency per worker
- Error rate (5xx, 4xx)
- Database query time
- Memory usage (continuity lifecycle)
- Approval SLA (target: <1min human review time)

---

## VIII. SECURITY MODEL

### 8.1 Authentication & Authorization

**Auth Layer:** Supabase Auth (email + password, OAuth via Google/GitHub)  
**Session Management:** JWT tokens stored in secure httpOnly cookies  
**RBAC:** Role-based access control per tenant + domain  
**MFA:** Optional per organization (SSO for enterprise)

### 8.2 Data Isolation

**Row-Level Security (RLS):** Supabase enforces `tenant_id` filtering at DB layer  
**Worker Bindings:** Zero-trust internal routing; no worker exposed to public  
**Encryption:** TLS in transit, at-rest encryption for sensitive data (vault)  
**Audit Trail:** Every action logged (actor, timestamp, approval status, outcome)

### 8.3 Third-Party Integration Security

**OAuth Tokens:** Stored encrypted in Supabase, never transmitted to client  
**Webhook HMAC:** All webhooks verified with provider signatures  
**Rate Limiting:** Per-tenant + per-tool rate limits enforced at Gateway  
**Secrets Management:** Doppler for env vars, Cloudflare Workers Secrets for service credentials

---

## IX. OBSERVABILITY & LOGGING

### 9.1 Logging Strategy

**No local logging.** 100% cloud audit trail:

- **Direct writes:** Workers write to D1 + Supabase
- **Queue-mediated:** Normalizer, Pipeline, Continuity enqueue → process → commit
- **Audit logs:** `audit_logs` table (actor, action, timestamp, result)
- **Governance logs:** `governance_audit_log` (approval chain)
- **Spine logs:** `spine_audit_log` (entity writes)

### 9.2 Observability Points

| System | Metrics | Logs | Traces |
|--------|---------|------|--------|
| **Gateway** | Requests/sec, error rate, latency P95 | Auth failures, rate limits | Request → downstream |
| **Normalizer** | Events processed, LLM cost, errors | Classification, mapping errors | Entity resolution |
| **Pipeline** | Entities written, relationships added | Duplicates, conflicts | Spine write path |
| **Continuity** | Signals triaged, promoted, decayed | Lifecycle transitions | Memory consolidation |
| **Twin** | Conversations, proposals generated | Reasoning traces | Chat turns |
| **Govern** | Approvals/rejections, SLA | Governance decisions | Approval path |

---

## X. SCALABILITY & PERFORMANCE

### 10.1 Architecture for Scale

**Cloudflare Workers:** Auto-scales horizontally, no cold starts  
**D1 Database:** SQLite with auto-replication, sub-10ms reads  
**AI Search:** Vector embeddings in Cloudflare, <50ms semantic search  
**Queue Pattern:** Durable Objects for singleton work (one continuity processor per tenant)  
**Caching:** KV for entity 360 (5min TTL), signal cache (1min TTL)

### 10.2 Bottlenecks & Mitigations

| Bottleneck | Current | Mitigation |
|-----------|---------|-----------|
| LLM inference cost | Paid once per entity (normalizer) | Batch inference, cache schema |
| Continuity processing | Single Durable Object per tenant | Sharded processor for large orgs |
| Entity 360 assembly | Materialized in KV | Read-through cache with TTL |
| Vector search latency | Sub-50ms | Index pruning per tenant |

---

## XI. DEPLOYMENT CHECKLIST

### Pre-Launch

- [ ] Verify Supabase Fortress is provisioned (RLS policies active)
- [ ] Verify D1 schemas applied (all 12 domain partitions)
- [ ] Verify Cloudflare API tokens set in Doppler
- [ ] Verify service bindings (gateway → pipeline → continuity, etc.)
- [ ] Run preflight: `pnpm preflight` (install, typecheck, lint, test, build)

### Launch

- [ ] Deploy Cloudflare Workers: `pnpm deploy:prod`
- [ ] Deploy Next.js frontend: Git push to main (Vercel auto-deploys)
- [ ] Verify health endpoints: `curl https://gateway.integratewise.ai/health`
- [ ] Run smoke tests: `scripts/e2e-check.sh`

### Post-Launch

- [ ] Monitor error rates in Sentry
- [ ] Monitor latency in Grafana
- [ ] Monitor billing in Cloudflare dashboard
- [ ] Customer Zero test run (internal user)

---

## XII. KEY INVARIANTS & PRINCIPLES

1. **One Spine, Many Projections:** All UI surfaces are views of the same Spine. No duplication.
2. **Never Reason at Intake:** Loader never transforms data. Transformation paid once per entity.
3. **No Execution Without Approval:** Every action is governance-gated.
4. **Tenant Isolation:** Every query includes `tenant_id` scoping.
5. **Audit Everything:** All actions logged with actor, timestamp, reasoning, outcome.
6. **Cloud-First Memory:** No local agent state. All memory in cloud (D1/Supabase).
7. **Zero-Trust Routing:** Workers never exposed publicly. All traffic via Gateway.
8. **Continuous Learning:** Outcomes feed back into system memory for future signal generation.

---

## XIII. CONTACT & GOVERNANCE

**Founder/CEO:** Nirmal Prince J  
**Engineering Lead:** [To be assigned]  
**Architecture Authority:** Nirmal + Engineering Team  
**Last Review:** June 25, 2026  

**For questions about architecture decisions, see:**
- `AGENTS.md` (locked decisions)
- `docs/architecture/PRODUCT_ARCHITECTURE.md` (product design)
- `docs/architecture/SPINE_MODEL.md` (data model)
- `docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md` (layers & stages)
