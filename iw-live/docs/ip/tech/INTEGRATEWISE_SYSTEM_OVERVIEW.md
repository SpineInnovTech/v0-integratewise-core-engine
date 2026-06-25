# IntegrateWise — Whole System Overview

> Canonical internal reference for the whole IntegrateWise system.
> Descriptive first-read document for team members, operators, builders, and internal documentation consumers.
> **Architecture reference:** See `docs/ARCHITECTURE_CANONICAL.md` for the locked canonical architecture (May 28, 2026).

---

## Document Identity

- Document family: Whole-system internal reference
- Audience: internal team, operators, builders, reviewers, new contributors
- Purpose: explain the full IntegrateWise system in one place before readers go deeper into product, architecture, operations, design, playbooks, or runbooks
- Canonical stance: descriptive, cross-cutting, system-wide
- Reading rule: use this page first, then branch into specialized docs

### Canonical statement

IntegrateWise is a continuity-native operating environment over the Adaptive Spine.
It connects external systems into structured truth, linked context, governed AI memory, and controlled action.

Every user works in the **Operational Workbench** — the primary surface where projected truth is shown and work happens. The Twin is embedded as a collapsible sidebar that surfaces insights and requests approvals only when needed. The **Twin Workbench** is the full AI environment (OpenWebUI-style: skills, knowledge, agents, prompts, conversational library). The **Memory View** is a documentation-site-style surface for browsing and managing org, personal, and conversational memory.

Business Operations is a department with its own views — 14 modules, cross-department rollup, founder/CEO/COO/CTO lenses. Every other department (Sales, CS, Finance, etc.) has its own domain workbench. BizOps is the cross-cutting view over all of them.

Hermes and Claw are the runtime agents that power the system. Their features — skill execution, proposal routing, execution logs, agent colony — are surfaced inside the product, not external to it.

### What this document is not

This document is not:

- a public-facing product page
- a runbook
- a feature checklist
- a live-status board
- a single-service implementation spec

It is the internal descriptive map of the whole system.

---

## 1. What the System Is

IntegrateWise exists to solve a compound organizational problem:

- business truth is scattered across too many tools
- context is buried in conversations, documents, and operational traces
- AI systems are often asked to reason without real organizational grounding
- automation is risky when governance is weak or invisible

IntegrateWise addresses this by creating one governed system with four essential properties:

1. truth is normalized and structured into the Spine
2. context is linked to entities and operational situations
3. AI memory compounds through review and approval rather than silent auto-write
4. execution remains governed, traceable, and reversible

The result is not just another dashboard, assistant, or integration layer.
It is a work-and-governance system where context, intelligence, and action stay connected.

---

## 2. Canonical Boundary Rules

The whole system should be read through these boundary rules:

- **Operational Workbench** = the primary surface where every user works. Left sidebar navigation. Twin sidebar pops out only when needed (insights, approvals, action execution).
- **Twin Workbench** = full AI ecosystem surface — skills, knowledge, agents, prompts, conversational library. OpenWebUI-style. Can be positioned at different locations in the shell.
- **Memory View** = documentation-site style surface for browsing personal, organizational, and conversational memory. Can be positioned at different locations.
- **Business Operations** = a department with its own views (14 modules, cross-department rollup, founder/CEO/COO/CTO lenses) — not a separate product, a domain workbench like CS or Sales but cross-cutting.
- **Governance is embedded** — not a separate workbench. Approval panels appear inline in the Operational Workbench via the Twin sidebar.
- **Hermes and Claw are internal** — their runtime features (skill execution, proposal routing, execution logs, agent colony) are surfaced inside the product.
- Loader and Normalizer are internal stages of the MCP pipeline, not alternatives to MCP.
- MCP is the Spine gateway, not a list of tool wrappers.
- AI does not directly mutate canonical context without governance.
- Flow C memory does not silently become Spine context.
- Triage Bot is the sole writer to memory — no AI, no user writes directly.

These boundaries are load-bearing. Most documentation drift comes from collapsing them.

---

## 3. Whole-System Map

