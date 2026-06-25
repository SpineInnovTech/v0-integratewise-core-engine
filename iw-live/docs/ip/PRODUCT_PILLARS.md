# IntegrateWise — 7 Pillars of Governed Continuity

**v3.0 · May 28, 2026**
**Author:** Nirmal, Founder
**Status:** CANONICAL — Supersedes v2.0 and all prior pillar descriptions
**Scope:** Product, marketing, sales, engineering, architecture. Every feature maps to one of these.

---

> These are not features. They are the reasons someone buys IntegrateWise.
> Every surface, every component, every API exists to deliver one of these.
>
> **IntegrateWise is the Mind. The user's stack provides the Hands.**

---

## The Architectural Correction That Locks Everything

By defining MCP as the universal connector and explicitly moving execution outside the product boundary, IntegrateWise avoids the trap of becoming an expensive, redundant workflow runner.

Hosting execution infrastructure — agents, workflow runners, automation engines — creates a cost structure customers won't pay for because they already own their automation stacks (n8n, Zapier, Agent Zero, their own AI). IntegrateWise does not compete with those. It feeds them.

---

## The Operational Cycle

```
Tool → MCP Pipeline (Inbound) → Spine (Memory) → Twin (Reasoning)
     → Operational Workbench (Governance/Approval) → Handoff (Playbook)
     → User's Agentic Claw (Execution) → MCP Pipeline (Outbound) → Tool
```

This is the complete loop. Every pillar maps to one segment of it.

---

## The 7 Pillars

---

### Pillar 1 — One Surface: Stop Juggling Tools

**The Blueprint:** Modern work is fragmented across CRMs, support desks, communication tools, and documentation systems, forcing the human to become the integration layer.

**The Reality:** IntegrateWise projects all connected tools into a single Operational Workbench. Instead of switching tabs to piece together a narrative, normalized data from every system is surfaced in one unified operating environment where users can read, edit, restructure, and approve.

**How it works:**

- The Loader pulls from every connected tool — any source, any format, any frequency
- The Normalizer resolves everything into one canonical schema (8 stages, LLM at stages 2, 3, 4, 6)
- The Spine holds the unified truth — entity resolution, relationship graph, signal layer
- Every domain workbench (BizOps, Account Success, Sales, Finance, etc.) reads from the same Spine
- Business Operations is the cross-cutting department view — 14 modules, all departments, founder/CEO/COO/CTO lenses

**The proof:** Open IntegrateWise. Ask about an account. It knows the CRM data, the support tickets, the last meeting, the open tasks — from every tool — without you assembling it.

---

### Pillar 2 — Memory: It Knows Everything, Always

**The Blueprint:** AI repeatedly starts cold, and workflows break when context is missing because no system persists knowledge operationally.

**The Reality:** The system is backed by the Spine — a living, permanent record that survives model switches, provider changes, and session boundaries. Memory is divided into three strictly governed scopes:

| Layer                     | Scope                                                                                                     | Retention                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Personal Memory**       | Private working patterns, notes, preferences. Hard-separated from the organisation. Only you can read it. | Per user preference, default 90 days                               |
| **Organisational Memory** | Shared institutional knowledge, decisions, patterns. Survives people leaving.                             | Never delete approved/published. Staging: 30 days if not promoted. |
| **Conversational Memory** | The staging layer for raw interactions. Surfaced within the Twin Workbench.                               | Per plan: 7/30/90/2555 days                                        |

**How it works:**

- Every AI session writes to `memory.conversational_memory`
- Approved insights promote to `memory.org_memory` via Triage Bot
- Personal notes live in `memory.personal_memory` — hard boundary
- pgvector enables semantic search across all three layers
- The Twin reads from all three before every response
- **Triage Bot is the sole mutation gateway** — nothing enters the knowledge base without human confirmation

