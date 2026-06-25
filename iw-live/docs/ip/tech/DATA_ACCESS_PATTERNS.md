# Data Access Patterns — When to Use What

> Definitive guide: Spine DB direct vs Gateway API vs Cloudflare operational layer.
> This is an architecture decision. Follow it everywhere.

---

## Current Surface-Binding Doctrine

- Operational Workbench = the primary work surface; left sidebar nav; Twin sidebar pops out when needed.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- OpenWebUI is not the customer-facing product shell.
- Twin / OpenWebUI runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

Use older L1/L2 / workspace / knowledge-UI language in this file through that boundary if any historical phrasing remains.

---

## The decoupled architectural layers:

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (React App)                                           │
│                                                                 │
│  Reads: Edge Low-Latency Cache (D1, KV)                         │
│  Writes: Gateway API (validation + pipeline)                    │
│  Auth: Spine Gateway Auth (JWT)                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  GATEWAY (Cloudflare Worker)                                    │
│                                                                 │
│  Writes that need validation, pipeline, or multi-service        │
│  External API calls (OAuth, connector sync)                     │
│  Webhook ingestion & Rate limiting                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ACTIVE MEMORY PLANE (D1, KV, Queues, Durable Objects)           │
│                                                                 │
│  Sandboxed Edge operational database layer                      │
│  Low-latency read/write for internal Twin reasoning loops       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  CORE MEMORY SUBSTRATE (Supabase DB + Filesystem Vault)         │
│                                                                 │
│  Fortress Database of Record (relational & pgvector)            │
│  Mirrored and persistent storage synchronized from Edge         │
│  Accessed by external clients via the Continuity Bridge MCP     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rule 1: READS — Frontend queries Spine DB directly

**Never route reads through Gateway for workspace views.**

The Spine DB client is already initialized in the frontend (`utils/spineDb/client.ts`). RLS enforces tenant isolation at the database level. The JWT from Spine DB Auth carries the tenant_id. Every query is automatically scoped.

| What the view needs  | Query                                                                      | Goes through                      |
| -------------------- | -------------------------------------------------------------------------- | --------------------------------- |
| Account list         | `spineDb.from("entities").select("*").eq("entity_type", "account")`        | Spine DB direct                   |
| Tasks for user       | `spineDb.from("entities").select("*").eq("entity_type", "task_item")`      | Spine DB direct                   |
| Contacts             | `spineDb.from("entities").select("*").eq("entity_type", "contact")`        | Spine DB direct                   |
| Calendar events      | `spineDb.from("entities").select("*").eq("entity_type", "calendar_event")` | Spine DB direct                   |
| Signals/alerts       | `spineDb.from("signals").select("*").eq("status", "active")`               | Spine DB direct                   |
| Insights             | `spineDb.from("entities").select("*").eq("entity_type", "insight")`        | Spine DB direct                   |
| Metrics/KPIs         | `spineDb.from("entities").select("*").eq("entity_type", "metric")`         | Spine DB direct                   |
| Goals                | `spineDb.from("goals").select("*")`                                        | Spine DB direct                   |
| Memories             | `spineDb.from("consolidated_memories").select("*")`                        | Spine DB direct                   |
| Documents            | `spineDb.from("context_extractions").select("*")`                          | Spine DB direct                   |
| Audit trail          | `spineDb.from("governance_audit_log").select("*")`                         | Spine DB direct                   |
| Dashboard projection | `spineDb.rpc("get_department_projection", { dept: "finance" })`            | Spine DB direct (stored function) |

**Why:** Zero latency overhead. No Worker cold starts. No Gateway routing. RLS handles security. Spine DB JS client handles connection pooling and caching. One round-trip to the database, not three hops through Workers.

**Realtime updates:** Use Spine DB Realtime subscriptions for live data:

```typescript
spineDb
  .channel("signals")
  .on("postgres_changes", { event: "INSERT", schema: "spine", table: "signals" }, handleNewSignal)
  .subscribe();
```

This replaces the need for WebSocket through Workflow Worker for most UI updates.

---

## Rule 2: WRITES — Frontend calls Gateway API

**All writes go through Gateway. Never write to Spine DB directly from frontend.**

Writes need validation, pipeline processing, audit logging, and downstream effects. The Gateway orchestrates this.

