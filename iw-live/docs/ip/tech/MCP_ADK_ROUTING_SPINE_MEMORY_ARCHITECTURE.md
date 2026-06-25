# IntegrateWise — MCP + ADK + Routing + Spine Cache + Memory Architecture

> **Date:** 2026-06-09 | **Authority:** Nirmal (Founder) | **Version:** 1.2
> **Status:** Canonical | LIVE — MCP server (20 tools), Spine, and memory loop responding
> **Scope:** The read/consumption stack and the governed write stack, end to end.
> Companion to `docs/ARCHITECTURE_AND_DATA_FLOW.md` (system-wide flow) and
> `ARCHITECTURE_DECISIONS.md` (decision log).

---

## Changelog

**v1.2 (2026-06-09) — Codebase Mapping & Implementation Status**

- Mapped the architectural layers (ADK, MCP, Spine, Registry Cache, A2A/LLM Communication, Session Logs, and Voice) to their actual locations in the repository.
- Documented implementation status and client/server mechanics for each component.

**v1.1 (2026-06-09) — Clarified Canonical Architecture**

- Completed Sections 3–8 covering the governed write flow and execution path.
- Clarified Supabase is **usage-allocated** (promoted tenants only). Initial users run edge-only on D1; Supabase is a usage-earned durability upgrade, not a base dependency. Added §7.7 Tenant storage tiers.
- Standardized the canonical tool count to **20** across all architecture documents.
- Clarified the Continuity Bridge ↔ MCP relationship:
  - MCP is the interface.
  - Continuity Bridge is the composed product.
  - Internal access via `continuity-tool-server`.
  - External access via `mcp.integratewise.ai`.
- Clarified ADK placement above Gateway:
  - Stateless capability resolution only.
  - No tenant access. No data access. No I/O before Gateway authorization.
- Clarified Gateway responsibility:
  - Request assembly (auth + tenant + policy envelope).
  - Data context remains the responsibility of Spine Cache.
- Removed duplicate explanatory notes introduced during parallel edits.
- Aligned the architecture narrative with the rendered system diagram.

**v1.0 — Initial Canonical Architecture**

- Layered model, hard boundaries, and the five walls.

---

## 0. The One Sentence

The LLM never reads from tools. The LLM never reads from Main Memory.
The LLM only ever reads from **Spine Cache**, assembled on demand from Main
Memory, delivered via **MCP**, resolved by the **ADK** against the tenant's
schema. Tools push to Spine once. Agents pull from Spine forever.

> The product is the **IW Continuity Bridge**. MCP + ADK + Gateway + Spine
> Cache + Memory are the layers that make the Bridge work. Connect an AI to the
> Bridge once; every authorized source becomes normalized, governed, and
> remembered. M×N tool connections collapse to 1:N.

---

## 1. The Layered Model (canonical)

Two directions of flow over the same layers. Read them separately.

```
              ┌────────────────────────────────────────────┐
              │                   LLM                       │
              │   (Twin runtime — Open WebUI, model-        │
              │    agnostic: Grok / Claude / GPT / local)   │
              └─────────────────────┬──────────────────────┘
                                    │
              ┌─────────────────────▼──────────────────────┐
              │                   ADK                       │
              │   Capability resolution. Planning hints.    │
              │   Stateless. No memory. Zero I/O.           │
              └─────────────────────┬──────────────────────┘
                                    │
              ┌─────────────────────▼──────────────────────┐
              │                 GATEWAY                     │
              │   Auth · Policy · Routing · Rate limiting   │
              │   Tenant resolution · Request assembly      │
              └─────────────────────┬──────────────────────┘
                                    │
              ┌─────────────────────▼──────────────────────┐
              │           MCP INTERFACE (3 channels)        │
              │   Memory MCP   Session MCP   Tool MCP       │
              └─────────────────────┬──────────────────────┘
                                    │
              ┌─────────────────────▼──────────────────────┐
              │                SPINE CACHE                  │
              │   Prepared AI data context (fast, <10ms)    │
              │   D1 edge · KV · Vectorize / AI Search      │
              └─────────────────────┬──────────────────────┘
                                    │
              ┌─────────────────────▼──────────────────────┐
              │                MAIN MEMORY                  │
              │   Durable record of truth (never queried    │
              │   directly by agents)                       │
              │   Supabase (fortress) · R2 (raw) ·          │
              │   D1 metadata · filesystem vault            │
              └─────────────────────────────────────────────┘
```

- **CONSUMPTION PATH (LLM reads context):**
  `Main Memory → Spine Cache → MCP → Gateway → ADK → LLM`
- **WRITE PATH (data + knowledge enters):**
  `Tool → Nango → Connector → Loader → Normalizer → [Governance] → Main Memory + Spine Cache → MCP invalidation`

The Gateway is **first** on the inbound (write) direction and **between MCP and
ADK** on the outbound (LLM-initiated) direction. Both are correct; they are
different directions of the same pipe.

> **How this maps to the IW Continuity Bridge.** This document describes the
> _internal composition_ of the Bridge. The Twin's runtime client — the
> `continuity-tool-server` — is what speaks the Memory/Session MCP channels into
> `services/pipeline` and the Spine Cache. So "the LLM reads via MCP" (this doc)
> and "the Twin reads via the IW Continuity Bridge" (`ARCHITECTURE_AND_DATA_FLOW.md`)
> are the same statement at two levels of zoom: MCP is the _interface_, the
> Continuity Bridge is the _composed product_. The public `mcp.integratewise.ai`
> endpoint is the same interface exposed to **external** agents (Claude, ChatGPT)
> that live outside the Bridge.