**The proof:** Close the tab. Come back tomorrow. Ask the Twin about a decision made three months ago. It knows. Because it read from org_memory, not from model weights.

---

### Pillar 3 — Operating Environment: AI Thinks in Context, Waits for Human Approval

**The Blueprint:** IntegrateWise is not a chat interface or a passive dashboard. It is an active environment where context is unified.

**The Reality:** The AI Twin sits inside your workflows, reasoning over the Spine-backed memory. It operates proactively — detecting signals, assembling context, and preparing operational details — but always waits in the Operational Workbench for human approval before anything runs.

```
AI reads from Spine (full context — not 2%, not fragments, everything)
AI reasons over unified truth
AI proposes → human approves → system executes
Nothing executes without your say-so
Works with any model: GPT, Claude, Gemini, local models
```

**How it works:**

- The Twin assembles Entity 360 — Truth + Context + Memory + Signals — before every response
- The Normalizer ensures every tool's data is in the same canonical schema
- The Governed Proposal lifecycle (`draft → pending_review → approved → executing → completed`) enforces the approval gate
- The Twin Workbench is the full AI ecosystem surface: skills, knowledge, agents, prompts, conversational library
- The Twin sidebar in the Operational Workbench pops out only when needed — surfacing insights and requesting approvals inline

**The proof:** The Twin surfaces "Acme Corp is at risk." It proposes three actions. You see the reasoning, the evidence, the expected impact. You approve. Only then does anything happen.

---

### Pillar 4 — Governance, Control & Security: Nothing Happens Without Your Approval

**The Blueprint:** Nothing operational happens without approval, and no memory becomes permanent without governance.

**The Reality:** Governance is a structural architectural layer, not a bolt-on feature. Every action has lineage, and every decision is recorded. The Triage Bot acts as the sole mutation gateway; AI proposes the action, the human approves it, and the system records the immutable audit trail.

```
PROPOSAL LIFECYCLE:
  draft → pending_review → approved | rejected → executing → completed | failed

GOVERNANCE LEVELS:
  auto       — low-risk, high-confidence (notify, draft)
  manual     — human review required (create, update, escalate)
  restricted — senior approval required (destructive, financial, legal)

AUDIT TRAIL:
  Every action logged before it executes. Immutable.
  Lineage preserved forever.
  Every decision traceable to its originating signal and evidence.

SECURITY:
  Personal memory: hard boundary — only you can read it
  Org memory: RLS — tenant isolation enforced
  All writes: CF Worker → Triage Bot → Spine DB (no direct DB access)
  Spine DB REST disabled. Anon key revoked.
```

**How it works:** The Governance Rail sits between cognition and execution. Every proposal passes through it. The Triage Bot scores confidence, checks for conflicts, routes to the right approval level. The audit log is written before the action executes — not after. Lineage is immutable.

**The proof:** Six months from now, ask "why did we update this account record?" The system shows you: which signal triggered it, which proposal was created, who approved it, when it executed, what the outcome was. Full chain. Nothing hidden.

---

### Pillar 5 — Continuity: Between Systems, Work, and Memory

**The Blueprint:** A data lake is a mirror that goes stale; a living system requires a continuous round trip.

**The Reality:** Data enters from external tools, gets normalized, lands in the Spine, and is projected into surfaces. After human action and execution, continuity returns back across the ecosystem through governed writebacks and bidirectional connector paths. Every cycle enriches the memory.

```
TOOL CONTINUITY:
  Operator acts in Jira → MCP reads Jira on next sync
  Spine updates → next playbook reflects what was done
  The loop closes automatically. No manual reporting.

SESSION CONTINUITY:
  Close the tab. Come back. The Twin remembers.
  Switch from GPT to Claude. The context stays.
  Memory doesn't reset. It compounds.

TEAM CONTINUITY:
  Someone leaves. Their knowledge stays in org_memory.
  New hire onboards with full institutional context.
  Decisions made before they joined are searchable.

WORK CONTINUITY:
  Every action logged. Every outcome recorded.
  Every decision traceable to its evidence.
  The organisation learns from everything that happens.
```

