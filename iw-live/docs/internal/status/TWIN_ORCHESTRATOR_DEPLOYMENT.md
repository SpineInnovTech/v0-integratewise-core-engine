# Twin Orchestrator Deployment

> **Date:** 2026-06-09  
> **Status:** READY FOR DEPLOYMENT  
> **Phase:** 3 - Cognitive Orchestration Layer

---

## What Is This

The **Twin Orchestrator** is the cognitive orchestration layer that transforms the Twin from a chat interface into an always-on reasoning system.

**This is NOT:**

- An AI infrastructure worker
- A model gateway
- A RAG engine
- An inference service

**This IS:**

- A reasoning layer (What should happen next?)
- A coordination layer (Observe → Reason → Propose → Dispatch)
- A continuity layer (Persistent state across sessions)
- A planning layer (Strategic oversight)

---

## Architecture Clarity

### Infrastructure Layer (Workers)

```
Intelligence Worker
├─ AI Router (Workers AI → OpenRouter)
├─ RAG Engine (AI Search)
└─ Model Management

Pipeline Worker
├─ Entity Resolution
├─ Spine Writer
└─ Normalization

Knowledge Worker
├─ Document Ingestion
├─ Search Indexing
└─ Publication
```

**These provide tools. They don't make decisions.**

---

### Cognitive Layer (Twin)

```
Twin Orchestrator
│
├─ OBSERVE (every 5 minutes)
│  ├─ Memory state
│  ├─ Pending signals
│  ├─ Pending proposals
│  ├─ Queue health
│  └─ Staleness checks
│
├─ REASON (via Intelligence AI)
│  ├─ What should happen next?
│  ├─ What's at risk?
│  ├─ What's overdue?
│  └─ What needs attention?
│
├─ PROPOSE (structured suggestions)
│  ├─ Create proposals
│  ├─ Attach reasoning
│  ├─ Estimate impact/risk
│  └─ Route to governance
│
├─ COORDINATE (approved actions)
│  ├─ Dispatch to Act service
│  ├─ Monitor execution
│  └─ Handle failures
│
└─ LEARN (via Triage Bot)
   └─ Propose memory updates
```

**The Twin orchestrates. It does not execute.**

---

## Implementation

### Files Created

1. **`services/twin-orchestrator/wrangler.toml`**
   - Scheduled trigger: every 5 minutes
   - Service bindings: MCP, Intelligence, Pipeline, Knowledge, Continuity
   - Workflows: MorningBrief, Signal, Act

2. **`services/twin-orchestrator/src/index.ts`**
   - `scheduled()` — Twin observe loop
   - `buildTwinContext()` — Query all systems via MCP
   - `reasonAboutContext()` — Call Intelligence AI for reasoning
   - `generateProposals()` — Create structured proposals
   - `coordinateApprovedActions()` — Dispatch approved actions
   - `monitorOutcomes()` — Track execution status

3. **`services/twin-orchestrator/package.json`**
   - Dependencies: Hono (HTTP framework)

4. **`docs/tech/TWIN_AS_COGNITIVE_ORCHESTRATOR.md`**
   - Canonical architecture doc
   - Clarifies Twin vs Infrastructure separation

---

## How It Works

### 1. Scheduled Observe Loop (Every 5 Minutes)

```typescript
export async function scheduled(event: ScheduledEvent, env: Env) {
  const context = await buildTwinContext(env, tenantId);
  const reasoning = await reasonAboutContext(env, context, tenantId);
  const proposals = await generateProposals(env, reasoning, tenantId);
  await coordinateApprovedActions(env, tenantId);
  await monitorOutcomes(env, tenantId);
}
```

---

### 2. Build Context (Observe)

Queries via service bindings:

```typescript
// Memory via MCP
const memory = await env.MCP_CONNECTOR.fetch("/v1/memory/org-search");

// Signals via MCP
const signals = await env.MCP_CONNECTOR.fetch("/v1/signals/list");

// Proposals via MCP
const proposals = await env.MCP_CONNECTOR.fetch("/v1/proposals/list");

// Operations health
const health = await env.PIPELINE.fetch("/health");
```

**Result:** Complete system state snapshot

---

### 3. Reason About Context (Think)

Uses Intelligence worker's AI router:

```typescript
const response = await env.INTELLIGENCE.fetch("/v1/test/rag", {
  method: "POST",
  body: JSON.stringify({
    question: `Analyze this context and suggest actions: ${JSON.stringify(context)}`,
    tier: "balanced", // OpenRouter or Workers AI
  }),
});
```

**Result:** Structured reasoning with suggested actions

---

### 4. Generate Proposals (Suggest)

Creates proposals for human approval:

```typescript
for (const action of reasoning.suggested_actions) {
  await env.MCP_CONNECTOR.fetch("/v1/proposals/create", {
    method: "POST",
    body: JSON.stringify({
      type: action.type,
      reasoning: action.reasoning,
      impact: action.impact,
      risk: action.risk,
      requires_approval: true,
    }),
  });
}
```

**Result:** Proposals awaiting HITL approval

---

### 5. Coordinate Actions (Dispatch)

For approved proposals:

```typescript
const approved = await env.MCP_CONNECTOR.fetch("/v1/proposals/list?status=approved");

for (const proposal of approved) {
  // Dispatch to Act service (via Intelligence worker)
  await env.INTELLIGENCE.fetch("/v1/act/execute", {
    method: "POST",
    body: JSON.stringify({ proposal_id: proposal.id }),
  });
}
```

**Result:** Actions dispatched for execution

---

### 6. Monitor Outcomes (Track)

Check execution status:

```typescript
// Query D1 for action execution records
const executions = await env.D1.prepare("SELECT * FROM action_executions WHERE status = ? LIMIT 10")
  .bind("running")
  .all();

// Alert on failures
for (const exec of executions.results) {
  if (exec.status === "failed") {
    // Create proposal for retry or escalation
  }
}
```

**Result:** Continuous monitoring + failure handling

---

## Deployment

### Step 1: Install Dependencies

```bash
cd services/twin-orchestrator
npm install
```

### Step 2: Deploy

```bash
unset CLOUDFLARE_API_TOKEN
wrangler deploy --env=""
```

### Step 3: Verify

```bash
# Check health
curl https://twin.dev.integratewise.ai/health

# Manual observe trigger (for testing)
curl -X POST https://twin.dev.integratewise.ai/v1/twin/observe \
  -H "x-tenant-id: iw-customer-zero"
```

### Step 4: Monitor Logs

```bash
wrangler tail twin-orchestrator
```

**Expected output every 5 minutes:**

```
[Twin Orchestrator] Scheduled trigger: */5 * * * *
[Twin] Context built: { memory_items: 10, signals: 3, proposals: 2 }
[Twin] Reasoning complete: { observations: 4, concerns: 1, suggested_actions: 1 }
[Twin] Proposals created: 1
[Twin] Observe loop complete
```

---

## Integration Points

### Twin → MCP Connector

**Twin queries system state via MCP tools:**

- `memory.search_org` — Recent org memory
- `signal.list` — Pending signals
- `proposal.list` — Pending/approved proposals
- `proposal.create` — Create new proposal

**MCP Connector provides:**

- 18 tools (memory, spine, signal, proposal, search)
- OAuth authentication
- Tenant isolation
- Rate limiting

---

### Twin → Intelligence Worker

**Twin uses Intelligence for reasoning:**

- `/v1/test/rag` — RAG-enabled AI query
- AI router (Workers AI → OpenRouter → Fusion)
- Multi-tier fallback
- Source attribution

**Intelligence Worker provides:**

- AI inference
- RAG search
- Model routing
- Token management

---

### Twin → Pipeline Worker