**ADK before Gateway is safe.** On an LLM-initiated call the first hop is ADK,
which sits "above" Gateway in the diagram. ADK does zero I/O and holds no state —
it only resolves a capability name to an implementation and emits planning hints.
No tenant data is touched and no side effect occurs until the request crosses the
Gateway, where auth, tenant resolution, and policy are enforced. Capability
resolution on an unauthenticated request reveals nothing and changes nothing.

**The Bridge ↔ MCP relationship (reconciles `ARCHITECTURE_AND_DATA_FLOW.md`).**
The product is the IW Continuity Bridge. MCP is the _internal interface_ the
Bridge exposes; it is not a separate product. The Twin reaches this interface
through its `continuity-tool-server`, which is the Twin's MCP/Session client into
the Bridge (`continuity-tool-server → pipeline → Spine Cache`). The public
endpoint `mcp.integratewise.ai` is the _same interface_ exposed to EXTERNAL
agents (Claude, ChatGPT). So: Twin → Continuity Bridge (internal MCP/Session
channel); external agents → `mcp.integratewise.ai` (public MCP). One interface,
two doors. No contradiction.

---

## 2. Layer Responsibilities (hard boundaries)

```
MAIN MEMORY        Durable, governed, versioned, complete. Append-oriented.
                   Never queried directly by an LLM or agent.
                   = R2 (raw content, backups, spine-backup JSONL)
                   + D1 (durable metadata + record of truth for edge-only tenants)
                   + filesystem vault (.iw-memory dual-write)
                   + Supabase (fortress) — USAGE-ALLOCATED, promoted tenants only
                     (see §7.7; initial users do NOT get Supabase)

SPINE CACHE        Prepared DATA context built for agent consumption. Fast (<10ms).
                   Rebuildable from Main Memory. Safe to evict.
                   = D1 edge (spine_vault, encrypted) + KV (hot) + Vectorize/AI Search

MCP INTERFACE      Three channels, one protocol. The only surface an agent calls.
                   Memory MCP · Session MCP · Tool MCP.

GATEWAY            Auth, policy enforcement, routing, rate limiting, tenant
                   resolution, REQUEST assembly (auth + tenant + policy envelope).
                   NOT governance. NOT data context (that is Spine Cache).

ADK                Capability → implementation resolution. Schema validation
                   for spine.entity.*. Stateless. Zero I/O. No persistent memory.

LLM / TWIN         Reasoning runtime. Reads Spine Cache only. Proposes, never
                   writes to Spine. Model is a parameter.
```

**The walls that must never be crossed:**

1. LLM ↔ Tools: NEVER direct (once a tool is connected, Spine is the query target).
2. LLM ↔ Main Memory: NEVER direct (only Spine Cache).
3. ADK ↔ State: NEVER (ADK is stateless; planning is hints, not memory).
4. Agent ↔ Spine write: NEVER direct (propose → govern → Pipeline writes).
5. Chat ↔ Approval: NEVER. Approval is the **U4 Decide** stage; its UI is surfaced
   on the **S2 Awareness** surface, never in S3 Twin chat/voice — chat is not an audit trail.

---

## 3. MCP Interface — Three Channels

MCP is not one thing. Memory queries, session-state queries, and tool execution
are fundamentally different operations that happen to share a protocol.

```
MEMORY MCP        Reads institutional knowledge. Semantic.
                  Source: Vectorize / AI Search (inside Main Memory).
                  Tools: memory.search_org, memory.read_conversational,
                         memory.read_personal
                  Caching: NONE for org memory reads — always fresh
                  (post-promotion entries must be visible immediately).

SESSION MCP       Reads current working state. Operational.
                  Source: KV + D1 (Spine Cache).
                  Tools: signal.list, spine.entity.get, spine.entity.list,
                         spine.entity.search, task.list
                  Caching: KV hot cache, 30–300s TTL.

TOOL MCP          Executes capabilities. Governed.
                  Tools: memory.propose, memory.write_conversational,
                         proposal.approve*, proposal.reject*, task.dispatch,
                         connector.write, book.*, kb.*
                  Writes route through governance. Never direct to Spine.
                  (* approval EXECUTION is governed; the approval DECISION UI
                     is L2-only, never chat — see §2 wall 5.)
```

### MCP access (live) — Native OAuth 2.0 (deployed June 9, 2026)

```
Endpoint:       https://mcp.integratewise.ai
Protocol:       POST /  = MCP JSON-RPC protocol (no /mcp suffix needed)
                GET /   = server info

OAuth Discovery: https://mcp.integratewise.ai/.well-known/oauth-authorization-server
Token Endpoint:  https://mcp.integratewise.ai/oauth/token
JWKS:            https://mcp.integratewise.ai/.well-known/jwks.json

Grant Types:    authorization_code, client_credentials, refresh_token
Token Format:   RS256 JWT (1hr access, 30d refresh)
Scopes:         mcp:tools, mcp:resources, tenant:read, tenant:write, memory:read, memory:write
Client Registry: D1 oauth_clients table (integratewise-spine-cache)
Scope Enforcement: per-tool filtering in oauth-scopes.ts

Tool count:     20 (memory.* · spine.* · signal.* · task.* · proposal.* · book.* · kb.*)
```

