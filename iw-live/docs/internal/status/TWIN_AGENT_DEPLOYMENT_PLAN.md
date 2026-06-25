# Twin Agent Deployment Plan — CF Worker First

> ⚠️ **PARTIALLY SUPERSEDED (v3.7, DECISION 22).** The Twin runs entirely in Cloudflare
> (`services/iw-agent-runtime`) with a native in-app UI — there is no OpenWebUI in the product.
> The OWUI / `vps-operations-stack/openwebui` steps below are legacy and apply only to the
> internal ops-plane (Customer Zero), never the product. Canonical: AGENTS.md DECISION 22.

**Date:** 2026-06-09
**Status:** Superseded (CF-native Twin shipped — see iw-agent-runtime)
**Goal:** Deploy Twin Orchestrator (Agent Creation) → Wire OWUI to Twin Runtime

---

## Overview

```
Phase 1: AGENT CREATION (CF Worker)
    Deploy twin-orchestrator.dev.integratewise.ai
    ↓
Phase 2: AGENT RUNTIME (OWUI Integration)
    Wire OWUI to Twin Runtime endpoint
    ↓
Phase 3: CUSTOMER ZERO LOADING
    Load entities, signals, proposals, memory
```

---

## Phase 1: AGENT CREATION (Deploy CF Worker)

### Step 1.1: Deploy Intelligence Worker (Dependency)

The Twin Orchestrator depends on the Intelligence worker for AI reasoning.

```bash
cd /Users/nirmal/Github/integratewise-live/services/intelligence

# Unset API token (use OAuth session)
unset CLOUDFLARE_API_TOKEN

# Deploy to dev
wrangler deploy --env dev
```

**Expected Output:**

```
✨ Successfully deployed intelligence (dev)
🌍 https://intelligence.dev.integratewise.ai
```

**Verify:**

```bash
curl https://intelligence.dev.integratewise.ai/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "service": "intelligence",
  "components": ["think", "act", "govern", "agents", "ai-router"],
  "ai": {
    "workers_ai": "available",
    "openrouter": "configured"
  }
}
```

---

### Step 1.2: Deploy Twin Orchestrator (The Agent)

```bash
cd /Users/nirmal/Github/integratewise-live/services/twin-orchestrator

# Unset API token (use OAuth session)
unset CLOUDFLARE_API_TOKEN

# Deploy to dev
wrangler deploy --env dev
```

**Expected Output:**

```
✨ Successfully deployed twin-orchestrator (dev)
🌍 https://twin.dev.integratewise.ai
📅 Cron trigger: */5 * * * * (every 5 minutes)
```

**Verify:**

```bash
curl https://twin.dev.integratewise.ai/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "service": "twin-orchestrator",
  "role": "cognitive-orchestrator",
  "capabilities": ["observe", "reason", "propose", "coordinate", "learn"],
  "infrastructure": {
    "mcp_connector": "bound",
    "intelligence": "bound",
    "pipeline": "bound",
    "knowledge": "bound",
    "continuity": "bound"
  }
}
```

---

### Step 1.3: Test Twin Observe Loop (Manual Trigger)

```bash
curl -X POST https://twin.dev.integratewise.ai/v1/twin/observe \
  -H "x-tenant-id: iw-customer-zero" \
  -H "Content-Type: application/json"
```

**Expected Response Structure:**

```json
{
  "success": true,
  "data": {
    "context": {
      "memory": { "recent": [], "pending_reviews": [] },
      "signals": { "unprocessed": [], "high_priority": [] },
      "proposals": { "pending_approval": [], "recently_approved": [], "recently_rejected": [] },
      "operations": { "queue_health": {}, "worker_status": {}, "error_rate": 0 },
      "time": { "current": "2026-06-09T...", "last_observe": "never", "staleness_items": [] }
    },
    "reasoning": {
      "timestamp": "2026-06-09T...",
      "context_summary": "...",
      "observations": [...],
      "concerns": [...],
      "opportunities": [...],
      "suggested_actions": [...]
    },
    "proposals": []
  }
}
```

---

### Step 1.4: Monitor Cron Execution

```bash
# Tail Twin logs (watch for 5-minute cron triggers)
wrangler tail twin-orchestrator --env dev
```

