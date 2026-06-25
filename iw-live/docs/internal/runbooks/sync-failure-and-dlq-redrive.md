# Sync Failure And DLQ Redrive Runbook

Use this runbook for connector sync failures, pipeline processing failures, queue backlog spikes, or DLQ redrive operations.

## Symptoms

- tenant sync is stuck or never completes
- queue backlog is growing
- retries are climbing rapidly
- `dead_letter_queue` or ops DLQ volume spikes
- normalized entities are missing after a sync or webhook burst

## Determine The Failing Stage

Check which path is failing:

| Area                  | What to inspect                                               |
| --------------------- | ------------------------------------------------------------- |
| Webhook ingress       | signature verification, dedupe, provider payload shape        |
| Connector sync        | cron trigger, job creation, provider API errors, cursor state |
| Pipeline / Normalizer | validation errors, mapping errors, idempotency collisions     |
| Intelligence DLQ      | downstream analysis failures or governance path failures      |

## Containment

Before redriving anything:

1. Pause the noisy source if failures are still being produced.
2. Confirm whether the issue is transient or deterministic.
3. Capture sample failing payloads, tenant IDs, providers, and correlation IDs.

## Diagnose The Root Cause

- transient infra issue: provider outage, network issue, secret drift
- deterministic schema issue: payload shape, mapping bug, validation mismatch
- write-path issue: DB constraint, missing tenant config, stale contract

Fix the root cause before replaying.

## Redrive Rules

- redrive one tenant or provider at a time
- preserve correlation and audit context where possible
- rely on idempotent writes rather than manual dedupe hacks
- never bulk-replay the entire DLQ blindly

## Suggested Redrive Flow

1. Query the failing records or DLQ entries.
2. Narrow to the smallest safe replay batch.
3. Re-enqueue to the correct queue only after the fix is live.
4. Monitor:
   - retry count
   - DLQ depth
   - resulting Spine writes
   - duplicate side effects

## Verification

- connector status returns healthy
- backlog drains instead of growing
- expected entities appear in Spine or downstream read surfaces
- no new DLQ spike from the same root cause

## Related Docs

- [../EVENT_DRIVEN_QUEUE_CHECKLIST.md](../EVENT_DRIVEN_QUEUE_CHECKLIST.md)
- [../BEST_PRACTICES_MASTER_CHECKLIST.md](../BEST_PRACTICES_MASTER_CHECKLIST.md)
- [incident-response.md](incident-response.md)
