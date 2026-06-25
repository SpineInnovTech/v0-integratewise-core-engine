# L0.5 Operating Layer Wiring Plan

> **Created:** 2026-06-09  
> **Status:** IN PROGRESS  
> **Authority:** Nirmal (Founder) approval required for deployment

---

## Executive Summary

This document outlines the systematic wiring of the **L0.5 Operating Layer** (Cloudflare Durable Execution substrate) to transform IntegrateWise from a reactive application into an autonomous operating system.

**L0.5 Components:**

- **Cloudflare Workflows** → Durable, multi-step, stateful execution
- **Cloudflare Queues** → Async processing with guaranteed delivery + DLQs
- **Cron Triggers** → Scheduled, policy-bounded automation
- **Durable Objects** → Stateful long-lived coordination (HITL gates, watchers)

---

## Current State Analysis (Updated 2026-06-09 Phase 2)

### ✅ CONNECTED (Working)

- `pipeline-process` queue → `integratewise-pipeline` consumer
- `signals` queue → `integratewise-intelligence` consumer
- `intelligence-events` queue → `integratewise-intelligence` consumer
- `knowledge-ingest` queue → `integratewise-knowledge` consumer
- `memory-consolidation` → `integratewise-knowledge` consumer
- `ops-dlq` → `integratewise-intelligence` consumer
- `connector-sync` queue → `connector-sync` consumer (webhook-driven + hourly cron)
- **`intelligence-act` queue → producer binding added (Phase 2)** ✅

### ⚠️ NEEDS MANUAL WIRING (Phase 2 Code Deployed)

- **`continuity-triage` queue → consumer code deployed, needs Dashboard wiring** ⏳

### ⚠️ CRON GAPS

- `connector-sync`: Was 6 hours, needs webhook-driven (hourly backup)
- `continuity`: Has handler, missing morning brief + backup crons
- `intelligence`: No cron for morning brief or signal sweeps

### ⚠️ MISSING WORKFLOWS

- `TriageWorkflow` → exists in code, needs activation
- `SyncWorkflow` → missing, needed for connector delta
- `SignalWorkflow` → missing, needed for spine→signal automation
- `MorningBriefWorkflow` → missing, needed for 7am brief
- `ActWorkflow` → missing, needed for approved→execute

---

## TASK 1: FIX CRON TRIGGERS

### 1.1 connector-sync: Hourly + Webhook-Driven

**File:** `services/connector-sync/wrangler.toml`

**Change:**

```toml
# OLD
# crons = ["0 */6 * * *"]  # Every 6 hours

# NEW
[triggers]
crons = ["0 * * * *"]  # Every hour (backup sweep)
# Real-time syncs triggered by Nango webhooks at /webhooks/nango
```

**Rationale:** Nango webhooks (`/webhooks/nango`) provide real-time sync triggers. Hourly cron is backup sweep for missed events.

**Status:** ✅ DONE

---

### 1.2 continuity: Morning Brief + Daily Backup

**File:** `services/continuity/wrangler.toml`

**Change:**

```toml
# OLD
[triggers]
crons = ["0 */6 * * *"]  # TTL cleanup only

# NEW
[triggers]
crons = [
  "0 7 * * *",      # Morning brief at 7am
  "0 0 * * *",      # Daily reindex + backup at midnight
  "0 */6 * * *"     # TTL cleanup every 6 hours
]
```

**Handler Logic:**

```typescript
async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const cron = event.cron;

  if (cron === "0 7 * * *") {
    // Morning brief: trigger MorningBriefWorkflow
    // TODO: Wire to WORKFLOW service binding
  }
  else if (cron === "0 0 * * *") {
    // Daily backup: D1 → R2 + Vectorize reindex
    // TODO: Replace with AI Search (PRIORITY 4)
  }
  else if (cron === "0 */6 * * *") {
    // TTL cleanup (existing)
    await handleScheduled(event, env);
  }
}
```

**Status:** ✅ DONE (wrangler.toml), ⏳ PENDING (handler impl)

---

### 1.3 intelligence: Morning Brief + Signal Sweep

**File:** `services/intelligence/wrangler.toml`

**Change:**

```toml
# NEW
[triggers]
crons = [
  "0 7 * * *",      # Morning brief at 7am
  "0 */6 * * *"     # Signal analysis sweep every 6 hours
]
```

**Status:** ✅ DONE

---

## TASK 2: FIX QUEUE WIRING

### 2.1 continuity-triage Queue

**Problem:** Producers exist (20), no consumer wired

**Solution:** Add consumer to `continuity` worker

**File:** `services/continuity/wrangler.toml`

```toml
[[queues.consumers]]
queue = "continuity-triage"
max_batch_size = 10
max_batch_timeout = 30
```

**Status:** ⏳ PENDING

---

### 2.2 intelligence-act Queue

**Problem:** Consumer exists (intelligence), nothing produces to it

