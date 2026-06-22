IntegrateWise — Data Flow KT v1.1

Status: Canonical internal reference
Purpose: Define how data should flow through IntegrateWise from onboarding to workspace, Spine, cognitive loop, approval, action, and re-ingestion.

---

1. Purpose

This KT note defines the correct end-to-end data flow for IntegrateWise so product, engineering, connector, data, and AI teams all work from the same model.

The governing rule is:

All durable business value in IntegrateWise must be created through a Spine-based flow.

The canonical runtime chain is:

Landing → Auth → L0 Onboarding → L1 Workspace → L2 Cognitive → L3 Platform

The canonical system loop is:

LOAD → NORMALIZE → STORE → THINK → REVIEW & APPROVE → ACT → REPEAT

---

2. Canonical Product Statement

IntegrateWise is a Knowledge Workspace over the Spine, empowered by AI and governed by approvals.

That means:

* Workspace is where users operate
* Spine is the structured source of truth
* Knowledge carries linked unstructured context and approved compounding context
* AI / Cognitive reasons over canonical data
* Approvals gate execution
* Actions must reconcile back through the platform so the Spine stays current

---

3. Core Principles

3.1 The Spine is the single source of truth

The official architecture is explicit that the Spine is the foundation and that ingestion, context, intelligence, backend services, and AI all derive value only when they operate on Spine-shaped data.

3.2 No data may bypass Layer 3

Every piece of information must pass through the controlled L3 pipeline before it can appear in L2 or L1. There are no shortcuts or side write paths.

3.3 Flow C never writes directly to the Spine

Flow A and Flow B can create truth through pipeline-normalized writes. Flow C contributes knowledge and decision context; truth updates from Flow C only happen through approved actions that go back through Act → pipeline re-ingestion → Spine.

3.4 The workspace is not a truth layer

L1 is where people work, but it is dynamically generated from Spine data, Depth Matrix, BFF projections, and linked knowledge. L1 does not load raw connector data directly and does not maintain a separate SSOT.

3.5 No action executes without approval

The cognitive loop is always Think → Govern → HITL → Act / Adjust. No durable external mutation is valid without the approval path when policy requires it.

---

4. Official Runtime Architecture

The official runtime layer order is:

Experience → Gateway → Workspace Runtime → External Connectivity → Data Plane → SSOT / Spine → Cognitive → AI Providers

Layer roles

* L0 Onboarding: collects context, seeds tenant_spine_config, and prepares workspace + schema direction
* L1 Workspace: personalized work layer with modules, dashboards, approvals, and entity views driven by Spine + Depth Matrix
* L2 Cognitive: Think, Govern, HITL, Act, Adjust operating on Spine + linked context
* L3 Backend: Gateway, connectors, loader, pipeline, Spine, knowledge, and background services; the only entry point for external data into the system

---

5. Canonical End-to-End Loop

The platform loop is:

Load → Normalize → Store → Think → Govern → HITL → Act → Adjust → Repeat

Expanded meaning

1. Load
Data enters through connectors, files, webhooks, MCP sessions, or AI session capture.
2. Normalize
The pipeline transforms raw source payloads into tenant-valid, schema-valid, entity-valid structures.
3. Store
Canonical truth is written to Spine; linked unstructured context goes to Knowledge.
4. Think
Entity 360, signals, and approved context are used to generate proposals and insights.
5. Govern / HITL
Policies are checked and humans approve or reject actions.
6. Act
Approved actions execute through controlled integration channels.
7. Adjust / Repeat
Outcomes are recorded, decision memory improves the next cycle, and re-ingestion reconciles truth.

---

6. End-to-End Flow from Landing to Cognitive

The full system flow is:

1. User lands on marketing or app entry.
2. Auth resolves session and onboarding status.
3. L0 onboarding seeds tenant_spine_config.
4. User selects and authenticates connectors.
5. The first phase: "creamy" hydration starts.
6. Loader enqueues records to PIPELINE_QUEUE.
7. Normalizer runs all 8 stages.
8. spine-v2 writes canonical truth and schema observations.
9. The initial workspace becomes usable from Spine-backed creamy data.
10. Needed and Delta continue in the background.
11. Entity 360 is read from Spine + Knowledge + Signals.
12. L2 cognitive logic activates after creamy and connector threshold rules are met.

