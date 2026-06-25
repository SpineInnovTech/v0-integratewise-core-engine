# The Projection Model — Canonical

> **Status:** Canonical architecture doctrine
> **Date:** June 12, 2026
> **Authority:** Nirmal (Founder)
> **Companion docs:** `SPINE_MODEL.md` (the truth), `USER_SYSTEM_JOURNEY_BLUEPRINT.md` (layers/stages)
> **Map:** `docs/CANON.md`. When a doc contradicts this file or its referenced code, the code wins.

---

## 0. The one-line truth

```text
A projection is a VIEW, computed from the Spine, for a specific (user × tenant × context).
The Spine is the truth; a projection is never a store, never an ETL copy, never a raw tool table.
```

**Doctrine (enforced in code):** No surface or Workbench component may query raw tables directly.
Every read goes through the Projection Layer. See the banner in
`apps/web/src/lib/projection/index.ts`.

---

## 1. Why projections exist

The Spine holds one canonical, normalized truth per tenant. But two users never need the same
slice of it. A CS practitioner, a RevOps manager, and the founder looking at the same account must
each see a _different, correct_ view — scoped by who they are, what they're entitled to, and how
deep they can see across departments.

A projection resolves that slice **deterministically** so the UI is dumb and consistent: the
surface renders whatever the projection returns; it never decides scope on its own.

---

## 2. What a projection is computed from

`useProjection()` (`apps/web/src/lib/projection/use-projection.ts`) assembles the slice from six
dimensions:

| Dimension        | Meaning                                                               | Source                    |
| ---------------- | --------------------------------------------------------------------- | ------------------------- |
| **Role**         | owner / admin / manager / practitioner(readonly)                      | profile → `projectRole()` |
| **Department**   | primary domain (CUSTOMER_SUCCESS, REVOPS, SALES, …, BIZOPS, PERSONAL) | profile.department        |
| **Industry**     | tenant vertical + subsector                                           | tenant spine config       |
| **Depth matrix** | how deep this user sees _across_ departments                          | tenant spine config       |
| **Twin tier**    | AI capability level (no_twin / basic_twin / full_twin)                | tenant spine config       |
| **Entitlements** | active `tenant_products`                                              | product entitlements      |

The 12 department domains and their entity types are defined in `DOMAIN_SPINE_CONFIG`
(`packages/types/src/schema.ts`) — the same config the Spine writer uses. Projection and Spine
share one schema source, so a view can never reference a type the Spine doesn't know.

---

## 3. The canonical projection context object

The projection resolves into one typed result — the single object every surface consumes:

```text
ProjectionResult
├── user:   UserContext   { userId, role, department, capabilities, entitlements }
├── tenant: TenantContext { tenantId, industryVertical, subsector, depthMatrix, twinTier }
├── modules:     ProjectedModule[]      ← nav is a projection of capability, not a static menu
├── entityTypes: ProjectedEntityType[]  ← which types + which fields (field policy)
├── metrics:     ProjectedMetric[]      ← which KPIs, how aggregated
└── canAct / canApprove / canAdmin      ← governance gates surfaced to the UI
```

Defined in `use-projection.ts`. Navigation is built from it (`projection/nav-builder.ts` →
`buildNavFromProjection`); module access is gated by it (`projection/module-guard.ts`); field
visibility (render / search / AI-readable) is governed by it (`projection/field-policy.ts`).

**Three Doors** are enforced at the nav layer: _My Work_ (department modules), _Cross-Dept_
(depth-matrix visibility), _My Self_ (personal modules).

---

## 4. The read path (where projections come from)

Surfaces never hold their own store. They fetch typed projections from the gateway, served
D1-direct from the Spine partitions (DECISION 21 — no Supabase-backed BFF hop):

