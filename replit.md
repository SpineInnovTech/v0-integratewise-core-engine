# iwa-customer-zero

The single IntegrateWise frontend (the **L1 Shell**). This repo adopted the platform's real, gateway-wired UI (`apps/web` from `integratewise-live`) wholesale and runs it on Replit as a pnpm monorepo. It is the surface IntegrateWise operates the business from, and the same code is intended to transplant back into `integratewise-live` to replace `apps/web` — so it is built for **monorepo-portability** (minimal divergence from `apps/web`; the gateway-client is the single swappable seam).

## Two-Repo Architecture

| Repo | Role |
|------|------|
| `integratewise-live` | **Platform** — owns ALL truth: identity (custom RS256 JWT auth; Clerk RETIRED), tenancy, schema AI, Spine, memory, governance, connectors, execution, Razorpay billing. Runs on **Cloudflare** (Workers + D1/KV). |
| `iwa-customer-zero` (this repo) | **The whole frontend** — a privileged platform client. Calls `integratewise-live` gateway APIs (`/api/v1/*`). Owns no auth, tenants, schema, or data. |

Operating identity is **tenant-zero `iw-customer-zero`** (admin/god view). No Supabase anywhere — the platform backend is entirely Cloudflare.

## Run & Operate

- `pnpm --filter @workspace/integratewise run dev` — run the frontend (Vite 6, port from `$PORT`)
- `pnpm --filter @workspace/api-server run dev` — run the legacy Express+Drizzle relay (KEPT BUT UNUSED — see below)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: **React 18.3 + Vite 6.4 + `@vitejs/plugin-react-swc` + Tailwind v4 + react-router v7** (adopted from `apps/web`)
- Vendored platform package: `@integratewise/types` (`workspace:*`, from `lib/integratewise-types`)
- Memory substrate ("Spine") + projections come from the adopted source; a single env flag selects the data/auth provider

## Boot modes (the master switch)

`VITE_SPINE_PROVIDER` (in `artifacts/integratewise/.env`) is the master switch:
- **`local-mock`** (current default) — fully offline. Spine serves simulated records, the gateway-client skips its missing-URL throw, and `auth-manager` mints a decode-only tenant-zero JWT (no `/auth/me`, no authorized mutations). `/app` renders the real shell offline.
- **`gateway-proxy`** (Phase B) — wire the live Cloudflare gateway by also setting `VITE_API_BASE_URL=https://gateway.dev.integratewise.ai`.

See `.agents/memory/local-mock-boot.md` for the two-auth-layer trap that makes offline boot non-obvious.

## Where things live

- `artifacts/integratewise/src/App.tsx` — root: `AuthProvider` (login-vs-shell gate) → `RouterProvider`
- `artifacts/integratewise/src/AppShell.tsx` — workspace shell + tenant provisioning loop (consumes the `useAuth` provider)
- `artifacts/integratewise/src/lib/auth-manager.ts` — singleton token lifecycle; holds the `IS_LOCAL_MOCK` offline path
- `artifacts/integratewise/src/lib/gateway-client.ts` — **the swappable seam** to the platform gateway
- `artifacts/integratewise/src/utils/spine/` — Spine client + `local-mock` driver
- `artifacts/integratewise/vite.config.ts` — merged Replit + apps/web config (SWC, tailwind, aliases, `$PORT`, `BASE_PATH`)
- `lib/integratewise-types` — vendored `@integratewise/types`

## Architecture decisions

- **Adopt apps/web wholesale, minimize divergence** — this frontend transplants back into `integratewise-live`; keep changes additive and gated so the diff stays small. The gateway-client is the only intentional seam.
- **Auth is custom RS256 JWT only** — Clerk is retired. In dev, `local-mock` mints an unsigned decode-only tenant-zero token that never touches a real gateway.
- **No direct DB / no Supabase from the frontend** — all real data flows through the platform gateway (`/api/v1/*`).
- **Twin is grounded + drafts-only** — AI reads the real record server-side and returns suggestions; the human runs every action.
- **Keep-but-stop-using the legacy relay + lib packages** — `artifacts/api-server` and `lib/{db,api-spec,api-client-react,api-zod}` are intentionally retained but NO LONGER the path; do not deepen them. New data access goes through the gateway-client.

## Product

The IntegrateWise operating surface: onboarding/activation, the L1 workspace shell, CRM/pipeline, departments/workbench, knowledge, metrics, governance, and admin — served from the adopted `apps/web` UI.

## User preferences

- Two-repo separation must be respected: `integratewise-live` owns truth, this repo is the consuming frontend
- Backend is Cloudflare — no Supabase, no PostgreSQL on the platform side
- Auth is custom RS256 JWT (Clerk retired); operating identity is tenant-zero `iw-customer-zero`
- Build for transplant: minimize divergence from `apps/web`; gateway-client is the single swappable seam

## Gotchas

- `VITE_SPINE_PROVIDER` is the master boot switch; flipping to `gateway-proxy` requires `VITE_API_BASE_URL` too
- There are TWO auth layers (`contexts/auth-context.tsx` gate + `core/auth/auth-provider.tsx` `useAuth`); offline neutralization must live inside `auth-manager`, not the providers (the AppShell provisioning loop calls `refreshToken()` directly)
- The mock JWT uses a ~1-year `exp`; the proactive-refresh `setTimeout` must no-op in local-mock or it overflows the 32-bit delay and fires immediately (→ network call)
- Vite dev server must use `PORT` env var (not hardcoded) to avoid port collisions after deployment
- `pnpm --filter` commands must be run from workspace root
- Full `tsc -b` is deferred (large in-progress codebase); `_deprecated` + known-broken files stay tsconfig-excluded until the Phase B gate