**Expected Log Output (every 5 minutes):**

```
[Twin Orchestrator] Scheduled trigger: */5 * * * *
[Twin] Context built: { memory_items: 0, signals: 0, proposals: 0 }
[Twin] Reasoning complete: { observations: 2, concerns: 0, suggested_actions: 0 }
[Twin] Observe loop complete
```

---

## Phase 2: AGENT RUNTIME (Wire OWUI to Twin)

### Architecture Change

**Before:**

```
OWUI → LiteLLM → OpenRouter/Ollama → Response
```

**After:**

```
OWUI → Twin Runtime API → Intelligence → OpenRouter Agents → Response
```

---

### Step 2.1: Add Twin Runtime Endpoint to Twin Orchestrator

The Twin Orchestrator needs an OpenAI-compatible `/v1/chat/completions` endpoint so OWUI can talk to it.

**File:** `/Users/nirmal/Github/integratewise-live/services/twin-orchestrator/src/index.ts`

**Add this endpoint:**

```typescript
// ============================================================================
// OpenAI-Compatible Chat Endpoint (for OWUI)
// ============================================================================

app.post("/v1/chat/completions", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "iw-customer-zero";
  const body = await c.req.json();

  try {
    const { messages, model, stream = false, ...options } = body;

    // Build Twin context (what the Twin knows right now)
    const context = await buildTwinContext(c.env, tenantId);

    // Inject Twin context into system message
    const systemMessage = {
      role: "system",
      content: `You are the Twin cognitive orchestrator for IntegrateWise.

Current Twin Context:
- Memory: ${context.memory.recent.length} recent items
- Signals: ${context.signals.unprocessed.length} unprocessed (${context.signals.high_priority.length} high priority)
- Proposals: ${context.proposals.pending_approval.length} pending approval
- Last observe: ${context.time.last_observe}

You can:
1. Answer questions about system state
2. Propose actions (requires approval)
3. Query memory, signals, proposals via tools
4. Coordinate execution (via governance)

You cannot:
- Execute actions directly (always propose → approve → execute)
- Write to memory directly (via Triage Bot only)
- Write to Spine directly (via Pipeline only)`,
    };

    // Combine system message + user messages
    const augmentedMessages = [systemMessage, ...messages];

    // Forward to Intelligence worker (which uses OpenRouter Agents)
    const response = await c.env.INTELLIGENCE.fetch(
      new Request("http://internal/v1/ai/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          model: model || "openrouter/auto",
          messages: augmentedMessages,
          stream,
          ...options,
        }),
      })
    );

    // Return OpenAI-compatible response
    if (stream) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      const data = await response.json();
      return c.json({
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: model || "twin-orchestrator",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: data.content || data.data?.content || "",
            },
            finish_reason: "stop",
          },
        ],
        usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });
    }
  } catch (err: any) {
    console.error("[Twin Chat] Error:", err);
    return c.json({ error: { message: err.message, type: "twin_error" } }, { status: 500 });
  }
});

// Also add models endpoint for OWUI compatibility
app.get("/v1/models", (c) => {
  return c.json({
    object: "list",
    data: [
      {
        id: "twin-orchestrator",
        object: "model",
        created: 1717900800,
        owned_by: "integratewise",
        permission: [],
        root: "twin-orchestrator",
        parent: null,
      },
    ],
  });
});
```

---

### Step 2.2: Redeploy Twin Orchestrator with Chat Endpoint

```bash
cd /Users/nirmal/Github/integratewise-live/services/twin-orchestrator

unset CLOUDFLARE_API_TOKEN
wrangler deploy --env dev
```

**Test the Chat Endpoint:**

```bash
curl -X POST https://twin.dev.integratewise.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: iw-customer-zero" \
  -d '{
    "model": "twin-orchestrator",
    "messages": [
      {"role": "user", "content": "What is the current system state?"}
    ]
  }'
```

**Expected Response:**

```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1717900800,
  "model": "twin-orchestrator",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Based on my observation:\n- Memory: 0 recent items\n- Signals: 0 unprocessed\n- Proposals: 0 pending approval\n\nThe system is currently idle. No actions are needed at this time."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": { "prompt_tokens": 150, "completion_tokens": 50, "total_tokens": 200 }
}
```

