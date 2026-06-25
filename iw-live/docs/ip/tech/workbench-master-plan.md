# Workbench Master Plan

> The trilogy: Projection Doctrine + Builder Doctrine + Tool Absorption Doctrine, executed in sequence.

---

## The Three Doctrines

| Doctrine                   | File                                         | Governs                                    |
| -------------------------- | -------------------------------------------- | ------------------------------------------ |
| **Workbench & Projection** | `docs/tech/workbench-projection-doctrine.md` | How relevance is computed and rendered     |
| **Workbench Builder**      | `docs/tech/workbench-builder-doctrine.md`    | How the surface must be built              |
| **Tool Absorption**        | `docs/tech/tool-absorption-doctrine.md`      | How external capabilities are internalized |

---

## Workbench Surface Boundary Decision

| Workbench      | Canonical Surface                                                                                    | Open WebUI Role     | Boundary Rule                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| User Workbench | Projection-native customer/product shell                                                             | No shell role       | The customer-facing workbench remains the IntegrateWise product shell. It may launch or hand off context into Twin, but is not replaced by Open WebUI. |
| Twin Workbench | Open WebUI primary Twin surface                                                                      | Direct runtime      | Open WebUI is the primary cognition surface for Twin: chat, models, prompts, knowledge, tools, automations, and memory.                                |
| Governance     | Embedded at every layer — approval queue and HITL review surface inline in the Operational Workbench | Governance-adjacent | Approval panels appear inline, not in a separate shell.                                                                                                |

Canonical styling rule:

- Twin / Open WebUI runtime surfaces use Forest + Paper.
- Midnight Executive remains investor-deck language only.

---

## Execution Sequence

### Phase 1: Stabilize Projection Architecture

**Goal:** The Projection Engine is the foundation. It must be solid before any surface work continues.

| Task                                                                              | File / Location                                                            | Status    |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------- |
| `useProjection()` hook reads all spine config tables                              | `lib/projection/use-projection.ts`                                         | ✅ Built  |
| Module resolver computes work/org/personal views                                  | `lib/projection/module-resolver.ts`                                        | ✅ Built  |
| Field policy enforcement                                                          | `lib/projection/field-policy.ts`                                           | ✅ Built  |
| Module guard in ContentRouter                                                     | `lib/projection/module-guard.ts` + `content-router.tsx`                    | ✅ Wired  |
| Role passthrough AppShell → WorkspaceShell → ContentRouter                        | `AppShell.tsx` → `workspace-shell-new.tsx` → `animated-content-router.tsx` | ✅ Wired  |
| **RBAC role name fix** — DB enum `practitioner`/`readonly` → FE `member`/`viewer` | Migration or mapping layer                                                 | 🔄 Needed |
| **ProjectedModules passthrough** — `useProjection()` → sidebar navigation filter  | `workspace-shell-new.tsx` nav generation                                   | 🔄 Needed |

**Tool Absorption (Phase 1):**

- **PostgreSQL** — truth layer fully utilized via direct Spine DB RPC reads
- **Infisical** — secrets governance remains backend-only; no surface change yet

---

### Phase 2: Make Navigation Projection-Native

**Goal:** The sidebar and navigation must be driven by projection, not hardcoded maps.

| Task                                                             | File / Location                                | Status                                                    |
| ---------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| Dynamic module resolver replaces static `DOMAIN_CONTENT_MAP`     | `content-router.tsx`                           | ✅ Guard + `module-resolver.ts` dynamic resolution active |
| Sidebar nav filters by `tenant_products` × `role` × `department` | `workspace-shell-new.tsx` via `nav-builder.ts` | ✅ `buildNavFromProjection()` drives sidebar              |
| Navigation respects `depth_matrix`                               | `nav-builder.ts`                               | ✅ Cross-dept modules grouped with depth badges           |
| Product entitlement gates navigation items                       | `module-guard.ts` + `nav-builder.ts`           | ✅ `canAccessModule()` gates every sidebar item           |
| Three doors enforced: My Department / My Organization / My Self  | Tabs in workbench + nav sections               | ✅ Built                                                  |

**Tool Absorption (Phase 2):**

- **BookStack** — doctrine browser link in Org View (integrated reference stage) ✅

---

### Phase 3: Build SDAI-Native Operational Surfaces

**Goal:** The Workbench must make the Schema-Driven AI Integration pipeline visible and operable.

