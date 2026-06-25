# L2 Twin Surface Contract

**Status:** Draft v1 — foundational ontology
**Last updated:** May 15, 2026
**Owner:** Nirmal
**Referenced from:** `CONTINUOUS_KM_PLAN.md` §10
**Supersedes (partial):** the "14 components" enumeration in `docs/tech/SYSTEM_FLOW_DEFINITIVE.md` §L2 and `docs/design/FIGMA_DESIGN_CONTEXT.md` §L2

---

## 0. Purpose

This document is the canonical ontology for everything the L2 Cognitive Layer exposes — to humans, to the Twin runtime, to automations, and to integrating systems. It replaces ad‑hoc lists ("the 14 components", "the drawer panels", "the cognitive surfaces") with a single hierarchical contract.

The L2 Cognitive Layer is the **Cognitive Runtime Environment** of IntegrateWise: a substrate that unifies organisational truth (Spine), conversational memory, human interaction surfaces, the Twin's execution primitives, and the automation fabric that fires it all. It is not a frontend feature set.

---

## 1. First Principle

**Cognitive Surface ≠ UI Panel.**

A cognitive surface is a _semantic operational capability space_. It may simultaneously expose:

- UI (drawer panels, dashboards, modals)
- API (HTTP, OpenAI-compatible)
- MCP (tools, resources)
- Automation (triggers, schedules, webhooks)
- Workflow (executable graphs)
- Background execution (cron, queues)
- Reasoning substrate (prompts, skills, memory)

Reducing a surface to "a frontend component" loses the architecture. Every entry in this contract MUST be evaluated across all of those expression modes — even if a given mode is not yet implemented.

---

## 2. Topology

The contract is organised into four categories. They are layers of a single architecture, not a flat inventory.

```
L2 Cognitive Surface Contract
├── 1. Cognitive Domains          (semantic territories — what the system thinks about)
├── 2. Interaction Surfaces       (human-facing operational interfaces)
├── 3. Runtime Primitives         (Twin execution substrate — cognition mechanics)
└── 4. Automation / Workflow Fabric (the nervous system — triggers, graphs, schedulers)
```

| Category             | Nature    | Evolution rate                                           | Owner concern            |
| -------------------- | --------- | -------------------------------------------------------- | ------------------------ |
| Cognitive Domains    | Semantic  | Slow — these are the territories the system reasons over | Product + Doctrine       |
| Interaction Surfaces | UX        | Medium — UIs evolve with usage patterns                  | Design + Frontend        |
| Runtime Primitives   | Mechanics | Slow — substrate stability matters                       | Twin runtime engineering |
| Automation Fabric    | Plumbing  | Fast — new triggers/graphs added continuously            | Workflow + Ops           |

**Counts deliberately omitted.** The number of entries per category will evolve. The topology, the categories, and the relationships are the architecture.

## 2.5 Workbench Boundary Binding

This contract governs the **Twin Workbench** only. It must not be read as the contract for the User Workbench or governance (embedded in Operational Workbench).

| Workbench      | Canonical Runtime                                                                        | Open WebUI Status   | Boundary Rule                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| User Workbench | Projection-native customer/product shell in the IntegrateWise app                        | Not Open WebUI      | The customer-facing workbench lives in the product shell. Open WebUI may receive context handoff from it, but does not replace it. |
| Twin Workbench | Open WebUI primary Twin surface                                                          | Direct mapping      | Chat, folders, custom models, prompts, knowledge, tools/functions/MCP, automations, and memories map here.                         |
| Governance     | Embedded at every layer — approval queue and HITL review inline in Operational Workbench | Governance-adjacent | Approval panels appear inline, not in a separate shell.                                                                            |

Styling rule:

- Twin / Open WebUI runtime surfaces must use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck language only and must not be treated as the runtime or product shell language.

---

## 3. Mapping Schema

Every surface in this contract is described with five attributes:

| Column              | Meaning                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Surface**         | Canonical name used in code, docs, and UI                                                                                 |
| **Category**        | One of: Cognitive Domain, Interaction Surface, Runtime Primitive, Automation Fabric                                       |
| **Open WebUI Role** | How it manifests in the Open WebUI shell (model / tool / function / panel / pipeline / prompt / workspace / RAG / native) |
| **Runtime Role**    | What the Twin runtime does with it (reasoning, governance, retrieval, execution, gating, etc.)                            |
| **Access Path**     | Concrete entry point: HTTP route, MCP server, UI control, cron, webhook                                                   |

---

## 4. Category 1 — Cognitive Domains

The semantic territories. Each is a space the system reasons _about_.

| Surface        | Category         | Open WebUI Role                               | Runtime Role                                         | Access Path                                 |
| -------------- | ---------------- | --------------------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| spine          | Cognitive Domain | MCP tool + side panel                         | Source-of-truth read (via Entity 360)                | MCP `spine.read`                            |
| context        | Cognitive Domain | MCP tool                                      | Entity 360 context assembly                          | MCP `context.assemble`                      |
| knowledge      | Cognitive Domain | RAG collection + MCP                          | Conversational + consolidated memory retrieval       | MCP `kb.search`, `kb.write`                 |
| evidence       | Cognitive Domain | Inline panel (function)                       | Provenance tracing for any claim                     | MCP `evidence.trace`                        |
| signals        | Cognitive Domain | Notification badge + pipeline                 | Real-time sensing across connected tools             | SSE stream + MCP `signals.query`            |
| think          | Cognitive Domain | Custom model `iw-twin-think`                  | Reasoning orchestration                              | `/v1/chat/completions`                      |
| act            | Cognitive Domain | Approval modal (function)                     | Governed action execution                            | MCP `act.execute` (requires approval token) |
| govern         | Cognitive Domain | Policy panel                                  | Policy check + audit emission                        | MCP `govern.check`, `govern.audit`          |
| adjust         | Cognitive Domain | Correct/redo function                         | Decision correction loop (ADJUST in Sense/Think/Act) | MCP `adjust.correct`                        |
| audit          | Cognitive Domain | Workspace tab                                 | Cross-layer integrity monitoring                     | MCP `audit.query`                           |
| agent          | Cognitive Domain | Custom model `iw-twin-proactive` (background) | Proactive reasoning without prompt                   | Cron → Pipeline → model                     |
| twin           | Cognitive Domain | Trust score badge (function)                  | Twin identity + trust surface                        | MCP `twin.trust`, `twin.identity`           |
| chat           | Cognitive Domain | Native Open WebUI chat                        | Multi-turn conversational interface                  | OWUI native                                 |
| search         | Cognitive Domain | MCP + workspace                               | Triage + knowledge search                            | MCP `triage.search`, `kb.search`            |
| bridge         | Cognitive Domain | Workspace dashboard                           | Sense / Think / Act unified mission control          | OWUI workspace                              |
| goal-framework | Cognitive Domain | Side panel + MCP                              | Goal/outcome tracing for every insight               | MCP `goals.read`, `goals.write`             |

---

## 5. Category 2 — Interaction Surfaces

Human-facing operational interfaces. These can evolve independently of the cognitive domains they expose.

| Surface          | Category            | Open WebUI Role               | Runtime Role                                       | Access Path                        |
| ---------------- | ------------------- | ----------------------------- | -------------------------------------------------- | ---------------------------------- |
| ai-chat          | Interaction Surface | Native Open WebUI chat        | Conversational entry into the Twin                 | OWUI native                        |
| workflow-builder | Interaction Surface | Pipeline editor (design mode) | **Design** of executable workflows (not execution) | OWUI Pipelines UI                  |
| document-storage | Interaction Surface | RAG document collection       | Document ingest + retrieval                        | OWUI RAG + S3/R2                   |
| approvals        | Interaction Surface | Approval modal + queue        | Human-in-the-loop gate UI                          | OWUI function + Workers HITL DO    |
| trust-panels     | Interaction Surface | Trust score panels            | Confidence + provenance display                    | OWUI function                      |
| triage-inbox     | Interaction Surface | Workspace tab                 | Memory triage queue                                | OWUI workspace + MCP `triage.list` |
| dashboards       | Interaction Surface | OWUI workspace dashboards     | Cross-domain situational view                      | OWUI workspace                     |
| stackedit        | Interaction Surface | External (browser)            | Markdown editor on GitHub-backed canon             | StackEdit ↔ GitHub round-trip      |
| owui-workspaces  | Interaction Surface | Workspace registry            | Per-domain workspace (sales, success, ops, etc.)   | OWUI workspaces                    |