---

7. Onboarding and Schema Seeding (L0)

Onboarding is the point where tenant reality is declared.

It determines:

* who the tenant is
* industry
* department / domains
* desired workspace
* connector relevance
* whether knowledge UI should link into Entity 360
* the initial Depth Matrix / Spine direction

The system stores this in tenant-scoped configuration, especially tenant_spine_config, which later drives workspace navigation, readiness, entity types, and allowed schema behavior.

Onboarding output

Onboarding does not only collect profile information. It actively seeds the future runtime by creating the initial workspace and tenant schema basis. The fixed runtime path explicitly states that Landing / Auth / Onboarding create the Initial Workspace and seed tenant_spine_config.

---

8. Connector Selection, Auth, and Sync Kickoff

The connect stage must work like this:

1. Connectors are shown based on industry + department
2. User authenticates a connector
3. Installation is bound to the tenant
4. Connected connector state is persisted
5. The first phase: "creamy" sync is triggered immediately on success

The internal landing-flow doc explicitly describes the chain:

* connectors filtered by industry + department
* authentication callback
* resource types + traits determine what data is allowed
* creamy runs through loader → queue → 8-stage pipeline → normalizer → Spine
* workspace then reads BFF dashboard, readiness, tenant-config, modules, and Entity 360 sources

---

9. The Three Data Flows

9.1 Flow A — Structured data

Flow A is structured operational data from external systems such as CRM, billing, support, productivity, and related business tools. It lands as truth in the Spine.

Flow A path

Connection success → connector-sync → connector / loader → PIPELINE_QUEUE → Normalizer 8 stages → Spine truth → Initial Workspace → Needed / Delta → Entity 360 → Think / Twin

Flow A role

Flow A is the main truth creation path for operational records. It is the path that powers dashboard lists, entity records, workspace views, and most signals.

---

9.2 Flow B — Unstructured content

Flow B handles documents, emails, files, and other unstructured context. It goes through ingestion, linking, and Knowledge storage while also creating Spine references that can be used in Entity 360. The full landing-flow diagram describes Flow B as: Ingest → entity linking → Spine + Knowledge → Entity 360.

Flow B rule

Flow B enriches context and evidence. It does not replace structured truth.

---

9.3 Flow C — AI sessions, MCP, and compounding knowledge

Flow C handles MCP / AI / chat / triage / compounding knowledge. It follows the knowledge-first path and never writes directly to Spine truth. The landing-flow architecture shows Flow C as: MCP/AI → D1 → Triage Center Bot → triage space → approve → compounding.

Flow C rule

Only approved actions from Flow C can influence truth, and they must do so through Act → connector write-back → pipeline re-ingestion → Spine.

---

10. Workspace Layer Data Loading (L1)

This is the missing section now added to the KT.

The workspace does not load raw connector data directly. L1 is a projection layer that becomes usable only after normalized, Spine-backed data exists. The docs are explicit: all information from external sources must pass through L3 and be written to Spine or Knowledge before it can appear in L2 or L1.

10.1 The workspace loading principle

L1 is the user-facing work surface, but it is not:

* the ingestion layer
* the truth layer
* a direct connector read layer

Its job is to render context-aware views of already normalized data coming from:

* Spine truth
* BFF projections
* linked Knowledge
* Signals
* optional compounding space when linked into Entity 360

10.2 What makes the workspace “ready”

The workspace becomes usable after the initial Creamy phase has passed through:

connector auth → loader → queue → 8-stage pipeline → normalizer → Spine write

The fixed runtime path explicitly says:

* initial workspace is created from onboarding
* real connector auth succeeds
* phase: "creamy" hydration is triggered
* canonical truth is written
* the Initial Workspace becomes usable after Creamy
* Needed and Delta continue later in the background

10.3 The exact L1 loading chain

The correct loading sequence is:

Landing / Auth / Onboarding → Connector selection → Authentication → Creamy hydration → Spine write → BFF / tenant-config / readiness / dashboard → Workspace shell + modules → Entity 360 + signals → L2 activation

10.4 The four loading surfaces inside L1

A. Workspace shell load

This is the first visible workspace load.

It includes:

* workspace shell
* sidebar / nav
* tenant context
* active domain / view
* work vs personal mode
* readiness state

The landing-flow doc states that L1 is built from WorkspaceShell, nav from tenant_spine_config, BFF dashboard/readiness/HITL/analytics, and ContentRouter to domain modules.

B. Home dashboard load

This is the next visible layer.

It includes:

* summary cards
* approvals count
* intelligence count
* focus items
* dashboard widgets
* readiness / dashboard state

The BFF surface explicitly serves:

* GET /api/v1/workspace/tenant-config
* GET /api/v1/workspace/dashboard
* GET /api/v1/workspace/readiness
* HITL queue and actions

C. Module data load

This is where module views load.

Examples seen in current workspace design and docs:

* Accounts / Projects
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
* Intelligence surfaces

These are domain projections rendered from Spine-backed runtime data, not live connector API reads. The full flow docs describe the workspace as dashboard, list views, modules, and Entity 360 built from Spine and internal stores.

D. Intelligence overlays back into L1

L1 also shows intelligence before the user opens L2, including:

* banners
* signal indicators
* approvals
* feed summaries
* attention queues

The phased flow doc says dashboard and list views are built from Spine and BFF, while proposals from Think appear in the workspace and the user approves, edits, or rejects there.

10.5 Official L1 data sources

The workspace reads from these internal sources:

1. Spine — domain tables, core truth, projections
2. Knowledge — Flow B entity-linked chunks
3. Knowledge UI / compounding space — only when link_knowledge_ui_to_entity360 is true
4. Signals — derived from Normalizer + Think

10.6 Workspace loading happens in phases

L1 loading is phased.

Phase 1 — Shell ready

Auth, tenant, onboarding completion, nav, and workspace shell resolve.

Phase 2 — Creamy workspace ready

First useful normalized data lands; user can work.

Phase 3 — Module hydration

Dashboard and module views begin filling from BFF + Spine projections.

Phase 4 — Needed expansion

The next layer of business truth expands entity and historical coverage.

Phase 5 — Delta freshness

Incremental refresh keeps L1 current.

10.7 What should load immediately vs later

Load immediately after Creamy

* shell and nav
* tenant identity
* dashboard cards
* initial approvals and intelligence feed
* first account/task/meeting/contact projections
* first entity-ready work surfaces

Load later through Needed / Delta

* deeper history
* wider entity coverage
* more complete module views
* richer Entity 360
* stronger signal quality
* better cognitive recommendations

10.8 L1 / L2 activation dependency

The official rule is:

* L1 can render once Creamy truth exists
* L2 intelligence should activate only after Creamy is complete and at least 2–3 meaningful connectors are loaded

This is the dependency that prevents empty or weak intelligence on shallow data.

10.9 User-visible interpretation

The user-visible meaning of workspace loading is:

1. Onboarding decides the lens
2. Connector auth makes the data real
3. Creamy gives first value fast
4. Spine becomes the source
5. Workspace renders that truth
6. Needed and Delta deepen the workspace silently
7. L2 activates once enough truth exists

10.10 One-line workspace rule

The Workspace Layer does not load from connectors directly; it loads from Spine-backed runtime projections after Creamy hydration has passed through connector auth, loader, pipeline, normalizer, and canonical Spine write.

---

11. The Mandatory 8-Stage Pipeline

Every meaningful incoming record must pass through the 8-stage pipeline:

1. Analyze
2. Classify
3. Filter
4. Refine
5. Extract
6. Validate
7. Sanity
8. Sectorize

This is the mandatory normalization path for all canonical truth creation. Raw external events do not bypass it.

---

12. Entity 360

Entity 360 is a read-time fusion view.

It is built from:

* Spine
* Knowledge
* Signals
* optional compounding space when link_knowledge_ui_to_entity360 is true

