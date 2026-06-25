# Connector Go-Live Playbook

Use this playbook when adding or materially changing a connector, webhook, or provider integration.

## Define The Integration Shape

Document:

- provider and domain
- auth model: OAuth, API key, webhook, polling, or mixed
- entity types and destination schema
- sync model: initial hydration, incremental sync, webhook assist, or scheduled polling

## Pre-Go-Live Checklist

1. Confirm provider credentials and scopes.
2. Confirm callback URLs and webhook endpoints.
3. Confirm signature verification and replay protection where applicable.
4. Confirm tenant-scoped storage and idempotency strategy.
5. Confirm observability for auth, sync, and webhook failures.

## Validation Flow

- test one provider sandbox or internal tenant first
- validate authorization
- validate initial sync or webhook delivery
- verify normalized entities land in the right Spine shape
- verify duplicate deliveries do not create duplicate writes

## Rollout Strategy

- launch to one internal or dogfood tenant first
- expand to a small controlled set
- only then widen availability

## Docs To Update

- API or connector catalog docs
- webhook docs if a new inbound path is added
- runbooks for OAuth or sync failure if the provider adds new failure modes

## Exit Criteria

- happy path works
- failure path is understood
- monitoring is in place
- support and ops docs are updated

## Related Docs

- [../runbooks/connector-oauth-troubleshooting.md](../runbooks/connector-oauth-troubleshooting.md)
- [../runbooks/sync-failure-and-dlq-redrive.md](../runbooks/sync-failure-and-dlq-redrive.md)
- [../WEBHOOKS_AND_SLACK_APP.md](../WEBHOOKS_AND_SLACK_APP.md)
