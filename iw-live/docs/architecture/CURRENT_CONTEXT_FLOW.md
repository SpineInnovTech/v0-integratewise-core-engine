# Projection Context Audit — Current Flow (as-built)

> **Tier:** B (Audit / Derived). Target behavior: `PROJECTION_MODEL.md` §5. Map: `docs/CANON.md`.
> **Date:** June 12, 2026 | **Status:** Audit only — no code changed.
> **Purpose:** Prove where context (identity → department → persona → workspace → projection) is
> resolved today, and pinpoint where it diverges (the `CUSTOMER_SUCCESS → Business Operations` bug).

---

## 1. The chain, as it actually runs

```text
Login → Gateway JWT (auth.ts)
      → tenant_users.department + tenant_spine_config.department/domains   [BACKEND: authoritative]
      → GET /api/v1/workspace/profile (workspace-spine.ts)  → { domain, department }
      → AppShell  (reads profile.domain) ──passes `domain` prop──▶ WorkspaceShellNew
                                                                      │
        WorkspaceShellNew uses TWO independent sources: ─────────────┤
          (a) `domain` prop  → activeDomain → ContentRouter, workbenchConfig, domainConfig
          (b) useProjection() → user.department (re-queried, defaults "bizops") → left nav
```

The split at **(a) vs (b)** inside one component is the core defect: the workbench/content uses the
gateway-resolved **domain prop**, while the **left nav** uses a _separately re-resolved_ department.
When they disagree, the header says one thing and the nav shows another.

---

## 2. Who resolves what (evidence)

| Concern                                 | Resolver                                                        | File                                             | Notes                                                                   |
| --------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| **Identity**                            | Gateway credential auth (RS256 JWT)                             | `services/gateway/src/auth.ts`                   | enriches headers; persists `department` to `tenant_users`               |
| **Department → Domain (authoritative)** | `resolveDomain(domain, department)` via `DEPARTMENT_TO_DOMAIN`  | `services/gateway/src/workspace-spine.ts`        | has the explicit CS→BizOps fix comment; stores in `tenant_spine_config` |
| **Workspace/profile read**              | `department = row.department \|\| primaryDomain`                | `services/gateway/src/workspace-spine.ts`        | backend returns `{ domain, department }`                                |
| **Onboarding resolution**               | `USE_CASE_DOMAINS`, `DEPARTMENT_CTX_MAP`                        | `apps/web/.../onboarding/OnboardingFlow.tsx`     | first write of domain+CTX                                               |
| **Shell domain (workbench/content)**    | `activeDomain = domain` prop (immutable)                        | `apps/web/.../workspace/workspace-shell-new.tsx` | drives `ContentRouter`, `workbenchConfig`, `domainConfig`               |
| **Shell nav (persona)**                 | `useProjection().user.department`                               | `apps/web/src/lib/projection/use-projection.ts`  | **re-resolves independently**, default `"bizops"`                       |
| **Projection context**                  | `useProjection()` re-queries `profiles` / `tenant_spine_config` | `use-projection.ts`                              | Supabase-style client; not the gateway-resolved value                   |
| **Domain → CTX**                        | `DOMAIN_TO_CTX`                                                 | `apps/web/.../workspace/content-router.tsx`      | yet another mapping table                                               |

---

## 3. The divergence points (root cause)

### 3a. Two independent department/domain sources in one shell

`workspace-shell-new.tsx` consumes **both** the `domain` prop (gateway-authoritative) **and**
`useProjection().user.department` (independently re-resolved). Nothing guarantees they agree.

### 3b. Conflicting defaults across the codebase

The same missing value defaults to **three different things** depending on the file:

| Default              | Where                                                              |
| -------------------- | ------------------------------------------------------------------ |
| `"bizops"`           | `use-projection.ts`, gateway `twin-handoff.ts`, `customer-zero.ts` |
| `"CUSTOMER_SUCCESS"` | `data-density-scorer.ts` (`shouldRenderModule` default)            |
| `"unified"`          | `l1-module-content.tsx` (`const domain = "unified"`)               |

A user whose `profile.department` is unset gets `bizops` from the projection (→ "Business
Operations" nav) while the gateway may have resolved `CUSTOMER_SUCCESS` for the workbench. That is
exactly the screenshot.

### 3c. Many mapping tables, no single resolver

At least six department/domain maps exist independently and can drift:
`DEPARTMENT_TO_DOMAIN` (gateway), `USE_CASE_DOMAINS` + `DEPARTMENT_CTX_MAP` (onboarding),
`DOMAIN_TO_CTX` (content-router), `DEPARTMENT_TO_CONFIG_KEY` (`packages/types`), `DEPARTMENTS`
(`lib/spine/departments`), and the `workbenchConfig` defaults table (shell).

---

## 4. Why the backend is (mostly) right and the frontend isn't

The gateway already implements the canonical rule — `resolveDomain()` derives the domain from
`department` and refuses to silently default to BIZOPS (the comment literally cites the CS→BizOps
regression). The **frontend** undoes this by re-resolving department inside `useProjection()`
instead of consuming the gateway-resolved `domain`/`department` that AppShell already has.

So the truth is computed correctly once (gateway) and then **recomputed inconsistently** on the
client.

---

## 5. The minimal fix (per PROJECTION_MODEL.md §5) — proposal, not yet applied

```text
Resolve ONE ProjectionContext at the top, from the gateway-authoritative values; every layer reads it.
```

1. **Single source.** `useProjection()` should seed `UserContext.department` from the
   gateway-resolved `/api/v1/workspace/profile` value (the same one AppShell passes as `domain`),
   not by re-querying `profiles` with its own `"bizops"` default.
2. **One object to the shell.** `workspace-shell-new.tsx` should take department/domain from the
   single projection context — not mix a `domain` prop with a separately-resolved projection.
3. **One default, one place.** Remove the `"CUSTOMER_SUCCESS"` and `"unified"` ad-hoc defaults;
   any fallback happens once, at the single resolution point.
4. **One mapping module.** Collapse the duplicate domain/CTX maps to a single shared resolver
   (re-exported from `packages/types` `DOMAIN_SPINE_CONFIG` / `DEPARTMENT_TO_CONFIG_KEY`).

Expected diff size: small and surgical — the canonical behavior already exists in the gateway; the
work is making the client consume it instead of recomputing it. No new architecture required.

---

## 6. Files to change when we move from audit → fix

| File                                                           | Change                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `apps/web/src/lib/projection/use-projection.ts`                | seed department/domain from gateway profile; drop independent `"bizops"` default      |
| `apps/web/src/components/l1/workspace/workspace-shell-new.tsx` | derive department/domain from the single projection context, not a separate prop path |
| `apps/web/src/components/l1/workspace/data-density-scorer.ts`  | remove `"CUSTOMER_SUCCESS"` default; require explicit domain                          |
| `apps/web/src/components/l1/l1-module-content.tsx`             | remove hardcoded `domain = "unified"`                                                 |
| `apps/web/src/components/l1/workspace/content-router.tsx`      | source `DOMAIN_TO_CTX` from the shared map                                            |

---

_Audit only. The fix is gated on confirming there is no foreign WIP mid-flight in these `apps/web`
files. Target behavior is already canon (`PROJECTION_MODEL.md` §5)._