| What the user does    | API call                               | Why Gateway                                       |
| --------------------- | -------------------------------------- | ------------------------------------------------- |
| Create a task         | `POST /api/v1/workspace/entities`      | Needs validation + Spine write + audit            |
| Log a note            | `POST /api/v1/workspace/entities`      | Needs entity linking + audit                      |
| Approve a triage item | `POST /api/v1/triage/approve`          | Needs Govern check + memory write + audit         |
| Merge duplicates      | `POST /api/v1/identity/merge`          | Needs Govern approval + multi-table write + audit |
| Connect a tool        | `POST /api/v1/connectors/connect`      | Needs OAuth flow + connector service              |
| Execute an action     | `POST /api/v1/act/execute`             | Needs Govern gate + multi-service orchestration   |
| Update entity fields  | `PATCH /api/v1/workspace/entities/:id` | Needs validation + version tracking + audit       |
| Disconnect connector  | `DELETE /api/v1/connectors/:id`        | Needs Govern approval + cleanup                   |

**Why:** Writes have side effects. A task creation might trigger a Twin evaluation. An approval might write to multiple tables. A merge affects entity relationships. The Gateway ensures all side effects happen correctly, atomically, and with audit trail.

**Exception:** User profile updates and auth operations go through Spine DB Auth directly (already implemented in auth-provider.tsx).

---

## Rule 3: CLOUDFLARE OPERATIONAL — The Active Memory Plane

Cloudflare D1 (`spine_vault`), KV, Queues, R2, and AI Search represent the active operational **Memory Plane** of IntegrateWise. The Twin Workspace reads Zod-validated context edge-locally from this plane.

For **promoted tenants**, Supabase (fortress) and the Filesystem Vault serve as the underlying **Core Memory Substrate** for permanent synchronization, external client access (via MCP), and auditability. Supabase is **usage-allocated, not default**: initial/edge-only tenants run entirely on D1 + KV + R2 + AI Search (D1 is their record of truth, R2 spine-backup is the replay path) and have **no Supabase footprint**. Supabase is added only when a tenant is promoted (data volume / retention / compliance / plan). Internal reasoning loops are always sandboxed from Supabase. All writes go Cloudflare Worker first; for promoted tenants they also update Supabase via the CF MCP Worker and propagate back. See `docs/tech/MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md` §7.7.

### The Three Data Channels:

- **Channel 1 — Via Connector (Pull-Based)**: Source Tool (e.g. HubSpot) $\rightarrow$ Nango OAuth $\rightarrow$ Schema Ingress validation $\rightarrow$ Loader $\rightarrow$ Normalizer $\rightarrow$ D1 `spine_vault` (AES-256-GCM encrypted).
- **Channel 2A — Via MCP (API Wrapper)**: Raw unstructured push data transits loader and normalizer before spine insertion.
- **Channel 2B — Via MCP (Structured)**: EXTERNAL clients (Claude, ChatGPT, 3rd-party agents) query `mcp.integratewise.ai` directly to read D1 `spine_vault` and write via `memory.propose` (bypassing normalizers). The Twin/Agent Zero does NOT use this path — it reads via the IW Continuity Bridge (`continuity-tool-server → pipeline`); MCP is the external door.
- **Channel 3 — Knowledge Ingestion**: Document uploads/Slack threads run through the Knowledge service, creating `context_extractions` in R2 and AI Search. This enriches Entity 360 but does not write to Spine.

### Cloudflare Queues — Pipeline message processing

| Queue              | Purpose                        | Producer                | Consumer      |
| ------------------ | ------------------------------ | ----------------------- | ------------- |
| PIPELINE_QUEUE     | 8-stage normalization          | Loader, Webhook Ingress | Normalizer    |
| KNOWLEDGE_QUEUE    | Context extraction + embedding | Normalizer (S8)         | Knowledge     |
| INTELLIGENCE_QUEUE | Signal processing              | Normalizer (S8)         | Intelligence  |
| SIGNAL_QUEUE       | Signal broadcasting            | Intelligence            | Workflow      |
| DLQ_QUEUE          | Dead letter (failed messages)  | Any stage on max retry  | Manual review |

**Integration best practices for Queues:**

