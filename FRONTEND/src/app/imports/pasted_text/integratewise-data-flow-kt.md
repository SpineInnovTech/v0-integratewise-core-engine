

Status: Canonical internal reference
Classification: Internal
Product Statement: IntegrateWise is a Knowledge Workspace over the Spine, empowered by AI and governed by approvals.

---

Document Control

Column 1	Column 2
Field	Value
Document	IntegrateWise Data Flow KT
Version	v1.2
Date	2026-03-23
Owner	IntegrateWise LLP
Audience	Product, Engineering, AI, Connector, Workflow, GTM
Scope	End-to-end data flow from landing and onboarding through Spine, Workspace, Cognitive, approval, action, and re-ingestion
Canonical runtime path	Landing → Auth → L0 Onboarding → L1 Workspace → L2 Cognitive → L3 Platform
Canonical engine loop	Load → Normalize → Store → Think → Review & Approve → Act → Repeat


---

1. Purpose

This KT defines how data should flow through IntegrateWise so every team uses the same mental model for truth, context, intelligence, approval, and execution.

The platform rule is simple:

All durable business value in IntegrateWise must be created through a Spine-based flow.

That means every meaningful path must follow this sequence:

Ingest → Normalize → Store in Spine → Render in Workspace / Entity 360 → Think → Govern / HITL → Act → Re-ingest

---

2. Canonical Principles

2.1 Spine is the only truth layer

The Spine is the canonical, tenant-partitioned source of structured truth. It holds entity identity, operational state, relationships, schema observations, and the durable data used by the workspace and cognitive layers.

2.2 No data bypasses Layer 3

All external data must enter through the controlled backend path before it can appear in the workspace or cognitive layer. There are no direct UI-side truth paths and no side databases for business truth.

2.3 Flow C never writes directly to Spine truth

Flow A and Flow B can create truth through the pipeline. Flow C contributes governed knowledge and decision context. Truth changes from Flow C happen only after approved action and re-ingestion.

2.4 Workspace is not a truth layer

L1 is the operating surface, not the ingestion surface and not the source of truth. It renders Spine-backed runtime projections.

2.5 No action executes without approval

Governance is a hard gate. If policy requires approval, no execution occurs without the proper approval path.

---

3. Runtime Architecture

The official runtime order is:

Experience → Gateway → Workspace Runtime → External Connectivity → Data Plane → SSOT / Spine → Cognitive → AI Providers

Layer summary

* L0 Onboarding — Tenant identity, business context, schema direction, connector relevance
* L1 Workspace — Where users work: dashboard, modules, approvals, entity views, and signals
* L2 Cognitive — Context, IQ Hub, Evidence, Signals, Think, Act, Approval, Governance, Adjust, Audit, Agents, Twin
* L3 Platform — Gateway, connectors, loader, pipeline, Spine, knowledge, workflow, and background processing

---

4. End-to-End Flow

flowchart TB
  A[Landing] --> B[Auth]
  B --> C[L0 Onboarding]
  C --> D[Connector Selection and Auth]
  D --> E[Creamy Hydration]
  E --> F[Loader and Queue]
  F --> G[8-Stage Pipeline]
  G --> H[Spine Write]
  H --> I[L1 Workspace Ready]
  H --> J[Entity 360]
  J --> K[L2 Cognitive]
  K --> L[Think]
  L --> M[Govern / HITL]
  M --> N[Act]
  N --> O[Re-ingest]
  O --> G

Expanded meaning

1. User lands and authenticates
2. Onboarding seeds tenant configuration and schema direction
3. Connector setup establishes real external bindings
4. Creamy hydration fetches the first useful data
5. Loader enqueues records into the data plane
6. The 8-stage pipeline normalizes every record
7. Spine stores canonical truth
8. Workspace becomes usable from Spine-backed data
9. Entity 360 fuses truth, context, and signals
10. Cognitive services propose actions
11. Govern and HITL gate execution
12. Approved actions execute externally
13. Results return through re-ingestion so truth stays current

---

5. Onboarding and Tenant Setup (L0)

Onboarding determines:

* who the tenant is
* industry and department context
* desired workspace mode and goals
* connector relevance
* schema direction
* whether approved knowledge can be linked into Entity 360

L0 output

Onboarding seeds tenant runtime configuration, especially tenant_spine_config, which later drives:

* workspace navigation
* readiness
* allowed entity types
* depth matrix behavior
* module visibility
* schema routing

Core rule

L0 introduces reality. What is declared during onboarding determines what the system is allowed to ingest, normalize, and render later.

---

6. Connector Setup and Activation

The connector stage should work like this:

1. Connector list is filtered by industry and department
2. User authorizes a provider
3. Installation is bound to tenant
4. Connector state is persisted
5. Initial sync starts with phase: creamy

Important point

Connector choice affects scope and schema eligibility, but it does not change the core platform path.

All connectors still follow:

