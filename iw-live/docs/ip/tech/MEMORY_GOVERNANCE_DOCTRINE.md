# Memory Governance Doctrine — The Contract

**Date:** 2026-06-09
**Status:** Approved
**Source:** ep-2026-06-09-memory-pipeline-triage
**Authority:** Founder + Architecture Team

---

## The Core Principle

**NO DIRECT MEMORY WRITES**

All memory flows through:

```
AI Worker → AI Worker → Triage Bot → Conversational Memory (Book of Records)
```

Everything else is forbidden.

---

## The Complete Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ INTERFACES (How users/systems interact)                     │
│ - Twin (OWUI chat)                                          │
│ - Voice (x.ai STT/TTS)                                      │
│ - API (programmatic)                                        │
│ - CLI (terminal)                                            │
│ - Browser Agent (automation)                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ TWIN RUNTIME (Cognitive Orchestrator)                       │
│ - Observe (system state)                                    │
│ - Reason (OpenRouter Agents)                                │
│ - Propose (governed actions)                                │
│ - Coordinate (execution)                                    │
│ - Monitor (outcomes)                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ MEMORY       │  │ SPINE        │  │ GOVERNANCE   │
│              │  │              │  │              │
│ Query        │  │ Query        │  │ Create       │
│ (read)       │  │ (read)       │  │ Proposals    │
└──────────────┘  └──────────────┘  └──────┬───────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │ HITL         │
                                    │ (Human)      │
                                    │ Approve/     │
                                    │ Reject       │
                                    └──────┬───────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │ ACT SERVICE  │
                                    │ (Execute)    │
                                    └──────┬───────┘
                                            │
         ┌──────────────────────────────────┼───────────────┐
         │                                  │               │
         ▼                                  ▼               ▼
┌──────────────┐                   ┌──────────────┐  ┌──────────────┐
│ APIs         │                   │ Browser      │  │ Human        │
│ (HubSpot,    │                   │ Agent        │  │ Tasks        │
│ Jira, etc.)  │                   │ (Playwright) │  │ (Manual)     │
└──────┬───────┘                   └──────┬───────┘  └──────┬───────┘
       │                                  │                 │
       └──────────────────────────────────┼─────────────────┘
                                          │
                                          ▼
                                  ┌──────────────┐
                                  │ OUTCOMES     │
                                  │ (Results)    │
                                  └──────┬───────┘
                                          │
                                          ▼
                                  ┌──────────────────────┐
                                  │ AI WORKER CHAIN      │
                                  │ AI Worker →          │
                                  │ AI Worker →          │
                                  │ TRIAGE BOT           │
                                  └──────┬───────────────┘
                                          │
                                          ▼
                          ┌───────────────────────────────┐
                          │ CONVERSATIONAL MEMORY         │
                          │ (Book of Records format)      │
                          │                               │
                          │ Types:                        │
                          │ - episode                     │
                          │ - decision                    │
                          │ - learning                    │
                          │ - commitment                  │
                          │ - fact                        │
                          │ - action_item                 │
                          └───────┬───────────────────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  │               │               │
                  ▼               ▼               ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ SEARCH       │  │ GOVERNANCE   │  │ PROMOTION    │
        │ INDEX        │  │ QUEUE        │  │ QUEUE        │
        │ (auto)       │  │ (review)     │  │ (review)     │
        └──────────────┘  └──────────────┘  └──────┬───────┘
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │ ORG MEMORY   │
                                            │ (promoted    │
                                            │ only)        │
                                            └──────┬───────┘
                                                    │
                                                    ▼
                                            ┌──────────────────┐
                                            │ SURFACE          │
                                            │ PROJECTION       │
                                            │ - OWUI Knowledge │
                                            │ - Book of Proj   │
                                            │ - Evolution      │
                                            └──────────────────┘
