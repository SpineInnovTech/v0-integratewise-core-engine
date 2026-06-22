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
- `pnpm --filter @workspace/api-server run dev` — run the local API relay (Express, port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + wouter (routing)
- Local relay: Express 5 (thin proxy to `integratewise-live` when ready)
- No local database — data lives in Cloudflare D1/KV inside `integratewise-live`

## Where things live

- `artifacts/integratewise/src/App.tsx` — wouter router, all 30 routes
- `artifacts/integratewise/src/index.css` — Tailwind v4 theme (oklch color tokens, Inter font)
- `artifacts/integratewise/src/lib/supabase/client.ts` — **temporary stub** (chainable no-op) until Cloudflare API calls are wired
- `artifacts/integratewise/src/components/views/` — 25 page-level view components
- `artifacts/api-server/src/` — Express relay, currently stub routes only

## Architecture decisions

- **Demo mode always on** — `isMockAuthEnabled()` always returns true; no real auth needed for dev
- **Supabase stub is intentional tech debt** — views imported from the Vercel version called Supabase directly; they will be replaced with `fetch('/api/...')` calls to `integratewise-live` Cloudflare Workers
- **No direct DB access from Customer Zero** — Customer Zero calls platform APIs, never a database
- **wouter over React Router** — lighter, no loader/action complexity, sufficient for this SPA
- **Tailwind v4 + @tailwindcss/vite** — no postcss.config needed; CSS-first config in index.css

## Product

30-page internal ops dashboard: Home (health score, MRR, pipeline, tasks), CRM (Leads, Pipeline, Deals, Clients, Sessions), Marketing (Campaigns, Content), Products, Services, Projects, Tasks, Knowledge base, Brainstorming, Strategy, Metrics, Architecture, Data Flow, Data Sources, Website Manager, Integrations, Settings.

## User preferences

- Three-repo separation must be respected: integratewise-live owns truth, Customer Zero consumes APIs
- Backend is Cloudflare — no Supabase, no PostgreSQL on the platform side
- Customer Zero is the internal ops surface, not a customer-facing product

## Gotchas

- Supabase imports in views are migration artifacts — do not deepen this pattern; replace with API calls
- Vite dev server must use `PORT` env var (not hardcoded) to avoid port collisions after deployment
- `pnpm --filter` commands must be run from workspace root