```text
External Systems
(CRM, billing, support, docs, chat, files, calendars, AI sessions)
        |
        v
Connectors / Watchers / AI Connectors
        |
        v
MCP Pipeline: Loader -> Normalizer -> Spine + Context + Memory Stores
        |                                        |
        |                                        v
        |                                  Entity 360
        |                                        |
        +----------------------------+-----------+----------------------------+
                                     |                                        |
                                     v                                        v
                      Operational Workbench                          Twin Workbench
                  (left sidebar nav; Twin sidebar              (skills, knowledge, agents,
                   pops out when needed)                        prompts, conv. library)
                                     |                                        |
                                     +-------------------+--------------------+
                                                         |
                                                         v
                                                    Memory View
                                      (personal + org + conversational memory,
                                       documentation-site style)
                                                         |
                                                         v
                                    Governance (embedded at every layer)
                                    Approval inline → Hermes/Claw execute
                                                         |
                                                         v
                                                 Act / Workflows
                                                  / external write
                                                         |
                                                         v
                                                 Repeat loop on Flow A
```

### Reading this map correctly

- external systems remain external systems; IntegrateWise does not require a wholesale tool replacement thesis
- the Spine is the governed truth substrate, not a marketing abstraction
- Entity 360 is the convergence point for truth, context, governed memory, and signals
- the three surfaces are different projections over one system, not three unrelated products
- governance is not a surface — it is embedded at every layer; approval panels appear inline
- Hermes and Claw are internal — their runtime features are surfaced inside the product
- only structured action results re-enter the continuous repeat loop

---

## 4. The Three Surfaces

| Surface               | Primary role                                                                   | Primary user posture                     | Reads from                                         | Writes through                                 |
| --------------------- | ------------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| Operational Workbench | primary work surface; left sidebar nav; Twin sidebar pops out when needed      | operate, review, manage, decide, approve | Spine truth, projections, context, signals         | Gateway / governed APIs                        |
| Twin Workbench        | full AI ecosystem surface — skills, knowledge, agents, prompts, conv. library  | ask, inspect, synthesize, reason, plan   | Entity 360, knowledge, evidence, tools, MCP        | governed proposal paths, memory via Triage Bot |
| Memory View           | personal, organizational, and conversational memory — documentation-site style | browse, review, promote, connect         | personal_memory, org_memory, conversational_memory | governed promotion, user connectors            |

### Operational Workbench

The Operational Workbench is where every user spends the majority of their time.
Left sidebar navigation. Domain-specific views (BizOps, Account Success, Sales, Finance, etc.).
The Twin sidebar is collapsible — it pops out only when needed to surface insights, request approvals, or execute actions. It does not occupy permanent screen space.
Business Operations is a department within the Operational Workbench — 14 modules, cross-department rollup, founder/CEO/COO/CTO lenses.

### Twin Workbench

The Twin Workbench is the full AI ecosystem surface — OpenWebUI-style.
Skills, Knowledge, Import functions, Agents, Prompts, Conversational Library.
This is where the system reasons, retrieves, explains, shows evidence, invokes tools, and helps humans navigate full-context questions and action proposals.
Conversational memory lives here.
Can be positioned at different locations in the shell.

### Memory View

The Memory View surfaces personal, organizational, and conversational memory in a documentation-site style.
Users browse, review, and promote memory through this surface.
Can be positioned at different locations in the shell.
Personal and Organizational Memory are also surfacable through user-owned connectors.

### Governance

Governance is not a surface. It is embedded at every layer.
Approval panels appear inline in the Operational Workbench via the Twin sidebar — not in a separate screen.
Every action has lineage, every decision is recorded, approval gates exist before execution.

---

## 5. The Core Operating Loop

The system is best understood through its operating loop:

```text
Load -> Store -> Think -> Govern -> Act -> Repeat -> Adjust
```

### Meaning of each stage

- Load: connectors and loaders collect data from source systems
- Store: pipeline and normalization write structured truth and linked context into the governed system
- Think: the Twin reasons over Entity 360, evidence, and governed memory
- Govern: approvals, policy checks, HITL control, and audit conditions are applied
- Act: approved actions execute on external systems or internal controlled surfaces
- Repeat: structured consequences re-enter Flow A and become fresh operational truth
- Adjust: the system improves through approved memory, feedback, and audit-trace learning

### Critical loop rule

Repeat applies to structured operational data.
It does not apply to Flow B as a loop.
It does not apply to Flow C as silent truth mutation.

---

## 6. The Three Data Flows