```

---

## The Pipeline (Stage by Stage)

| Stage | Actor                         | Writes?                               | Format                                                   |
| ----- | ----------------------------- | ------------------------------------- | -------------------------------------------------------- |
| 1     | AI Worker → AI Worker         | No canonical memory                   | Internal handoff                                         |
| 2     | **Triage Bot**                | **Yes — conversational memory only**  | **Book of Records primitives**                           |
| 3     | Search index                  | Auto-index from conversational memory | Searchable chunks                                        |
| 4     | Governance / Promotion queues | Triage routes candidates              | Queue items with lineage                                 |
| 5     | Human reviewer                | Approves promotion                    | —                                                        |
| 6     | Org memory                    | Human-promoted only                   | episode, decision, learning, commitment, fact, doctrine  |
| 7     | Surface projection            | Publication worker                    | OWUI Knowledge collections, Book of Projects / Evolution |
| 8     | Twin / AI Worker              | Read + propose                        | RAG, tools, chat UI                                      |

---

## Book of Records Primitives

Triage Bot outputs to conversational memory:

### 1. Episode

Time-bounded chapter with decisions, learnings, commitments.

### 2. Decision

Explicit choice + rationale + alternatives considered.

### 3. Learning

Takeaway for future work (what we learned from experience).

### 4. Commitment

What we agreed to do (owner, action, deadline).

### 5. Fact

Verifiable institutional fact (verified, source, confidence).

### 6. Action Item

What needs addressing (urgency, assigned_to, blocked_by).

---

## The Seven Decisions

### 1. No Direct Writes

Agents, Ops write-session-log, and Twin must not write session logs or conversational memory directly. All canonical shaping goes through Triage Bot.

### 2. Conversational Memory is the Staging Book

Triage writes Book of Records format into conversational memory. It is structured institutional draft, not disposable chat — until aged.

### 3. Search is Parallel, Not a Gate

Conversational memory is indexed for search immediately. Promotion to org memory is a separate human-governed path.

### 4. Promotion is Human-Only

Triage Bot may queue. Humans approve. Org memory is never auto-promoted.

### 5. Org Memory Projects to Surfaces

Approved org memory becomes files/collections on Twin knowledge surfaces (functional collections, Book of Projects, Evolution). AI workers fetch from those surfaces + search.

### 6. Decision TTL in Conversational Memory

Decisions in conversational memory that are not referenced or used for 30 days are aged or deleted. (Refinement of the general 90-day conversational archive rule — decisions age faster.)

### 7. Twin Wiring is Read-Heavy

Open WebUI gets: knowledge surfaces (org projection), session logs rendered as chats, conversational memory threads, tool servers, and skill definitions mapped to tools. Write path stays in the worker pipeline.

---

## What Twin Shows vs What It Writes

| Twin Surface                                 | Source                                          | Write Path                              |
| -------------------------------------------- | ----------------------------------------------- | --------------------------------------- |
| Knowledge collections                        | Org memory projection                           | None — read only                        |
| Chats that are session logs                  | Conversational memory threads                   | None — imported/rendered                |
| Book of Projects / Evolution                 | Org memory episode projection                   | None — read only                        |
| Tools (continuity, agent-zero, MCP, book.\*) | Tool servers                                    | Propose only; triage captures outcomes  |
| Skills (per tool)                            | Skill manifests → system prompt / tool metadata | Defined in ops; not memory writes       |
| Live chat                                    | User ↔ Twin                                     | Input to pipeline; triage shapes output |

---

## Skills: How Twin Uses Tools Without Writing Memory

### Read-Only Skills (No Approval)

- `continuity.search` — Query Spine
- `book.get_episodes` — Query org memory
- `twin.morning_brief` — Observe system state

**Rule:** Twin can execute directly. No proposal, no approval.

---

### Write Skills (Always Approval)

- `memory.propose_candidate` — Propose memory promotion
- `spine.create_entity` — Create Spine entity
- `browser.execute` — Execute browser automation

**Rule:** Twin creates proposal → Governance queue → Human approves → Act executes → Triage Bot records

---

## Example Flow: Voice → Proposal → Approval → Execution → Memory

### User speaks: "Create a HubSpot contact for Jane Smith at Beta Inc"

**Step 1: Twin reasons**

```
Voice → STT → Twin Runtime
Twin: [checks if Jane Smith exists via continuity.search]
Result: Not found
Twin: [decides to propose entity creation]
```

**Step 2: Twin proposes**

```
Twin: [calls spine.create_entity skill]
Proposal created: prop-123
```

**Step 3: Twin responds**

```
Twin → TTS → Voice
"I've proposed creating Jane Smith at Beta Inc. You can approve this in L2 Governance."
```

**Step 4: Human approves**

```
User: [opens L2 Governance UI]
User: [clicks "Approve" on prop-123]
```

**Step 5: Act executes**

```
Governance → Act Service
Act: [calls Pipeline to create Person entity]
Pipeline: [writes to Spine + D1]
Response: { success: true, spine_id: "person-456" }
```

**Step 6: Triage Bot records outcome**

```
Act → Outcome event
AI Worker → AI Worker → Triage Bot
Triage Bot: [writes to conversational_memory]
{
  type: "fact",
  title: "Jane Smith created in Spine",
  content: "Person entity created: Jane Smith at Beta Inc (spine_id: person-456)",
  scope: "work",
  created_by: "triage-bot"
}
```

**Step 7: Twin notifies user**

```
Twin → TTS → Voice
"Jane Smith has been created. Entity ID: person-456."
```

---

## TTL Rules

| Memory Type                   | TTL     | Rule               |
| ----------------------------- | ------- | ------------------ |
| General conversational memory | 90 days | Archive or delete  |
| Decisions (unused)            | 30 days | Age or delete      |
| Action items (completed)      | 7 days  | Delete             |
| Facts (expired)               | 0 days  | Delete immediately |
| Episodes                      | Never   | Manual review only |

---

## Gaps vs Today

| Today                                        | Pipeline Target                                                  |
| -------------------------------------------- | ---------------------------------------------------------------- |
| write-session-log.ts posts directly to spine | Emit triage input event only                                     |
| Continuity tool reads spine                  | Keep — query-time read is correct                                |
| OWUI filters inject context                  | Keep — but label as browse, spine wins                           |
| No session-log → chat import                 | Need worker to render conversational memory as OWUI chat threads |
| No promotion queue in OWUI                   | L2 governance queue (ops or live)                                |
| MEMORY_MODEL: 90-day archive all conv        | Add: decisions unused 30d → age/delete                           |

---

## Implementation Commitments

| #   | Owner              | Action                                                         |
| --- | ------------------ | -------------------------------------------------------------- |
| 1   | Pipeline           | AI Worker → AI Worker → Triage Bot chain as sole memory writer |
| 2   | Triage Bot         | Emit Book of Records primitives into conversational memory     |
| 3   | Search worker      | Index conversational memory on write                           |
| 4   | Governance UI (L2) | Promotion queue with human approve → org memory                |
| 5   | Publication worker | Org memory → OWUI Knowledge + Book of Projects surface         |
| 6   | Twin               | Surface reads: knowledge, session-as-chat, tools, skills       |
| 7   | TTL job            | Age/delete conversational decisions unused 30 days             |

---

## The Contract

**This episode is the contract.**

When we implement Twin wiring, every write path goes through:

```
AI Worker → AI Worker → Triage Bot → conversational_memory (Book of Records format)
```

**Never around it.**

No exceptions.
No shortcuts.
No direct writes.

**All memory is governed.**
**All memory is structured.**
**All memory is searchable.**
**All memory is promotable.**

This is how IntegrateWise memory works.

---

## Files

- Episode: `.iw-memory/specs/twin-owui/memory-pipeline-episode.json`
- Schema: `.iw-memory/specs/twin-owui/triage-output-schema.ts`
- Skills: `.iw-memory/specs/twin-owui/owui-skill-manifest.md`
- Doctrine: `docs/tech/MEMORY_GOVERNANCE_DOCTRINE.md` (this file)

---

**Approved: 2026-06-09**
**Authority: Founder + Architecture Team**
**Status: Active — all implementations must comply**