- Idempotency: Every message has a content-hash dedup key. Same payload = same hash = skip processing.
- Retry: 3 retries with exponential backoff (30s, 60s, 90s) before DLQ.
- Message persistence: Failed messages go to DLQ_QUEUE with full context (stage, error, payload, trace_id, timestamp).
- Ordering: Not guaranteed. Each message is independent. Use version numbers for conflict resolution.
- Batch size: Consumer processes up to 10 messages per batch.

### Cloudflare KV — Edge cache (NOT source of truth)

| KV Namespace     | What it caches                            | TTL  | Source of truth              |
| ---------------- | ----------------------------------------- | ---- | ---------------------------- |
| RATE_LIMITS      | IP rate limit counters                    | 60s  | Ephemeral (no SSOT)          |
| SESSIONS         | Active session tokens                     | 24h  | `spine_vault` auth.sessions  |
| CONNECTOR_STATUS | Connector install status, tenant mappings | 5min | `spine_vault` connectors     |
| SIGNAL_CACHE     | Recent signals for fast read              | 60s  | `spine_vault` signals        |
| METRICS          | Service health metrics                    | 30s  | Ephemeral                    |
| WEBHOOK_LOG      | Webhook dedup keys                        | 24h  | Ephemeral (idempotency only) |

**Rule:** KV is a read-through cache. If KV misses, read from D1 `spine_vault`. Never write to KV as the primary store. KV data can be lost or evicted — that is fine because D1 has the truth.

### Cloudflare D1 — Edge operational DB (`spine_vault`)

- **Reads**: Twin (reads structured Spine context), human (browses metadata at `/memory`), gateway (resolves tenant ID).
- **Writes**: Pipeline (Spine writes), Tenants service (user/tenant credentials), Triage Bot (memory metadata).

| Usage                       | Purpose                                       | Source of truth                                 |
| --------------------------- | --------------------------------------------- | ----------------------------------------------- |
| Spine Storage               | Encrypted tenant entities, signals, and goals | D1 is authoritative for active operational data |
| Fingerprint dedup           | Content-hash keys for idempotency in pipeline | D1 is authoritative for dedup keys only         |
| Merge candidates            | Identity resolution candidate pairs           | D1 matches, Supabase mirrors candidate pairs    |
| AI memories (Flow C buffer) | Temporary storage before triage approval      | D1 is buffer, Supabase org_memory is truth      |

#### Two Operational Modes:

1. **Initial Users (CF Edge Stack only)**: D1 is the sole database. In case of D1 corruption, the system recovers by replaying JSONL backups stored in R2: `spine-backup/{tenant_id}/{date}.jsonl`.
2. **Promoted Users (Edge + Supabase)**: The Pipeline dual-writes to D1 and Supabase. Supabase acts as the Fortress database of record.

---

### Cloudflare R2 — File storage (Cold Store)

- **Reads**: Knowledge service (extracts content for embedding), human downloads. Twin **never** reads from R2 directly.
- **Writes**: Triage Bot (approved memory markdown content), Knowledge service (document uploads).

| Usage            | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| Document uploads | PDFs, images, exports stored in R2                             |
| Metadata         | Stored in D1 (context_extractions table) with R2 key reference |

---

### Cloudflare Vectorize — Semantic Index (AI Search)

- **Reads**: Twin (semantic queries for memory retrieval). **This is the only memory retrieval path for the Twin.**
- **Writes**: Triage Bot (indexes approved R2 entries), Knowledge service (indexes uploaded document embeddings).

#### R2 $\rightarrow$ Vectorize Reindexing Cron:

To mitigate non-atomic write failures across R2 and Vectorize, a daily scheduled cron job:

1. Scans R2 `memory/{tenant_id}/` keys.
2. Compares keys against Vectorize metadata `memory_id` entries.
3. Chunks, embeds, and indexes any missing R2 records into Vectorize.

---

### Cloudflare Durable Objects — Real-time coordination

| DO             | Purpose                                               |
| -------------- | ----------------------------------------------------- |
| SignalStreamDO | WebSocket/SSE broadcasting of live signals per tenant |
| PresenceDO     | User online/away/busy status                          |
| RoomDO         | Collaborative editing rooms                           |
| HITLGateDO     | Approval workflow state machine                       |

**Rule:** DOs coordinate real-time state. They do NOT store canonical data. Signal content is in Spine DB. Presence is ephemeral. HITL decisions are written to Spine DB governance_audit_log.

---

## Rule 4: PIPELINE PROCESSING — Full integration best practices