| Flow   | What enters                      | Primary source examples                       | Primary writer(s)                      | Primary destination                                       | Repeat loop | Approval requirement                                   |
| ------ | -------------------------------- | --------------------------------------------- | -------------------------------------- | --------------------------------------------------------- | ----------- | ------------------------------------------------------ |
| Flow A | structured truth                 | CRM, billing, support, product, finance tools | connector + loader + normalizer        | Spine truth and department-routed tables                  | yes         | required before consequential write-back               |
| Flow B | linked context                   | email, docs, chat, meetings, files            | connector + loader + knowledge service | context_extractions and linked entity context             | no          | not for ingest; governance matters when used in action |
| Flow C | AI memory and governed knowledge | Twin reasoning, AI sessions, agent outputs    | Triage Bot + memory consolidator       | ai_memories -> consolidated_memories / approved knowledge | no          | yes, for approval and promotion                        |

### Flow A — Structured Truth

Flow A is the repeat-loop backbone of the system.
It is where records from external tools become normalized truth inside the governed substrate.
If an approved action updates an external record, that change re-enters Flow A and becomes part of the new business state.

### Flow B — Context

Flow B captures the human layer around the business.
This includes messages, notes, documents, meeting traces, and content that explains why structured state looks the way it does.
Context is not noise; it is the meaning layer that makes AI reasoning operationally useful.

### Flow C — Governed AI Memory

Flow C exists so that AI-generated memory is never treated as raw truth just because it was generated.
The Triage Bot is the gatekeeper.
Memory proposals are reviewed, approved, and consolidated into governed knowledge before they can be treated as part of the working intelligence substrate.

---

## 7. Entity 360 and the Convergence Layer

Entity 360 is where the system becomes operationally legible.
It is not a cosmetic feature.
It is the read-time assembly layer that brings together:

- structured truth
- linked context
- governed memory
- active signals
- evidence chains

### Why Entity 360 matters

Without Entity 360, the system remains a collection of ingestion paths and surface claims.
With Entity 360, the system becomes a usable reasoning substrate.
It gives both humans and the Twin a single converged reference point per entity, account, task, situation, or operational object.

### Entity 360 rule

Entity 360 is a convergence and read surface.
It should not be mistaken for an uncontrolled direct-write surface.

---

## 8. Storage and Runtime Planes

The whole system spans multiple storage and runtime planes. They do different jobs.

### 8.1 Spine DB — canonical context plane

Spine DB is the primary canonical data plane for structured context, governance state, approved knowledge records, and realtime app reads.
It is where the system expects the durable business state to live.

### 8.2 Cloudflare operational plane

Cloudflare Workers, Queues, KV, D1, R2, and Durable Objects support the operational runtime.
This plane handles:

- queue-based processing
- edge coordination
- caching
- dedup support
- operational buffering
- realtime coordination
- service composition and API routing

### 8.3 External operating systems and tools

External tools remain important.
IntegrateWise is designed to read from them, reason across them, and write back to them through governed channels where appropriate.
They are part of the operating surface of the customer, not noise to ignore.

### 8.4 Documentation and knowledge surfaces

BookStack, Coda, Notion, AFFiNE, and similar systems may serve as external operating or publishing surfaces.
Internal documentation can and should describe them as part of the total system where they matter.

---

## 9. Canonical Data Objects and Tables

The table below is a documentation-level system map.
It is meant for internal orientation, not as a substitute for schema files or migrations.

