# IntegrateWise — Canonical Architecture

**Version:** 2.0
**Date:** 2026-06-09
**Status:** Approved
**Authority:** Founder + Architecture Team

---

## The System Statement

```
One Twin
One Spine
One Memory
One Governance Layer
One Bridge

Many Interfaces
Many Execution Providers

Infinite Capabilities
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         ONE TWIN                                │
│              (Persistent Cognitive Orchestrator)                │
│                                                                 │
│  Observe → Reason → Propose → Coordinate → Monitor → Learn     │
│                                                                 │
│  Runtime: CF Worker (services/twin-orchestrator/)              │
│  Frequency: Every 5 minutes (cron)                             │
│  Reasoning: OpenRouter Agents (multi-model deliberation)       │
│  Memory: Book of Records (via Triage Bot)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   ONE SPINE   │   │  ONE MEMORY   │   │ ONE GOVERNANCE│
│               │   │               │   │     LAYER     │
│ Entities      │   │ Org Memory    │   │               │
│ Relationships │   │ Conversational│   │ Proposals     │
│ Signals       │   │ Personal      │   │ HITL          │
│ Entity 360    │   │ Sessions      │   │ Policy        │
│               │   │               │   │ Audit         │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   ONE BRIDGE  │
                    │               │
                    │ MCP Protocol  │
                    │ 20 Tools      │
                    │ OAuth 2.0     │
                    │ ADK/SDK       │
                    │               │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────────────────────────────────────────────┐
│              MANY INTERFACES                          │
├───────────────┬───────────────┬───────────────────────┤
│ OWUI (chat)   │ Voice (speak) │ API (programmatic)   │
│ CLI (term)    │ Email (async) │ Mobile (app)         │
└───────────────┴───────────────┴───────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  GOVERNANCE   │
                    │  (HITL Gate)  │
                    └───────┬───────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────┐
│         MANY EXECUTION PROVIDERS                      │
├───────────────┬───────────────┬───────────────────────┤
│ APIs          │ Browser Agent │ MCP Tools            │
│ (HubSpot,     │ (Playwright)  │ (18 canonical)       │
│ Jira, etc.)   │               │                      │
├───────────────┼───────────────┼───────────────────────┤
│ Workflows     │ Human Tasks   │ Webhooks             │
│ (Durable)     │ (Manual)      │ (Events)             │
└───────────────┴───────────────┴───────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   OUTCOMES    │
                    │  (Results)    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │  TRIAGE BOT       │
                    │ (Book of Records) │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ CONVERSATIONAL    │
                    │    MEMORY         │
                    │ (Staging Book)    │
                    └───────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Search Index │    │ Promotion    │    │ Org Memory   │
│ (Auto)       │    │ Queue (HITL) │    │ (Approved)   │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                                │
                                                ▼
                                        ┌──────────────┐
                                        │  Surface     │
                                        │  Projection  │
                                        │              │
                                        │ - OWUI KB    │
                                        │ - Book Proj  │
                                        │ - Evolution  │
                                        └──────────────┘
```

---

## ONE TWIN

**What:** The persistent cognitive orchestrator

**Role:** Observe, reason, propose, coordinate, monitor, learn

**Implementation:**

```
Location: services/twin-orchestrator/
Runtime: Cloudflare Worker
Trigger: Cron (every 5 minutes)
Reasoning: OpenRouter Agents (ecosystem agent)
Memory: Book of Records (via Triage Bot)
```

**Core Loop:**

```typescript
async function scheduled(event: ScheduledEvent, env: Env) {
  // 1. Observe
  const context = await buildTwinContext(env, tenantId);

  // 2. Reason
  const reasoning = await reasonAboutContext(env, context);

  // 3. Propose
  if (reasoning.suggested_actions.length > 0) {
    await generateProposals(env, reasoning, tenantId);
  }

  // 4. Coordinate
  await coordinateApprovedActions(env, tenantId);

  // 5. Monitor
  await monitorOutcomes(env, tenantId);

  // 6. Learn (via Triage Bot)
  // Outcomes written to conversational_memory
}
```

**Characteristics:**