Any MCP-compatible AI client (Claude, ChatGPT, Cursor, Kiro, Perplexity) connects
via standard OAuth 2.0. No CF-Access-Client-Id/Secret workaround required — the
MCP server now implements native OAuth endpoints directly.

> **SECURITY:** OAuth client secrets and signing keys are referenced by name only.
> They live in Cloudflare Secrets Store (D1 for client registry). Never commit
> secret values, never echo them in chat or logs.

### Token exchange gate

The Gateway validates RS256 JWT tokens at the edge for `mcp.integratewise.ai`
traffic, enriches headers (tenant, scopes), and forwards to the MCP connector via
service binding. This enforces the capability contract at the protocol boundary —
preventing an agent from bypassing the ADK and hitting a service directly.

---

## 4. Gateway — Policy, Not Governance

```
GATEWAY DOES:
  • Auth: validate RS256 JWT (OAuth 2.0 tokens from mcp.integratewise.ai)
  • Tenant resolution: inject x-tenant-id on every downstream call
  • Policy enforcement: is THIS agent authorized to see THIS data? (plan tier)
  • Routing: bind to downstream workers (pipeline, intelligence, knowledge, connector)
  • Rate limiting
  • Context assembly: stitch Entity 360 (Spine + Memory + Signals) for a read

GATEWAY DOES NOT:
  • Govern memory promotion (that's Triage Bot / Governance layer)
  • Write to Spine (that's Pipeline)
  • Hold tool credentials (those are in Nango)
```

### Resilience (single-point mitigations)

```
  • CF Workers global redundancy: 300+ edge locations, stateless by design
  • KV-cached tenant resolution: buffers a D1 hiccup
  • On binding timeout: return 503 + Retry-After; ADK circuit breaker trips
  • Fallback read path exists at the ADK layer (see §5 fallback chain)
```

---

## 5. ADK — The Capability Resolver (the MuleSoft of AI)

MuleSoft: stable API contract (RAML) + swappable routing (Anypoint) + changing
backends. IntegrateWise applies the same one layer up: stable **capability
contract** (MCP tools) + swappable routing (ADK) + changing Spine/Memory/services.

The client declares a _capability it needs_; it never names an implementation.
If storage or a connector changes, the ADK resolves differently and the client
is unchanged. The contract holds.

### 5.1 Capability grammar

```
Format:  <domain>.<resource>.<operation>

domain      ∈ { spine, memory, signal, task, proposal, connector }
resource    ∈ { entity, memory, signal, task, proposal, connector }
operation   ∈ { get, list, search, create, write, propose,
                approve, reject, dispatch }

Examples:
  spine.entity.get        spine.entity.list     spine.entity.search
  spine.entity.create     memory.search_org     memory.propose
  memory.write_conversational                    signal.list
  task.dispatch           proposal.approve       proposal.reject
  connector.write
```

Schema validation (§5.4) applies to `spine.entity.*` ONLY. `memory.*`,
`signal.*`, `task.*`, `proposal.*` are schema-agnostic and bypass it.

### 5.2 Resource types (8)

```
1. entity      Person, Company, Opportunity, Account, ...
2. activity    Calls, emails, meetings, touches
3. event       State changes, webhooks, transitions
4. metric      ARR, health, scores, counts
5. file        R2 objects (documents, attachments)
6. task        Work items, dispatched jobs
7. proposal    Governance queue items
8. memory      Governed Vectorize/AI Search entries
               (distinct from file: different storage, governance, retrieval;
                reads ALWAYS fresh — never KV-cached)
```

### 5.3 Route destination types (4)

```
LOCAL_D1        D1 edge read (Spine Cache). entity/signal/task lookups.
VECTOR_INDEX    Vectorize / AI Search. memory.* semantic reads.
REMOTE_WORKER   Service binding (intelligence, knowledge, connector).
NANGO_PROXY     Live pass-through to a tool via Nango token (rare; write/act).
```

### 5.4 Schema binding — dynamic, not static

The ADK binds to the existing schema system in `@integratewise/types`
(`DOMAIN_SPINE_CONFIG` + `INDUSTRY_SPINE_BASE` via `SchemaAccessor`):
**12 departments × 11 industry overlays, 130+ canonical entity types.**

> Superseded: the early static "8 resource types × 18 traits" model was
> CS-biased. Traits are now the `priority_fields` of each canonical entity type,
> resolved per the active tenant's department + industry. One schema definition,
> one place to update, all departments inherited automatically. (This is the
> DataWeave equivalent — the repeatable normalization IP.)

```
v1 resolution mode: static.
  SchemaAccessor() with no KV/DB params resolves from DOMAIN_SPINE_CONFIG +
  INDUSTRY_SPINE_BASE in-process. Zero network cost. Schema changes ship on
  redeploy. resolveSchema(tenantId, department, industry) is async by
  signature but resolves synchronously in static mode.

  IMPORTANT: resolveSchema MUST apply BOTH the department config AND the
  industry overlay. A Healthcare CS tenant must not be validated against the
  SaaS CS schema. Cross-industry overlay is mandatory (see test matrix §10).
```