| Object / table           | Purpose                                                  | Primary writer               | Primary readers                           | Runtime note                                      |
| ------------------------ | -------------------------------------------------------- | ---------------------------- | ----------------------------------------- | ------------------------------------------------- |
| tenant_spine_config      | tenant schema activation and downstream shaping          | onboarding                   | loader, normalizer, projections           | canonical object                                  |
| connectors               | connector installation state, auth status, sync metadata | connector layer              | app, operators, health views              | runtime-backed                                    |
| spine.entities           | central structured entity truth                          | normalizer                   | app, Entity 360, Twin                     | canonical object                                  |
| department-routed tables | domain-specific structured truth by department/schema    | normalizer                   | app, projections, Entity 360              | canonical object                                  |
| context_extractions      | linked context artifacts and extracted references        | knowledge service            | app, Entity 360, Twin                     | canonical object                                  |
| signals                  | Twin or reasoning-derived active signals                 | think service                | app, Twin, operational views              | canonical object                                  |
| actions                  | governed action queue / action state                     | workflow / govern / act path | app, governance, operators                | runtime-backed                                    |
| ai_memories              | memory proposals and pre-consolidation state             | Triage Bot                   | knowledge workflows, operators            | canonical object                                  |
| consolidated_memories    | approved and consolidated knowledge memory               | memory consolidator          | app, Entity 360, Twin, approved retrieval | canonical object                                  |
| governance_audit_log     | audit trail for governed decisions and mutation          | govern path                  | governance, operators                     | canonical object                                  |
| normalization_errors     | pipeline failures, replay and review candidates          | DLQ / failure consumers      | operators                                 | canonical object                                  |
| governance_policies      | persistent governance policy state                       | governance management        | govern runtime                            | pending migration / runtime gap noted in ops docs |
| governance_rules         | persistent rule set for approval decisions               | governance management        | govern runtime                            | pending migration / runtime gap noted in ops docs |
| spine_blocks             | hard stop / block records for protected flows            | governance control plane     | govern/runtime observers                  | pending migration / runtime gap noted in ops docs |
| twin_insights            | explicit Twin output record store where used             | think/twin side              | app/governance                            | pending migration / runtime gap noted in ops docs |

### How to read this table

- canonical object = part of the intended stable whole-system model
- runtime-backed = known to exist in current runtime materials or operational mirrors
- pending migration = documented in local runtime-state material as expected by code but not consistently present yet

---

## 10. Internal Table Views and Reporting Views

Internal docs are allowed to contain descriptive table views.
These views can exist as:

- SQL views
- Spine DB views
- Coda tables
- internal dashboards
- operational reporting surfaces

What matters is that the view is semantically correct and clearly named.

### Recommended canonical internal views

| View                       | Purpose                                                                         | Backed by                                                              | Status                            |
| -------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------- |
| v_entity_360_summary       | one-row operational summary per entity with truth, context, memory, and signals | spine.entities + context_extractions + consolidated_memories + signals | canonical internal reporting view |
| v_connector_health         | connector auth, freshness, sync status, failure pressure                        | connectors + operational status feeds                                  | canonical internal reporting view |
| v_tenant_schema_activation | tenant, department, industry, active schema and surface state                   | tenant_spine_config + tenant/onboarding state                          | canonical internal reporting view |
| v_normalization_quality    | pipeline quality, failures, stage pressure, DLQ load                            | normalization_errors + pipeline stats                                  | canonical internal reporting view |
| v_memory_pipeline          | pending memory, approved memory, consolidation freshness, review load           | ai_memories + consolidated_memories                                    | canonical internal reporting view |
| v_governance_queue         | proposals awaiting approval with policy and consequence context                 | actions + governance state                                             | canonical internal reporting view |
| v_action_feedback_loop     | approved actions and whether their consequences reappeared in structured truth  | actions + structured follow-through                                    | canonical internal reporting view |
| v_signal_feed              | active evidence-backed signals by entity, severity, freshness, domain           | signals + linked entity state                                          | canonical internal reporting view |
| v_surface_access_map       | which tenant/users have which surfaces, layers, and access patterns enabled     | tenant configuration + role/surface state                              | canonical internal reporting view |

These views are valid documentation objects even before every one of them exists as a physical SQL view.
They are part of the internal language of the system.

---

## 11. Runtime Components and Services

| Layer               | Component group                                             | Role in the whole system                                                |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Connection          | connectors, watchers, AI connectors, webhook ingestion      | bring source-system data into the governed pipeline                     |
| MCP Pipeline        | MCP boundary → Loader (fetch) → Normalizer (transform)      | protocol-level ingestion; Loader and Normalizer are internal MCP stages |
| Processing          | knowledge processing, identity logic                        | embed, deduplicate, link, route                                         |
| Truth and context   | Spine, context stores, entity model                         | hold the operational model the rest of the system reasons over          |
| Cognition           | think service, Twin, prompts, tools, MCP                    | reason, retrieve, explain, propose                                      |
| Governance          | govern service, Triage Bot, approvals, audit, policy checks | stop uncontrolled execution; Triage Bot is sole memory writer           |
| Action              | act service, workflows, agentic claw handoff                | hand off approved action to user's own stack for execution              |
| Operational runtime | gateway, Cloudflare queues/KV/D1/R2/DOs                     | routing, cache, coordination, buffering, edge execution                 |

