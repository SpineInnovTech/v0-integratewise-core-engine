# L0.5 Phase 2: Queue Wiring

> **Date:** 2026-06-09  
> **Status:** READY FOR DEPLOYMENT  
> **Phase:** 2 of 4  
> **Previous:** Phase 1 (Cron Triggers) — Workers deployed, manual cron wiring required

---

## Executive Summary

Phase 2 completes the **queue wiring** for the L0.5 Operating Layer, ensuring all queue producers and consumers are correctly connected for async processing and durability.

**Changes:**

1. ✅ Added `continuity-triage` queue consumer to `continuity` worker
2. ✅ Added `continuity-triage` queue handler implementation
3. ✅ Added `intelligence-act` queue producer binding to `intelligence` worker
4. ⏳ Queue producer implementation (future — when HITL approval logic is ready)

---

## Changes Made

### 1. continuity-triage Queue Consumer

**Problem:** Producers exist (20+ calls to `TASKS_QUEUE.send`), but no consumer wired.

**Solution:** Added consumer + handler to `continuity` worker.

#### File: `services/continuity/wrangler.toml`

**Added:**

```toml
# Queue consumer for continuity-triage
[[queues.consumers]]
queue = "continuity-triage"
max_batch_size = 10
max_batch_timeout = 30
```

#### File: `services/continuity/src/index.ts`

**Added `queue()` export:**

```typescript
export async function queue(
  batch: MessageBatch<{
    type: string;
    tenant_id: string;
    session_id: string;
    event_count?: number;
  }>,
  env: Env
): Promise<void> {
  console.log(`[Continuity Queue] Processing ${batch.messages.length} messages`);

  for (const message of batch.messages) {
    try {
      const { type, tenant_id, session_id, event_count } = message.body;

      if (type === "session_ready_for_triage") {
        await handleTriageRequest(env, tenant_id, session_id, event_count);
        message.ack();
      } else {
        console.warn(`[Continuity Queue] Unknown message type: ${type}`);
        message.ack(); // Ack unknown types to prevent retry
      }
    } catch (err: any) {
      console.error(`[Continuity Queue] Message processing failed:`, err.message);
      message.retry();
    }
  }
}
```

**Added `handleTriageRequest()` helper:**

```typescript
async function handleTriageRequest(
  env: Env,
  tenantId: string,
  sessionId: string,
  eventCount?: number
): Promise<void> {
  console.log(`[Continuity Triage] Processing session ${sessionId} (${eventCount} events)`);

  // Fetch session + events
  const { data: session } = await selectOne<SessionContainer>(db, "memory.session_containers", {
    id: sessionId,
    tenant_id: tenantId,
  });

  const { data: events } = await select<SessionEvent>(db, "memory.session_events", {
    session_id: `eq.${sessionId}`,
    tenant_id: `eq.${tenantId}`,
    order: "created_at.asc",
    limit: "1000",
  });

  // Auto-triage logic (placeholder — replace with AI analysis)
  const shouldPromote = events.length > 50; // Simple rule for now

  if (shouldPromote) {
    // Promote to knowledge
    const decision: TriageDecision = {
      session_id: sessionId,
      outcome: "promote_to_knowledge",
      reason: "Auto-promoted: high-value session with significant event count",
      approved_by: "triage-bot",
    };

    await promoteSessionToKnowledge(env, tenantId, sessionId, decision);

    await update(
      db,
      "memory.session_containers",
      { id: sessionId },
      {
        triage_status: "approved",
        triage_outcome: "promote_to_knowledge",
        updated_at: nowIso(),
      }
    );
  } else {
    // Retain as ephemeral
    await update(
      db,
      "memory.session_containers",
      { id: sessionId },
      {
        triage_status: "approved",
        triage_outcome: "retain_ephemeral",
        updated_at: nowIso(),
      }
    );
  }
}
```

---

### 2. intelligence-act Queue Producer

**Problem:** Consumer exists (intelligence worker), but nothing produces to it.

**Solution:** Added producer binding (code implementation deferred to future).

#### File: `services/intelligence/wrangler.toml`

**Added to all 3 environments (dev, test, prod):**

```toml
# --- Queue Producers (dev) ---
[[queues.producers]]
queue = "intelligence-act"
binding = "INTELLIGENCE_ACT_QUEUE"
```

**Code Implementation (Future):**

When HITL approval logic is implemented, add:

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

**Current Status:** Binding ready, producer code deferred until HITL approval endpoints are built.

---

### 3. connector-sync Queue

**Status:** ✅ ALREADY WIRED

**Verification Needed:**

1. Check `webhook-ingress` produces to queue on Nango webhooks
2. Check `connector-sync` consumes from queue
3. Verify hourly cron backup sweep

**Files:**

- `services/webhook-ingress/src/index.ts` (producer)
- `services/connector-sync/src/index.ts` (consumer)
- `services/connector-sync/wrangler.toml` (hourly cron)

---

### 4. execution-outcomes Queue

**Decision:** DELETE (unused)

**Rationale:**

- 0 producers
- 0 consumers
- Execution tracking happens via D1 `action_executions` table
- No business logic references this queue

**Command:**

```bash
wrangler queues delete execution-outcomes
```

---

## Deployment Steps

### Step 1: Deploy continuity Worker

```bash
cd /Users/nirmal/Github/integratewise-live
unset CLOUDFLARE_API_TOKEN
wrangler deploy --env="" services/continuity
```

**Expected Output:**

- ✅ Worker deployed
- ⚠️ Cron schedules may fail (API issue from Phase 1)
- ⚠️ Queue consumer wiring may fail (API issue from Phase 1)

