# IntegrateWise — End-to-End Architecture v3.7

## Systems View × User View

**Version:** 3.7
**Date:** June 2026
**Status:** Architecture Locked

---

## Executive Summary

> **Systems View:** A Cloudflare-native event-driven architecture where connectors feed a canonical Spine (D1), a selective Memory layer (Vectorize + D1), and a Twin runtime (Workers AI) that operates through an MCP tool surface and an ADK agent orchestrator — all connected via Queues, coordinated by Durable Objects, and cached at the edge (KV).

> **User View:** Connect your tools once. The AI already knows your business. It speaks first with insights, proposes actions, waits for your approval, executes through playbooks, and learns from outcomes — so week 6 is smarter than week 1.

---

# PART I: SYSTEMS VIEW

## How the Engine Runs

---

## 1. Service Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EDGE LAYER                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Gateway   │  │   Pages     │  │    KV       │  │  Vectorize  │       │
│  │  (Router)   │  │  (SPA)      │  │  (Cache)    │  │  (Search)   │       │
│  └──────┬──────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────┼───────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WORKER SERVICES                                      │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Auth      │  │  Workspace  │  │  Connector  │  │  Pipeline   │       │
│  │  Service    │  │   Service   │  │   Sync      │  │  Service    │       │
│  │             │  │             │  │  Service    │  │             │       │
│  │ JWT/RS256   │  │ Profile     │  │ Nango/MCP   │  │ Normalizer  │       │
│  │ Tenant      │  │ Projection  │  │ Scheduler   │  │ 8-Stage     │       │
│  │ Session     │  │ Context     │  │ Hydration   │  │ Sectorize   │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                │              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Twin      │  │  Memory     │  │  Governance │  │  Execution  │       │
│  │  Service    │  │  Service    │  │   Service   │  │  Service    │       │
│  │             │  │             │  │             │  │             │       │
│  │ AI SDK      │  │ Promotion   │  │ Proposals   │  │ Playbook    │       │
│  │ MCP Router  │  │ Scoring     │  │ HITL Queue  │  │ Handoff     │       │
│  │ Context     │  │ Continuity  │  │ Policies    │  │ Audit       │       │
│  │ Assembly    │  │ Scope       │  │ Audit       │  │ Outcome     │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
└─────────┼────────────────┼────────────────┼────────────────┼───────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DURABLE OBJECTS                                      │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   User      │  │   Tenant    │  │   Session   │  │  Workflow   │       │
│  │   DO        │  │    DO       │  │     DO      │  │     DO      │       │
│  │             │  │             │  │             │  │             │       │
│  │ Identity    │  │ Spine Config│  │ Chat State  │  │ HITL State  │       │
│  │ Preferences │  │ Connectors  │  │ Tool Calls  │  │ Proposal    │       │
│  │ Continuity  │  │ Schema      │  │ Memory      │  │ Progress    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              QUEUES                                          │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │ pipeline-process│  │ memory-promote  │  │ connector-sync  │               │
│  │                 │  │                 │  │                 │               │
│  │ Raw payload →   │  │ Spine entity →  │  │ Schedule →      │               │
│  │ Normalizer      │  │ Score → Memory  │  │ Hydration job   │               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘               │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
│  │  proposal-review │  │  execution-run  │  │  outcome-feedback│               │
│  │                  │  │                 │  │                  │               │
│  │ Human approval → │  │ Approved →      │  │ Result →        │               │
│  │ Execute/Reject  │  │ Playbook run    │  │ Memory update   │               │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              D1 DATABASE                                     │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  tenant_    │  │  decide_    │  │   build_    │  │   grow_     │       │
│  │  spine_     │  │   data      │  │   data      │  │   data      │       │
│  │  config     │  │             │  │             │  │             │       │
│  │             │  │ Strategy    │  │ Engineering │  │ Sales       │       │
│  │ Identity    │  │ Planning    │  │ Product     │  │ Marketing   │       │
│  │ Schema      │  │ Knowledge   │  │ Delivery    │  │ CS          │       │
│  │ Connectors  │  │ Documents   │  │ Projects    │  │ Revenue     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   run_      │  │  cross_     │  │   memory_   │  │  governance_│       │
│  │   data      │  │   data      │  │   index     │  │   data      │       │
│  │             │  │             │  │             │  │             │       │
│  │ Operations  │  │ Cross-func  │  │ Patterns    │  │ Proposals   │       │
│  │ Finance     │  │ Org-wide    │  │ Decisions   │  │ Decisions   │       │
│  │ HR          │  │ Shared      │  │ Preferences │  │ Policies    │       │
│  │ Compliance  │  │             │  │ Lessons     │  │ Audit       │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                        │
│  │  signal_    │  │  continuity_│  │  playbook_  │                        │
│  │  log        │  │   state     │  │   registry  │                        │
│  │             │  │             │  │             │                        │
│  │ Changes     │  │ Org scope   │  │ Action      │                        │
│  │ Anomalies   │  │ Team scope  │  │ Templates   │                        │
│  │ Events      │  │ Role scope  │  │ Parameters  │                        │
│  │ Patterns    │  │ Personal    │  │ Handoff     │                        │
│  └─────────────┘  └─────────────┘  └─────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Package Structure

