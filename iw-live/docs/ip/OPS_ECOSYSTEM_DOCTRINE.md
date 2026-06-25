# IntegrateWise — Ops Ecosystem Doctrine

**v1.0 · May 28, 2026**  
**Author:** Nirmal, Founder  
**Scope:** Internal reference. Defines the boundary between IntegrateWise and the Ops Ecosystem.  
**Companion to:** `docs/ARCHITECTURE_V2.md`, `docs/OPERATOR_LOOP_DOCTRINE.md`, `docs/SELF_DEMONSTRATION_DOCTRINE.md`

---

> IntegrateWise is the single source of truth and the intelligence layer.  
> The Ops Ecosystem is the separate ground where execution happens.  
> Everything not running inside IntegrateWise runs outside it.

---

## The Fundamental Boundary

```
┌─────────────────────────────────────────────────────────────┐
│                    INTEGRATEWISE                             │
│                                                              │
│  Single source of truth.                                     │
│  Normalizes. Detects. Reasons. Surfaces. Recommends.         │
│  Provides the WHAT and WHY.                                  │
│  Never executes. Never grounds.                              │
│                                                              │
│  Output: Playbook (ordered, prioritized, tool-specific)      │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HANDOFF BOUNDARY
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    OPS ECOSYSTEM                             │
│                                                              │
│  Separate ground. Where execution happens.                   │
│  Where humans act. Where agents run.                         │
│  Where things that can't be automated get done.              │
│                                                              │
│  Input: Playbook from IntegrateWise                          │
│  Output: Actions in the world (tools, meetings, content)     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## The Two Modes of Execution

Execution has two modes. Both live in the Ops Ecosystem. Neither lives inside IntegrateWise.

### Mode 1 — Tool-Mediated Execution

Actions that go through connected tools. Can be automated or semi-automated.

| Example                 | Tool            | Returns to IntegrateWise?       |
| ----------------------- | --------------- | ------------------------------- |
| Create a task in Jira   | Jira            | Yes — MCP re-reads on next sync |
| Update a HubSpot record | HubSpot         | Yes — MCP re-reads on next sync |
| Send an email           | HubSpot / Gmail | Yes — MCP re-reads on next sync |
| Schedule a meeting      | Calendar        | Yes — MCP re-reads on next sync |
| Post to Slack           | Slack           | Yes — MCP re-reads on next sync |

These actions write to tools. IntegrateWise sees the results on the next MCP sync. The loop closes automatically.

### Mode 2 — Human-Grounded Execution

Actions that require human presence, judgment, creativity, or physical reality. Cannot be automated.

| Example                              | Why it can't be automated                                  |
| ------------------------------------ | ---------------------------------------------------------- |
| CSM attends a meeting in person      | Requires physical presence, relationship, reading the room |
| Design a LinkedIn post               | Requires creative judgment, brand voice, human taste       |
| Create a LinkedIn page               | Requires account ownership, human verification             |
| Build a relationship with a prospect | Requires trust, empathy, time                              |
| Make a strategic decision            | Requires context, values, accountability                   |
| Negotiate a contract                 | Requires human judgment, legal authority                   |

These actions happen in the world. IntegrateWise may learn about them (via memory write or MCP re-read), but it cannot perform them.

---

## What the Ops Ecosystem Is

The Ops Ecosystem is a **separate application surface** — not inside IntegrateWise — that:

1. **Receives the playbook** from IntegrateWise (via the Handover Agent)
2. **Routes actions** to the right executor (Hermes for orchestration, Claw for tool-mediated, human for grounded)
3. **Tracks execution state** — what's been done, what's pending, what's blocked
4. **Surfaces human-grounded tasks** — the things that need a human to show up
5. **Feeds results back** — either via MCP (tool-mediated) or via memory write (human-grounded)

### What it is NOT

- It is not a second source of truth. IntegrateWise is the only source of truth.
- It is not a reasoning layer. IntegrateWise reasons. The Ops Ecosystem executes.
- It is not a data store. It reads from IntegrateWise. It writes back to IntegrateWise (via MCP or memory).
- It is not the product. It is the operator's ground.

---

## The Ops Ecosystem Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    OPS ECOSYSTEM                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Ops Surface (integratewise-ops / IW OS)                │ │
│  │                                                          │ │
│  │  Playbook Viewer      — What IntegrateWise recommends    │ │
│  │  Action Queue         — What needs to be done today      │ │
│  │  Human Task Board     — What requires human presence     │ │
│  │  Execution Log        — What has been done               │ │
│  │  Hermes Console       — Orchestration status             │ │
│  │  Claw Execution Log   — Tool-mediated action results     │ │
│  │  Memory Write Panel   — Record human-grounded outcomes   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Hermes           │  │ Claw         │  │ Human         │  │
│  │ (Orchestrator)   │  │ (Executor)   │  │ (Operator)    │  │
│  │                  │  │              │  │               │  │
│  │ Multi-step       │  │ Single-tool  │  │ Grounded      │  │
│  │ coordination     │  │ writes       │  │ execution     │  │
│  └──────────────────┘  └──────────────┘  └───────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         MCP sync    Memory write   Manual log
              │            │            │
              ▼            ▼            ▼
┌──────────────────────────────────────────────────────────────┐
│                    INTEGRATEWISE                              │
│  Spine updates. SignalAnalyzer re-evaluates.                  │
│  Memory records. Next playbook generated.                     │
└──────────────────────────────────────────────────────────────┘
```

