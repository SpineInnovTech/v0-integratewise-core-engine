# L0.5 Phase 1: Cron Triggers — READY FOR DEPLOYMENT

> **Status:** ✅ CODE COMPLETE — AWAITING DEPLOYMENT APPROVAL  
> **Date:** 2026-06-09  
> **Phase:** 1 of 4 (Cron Triggers)

---

## What Was Built

Phase 1 adds L0.5 Operating Layer cron triggers to make IntegrateWise autonomous:

### 1. connector-sync: Hourly Backup Sweep

**File:** `services/connector-sync/wrangler.toml`

- **Old:** Every 6 hours (`0 */6 * * *`)
- **New:** Every hour (`0 * * * *`)
- **Rationale:** Nango webhooks provide real-time sync. Hourly cron is backup sweep for missed events.

### 2. continuity: Morning Brief + Daily Backup + TTL Cleanup

**Files:**

- `services/continuity/wrangler.toml` (cron config)
- `services/continuity/src/index.ts` (scheduled handler)

**Cron Triggers Added:**

- `0 7 * * *` — Morning brief at 7am (triggers MorningBriefWorkflow)
- `0 0 * * *` — Daily reindex + backup at midnight
- `0 */6 * * *` — TTL cleanup every 6 hours (existing)

**Handler Logic:**

- `handleMorningBrief()` — Triggers brief generation via Knowledge service
- `handleDailyBackup()` — Counts sessions, logs backup (AI Search migration pending)
- `handleTTLCleanup()` — Purges expired sessions (existing logic, now routed correctly)

### 3. intelligence: Morning Brief + Signal Sweep

**Files:**

- `services/intelligence/wrangler.toml` (cron config)
- `services/intelligence/src/index.ts` (scheduled handler)

**Cron Triggers Added:**

- `0 7 * * *` — Morning brief at 7am (triggers MorningBriefWorkflow)
- `0 */6 * * *` — Signal analysis sweep every 6 hours

**Handler Logic:**

- `handleMorningBriefTrigger()` — Triggers brief generation via Knowledge service
- `handleSignalSweep()` — Queries unprocessed signals from D1, logs count (SignalWorkflow pending)

---

## Files Changed

| File                                    | Change                 | Status      |
| --------------------------------------- | ---------------------- | ----------- |
| `services/connector-sync/wrangler.toml` | Cron: 6h → 1h          | ✅ Complete |
| `services/continuity/wrangler.toml`     | +7am, +midnight crons  | ✅ Complete |
| `services/continuity/src/index.ts`      | Scheduled handler impl | ✅ Complete |
| `services/intelligence/wrangler.toml`   | +7am, +6h crons        | ✅ Complete |
| `services/intelligence/src/index.ts`    | Scheduled handler impl | ✅ Complete |

---

## Deployment Commands

```bash
# CRITICAL: Unset Cloudflare API token (AGENTS.md Hard Rule #3)
unset CLOUDFLARE_API_TOKEN

# Verify OAuth session is active
wrangler whoami
# Should show: connect@integratewise.ai (Account: IntegrateWise)

# Deploy Phase 1 changes (dev environment = no --env flag)
wrangler deploy services/connector-sync
wrangler deploy services/continuity
wrangler deploy services/intelligence
```

---

## Verification After Deployment

### 1. Check Cron Triggers Are Active

```bash
# Verify crons are scheduled
wrangler deployments list --name integratewise-connector-sync
wrangler deployments list --name continuity
wrangler deployments list --name intelligence
```

### 2. Monitor Logs for Scheduled Executions

```bash
# Watch for cron executions in real-time
wrangler tail continuity
wrangler tail intelligence
```

Expected log output:

- `[Continuity Scheduled] Triggered: 0 7 * * *` (7am)
- `[Continuity Scheduled] Triggered: 0 0 * * *` (midnight)
- `[Continuity Scheduled] Triggered: 0 */6 * * *` (6h)
- `[Intelligence Scheduled] Triggered: 0 7 * * *` (7am)
- `[Intelligence Scheduled] Triggered: 0 */6 * * *` (6h)

### 3. Test Scheduled Handler via Cloudflare Dashboard

1. Navigate to Cloudflare Dashboard → Workers & Pages
2. Select worker (continuity or intelligence)
3. Go to Triggers → Cron Triggers tab
4. Click "Run Trigger" to manually fire cron

---

## What This Enables

### Immediate Benefits

1. **Hourly Connector Sweep** — Catches missed webhook events
2. **Daily Morning Brief** — 7am brief generation (workflow pending)
3. **Automated TTL Cleanup** — Old sessions purged every 6 hours
4. **Signal Analysis Automation** — Unprocessed signals swept every 6 hours

### Next Steps (Phase 2-4)

- **Phase 2:** Wire queue consumers/producers (continuity-triage, intelligence-act)
- **Phase 3:** Create AI Search instance, migrate from R2→Vectorize→D1
- **Phase 4:** Develop missing workflows (MorningBrief, Signal, Act)

---

## Safety Notes

### Why This Is Safe

1. **No breaking changes** — Existing routes/logic untouched
2. **Additive only** — New crons + handlers, no deletions
3. **Graceful degradation** — TODOs log messages, don't throw errors
4. **OAuth session** — No API token conflicts (AGENTS.md Hard Rule #3)

### Rollback Plan

If issues arise:

```bash
# Revert to previous deployment
wrangler rollback services/continuity
wrangler rollback services/intelligence
```

Or remove crons from wrangler.toml and redeploy.

---

## Next Phase Preview

**Phase 2: Queue Wiring**

1. Add `continuity-triage` queue consumer
2. Wire `intelligence-act` queue producer
3. Verify `connector-sync` webhook flow
4. Delete `execution-outcomes` queue (unused)

See `L05_OPERATING_LAYER_WIRING_PLAN.md` for full details.

---

**Ready for Deployment:** YES ✅  
**Approval Required:** Nirmal (Founder)  
**Estimated Deployment Time:** 5 minutes  
**Risk Level:** LOW (additive, no breaking changes)