Connect → Authenticate → Extract → Queue → Normalize → Spine → Workspace / Entity 360

---

7. The Three Data Flows

7.1 Flow A — Structured Truth Ingestion

Flow A handles structured data from systems like CRM, billing, support, project tools, and operational SaaS apps.

flowchart LR
  A[Structured Connector or Webhook] --> B[Loader]
  B --> C[PIPELINE_QUEUE]
  C --> D[8-Stage Pipeline]
  D --> E[Normalizer]
  E --> F[Spine Truth]
  F --> G[Entity 360]
  F --> H[L1 Workspace Views]

Role of Flow A

* create canonical business truth
* populate domain tables
* record schema observations
* power lists, dashboards, views, and signals
* support write-back reconciliation after approved actions

Sync phases

* Creamy — first useful value, fast
* Needed — next meaningful coverage
* Delta — continuous incremental freshness

No default full-sync-everything behavior should exist.

---

7.2 Flow B — Unstructured Context Integration

Flow B handles documents, emails, PDFs, chats, transcripts, and related artifacts.

flowchart LR
  A[Docs, Mail, PDF, Chat] --> B[Ingest]
  B --> C[Loader and Pipeline]
  C --> D[Entity Linking]
  D --> E[Spine References]
  D --> F[Knowledge Chunks and Embeddings]
  E --> G[Entity 360]
  F --> G

Role of Flow B

* enrich context without replacing structured truth
* link artifacts to Spine entities
* create evidence-backed views
* support retrieval, IQ Hub, and grounded reasoning

Rule

Flow B may enrich truth with references and structured metadata, but it must not overwrite canonical structured business fields with inferred content.

---

7.3 Flow C — AI Sessions, MCP, and Approved Memory

Flow C handles AI sessions, MCP sessions, external AI content, and human-AI memory.

flowchart LR
  A[MCP, AI Chat, Custom AI] --> B[D1 Buffer or Capture Layer]
  B --> C[Triage]
  C --> D{User Decision}
  D -->|Approve| E[Compounding Space]
  D -->|Discard| F[Archive]
  D -->|Defer| C
  E -. optional .-> G[Entity 360]
  C -. action path .-> H[Think -> Govern -> HITL -> Act]
  H --> I[Pipeline Re-ingest]
  I --> J[Spine]

Rule

Flow C never writes directly to Spine truth.

It contributes knowledge, context, and decision support. If it triggers a business action, that action must go through approval, execution, and then re-enter the standard data plane before truth updates.

---

8. The Mandatory 8-Stage Pipeline

Every meaningful record must pass through the same canonical data plane:

1. Analyze
2. Classify
3. Filter
4. Refine
5. Extract
6. Validate
7. Sanity
8. Sectorize

Why this matters

This is the platform’s normalization contract. It ensures:

* no raw source payload becomes truth directly
* tenant and schema rules are applied consistently
* only canonical shapes reach the Spine
* Flow A and Flow B remain compatible with Entity 360 and Cognitive

---

9. Spine and Storage Responsibilities

Spine

Stores canonical structured truth:

* entities
* relationships
* schema observations
* operational truth
* approval and action records where needed
* linked references

Knowledge

Stores retrieval-optimized context:

* chunks
* embeddings
* linked unstructured artifacts
* evidence content

Compounding Space / Approved Memory

Stores approved Flow C knowledge and memory. This is not SSOT. It is optional contextual augmentation.

Audit / Decisions / Actions

Stores:

* approvals
* denials
* action history
* traceability
* decision memory

Important rule

These stores are not interchangeable. The workspace must not treat Knowledge or approved memory as the primary truth source.

---

10. Workspace Layer Data Loading (L1)

This section clarifies the missing piece that causes the most confusion.

The Workspace Layer does not load from connectors directly.

L1 becomes usable only after Spine-backed data exists.

10.1 The workspace loading principle

L1 is:

* the operating surface
* the place where users work
* the place where signals, approvals, and context are surfaced

L1 is not:

* the ingestion layer
* the truth layer
* a direct connector-read layer

It renders data from:

* Spine truth
* workflow / BFF projections
* Knowledge links
* Signals
* optional approved memory when explicitly linked into Entity 360

10.2 What makes L1 ready

The workspace becomes usable after Creamy has successfully passed through:

connector auth → loader → queue → 8-stage pipeline → normalizer → Spine write

Only then should the workspace hydrate from canonical data.

10.3 The exact L1 loading chain

flowchart LR
  A[Auth and Onboarding] --> B[Connector Auth]
  B --> C[Creamy Sync]
  C --> D[Loader]
  D --> E[Queue]
  E --> F[Pipeline]
  F --> G[Spine Write]
  G --> H[BFF / Readiness / Tenant Config]
  H --> I[WorkspaceShell]
  I --> J[Dashboard and Modules]
  G --> K[Entity 360]
  K --> L[Signals and L2 Activation]

10.4 The four loading surfaces inside L1

A. Workspace shell load

