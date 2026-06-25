# IntegrateWise — Definitive System Flow

> Founder's design. Canonical. All code and docs must conform to this.
> Last updated based on complete architectural review conversation.

---

## Current Surface-Binding & MCP Nervous System Doctrine (v3.0)

- **MCP as the System Nervous System**: The Model Context Protocol (MCP) is not just a gateway or a set of wrappers; it is the primary communication fabric of IntegrateWise. All tool integrations, workflow triggers, memory access, and worker coordination occur via standard MCP schemas.
- **Loader & Normalizer Integration**: Loader and Normalizer are implemented as internal execution steps under the unified MCP framework, ensuring that any incoming data payload conforms to the system's strict protocol contracts before spine insertion.
- **Zero-Trust Database Isolation**: No agent, worker, or twin can write directly to the Supabase database. All database writes are delegated through the `PIPELINE` Fetcher binding's `/api/v1/db-proxy` endpoint, preserving complete tenant and schema boundaries.
- **Operational Workbench & Twin**: The primary human interface is the Operational Workbench with the collapsible Twin sidebar. The Twin generates playbooks (JSON action sequences) and context locally, and hands them off to the client environment for execution, enforcing a strict boundary on compute costs.
- **Triage Bot Sole Writer Rules**: Only the Triage Bot has write permissions to organizational and shared memory. All AI summaries and session learnings must route through the Triage Bot for confidence scoring and staging.

**Canonical architecture reference:** `docs/ARCHITECTURE_CANONICAL.md` — supersedes all prior descriptions.

---

## THE CORE LOOP

```
Load → Store → Think → Act → Govern → Repeat → Adjust
```

REPEAT only happens on structured data (Flow A). Not Flow B. Not Flow C.

---

## ONBOARDING — SCHEMA ACTIVATION

User selects Department + Industry during onboarding.

- `getSpineConfig(industry, department)` composes the final schema
- 12 domain base schemas × 11 industry overlays = adaptive by design
- Schema controls everything downstream: what Loader extracts, what Normalizer filters, what L1 shows, what L2 reasons over
- Writes: Spine DB `tenant_spine_config`

### 12 Domain Schemas

| Schema         | Department       | Entity types (examples)                                                                                                                                                          |
| -------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cs`           | Customer Success | account_master, success_plan, risk_register, engagement_log, renewal, stakeholder_outcome, initiative, capability, value_stream, api_portfolio, people_team, strategic_objective |
| `sales`        | Sales            | deal, opportunity, lead, pipeline_stage, quote, sales_sequence, call_log, competitor_intel                                                                                       |
| `marketing`    | Marketing        | campaign, audience, landing_page, email_campaign, social_post, ab_test, attribution_touchpoint, audience_segment                                                                 |
| `revops`       | RevOps           | quota, forecast, territory, comp_plan, revenue_metric, attribution, segment_rule                                                                                                 |
| `eng`          | Engineering      | sprint, incident, deploy, bug, release, repository, pull_request, deployment                                                                                                     |
| `product`      | Product          | feature, usage_metric, feedback, roadmap_item                                                                                                                                    |
| `support`      | Support          | ticket, csat, sla_policy, escalation, queue, agent_performance, knowledge_article                                                                                                |
| `finance`      | Finance          | invoice, payment, expense, budget, revenue_entry, tax_filing, financial_report, vendor, cost_center                                                                              |
| `it`           | IT Admin         | system, device, user, change_request, vulnerability, backup, certificate, network_device, license                                                                                |
| `bizops`       | BizOps           | activity, workflow, okr, cross_dept_initiative, ops_metric                                                                                                                       |
| `procurement`  | Procurement      | purchase_order, spend_category, savings_initiative, approval_request, compliance_check                                                                                           |
| `industry_edu` | Education        | course, assignment, grade, attendance, discussion, learning_objective, intervention                                                                                              |

### 11 Industry Overlays

SaaS, Healthcare, Manufacturing, Automotive, Logistics, Retail, Financial Services, Media, Public Sector, Education, Professional Services

Each overlay adds industry-specific entity types on top of the domain schema. A CS manager in Healthcare gets the `cs` schema plus `industry_hc` entities (patient, claim, provider).

### Personal Schema

| Schema  | Entity types                                     |
| ------- | ------------------------------------------------ |
| `spine` | calendar_event, bookmark, daily_reflection, note |

---

## THREE DATA FLOWS

### Flow A: Structured Data → Truth (HAS REPEAT LOOP)

**Sources:** CRMs, databases, billing, product tools — the allowed tools per tenant schema.

```
Source System API (Salesforce, HubSpot, Stripe, Jira, etc.)
    │
    ▼
