# Release Readiness Playbook

Use this playbook for any meaningful production release across frontend, Workers, schema, or connector behavior.

## Scope The Release

Identify which surfaces are changing:

- `apps/web`
- one or more `services/*`
- `packages/*`
- `sql-migrations/`
- Cloudflare config or secrets

## Before The Release Window

1. Confirm owner, reviewer, and rollback owner.
2. Confirm the exact user flows or tenants affected.
3. Review schema compatibility and rollout order.
4. Decide whether the release is:
   - code only
   - config only
   - migration plus code

## Pre-Release Checklist

- validation commands pass
- secrets and env vars are present in the target environment
- smoke-test plan is written down
- rollback path is known
- incident contact path is ready if impact occurs

## Release Execution

1. Deploy in dependency order.
2. Keep migrations additive where possible.
3. Verify health checks immediately after deploy.
4. Run the agreed smoke tests on critical routes and tenant-scoped flows.

## Post-Release Monitoring

Watch for one stability window:

- 5xx rate
- queue backlog and DLQ depth
- auth and tenant-resolution errors
- webhook verification failures
- connector sync regressions

## Exit Criteria

- deployment is healthy
- smoke tests pass
- no unexpected DLQ or retry spike
- rollback is no longer likely

## Related Docs

- [../runbooks/deployment-and-rollback.md](../runbooks/deployment-and-rollback.md)
- [../runbooks/incident-response.md](../runbooks/incident-response.md)
- [../GO_LIVE_CHECKLIST.md](../GO_LIVE_CHECKLIST.md)