```
integratewise-live/
├── apps/
│   ├── web/                    # Next.js SPA (Pages deployment)
│   ├── gateway/                # Cloudflare Worker (API router)
│   └── marketing/              # Marketing site (separate Pages)
│
├── services/
│   ├── auth/                   # JWT, session, tenant context
│   ├── workspace/              # Profile, projection, context assembly
│   ├── connector-sync/         # Nango, MCP, hydration scheduler
│   ├── pipeline/               # 8-stage normalizer, sectorize
│   ├── twin/                   # AI SDK, MCP router, context retrieval
│   ├── memory/                 # Promotion scoring, continuity scope
│   ├── governance/             # Proposals, HITL, policies, audit
│   ├── execution/              # Playbook handoff, run, audit
│   └── workflow/               # (being retired — replaced by DO + Queues)
│
├── packages/
│   ├── spine-model/            # Canonical entities, domain routing
│   ├── projection-model/       # Context assembly, 6 dimensions
│   ├── design-tokens/          # Color, typography, spacing system
│   ├── shared-types/           # Cross-service TypeScript contracts
│   └── test-utils/             # Playwright, test fixtures, helpers
│
├── infra/
│   ├── wrangler/               # Per-service wrangler.toml configs
│   ├── migrations/             # D1 schema migrations
│   └── seeds/                  # Development seed data
│
└── docs/                       # Constitutional docs (CANON, etc.)
```

---

## 3. API Contracts

### 3.1 Gateway Router (Single Entry Point)

All requests flow through the Gateway Worker. No service is public-facing except Gateway.

```
POST /api/v1/auth/login          → Auth Service
POST /api/v1/auth/refresh        → Auth Service
GET  /api/v1/workspace/profile   → Workspace Service
POST /api/v1/workspace/initialize → Workspace Service
POST /api/v1/workspace/hydrate-connectors → Workspace Service → Queue: connector-sync
GET  /api/v1/workspace/engineering → Workspace Service → D1: build_data
GET  /api/v1/workspace/sales     → Workspace Service → D1: grow_data
POST /api/v1/twin/chat           → Twin Service
POST /api/v1/twin/brief          → Twin Service
POST /api/v1/twin/reason         → Twin Service
GET  /api/v1/proposals           → Governance Service
POST /api/v1/proposals/:id/approve → Governance Service → Queue: execution-run
POST /api/v1/proposals/:id/reject  → Governance Service
GET  /api/v1/executions          → Execution Service
GET  /api/v1/memory              → Memory Service
GET  /api/v1/continuity          → Memory Service
```

### 3.2 Inter-Service Communication

Services do not call each other directly. They communicate via D1 (state) and Queues (events).

```
Direct calls (anti-pattern):  Service A → HTTP → Service B
Correct pattern:              Service A → Queue → Service B (async)
                              Service A → D1 read → State (sync, read-only)
```

---

## 4. Queue Routing & Message Formats

### 4.1 Queue Topology

| Queue              | Producer                           | Consumer               | Message Format       |
| ------------------ | ---------------------------------- | ---------------------- | -------------------- |
| `pipeline-process` | Connector-Sync, Gateway            | Pipeline Service       | `PipelineJob`        |
| `memory-promote`   | Pipeline Service                   | Memory Service         | `PromotionCandidate` |
| `connector-sync`   | Gateway (hydration trigger)        | Connector-Sync Service | `HydrationRequest`   |
| `proposal-review`  | Twin Service, Intelligence Service | Governance Service     | `Proposal`           |
| `execution-run`    | Governance Service (approved)      | Execution Service      | `ExecutionJob`       |
| `outcome-feedback` | Execution Service                  | Memory Service         | `OutcomeEvent`       |

### 4.2 Message Schemas