---

## 6. Category 3 — Runtime Primitives

The Twin's execution substrate. **Architecturally the most critical category** — these are not UI concepts, they are the cognition mechanics.

| Surface         | Category          | Open WebUI Role            | Runtime Role                                      | Access Path                             |
| --------------- | ----------------- | -------------------------- | ------------------------------------------------- | --------------------------------------- |
| skills          | Runtime Primitive | Tool registry              | Capability execution unit                         | OWUI Tools + MCP                        |
| prompts         | Runtime Primitive | Prompt library (versioned) | Instruction substrate per domain                  | OWUI Prompts + Twin runtime             |
| tool-calls      | Runtime Primitive | OpenAI function calling    | Tool invocation protocol                          | `/v1/chat/completions` (functions)      |
| mcp             | Runtime Primitive | MCP client config          | Tool/resource exchange protocol                   | OWUI MCP client → N Twin MCP servers    |
| context-window  | Runtime Primitive | (transparent)              | Token budget + E360 packing                       | Twin runtime internal                   |
| memory          | Runtime Primitive | (transparent)              | Conversational memory store                       | Spine DB memory.conversational_memory   |
| working-memory  | Runtime Primitive | (transparent)              | Short-term scratchpad per session                 | Twin runtime in-process                 |
| model-routing   | Runtime Primitive | Custom model entry         | Provider/model selection (OpenRouter upstream)    | OWUI model registry → Twin → OpenRouter |
| streaming       | Runtime Primitive | SSE on chat                | Token-stream delivery                             | SSE on `/v1/chat/completions`           |
| evals           | Runtime Primitive | Thumbs/score function      | Eval logging + quality signal                     | OWUI function → Twin eval log           |
| approvals-token | Runtime Primitive | (transparent)              | HITL gate token issued by Govern, consumed by Act | Workers HITL DO                         |

---

## 7. Category 4 — Automation / Workflow Fabric

The nervous system. Triggers, graphs, schedulers, background execution. **Distinct from cognition itself.**

| Surface              | Category          | Open WebUI Role  | Runtime Role                                      | Access Path                                 |
| -------------------- | ----------------- | ---------------- | ------------------------------------------------- | ------------------------------------------- |
| workflows            | Automation Fabric | Pipeline runtime | **Execution** of cognition graphs (DAGs)          | OWUI Pipelines runtime + MCP `workflow.run` |
| automations          | Automation Fabric | (background)     | Triggering mechanisms (rule-driven)               | Workers cron + event handlers               |
| triggers             | Automation Fabric | (background)     | Event sources (signal, webhook, schedule, manual) | Workers Queues + signal-engine              |
| pipelines            | Automation Fabric | OWUI Pipelines   | Composable filters/actions on chat traffic        | OWUI Pipelines                              |
| schedulers           | Automation Fabric | (background)     | Cron + interval-based dispatch                    | Workers cron triggers                       |
| event-routing        | Automation Fabric | (background)     | Pub/sub between services                          | Workers Queues + Durable Objects            |
| background-execution | Automation Fabric | (background)     | Long-running jobs outside chat turn               | Workers + queue consumers                   |

---

## 8. Critical Distinctions to Preserve

These distinctions are load-bearing. Do not collapse them in future refactors.

