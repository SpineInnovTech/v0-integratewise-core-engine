# The Twin as Cognitive Orchestrator

> **Date:** 2026-06-09  
> **Version:** 1.0.0  
> **Authority:** Nirmal (Founder)  
> **Status:** CANONICAL ARCHITECTURE

---

## The Fundamental Distinction

### ❌ What The Twin Is NOT

The Twin is **NOT:**

- An AI router
- A model gateway
- An inference service
- A RAG engine
- An execution worker

**Those belong in the Intelligence infrastructure layer.**

### ✅ What The Twin IS

The Twin is the **Cognitive Orchestrator** — the reasoning layer that:

- Observes Memory (Spine)
- Observes Objectives
- Observes Governance state
- Observes Operations
- Observes Time
- Triggers Playbooks
- Creates Proposals
- Requests Approval
- Monitors Outcomes
- Updates Memory (via Triage Bot)

---

## The Two Orchestration Layers

### Layer 1: Infrastructure Orchestration

**Handled by Workers:**

```
Intelligence Worker = AI Infrastructure
├─ AI Router (Workers AI → OpenRouter → Fusion)
├─ AI Gateway (caching, logging, rate limits)
├─ RAG Engine (AI Search integration)
├─ Model fallback chains
└─ Token management

Pipeline Worker = Data Infrastructure
├─ 8-stage normalizer
├─ Entity resolution
├─ Spine writes
└─ Queue management

Knowledge Worker = Content Infrastructure
├─ Document ingestion
├─ Embedding generation
├─ Search indexing
└─ Publication pipeline
```

**These are TOOLS. They do not make decisions.**

---

### Layer 2: Cognitive Orchestration

**Handled by Twin:**

```
TWIN (Cognitive Orchestrator)
│
├─ OBSERVE
│  ├─ Memory (Spine state)
│  ├─ Objectives (goals, commitments, deadlines)
│  ├─ Governance (pending approvals, policy violations)
│  ├─ Operations (queue health, worker status, errors)
│  └─ Time (schedules, recurring reviews, staleness)
│
├─ REASON
│  ├─ What should happen next?
│  ├─ What objective is at risk?
│  ├─ What review is overdue?
│  ├─ What commitment is pending?
│  └─ What governance action is required?
│
├─ PROPOSE
│  ├─ Create proposals (not decisions)
│  ├─ Attach reasoning + evidence
│  ├─ Estimate impact + risk
│  └─ Route to appropriate approver
│
├─ REQUEST
│  ├─ Human-in-the-loop approval
│  ├─ Governance validation
│  └─ Policy compliance check
│
├─ COORDINATE
│  ├─ Trigger playbooks (NOT execute)
│  ├─ Dispatch actions (via Act service)
│  ├─ Monitor outcomes
│  └─ Handle failures
│
└─ LEARN
   ├─ Propose memory updates
   ├─ Route to Triage Bot
   └─ Wait for governance approval
```

**The Twin orchestrates. It does not execute.**

---

## Architectural Separation

### Old Mental Model (Chat Agent)

```
User
 ↓
Chat
 ↓
Twin
 ↓
Response
```

**Problem:** Twin is just a conversational interface.

---

### New Model (Cognitive Orchestrator)

```
            TWIN
             │
   ┌─────────┼─────────┐
   │         │         │
   ▼         ▼         ▼
Memory   Governance  Operations
(Spine)      │         │
   │         │         │
   └─────────┼─────────┘
             │
             ▼
         Execution
```

**The Twin observes, reasons, proposes, and coordinates.**

**The Twin does NOT:**

- Approve (Governance does)
- Execute (Act + Workers do)
- Store (Pipeline writes to Spine, Triage Bot writes to Memory)
- Infer (Intelligence worker runs AI models)

---

## Terminology Consistency