```typescript
// PipelineJob
interface PipelineJob {
  job_id: string; // UUID
  tenant_id: string;
  connector_id: string; // "github", "hubspot", etc.
  provider: "nango" | "mcp" | "ai";
  payload: RawPayload; // Connector-specific raw data
  stage:
    | "analyze"
    | "extract"
    | "classify"
    | "validate"
    | "resolve"
    | "transform"
    | "write"
    | "sectorize";
  attempt: number; // Retry count
  created_at: ISO8601;
}

// PromotionCandidate
interface PromotionCandidate {
  candidate_id: string;
  tenant_id: string;
  entity_id: string; // Spine entity reference
  entity_type: CanonicalType;
  domain: DomainPartition;
  signals: SignalScore[]; // 7 signal scores
  composite_score: number; // 0–1
  promotion_reason: string[]; // Human-readable why
  created_at: ISO8601;
}

// HydrationRequest
interface HydrationRequest {
  request_id: string;
  tenant_id: string;
  user_id: string;
  type: "creamy" | "full" | "delta";
  connector_ids: string[]; // Which connectors to hydrate
  triggered_by: "onboarding" | "scheduler" | "manual" | "webhook";
  priority: "critical" | "normal" | "background";
  created_at: ISO8601;
}

// Proposal
interface Proposal {
  proposal_id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  description: string;
  evidence: Evidence[]; // Links to Spine entities, signals
  reasoning_chain: string[]; // How the Twin arrived here
  action: PlaybookAction; // What would execute
  risk_level: "low" | "medium" | "high";
  auto_execute: false; // Always false (P7)
  status: "pending" | "approved" | "rejected" | "modified" | "delegated";
  created_at: ISO8601;
}

// ExecutionJob
interface ExecutionJob {
  job_id: string;
  tenant_id: string;
  proposal_id: string;
  playbook_id: string;
  action: PlaybookAction;
  parameters: Record<string, unknown>;
  approved_by: string; // User ID who approved
  approved_at: ISO8601;
  status: "ready" | "running" | "completed" | "failed";
}

// OutcomeEvent
interface OutcomeEvent {
  event_id: string;
  tenant_id: string;
  execution_job_id: string;
  proposal_id: string;
  outcome: "success" | "partial" | "failure" | "cancelled";
  result_summary: string;
  lessons: string[]; // What the system learned
  memory_impact: number; // How much this should weight future proposals
  created_at: ISO8601;
}
```

---

## 5. D1 Schema Per Partition

### 5.1 Core Tables (All Partitions)

Every partition table has these standard columns:

```sql
CREATE TABLE <partition>.entities (
  id TEXT PRIMARY KEY,              -- Canonical UUID
  tenant_id TEXT NOT NULL,
  external_id TEXT,                 -- Provider-specific ID (e.g., GitHub issue #123)
  provider TEXT,                    -- "github", "hubspot", "slack"
  entity_type TEXT NOT NULL,        -- "repository", "task", "contact", etc.
  domain TEXT NOT NULL,             -- "build_data", "grow_data", etc.
  name TEXT,
  description TEXT,
  metadata JSON,                    -- Provider-specific fields (normalized)
  relationships JSON,               -- Array of {entity_id, relation_type}
  signals JSON,                     -- Array of {signal_type, score, timestamp}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX tenant_entity (tenant_id, entity_type),
  INDEX external (tenant_id, provider, external_id)
);
```

### 5.2 Tenant Spine Config