Rule

Entity 360 is a read model, not a materialized truth table and not a write surface. The docs explicitly describe it as built at read time.

---

13. Cognitive Loop (L2)

The cognitive loop is:

Entity 360 → Think → Govern → HITL → Act / Adjust → Spine updated

Think

Consumes Entity 360 and linked knowledge to generate proposals and evidence refs.

Govern

Performs policy checks and ensures approval token gating.

HITL

User approves, edits, or rejects proposals in the workspace.

Act / Adjust

Approve leads to execution; deny leads to feedback / decision memory. The docs describe loop closure as Act updating the system and Adjust feeding future thinking.

---

14. Approval and Action Model

No action is complete until the result has been reconciled through the platform.

Correct action path

1. Proposal created
2. Govern checks policy
3. User approves in workspace
4. Act executes external mutation
5. Result re-enters pipeline
6. Spine updates
7. Workspace refreshes from canonical truth

This prevents internal truth from drifting away from actual external state.

---

15. Storage Responsibility Model

Spine

Canonical structured truth, entity tables, relationships, schema observations.

Knowledge

Unstructured chunks, evidence, entity-linked contextual data.

Knowledge UI / compounding space

Approved Flow C knowledge and memory layer, optionally linked into Entity 360.

Audit / actions / decisions

Approvals, denials, action records, and traceability.

L1 rule

The dashboard is powered from internal Spine-backed data via the BFF. It does not make live multi-system calls for each initial load; it reads the normalized internal copy and internal projections.

---

16. Anti-Patterns to Avoid

Do not allow these:

1. Direct source-to-truth writes
Connectors or webhooks must not directly write business truth outside the pipeline.
2. AI direct-to-Spine writes
Flow C must never mutate truth directly.
3. Shadow schemas
No parallel truth models in modules, connectors, or AI services. The Spine is the foundation.
4. Workspace reading external systems directly
L1 must read from BFF / Spine-backed projections, not from raw connector APIs.
5. Entity 360 as write surface
Entity 360 is for fusion and reasoning only.
6. Approval bypass
No governed action may execute without the correct approval path.

---

17. Code / Runtime Map

For engineers tracing implementation, the main runtime map is:

* onboarding seeds tenant config and schema direction
* connector auth binds installation
* sync triggers creamy
* loader enqueues to pipeline
* normalizer runs 8 stages
* Spine writes truth
* BFF exposes tenant-config, readiness, dashboard
* WorkspaceShell + ContentRouter render L1
* Entity 360 reads Spine + Knowledge + Signals
* Think / Govern / HITL / Act run on top of that truth

---

18. Acceptance Checklist

Tenant and onboarding

* tenant config is seeded correctly
* onboarding choices define runtime scope
* workspace shell uses tenant config and readiness

Connector and sync

* connector auth binds to tenant
* connection success triggers creamy
* source data enters the queue path

Pipeline and truth

* all records pass through all 8 stages
* truth writes land in Spine
* Flow B writes linked Knowledge context
* Flow C remains knowledge-first until approval-driven action

Workspace loading

* L1 shell reads BFF / tenant-config / readiness
* dashboard uses Spine-backed projections
* connectors do not directly populate L1
* creamy is the gate for usable workspace
* needed and delta deepen the workspace in background
* signals in L1 come from normalized data and Think
* L2 activation is gated until creamy + connector threshold

Cognitive and action

* Entity 360 is read-time fusion only
* Think reads canonical truth
* Govern and HITL gate action
* Act results re-enter the pipeline
* final workspace state reflects reconciled truth

---

19. One-Sentence KT Summary

IntegrateWise data must always enter through controlled L3 ingest paths, pass through the mandatory normalization pipeline, become canonical truth in the Spine, surface into the workspace through BFF and Spine-backed projections, power Entity 360 and the cognitive loop, route actions through approval, and return through re-ingestion so the Spine remains the only source of truth.

If you want, the next step is turning this into a polished internal artifact with a title page, version block, diagrams, and a short “L1/L2 screenshots mapping” appendix.