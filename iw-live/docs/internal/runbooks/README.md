# Runbooks

Runbooks are reactive operational procedures for incidents, failures, rollback, and recovery.
Use them when something is broken or when you need a tightly scoped operational response.

## Available Runbooks

| Runbook                                                                  | Use when                                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| [incident-response.md](incident-response.md)                             | Customer-facing outage, major degradation, or unclear platform incident           |
| [deployment-and-rollback.md](deployment-and-rollback.md)                 | A release fails, a deploy regresses behavior, or you need a safe rollback path    |
| [connector-oauth-troubleshooting.md](connector-oauth-troubleshooting.md) | OAuth authorization or callback flows fail for a connector                        |
| [sync-failure-and-dlq-redrive.md](sync-failure-and-dlq-redrive.md)       | Connector sync, pipeline, or queue processing is failing and you may need redrive |
| [data-recovery.md](data-recovery.md)                                     | Data was corrupted, lost, or written incorrectly and recovery planning is needed  |

## Operating Rules

- Prefer containment first, then diagnosis, then recovery
- Preserve auditability: keep timestamps, correlation IDs, tenant IDs, and deployment versions
- Avoid bulk replay or rollback without understanding blast radius
- When in doubt, protect the Spine and stop new writes before attempting recovery

## Related Docs

- [../playbooks/README.md](../playbooks/README.md)
- [../DEPLOYMENT_BEST_PRACTICES.md](../DEPLOYMENT_BEST_PRACTICES.md)
- [../EVENT_DRIVEN_QUEUE_CHECKLIST.md](../EVENT_DRIVEN_QUEUE_CHECKLIST.md)
- [../WEBHOOKS_AND_SLACK_APP.md](../WEBHOOKS_AND_SLACK_APP.md)
