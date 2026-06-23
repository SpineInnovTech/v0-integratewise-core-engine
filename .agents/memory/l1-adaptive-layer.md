---
name: L1 adaptive workspace layer
description: How the IntegrateWise OS surface is derived from role × industry × schema (the "spine"), and the persistent-shell rule.
---

# L1 adaptive workspace layer (iwa-customer-zero / artifacts/integratewise)

The work surface is **derived, not hardcoded**. One resolver,
`deriveWorkspace({role, industry, schema})` in `src/spine/derive-workspace.ts`,
maps three inputs → `{ modules, role profile, industry topics }`. The sidebar
and the role Home both render from that result; nothing branches per-role or
per-screen.

**The rule:** adding a role, industry, module, or changing schema availability
is a config edit in `src/spine/*` — never a new conditional in a view.
- `role-registry.ts` — `DEPT_PROFILE` (10 CTXEnum roles → module ids + Home profile)
- `industry-registry.ts` — 12 industries → orgType, topics, terminology, emphasis
- `module-registry.ts` — module id → { label, icon, path, requiredSchema, Component (an existing view) }
- `schema-availability.ts` — schema group → `live | seeded | off`
- `spine-context.tsx` — holds role/industry/schema, persists to localStorage `iw.spine.v1`

**Persistent shell:** `WorkspaceShell` (sidebar + topbar) is rendered OUTSIDE
the wouter route `<Switch>` in `App.tsx` (inside a catch-all `<Route>` that
stays matched for every non-auth path), so the frame never unmounts on
navigation — only the inner content swaps. Auth routes render bare, outside the
shell.

**Schema-aware rendering:** `ModuleHost` is the single gate.
- relay-backed groups (person/company/deal) = `live` → render view, no banner
- stub-backed groups = `seeded` → render view + amber "Sample data" banner
- `off` → graceful `SchemaEmptyState` (no crash, no fake data)

**Why:** the product premise is one surface that adapts to whoever is using it
and to whatever data the org actually has. Hardcoding per-role screens or
assuming all schema exists would break that premise and make every new
role/industry a rewrite.

**Gotchas:**
- `module-registry` contains JSX (an AdminModule wrapper) → it must be `.tsx`.
- Don't confuse the global `DemoBanner` ("Demo Mode: …sample data") with the
  per-module seeded banner ("Sample data — connect a source…"). They're
  different components; the demo banner is on every page.
- Existing views were left untouched and slotted as module Components — they
  keep using the relay (leads/clients/deals) or the Supabase stub as before.
- The old `components/app-shell.tsx`, `components/sidebar.tsx`, and the
  `pages/*` wrappers are now orphaned (App.tsx no longer imports them) but were
  left in place to avoid churn; the live shell is `components/workspace/*`.
