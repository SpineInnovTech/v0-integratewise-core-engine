# The Onboarding Flow — Canonical (L0)

> **Status:** Canonical architecture doctrine
> **Date:** June 12, 2026
> **Authority:** Nirmal (Founder)
> **Companion docs:** `SPINE_MODEL.md` (the truth), `PROJECTION_MODEL.md` (views), `USER_SYSTEM_JOURNEY_BLUEPRINT.md` (L0)
> **Map:** `docs/CANON.md`. When a doc contradicts this file or its referenced code, the code wins.

---

## 0. The one sentence that defines onboarding

```text
Onboarding does not assign a workspace.
Onboarding creates a Spine Context.
Workspaces are projections computed from that Spine Context.
```

This is the doctrine that prevents the `CUSTOMER_SUCCESS → Business Operations` confusion: a user
does not "land in a workspace." Onboarding resolves _who they are, what org they're in, what
reality they connect, and how deep they see_ into a single **Spine Context**. Every surface they
later see is a projection of that context (see `PROJECTION_MODEL.md`).

The journey shifted from `Signup → Workspace → Dashboard` to:

```text
Identity → Organization → Reality Connections → Spine Hydration
        → Memory → Projection → Governance → Continuity → (Desk)
```

---

## 1. What onboarding actually collects (code-grounded)

The L0 flow has **four UI steps** (`apps/web/src/components/activation/onboarding/`):

```text
Welcome  →  Profile  →  Goals  →  Connect
```

producing one `OnboardingData` object (`OnboardingFlow.tsx`):

```text
useCase: personal | work | business     industry, department, companySize
goal, workspaceName                      connectors: [{ provider, flowType: A|B|C }]
creamyJobId  (Spine-build job)           spineInitialized
```

Two pure maps turn that into a **Spine Context**, not a workspace:

- `USE_CASE_DOMAINS` — useCase + department → canonical domain (`CUSTOMER_SUCCESS`, `BIZOPS`,
  `SALES`, `PRODUCT_ENGINEERING`, …). Same domains as `DOMAIN_SPINE_CONFIG`.
- `DEPARTMENT_CTX_MAP` — department → operating context (`CTX_CS`, `CTX_BIZOPS`, `CTX_SALES`, …).

The UI steps are the _surface_; the constitutional phases below are the _system journey_ they drive.

---

## 2. The constitutional phases (L0 → Desk)

| Phase                         | What happens                                                                                                                               | Grounded in                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| **1. Identity**               | Authenticate; establish the user (gateway credential auth, RS256 JWT).                                                                     | `WelcomeStep`, gateway `auth.ts`                        |
| **2. Organization Discovery** | Resolve useCase + department + industry + size → canonical **domain** and **CTX\_\***.                                                     | `ProfileStep`, `USE_CASE_DOMAINS`, `DEPARTMENT_CTX_MAP` |
| **3. Reality Connections**    | Connect the tools that hold the org's reality (Nango). Each connector is tagged Flow A/B/C.                                                | `ConnectorsStep`, `connectors[]`                        |
| **4. Spine Hydration**        | Real data flows in; the 8-stage pipeline normalizes and writes the **Spine** (D1 partitions). The workspace arrives pre-filled, not empty. | `AILoader` (`creamyJobId`), `services/pipeline`         |
| **5. Memory Activation**      | Conversational / org / personal memory begin accumulating via the continuity pipeline.                                                     | `services/continuity`                                   |
| **6. Projection Generation**  | The Spine Context yields projections — nav, modules, entity views, metrics — per `PROJECTION_MODEL.md`.                                    | `lib/projection/*`, gateway projection endpoints        |
| **7. Governance Activation**  | The HARD GATE is live: AI may think/propose, never act without approval (`x-approval-token`).                                              | `services/intelligence` / `govern`                      |
| **8. Continuity Activation**  | Context is now shared across every AI, tool, and session — the IW Continuity Bridge is on.                                                 | `services/continuity`, `iw-agent-runtime`               |
| **Exit: Desk**                | The user arrives at their projected workbench (L1) with the Spine already populated.                                                       | `spineInitialized: true` → workspace                    |

`STEP_TIMINGS` budget the visible path to ~2 minutes; Spine hydration runs as a tracked job
(`AILoader` polls `creamyJobId`) so the desk is populated, not blank.

---

## 3. Why this is not "create a workspace"

```text
WRONG:  signup → pick a workspace → fill it
RIGHT:  resolve Spine Context (identity + org + reality + depth) → hydrate Spine → project surfaces
```

Consequences (all enforced elsewhere in the canon):

1. **One context, resolved once.** `department`/persona is resolved a single time into the Spine
   Context (canonical domain + `CTX_*`), never re-derived per surface. (`PROJECTION_MODEL.md` §5)
2. **Surfaces are computed.** The "workspace" a user sees is a projection of the context, so the
   same account renders correctly for a CS practitioner, a RevOps manager, and the founder.
3. **Pre-filled, not empty.** Because Phase 4 hydrates the Spine from real connected data before
   the desk opens, the first view has substance.
4. **Continuity from minute one.** The context and memory created here are the same substrate every
   future session, tool, and AI reads — that is the product.

---

## 4. Invariants

- Onboarding writes a **Spine Context + hydrated Spine**, never a standalone workspace store.
- Domains and contexts come from canonical maps (`DOMAIN_SPINE_CONFIG`, `USE_CASE_DOMAINS`,
  `DEPARTMENT_CTX_MAP`) — no ad-hoc department strings.
- All writes go through the pipeline to Cloudflare D1 (DECISION 22). No Supabase provisioning at
  signup. (Migration status tracked in `docs/migrations/DE_SUPABASE_MIGRATION.md`.)
- Governance is active before the user can act; the Twin is read-only to the Spine.

---

## 5. Source-of-truth index (read the code, not a copy)

| Concept                                 | Authoritative source                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| Flow + data shape + domain/context maps | `apps/web/src/components/activation/onboarding/OnboardingFlow.tsx`                 |
| UI steps                                | `.../onboarding/steps/{WelcomeStep,ProfileStep,GoalsStep,ConnectorsStep}.tsx`      |
| Spine-build progress (hydration)        | `.../onboarding/AILoader.tsx`, `WorkplaceLoading.tsx`                              |
| Domain config + department mapping      | `packages/types/src/schema.ts` (`DOMAIN_SPINE_CONFIG`, `DEPARTMENT_TO_CONFIG_KEY`) |
| Pipeline (Spine hydration)              | `services/pipeline`                                                                |
| Projection of the context               | `docs/architecture/PROJECTION_MODEL.md`, `apps/web/src/lib/projection/*`           |
| L0 in the journey                       | `docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md`                               |

---

_This file is the canonical reference for onboarding. Pointer-based by design. Onboarding creates a
Spine Context; workspaces are projections of it. When in doubt — halt, ask Nirmal._
