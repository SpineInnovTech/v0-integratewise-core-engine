# Playbooks

Playbooks are planned, repeatable operating procedures. Use them before change, onboarding, or rollout work, not only after something breaks.

## Available Playbooks

| Playbook                                                                                 | Use when                                                            |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [release-readiness.md](release-readiness.md)                                             | preparing and executing a production release                        |
| [connector-go-live.md](connector-go-live.md)                                             | launching a new connector, webhook, or provider integration         |
| [tenant-onboarding-and-initial-hydration.md](tenant-onboarding-and-initial-hydration.md) | onboarding a tenant and validating initial hydration into the Spine |

## Principles

- Start with the live architecture, not legacy notes
- Keep changes tenant-safe, approval-safe, and observable
- Prefer gradual rollout and scoped validation over big-bang activation

## Related Docs

- [../runbooks/README.md](../runbooks/README.md)
- [../architecture/INITIAL_HYDRATION_AND_ENTITY360_BOUNDARY.md](../architecture/INITIAL_HYDRATION_AND_ENTITY360_BOUNDARY.md)
- [../GO_LIVE_CHECKLIST.md](../GO_LIVE_CHECKLIST.md)