### Workflow execution (Cloudflare Workflows)

Cloudflare Workflows + Queues are the workflow and execution fabric of IntegrateWise
(`services/workflow`). n8n is NOT used as IntegrateWise infrastructure — it is only ever
a customer-owned tool that the Twin may hand a playbook to, or whose run traces the
workbench absorbs for visibility.
It matters because governed execution should remain visible and orchestrated rather
than hidden inside ad-hoc tool actions.

---

## 12. Current Runtime Indicators

This section exists so internal readers do not confuse doctrine with live status.
These are indicators, not the final architectural truth.

### Runtime state (May 2026)

- 22+ CF Workers deployed
- IntegrateWise MCP = connected (20 tools)
- Cloudflare Workflows/Queues = live (services/workflow)
- Hermes Agent = connected
- Active Memory Layer = live on Cloudflare (D1, KV, AI Search) with Supabase (memory.\* schema) as the Fortress backup
- CouchDB = removed permanently

### Runtime-state references

For deeper live-state or historical operational interpretation, see:

- operations/OPERATIONAL_STATE.md
- operations/CF_WIRE_STATUS.md

---

## 13. Source-of-Truth Map for Internal Readers

| If you need to understand...     | Start here                                     | Then go deeper into...                                               |
| -------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| the full system                  | this document                                  | ARCHITECTURE_CANONICAL.md, definitive system flow, operational state |
| **canonical architecture**       | **docs/ARCHITECTURE_CANONICAL.md**             | supersedes all prior architecture descriptions                       |
| product identity and positioning | product/positioning-and-product-context.md     | product catalog, solutions, layers by role                           |
| whole-system data flows          | tech/SYSTEM_FLOW_DEFINITIVE.md                 | data access patterns, spine-to-twin boundary                         |
| Twin surface ontology            | tech/L2_TWIN_SURFACE_CONTRACT.md               | workbench master plan, surface contract                              |
| operations and runtime posture   | operations/OPERATIONAL_STATE.md                | deployment, verification, CF wire status                             |
| onboarding and sync behavior     | operations/ONBOARDING_TO_SYNC_SPECIFICATION.md | developer onboarding, API reference                                  |
| storage/data access law          | tech/DATA_ACCESS_PATTERNS.md                   | architecture decisions, flow documents                               |
| public-site and design transfer  | design docs                                    | website specs, context transfer docs                                 |

---

## 14. Internal Documentation Rules

### What should live in internal docs

Internal docs may be:

- descriptive
- narrative
- system-defining
- table-heavy where useful
- cross-cutting
- implementation-aware
- operationally specific

They may include:

- table views
- DB object maps
- internal reporting views
- Coda-oriented representations
- runtime notes
- doctrine boundaries
- cross-surface descriptions

### What internal docs should not become

They should not become:

- random fragments with no canonical ownership
- only thin mirrors of engineering notes
- public-marketing copy disguised as internal truth
- stale architecture folklore with no path to deeper source docs

### Canonical documentation posture

Internal docs should speak about the whole system when needed.
They should help a serious internal reader understand:

- what the system is
- how the parts connect
- where truth lives
- where context lives
- how AI memory works
- how governance works
- which table/view abstractions matter
- where to go next for depth

---

## 15. Final Summary

IntegrateWise should be understood as one governed operating environment with:

- one Adaptive Spine
- three surfaces (Operational Workbench, Twin Workbench, Memory View)
- three major data flows (Flow A: structured truth, Flow B: context, Flow C: governed AI memory)
- one convergence layer in Entity 360
- one governed path from reasoning to handoff — execution stays in the user's own stack
- one documentation responsibility to explain the system coherently

Governance is not a surface. It is embedded at every layer.
The Twin proposes. The human approves. The user's agentic claw executes.

That means internal docs must do more than list features or folders.
They must describe the full operating logic of the system.
This page is the first reference layer for that responsibility.

---

Related docs:

- docs/ARCHITECTURE_CANONICAL.md — THE canonical architecture (supersedes all prior)
- SYSTEM_FLOW_DEFINITIVE.md
- DATA_ACCESS_PATTERNS.md
- OPERATIONAL_STATE.md
- L2_TWIN_SURFACE_CONTRACT.md
- CF_WIRE_STATUS.md