- Always-on (24/7, every 5 minutes)
- Proactive (observes without being asked)
- Deliberative (multi-model reasoning)
- Cautious (proposes, never executes directly)
- Persistent (all outcomes recorded)
- Learning (improves over time)

---

## ONE SPINE

**What:** The operational truth substrate

**Role:** Canonical entity graph across all tools

**Implementation:**

```
Storage: D1 (edge cache) + Supabase (fortress)
Writer: Pipeline service (SOLE writer)
Readers: MCP tools, Twin, ADK
Schema: Entities, Relationships, Signals, Entity 360
```

**Entities:**

- Person, Account, Deal, Task, Ticket, Invoice, Project, Email, Event, Document

**Relationships:**

- works_at, owns, assigned_to, related_to, reports_to, manages, created_by

**Signals:**

- Entity changes (health drop, activity stall, status change)
- Weak signals (anomalies, patterns, predictions)
- Severity: low, medium, high, critical

**Entity Resolution:**

- One Person across HubSpot + Jira + Gmail + Slack
- Trait detection (18 core traits)
- Resource type mapping (7 canonical types)
- Identity by nature, not label

**The Moat:**

- 30+ connectors normalized into one graph
- Relationship tracking across disconnected tools
- Signal detection at entity level
- Time-series history (all changes tracked)
- Entity 360 views (all context in one place)

---

## ONE MEMORY

**What:** The institutional knowledge substrate

**Role:** What the organization knows and remembers

**Implementation:**

```
Storage: Supabase (org, conversational, personal memory)
Writer: Triage Bot (SOLE writer for conversational)
Format: Book of Records
Promotion: Human-governed only
```

**Memory Types:**

### Conversational Memory (Staging Book)

- Written by: Triage Bot only
- Format: Book of Records (episode, decision, learning, commitment, fact, action_item)
- Scope: user | work | org
- TTL: 90 days (decisions: 30 days)
- Auto-indexed for search

### Org Memory (Institutional Knowledge)

- Written by: Promotion from conversational (human-approved only)
- Format: Book of Records (approved entries)
- Scope: org only
- TTL: Never (permanent)
- Projects to surfaces (OWUI Knowledge, Book of Projects, Evolution)

### Personal Memory

- Written by: Triage Bot (user-scoped)
- Format: Preferences, patterns, context
- Scope: user only
- TTL: 90 days (unless referenced)

**Book of Records Primitives:**

1. **Episode** — Time-bounded chapter (decisions, learnings, commitments)
2. **Decision** — Explicit choice + rationale + alternatives
3. **Learning** — Takeaway for future work
4. **Commitment** — What we agreed to do (owner, action, deadline)
5. **Fact** — Verifiable institutional fact (source, confidence)
6. **Action Item** — What needs addressing (urgency, assigned_to)

**The Doctrine:**

- NO direct writes (all via Triage Bot)
- Search is parallel (immediate indexing)
- Promotion is human-only (never auto-promoted)
- TTL rules (decisions age faster: 30 days)

---

## ONE GOVERNANCE LAYER

**What:** The approval and policy substrate

**Role:** Human-in-the-loop gate for all execution

**Implementation:**

```
Location: services/intelligence/src/govern/
UI: L2 Awareness (Governance queue)
Storage: D1 (proposals, approvals, audit log)
```

**Flow:**

```
Twin → Propose
  ↓
Governance Queue (proposal created)
  ↓
Human Reviews (L2 UI)
  ↓
Approve or Reject
  ↓ (if approved)
Act Service → Execute
  ↓
Triage Bot → Record outcome
```

**Proposal Schema:**

```typescript
{
  tenant_id: string;
  action_type: string;
  target: { entity_id?, url?, tool? };
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  created_by: 'twin-orchestrator';
  reviewed_by?: string;
  executed_at?: string;
}
```

**Policy Engine:**

- Read operations: No approval
- Write operations: Always approval
- High-risk actions: Require justification
- Browser automation: Requires step review
- Entity creation: Requires data validation

**Audit Trail:**

- Every proposal logged
- Every approval logged
- Every execution logged
- Every outcome logged
- Full lineage (proposal → approval → execution → outcome)

