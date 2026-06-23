# iwa-customer-zero

IntegrateWise's internal operations command center — the CRM, pipeline, tasks, metrics, knowledge, and admin surface that the IntegrateWise team runs the business from.

## Three-Repo Architecture

| Repo | Role |
|------|------|
| `integratewise-live` | **Platform** — identity (Clerk), tenancy, schema AI, Spine, memory, governance, connectors, execution. Runs on **Cloudflare** (Workers + D1/KV). Owns truth. |
| `iwa-frontend` | **Customer Product** — what paying customers log into |
| `iwa-customer-zero` | **Internal Operations (this repo)** — IntegrateWise's own operating surface; a privileged platform client |

Customer Zero is a platform client. It does not own auth, tenants, schema, or data. It calls `integratewise-live` APIs. No Supabase — the platform backend is entirely Cloudflare.

## Run & Operate

- `pnpm --filter @workspace/integratewise run dev` — run the Customer Zero UI (Vite, port from $PORT)
- `pnpm --filter @workspace/api-server run dev` — run the API relay (Express + Drizzle over local Postgres, port 8080)
- `pnpm --filter @workspace/db run push` — push the Drizzle schema to local Postgres
- `pnpm --filter @workspace/api-spec run codegen` — regenerate types/hooks from `openapi.yaml` after editing the contract
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + wouter (routing)
- API relay: Express 5 + Drizzle ORM over a local Postgres — a governed, owned relay (swappable to `integratewise-live` later)
- Contract-first: `lib/api-spec/openapi.yaml` → codegen → React Query hooks in `@workspace/api-client-react`

## Where things live

- `artifacts/integratewise/src/App.tsx` — wouter router, all 30 routes
- `artifacts/integratewise/src/index.css` — Tailwind v4 theme (oklch color tokens, Inter font)
- `artifacts/integratewise/src/lib/supabase/client.ts` — **temporary stub** (chainable no-op) until Cloudflare API calls are wired
- `artifacts/integratewise/src/components/views/` — 25 page-level view components (leads-view + lead-detail-view are live on the relay; the other 23 still use the Supabase stub)
- `artifacts/integratewise/src/pages/leads/` — Leads list + `/leads/:id` detail (the executable CRM vertical slice)
- `artifacts/api-server/src/{repositories,services,routes}/` — Drizzle repos, leads-service (qualify/convert in a txn), thin zod-validated routes (leads, clients, deals, ai)
- `lib/db/src/schema/` — Drizzle schema (8 core tables); `lib/api-spec/openapi.yaml` — contract; `lib/api-client-react` — generated hooks

## Architecture decisions

- **Demo mode always on** — `isMockAuthEnabled()` always returns true; no real auth needed for dev
- **Supabase stub is intentional tech debt** — views imported from the Vercel version called Supabase directly; they will be replaced with `fetch('/api/...')` calls to `integratewise-live` Cloudflare Workers
- **No direct DB access from Customer Zero** — Customer Zero calls the api-server relay over `/api`, never a database directly
- **Local Postgres relay is the dev backend** — an owned, governed Express+Drizzle relay reconciles with the "own your data" manifesto and is swappable to `integratewise-live` later; it is NOT Supabase
- **Twin is grounded + drafts-only** — `/api/ai/chat` reads the real record server-side and returns suggestions only; it never mutates. The human runs every action
- **Real leads come from Apollo** — the Leads workspace is seeded from the user's saved Apollo contacts (no synthetic seed); clients/deals/activities fill in as leads are qualified/converted/logged
- **wouter over React Router** — lighter, no loader/action complexity, sufficient for this SPA
- **Tailwind v4 + @tailwindcss/vite** — no postcss.config needed; CSS-first config in index.css

## Product

30-page internal ops dashboard: Home (health score, MRR, pipeline, tasks), CRM (Leads, Pipeline, Deals, Clients, Sessions), Marketing (Campaigns, Content), Products, Services, Projects, Tasks, Knowledge base, Brainstorming, Strategy, Metrics, Architecture, Data Flow, Data Sources, Website Manager, Integrations, Settings.

## User preferences

- Three-repo separation must be respected: integratewise-live owns truth, Customer Zero consumes APIs
- Backend is Cloudflare — no Supabase, no PostgreSQL on the platform side
- Customer Zero is the internal ops surface, not a customer-facing product

## Gotchas

- Supabase imports in the other 23 views are migration artifacts — do not deepen this pattern; replace with generated `@workspace/api-client-react` hooks (as leads-view now does)
- After editing `openapi.yaml` you MUST run codegen, or the UI hooks/types drift from the server
- Vite dev server must use `PORT` env var (not hardcoded) to avoid port collisions after deployment
- `pnpm --filter` commands must be run from workspace root