```text
Spine (D1 domain partitions: decide/build/grow/run/cross)
        │  gateway (auth · tenant · D1-direct)
        ├── GET /api/v1/projections/morning-context     → returning-user hydration (signals/entities/connectors)
        ├── GET /api/v1/workspace/*                      → workspace + page projections (SuccessPageProjection, …)
        ├── GET /api/v1/pipeline/entities[/batch|/counts] → entity grids / counts
        └── proposals / signals projections              → ProposalOpsProjection, signal views
```

Frontend hooks: `use-morning-context.ts` / `use-hydration.ts` (hydration), `api-cs.ts` +
`use-cs-data.ts` (CS page projections), `use-proposals.ts` (ops). Typed projection shapes live in
`@integratewise/types` (`SuccessPageProjection`, `ProposalOpsProjection`, `MorningContext`).

> ⚠️ Migration note: parts of `useProjection()` still read context via a Supabase-style client
> (`spineClient.from(...)`). Target: resolve `UserContext`/`TenantContext` through the gateway
> projection endpoints (D1-direct), consistent with DECISION 22. Tracked in
> `docs/migrations/DE_SUPABASE_MIGRATION.md`.

---

## 5. The consistency rule (the CUSTOMER_SUCCESS → BizOps fix)

The observed UX gap — a surface showing `CUSTOMER_SUCCESS` while another resolves it to
`Business Operations` — is a **context-assembly inconsistency**, not a rendering bug. The rule:

```text
There is exactly ONE projection context per (user, tenant) render.
Department/persona is resolved ONCE, canonically, and every surface reads the same object.
```

Requirements:

1. **Single resolution.** `department` (persona) is resolved once into `UserContext.department`
   using the canonical domain keys (`DEPARTMENT_TO_CONFIG_KEY`, `packages/types/src/schema.ts`).
   No surface re-derives or re-labels it locally.
2. **Canonical labels.** Display names map from the canonical key in one place
   (`DOMAIN_SPINE_CONFIG`), so `CUSTOMER_SUCCESS` always renders with one label everywhere.
3. **Depth, not duplication.** Cross-department views come from the **depth matrix**, not from a
   second persona. A CS user seeing BizOps data is depth-driven visibility into the same Spine,
   not a different projection identity.
4. **Default once.** The `bizops` default applies only at the single resolution point, never
   per-component.

If a surface needs different data, it requests a different _projection of the same context_ — it
never invents its own context.

---

## 6. Invariants

- The Spine is the truth; projections are derived and disposable (cache-friendly, TTL 60–300s).
- Projections are RBAC-filtered, schema-governed, tenant-scoped — at the projection layer, not JSX.
- Governance gates (`canAct`/`canApprove`) ride on the projection; the UI cannot grant itself rights.
- Nav, modules, fields, and metrics are all projections of capability — not static config.

---

## 7. Source-of-truth index (read the code, not a copy)

| Concept                                  | Authoritative source                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Projection hook + context types          | `apps/web/src/lib/projection/use-projection.ts`                                             |
| Role/capability/entitlement projection   | `apps/web/src/lib/projection/rbac-projection.ts`                                            |
| Nav as projection                        | `apps/web/src/lib/projection/nav-builder.ts`                                                |
| Module access gate                       | `apps/web/src/lib/projection/module-guard.ts`, `module-resolver.ts`                         |
| Field-level policy (render/search/AI)    | `apps/web/src/lib/projection/field-policy.ts`                                               |
| Hydration (returning user)               | `apps/web/src/hooks/use-morning-context.ts`, `use-hydration.ts`                             |
| Gateway projection endpoints (D1-direct) | `services/gateway/src/workspace-spine.ts`                                                   |
| Domain config + department mapping       | `packages/types/src/schema.ts` (`DOMAIN_SPINE_CONFIG`, `DEPARTMENT_TO_CONFIG_KEY`)          |
| Typed projection shapes                  | `@integratewise/types` (`SuccessPageProjection`, `ProposalOpsProjection`, `MorningContext`) |

---

_This file is the canonical reference for projections. Pointer-based by design: update pointers,
never fork the lists. The Spine is the truth; everything the user sees is a view of it._