| Task                                                                                                    | Primitive                       | Backend Need                               |
| ------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------ |
| **Ingestion Panel** — real-time source connector status                                                 | Health Ring + Timeline Stream   | `sync_jobs` polling endpoint               |
| **Source Connector Tiles** — per-tool status (Salesforce, HubSpot, Gmail, Slack, ChatGPT, Claude, Kimi) | Entity Card variant             | Connector status API                       |
| **Schema Extraction Badge** — shows which template/schema was fetched                                   | Metric Tile                     | `spine_schema_registry` per-entity         |
| **Normalization Progress** — 8-stage pipeline visualization                                             | Progress bars + Timeline Stream | Per-entity pipeline state                  |
| **Curation Queue** — AI-proposed entities awaiting human judgment                                       | Governance Panel                | `continuity_objects` with `proposed` state |
| **Schema Mapping Preview** — tool field → spine field mapping                                           | Operational Canvas              | Schema mapping API                         |

**New Components to Build:**

- `components/workbench/panels/ingestion-panel.tsx`
- `components/workbench/panels/connector-tile.tsx`
- `components/workbench/panels/curation-card.tsx`

**Tool Absorption (Phase 3):**

- Spine DB conversational_memory — continuity timelines visible in Timeline Stream
- **Agent Zero** — execution cards in Action Tiles (native-assisted stage)

---

### Phase 4: Surface Ingestion + Curation + Write-Back Visibly

**Goal:** Close the loop. User sees raw input → AI curation → approval → write-back → confirmation.

| Task                                                                             | Primitive                   | Backend Need                        |
| -------------------------------------------------------------------------------- | --------------------------- | ----------------------------------- |
| **Raw Input Preview** — show scrambled source data (email thread, doc, AI convo) | Operational Canvas          | Source content fetch API            |
| **AI Curation Card** — curated entity proposal with confidence                   | Insight Block + Entity Card | `continuity_objects` content        |
| **Schema Mapping Approval** — approve field mappings before entity creation      | Governance Panel            | Schema mapping + approval API       |
| **Write-Back Proposal** — "Update Salesforce stage? [Confirm]"                   | Action Tile                 | `connector.execute` with preview    |
| **Write-Back Confirmation** — timeline showing write-back success/failure        | Timeline Stream             | `workflow_executions` + `audit_log` |
| **Sync Conflict Detection** — alert when source tool has diverged                | Insight Block               | `pipeline_quarantine` + diff API    |
| **Empty Dashboard Killer** — ingestion always produces candidates                | All primitives              | Continuous ingestion cron           |

**New Components to Build:**

- `components/workbench/panels/curation-card.tsx`
- `components/workbench/panels/writeback-monitor.tsx`
- `components/workbench/panels/sync-conflict-alert.tsx`

**Tool Absorption (Phase 4):**

- **n8n** — workflow trace in Timeline Stream, execution in Action Tiles (native-assisted stage)
- **Open WebUI** — contextual Twin handoff panels linked to entities (Twin-primary, not customer shell)

---

### Phase 5: Absorb High-Value Tool Affordances

**Goal:** Progressive absorption of the strongest capabilities from the external stack.

| Tool                   | Affordance to Absorb                                                    | Workbench Primitive                  | Stage                            |
| ---------------------- | ----------------------------------------------------------------------- | ------------------------------------ | -------------------------------- |
| **Affine**             | Block-based operational canvases, freeform drafting                     | Operational Canvas (enhanced)        | Native-assisted                  |
| **BookStack**          | Hierarchical doctrine navigation, canon browsing                        | Org View canon panels                | Integrated reference             |
| **Open WebUI**         | Twin entrypoint, entity-linked chat, contextual handoff into Open WebUI | Twin launch surfaces, Insight Blocks | Twin-primary / product-non-shell |
| **n8n**                | Workflow trace visibility, execution provenance                         | Timeline Stream, Action Tiles        | Native-assisted                  |
| **Beszel**             | Runtime health cards, system anomalies                                  | Health Ring, Health Canvas           | Integrated reference             |
| **LiteLLM**            | Model provenance, routing transparency                                  | Governance Panel metadata            | Integrated reference             |
| **Ollama**             | Local-vs-cloud reasoning visibility                                     | Twin provenance badges               | Integrated reference             |
| **Agent Zero**         | Visible execution cards, bounded task runs                              | Action Tiles, execution summaries    | Native-assisted                  |
| **Spine DB memory.\*** | Continuity timelines, memory-linked entities                            | Timeline Stream, memory attachments  | Native-primary                   |

**New Components to Build:**

- `components/workbench/panels/twin-chat-panel.tsx` (Open WebUI handoff, not shell replacement)
- `components/workbench/panels/doctrine-browser.tsx` (BookStack absorption)
- `components/workbench/panels/workflow-trace-panel.tsx` (n8n absorption)
- `components/workbench/panels/execution-summary-card.tsx` (Agent Zero absorption)

---

### Phase 6: Use v0 for Final Experiential Coherence