### 5.5 Field policy

```
READS:   STRIP fields not in the tenant's priority_fields from the response.
WRITES:  REJECT (400) unknown fields in the write payload.
         Prevents context pollution at the ingress point.
```

### 5.6 Resolution algorithm

```
1. Parse capability → { domain, resource, operation }
2. Load tenant config from KV (5-min TTL): plan_tier, domain_key, industry_overlay
3. PLAN GATE: plan_tier >= capability.min_tier ?
      No  → 403 PLAN_INSUFFICIENT { upgrade_url }
4. SCHEMA (spine.entity.* only):
      schema = SchemaAccessor.resolveSchema(tenant, domain_key, industry_overlay)
      validate entity_type ∈ schema ; filter/reject fields per §5.5
5. CONNECTOR STATUS (capabilities needing a connector):
      not_connected   → 403 CONNECTOR_NOT_AVAILABLE { connect_url }
      syncing_initial → 202 CONNECTOR_SYNCING { syncing:true, progress, data:nulls }
      sync_complete   → proceed
6. ROUTE to destination (LOCAL_D1 → ... → fallback chain)
7. Return typed CapabilityResponse
```

### 5.7 Fallback chain (reads)

```
D1 index lookup → D1 full scan → Supabase (PROMOTED tenants only) → 404
  (Pipeline is NEVER a read fallback — it is the write service only.)
```

### 5.8 Tiered TTL

```
Capability registry (what capabilities exist)     24h    — changes on deploy
Tenant capability config (what this tenant can do) 5min   — changes on upgrade/connect
CONNECTOR_STATUS (what's live right now)           30s    — changes during sync
Org memory reads                                   none   — always fresh
```

### 5.9 Failure taxonomy (every consumer handles these identically)

```
404 CAPABILITY_NOT_FOUND     Not in registry. Do not retry.
403 PLAN_INSUFFICIENT        Tier too low. Response carries upgrade_url.
403 CONNECTOR_NOT_AVAILABLE  Not connected. Response carries connect_url.
202 CONNECTOR_SYNCING        Connected but syncing_initial. Cached/placeholder
                             data + syncing:true. NEVER fabricated metrics —
                             computed fields are null with a "syncing" note.
503 RESOLVER_DEGRADED        KV + D1 fallback failed. Retry-After header.
                             Gateway circuit breaker trips.
```

### 5.10 Min-tier map (capability gating)

```
FREE:       spine.entity.get/list (read-only, limited routes), 1 connector
STARTER:    + signal.list, basic Twin (Mode A), 3 connectors
PRO:        + memory.search_org, memory.propose, proposal.*, connector.write,
            CF Workflows, full Twin (Mode B), unlimited connectors, full memory
ENTERPRISE: + external LLM MCP endpoint per tenant, custom domain, multi-workspace
```

> `connector.write` min_tier = **pro** (NOT enterprise). Pro users must be able
> to execute approved Twin proposals or the governance loop breaks for the
> largest non-enterprise segment. Enterprise gates the external MCP endpoint.

---

## 6. Spine Cache — Prepared Context

Spine Cache is everything between Main Memory and the MCP interface. It exists
so the LLM gets sub-10ms, normalized, assembled context without ever touching
the durable record.

```
D1 (integratewise-spine-cache)   Read-optimized Spine + Memory mirror.
  spine_vault                    Entities, encrypted (AES-256-GCM, opaque k,v,t,c).
                                 SPINE_ENCRYPTION_KEY in CF Secrets.
  org_memory (metadata)          governance_state: staging|approved|published
  conversational_memory          Twin chat sessions
  signals                        time-ordered state changes
  tenant_spine_config            per-tenant entity manifest (from onboarding)

KV
  CACHE                          hot entity cache, 60–300s
  SIGNAL_CACHE                   signal cache
  METRICS                        counters
  (tenant resolution cache)      buffers D1 hiccups

Vectorize / AI Search            semantic index over governed memory
  AI_SEARCH (bge-base, free)     auto-embed; the Twin's institutional recall
```

**Entity 360** is the assembly moment: Spine (operational truth from D1) +
Memory (institutional knowledge from Vectorize/AI Search) + Signals (time-ordered
recent events) composed into one session view, served via Session MCP.

```
Spine wins on conflict. If a cache mirror (e.g. an OWUI Knowledge collection)
disagrees with org_memory in D1/Supabase, the durable record is correct.
Cache layers are retrieval accelerators, never sources of truth.
```

### CONNECTOR_STATUS state machine

The cache's freshness depends on connector lifecycle. The frontend and the ADK
both read this.

```
not_connected
   → oauth_pending          (Nango flow open)
   → oauth_complete         (token held; first sync not started)
   → syncing_initial        (creamy layer: 5 records in flight — show progress)
   → sync_complete          (Spine has data — dashboard/Entity 360 may load)
   → syncing_delta          (background 5-min cron — transparent to user)
   → sync_error             (failed — surface which stage)

Stored in KV CONNECTOR_STATUS. "connected" and "data-populated" are different
states — this distinction prevents the "connected but empty Entity 360" bug.
```

---

## 7. Memory Architecture

### 7.1 Three memory types