**How it works:** The MCP connector reads from every connected tool on every sync cycle. The Normalizer detects what changed. The Spine updates. The Twin's next response reflects the new state. Memory compounds with every cycle. The longer the system runs, the more valuable it becomes.

**The proof:** A team member leaves. Their replacement opens IntegrateWise. They ask the Twin about the accounts they inherited. The Twin knows every decision, every commitment, every risk — because it was all captured in org_memory. The knowledge didn't leave with the person.

---

### Pillar 6 — MCP: The Universal Connector

**The Blueprint:** Relying on fragmented, point-to-point API integrations creates unscalable technical debt. MCP is one lane in a multi-lane system. The LLM gets fragments, not full context. It hallucinates. It fills in what it cannot see.

**The Reality:** Model Context Protocol (MCP) is the primary protocol boundary for software-to-software communication into IntegrateWise. It acts as the universal bridge in both directions:

- **Inbound:** Connected tools and software send data through the MCP pipeline, where a Loader fetches it and a Normalizer transforms it into canonical shape for the Spine.
- **Outbound:** It serves as the pathway for governed writebacks to external systems once an action is approved.

```
INBOUND:
  External tool (any) → MCP boundary → Loader (fetch) → Normalizer (transform) → Spine

OUTBOUND:
  Spine → Approved proposal → MCP boundary → External tool (write-back)
```

**What MCP exposes (Spine access tools):**

- `spine.*` — entity read/write/search
- `memory.*` — conversational/org/personal memory
- `signal.*` — live signal access
- `proposal.*` — governed write path
- `search.*` — semantic search across Spine

**What does NOT belong in MCP:**

- Tool-specific connectors (HubSpot, Jira, Figma) — these are upstream, feeding the Spine via Loader
- Knowledge Bank wrappers — KB is a Spine layer, not a separate tool
- Any product-specific API wrapper

**The rule:** Tools feed the Spine. MCP exposes the Spine. These are two different directions.

**How it works:** The Normalizer's job is to understand what a piece of data _is_ and what should happen to it — that is an LLM reasoning task. The output of that reasoning is in the language the LLM already speaks: MCP tool calls. No adapter. No mapper. No translation layer. Source identity dies at the Normalizer. The Spine never knows which tool produced the data.

**The proof:** Other platforms: MCP for some tools, REST for others, webhooks for others. Translation happens 3–4 times across the pipeline. IntegrateWise: one lane. All tools. All directions. Normalize Once, Render Anywhere.

**The tagline:** _Normalize Once, Render Anywhere._

---

### Pillar 7 — Handoff, Not Execution

**The Blueprint:** Hosting execution infrastructure (agents, workflow runners) creates a cost structure customers won't pay for because they already own their automation stacks (n8n, Zapier, Agent Zero).

**The Reality:** IntegrateWise owns the memory; the user owns the execution. IntegrateWise reasons, plans, and prepares actions, but execution remains outside the product boundary. The Twin compiles the intelligent "playbook" and hands it off to the user's own agentic claw and stack to execute in their native tools.

```
IntegrateWise:
  Connects → Normalizes → Stores → Projects → Reasons → Proposes

User's Agentic Claw:
  Receives proposal + full context → Executes in user's tools → Returns outcome
```

**How it works:**

- The Governed Proposal lifecycle produces a complete action package: what to do, why, with what evidence, at what confidence level, with what expected impact
- This package is handed to the user's AI (Hermes, Claw, or external) which executes in the user's own environment
- Hermes and Claw are the runtime agents — their features (skill execution, proposal routing, execution logs, agent colony) are surfaced inside the product
- IntegrateWise records the outcome when it returns through the MCP pipeline
- The loop closes