---

## The Three Return Paths

When execution happens in the Ops Ecosystem, results return to IntegrateWise via one of three paths:

### Path 1 — MCP Sync (automatic)

Tool-mediated actions write to connected tools. MCP re-reads on the next sync cycle. IntegrateWise detects the change automatically. No manual reporting needed.

```
Claw creates Jira task → MCP reads Jira → Spine updates → loop closes
```

### Path 2 — Memory Write (semi-automatic)

Human-grounded actions that produce a recordable outcome. The Operator writes a memory entry via the Ops Surface. IntegrateWise receives it as org_memory (staging → approved → published).

```
CSM attends meeting → Operator writes: "Met with Acme CTO. Agreed on QBR June 10."
→ memory.org_memory (staging) → Triage Bot scores → approved → Spine knows
```

### Path 3 — Manual Log (human-initiated)

Actions that don't produce a tool artifact or a memory entry. The Operator logs the outcome manually. IntegrateWise records it as an activity.

```
LinkedIn post designed and published → Operator logs: "Posted roadmap update on LinkedIn.
340 impressions, 12 comments." → activity_log → Spine knows
```

---

## The Ops Surface — `integratewise-ops` / IW OS

The `integratewise-ops` repository is the correct home for the Ops Ecosystem surface. It is:

- **Separate** from the customer-facing product (`apps/web`)
- **Separate** from the IntegrateWise engine (`integratewise-live`)
- The **operator's ground** — where Nirmal, Hermes, and Claw work
- The **internal power surface** — not shown to customers

It should evolve into **IW OS** — the full operator environment:

| Section          | What it shows                                                         |
| ---------------- | --------------------------------------------------------------------- |
| Playbook         | Today's recommendations from IntegrateWise, ordered by priority       |
| Action Queue     | Proposals pending approval or execution                               |
| Human Task Board | Things that require human presence — meetings, content, relationships |
| Hermes Console   | Orchestration status, active workflows, pending decisions             |
| Claw Log         | Tool-mediated execution history, success/failure                      |
| Memory Panel     | Write human-grounded outcomes back to IntegrateWise                   |
| Signal Feed      | Live signals from IntegrateWise — what changed, what's at risk        |
| Lineage View     | Full reasoning chain for any proposal                                 |

---

## The Decision — Locked

```
IntegrateWise (integratewise-live + apps/web)
  → Customer-facing product
  → Single source of truth
  → Intelligence, reasoning, governance
  → What the customer buys

Ops Ecosystem (integratewise-ops → IW OS)
  → Internal operator surface
  → Where Nirmal, Hermes, Claw execute
  → Receives playbook from IntegrateWise
  → Feeds results back via MCP / memory / log
  → NOT the customer product
  → NOT a second source of truth
```

**Everything not running inside IntegrateWise runs in the Ops Ecosystem.**  
**IntegrateWise provides the intelligence. The Ops Ecosystem provides the ground.**

---

## The API Contract

The Ops Ecosystem consumes IntegrateWise via:

```
GET  /v1/proposals?ops_surface=command_center   → critical proposals
GET  /v1/proposals?ops_surface=queue            → manual review queue
GET  /v1/proposals?ops_surface=tile             → high priority tiles
POST /v1/proposals/:id/approve                  → human approves
POST /v1/proposals/:id/reject                   → human rejects (with reason)
POST /v1/proposals/:id/execute                  → operator starts execution
POST /v1/proposals/:id/complete                 → execution confirmed
POST /v1/proposals/:id/fail                     → execution failed
GET  /v1/proposals/lineage/:lineage_id          → full reasoning chain
GET  /v1/signals?tenant_id=...                  → live signal feed
GET  /v1/twin/360/:entityId                     → Entity 360 for any entity
POST /memory/write_conversational               → write session memory (MCP tool)
POST /memory/upsert_org                         → write org memory (MCP tool)
```

The response shape is `ProposalOpsProjection` — defined in `packages/types/src/proposal.ts`. The Ops Ecosystem never receives internal governance fields. It receives only what it needs to execute.

---

## The One-Line Statement

> **IntegrateWise is the mind. The Ops Ecosystem is the hands.**

IntegrateWise knows what needs to happen and why. The Ops Ecosystem is where it gets done — by Hermes, by Claw, by a human attending a meeting, by a CSM designing a LinkedIn post. The two are connected by the playbook going out and results coming back. Neither replaces the other.

---

_Document: IntegrateWise Ops Ecosystem Doctrine v1.0_  
_Author: Nirmal, Founder_  
_Companion to: `docs/ARCHITECTURE_V2.md`, `docs/OPERATOR_LOOP_DOCTRINE.md`, `docs/SELF_DEMONSTRATION_DOCTRINE.md`_