CONNECTOR
    │  OAuth 2.0 flow
    │  Writes: Spine DB `connectors` (via PIPELINE db-proxy)
    │  Caches: KV `CONNECTOR_STATUS`
    │
    ▼
LOADER (Internal Sync / Webhook Ingress)
    │  Creamy load (30 days, bounded) or delta/full sync
    │  Reads: Source API using stored OAuth tokens
    │  Invokes: pipeline.ingest tool (MCP Server protocol boundary)
    │  Sends: PipelineMessage to PIPELINE_QUEUE
    │
    ▼
NORMALIZER (8-stage pipeline - integrated in env.PIPELINE)
    │
    │  S1 ANALYZE: Detect entity type, resolve schema from Spine DB tenant_spine_config
    │  S2 CLASSIFY: Assign priority
    │  S3 FILTER: Drop if entity type not in schema. Idempotency check (D1 fingerprint)
    │  S4 REFINE: Normalize field names to canonical
    │  S5 EXTRACT: Keep only schema-allowed fields. Drop unknown fields.
    │  S6 VALIDATE: Type checks, required fields
    │  S7 SANITY: Business rules. Score < 70 → DLQ
    │  S7.5 IDENTITY RESOLUTION: Signature to D1, match check, merge_candidates if >= 0.7
    │  S8 SECTORIZE: Route to correct department table
    │
    ▼
SPINE DB (Zero-Trust Spine Membrane)
    │  All writes routed strictly via env.PIPELINE.fetch("http://pipeline/v1/spine/...")
    │  INSERT INTO spine.entities (...) ON CONFLICT DO UPDATE (version++)
    │  INSERT INTO {schema}.{table} (department-routed write)
    │  Enqueue: INTELLIGENCE_QUEUE (for Twin activation)
    │
    ▼
ENTITY 360 (convergence — D1 edge cache + pgvector Supabase + markdown vault)
    │
    ▼
REPEAT LOOP:
    When an approved playbook action executes on an external tool (via local execution claw),
    that tool's data changes. Loader triggers sync -> Normalizer processes -> Spine updates.
    The system sees its own actions as new structured data.
    This is the continuous loop. Only Flow A has this.
```

**Failure handling:** 3 retries with backoff (30s, 60s, 90s). After 3 → DLQ_QUEUE → Spine DB `normalization_errors`.

---

### Flow B: Unstructured Data → Context (NO REPEAT LOOP)

**Sources:** Notion, Google Drive, Confluence, Gmail, Slack, SharePoint, Dropbox

```
Source System API
    │
    ▼
CONNECTOR → LOADER → PIPELINE_QUEUE → NORMALIZER (same 8 stages)
    │
    │  At S8: Writes metadata to Spine DB spine.entities
    │  Sends content to KNOWLEDGE_QUEUE
    │
    ▼
KNOWLEDGE SERVICE
    │  Generates embeddings
    │  Writes: Spine DB `context_extractions` (entity_type + entity_id linking)
    │  Documents, emails, PDFs stay intact and are connected to entities
```

**No repeat loop.** Unstructured data flows in once and is linked. It does not loop back.

---

### Flow C: AI Sessions → Knowledge Memory (NO REPEAT LOOP, NEVER WRITES TO SPINE)

**Sources:** ChatGPT, Claude, Gemini, Perplexity, Grok, MCP-based tools, Twin itself

Flow C is not just "AI session summaries stored somewhere." It follows a definitive structure:

```
AI conversation or Twin reasoning
    │
    ▼