**Solution:** Wire Act service to publish to queue after HITL approval

**File:** `services/intelligence/src/act/*.ts`

```typescript
// After HITL approval in govern flow:
await env.INTELLIGENCE_ACT_QUEUE.send({
  action_id: proposal.id,
  action_type: proposal.action_type,
  tenant_id: proposal.tenant_id,
  approved_by: approval.user_id,
  approved_at: new Date().toISOString(),
});
```

**Status:** ⏳ PENDING (needs queue producer binding)

---

### 2.3 connector-sync Queue

**Problem:** Consumer exists, nothing produces

**Solution:** Nango webhook handler triggers sync jobs

**File:** `services/webhook-ingress/src/index.ts`

Already wired! Nango webhook handler sends to connector-sync queue:

```typescript
if (eventType === "connection.created" || eventType === "sync.success") {
  await env.CONNECTOR_SYNC_QUEUE.send({
    tenant_id: tenantId,
    provider: provider,
    sync_type: "delta",
    triggered_by: "webhook",
  });
}
```

**Status:** ✅ ALREADY WIRED (verify producer binding exists)

---

### 2.4 execution-outcomes Queue

**Problem:** Completely disconnected (0 producers, 0 consumers)

**Decision:**

- **Option A:** Delete the queue (unused)
- **Option B:** Wire to Act service for execution tracking

**Recommendation:** DELETE - execution tracking happens via D1 `action_executions` table

**Status:** ⏳ PENDING DECISION

---

## TASK 3: CREATE AI SEARCH INSTANCE

### 3.1 Current L4 Library Architecture

**Current Flow:**

```
Knowledge content → R2 bucket → Manual vectorization → Vectorize index → D1 cache
```

**Problems:**

- Manual indexing required
- No built-in search API
- No MCP endpoint
- No chat completions interface

---

### 3.2 AI Search Migration

**New Flow:**

```
Knowledge content → AI Search index → /search API + /chat/completions + MCP
```

**Benefits:**

- Managed indexing (auto-sync from R2/D1)
- Built-in search and chat APIs
- MCP-compatible endpoint
- Versioning and rollback
- Hybrid search (vector + keyword)

---

### 3.3 Implementation Steps

#### Step 1: Create AI Search Index

```bash
wrangler ai-search create integratewise-knowledge \
  --namespace=knowledge \
  --description="IntegrateWise L4 Library - org_memory + KB" \
  --embedding-model=@cf/baai/bge-base-en-v1.5
```

#### Step 2: Wire to Knowledge Worker

**File:** `services/knowledge/wrangler.toml`

```toml
[[ai_search_namespaces]]
binding = "AI_SEARCH"
namespace = "integratewise-knowledge"
```

#### Step 3: Migrate Content

```typescript
// Bulk upload from existing org_memory
const documents = await fetchOrgMemory();
await env.AI_SEARCH.upsert(
  documents.map((doc) => ({
    id: doc.id,
    text: doc.content_md,
    metadata: {
      title: doc.title,
      tags: doc.tags,
      topics: doc.topics,
      governance_state: doc.governance_state,
    },
  }))
);
```

#### Step 4: Update Search Endpoints

**File:** `services/knowledge/src/index.ts`

```typescript
// OLD: Manual Vectorize query
app.get("/search", async (c) => {
  const results = await vectorizeQuery(c.env.VECTOR_INDEX, query);
  // ...
});

// NEW: AI Search API
app.get("/search", async (c) => {
  const results = await c.env.AI_SEARCH.search(query, {
    limit: 10,
    includeVectors: false,
  });
  // ...
});
```

**Status:** ⏳ PENDING (AI Search in beta, verify availability)

---

## TASK 4: DEPLOY MISSING WORKFLOWS

### 4.1 TriageWorkflow

**Status:** ✅ EXISTS in `services/intelligence/src/workflows/triage-workflow.ts`

**Binding:** ✅ ALREADY CONFIGURED in `intelligence/wrangler.toml`

**Action:** Verify it's being invoked correctly

---

### 4.2 Missing Workflows

#### MorningBriefWorkflow

- **Purpose:** Generate 7am brief for /desk
- **Triggers:** 7am cron (continuity, intelligence)
- **Steps:**
  1. Fetch overnight signals
  2. Query Entity 360 changes
  3. Generate brief via AI
  4. Store in D1 cache
  5. Broadcast to connected clients

**Status:** ⏳ TODO

---

#### SignalWorkflow

- **Purpose:** Spine change → signal generation → broadcast
- **Triggers:** Pipeline writes, hourly sweep
- **Steps:**
  1. Detect spine changes
  2. Run signal analyzer
  3. Create signal records
  4. Broadcast to workspaces

**Status:** ⏳ TODO

---

#### ActWorkflow