**The proof:** The Twin says "Update Acme's health score in HubSpot from 78 to 65, flag for renewal risk, and schedule a CSM call." It shows the full reasoning chain. The user's agentic claw executes in HubSpot. IntegrateWise records the outcome. The loop closes.

---

## The 7 Pillars — One Statement Each

| #   | Pillar                 | One Line                                                                           |
| --- | ---------------------- | ---------------------------------------------------------------------------------- |
| 1   | One Surface            | Stop juggling tools. Everything connected, one place.                              |
| 2   | Memory                 | It knows everything, always. Personal, org, and conversational — never resets.     |
| 3   | Operating Environment  | AI thinks in context. Waits for your approval. Any model, full context.            |
| 4   | Governance & Control   | Nothing happens without your say-so. Full audit trail. Immutable lineage.          |
| 5   | Continuity             | Between systems, work, and memory. The loop closes automatically.                  |
| 6   | MCP                    | The Universal Connector. One protocol. All tools. Normalize Once, Render Anywhere. |
| 7   | Handoff, Not Execution | IntegrateWise is the Mind. The user's stack provides the Hands.                    |

---

## Feature → Pillar Map

| Feature                                             | Pillar                    |
| --------------------------------------------------- | ------------------------- |
| Loader + Normalizer + Spine                         | 1 — One Surface           |
| Operational Workbench (14 domain views)             | 1 — One Surface           |
| Business Operations (14 modules, cross-dept)        | 1 — One Surface           |
| `memory.conversational_memory`                      | 2 — Memory                |
| `memory.org_memory`                                 | 2 — Memory                |
| `memory.personal_memory`                            | 2 — Memory                |
| Memory View (documentation-site style)              | 2 — Memory                |
| Entity 360                                          | 3 — Operating Environment |
| Twin Workbench (skills, knowledge, agents, prompts) | 3 — Operating Environment |
| Twin sidebar (pops out when needed)                 | 3 — Operating Environment |
| Governed Proposal lifecycle                         | 4 — Governance & Control  |
| Triage Bot (sole memory writer)                     | 4 — Governance & Control  |
| Audit log + lineage                                 | 4 — Governance & Control  |
| MCP sync (loop closes)                              | 5 — Continuity            |
| Session persistence                                 | 5 — Continuity            |
| Org memory (survives people)                        | 5 — Continuity            |
| MCP protocol layer (inbound + outbound)             | 6 — MCP                   |
| Normalize Once, Render Anywhere                     | 6 — MCP                   |
| Proposal handoff to agentic claw                    | 7 — Handoff               |
| Hermes / Claw runtime (surfaced inside product)     | 7 — Handoff               |
| Intelligence Workspace                              | 1 + 3                     |
| Execution Workspace                                 | 1 + 3 + 5                 |
| Knowledge Workspace                                 | 2 + 4 + 5                 |

---

## Infrastructure

| Component          | Role                                                                          |
| ------------------ | ----------------------------------------------------------------------------- |
| CF Workers (22+)   | Stateless workflows, globally distributed                                     |
| Spine DB           | Durable truth (memory.\*, RLS, pgvector)                                      |
| CF D1              | Read-only Spine mirror                                                        |
| CF KV              | Hot cache (TTL 60–300s)                                                       |
| CF Queues (6)      | Async work (pipeline, knowledge, accelerator, intelligence, ops-dlq, signals) |
| CF Durable Objects | Stateful services (Folder Watcher, HITL, Schema AI)                           |
| n8n                | Stateful/HITL workflows                                                       |

---

## The Tagline

> **One surface. Persistent memory. AI that thinks in context. Nothing without your approval. Continuity across everything. One protocol. Handoff to your AI.**

---

_Document: IntegrateWise — 7 Pillars of Governed Continuity v3.0_
_Author: Nirmal, Founder_
_Status: CANONICAL — Supersedes all prior pillar descriptions._
_Date: May 28, 2026_
