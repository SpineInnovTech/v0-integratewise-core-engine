# IntegrateWise Customer Zero

Internal operations workspace for IntegrateWise. This repository is the surface the team uses to run the business: CRM, pipeline, delivery, knowledge, metrics, and a governed AI layer.

Customer Zero is a client of the IntegrateWise platform (`integratewise-live`). Identity, tenancy, and canonical Spine truth live on that platform (Cloudflare Workers, D1, KV). This repo owns the operating UI and the local API relay used in development.

| Repo | Role |
| --- | --- |
| `integratewise-live` | Platform. Identity, tenancy, schema, Spine, memory, connectors, execution. |
| `iwa-frontend` | Customer product. |
| `v0-integratewise-core-engine` (this repo) | Internal operations. Privileged platform client. |

## Three-space workspace

The shell in `artifacts/integratewise/src/components/workspace/workspace-shell.tsx` stays mounted across navigation and divides the screen into three spaces:

| Space | How it opens | What it is |
| --- | --- | --- |
| Human Workbench | Work mode | Sidebar plus the routed module. This is where people do the work. |
| AI Home | AI mode | Replaces the center pane with the AI watch list, agenda, and memory. |
| AI Overlay | Overlay toggle | Right-hand panel on desktop, bottom sheet on small screens. Thread plus pending clarifications, approvals, and reports. It sits beside the work area. |

The top bar switches Work / AI and opens the overlay. Auth routes under `/auth/*` render outside the shell. The app opens straight into the workspace.

## Repository map

The root pnpm workspace (`pnpm-workspace.yaml`) contains the packages below.

| Path | Package | Role |
| --- | --- | --- |
| `artifacts/integratewise` | `@workspace/integratewise` | React 19 + Vite 7 + Tailwind CSS 4 + wouter SPA. |
| `artifacts/api-server` | `@workspace/api-server` | Express 5 relay. Drizzle over local Postgres. Mounted at `/api`. |
| `artifacts/mockup-sandbox` | `@workspace/mockup-sandbox` | UI mockup preview. |
| `artifacts/review` | `@workspace/review` | Review artifact. |
| `lib/db` | `@workspace/db` | Drizzle schema. `drizzle-kit push`. |
| `lib/api-spec` | `@workspace/api-spec` | `openapi.yaml` and Orval codegen. |
| `lib/api-zod` | `@workspace/api-zod` | Generated Zod types. |
| `lib/api-client-react` | `@workspace/api-client-react` | Generated React Query hooks. |
| `lib/spine-schema` | `@workspace/spine-schema` | Vendored canonical Spine schema plus the Customer Zero industry adapter. |
| `scripts` | `@workspace/scripts` | Workspace scripts, including `seed:context`. |

`lib/spine-schema/src/canonical-schema.ts` is vendored from the platform. Re-sync that file from upstream to pick up schema changes. The adapter in `src/index.ts` maps Customer Zero industry codes onto the canonical keys.

These trees are checked in for reference and sit outside the root workspace:

- `iw-live/` — snapshot of the platform monorepo. See `iw-live/README.md`.
- `FRONTEND/` — Figma-exported UI bundle.
- `temp_apps_web/` — temporary copy of web app sources.
- `.migration-backup/` — migration snapshot.

`replit.md` is the Replit agent brief. This README is the entry point for the repository.

## Run

Requires pnpm and Node.js 24. The UI and the API both require `PORT`. The UI also requires `BASE_PATH`. Schema push requires `DATABASE_URL` (local Postgres; Replit provisions PostgreSQL 16).

```bash
pnpm install

# Push the Drizzle schema. Needs DATABASE_URL.
pnpm --filter @workspace/db run push

# API relay. Replit exposes this on port 8080.
PORT=8080 pnpm --filter @workspace/api-server run dev

# Customer Zero UI.
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/integratewise run dev
```

From the repository root:

```bash
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/scripts run seed:context
```

Run codegen after every edit to `lib/api-spec/openapi.yaml`. Run `pnpm --filter` commands from the repository root. The Vite dev server reads `PORT` from the environment so it can follow the assigned port.

## Adaptive workspace

`deriveWorkspace({ role, industry, schema })` in `artifacts/integratewise/src/spine/` decides which modules, role home, and industry topics render.

- **Role.** Ten `CTX_*` contexts: customer success, sales, support, project management, marketing, bizops, tech, HR, finance, legal.
- **Industry.** SaaS, financial services, healthcare, ecommerce, manufacturing, professional services, agency, education, real estate, logistics, nonprofit, media.
- **Schema.** Each group is `live`, `seeded`, or `off`. `ModuleHost` is the single gate. `off` renders an empty state. `seeded` renders the view with sample data.

Adding a module is a registry change under `artifacts/integratewise/src/spine/` plus a route in `artifacts/integratewise/src/App.tsx`.

Home opens on the command center. The registry also covers cockpit, today, IQ hub, contextual memory, email, leads, pipeline, deals, sales, campaigns, content, clients, sessions, projects, tasks, products, services, knowledge, metrics, strategy, brainstorming, architecture, data flow, data sources, website, integrations, admin, settings, governance, customer-success accounts / contacts / meetings, release control, insights, loader, profile, and spend insights. Detail routes exist for leads (`/leads/:id`), clients (`/clients/:id`), customer-success accounts, and knowledge categories. `/twin` renders the Twin page directly.

## API relay

Browser code talks to the relay over `/api`. It does not open a database. Local Postgres is the development store. The relay is the owned backend for this workspace and can later point at `integratewise-live`.

| Area | Routes |
| --- | --- |
| Health | `GET /api/healthz` |
| Leads | list, create, get, patch, qualify, convert, activities, intelligence |
| Clients and deals | `GET /api/clients`, `GET /api/deals` |
| AI | `POST /api/ai/chat` — grounded suggestions; a person runs every action |
| Email | inbox, search, labels, message, thread, send (Google Mail connector) |
| Connectors | `GET /api/connectors` |
| Spine | `GET /api/spine/status`, `GET /api/spine/tools`, `POST /api/spine/call` |
| Schema | base, config, deltas, Gmail delta generation |
| Ingest | `POST /api/ingest/gmail` |
| Context | packet, remember, goals, metrics, coverage |

Drizzle tables: `clients`, `contacts`, `leads`, `deals`, `activities`, `tasks`, `projects`, `sessions`, `schema_pool`, `schema_delta_events`, `spine_proposals`, `memory_atoms`, `spine_goals`, `spine_metrics`.

`memory_atoms` is the local contextual-memory projection. Goals and metrics anchor that memory. The platform Spine remains the system of record; `spine_proposals` is Customer Zero's local record of what it has proposed.

## Development notes

- Demo auth is always on (`isMockAuthEnabled()` in `artifacts/integratewise/src/lib/mock-auth.ts`), so local development opens the workspace without a login.
- Views that still import the Supabase client are using the stub in `artifacts/integratewise/src/lib/supabase/client.ts`. New data access goes through `@workspace/api-client-react`.
- Leads are the live vertical slice on the relay. Qualify and convert run in a transaction inside `artifacts/api-server/src/services/leads-service.ts`.
- Real leads are seeded from saved Apollo contacts. Clients, deals, and activities fill in as leads are qualified, converted, and logged.

## Stack

pnpm workspaces, Node.js 24, TypeScript 5.9, React 19, Vite 7, Tailwind CSS 4, wouter, TanStack Query, Express 5, Drizzle ORM, Zod, Orval.