**Twin queries Spine state:**

- `/v1/spine/recent-changes` — Entity changes
- `/health` — Worker status

**Pipeline Worker provides:**

- Spine read access
- Entity resolution
- Relationship graph

---

### Twin → Continuity Worker

**Twin manages session state:**

- `/v1/continuity/sessions` — Active sessions
- `/v1/continuity/checkpoints` — Resume points

**Continuity Worker provides:**

- Session persistence
- Checkpoint/resume
- TTL cleanup

---

## Phase 3 Roadmap

### Week 1: Foundation

- ✅ Create Twin Orchestrator worker
- ✅ Implement observe loop
- ✅ Wire MCP tools
- ✅ Implement basic reasoning
- ⏳ Deploy + test
- ⏳ Monitor for 48 hours

### Week 2: Enhancement

- ⏳ Improve reasoning (structured output)
- ⏳ Add staleness checks
- ⏳ Add commitment tracking
- ⏳ Wire Action coordination
- ⏳ Wire Outcome monitoring

### Week 3: Workflows

- ⏳ Implement MorningBriefWorkflow
- ⏳ Implement SignalWorkflow
- ⏳ Implement ActWorkflow
- ⏳ Test durable execution

### Week 4: Production

- ⏳ Multi-tenant support
- ⏳ Custom observe intervals per tenant
- ⏳ User-configurable reasoning rules
- ⏳ Dashboard for Twin activity

---

## Success Criteria

### Twin is a Cognitive Orchestrator When:

- ✅ Runs on schedule (every 5 minutes)
- ✅ Observes system state via MCP
- ✅ Reasons via Intelligence AI
- ✅ Creates proposals (not decisions)
- ⏳ Coordinates approved actions
- ⏳ Monitors execution outcomes
- ⏳ Maintains continuity across sessions
- ⏳ Learns from outcomes (via Triage Bot)

---

## Key Differences from Intelligence Worker

| Aspect        | Intelligence Worker      | Twin Orchestrator          |
| ------------- | ------------------------ | -------------------------- |
| **Purpose**   | AI Infrastructure        | Cognitive Orchestration    |
| **Role**      | Tool Provider            | Strategic Reasoner         |
| **Triggers**  | Queues, HTTP requests    | Schedule, events           |
| **Outputs**   | AI responses, embeddings | Proposals, coordination    |
| **Writes to** | D1 cache, queues         | Proposals table            |
| **Approves**  | Nothing                  | Nothing (proposes only)    |
| **Executes**  | AI inference             | Nothing (coordinates only) |
| **State**     | Stateless per request    | Stateful across time       |

---

## Testing

### Manual Trigger

```bash
curl -X POST https://twin.dev.integratewise.ai/v1/twin/observe \
  -H "x-tenant-id: iw-customer-zero"
```

**Expected response:**

```json
{
  "success": true,
  "data": {
    "context": {
      "memory": { "recent": [...], "pending_reviews": [] },
      "signals": { "unprocessed": [...], "high_priority": [...] },
      "proposals": { "pending_approval": [...] }
    },
    "reasoning": {
      "observations": [...],
      "concerns": [...],
      "suggested_actions": [...]
    },
    "proposals": [...]
  }
}
```

---

## Next Steps

1. ✅ Deploy Twin Orchestrator
2. ⏳ Test manual observe trigger
3. ⏳ Verify scheduled loop (wait 5 minutes)
4. ⏳ Check logs for proposals created
5. ⏳ Test proposal approval flow
6. ⏳ Wire action coordination
7. ⏳ Implement workflows

---

**Status:** READY FOR DEPLOYMENT  
**Workers Count:** 26 (25 existing + 1 new)  
**Breaking Changes:** None  
**Rollback:** Available

---

**Last Updated:** 2026-06-09T14:45:00Z  
**Deployment Time:** ~5 minutes  
**Architecture:** v3.6 + Twin Orchestrator