---

## ONE BRIDGE

**What:** The communication and extensibility layer

**Role:** MCP + ADK for tool access and custom development

**Implementation:**

### MCP (Model Context Protocol)

```
Server: https://mcp.integratewise.ai
OAuth 2.0: RS256 JWT, 1hr access, 30d refresh
Tools: 20 canonical tools
Scopes: mcp:tools, mcp:resources, tenant:read/write, memory:read/write
```

**20 Canonical Tools:**

**MEMORY Namespace:**

1. `memory.search` — Semantic search across memory
2. `memory.propose_candidate` — Propose promotion to org memory
3. `memory.write_conversational` — Write conversational event (via Triage Bot)
4. `memory.read_conversational` — Read conversational memory

**SESSION Namespace:** 5. `session.write_summary` — Write session summary (via Triage Bot)

**SPINE Namespace:** 6. `spine.get_entity` — Fetch entity by ID 7. `spine.list_entities` — List entities by type 8. `spine.search_entities` — Search entities

**SIGNAL Namespace:** 9. `signal.list` — List signals 10. `signal.create` — Create signal (via Pipeline)

**PROPOSAL Namespace:** 11. `proposal.create` — Create governed proposal 12. `proposal.list` — List proposals 13. `proposal.approve` — Approve proposal (HITL only) 14. `proposal.reject` — Reject proposal (HITL only)

**KB Namespace:** 15. `kb.search` — Search org memory 16. `kb.get_article` — Fetch article 17. `kb.write_article` — Write article (via Triage Bot promotion)

**SEARCH Namespace:** 18. `search.semantic` — Semantic search across all memory

**TOOL Namespace:** 19. `tool.execute` — Execute tool (browser, API, etc.) via Act service

**OPS Namespace:** 20. `ops.read` — Read operations metrics

### ADK (Application Development Kit)

**REST APIs:**

```
Gateway: https://gateway.integratewise.ai
Auth: JWT (Firebase Auth or IntegrateWise OAuth)
Endpoints: /api/v1/spine/*, /api/v1/memory/*, /api/v1/signals/*
Rate Limits: 1000 req/min per tenant
```

**TypeScript SDK:**

```typescript
import { IntegrateWise } from "@integratewise/sdk";

const iw = new IntegrateWise({ apiKey: "..." });

// Query Spine
const entity = await iw.spine.getEntity("person-123");

// Query Memory
const results = await iw.memory.search("architecture decisions");

// Create Proposal
const proposal = await iw.proposals.create({
  action_type: "create_entity",
  target: { entity_type: "Person", name: "John Doe" },
  reasoning: "User requested contact creation",
});
```

**React Hooks:**

```typescript
import { useEntity, useProposals } from '@integratewise/react';

function AccountView({ accountId }) {
  const { entity, loading } = useEntity(accountId);
  const { proposals } = useProposals({ entity_id: accountId });

  return (
    <div>
      <h1>{entity.name}</h1>
      <Proposals items={proposals} />
    </div>
  );
}
```

---

## MANY INTERFACES

**What:** Multiple ways to interact with the Twin

**Principle:** All interfaces reach the same Twin Runtime

### 1. OWUI (Chat)

```
URL: https://twin.integratewise.ai
Stack: Open WebUI + Agent Zero
Voice: x.ai (Kokoro TTS + Whisper STT)
Models: Grok-4.3 (primary), Hermes-internal (fallback)
Connection: Twin Runtime API (/v1/chat/completions)
```

### 2. Voice (Speak)

```
STT: x.ai Whisper (speech → text)
Processing: Twin Runtime API
TTS: x.ai Kokoro "eve" (text → speech)
Mode: Hands-free, brief responses
```

### 3. API (Programmatic)

```
Endpoint: https://twin.dev.integratewise.ai/v1/chat/completions
Auth: Bearer token (IntegrateWise OAuth)
Format: OpenAI-compatible
Use Case: Custom integrations, automation
```

### 4. CLI (Terminal)

```
Command: iw twin ask "what's at risk?"
Auth: ~/.iw/credentials.json
Output: Structured (JSON) or pretty (table)
Use Case: Scripts, automation, power users
```

