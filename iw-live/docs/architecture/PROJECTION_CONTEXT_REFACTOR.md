# Projection Context Refactor — Implementation Note

> **Tier:** B (Implementation plan). Audit: `CURRENT_CONTEXT_FLOW.md`. Canon: `PROJECTION_MODEL.md` §5.
> **Date:** June 12, 2026 | **Status:** PLANNED — not started. Gated on `apps/web` WIP ownership.
> **Scope:** Frontend context-consistency fix. No architecture change; the backend is already correct.

---

## The rule (single sentence)

```text
ProjectionContext is authoritative.
Components may consume it. Components may NOT recompute it.
```

---

## Current (dual authority — the bug)

```text
Gateway /api/v1/workspace/profile  ──▶  domain prop  ──▶  Header · Workbench · Content
                                   ╲
tenant_users / profiles  ──▶ useProjection().user.department (default "bizops") ──▶ Left Nav

Two authorities. Whichever resolves a given surface wins → Header=CUSTOMER_SUCCESS, Nav=BizOps.
```

## Target (single authority)

```text
Gateway /api/v1/workspace/profile
        ↓
   ProjectionContext   (one object: user · tenant · department · domain · capabilities · entitlements)
        ↓
   Header → Nav → Workbench → Twin     (all read the same object; none recompute)
```

---

## Files (in change order)

| #   | File                                                           | Change                                                                                                                                                                          | Risk                        |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | `apps/web/src/lib/projection/use-projection.ts`                | Seed `UserContext.department`/domain from the gateway profile value (the same one AppShell already has). Remove the independent `profiles` re-query and the `"bizops"` default. | Med — central hook          |
| 2   | `apps/web/src/components/l1/workspace/workspace-shell-new.tsx` | Derive department/domain from the single projection context. Stop mixing a `domain` prop with a separately-resolved `useProjection()` department.                               | **High — foreign WIP here** |
| 3   | `apps/web/src/components/l1/workspace/data-density-scorer.ts`  | Remove `"CUSTOMER_SUCCESS"` default; require explicit domain from caller.                                                                                                       | Low                         |
| 4   | `apps/web/src/components/l1/l1-module-content.tsx`             | Remove hardcoded `const domain = "unified"`; take domain from context.                                                                                                          | Low                         |
| 5   | `services/gateway/src/twin-handoff.ts`                         | `"bizops"` fallback only when truly unknown; prefer resolved department.                                                                                                        | Low                         |
| 6   | `services/gateway/src/customer-zero.ts`                        | Keep `"bizops"` (Customer Zero is genuinely BizOps) — document, don't change.                                                                                                   | None                        |

Map consolidation (follow-up, not blocking the bug): collapse `DOMAIN_TO_CTX` (content-router) and
the shell `workbenchConfig` keys onto the shared `packages/types` resolver
(`DOMAIN_SPINE_CONFIG` / `DEPARTMENT_TO_CONFIG_KEY`).

---

## Acceptance check

1. A user with `department = CUSTOMER_SUCCESS` sees **Account Success** in header, nav, and
   workbench — no surface shows Business Operations.
2. A user with unset department gets **one** deterministic result (no surface-dependent default).
3. `grep` shows no component computing department/domain except the single projection resolver.
4. Playwright onboarding/workspace E2E (live-verification) passes for a CS persona.

---

## Preconditions (do NOT start until these are true)

- `apps/web/src/components/l1/workspace/workspace-shell-new.tsx` — **foreign WIP committed or discarded**
- `apps/web/src/AppShell.tsx` — foreign WIP committed or discarded
- `apps/web/src/utils/spine/gateway-adapter.ts` — foreign WIP committed or discarded

Rationale: files #1–#2 overlap with in-flight uncommitted work from other agents. Editing on top of
that risks clobbering it. The diagnosis is complete; this is a controlled implementation against a
clean working tree, not more discovery.

---

_When the working tree is clean, this is a small, surgical change — the canonical behavior already
exists in the gateway; the work is making the client consume it once._