Includes:

* shell
* sidebar / nav
* tenant context
* active view
* personal vs work mode
* readiness state

B. Home dashboard load

Includes:

* dashboard cards
* approvals count
* intelligence count
* focus items
* summary widgets

C. Module data load

Includes workspace module views such as:

* Home
* Accounts / Projects
* Contacts
* Meetings
* Docs
* Tasks
* Calendar
* Notes
* Knowledge Space
* Team
* Pipeline
* Risks
* Expansion
* Intelligence-linked module states

D. Intelligence overlays back into L1

Includes:

* banners
* signal indicators
* attention queues
* approvals
* feed summaries

10.5 Official L1 data sources

The workspace reads from:

1. Spine
2. Knowledge
3. Approved memory / compounding space when explicitly linked
4. Signals generated from normalized truth and Think

10.6 Phased workspace loading

Phase 1 — Shell ready

Auth, tenant, nav, and readiness resolve.

Phase 2 — Creamy workspace ready

First useful data lands, and the user can work.

Phase 3 — Module hydration

Dashboard and modules fill from runtime projections.

Phase 4 — Needed expansion

Historical and broader entity coverage expands.

Phase 5 — Delta freshness

Incremental sync keeps L1 current.

10.7 Immediate vs later loads

Immediately after Creamy

* shell and nav
* dashboard cards
* first entity projections
* first approvals and signal feed

Later through Needed / Delta

* deeper history
* broader entity coverage
* richer module views
* stronger Entity 360
* better cognitive quality

10.8 L1 and L2 dependency

* L1 can render after Creamy
* L2 should only fully activate after Creamy and enough meaningful connectors are loaded

10.9 User-visible interpretation

1. Onboarding decides the lens
2. Connector auth makes the data real
3. Creamy gives first value fast
4. Spine becomes the source
5. Workspace renders that truth
6. Needed and Delta deepen the workspace silently
7. L2 activates when enough truth exists

---

11. Entity 360

Entity 360 is the read-time fusion layer for the platform.

It combines:

* Spine truth
* Knowledge context
* Signals
* optional approved memory when linked

Rule

Entity 360 is a read model, not a write model.

It exists to support:

* workspace understanding
* grounded reasoning
* evidence-backed proposals
* consistent entity views

---

12. Cognitive Layer (L2)

The cognitive loop is:

Entity 360 → Think → Govern → HITL → Act → Adjust

flowchart LR
  A[Entity 360] --> B[Think]
  B --> C[Govern]
  C --> D[HITL]
  D --> E[Act]
  D --> F[Adjust]
  E --> G[Re-ingest]
  G --> H[Spine]
  F --> B

Think

Reads canonical truth and context to generate signals, proposals, and evidence.

Govern

Evaluates policy and determines whether the proposal can proceed.

HITL

Captures explicit human approval, rejection, or deferment.

Act

Executes approved actions via controlled integration paths.

Adjust

Learns from rejections, outcomes, and decision memory.

---

13. Approval and Re-ingestion Model

No action is complete until its result has been reconciled through the platform.

Correct action path

1. Proposal created
2. Govern checks policy
3. User approves in UI
4. Act executes external mutation
5. Result re-enters the pipeline
6. Spine updates
7. Workspace refreshes from canonical truth

This prevents internal truth from drifting away from real external state.

---

14. Anti-Patterns to Avoid

1. Direct source-to-truth writes
2. AI directly mutating Spine truth
3. Shadow schemas in modules or connectors
4. Workspace reading raw connector APIs directly
5. Entity 360 becoming a hidden write surface
6. Approval bypass for governed actions

---

15. Acceptance Checklist

Tenant and onboarding

* tenant config is seeded correctly
* onboarding choices define scope and schema direction
* workspace shell uses tenant config and readiness

Connector and sync

* connector auth binds correctly to tenant
* connection success triggers Creamy
* source data enters the approved queue path

Pipeline and truth

* all records pass through all 8 stages
* truth writes land in Spine
* Flow B writes linked Knowledge context
* Flow C remains knowledge-first until approved action

Workspace loading

* L1 shell reads BFF / readiness / tenant config
* dashboard uses Spine-backed runtime projections
* connectors do not directly populate L1
* Creamy is the gate for usable workspace
* Needed and Delta deepen the workspace in the background
* signals in L1 come from normalized data and Think
* L2 activation is gated until enough truth exists

Cognitive and action

* Entity 360 is read-time fusion only
* Think reads canonical truth
* Govern and HITL gate action
* Act results re-enter the pipeline
* final workspace state reflects reconciled truth

---

16. One-Sentence KT Summary

IntegrateWise data must always enter through controlled backend ingest paths, pass through the mandatory normalization pipeline, become canonical truth in the Spine, surface into the workspace through Spine-backed runtime projections, power Entity 360 and the cognitive loop, route actions through approval, and return through re-ingestion so the Spine remains the only source of truth.

---