### 5. Email (Async)

```
Address: twin@integratewise.ai
Processing: Email → Twin Runtime → Response email
Mode: Async, threaded conversations
Use Case: Daily briefs, status updates
```

### 6. Mobile (App)

```
Platform: iOS + Android
Stack: React Native
Connection: Twin Runtime API
Mode: On-the-go, push notifications
```

**All interfaces:**

- Reach same Twin Runtime
- Store in same Memory
- Create same Proposals
- Trigger same Governance
- Record in same Audit Log

---

## MANY EXECUTION PROVIDERS

**What:** Multiple ways to execute approved actions

**Principle:** Twin proposes, Governance approves, Act dispatches, Providers execute

### 1. APIs

```
Providers: HubSpot, Jira, Salesforce, Gmail, Slack, GitHub, etc.
Protocol: REST API
Auth: OAuth 2.0 (per connector)
Use Case: Structured CRUD operations
```

### 2. Browser Agent (Playwright)

```
Location: VPS (integratewise-ops/vps-operations-stack/browser-agent/)
Stack: Playwright + Express
Use Case: Web forms, screenshots, data extraction (no API)
Governance: Always requires approval (high-risk)
```

### 3. MCP Tools

```
Count: 20 canonical tools
Protocol: MCP (Model Context Protocol)
Auth: OAuth 2.0 + service bindings
Use Case: IntegrateWise-native operations
```

### 4. Workflows (Durable Execution)

```
Platform: Cloudflare Workflows
Use Case: Multi-step processes, retries, state management
Examples: Morning brief, signal analysis, triage workflow
```

### 5. Human Tasks

```
Platform: L2 Governance UI (manual task list)
Use Case: Actions that require human judgment
Examples: Complex approvals, relationship calls, strategic decisions
```

### 6. Webhooks

```
Direction: Outbound (notify external systems)
Use Case: Trigger external workflows, send notifications
Examples: Slack alerts, PagerDuty incidents, custom integrations
```

**All providers:**

- Receive from Act service
- Return outcomes
- Outcomes flow to Triage Bot
- Triage Bot writes to Memory
- Twin monitors results

---

## INFINITE CAPABILITIES

**What:** Unlimited business outcomes from composing the system

**Examples:**

### Proactive Account Management

```
Spine detects: Health score drop
Twin reasons: Renewal risk
Twin proposes: Create follow-up task
Human approves
API executes: HubSpot task creation
Triage Bot records: Task created + learning
```

### Voice-Initiated Entity Creation

```
User speaks: "Create contact for Jane Smith"
Voice STT → Twin Runtime
Twin checks: Entity doesn't exist
Twin proposes: Create Person entity
Human approves (L2)
API executes: Pipeline → Spine write
Triage Bot records: Entity created
Voice TTS: "Jane Smith created"
```

### Browser Automation for Legacy Tools

```
Twin detects: Action needed in legacy tool (no API)
Twin proposes: Browser automation (7 steps)
Human reviews steps
Browser Agent executes: Navigate, fill form, submit, screenshot
Triage Bot records: Form submitted + screenshot
Twin monitors: Success
```

### Daily Morning Brief

```
Cron triggers: 7 AM every day
Twin observes: Signals, proposals, at-risk items
Twin compiles: Structured brief
Twin delivers: Voice/Email/Chat
Triage Bot records: Daily episode
```

### Knowledge Search & Promotion

```
User asks: "What did we decide about X?"
Twin searches: Org memory + conversational memory
Twin responds: "We decided Y because Z"
Twin detects: Reusable decision
Twin proposes: Promote to org memory
Human approves
Triage Bot promotes: Conversational → Org memory
```

### Multi-Step Workflow Orchestration

```
Signal detected: Deal stalled
Twin reasons: Needs executive review
Twin proposes: Workflow (notify → schedule → brief → track)
Human approves
Workflow executes: 4-step durable workflow
Triage Bot records: Each step outcome
Twin monitors: Workflow completion
```

**The Pattern:**

