# Deployment And Rollback Runbook

Use this runbook when a release needs to be deployed safely, rolled back quickly, or stabilized after a bad change.

## Before Deploying

1. Confirm scope: frontend, one Worker, multiple Workers, migration, or config-only.
2. Run the relevant validation:
   - `pnpm build`
   - targeted tests for changed services
   - migration review for backward compatibility
3. Confirm rollback owner and communication path.
4. Check whether the change affects:
   - auth
   - tenant resolution
   - webhook verification
   - queue consumers
   - Spine writes

## Preferred Deploy Order

When multiple Workers are changing, deploy downstream services first and Gateway last.

- data and processing layers
- supporting Workers
- public ingress layer

Use the documented Cloudflare deployment flow and repo scripts instead of ad hoc local commands where possible.

## Post-Deploy Verification

- health endpoints return success
- one authenticated tenant-scoped request works end to end
- webhook or sync path still verifies and routes correctly
- no unexpected spike in retries, DLQ depth, or 5xx rate

## When To Roll Back

Roll back when:

- a deploy introduces customer-facing breakage
- auth or tenant resolution fails
- webhook verification breaks
- new writes are unsafe or corrupting
- the fix-forward path is slower or riskier than reverting

## Rollback Procedure

1. Stop additional risky deploys.
2. Identify whether the issue is:
   - code only
   - config or secret drift
   - schema or migration related
3. Revert the failing Worker or Pages deployment using the last known good version.
4. Re-run smoke checks on the affected path.
5. Keep the incident open until queue backlog, retries, and error rate normalize.

## Database Rollback Rule

Do not perform destructive database rollback directly in production unless you have:

- a confirmed blast radius
- a backup or PITR plan
- validation criteria
- a communication plan

For schema or data damage, use [data-recovery.md](data-recovery.md) instead of improvising.

## Quick Rollback Checklist

- previous working version identified
- rollback owner assigned
- affected tenants identified
- smoke test path ready
- recovery window monitored after rollback

## Related Docs

- [../DEPLOYMENT_BEST_PRACTICES.md](../DEPLOYMENT_BEST_PRACTICES.md)
- [incident-response.md](incident-response.md)
- [data-recovery.md](data-recovery.md)