```
conversational_memory   Raw sessions (Twin, external LLM, manual). role: user|assistant|system.
                        THE SOURCE. Everything else derives from here.
org_memory              Promoted institutional knowledge — DERIVED from conversational_memory
                        via propose → govern (§7.2). NEVER written directly.
                        governance_state: staging|approved|published.
personal_memory         Behavioral patterns. category: preference|behavior|context|decision.

Lineage (one direction):
  conversation → conversational_memory → propose → Triage → org_memory
              → (projection) → docs / Entity 360 / AI Search index
  org_memory is always a governed promotion of conversational_memory. No agent or
  human writes org_memory directly; it is earned through governance.

All: tenant_id isolation · pgvector / Vectorize similarity.
Edge-only tenants: these live in D1 + Vectorize. Promoted tenants additionally
mirror to Supabase memory.* (RLS-enabled) as the durable record. See §7.7.
```

### 7.2 The memory loop (Flow C — governed)

```
1. CAPTURE   Any conversation → memory.write_conversational → conversational_memory
2. IDENTIFY  Twin spots something worth keeping (decision, pattern, commitment, learning)
3. PROPOSE   memory.propose → proposals (D1) → Triage Bot queue
4. GOVERN    Triage Bot scores (confidence · relevance · risk · conflict · quality):
                ≥ 0.85          → auto-approve
                0.60 – 0.84     → HITL (human review in L2)
                < 0.60          → reject
5. STORE     Approved → DUAL-WRITE to:
                R2 (raw) + AI Search (embedded) + D1 (record of truth) + filesystem vault (.iw-memory)
                + Supabase org_memory — ONLY for promoted tenants (see §7.7)
6. RETRIEVE  Next session: Twin reads via Memory MCP (semantic). Entity 360 intersects with Spine.

LOOP CLOSES. Knowledge compounds. Nothing starts cold.
```

### 7.3 Personal memory auto-promotion (precise rule)

```
Candidate surfaces when the SAME behavioral pattern appears in 5+ DISTINCT
sessions within a rolling 30-day window, at confidence ≥ 0.70. Then it enters
the propose → govern path like any other promotion. (Not "after 5 sessions.")
```

### 7.4 Initial / bulk load scoring (not flat 0.85)

```
Run a cleaner pass FIRST (normalize, extract, quality-score). Then base
confidence by document category, not a blanket value:
  architecture/  → 0.90   transcripts/ → 0.70   notes/ → 0.75
Propose only above a quality threshold. Route via BULK_MEMORY_QUEUE
(separate from pipeline-process; max ~10 concurrent; lower priority than live
ops) so bulk promotion never creates backpressure on the live loop.
```

### 7.5 No-archive rule (constitutional)

```
The Knowledge Store has no archive folder. Content is:
  • active, or
  • superseded (with lineage to the superseding entry), or
  • rejected (with reason).
AI may never dump content into an archive. It proposes UPDATE or SUPERSEDE —
never hides content. (Constitutional rule D-2026-06-05-013.)
```

### 7.6 Durability & repair (Main Memory)

```
D1-FIRST tenants (edge-only): Pipeline appends every Spine write to
   R2: spine-backup/{tenant_id}/{date}.jsonl  → replay path if D1 is lost.
   (Define retention: e.g. 30 daily snapshots, weekly beyond.)

PROMOTED tenants: D1 rebuildable from Supabase fortress.

REINDEX JOB (R2 ↔ Vectorize consistency — runs both directions):
   FORWARD: R2 keys missing from Vectorize → re-chunk, re-embed, re-index.
   REVERSE: Vectorize memory_ids missing from R2 → reconstruct if possible,
            else flag "orphaned — content unrecoverable" for human review.
   Idempotent. Trigger: daily cron (owning worker pinned) + on-demand admin endpoint.
```

### 7.7 Tenant storage tiers — Supabase is usage-allocated, not default

Supabase (the fortress / durable relational record of truth) is **not** handed to
every tenant. It is **allocated based on usage**. Initial users run entirely on the
Cloudflare edge; Supabase is provisioned only when a tenant is **promoted**.

```
EDGE-ONLY (default — every new / initial user):
  Storage:   D1 (record of truth for this tenant) + KV + R2 (spine-backup JSONL)
             + Vectorize / AI Search (memory).
  Supabase:  NONE. Not provisioned. Not required.
  Durability: R2 spine-backup/{tenant_id}/{date}.jsonl is the replay path.
  Rationale: low cost, instant, full product works at the edge.

PROMOTED (usage-allocated — graduated tenants):
  Trigger:   crossing a usage threshold — data volume, retention need,
             compliance/audit requirement, or plan tier (typically Pro+).
  Storage:   EDGE-ONLY stack, PLUS Supabase (memory.* + relational fortress)
             added as the durable record of truth + cross-region sync.
  Durability: D1 becomes rebuildable from the Supabase fortress.
  Writes:    dual-write begins (edge + Supabase via the CF MCP Worker, the
             sole Supabase credential holder).

PROMOTION (one-way, governed):
  Edge-only → Promoted is a backfill: replay R2 spine-backup + D1 into Supabase,
  then enable dual-write. No tenant is downgraded automatically.
```

> **Rule:** never describe Supabase as a dependency of the base product. The base
> product is edge-native. Supabase is a usage-earned durability upgrade. An
> edge-only tenant is fully functional with zero Supabase footprint.

