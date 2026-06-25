# Tenant Onboarding And Initial Hydration Playbook

Use this playbook when bringing a new tenant onto the platform and validating the first data load into the Spine.

## Goal

Get a tenant from setup to a clean first hydration without confusing initial load, Entity 360, and later linking logic.

## Preparation

1. Confirm tenant and workspace creation path.
2. Confirm which domains and entity types are expected first.
3. Confirm connector credentials or import source readiness.
4. Confirm the baseline schema and tenant config are in place.

## Initial Hydration Rules

- hydrate first, link later
- keep Flow A and Flow B boundaries clear
- do not depend on Entity 360 for first-load correctness
- validate tenant-scoped truth in the Spine before optimizing projections

## Execution Steps

1. Create or verify tenant and workspace records.
2. Initialize tenant config and baseline schema.
3. Connect the first provider or import source.
4. Run the first sync or ingest.
5. Validate normalized entities in the Spine.
6. Validate workspace surfaces can read the new tenant state.
7. Only then validate linked context and richer projections.

## Minimum Validation

- tenant can authenticate and resolve context
- expected entity types appear in Spine
- no duplicate or malformed first-load entities
- workspace loads without depending on later enrichment

## Handoff

After first hydration succeeds:

- enable subsequent sync cadence
- record any tenant-specific mapping quirks
- add provider-specific notes if they belong in connector docs or runbooks

## Related Docs

- [../architecture/INITIAL_HYDRATION_AND_ENTITY360_BOUNDARY.md](../architecture/INITIAL_HYDRATION_AND_ENTITY360_BOUNDARY.md)
- [../architecture/PRODUCT_ARCHITECTURE_FROM_CODE.md](../architecture/PRODUCT_ARCHITECTURE_FROM_CODE.md)
- [connector-go-live.md](connector-go-live.md)
