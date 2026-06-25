# Connector OAuth Troubleshooting Runbook

Use this runbook when connector authorization, callback handling, or tenant-scoped OAuth flows fail.

## Common Symptoms

- user is redirected back with an error
- callback route returns 4xx or 5xx
- connector shows disconnected immediately after auth
- state or tenant context is missing
- provider says redirect URI mismatch

## First Checks

1. Identify the provider and tenant.
2. Confirm which live path is responsible for the flow.
3. Check whether the issue is:
   - one tenant
   - one provider
   - all OAuth flows

## Verify Provider Configuration

- client ID and secret are present in the correct environment
- redirect URI exactly matches the live callback path
- requested scopes match current product behavior
- provider app is not disabled, rate limited, or restricted

## Verify IntegrateWise Configuration

- Gateway and connector routes are deployed and healthy
- callback route matches current code and environment
- tenant and user context are preserved through the state parameter or session flow
- any required secret rotation did not leave stale values in Cloudflare

## Logs And Evidence To Check

- callback request status and body
- state or tenant resolution failures
- provider error codes returned on callback
- connector write or credential persistence failures after callback
- correlation ID for the full auth round trip, if available

## Safe Recovery Steps

1. Fix redirect URI, secret, or scope mismatch.
2. Re-test in a single tenant before wider rollout.
3. Confirm connector status stays connected after callback.
4. Trigger a minimal sync or status check to validate the connection.

## Do Not

- broaden scopes casually without product review
- rotate provider secrets mid-incident without recording the change
- test across many tenants before one known-good tenant passes

## Related Docs

- [../WEBHOOKS_AND_SLACK_APP.md](../WEBHOOKS_AND_SLACK_APP.md)
- [../architecture/PRODUCT_ARCHITECTURE_FROM_CODE.md](../architecture/PRODUCT_ARCHITECTURE_FROM_CODE.md)
- [incident-response.md](incident-response.md)