**Goal:** v0 is the polish benchmark. Apply its interaction patterns to the rebuilt surface.

| v0 Pattern                                           | v1 Location                          | Action                                                   |
| ---------------------------------------------------- | ------------------------------------ | -------------------------------------------------------- |
| Working memory tiles — context + sources + next step | `_deprecated/os-home-view-wired.tsx` | Extract pattern, apply to EntityCard                     |
| Unified surface — one place, no tab switching        | `workspace-shell-new.tsx`            | Ensure Personal/Work/Org are fluid, not jarring          |
| Contextual action buttons — `canAct` flag            | `_deprecated/os-home-view-wired.tsx` | Apply to ActionTile                                      |
| AI memory — "You discussed pricing on Jan 28"        | `_deprecated/os-home-view-wired.tsx` | Apply to TimelineStream                                  |
| Low cognitive switching                              | All views                            | Audit: can user complete task without leaving workbench? |
| Visible next steps                                   | EntityCard + InsightBlock            | Every card must have "What next?"                        |

**Builder Acceptance Test (apply to every view):**

- Can a user understand what matters in under 10 seconds?
- Can a user act without opening 4 more tabs?
- Can a user see evidence before approving?
- Can a user remain inside one contextual surface for a full task cycle?

---

### Phase 7: Expand Departments Through Configuration Only

**Goal:** No bespoke UI for new departments. Only configuration.

| Department       | Config (entityTypes + metrics)                       | Workbench                     |
| ---------------- | ---------------------------------------------------- | ----------------------------- |
| Business Ops     | ✅ Built                                             | ✅ `BizOpsWorkbench`          |
| Customer Success | ✅ Configured                                        | ✅ `CSWorkbench`              |
| Sales            | `opportunity`, `lead`, `quote`, `sequence`           | `DepartmentWorkbench` wrapper |
| Marketing        | `campaign`, `lead`, `email`, `social_post`           | `DepartmentWorkbench` wrapper |
| RevOps           | `pipeline`, `forecast`, `quota`, `cohort`            | `DepartmentWorkbench` wrapper |
| Finance          | `invoice`, `budget`, `expense`, `report`             | `DepartmentWorkbench` wrapper |
| Service          | `ticket`, `sla`, `knowledge_article`, `satisfaction` | `DepartmentWorkbench` wrapper |
| Procurement      | `vendor`, `purchase_order`, `contract`, `renewal`    | `DepartmentWorkbench` wrapper |
| IT Admin         | `system`, `incident`, `vulnerability`, `certificate` | `DepartmentWorkbench` wrapper |
| Product/Eng      | `feature`, `bug`, `sprint`, `release`                | `DepartmentWorkbench` wrapper |
| Student/Teacher  | `student`, `course`, `assignment`, `grade`           | `DepartmentWorkbench` wrapper |

**Each new department requires only:**

1. Entity type list
2. Metric definitions
3. Thin wrapper component (20 lines)
4. Module registry entry

No custom pages. No custom CSS. No custom data fetching.

---

## Capability Adoption Tracker

| Tool               | Current Stage         | Target Stage                     | Phase                  |
| ------------------ | --------------------- | -------------------------------- | ---------------------- |
| PostgreSQL         | Native-primary        | Native-primary                   | 1 (complete)           |
| Spine DB memory.\* | Integrated reference  | Native-primary                   | 3-4                    |
| Open WebUI         | External Twin surface | Twin-primary / product-non-shell | 4-5                    |
| n8n                | External only         | Native-assisted                  | 4-5                    |
| Affine             | External only         | Native-assisted                  | 5                      |
| BookStack          | External only         | Integrated reference             | 2-5                    |
| Beszel             | External only         | Integrated reference             | 5                      |
| LiteLLM            | External only         | Integrated reference             | 5                      |
| Ollama             | External only         | Integrated reference             | 5                      |
| Agent Zero         | External only         | Native-assisted                  | 4-5                    |
| Infisical          | External only         | External only                    | Retained as specialist |

---

## Decision Log

| Date       | Decision                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------- |
| 2026-05-17 | Three doctrines formalized: Projection, Builder, Tool Absorption                         |
| 2026-05-17 | 7-phase execution sequence established                                                   |
| 2026-05-17 | SDAI (Schema-Driven AI Integration) defined as core product pattern                      |
| 2026-05-17 | v0 remains polish benchmark, v1 remains substrate                                        |
| 2026-05-17 | Tool absorption is staged, not immediate replacement                                     |
| 2026-05-17 | Department expansion is configuration-only after Phase 7                                 |
| 2026-05-21 | Open WebUI reaffirmed as the primary Twin surface, not the customer-facing product shell |

---

_This plan is a living document. Update it when phases complete or architecture shifts._