TRIAGE BOT (sole writer to memory)
    │
    │  The Triage Bot is the GATEKEEPER.
    │  No AI, no user writes directly to the memory store.
    │  Only the Triage Bot has write access.
    │
    │  What gets written:
    │  1. Session summaries from AI conversations
    │     (continuously updated as sessions progress)
    │  2. Truth + Context summaries from the Twin
    │     (Twin reads Spine truth and Context, writes summarized
    │      knowledge back into memory — but through Triage Bot, not directly)
    │
    │  Triage Bot processes:
    │    Entity extraction, sentiment analysis, key fact extraction,
    │    confidence scoring (0.0 — 1.0)
    │
    │  Writes: D1 (edge buffer) → Spine DB `ai_memories`
    │    memory_type: decision | preference | insight | action | rule | fact
    │    status: pending (human review) or approved (auto-approve rules)
    │
    ▼
MEMORY CONSOLIDATOR (scheduled worker)
    │  Reads approved ai_memories
    │  Writes: Spine DB `consolidated_memories`
    │  Session, daily, and weekly summaries
    │
    ▼
KNOWLEDGE MEMORY STORE
    │
    │  Read access: controlled by tenant_id + OAuth approval
    │    - Personal memory: readable by that person only
    │    - Shared memory: readable by any AI/agent IF tenant has granted
    │      OAuth approval for that specific access
    │
    │  This memory GROWS DAILY.
    │  It accumulates over time, becoming richer.
    │  This is exactly why it's called a Knowledge Workspace —
    │  the accumulated knowledge memory IS what makes the workspace
    │  intelligent over time.
    │
    │  NEVER writes to Spine.
    │  NEVER loops back through the pipeline.
    │  AI memory is never written back into the repeat loop.
```

---

## ENTITY 360 — WHERE ALL THREE FLOWS MEET

Entity 360 is the convergence point. All three flows contribute to it.

```
Entity 360 = Spine (Flow A — Truth)
           + Context (Flow B — context_extractions)
           + Knowledge Memory (Flow C — consolidated_memories, governed)
           + Signals (generated by Twin from the above)
