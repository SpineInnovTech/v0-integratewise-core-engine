# L0.5 Operating Layer Status

> **Last Updated:** 2026-06-09 14:10 UTC  
> **Overall Status:** Phase 2 DEPLOYED — Manual wiring required

---

## Quick Status

| Phase                      | Status      | Notes                                            |
| -------------------------- | ----------- | ------------------------------------------------ |
| **Phase 1: Cron Triggers** | ✅ DEPLOYED | Workers live, manual cron wiring required        |
| **Phase 2: Queue Wiring**  | ✅ DEPLOYED | Code live, manual queue consumer wiring required |
| **Phase 3: AI Search**     | ⏳ NEXT     | Namespace created, bulk upload pending           |
| **Phase 4: Workflows**     | ⏳ FUTURE   | MorningBrief, Signal, Act workflows              |

---

## What's Working

✅ **3 Workers Deployed:**

- continuity (https://continuity.connect-a1b.workers.dev)
- intelligence (https://intelligence.dev.integratewise.ai)
- connector-sync (https://integratewise-connector-sync.connect-a1b.workers.dev)

✅ **Queue Producers:**

- pipeline-process (6 producers)
- signals (2 producers)
- intelligence-events (2 producers)
- knowledge-ingest (3 producers)
- ops-dlq (3 producers)
- continuity-triage (2 producers)
- **intelligence-act (1 producer — NEW!)**

✅ **Code Changes:**

- Scheduled handlers implemented (continuity, intelligence)
- AI router implemented (Workers AI + OpenRouter + AI Gateway)
- continuity-triage queue handler implemented
- intelligence-act queue producer binding added

✅ **Cleanup:**

- execution-outcomes queue deleted (unused)

---

## What Needs Manual Wiring

⏳ **Cron Triggers (6 total):**

**continuity:**

- `0 7 * * *` — Morning brief
- `0 0 * * *` — Daily backup
- `0 */6 * * *` — TTL cleanup

**intelligence:**

- `0 7 * * *` — Morning brief
- `0 */6 * * *` — Signal sweep

**connector-sync:**

- `0 * * * *` — Hourly backup

⏳ **Queue Consumers (5 total):**

**continuity:**

- continuity-triage (consumer code deployed, needs Dashboard wiring)

**intelligence:**

- intelligence-events
- intelligence-act
- ops-dlq
- signals

---

## How to Complete Manual Wiring

### Step 1: Add Cron Triggers

1. Open Cloudflare Dashboard
2. Navigate to Workers & Pages → [worker name] → Triggers tab
3. Click "Add Cron Trigger"
4. Paste cron expression from list above
5. Save

### Step 2: Add Queue Consumers

1. Cloudflare Dashboard → Queues → [queue name]
2. Click "Add Consumer"
3. Select worker from dropdown
4. Set max_batch_size: 10, max_batch_timeout: 30
5. Save

**Detailed Instructions:** See `L05_PHASE2_DEPLOYMENT_SUMMARY.md`

---

## Verification Commands

```bash
# Check workers deployed
unset CLOUDFLARE_API_TOKEN
wrangler deployments list --name continuity
wrangler deployments list --name intelligence

# Check queue status
wrangler queues list

# Check queue consumers
wrangler queues consumer list continuity-triage
wrangler queues consumer list intelligence-events

# Tail logs
wrangler tail continuity
wrangler tail intelligence
```

---

## Known Issues

### Cloudflare API Failures

**Issue:** Cloudflare API endpoints for `/schedules` and `/queues/.../consumers` return 400 errors during wrangler deployment.

**Impact:** Cron triggers and queue consumers don't register automatically.

**Workaround:** Manual wiring via Cloudflare Dashboard.

**Root Cause:** Unknown (Cloudflare API issue, not wrangler/code issue).

---

## Next Steps

### Immediate (5-10 minutes)

1. Wire 6 cron triggers via Dashboard
2. Wire 5 queue consumers via Dashboard
3. Test continuity-triage queue flow
4. Monitor logs for errors

### Phase 3: AI Search Migration

1. Verify AI Search namespace: `integratewise-intelligence`
2. Bulk upload org_memory content
3. Update knowledge service search endpoints
4. Test MCP integration

### Phase 4: Workflow Development

1. Implement MorningBriefWorkflow
2. Implement SignalWorkflow
3. Implement ActWorkflow
4. Wire triggers + test durable execution

---

## Files to Read

- **`L05_OPERATING_LAYER_WIRING_PLAN.md`** — Comprehensive 4-phase plan
- **`L05_PHASE1_DEPLOYMENT_SUMMARY.md`** — Phase 1 deployment results
- **`L05_PHASE2_DEPLOYMENT_SUMMARY.md`** — Phase 2 deployment results (NEW!)
- **`L05_PHASE2_QUEUE_WIRING.md`** — Phase 2 technical details

---

**Status:** DEPLOYED — Manual wiring required  
**Time to Complete:** ~10 minutes  
**Breaking Changes:** None  
**Rollback Available:** Yes