```
Pipeline is the sole writer to SPINE tables.
Tenants service writes TENANT / USER / WORKSPACE tables.
Triage Bot writes MEMORY METADATA tables.
No other service writes to D1 for any purpose.

All Spine writes terminate at the CF MCP Worker — the ONLY holder of the
Supabase credential. Writes go: CF Worker → CF MCP Worker → Supabase → propagate to D1/KV.
```

---

## 9. The Spine Abstraction Principle (the moat)

```
BEFORE:  Claude → Tool A (direct, stateless), Claude → Tool B (direct) ...
         3 agents × 10 tools = 30 connections. No shared truth. No memory.

AFTER:   All tools → Spine (normalize once).
         Claude → Spine (never touches the tool).
         Any agent → Spine via the Continuity Bridge.
         10 tools × 1 Spine = 10 connections, forever. One truth, shared memory.

CONTINUITY BRIDGE WEDGE:
  An AI already connected to N tools connects to the Bridge ONCE. Every
  AUTHORIZED source it touches becomes normalized + governed + remembered.
  No migration. No tool replacement. One connection improves everything.

CASE TREE (agent asks "what is Acme's MRR?"):
  Connected, in Spine        → MCP → ADK → D1 → answer (<10ms). Tool untouched.
  Connected, sync 8m old     → KV cache returns last-synced state. Spine is truth.
  NOT connected              → 403 CONNECTOR_NOT_AVAILABLE { connect_url }.
                               Agent CANNOT route around Spine to the tool.
  Connected, unauthorized    → 403 PLAN_INSUFFICIENT { upgrade_url }.

Tool identity dies at the Normalizer. After Stage 8, the source tool name no
longer exists in the data. Spine stores the nature, not the label.
```

---

## 10. Build & Verification

### 10.1 Build order (do not invert)

```
Phase 1  packages/adk/          CapabilityRequest/Response, RouteResolver,
                                KV cache wrapper (3 TTL tiers), CapabilityResolver.
                                Static SchemaAccessor binding. Unit tests pass.
Phase 2  services/gateway/      Resolver middleware. plan_tier gate.
                                Intercept /api/v1/capabilities/* and MCP /tools.
                                Inject validated headers; prune/reject per §5.5.
Phase 3  Fallback modes         CONNECTOR_STATUS handling; D1 index → scan →
                                Supabase (promoted) → 404 chain.
Phase 4  E2E                    Live connector via NANGO_PROXY vs D1 cache hit.
```

Gateway middleware comes ONLY after the package builds clean and tests pass.

### 10.2 Cross-industry test matrix (mandatory)

```
CUSTOMER_SUCCESS × SAAS        → standard CS entities + priority_fields
CUSTOMER_SUCCESS × HEALTHCARE  → patient/provider entities (overlay applied)
FINANCE × SAAS                 → subscription / MRR entities
FINANCE × RETAIL               → inventory / POS entities
```

Passing all four proves `resolveSchema` applies the industry overlay, not just
the department config.

### 10.3 End-to-end demo checks (Twin via MCP)

```
1. "What is the Spine Abstraction Principle?"   → Memory MCP (org/AI Search)
2. "What ADK decisions were made?"              → org_memory governance entries
3. "What is Acme's health score?"               → Session MCP → Spine D1
4. "Good morning, brief me."                    → Entity 360 assembly (Spine+Memory+Signals)
```

---

## 11. Live State & Codebase Mapping (as of June 9, 2026)

The architecture is fully implemented across the following codebase locations:

### 11.1 Component Directory Map