When data flows through the pipeline (Loader → Normalizer → Spine), these practices apply:

### Idempotency

- Every record gets a content-hash fingerprint at S1 (Analyze)
- Hash = SHA-256 of (tenant_id + entity_type + source + normalized_content)
- Before processing, check D1 for existing fingerprint
- If exists and version is not newer → skip (dedup)
- If exists and version is newer → process (update)
- If not exists → process (insert)

### Retry with backoff

- Each pipeline stage retries 3 times on failure
- Backoff: 30s → 60s → 90s (exponential)
- After 3 retries → message sent to DLQ_QUEUE
- DLQ message includes: stage name, error message, full payload, trace_id, timestamp, attempt count

### Dead Letter Queue (DLQ)

- DLQ_QUEUE receives all messages that fail after max retries
- DLQ messages are also written to `normalization_errors` table in Spine DB for dashboard visibility
- DLQ messages can be replayed manually via admin API
- DLQ retention: indefinite (until manually resolved)

### Version tracking

- Every entity gets a monotonic version number
- On conflict (two sources update same entity): highest version wins
- Version is incremented on every successful write to Spine
- Old versions are preserved in audit trail

### Trace correlation

- Every pipeline message carries a `correlation_id` (UUID)
- Same correlation_id flows through all stages: Loader → Normalizer S1-S8 → Spine write → Knowledge enqueue → Signal enqueue
- All logs, errors, and audit entries reference the correlation_id
- Enables end-to-end tracing of any record from ingestion to workspace view

### Schema-driven extraction

- S5 (Extract) only extracts fields defined in the tenant's schema (tenant_spine_config)
- Unknown fields are dropped — no data leakage
- Schema is resolved at S1 and flows through all stages
- If schema changes mid-pipeline, the message uses the schema version it started with

---

## Summary: Decision Matrix

| Operation                                      | Layer                           | Why                                            |
| ---------------------------------------------- | ------------------------------- | ---------------------------------------------- |
| Read entities for workspace views              | Spine DB direct                 | RLS handles security, zero Worker overhead     |
| Read signals, goals, memories                  | Spine DB direct                 | Same reason                                    |
| Realtime updates (new signals, entity changes) | Spine DB Realtime               | Built-in, no custom WebSocket needed           |
| Dashboard projections                          | Spine DB RPC (stored functions) | Complex aggregations run in DB, not in Workers |
| Create/update entities                         | Gateway API                     | Needs validation, pipeline, audit              |
| Approve/reject actions                         | Gateway API                     | Needs Govern check, multi-table write          |
| Connect/disconnect tools                       | Gateway API                     | Needs OAuth, connector service                 |
| Pipeline processing                            | Cloudflare Queues               | Async, retryable, with DLQ                     |
| Dedup/fingerprinting                           | Cloudflare D1                   | Edge-local, fast lookup                        |
| Rate limiting, session cache                   | Cloudflare KV                   | Ephemeral, edge-local                          |
| File storage                                   | Cloudflare R2                   | Blob storage, metadata in Spine DB             |
| Live signal broadcasting                       | Durable Objects                 | Real-time coordination                         |
| Auth (login, signup, OAuth)                    | Spine DB Auth direct            | Already implemented                            |

---

## What Changes in the Frontend

The current `useWorkspaceEntities` hook calls Gateway API for reads. This should be changed to query Spine DB directly:

**Current (wrong — 3 hops):**

```
useWorkspaceEntities("task_item")
  → apiFetch("/api/v1/workspace/entities?entity_type=task_item")
    → Gateway Worker
      → Spine-v2 Worker
        → Spine DB
```

**Correct (direct — 1 hop):**

```
useWorkspaceEntities("task_item")
  → spineDb.from("entities").select("*").eq("entity_type", "task_item")
    → Spine DB (RLS scoped)
```

This eliminates 18 API calls per workspace load and replaces them with direct DB queries that are faster, cheaper, and more reliable.

**Writes stay through Gateway:**

```
createEntity(data)
  → apiFetch("POST /api/v1/workspace/entities", data)
    → Gateway → validation → Spine write → audit → downstream
```

---

_This document is the architectural law for data access. If you are reading data for a view, go to Spine DB. If you are writing data that has side effects, go through Gateway. If you are processing pipeline messages, use Cloudflare Queues with idempotency, retry, and DLQ. No exceptions._