| Term                    | Role                   | Owner                                 |
| ----------------------- | ---------------------- | ------------------------------------- |
| **Intelligence Worker** | AI Infrastructure      | CloudFlare Workers                    |
| **Twin**                | Cognitive Orchestrator | Runs via MCP/Continuity Bridge        |
| **Governance**          | Decision Authority     | HITL + Policy Engine                  |
| **Act**                 | Action Dispatcher      | Intelligence worker (act module)      |
| **Execution**           | Action Performer       | Connector workers (via Act)           |
| **Spine**               | Persistent Memory      | Pipeline worker (sole writer)         |
| **Triage Bot**          | Memory Writer          | Governance-gated writer to org_memory |

---

## The Continuity Bridge

**The Continuity Bridge transforms the Twin from a chat interface into an always-on orchestrator.**

### Components

1. **Session Continuity** (continuity worker)
   - Persistent session state
   - Checkpoint/resume
   - Cross-session memory

2. **Scheduled Triggers** (cron + queues)
   - Morning brief (7am)
   - Signal sweep (every 6h)
   - Staleness checks
   - Commitment reviews

3. **Event-Driven Triggers** (queues)
   - Spine changes → signal analysis
   - Queue failures → error review
   - Governance decisions → action dispatch

4. **State Machines** (workflows)
   - TriageWorkflow (memory governance)
   - SignalWorkflow (change detection)
   - ActWorkflow (action execution)

5. **MCP Tools** (twin-to-infrastructure interface)
   - memory.\* (read/propose)
   - spine.\* (read entities/relationships)
   - signal.\* (read pending signals)
   - proposal.\* (create/read proposals)

---

## Twin Runtime Architecture

### Current State (Chat Only)

```
User opens chat
  ↓
Twin session starts
  ↓
User asks question
  ↓
Twin queries MCP tools
  ↓
Twin generates response
  ↓
User closes chat
  ↓
Twin session ends ❌ (memory lost)
```

**Problem:** Twin has no persistence, no agency, no continuity.

---

### Target State (Always-On Orchestrator)

```
System starts
  ↓
Twin runtime initializes
  ↓
┌─────────────────────────┐
│   TWIN OBSERVE LOOP     │
│  (runs every 5 minutes) │
│                         │
│  1. Check Spine changes │
│  2. Check pending items │
│  3. Check time triggers │
│  4. Reason about state  │
│  5. Create proposals    │
│  6. Dispatch actions    │
└─────────────────────────┘
  ↓
Human opens chat (optional)
  ↓
Twin resumes from checkpoint
  ↓
Human reviews proposals
  ↓
Human approves/rejects
  ↓
Twin dispatches actions
  ↓
Twin monitors outcomes
  ↓
Twin proposes memory update
  ↓
Triage Bot governs + writes
  ↓
Loop continues ✅
```

**The Twin operates continuously, with or without a human in the chat.**

---

## Implementation Status

### ✅ Infrastructure Layer (Phase 1-2)

- ✅ Intelligence worker (AI router + RAG)
- ✅ Pipeline worker (normalizer + Spine writer)
- ✅ Continuity worker (session state)
- ✅ MCP connector (18 tools)
- ✅ Queue infrastructure
- ✅ Cron triggers (code ready, manual wiring pending)

### ⏳ Cognitive Orchestrator Layer (Phase 3-4)