| Architectural Layer           | Implementation Directory                                                                        | Active Status | Files & Entrypoints                                                                                                                                                                                              |
| :---------------------------- | :---------------------------------------------------------------------------------------------- | :------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ADK (Capability Resolver)** | [packages/adk](file:///Users/nirmal/Github/integratewise-live/packages/adk)                     | Fully Active  | [`registry.ts`](file:///Users/nirmal/Github/integratewise-live/packages/adk/src/registry.ts), [`resolver.ts`](file:///Users/nirmal/Github/integratewise-live/packages/adk/src/resolver.ts)                       |
| **MCP Tool Server**           | [services/mcp-connector](file:///Users/nirmal/Github/integratewise-live/services/mcp-connector) | Fully Active  | [`index.ts`](file:///Users/nirmal/Github/integratewise-live/services/mcp-connector/src/index.ts), [`tools.ts`](file:///Users/nirmal/Github/integratewise-live/services/mcp-connector/src/handlers/tools.ts)      |
| **Registry & Spine Cache**    | [packages/adk/src](file:///Users/nirmal/Github/integratewise-live/packages/adk/src)             | Fully Active  | [`agent-registry.ts`](file:///Users/nirmal/Github/integratewise-live/packages/adk/src/agent-registry.ts), [`spine-cache.ts`](file:///Users/nirmal/Github/integratewise-live/packages/adk/src/spine-cache.ts)     |
| **Spine & Normalizer**        | [services/pipeline](file:///Users/nirmal/Github/integratewise-live/services/pipeline)           | Fully Active  | Normalizer pipeline [`src/index.ts`](file:///Users/nirmal/Github/integratewise-live/services/pipeline/src/index.ts), [`src/spine/`](file:///Users/nirmal/Github/integratewise-live/services/pipeline/src/spine/) |
| **Session Logs & Events**     | [services/continuity](file:///Users/nirmal/Github/integratewise-live/services/continuity)       | Fully Active  | [`src/index.ts`](file:///Users/nirmal/Github/integratewise-live/services/continuity/src/index.ts), `memory.session_events` in Supabase/D1                                                                        |
| **LLM Communication**         | [packages/lib](file:///Users/nirmal/Github/integratewise-live/packages/lib)                     | Fully Active  | Universal provider wrapper [`src/ai-provider.ts`](file:///Users/nirmal/Github/integratewise-live/packages/lib/src/ai-provider.ts)                                                                                |
| **A2A Communication**         | [services/intelligence](file:///Users/nirmal/Github/integratewise-live/services/intelligence)   | Fully Active  | Sync delegate [`agents/index.ts`](file:///Users/nirmal/Github/integratewise-live/services/intelligence/src/agents/index.ts), work-flows, and `http/mcp` client invocations                                       |
| **Voice Interface**           | External (twin.integratewise.ai)                                                                | Fully Active  | Managed via L3 Open WebUI + Grok-4.3 + Kokoro TTS / Whisper STT                                                                                                                                                  |

### 11.2 Verification Details

- **mcp.integratewise.ai:** Native OAuth 2.0 (RS256 JWT). POST / = MCP JSON-RPC protocol. OAuth discovery at `/.well-known/oauth-authorization-server`. Any MCP-compatible AI client connects via standard OAuth.
- **gateway.dev.integratewise.ai:** Active, routing all downstream services using D1/KV context enrichment.
- **packages/adk:** Unit tests and schema validator (`SchemaAccessor` with DOMAIN_SPINE_CONFIG) check out cleanly.
- **memory.read_conversational & search_org:** Integrated with Supabase/D1 and Vectorize semantic index.

WATCH ITEMS:
• OAuth client secrets: rotate via D1 oauth_clients table; RS256 signing key via CF Secrets Store.
• AI_SEARCH binding on pipeline: confirm full org-memory embed (paginate the
bulk reindex; partial index is worse than none).
• Frontend VITE_API_BASE_URL = https://gateway.dev.integratewise.ai (real Spine, no seed).
• R2 backup retention policy + reindex job owner/cron — pin before GA.

---

## 12. Decisions Referenced

```
D-2026-06-04-003..006   ADK capability resolver (capability→implementation)
D-2026-06-05-006        ADK binds DOMAIN_SPINE_CONFIG, not static 8×18
D-2026-06-05-007        connector.write min_tier = pro
D-2026-06-05-012        Unified agent memory referencing + fallback hierarchy
D-2026-06-05-013        No-archive rule (active / superseded / rejected only)
D-2026-06-06-003        Governance hard rule — approve UI in L2, never chat
```

---

_Normalize once, render anywhere. The LLM only ever sees Spine Cache._
_One Twin. One Spine. One Memory. One Bridge. One Loop._

---

## 3. The MCP Interface — Three Channels, One Protocol

MCP is the only surface an agent ever calls. It is split into three channels by
concern. All three share the same auth, the same tenant isolation, and the same
"read from Spine Cache, propose into governance" contract.

```
MEMORY MCP      Durable knowledge. Org memory, learnings, doctrine, decisions.
                Read: assembled from Spine Cache (semantic via AI Search).
                Write: PROPOSE only → Triage Bot → governed path.

SESSION MCP     Conversational continuity. The "did we talk about this" channel.
                Read: prior turns, session summaries, personal patterns.
                Write: append conversational turns (low-stakes, not governed).
                This is the Twin's continuity-tool-server channel.

TOOL MCP        Capability invocation. "Do a thing in the world."
                Read: entity state from Spine Cache (spine.entity.get, signal.list).
                Write: NEVER direct to Spine. Emits a PLAYBOOK or a PROPOSAL.
                Execution boundary applies (customer agent runs the playbook).
```

**Channel rules:**

- A read on any channel is served from **Spine Cache**, never Main Memory, never a tool.
- A write on Memory/Tool MCP is a **proposal**, not a commit. Only the Pipeline writes.
- Session MCP appends are the one low-stakes write that skips governance (they are
  conversational record, not institutional truth) but they still never touch Spine.
- All three channels are tenant-scoped by the `x-tenant-id` injected at the Gateway.

---

## 4. ADK — Capability Resolution (stateless)

The ADK (`@integratewise/adk`) turns a stable **capability name** into a concrete
**implementation** at call time. Tools change; capabilities do not.

```
LLM asks for:        capability = "entity.health.assess"
ADK resolves:        → implementation bound to tenant schema + plan tier
                     → returns { tool_ref, schema, planning_hints }
ADK does NOT:        call the tool, read memory, hold state, or authenticate
```

- **CapabilityRegistry** — the catalog of stable capabilities (the 20 MCP tools map here).
- **CapabilityResolver** — picks the implementation for this tenant/tier/context.
- **AgentRegistry** — which agent persona/skill owns which capability.
- **SpineCache (client)** — read-through helper; ADK hands the resolved ref down,
  it does not fetch.

Because the ADK is pure and stateless, it can run before the Gateway on
LLM-initiated calls (see §1). Resolution is hints; nothing is committed until the
Gateway authenticates and the request reaches MCP → Spine Cache.

---

## 5. Spine Cache — Build, Serve, Invalidate

Spine Cache is the **only** thing an agent reads. It is prepared context, not the
record of truth. If it is wiped, nothing is lost — it rebuilds from Main Memory.

```
BUILD (on demand or on write):
  Main Memory (D1 + R2 + Vectorize; Supabase for promoted tenants)
    → assemble Entity 360 (entity + relationships + signals + memory matches)
    → seal into D1 edge (spine_vault, AES-256-GCM) + KV (hot) + Vectorize index
    → ready to serve in <10ms

SERVE:
  MCP read → Spine Cache hit (KV first, D1 edge next, Vectorize for semantic)
    → never falls through to Main Memory on the hot path

INVALIDATE (on write path):
  Pipeline writes entity → KV CACHE key evicted for that entity
    → next read rebuilds that slice from Main Memory
    → SIGNAL_CACHE updated if state changed

EVICTION:
  KV TTL 60–300s (hot). D1 edge is durable mirror. Safe to evict anytime.
  Rebuild cost is bounded: one Entity 360 assembly per cold entity.
```

**Guarantee:** Spine Cache is always rebuildable and always behind MCP. No agent
ever sees a cache miss as an error — it sees a slightly slower read.

---

## 6. The Governed Write Path (propose → govern → write)

No agent writes to Spine. Ever. The only writer is the Pipeline. Everything an
agent "wants to remember" or "wants to change" is a **proposal** that must clear
governance first.

```
1. PROPOSE      Agent calls memory.propose / emits a Tool MCP proposal.
                → D1 proposals table (Triage Bot queue). Nothing is true yet.

2. GOVERN       Triage Bot (CF Workflow) scores confidence:
                   ≥ 0.85   auto-approve
                   0.60–0.84 HITL — surfaced in L2, NOT in chat
                   < 0.60   reject (with reason, no silent drop)

3. WRITE        On approve → Pipeline writes:
                   Main Memory: Supabase (truth) + R2 (raw) + D1 (metadata)
                                + filesystem vault (.iw-memory dual-write)
                   Spine Cache: rebuilt slice + MCP invalidation

4. NO ARCHIVE   A write is either ACTIVE, or SUPERSEDES a prior entry (with
                lineage), or is REJECTED (with reason). Nothing is hidden or
                dumped. (Constitutional rule D-2026-06-05-013.)
```

**Wall 5 restated:** approval is the **U4 Decide** stage, surfaced on the
**S2 Awareness** surface — never in S3 Twin chat. (S = system surface,
U = human stage; see `docs/tech/CANONICAL_TAXONOMY.md`.) Chat is not an audit
trail. A proposal approved in conversation is not approved.

---

## 7. The 20 Tools (capability surface)

Grouped by MCP channel. Names are the stable capability surface; the ADK binds
each to a tenant-specific implementation.

```
MEMORY MCP
  memory.search_org            semantic search over org memory
  memory.read_org              read a specific org memory entry
  memory.propose               propose a new/updated org memory entry (governed)
  memory.read_conversational   read prior conversational turns
  memory.write_conversational  append a conversational turn (low-stakes)
  memory.read_personal         read personal patterns/preferences
  memory.list_decisions        list governance decisions (lineage)

SESSION MCP
  session.get_context          assemble session context (continuity)
  session.summarize            summarize a session into a durable note (proposes)
  session.list_recent          recent sessions for this tenant/user

TOOL MCP
  spine.entity.get             read a single entity (Entity 360 slice)
  spine.entity.search          find entities by trait/type/relationship
  spine.relationship.list      graph relations for an entity
  signal.list                  time-ordered signals for an entity/tenant
  signal.get                   read a single signal
  proposal.create              create an action proposal (governed)
  proposal.status              check a proposal's governance state
  book.list                    book-of-projects entries (read)
  kb.search                    knowledge base semantic search
  playbook.handoff             emit a PLAYBOOK (JSON) for local execution
```

> Count check: this list is the canonical 20. Keep it in sync with
> `ARCHITECTURE_AND_DATA_FLOW.md` (MCP SERVER box) if tools are added or removed.

---

## 8. Failure Modes & Degradation

```
SPINE CACHE COLD/EVICTED   → rebuild from Main Memory. Slower read, never an error.
MAIN MEMORY UNREACHABLE    → reads still served from Spine Cache (last good state).
                             Writes queue; proposals hold in D1 until Supabase returns.
GOVERNANCE BACKLOG         → proposals wait in queue. Nothing auto-commits below 0.85.
                             No silent writes. The wall holds under load.
MCP AUTH FAILURE           → request rejected at Gateway. ADK hints already discarded
                             (zero I/O, nothing leaked).
NANGO TOKEN EXPIRED        → connector-sync refreshes; write path pauses for that
                             source only. Spine Cache serves last known entity state.
MODEL/LLM DOWN OR SWAPPED  → model is a parameter. Twin falls back to another model;
                             Spine Cache, MCP, and Memory are unaffected.
```

**Invariant under every failure:** an agent never reads stale-as-error, never
writes ungoverned, and never reaches a tool or Main Memory directly. The walls in
§2 hold even when components are degraded.

---

_The LLM reads Spine Cache. The Pipeline writes Main Memory. Governance stands
between them. The Bridge makes it feel like one mind._