---

### Step 2.3: Update OWUI to Use Twin Runtime

**VPS SSH:**

```bash
ssh root@187.127.166.105
cd /root/vps-operations-stack/openwebui
```

**Edit `.env`:**

```bash
nano .env
```

**Add:**

```env
# Twin Runtime API (Cloudflare Worker)
TWIN_RUNTIME_URL=https://twin.dev.integratewise.ai
```

**Edit `docker-compose.yml`:**

```bash
nano docker-compose.yml
```

**Update `open-webui` service environment:**

```yaml
services:
  open-webui:
    # ... existing config ...
    environment:
      # ... existing vars ...

      # CHANGE THIS: Point to Twin Runtime instead of LiteLLM
      OPENAI_API_BASE_URL: https://twin.dev.integratewise.ai

      # Keep LiteLLM key for auth (or use a Twin-specific key)
      OPENAI_API_KEY: ${LITELLM_MASTER_KEY}

      # ... rest of config ...
```

**Restart OWUI:**

```bash
docker-compose down
docker-compose up -d
```

---

### Step 2.4: Test OWUI → Twin Runtime

1. Open https://twin.operations.integratewise.ai
2. Start a new chat
3. Select model: "twin-orchestrator" (should appear in model list)
4. Send message: "What is the current system state?"
5. Verify: Response includes Twin context (memory, signals, proposals)

**Expected Response:**

```
Based on my observation:
- Memory: 0 recent items
- Signals: 0 unprocessed
- Proposals: 0 pending approval

The system is currently idle. No actions are needed at this time.
```

---

## Phase 3: CUSTOMER ZERO LOADING

Now that Twin Runtime is deployed and OWUI is wired, load Customer Zero data.

### Step 3.1: Create Load Script

**File:** `/Users/nirmal/Github/integratewise-ops/vps-operations-stack/scripts/load-customer-zero-cf.mjs`