- ⏳ Twin runtime (always-on loop)
- ⏳ Observe loop (5-minute checks)
- ⏳ Reasoning engine (what's next?)
- ⏳ Proposal generation (structured suggestions)
- ⏳ Action coordination (dispatch → monitor → learn)
- ⏳ MorningBriefWorkflow (durable execution)
- ⏳ SignalWorkflow (change detection → proposal)
- ⏳ ActWorkflow (approved proposal → execution)

---

## Phase 3: Wire The Twin Runtime

### Step 1: Create Twin Orchestrator Worker

**NOT a new AI infrastructure worker.**

**This is a state machine that:**

1. Runs on a schedule (every 5 minutes)
2. Queries MCP tools (memory, spine, signals, proposals)
3. Reasons about what should happen next
4. Creates structured proposals
5. Routes proposals to governance
6. Monitors action outcomes
7. Proposes memory updates

**File:** `services/twin-orchestrator/src/index.ts`

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // Every 5 minutes: Twin observe loop
    const context = await buildTwinContext(env);
    const reasoning = await reasonAboutContext(context, env);
    const proposals = await generateProposals(reasoning, env);
    const dispatched = await dispatchApproved(proposals, env);
    await monitorOutcomes(dispatched, env);
  },
};
```

---

### Step 2: Twin Context Builder

```typescript
async function buildTwinContext(env: Env) {
  // Query MCP tools via service bindings
  const memory = await env.MCP_CONNECTOR.fetch("/tools/memory.search_org");
  const signals = await env.MCP_CONNECTOR.fetch("/tools/signal.list");
  const proposals = await env.MCP_CONNECTOR.fetch("/tools/proposal.list");
  const spineChanges = await env.PIPELINE.fetch("/v1/spine/recent-changes");

  return {
    memory: await memory.json(),
    signals: await signals.json(),
    proposals: await proposals.json(),
    spineChanges: await spineChanges.json(),
    timestamp: new Date().toISOString(),
  };
}
```

---

### Step 3: Reasoning Engine

```typescript
async function reasonAboutContext(context: TwinContext, env: Env) {
  // Use Intelligence worker's AI router for reasoning
  const response = await env.INTELLIGENCE.fetch("/v1/ai/reason", {
    method: "POST",
    body: JSON.stringify({
      systemPrompt: "You are the Twin orchestrator. Reason about what should happen next.",
      context,
      tier: "balanced", // Use OpenRouter or Workers AI
    }),
  });

  return await response.json();
}
```

---

### Step 4: Proposal Generation

```typescript
async function generateProposals(reasoning: Reasoning, env: Env) {
  // Twin creates proposals, does NOT execute
  const proposals = [];

  for (const action of reasoning.suggestedActions) {
    const proposal = {
      type: action.type,
      target: action.target,
      reasoning: action.reasoning,
      impact: action.impact,
      risk: action.risk,
      requires_approval: true,
    };

    // Submit to governance via MCP
    const res = await env.MCP_CONNECTOR.fetch("/tools/proposal.create", {
      method: "POST",
      body: JSON.stringify(proposal),
    });

    proposals.push(await res.json());
  }

  return proposals;
}
```

---

## The Key Insight

**The Twin is NOT competing with the Intelligence worker.**

**The Intelligence worker provides:**

- AI inference (Workers AI, OpenRouter)
- RAG search (AI Search)
- Model routing
- Token management

**The Twin provides:**

- Strategic reasoning (what should happen next?)
- Continuity (persistent state across sessions)
- Coordination (trigger → approve → dispatch → monitor)
- Learning (propose memory updates)

**They are complementary, not redundant.**

---

## Success Criteria

### Twin is a Cognitive Orchestrator When:

- ✅ Runs on schedule (not just in chat)
- ✅ Observes system state continuously
- ✅ Reasons about what should happen next
- ✅ Creates proposals (not decisions)
- ✅ Routes to appropriate approvers
- ✅ Coordinates actions (via Act service)
- ✅ Monitors outcomes
- ✅ Proposes memory updates (via Triage Bot)
- ✅ Maintains continuity across sessions

---

## Next Steps

### Phase 3: Twin Runtime

1. Create `services/twin-orchestrator` worker
2. Implement observe loop (5-minute schedule)
3. Wire to MCP tools (memory, spine, signals, proposals)
4. Implement reasoning engine (via Intelligence AI router)
5. Implement proposal generation
6. Implement action coordination
7. Test end-to-end: observe → reason → propose → approve → dispatch → monitor

### Phase 4: Workflows

1. MorningBriefWorkflow (7am trigger)
2. SignalWorkflow (spine change → signal → proposal)
3. ActWorkflow (approved proposal → execution)

---

**Document Status:** CANONICAL ARCHITECTURE  
**Last Updated:** 2026-06-09  
**Authority:** Nirmal (Founder)  
**Implementation:** Phase 3