```

**How it assembles (Spine-v2 Worker, parallel reads from Spine DB):**

1. Truth: `SELECT * FROM spine.entities WHERE spine_id = $id` + department table
2. Context: `SELECT * FROM context_extractions WHERE entity_id = $id`
3. Knowledge Memory: `SELECT * FROM consolidated_memories WHERE entity_id = $id`
4. Signals: `SELECT * FROM signals WHERE entity_id = $id AND status = 'active'`

Assembly time: < 200ms. Cache: KV, 60s TTL.

**The critical distinction:**

- Entity 360 READS from all three flows
- But only Flows A and B WRITE to Spine tables
- Flow C writes to the knowledge memory store (separate from Spine)
- The Spine stays clean of AI-generated content

---

## TWIN ACTIVATION — THINK

Once Entity 360 is assembled, the Twin activates.

**Twin access:**

- READ-ONLY on Spine
- Reads the full Entity 360 (Truth + Context + Knowledge Memory + Signals)
- Generates proactive insights and suggestions

**What the Twin produces:**

- Human-readable observations with evidence:
  - What is happening
  - Why it matters
  - What you could do about it
  - What happens if you ignore it
  - Evidence chain (which data, from which sources)
  - Confidence level

**Twin can also write to memory:**

- Twin reads Spine (truth) and Context, and can write summarized knowledge back into the memory store
- But THROUGH the Triage Bot, not directly
- This is how the Twin contributes to the growing knowledge memory

**Writes insights:** Spine DB `signals` table. Max 3 per entity per day.

---

## HUMAN DECIDES — GOVERN / HITL

Based on the Twin's proactive insights and suggestions, the human decides.

- Sees the insight with evidence
- Evaluates: Is this accurate? Is this actionable? Should we proceed?

**If approved:**

- Action moves to ACT
- ACT executes on external tools (create task, send email, update record)
- The tool's data changes → flows back into Flow A → Loader picks it up → Spine updates
- This is the REPEAT loop
- Twin learns from the approval (ADJUST)

**If modified:**

- Human adjusts the proposed action
- Modified action goes to ACT
- Twin learns from the modification

**If dismissed:**

- Insight logged as dismissed
- Twin learns — future proposals improve
- No action taken

**Twin → Spine write:**

- Twin is READ-ONLY on Spine by default
- Twin can write to Spine ONLY after HITL approval activates the write
- The human approval is what unlocks the Spine write, not the Twin itself

---

## ACT — EXECUTION

Agents and the Twin live ONLY in ACT. They do not participate in truth formation.

**What ACT can do:**

- Create a task in the connected tool
- Send an email
- Update a record
- Schedule a meeting
- Trigger a connector sync

**Scoped, not full access:**

- AI does NOT have access to the complete ecosystem
- It can only act on what's permitted through Govern/HITL approval
- Every action is scoped and governed

**Actions flow back:**

- Action changes the external tool
- That tool's data flows back into Flow A (structured data)
- Loader picks it up → Normalizer processes → Spine updates → Entity 360 updates
- This is the continuous loop — the system sees its own actions as new data

---

## ADJUST — LEARNING

- Denied or edited actions update decision memory (via Triage Bot → consolidated_memories)
- Twin learns from patterns: what gets approved, dismissed, modified
- Future proposals improve based on past human decisions
- No retraining needed — context is always current, always growing, never lost

---

## THE KEY DIFFERENTIATOR — NO RETRAINING

Unlike other AI systems where you have to retrain or re-explain context every time:

- IntegrateWise already knows the context (from the Spine)
- It already knows the truth (from structured data)
- It acts based on accumulated knowledge (from the growing memory)
- When the system updates, that update flows back through Flow A, and the cycle continues
- The context is always current, always growing, never lost

---

## TWO PRODUCT LAYERS

### L1 — The Workspace (12 domain-specific views)

This is what the user sees and works in. Schema-driven from the Spine.

- Each domain has its own views shaped by its schema
- A salesperson sees pipeline, deals, contacts, activities
- A CS manager sees accounts, health, renewals, risk registers
- A finance person sees invoices, budgets, revenue, expenses
- Same Spine data, different lens per domain

**L1 hydrates section-by-section per connector:**

- Connect Gmail → tasks section hydrates
- Connect Salesforce → accounts + contacts hydrate
- Connect Stripe → revenue section hydrates
- Empty sections stay empty until the feeding connector is connected

### L2 — The Cognitive Overlay

> **Canonical enumeration:** see `docs/tech/L2_TWIN_SURFACE_CONTRACT.md` for the full L2 surface contract (Cognitive Domains, Interaction Surfaces, Runtime Primitives, Automation/Workflow Fabric). The list below is a partial summary of Categories 1+2 only; counts are not part of the contract.

Sits alongside L1. Non-intrusive. Extends into work only when needed.

- Signals (real-time sensing from connected tools)
- Think (AI-detected situations with evidence)
- Approvals/HITL (approve/reject with evidence)
- Knowledge Hub (Triage Inbox, Memories, Sessions, Topics, Search)
- AI Chat (grounded in Entity 360 context)
- Evidence Drawer (provenance tracing)
- Goal Framework (everything traces to growth or outcomes)
- Bridge (mission control — Sense/Think/Act unified view)
- Layer Audit (cross-layer integrity monitoring)

**L2 activates as data accumulates:**

- 1 connector: L2 mostly empty
- 2-3 connectors: Entity 360 starts assembling meaningful profiles
- 4+ connectors: Twin sees cross-system patterns, insights become valuable
- Full stack: Full L2 active, deeply contextual

Accessible via Cmd+J or from the Intelligence Overlay.

---

## WORKSPACE READS — SPINE_DB DIRECT

Frontend reads from Spine DB directly. NOT through Gateway. RLS enforces tenant isolation.

| View                                | Table                                                  |
| ----------------------------------- | ------------------------------------------------------ |
| Accounts, Tasks, Contacts, Calendar | spine.entities (filtered by entity_type)               |
| Department entities                 | {schema}.{table} (cs.account_master, sales.deal, etc.) |
| Signals                             | spine.signals                                          |
| Documents                           | context_extractions                                    |
| AI Memories (triage)                | ai_memories                                            |
| Verified Knowledge                  | consolidated_memories                                  |
| Audit trail                         | governance_audit_log                                   |

Realtime updates via Spine DB Realtime subscriptions.

---

## WORKSPACE WRITES — THROUGH GATEWAY

All writes go through Gateway. Writes have side effects (validation, audit, downstream).

| Action           | API                             | Why                              |
| ---------------- | ------------------------------- | -------------------------------- |
| Create task      | POST /api/v1/workspace/entities | Validation + Spine write + audit |
| Approve triage   | POST /api/v1/triage/approve     | Govern + memory write + audit    |
| Merge duplicates | POST /api/v1/identity/merge     | Govern + multi-table + audit     |
| Connect tool     | POST /api/v1/connectors/connect | OAuth + connector service        |
| Execute action   | POST /api/v1/act/execute        | Govern gate + orchestration      |

---

## SPINE WRITE ACCESS SUMMARY

| Actor              | Spine read           | Spine write              | Memory write         | Memory read            |
| ------------------ | -------------------- | ------------------------ | -------------------- | ---------------------- |
| Twin               | YES (via Entity 360) | ONLY after HITL approval | YES (via Triage Bot) | YES                    |
| Triage Bot         | NO                   | NO                       | YES (sole writer)    | NO                     |
| External AIs       | NO                   | NO                       | NO                   | YES (per tenant OAuth) |
| User (via Gateway) | YES                  | YES (validated writes)   | YES (approve/reject) | YES                    |
| Normalizer         | NO                   | YES (S8 sectorize)       | NO                   | NO                     |
| Loader             | NO                   | NO (sends to queue)      | NO                   | NO                     |

---

## COMPLETE DB INVENTORY

### Spine DB (SSOT)

| Table                 | Who writes               | Who reads                      | Flow           |
| --------------------- | ------------------------ | ------------------------------ | -------------- |
| spine.entities        | Normalizer S8            | Frontend, Entity 360           | A, B           |
| {dept}.{table}        | Normalizer S8            | Frontend, Entity 360           | A              |
| context_extractions   | Knowledge Service        | Frontend, Entity 360           | B              |
| signals               | Think Service            | Frontend, Entity 360           | Twin-generated |
| ai_memories           | Triage Bot (sole writer) | Frontend (Knowledge Hub)       | C              |
| consolidated_memories | Memory Consolidator      | Frontend, Entity 360, MCP read | C (approved)   |
| connectors            | Connector Worker         | Frontend                       | Setup          |
| governance_audit_log  | Govern Worker            | Frontend                       | All decisions  |
| tenant_spine_config   | Onboarding               | Normalizer S1                  | Setup          |
| normalization_errors  | DLQ consumer             | Admin                          | Failures       |
| policies              | Admin                    | Govern Worker                  | Governance     |

### Cloudflare D1 (Edge operational)

| Table             | Who writes        | Who reads               |
| ----------------- | ----------------- | ----------------------- |
| entity_signatures | Normalizer S7.5   | Normalizer S7.5         |
| merge_candidates  | Normalizer S7.5   | Identity Resolution API |
| ai_sessions       | Knowledge Service | Triage Bot              |

### Cloudflare KV (Edge cache)

| Namespace        | TTL  | Purpose               |
| ---------------- | ---- | --------------------- |
| SCHEMA_CACHE     | 5min | Resolved schemas      |
| CONNECTOR_STATUS | 5min | Installation mappings |
| SIGNAL_CACHE     | 60s  | Recent signals        |
| RATE_LIMITS      | 60s  | IP rate counters      |

### Cloudflare Queues

| Queue              | Producer                | Consumer          |
| ------------------ | ----------------------- | ----------------- |
| PIPELINE_QUEUE     | Loader, Webhook Ingress | Normalizer        |
| KNOWLEDGE_QUEUE    | Normalizer S5/S8        | Knowledge Service |
| INTELLIGENCE_QUEUE | Normalizer S8           | Think Service     |
| SIGNAL_QUEUE       | Think Service           | Workflow Service  |
| DLQ_QUEUE          | Any stage on max retry  | DLQ consumer      |

---

## INTEGRATION BEST PRACTICES

**Idempotency:** Content hash SHA-256(tenant_id + entity_type + source + content). D1 fingerprints. Check before processing.

**Retry:** 3 attempts, backoff 30s → 60s → 90s. After 3 → DLQ.

**DLQ:** Full context preserved. Spine DB normalization_errors. Replayable via admin API.

**Version tracking:** Monotonic on spine.entities. Upsert increments. Highest version wins.

**Trace correlation:** trace_id (UUID) flows through entire pipeline. All logs reference it.

---

_This is the founder's design. Entity 360 is where all three flows meet. Twin is read-only on Spine, writes only via HITL. Triage Bot is the sole writer to memory. Repeat loop is Flow A only. Memory grows daily — that's why it's a Knowledge Workspace. All code must conform to this._