```sql
CREATE TABLE tenant_spine_config (
  tenant_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,               -- "founder", "engineer", "sales"
  department TEXT NOT NULL,         -- "engineering", "sales", "operations"
  industry TEXT NOT NULL,           -- "saas", "fintech", "healthcare"
  schema_version TEXT DEFAULT 'v1',
  schema JSON,                      -- Role×Industry-specific entity expectations
  connector_priorities JSON,        -- Ordered list of connector IDs
  signal_types JSON,                -- What signals to track
  memory_categories JSON,           -- What memory types to form
  governance_defaults JSON,         -- Default policies
  twin_context JSON,                -- Boot context for Twin
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 Memory Index

```sql
CREATE TABLE memory_index (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,                     -- NULL = org-level
  scope TEXT NOT NULL,              -- "org" | "team" | "role" | "personal"
  memory_type TEXT NOT NULL,        -- "pattern" | "decision" | "preference" | "exception" | "behavior" | "relationship" | "lesson"
  source_entity_id TEXT,            -- Link back to Spine
  source_entity_type TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  evidence JSON,                    -- Supporting entity IDs, signals
  confidence_score REAL,            -- 0–1
  usage_count INTEGER DEFAULT 0,    -- How often Twin referenced this
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX tenant_scope (tenant_id, scope, memory_type),
  INDEX source (source_entity_id)
);
```

### 5.4 Governance Data

```sql
CREATE TABLE governance_data (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  proposal_id TEXT NOT NULL,
  user_id TEXT NOT NULL,            -- Who reviewed
  action TEXT NOT NULL,             -- "approve" | "reject" | "modify" | "delegate" | "schedule"
  comment TEXT,
  modified_proposal JSON,           -- If action = "modify"
  delegated_to TEXT,                -- If action = "delegate"
  scheduled_for TIMESTAMP,          -- If action = "schedule"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. MCP (Model Context Protocol) Architecture

### 6.1 MCP Server Surface

The Twin does not call APIs directly. It calls **MCP tools** that abstract the Spine.

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP TOOL SURFACE                          │
│                                                              │
│  spine.read              → Read entities from D1 partition    │
│  spine.search            → Semantic search via Vectorize      │
│  spine.query             → Structured query across partitions │
│  spine.relationships     → Get related entities               │
│                                                              │
│  signal.list             → List signals for tenant/user       │
│  signal.subscribe        → Subscribe to signal type           │
│  signal.acknowledge      → Mark signal as seen              │
│                                                              │
│  memory.retrieve         → Get memory by scope/type           │
│  memory.search           → Semantic memory search             │
│  memory.promote          → Manually promote entity to memory  │
│                                                              │
│  proposal.create         → Create proposal (Twin internal)    │
│  proposal.list           → List pending proposals             │
│  proposal.get            → Get proposal details               │
│                                                              │
│  execution.run           → Execute approved playbook (gated)  │
│  execution.status        → Check execution status             │
│  execution.audit         → Get execution history              │
│                                                              │
│  continuity.get          → Get continuity state for scope     │
│  continuity.update       → Update continuity (system only)    │
│                                                              │
│  connector.list          → List connected connectors          │
│  connector.status          → Get connector health             │
│  connector.sync            → Trigger manual sync              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 MCP Router

```
Twin (AI SDK) → MCP Client → MCP Router (Worker) → Tool Handler → D1 / Queue / Vectorize
```

The MCP Router is a Cloudflare Worker that:

1. Authenticates the tool call (tenant-scoped)
2. Validates parameters against schema
3. Routes to the correct handler (D1 read, Queue write, Vectorize search)
4. Returns structured response to the Twin
5. Logs all calls for audit

### 6.3 Tool Permission Model

```
spine.*      → Read-only (Twin cannot write to Spine directly)
signal.*     → Read + acknowledge (Twin can mark signals seen)
memory.*     → Read + promote (Twin can suggest promotion, system scores)
proposal.*   → Read + create (Twin creates proposals, human approves)
execution.*  → Read only (Twin cannot execute — governance service does)
continuity.* → Read only (Twin reads continuity, system updates)
connector.*  → Read + sync trigger (Twin can request sync, scheduler decides)
```

---

## 7. ADK (Agent Development Kit)

### 7.1 Agent Primitives

The Twin is not a monolithic agent. It is composed of **agent primitives** orchestrated by the ADK.

```
┌─────────────────────────────────────────────────────────────┐
│                    ADK ORCHESTRATOR                         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Context    │  │  Reasoner   │  │  Proposer   │         │
│  │  Agent      │  │  Agent      │  │  Agent      │         │
│  │             │  │             │  │             │         │
│  │ Assembles   │  │ Analyzes    │  │ Generates   │         │
│  │ Spine +     │  │ patterns,   │  │ proposals   │         │
│  │ Memory +    │  │ identifies  │  │ with        │         │
│  │ Continuity  │  │ insights    │  │ evidence    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Brief      │  │  Chat       │  │  Handoff    │         │
│  │  Agent      │  │  Agent      │  │  Agent      │         │
│  │             │  │             │  │             │         │
│  │ Morning     │  │ Conversa-   │  │ Transfers   │         │
│  │ brief,      │  │ tional      │  │ to human    │         │
│  │ daily       │  │ Q&A         │  │ or playbook │         │
│  │ summary     │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐                                            │
│  │  Session    │                                            │
│  │  Manager    │                                            │
│  │             │                                            │
│  │ Manages     │                                            │
│  │ long-running│                                            │
│  │ sessions,   │                                            │
│  │ tool call   │                                            │
│  │ history,    │                                            │
│  │ memory      │                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Agent Handoff Protocol

```
User Query
    ↓
ADK Router → Intent Classification
    ↓
[Chat intent]        → Chat Agent → Context Agent → Answer
[Brief intent]       → Brief Agent → Context Agent → Summary
[Reason intent]      → Reasoner Agent → Context Agent → Insights
[Proposal intent]    → Proposer Agent → Context Agent → Proposal → Queue: proposal-review
[Execution intent]   → Handoff Agent → Governance Service → Human Review
```

### 7.3 Session Persistence

```
Session DO (Durable Object) stores:
  - Chat history
  - Tool call log
  - Agent handoff chain
  - User preferences learned in-session
  - Pending proposals created

Session → Memory promotion: At session end, triaged insights promoted to Memory Index
```

---

## 8. Spine Cache (KV Strategy)

### 8.1 What Gets Cached

| Cache Key                              | Source                 | TTL    | Invalidation                 |
| -------------------------------------- | ---------------------- | ------ | ---------------------------- |
| `projection:<tenant>:<user>:<context>` | D1 projection query    | 5 min  | D1 write to partition        |
| `twin_context:<tenant>:<user>`         | Context assembly       | 2 min  | Memory update, signal change |
| `spine_schema:<tenant>`                | tenant_spine_config    | 1 hour | Schema update                |
| `connector_status:<tenant>`            | Connector health check | 30 sec | Sync completion              |
| `prompt_cache:<hash>`                  | Compiled system prompt | 1 hour | Schema version change        |
| `feature_flags:<tenant>`               | Governance defaults    | 5 min  | Policy update                |

### 8.2 Cache Invalidation Rules

```
D1 Write (any partition) → Invalidate projection cache for tenant
Memory Update → Invalidate twin_context cache
Signal New → Invalidate twin_context cache
Schema Update → Invalidate spine_schema + prompt_cache
Policy Change → Invalidate feature_flags + governance cache
```

### 8.3 Cache-Aside Pattern

```
Read:  Check KV → Hit → Return
              → Miss → Query D1 → Write KV → Return

Write: Write D1 → Invalidate KV → (Async) Warm KV with new value
```

---

## 9. Request Flow: Gateway → Service → D1

### 9.1 Authenticated Request Flow

```
User Request
    ↓
Cloudflare Access / Gateway JWT (RS256)
    ↓
Gateway Worker
    ↓
[Route Resolution] → Service Worker
    ↓
Service Worker
    ↓
[Tenant Context Injection] → D1 binding (tenant-scoped)
    ↓
D1 Query (partitioned by tenant_id)
    ↓
Response → Service Worker → Gateway Worker → User
```

### 9.2 Async Event Flow (Queue)

```
Webhook / Scheduler / Manual Trigger
    ↓
Gateway Worker (enqueue)
    ↓
Cloudflare Queue
    ↓
Consumer Worker (Service)
    ↓
D1 Write / Queue Forward
    ↓
Next Queue Consumer
```

### 9.3 Twin Request Flow

```
User Chat Message
    ↓
Gateway → Twin Service
    ↓
Session DO (retrieve history)
    ↓
ADK Router (intent classification)
    ↓
Context Agent → MCP Router
    ↓
[MCP Tool Call] → D1 / Vectorize / Queue
    ↓
Compiled Context → AI SDK (Workers AI)
    ↓
LLM Response
    ↓
[If Proposal] → Queue: proposal-review
    ↓
Response + Session DO Update
    ↓
Gateway → User
```

---

## 10. Infrastructure Stack

| Layer             | Technology                            | Purpose                                            |
| ----------------- | ------------------------------------- | -------------------------------------------------- |
| **Edge**          | Cloudflare Pages                      | SPA hosting, marketing site                        |
| **Edge**          | Cloudflare Workers                    | API Gateway, service workers                       |
| **Edge**          | Cloudflare KV                         | Projection cache, prompt cache, feature flags      |
| **Edge**          | Cloudflare Vectorize                  | Semantic search, memory retrieval                  |
| **Compute**       | Cloudflare Workers                    | Stateless service logic                            |
| **Compute**       | Cloudflare Durable Objects            | Stateful sessions, tenant state, workflow progress |
| **Compute**       | Cloudflare Workflows                  | Long-running orchestration, HITL state machines    |
| **Coordination**  | Cloudflare Queues                     | Async job routing, service decoupling              |
| **State**         | Cloudflare D1                         | Authoritative operational state (all partitions)   |
| **Files**         | Cloudflare R2                         | Artifacts, document exports, backups               |
| **AI**            | Cloudflare AI SDK / Workers AI        | Twin runtime, embeddings, inference                |
| **Auth**          | Cloudflare Access + Gateway JWT       | RS256, tenant-scoped, session management           |
| **Observability** | Cloudflare Analytics + Custom Logging | Request tracing, queue depth, D1 metrics           |

### Absolute Prohibitions

These are not preferences. They are architectural axioms. No exceptions. No compatibility layers. No migration paths. No edge cases.

| Technology                        | Status                   | Why                                                                                                                |
| --------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Supabase**                      | ❌ ABSOLUTELY PROHIBITED | Not in the stack. Not for auth. Not for anything. D1 is the only database.                                         |
| **PostgreSQL / Neon**             | ❌ ABSOLUTELY PROHIBITED | No direct reads. No alternate writers. No fallback. D1 only.                                                       |
| **CouchDB**                       | ❌ ABSOLUTELY PROHIBITED | No document databases. D1 handles all structured data.                                                             |
| **n8n**                           | ❌ ABSOLUTELY PROHIBITED | Not in product runtime. Not for workflows. Cloudflare Workflows + Queues + DO only.                                |
| **OpenWebUI**                     | ❌ ABSOLUTELY PROHIBITED | Not for Twin orchestration. Not for LLM UI. Twin runs on Workers AI / AI SDK only.                                 |
| **Redis**                         | ❌ ABSOLUTELY PROHIBITED | No external caches. Cloudflare KV is the only cache layer.                                                         |
| **VPS / EC2 / VMs**               | ❌ ABSOLUTELY PROHIBITED | No virtual servers in product runtime. Workers + DO + Workflows only.                                              |
| **LangChain / LangSmith**         | ❌ ABSOLUTELY PROHIBITED | No external LLM frameworks. AI SDK + MCP + ADK only.                                                               |
| **Any non-Cloudflare AI runtime** | ❌ ABSOLUTELY PROHIBITED | Twin runs on Cloudflare Workers AI. No OpenAI API calls from Twin. No Anthropic direct. No external orchestration. |

**The Rule:** If it is not in the Cloudflare Developer Platform (Workers, Pages, D1, Durable Objects, Queues, KV, R2, Vectorize, Workflows, AI SDK), it is not in the product.

---

# PART II: USER VIEW

## How People Experience the System

---

## 1. The Personas

### 1.1 The Founder (Primary)

> **"I need to know what's happening across my company without asking 5 people for updates."**

- Connects: GitHub, HubSpot, Slack, Notion
- Needs: Engineering + Sales + Cross-functional view
- Uses: Morning brief, situation proposals, governance audit
- Expects: The AI knows the business context, speaks first, never hallucinates

### 1.2 The Engineering Lead

> **"I want to know what my team shipped, what's blocked, and what needs my attention."**

- Connects: GitHub, Jira, Slack
- Needs: Build_data projection, PR health, blocked signals
- Uses: Engineering workbench, Twin chat about repos, execution proposals
- Expects: Accurate technical context, no made-up PRs

### 1.3 The Sales Manager

> **"I need to see pipeline health, stalled deals, and what my team should do next."**

- Connects: HubSpot, Slack, Calendar
- Needs: Grow_data projection, opportunity signals, activity patterns
- Uses: Sales workbench, deal proposals, follow-up reminders
- Expects: Revenue-aware insights, not generic sales advice

### 1.4 The Operations Person

> **"I need to see cross-functional blockers and ensure nothing falls through cracks."**

- Connects: All tools
- Needs: Cross_data + Run_data, signal triage, governance queue
- Uses: Operations workbench, proposal review, execution audit
- Expects: Complete organizational context, governed action flow

---

## 2. The Day 1 Experience

### Step 1: Welcome (30 seconds)

```
Screen: "IntegrateWise — Your AI knows your business"
Action: User clicks "Get Started"
System: Creates tenant, generates session
```

### Step 2: Identity (1 minute)

```
Screen: "Tell us about your role"
Fields: Role (Founder / Engineer / Sales / Operations)
       Department (Engineering / Sales / Operations / Cross-functional)
       Industry (SaaS / Fintech / Healthcare / Other)
System: Writes tenant_spine_config to D1
       → Schema auto-selected based on Role×Industry
       → Connector priorities auto-ranked
       → Governance defaults loaded
```

### Step 3: Goals (1 minute)

```
Screen: "What are you trying to achieve?"
Options: "Ship faster", "Close more deals", "Reduce churn",
         "Improve team alignment", "Automate reporting"
System: Adds goals to tenant_spine_config.twin_context
       → Twin will reference these in briefs and proposals
```

### Step 4: Connectors (2 minutes)

```
Screen: Connector Tray — 5 recommended connectors based on Role×Industry
Example for Founder/SaaS: GitHub, HubSpot, Slack, Notion, Intercom
Action: User clicks "Connect" on each → OAuth via Nango
System: Stores tokens in Nango vault
       → Triggers creamy hydration
       → Shows "Connecting..." progress
```

### Step 5: Hydration (0–2 hours)

```
System: Enqueues creamy hydration jobs
Queue: connector-sync → pipeline-process
Pipeline: 8-stage normalizer → D1 build_data/grow_data/etc.
Result: Essential reality loaded
```

### Step 6: Workspace (First View)

```
Screen: L1 User Workbench — Role×Department×Industry hydrated
Header: "Good morning, [Name] — here's your [Department] workspace"
Navigation: Engineering | Sales | Operations | Cross-functional (based on role)
Content: Empty states with honest messaging
       → "Connect GitHub to see repository health"
       → "Connect HubSpot to see pipeline activity"
System: ProjectionContext drives all UI components
       → Single authority: one department value everywhere
```

### Step 7: Twin First Interaction

```
User: "What changed in engineering this week?"
Twin: "3 PRs merged, 2 blocked >48h, 1 new contributor.
       Here's the breakdown..."
Source: D1 build_data (direct read, not GitHub API)
```

---

## 3. The Day 7 Experience (When Working)

### Morning Brief (Automatic)

```
Time: 9:00 AM (user timezone)
Channel: In-app notification + Email optional
Content:
  "Good morning. Here's what changed since yesterday:

   Engineering:
   • 2 PRs merged (repo: api-gateway, auth-service)
   • 1 PR blocked >48h — assigned to [Name]
   • 1 new issue: performance regression in staging

   Sales:
   • 3 new leads from HubSpot
   • 1 deal stalled at negotiation (Acme Corp, $45K)
   • Follow-up due: 2 contacts from last week

   Signals:
   • ⚠️ Velocity dropped 15% vs last week
   • ℹ️ New contributor joined engineering team"

System: Brief Agent → Context Agent → MCP spine.read + signal.list
       → D1 direct read → AI SDK → Formatted brief
```

### Twin Chat (On Demand)

```
User: "Why is the Acme Corp deal stalled?"
Twin: "The deal moved to negotiation 12 days ago.
       Last activity: email sent 5 days ago, no reply.
       Similar deals at this stage typically close in 8 days.
       Proposal: Schedule follow-up call. [View Proposal →]"

System: Chat Agent → Context Agent → MCP spine.search + memory.retrieve
       → D1 + Vectorize → AI SDK → Answer with evidence links
```

### Proposal Review (Governance)

```
Screen: L5 Operations — Proposals Queue
Item: "Schedule follow-up with Acme Corp"
Evidence: Deal record, email timeline, velocity comparison
Reasoning: "Stalled >5 days. Historical pattern: 60% of stalled
            deals at this stage close after follow-up."
Actions: [Approve] [Reject] [Modify] [Delegate] [Schedule]

User clicks [Approve]
System: Queue: proposal-review → execution-run
       → Execution Service → Playbook: "hubspot-deal-followup"
       → Result: Task created in HubSpot, assigned to owner
       → Outcome logged → Queue: outcome-feedback → Memory update
```

---

## 4. The Day 30 Experience (Compounding)

### What the User Notices

```
Week 1: "It knows my tools. It answers from my data."
Week 2: "It remembered that I prefer morning briefs at 8am, not 9am."
Week 3: "It proposed something I was about to do myself."
Week 4: "It caught a pattern I missed — 3 deals stalling at the same stage."
Week 6: "It feels like it works here."
```

### What the System Did

```
Week 1: Creamy → Full hydration. Basic projection active.
Week 2: Memory formation started. First preferences captured.
Week 3: Continuity scope built. Twin references past decisions.
Week 4: Pattern detection. Cross-entity signals identified.
Week 6: Proposal quality improved. Outcome feedback loop active.
        → Proposals weighted by historical success
        → Lessons from failed proposals incorporated
        → Twin speaks more precisely to this user's style
```

---

## 5. The Governance Experience

### The User Sees

```
L5 Operations:
  [3] Proposals pending your review
  [1] Situation requires attention
  [12] Signals today (2 new)

L6 Execution:
  [2] Running — "HubSpot follow-up", "Slack notification"
  [5] Completed today
  [0] Failed (last 7 days)

L7 Governance:
  [24] Decided this month (18 approved, 4 rejected, 2 modified)
  [3] Active policies
  [1] Audit trail export ready
```

### The System Does

```
Proposal created → Queue: proposal-review → Governance DO
Governance DO → User notification → WebSocket push
User action → Governance DO update → Queue: execution-run (if approved)
Execution DO → Playbook run → Outcome capture → Queue: outcome-feedback
Memory Service → Update weights → Continuity scope refresh
```

---

## 6. The Memory Experience

### User View: "It remembers"

```
User: "What did we decide about the pricing model last quarter?"
Twin: "In March, you approved a tiered pricing proposal.
       Key decision: $49/$99/$249 tiers.
       Outcome: 23% increase in ACV.
       Lesson: Mid-tier converted 40% better than expected.
       [View full memory →]"

User: "Who handled the Acme Corp integration?"
Twin: "[Name] led the integration in Q2.
       Key contacts: [CTO email], [Engineering lead].
       Technical notes: OAuth 2.0 + webhook setup.
       [View relationship map →]"
```

### System View: Memory Formation

```
Spine entity created → Signal scoring (7 dimensions)
Score > threshold → Queue: memory-promote
Memory Service → Scope assignment (org/team/role/personal)
Vectorize embedding → Semantic index
Twin retrieval → Usage count ++ → Confidence refinement
```

---

# PART III: THE BRIDGE

## How Systems Enable the User Experience

---

## Mapping: User Moment → System Action

| User Moment                    | System Action                                                    | Technologies              |
| ------------------------------ | ---------------------------------------------------------------- | ------------------------- |
| "Connect my tools"             | OAuth → Nango vault → token storage                              | Nango, Gateway            |
| "What changed this week?"      | Brief Agent → Context Agent → MCP spine.read → D1 → AI SDK       | Twin, MCP, D1, Workers AI |
| "Why is this stalled?"         | Chat Agent → MCP spine.search + memory.retrieve → D1 + Vectorize | Twin, MCP, Vectorize      |
| "Approve this proposal"        | Governance DO → Queue: execution-run → Playbook handoff          | DO, Queues, Execution     |
| "It remembered my preference"  | Session DO → Memory promotion → Continuity scope update          | DO, Memory, D1            |
| "It proposed before I asked"   | Signal detection → Reasoner Agent → Proposer Agent → Queue       | Pipeline, Twin, Queues    |
| "Week 6 is better than Week 1" | Outcome feedback → Weight update → Proposal quality improvement  | Execution, Memory, AI SDK |

---

## The Complete Loop

```
USER                        SYSTEM
────                        ──────
"Connect tools"        →    Gateway → Nango → OAuth → Token vault
                              ↓
"See workspace"        →    Workspace Service → ProjectionContext → D1
                              ↓
"Ask question"         →    Twin Service → ADK Router → Context Agent
                              ↓
                        →    MCP Router → spine.read / memory.retrieve
                              ↓
                        →    D1 / Vectorize → Compiled context
                              ↓
                        →    AI SDK (Workers AI) → Response
                              ↓
"Get proposal"         →    Proposer Agent → Proposal → Queue: proposal-review
                              ↓
"Review & approve"     →    Governance Service → Governance DO
                              ↓
                        →    Queue: execution-run → Execution Service
                              ↓
                        →    Playbook run → External tool action
                              ↓
"See result"           →    Execution DO → Outcome capture
                              ↓
                        →    Queue: outcome-feedback → Memory Service
                              ↓
                        →    Memory update → Continuity scope refresh
                              ↓
"Next week, better"    →    Weighted proposals → Improved Twin responses
```

---

## The Architectural Promise

> **Systems View:** Every user action flows through a governed, auditable, event-driven pipeline. No direct API calls. No stateless execution. No bypasses.

> **User View:** The AI knows my business, speaks first, waits for my approval, and gets smarter over time. I never have to re-explain context.

> **The Bridge:** The same architecture that makes the system governable (Spine, Memory, Queues, MCP, ADK) is what makes the user experience feel continuous and intelligent.

---

_This document is the canonical end-to-end architecture of IntegrateWise v3.7. It specifies both the engine (Systems View) and the experience (User View), with the bridge between them. Implementation details, current build status, and remaining work are tracked in the engineering backlog and CI pipeline._

---

## Appendix: Doc ↔ Code Reconciliation (as of 2026-06-15)

> This doc is the **canonical/target** architecture. The running code is consolidated under
> v3.6/v3.7 (see `AGENTS.md`). The logical services below map to the deployed workers as follows;
> reconcile names over time rather than treating the divergence as drift.

| Doc (logical) service  | Deployed worker (actual)                                                          |
| ---------------------- | --------------------------------------------------------------------------------- |
| Auth Service           | `services/gateway` (`src/auth.ts`)                                                |
| Workspace Service      | `services/gateway` (`src/workspace-spine.ts`, `spine-schema.ts`)                  |
| Connector-Sync Service | `services/connector-sync` (DO-alarm scheduler) + `services/connector`             |
| Pipeline Service       | `services/pipeline` (8-stage normalizer consolidated)                             |
| Twin Service           | `services/iw-agent-runtime` (Cloudflare Agents SDK: `TwinAgent`, `TenantBrainDO`) |
| Memory Service         | `services/pipeline` (`memory-promoter.ts`) + `services/continuity`                |
| Governance Service     | `services/intelligence` (`action-loop.ts`, `governance_data`)                     |
| Execution Service      | `services/intelligence` (playbook hand-off)                                       |
| `apps/gateway`         | `services/gateway` (gateway is a service, not an app)                             |

**Known terminology deltas to reconcile:**

- "ADK (Agent Development Kit)" in this doc = the **Cloudflare Agents SDK** runtime in `services/iw-agent-runtime`.
- `apps/web` is a **Vite + React SPA** on Cloudflare Pages (this doc says "Next.js"); update whichever is authoritative.
- Memory tables in code are `conversational_memory` / `org_memory` / `personal_memory` (+ `memory_promotion_audit`); `memory_index` here is the logical/target shape.
- Per-domain D1 partitions (`decide_data | build_data | grow_data | run_data | cross_data`) are live and match `getDomainForType()`.
