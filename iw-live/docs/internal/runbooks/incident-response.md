# Incident Response Runbook

Use this runbook for production incidents affecting availability, correctness, security, or high-value user flows.

## When To Use

- `app.integratewise.ai` is down or materially degraded
- Gateway or a critical Worker is failing
- Webhooks, connector sync, or approvals are failing at scale
- Data is being written incorrectly
- A deployment caused customer-facing impact

## Severity Guide

| Severity | Meaning                                                                      |
| -------- | ---------------------------------------------------------------------------- |
| `SEV1`   | Complete outage, widespread auth failure, or unsafe/corrupting writes        |
| `SEV2`   | Major feature degradation or a critical workflow is blocked for many tenants |
| `SEV3`   | Localized issue, limited tenant impact, or non-critical degradation          |

## First 15 Minutes

1. Name an incident owner.
2. Record the start time, impacted surface, and first observed symptom.
3. Freeze risky deploys and migrations until the issue is understood.
4. Check the current release or config change that may have triggered the incident.
5. Confirm blast radius: tenant-specific, connector-specific, or platform-wide.

## Triage Checklist

### Platform checks

- Gateway health and logs
- Impacted Worker health and logs
- Spine DB availability and query failures
- Cloudflare Queue backlog, retry rate, and DLQ depth
- Recent Pages or Worker deploy history

### Product checks

- Auth and tenant resolution
- Initial hydration and workspace load
- Webhook delivery or connector sync path
- Knowledge search or intelligence actions, if relevant

## Containment Options

Choose the least risky option that stops additional damage:

- Pause connector sync for the affected tenant or provider
- Disable or slow cron-driven sync
- Hold approval-driven writes if actions may be unsafe
- Roll back the last Worker or Pages deployment
- Stop replay or redrive until the root cause is known

## Recovery Steps

1. Fix or roll back the triggering change.
2. Verify health on the affected request path.
3. Run tenant-scoped smoke tests for the broken flow.
4. Re-enable paused traffic or sync in a controlled order.
5. Monitor error rate, queue depth, and customer reports for at least one stability window.

## Incident Notes To Capture

- start and end time
- affected tenants or providers
- deploy/version identifiers
- correlation IDs or request IDs
- exact mitigation taken
- follow-up actions and doc changes needed

## Exit Criteria

- Error rates are back to baseline
- Health checks pass
- Queue backlog and DLQ depth are stable
- Customer-facing flows are verified
- A short post-incident summary is recorded

## Related Runbooks

- [deployment-and-rollback.md](deployment-and-rollback.md)
- [sync-failure-and-dlq-redrive.md](sync-failure-and-dlq-redrive.md)
- [data-recovery.md](data-recovery.md)