- **Purpose:** Approved proposal → execute action
- **Triggers:** HITL approval, intelligence-act queue
- **Steps:**
  1. Fetch approved proposal
  2. Resolve target tool
  3. Execute via connector
  4. Track outcome
  5. Update proposal status

**Status:** ⏳ TODO

---

## Deployment Sequence

### Phase 1: Cron Fixes (Safe, No Breaking Changes) — ✅ DEPLOYED

1. ✅ connector-sync: hourly cron (wrangler.toml)
2. ✅ continuity: +7am, +midnight crons (wrangler.toml)
3. ✅ intelligence: +7am, +6h crons (wrangler.toml)
4. ✅ Implement continuity scheduled handler
5. ✅ Implement intelligence scheduled handler
6. ✅ DEPLOYED 2026-06-09 (manual cron wiring required via Dashboard)

### Phase 2: Queue Wiring (Requires Testing) — ✅ DEPLOYED

1. ✅ Add continuity-triage consumer (wrangler.toml + handler)
2. ✅ Wire intelligence-act producer binding
3. ✅ Verify connector-sync webhook flow (already wired)
4. ✅ Delete execution-outcomes queue (done)
5. ✅ DEPLOYED 2026-06-09 (manual queue consumer wiring required via Dashboard)

**See:** `L05_PHASE2_DEPLOYMENT_SUMMARY.md` for full deployment details.

### Phase 3: AI Search (Requires Beta Access) — ⏳ NEXT

1. Add continuity-triage consumer
2. Wire intelligence-act producer
3. Verify connector-sync webhook flow
4. Delete execution-outcomes queue
5. Deploy + test each queue independently

### Phase 3: AI Search (Requires Beta Access)

1. Create AI Search index
2. Bulk upload org_memory content
3. Update search endpoints
4. Test MCP integration
5. Deprecate manual Vectorize flow

### Phase 4: Workflows (Requires Development)

1. Implement MorningBriefWorkflow
2. Implement SignalWorkflow
3. Implement ActWorkflow
4. Wire cron triggers
5. Test durable execution + retries

---

## Verification Commands

### Check Deployed Crons

```bash
wrangler deployments list --name integratewise-connector-sync
wrangler deployments list --name continuity
wrangler deployments list --name intelligence
```

### List Queues

```bash
wrangler queues list
```

### Check Queue Consumers

```bash
wrangler queues consumer list continuity-triage
wrangler queues consumer list intelligence-act
```

### Test Webhook Flow

```bash
curl -X POST 'https://ingress.dev.integratewise.ai/webhooks/nango' \
  -H 'Content-Type: application/json' \
  -d '{"type":"sync.success","connectionId":"iw-customer-zero","provider":"hubspot"}'
```

---

## Success Criteria

### L0.5 Fully Operational When:

- ✅ All cron triggers deployed and running
- ✅ All queue consumers wired with producers
- ✅ Workflows executing durably with retries
- ✅ AI Search replacing manual vectorization
- ✅ Morning brief generated daily at 7am
- ✅ Signal analysis sweep running every 6 hours
- ✅ Connector sync webhook-driven with hourly backup
- ✅ Act workflow executing approved proposals

---

## Next Actions

**PHASE 1 COMPLETE — READY FOR DEPLOYMENT:**

All Phase 1 code changes are complete:

1. ✅ Cron triggers added to wrangler.toml files (connector-sync, continuity, intelligence)
2. ✅ Continuity scheduled handler implemented (7am brief, midnight backup, 6h cleanup)
3. ✅ Intelligence scheduled handler implemented (7am brief, 6h signal sweep)

**AWAITING NIRMAL APPROVAL TO DEPLOY:**

```bash
# Unset Cloudflare API token (critical - see AGENTS.md Hard Rules)
unset CLOUDFLARE_API_TOKEN

# Deploy Phase 1 changes
wrangler deploy --env="" services/connector-sync
wrangler deploy --env="" services/continuity
wrangler deploy --env="" services/intelligence
```

**AFTER PHASE 1 DEPLOYMENT:**

1. Monitor cron triggers in Cloudflare dashboard
2. Verify scheduled handlers execute correctly
3. Proceed to Phase 2: Queue Wiring

**PHASE 2 QUEUE WIRING (After Phase 1 approval):**

1. Add continuity-triage consumer
2. Wire intelligence-act producer
3. Verify connector-sync webhook flow
4. Delete execution-outcomes queue

**PHASE 3 AI SEARCH (After Phase 2):**

1. Request AI Search beta access
2. Create AI Search index
3. Bulk upload org_memory content
4. Update search endpoints

**PHASE 4 WORKFLOWS (After Phase 3):**

1. Develop MorningBriefWorkflow
2. Develop SignalWorkflow
3. Develop ActWorkflow
4. Wire workflow triggers

---

**Document Status:** Phase 1 READY FOR DEPLOYMENT  
**Last Updated:** 2026-06-09T13:15:00Z  
**Next Review:** After Phase 1 deployment + monitoring