```
Observe (Spine/Memory/Operations)
  ↓
Reason (Twin + OpenRouter Agents)
  ↓
Propose (Governed action)
  ↓
Approve (HITL)
  ↓
Execute (Providers)
  ↓
Record (Triage Bot → Memory)
  ↓
Learn (Next observation improves)
```

---

## THE VALUE PROPOSITION

### For Businesses

- Proactive operations (Twin observes 24/7)
- Cross-tool intelligence (Spine unifies all tools)
- Governed AI execution (HITL gate prevents mistakes)
- Institutional memory (learns and improves)

### For Developers

- Build custom surfaces (ADK + React hooks)
- Extend Twin capabilities (MCP tools)
- Query normalized data (Spine API)
- Rapid development (hours, not months)

### For AI Agents

- Access cross-tool context (MCP OAuth)
- Execute governed actions (Propose → Approve → Execute)
- Learn from outcomes (Triage Bot records)
- Persistent memory (sessions + institutional knowledge)

---

## THE MOAT

| Component      | Replaceability | Strength        |
| -------------- | -------------- | --------------- |
| **Spine**      | Impossible     | ██████████ 100% |
| **Twin**       | Hard           | ████████░░ 80%  |
| **Memory**     | Hard           | █████████░ 90%  |
| **Governance** | Medium         | ███████░░░ 70%  |
| **Bridge**     | Medium         | ██████░░░░ 60%  |
| **Interfaces** | Easy           | ████░░░░░░ 40%  |
| **Execution**  | Easy           | ███░░░░░░░ 30%  |

**The Spine is the moat.**

- 30+ connectors normalized
- Entity resolution across all tools
- Relationship graph (exists nowhere else)
- Signal detection at entity level
- 5 years of connector development
- 18 traits × 7 resource types

**The Twin makes it intelligent.**

- Persistent orchestration
- Multi-model reasoning
- Governed execution
- Continuous learning

**Together = Unbeatable.**

---

## THE SYSTEM STATEMENT

```
One Twin        = Cognitive orchestrator (reasoning)
One Spine       = Operational truth (data)
One Memory      = Institutional knowledge (learning)
One Governance  = Approval layer (HITL)
One Bridge      = Communication protocol (MCP + ADK)

Many Interfaces        = Chat, Voice, API, CLI, Email, Mobile
Many Execution Providers = APIs, Browser, MCP, Workflows, Human Tasks

Infinite Capabilities = Observe + Reason + Execute + Learn = Business Value
```

---

## IMPLEMENTATION STATUS

### ✅ Complete

- Spine (entity resolution, relationships, signals)
- Pipeline (sole Spine writer)
- MCP OAuth 2.0 (20 tools, mcp.integratewise.ai)
- Governance (proposals, HITL, audit)
- Act (execution coordination)
- Memory tables (org, conversational, personal)
- OWUI (chat + voice via x.ai)

### 🚧 In Progress

- Twin Runtime (designed, needs deployment)
- Triage Bot (schema defined, needs implementation)
- Browser Agent (VPS, designed, needs deployment)
- Skills (OWUI, manifest created, needs loading)

### 📋 Planned

- CLI interface
- Email interface
- Mobile app
- TTL job (memory aging)
- Publication worker (org memory → surfaces)

---

## FILES

- **This document:** `docs/tech/INTEGRATEWISE_CANONICAL_ARCHITECTURE.md`
- **Twin Runtime:** `services/twin-orchestrator/`
- **Memory Doctrine:** `docs/tech/MEMORY_GOVERNANCE_DOCTRINE.md`
- **Triage Schema:** `.iw-memory/specs/twin-owui/triage-output-schema.ts`
- **Skills Manifest:** `.iw-memory/specs/twin-owui/owui-skill-manifest.md`
- **Episode:** `.iw-memory/specs/twin-owui/memory-pipeline-episode.json`

---

**Approved: 2026-06-09**
**Authority: Founder + Architecture Team**
**Status: Canonical — all implementations must align**

---

**This is IntegrateWise.**

One Twin. One Spine. One Memory. One Governance. One Bridge.
Many Interfaces. Many Execution Providers.
Infinite Capabilities.