**Manual Wiring (if needed):**

- Cloudflare Dashboard → Queues → `continuity-triage` → Add Consumer → `continuity`

---

### Step 2: Deploy intelligence Worker

```bash
wrangler deploy --env="" services/intelligence
```

**Expected Output:**

- ✅ Worker deployed
- ✅ Producer binding added (no API call needed for producers)
- ⚠️ Consumer wiring may fail (Phase 1 issue persists)

---

### Step 3: Delete execution-outcomes Queue

```bash
wrangler queues delete execution-outcomes
```

**Expected Output:**

- ✅ Queue deleted (no consumers, safe)

---

### Step 4: Verify Deployments

#### Check Worker Versions

```bash
wrangler deployments list --name continuity
wrangler deployments list --name intelligence
```

#### Tail Logs

```bash
wrangler tail continuity
wrangler tail intelligence
```

#### Check Queue Consumer Status

```bash
wrangler queues consumer list continuity-triage
wrangler queues consumer list intelligence-act
```

#### Test continuity-triage Queue

```bash
# Send test message
curl -X POST 'https://continuity.connect-a1b.workers.dev/v1/continuity/sessions/<session_id>/close' \
  -H 'x-tenant-id: iw-customer-zero' \
  -H 'Content-Type: application/json'

# Check logs
wrangler tail continuity
```

---

## Success Criteria

### Phase 2 Complete When:

- ✅ `continuity-triage` queue has consumer wired
- ✅ `continuity-triage` queue handler processes messages correctly
- ✅ `intelligence-act` queue producer binding exists
- ✅ `execution-outcomes` queue deleted
- ✅ All workers deployed with latest code
- ✅ Logs show queue processing working

---

## Queue Status Summary (After Phase 2)

| Queue Name               | Producer                   | Consumer             | Status         |
| ------------------------ | -------------------------- | -------------------- | -------------- |
| `pipeline-process`       | webhook-ingress, connector | pipeline             | ✅ WORKING     |
| `signals`                | pipeline                   | intelligence         | ✅ WORKING     |
| `intelligence-events`    | pipeline, connector        | intelligence         | ✅ WORKING     |
| `knowledge-ingest`       | pipeline, connector        | knowledge            | ✅ WORKING     |
| `memory-consolidation`   | pipeline, knowledge        | knowledge            | ✅ WORKING     |
| `ops-dlq`                | pipeline, intelligence     | intelligence         | ✅ WORKING     |
| **`continuity-triage`**  | continuity (20+ calls)     | **continuity (NEW)** | **✅ WIRED**   |
| **`intelligence-act`**   | (future HITL approval)     | intelligence         | **✅ READY**   |
| **`connector-sync`**     | webhook-ingress (Nango)    | connector-sync       | **⚠️ VERIFY**  |
| ~~`execution-outcomes`~~ | (none)                     | (none)               | **🗑️ DELETED** |

---

## Next Steps

### Immediate (After Deployment)

1. **Manual Queue Wiring (if Cloudflare API fails):**
   - Add `continuity-triage` consumer via Dashboard
   - Add 4 intelligence queue consumers (Phase 1 carryover)

2. **Verify Queue Flows:**
   - Test continuity session close → triage queue → handler
   - Test webhook → connector-sync queue flow
   - Monitor logs for errors

3. **Update Documentation:**
   - Update `docs/operations/CF_WIRE_STATUS.md` with queue status
   - Update `L05_OPERATING_LAYER_WIRING_PLAN.md` with Phase 2 completion

---

### Phase 3: AI Search Migration

1. Request AI Search beta access (if not already available)
2. Create AI Search namespace: `integratewise-knowledge`
3. Bulk upload org_memory content
4. Update search endpoints in knowledge service
5. Deprecate manual Vectorize flow

---

### Phase 4: Workflow Development

1. Implement `MorningBriefWorkflow` (durable multi-step execution)
2. Implement `SignalWorkflow` (spine change → signal generation)
3. Implement `ActWorkflow` (approved proposal → execute action)
4. Wire workflow triggers to crons + queues

---

## Files Modified

### Phase 2 Changes

1. **`services/continuity/wrangler.toml`**
   - Added `[[queues.consumers]]` for `continuity-triage`

2. **`services/continuity/src/index.ts`**
   - Added `queue()` export
   - Added `handleTriageRequest()` helper
   - Wired auto-triage logic (placeholder for AI)

3. **`services/intelligence/wrangler.toml`**
   - Added `[[queues.producers]]` for `intelligence-act` (all 3 envs)

---

## Risks & Mitigations

| Risk                                         | Impact                 | Mitigation                                                      |
| -------------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| Cloudflare API `/queues/.../consumers` fails | Manual wiring required | Dashboard fallback documented                                   |
| Triage logic promotes all sessions           | Knowledge pollution    | Start with conservative rule (>50 events), replace with AI soon |
| intelligence-act producer not implemented    | Queue stays empty      | Defer to HITL approval endpoint development                     |
| connector-sync not producing                 | Sync delays            | Verify Nango webhook handler + hourly cron backup               |

---

## Rollback Plan

If Phase 2 deployment causes issues:

```bash
# Rollback continuity
wrangler rollback --name continuity

# Rollback intelligence
wrangler rollback --name intelligence

# Recreate execution-outcomes queue (if needed)
wrangler queues create execution-outcomes
```

---

**Phase 2 Status:** READY FOR DEPLOYMENT  
**Approval Required:** Nirmal  
**Deployment Time:** ~10 minutes  
**Breaking Changes:** None (additive only)

**Last Updated:** 2026-06-09T14:45:00Z