| Distinction                                                        | Why it matters                                                                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **workflow-builder** (Interaction) vs **workflows** (Automation)   | Design surface vs runtime execution. Different evolution rates, different owners.                                                                             |
| **workflows** vs **automations** vs **triggers**                   | Graph definition vs rule that fires it vs event that activates the rule. Three distinct layers.                                                               |
| **skills** vs **tool-calls**                                       | Capability unit (durable) vs invocation protocol (per-turn).                                                                                                  |
| **prompts** vs **accelerators**                                    | Versioned instruction substrate vs UX-shipped templates. (`accelerators` may collapse into `prompts` in v2; for now treat as alias.)                          |
| **memory** (Runtime Primitive) vs **knowledge** (Cognitive Domain) | Substrate that stores vs domain that reasons over what is stored.                                                                                             |
| **chat** (Cognitive Domain) vs **ai-chat** (Interaction Surface)   | The conversational territory vs the UI surface that exposes it.                                                                                               |
| **User Workbench** vs **Twin Workbench**                           | Projection-native customer/product shell vs Open WebUI primary cognitive surface. Context may pass between them, but they must never collapse into one shell. |
| **Twin Workbench** vs **Governance**                               | Twin reasons and surfaces proposals; Governance owns approval, policy, and controlled mutation. Governance is embedded — not a separate shell.                |
| **agent** vs **twin**                                              | Background proactive reasoner vs trust/identity surface of the unified Twin.                                                                                  |

---

## 9. What This Contract Replaces

| Source                                                                                      | Status                                                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `docs/tech/SYSTEM_FLOW_DEFINITIVE.md` §L2 (claims "14 components", lists 9)                 | Update to point to this doc                                                                           |
| `docs/design/FIGMA_DESIGN_CONTEXT.md` §L2 Cognitive Overlay (lists 6 panels)                | Update to point to this doc; FIGMA list is a _subset_ of Interaction Surfaces                         |
| `apps/web/src/components/l2/cognitive/cognitive-panel-provider.tsx` `CognitiveSurface` enum | Code-side enumeration of _drawer-rendered_ Cognitive Domains; expand or rename only via this contract |
| `apps/web/src/components/l2/*` directory layout                                             | Folder structure should converge to mirror Categories 1+2 over time                                   |

This contract governs the Twin surface only. It does not define the Operational Workbench shell. Governance is embedded at every layer, not a separate surface.

---

## 10. Open Questions

1. Does **`accelerators`** stay as its own entry, or fold into `prompts`?
2. Does **`bridge`** (Sense/Think/Act mission control) live as a Cognitive Domain or graduate to a top-level meta-surface that orchestrates the other three?
3. Should **`audit`** split into `audit` (read) and `governance-audit-log` (write-only sink)?
4. **`background-execution`** vs **`schedulers`** — keep both or merge?
5. Naming: confirm **"Cognitive Runtime Environment"** as the umbrella phrase. Alternatives: "Cognitive Layer", "Cognitive Intelligence Overlay" (both already approved canon).

---

## 11. Architectural Convergence Note

This contract is the place where IntegrateWise stops being describable as "an AI assistant" or "an agent system" or "a knowledge management tool", and becomes accurately describable as:

```
Persistent Cognitive Runtime
    + Federated Memory
    + Governed Organisational Truth
    + Human Cognitive Surfaces
    + Automation Fabric
    + Runtime Execution Primitives
```

The 14-surface enumeration in earlier docs was an early, incomplete glimpse of this topology. This contract makes the topology explicit so future work plugs into it deliberately rather than rediscovering it ad hoc.

---

## 12. Maintenance Rules

- **Adding a surface:** must declare Category and fill all 5 mapping columns. PR must reference an existing Cognitive Domain it serves (or justify a new domain).
- **Removing a surface:** requires migration note + update to dependent Interaction Surfaces and Runtime Primitives.
- **Renaming:** update the `CognitiveSurface` enum, the `apps/web/src/components/l2/*` directory, and this contract atomically.
- **Counts are not part of the contract.** Do not write "the N cognitive domains" or "the N runtime primitives" in product or marketing copy. Refer to categories.
