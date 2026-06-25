# IntegrateWise Playwright Verification Matrix

## Purpose

These tests verify the **Continuity Loop** and **Constitutional Laws** from the user's perspective.

They are NOT page-level UI tests. They are **doctrine verification tests** that prove the system works end-to-end.

## RC1 Criteria

```
npx playwright test
```

Must pass:
- Suite 1: Authentication & Tenant Isolation (6 tests)
- Suite 2: Memory Hub (5 tests)
- Suite 3: Approval Center (6 tests)
- Suite 4: Handoff Lifecycle (4 tests)
- Suite 5: Outcome Ingestion (3 tests)
- Suite 6: Tenant-Class Enforcement (3 tests)
- Suite 7: Continuity Loop E2E (7 tests)

**Total: ~34 tests, 0 failures, 0 flaky**

## Prerequisites

1. Deployed environment (real JWT secret, real D1, real DOs)
2. D1 migrations applied (0001, 0002, 0003)
3. tenant_config seeded (customer_zero + test tenants)
4. Environment variables set:
   - `BASE_URL` — gateway URL
   - `TENANT_A_JWT` — valid JWT for test tenant A
   - `TENANT_B_PACKAGE_ID` — a package owned by tenant B
   - `EXTERNAL_TENANT_JWT` — JWT for an external-class tenant
   - `CZ_JWT` — JWT for customer_zero tenant
   - `UNKNOWN_TENANT_JWT` — JWT for a tenant not in tenant_config
   - `EXPIRED_JWT` — an expired but structurally valid JWT
   - `AWAITING_PACKAGE_ID` / `_2` / `_3` — packages in AWAITING_OUTCOME state
   - `TEST_WEBHOOK_URL` — endpoint for dispatch testing

## Status Progression

```
Feature Complete → RC1 Candidate (now)
RC1 Candidate + Playwright passes → RC1 Verified
RC1 Verified + Production deploy → GA
```

## Running

```bash
cd tests/playwright
npx playwright test
```

Or specific suite:
```bash
npx playwright test suites/07-continuity-loop.api.ts
```