```javascript
#!/usr/bin/env node
/**
 * Load Customer Zero data into Cloudflare Workers
 * - Entities → Pipeline → Spine
 * - Signals → Intelligence
 * - Proposals → Governance (via MCP)
 * - Memory → Triage Bot → Conversational Memory
 */

const TENANT_ID = "iw-customer-zero";
const PIPELINE_URL = "https://pipeline.dev.integratewise.ai";
const MCP_URL = "https://mcp.dev.integratewise.ai";
const GATEWAY_URL = "https://gateway.dev.integratewise.ai";

// Customer Zero Entities
const entities = [
  {
    type: "Person",
    name: "Nirmal Patel",
    email: "nirmal@integratewise.ai",
    role: "Founder",
    traits: ["decision_maker", "technical_user"],
  },
  {
    type: "Account",
    name: "IntegrateWise",
    domain: "integratewise.ai",
    industry: "SaaS",
    employees: 1,
    traits: ["b2b", "technical"],
  },
  {
    type: "Deal",
    name: "Customer Zero Onboarding",
    value: 0,
    stage: "active",
    close_date: "2026-06-30",
    traits: ["self_serve", "internal"],
  },
];

// Customer Zero Signals
const signals = [
  {
    entity_id: "deal-customer-zero",
    signal_type: "milestone_approaching",
    severity: "medium",
    description: "Customer Zero onboarding deadline: 2026-06-30 (21 days)",
    suggested_action: "Review onboarding progress and adjust timeline if needed",
  },
];

// Customer Zero Proposals
const proposals = [
  {
    type: "review_system_state",
    title: "Daily System Health Review",
    description: "Twin should review system health daily and surface any concerns",
    impact: "medium",
    risk: "low",
    urgency: "medium",
    confidence: 0.9,
  },
];

// Customer Zero Memory Episodes
const memoryEpisodes = [
  {
    type: "episode",
    title: "Twin Architecture Finalized — 2026-06-09",
    content:
      "Canonical architecture established: One Twin, One Spine, One Memory, One Governance, One Bridge. Twin Runtime deployed as CF Worker.",
    scope: "org",
    tags: ["architecture", "twin", "milestone"],
  },
  {
    type: "decision",
    title: "CF Worker First (Not VPS)",
    content:
      "Decision: Deploy Twin Runtime as Cloudflare Worker first, not VPS. Reasoning: Better integration with existing CF infrastructure, edge performance, easier scaling.",
    alternatives_considered: ["VPS deployment", "Hybrid approach"],
    scope: "org",
    tags: ["architecture", "twin", "decision"],
  },
];

async function loadCustomerZero() {
  console.log("🚀 Loading Customer Zero data...\n");

  // 1. Load Entities
  console.log("1️⃣  Loading entities...");
  for (const entity of entities) {
    try {
      const response = await fetch(`${PIPELINE_URL}/v1/intake`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": TENANT_ID,
        },
        body: JSON.stringify({
          source: "customer-zero-load",
          data: entity,
        }),
      });
      const result = await response.json();
      console.log(`   ✅ ${entity.type}: ${entity.name} → ${result.spine_id || result.entity_id}`);
    } catch (err) {
      console.error(`   ❌ ${entity.type}: ${entity.name} → ${err.message}`);
    }
  }

  // 2. Load Signals
  console.log("\n2️⃣  Loading signals...");
  for (const signal of signals) {
    try {
      const response = await fetch(`${GATEWAY_URL}/api/v1/signals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": TENANT_ID,
        },
        body: JSON.stringify(signal),
      });
      const result = await response.json();
      console.log(`   ✅ Signal: ${signal.signal_type}`);
    } catch (err) {
      console.error(`   ❌ Signal: ${signal.signal_type} → ${err.message}`);
    }
  }

  // 3. Load Proposals
  console.log("\n3️⃣  Loading proposals...");
  for (const proposal of proposals) {
    try {
      const response = await fetch(`${MCP_URL}/tools/proposal.create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": TENANT_ID,
        },
        body: JSON.stringify(proposal),
      });
      const result = await response.json();
      console.log(`   ✅ Proposal: ${proposal.title}`);
    } catch (err) {
      console.error(`   ❌ Proposal: ${proposal.title} → ${err.message}`);
    }
  }

  // 4. Load Memory Episodes
  console.log("\n4️⃣  Loading memory episodes...");
  for (const episode of memoryEpisodes) {
    try {
      const response = await fetch(`${MCP_URL}/tools/memory.write_conversational`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": TENANT_ID,
        },
        body: JSON.stringify({
          session_id: "customer-zero-onboarding",
          user_id: "nirmal",
          role: "system",
          content: JSON.stringify(episode),
        }),
      });
      const result = await response.json();
      console.log(`   ✅ Memory: ${episode.title}`);
    } catch (err) {
      console.error(`   ❌ Memory: ${episode.title} → ${err.message}`);
    }
  }

  console.log("\n✅ Customer Zero data loaded!\n");
  console.log("🔍 Verify:");
  console.log(
    "   curl https://twin.dev.integratewise.ai/v1/twin/observe -H 'x-tenant-id: iw-customer-zero' -X POST"
  );
}

loadCustomerZero();
```

---

### Step 3.2: Run Load Script

```bash
cd /Users/nirmal/Github/integratewise-ops/vps-operations-stack/scripts

chmod +x load-customer-zero-cf.mjs
node load-customer-zero-cf.mjs
```

**Expected Output:**

```
🚀 Loading Customer Zero data...

1️⃣  Loading entities...
   ✅ Person: Nirmal Patel → person-123
   ✅ Account: IntegrateWise → account-456
   ✅ Deal: Customer Zero Onboarding → deal-789

2️⃣  Loading signals...
   ✅ Signal: milestone_approaching

3️⃣  Loading proposals...
   ✅ Proposal: Daily System Health Review

4️⃣  Loading memory episodes...
   ✅ Memory: Twin Architecture Finalized — 2026-06-09
   ✅ Memory: CF Worker First (Not VPS)

✅ Customer Zero data loaded!

🔍 Verify:
   curl https://twin.dev.integratewise.ai/v1/twin/observe -H 'x-tenant-id: iw-customer-zero' -X POST
```

---

### Step 3.3: Verify Twin Sees Customer Zero Data

```bash
curl -X POST https://twin.dev.integratewise.ai/v1/twin/observe \
  -H "x-tenant-id: iw-customer-zero" \
  -H "Content-Type: application/json" | jq
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "context": {
      "memory": {
        "recent": [
          {"title": "Twin Architecture Finalized — 2026-06-09", ...},
          {"title": "CF Worker First (Not VPS)", ...}
        ]
      },
      "signals": {
        "unprocessed": [
          {"signal_type": "milestone_approaching", ...}
        ],
        "high_priority": []
      },
      "proposals": {
        "pending_approval": [
          {"title": "Daily System Health Review", ...}
        ]
      },
      "spine": {
        "entity_count": 3,
        "recent_changes": [...]
      }
    },
    "reasoning": {
      "observations": [
        "Customer Zero onboarding is active",
        "1 signal requires attention (milestone approaching)",
        "1 proposal pending approval"
      ],
      "concerns": ["Milestone approaching: Customer Zero onboarding deadline in 21 days"],
      "suggested_actions": [
        {
          "type": "review_milestone",
          "reasoning": "Customer Zero onboarding deadline approaching",
          "impact": "medium",
          "urgency": "medium"
        }
      ]
    }
  }
}
```

---

### Step 3.4: Test OWUI with Customer Zero Context

1. Open https://twin.operations.integratewise.ai
2. Start new chat with Twin
3. Ask: "What needs my attention today?"
4. Verify Twin response includes:
   - Customer Zero onboarding milestone
   - Pending proposal for daily health review
   - System state summary

**Expected Response:**

```
Here's what needs your attention:

🔴 Milestone Approaching
Customer Zero onboarding deadline is in 21 days (2026-06-30). Review progress to ensure we're on track.

📋 Pending Proposal
"Daily System Health Review" is awaiting approval. This would enable me to proactively monitor system health and surface concerns.

📊 System State
- 3 entities in Spine (1 person, 1 account, 1 deal)
- 1 unprocessed signal
- 1 pending proposal
- 2 memory items

Would you like me to propose any actions?
```

---

## Success Criteria

### ✅ Phase 1 Complete When:

- [ ] Intelligence worker deployed (`intelligence.dev.integratewise.ai`)
- [ ] Twin Orchestrator deployed (`twin.dev.integratewise.ai`)
- [ ] Health checks return 200 OK
- [ ] Cron triggers fire every 5 minutes
- [ ] Manual `/v1/twin/observe` works

### ✅ Phase 2 Complete When:

- [ ] Twin Runtime has `/v1/chat/completions` endpoint
- [ ] OWUI `OPENAI_API_BASE_URL` points to Twin Runtime
- [ ] OWUI chat shows "twin-orchestrator" model
- [ ] Chat responses include Twin context

### ✅ Phase 3 Complete When:

- [ ] Customer Zero entities loaded (3 entities in Spine)
- [ ] Customer Zero signals loaded (1 signal)
- [ ] Customer Zero proposals loaded (1 proposal)
- [ ] Customer Zero memory loaded (2 episodes)
- [ ] Twin observe returns populated context
- [ ] OWUI chat includes Customer Zero data in responses

---

## Next Steps After This

1. **Wire OWUI Skills** — Add MCP tool server for Twin to use tools
2. **Deploy Browser Agent** — Enable Twin to execute via browser automation
3. **Implement Triage Bot** — Memory governance worker
4. **Enable Governance Queue** — HITL approval in OWUI or L2
5. **Morning Brief Workflow** — Daily summary via voice/email

---

## Deployment Commands Summary

```bash
# Phase 1: Deploy CF Workers
cd /Users/nirmal/Github/integratewise-live/services/intelligence
unset CLOUDFLARE_API_TOKEN
wrangler deploy --env dev

cd ../twin-orchestrator
unset CLOUDFLARE_API_TOKEN
wrangler deploy --env dev

# Phase 2: Update OWUI
ssh root@187.127.166.105
cd /root/vps-operations-stack/openwebui
# Edit docker-compose.yml → OPENAI_API_BASE_URL=https://twin.dev.integratewise.ai
docker-compose down && docker-compose up -d

# Phase 3: Load Customer Zero
cd /Users/nirmal/Github/integratewise-ops/vps-operations-stack/scripts
node load-customer-zero-cf.mjs
```

---

**Ready to execute!** 🚀

The Twin Runtime (Agent) is already built, just needs deployment + wiring.
