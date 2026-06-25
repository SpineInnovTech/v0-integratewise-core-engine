# IntegrateWise — Frontend Layer Map

> **Version:** 2.0 | **Date:** June 9, 2026 | **Status:** FINAL
> **Repo:** integratewise-live/apps/web/
> **Design:** Forest + Paper tokens (--iw-forest, --iw-paper, --iw-gold)
> **Data Layer:** CF Gateway (`gateway.dev.integratewise.ai`) — zero Supabase frontend dependency
> **Auth:** OAuth 2.0 via `auth.integratewise.ai` (RS256 JWT, 1hr access, 30d refresh)
> **Provider:** `VITE_SPINE_PROVIDER=gateway-proxy` (live), `local-mock` (dev), `spine-db` (legacy)

---

## Frontend Infrastructure (CF Gateway Wiring — Complete June 9, 2026)

All data flows through CF Workers. Zero direct Supabase from the browser.

### Core Modules

| Module              | Path                                 | Purpose                                                    |
| ------------------- | ------------------------------------ | ---------------------------------------------------------- |
| AuthManager         | `src/lib/auth-manager.ts`            | OAuth 2.0 token lifecycle (PKCE, refresh, coalescing)      |
| GatewayHttpClient   | `src/lib/gateway-client.ts`          | HTTP client (retry, 401/429/5xx, offline queue)            |
| SpineGatewayAdapter | `src/utils/spine/gateway-adapter.ts` | Drop-in `spineClient` replacement via Gateway              |
| SSE Client          | `src/lib/sse-client.ts`              | Real-time signals (exponential backoff + polling fallback) |
| Query Client        | `src/lib/query-client.ts`            | TanStack Query singleton (30s stale, 5m GC)                |
| Onboarding Machine  | `src/lib/onboarding.ts`              | 4-step state machine (localStorage persistence)            |
| Onboarding API      | `src/lib/onboarding-api.ts`          | Step 1–4 API calls + retry + resume                        |

### React Hooks

| Hook                              | Path                             | Purpose                                |
| --------------------------------- | -------------------------------- | -------------------------------------- |
| `useAuth()`                       | `src/hooks/use-auth.ts`          | user, isAuthenticated, signIn, signOut |
| `useHydration()`                  | `src/hooks/use-hydration.ts`     | Morning-context + delta invalidation   |
| `useSyncProgress(provider)`       | `src/hooks/use-sync-progress.ts` | Creamy Layer polling (2s)              |
| `usePublicFlags/Pricing/Status()` | `src/hooks/use-public-data.ts`   | No-auth landing page data              |
| `useSSE()`                        | `src/hooks/use-sse.ts`           | Real-time signal subscription          |
| `useGatewayQuery()`               | `src/hooks/use-gateway-query.ts` | TanStack + Gateway convenience         |

### Contexts

| Context         | Path                               | Purpose                                   |
| --------------- | ---------------------------------- | ----------------------------------------- |
| AuthProvider    | `src/contexts/auth-context.tsx`    | Auth state for all components             |
| NetworkProvider | `src/contexts/network-context.tsx` | Offline detection + write failure surface |

### Build Enforcement

| Mechanism   | Path                                        | Purpose                                         |
| ----------- | ------------------------------------------- | ----------------------------------------------- |
| Vite Plugin | `vite-plugins/no-supabase-gateway-proxy.ts` | Fails build if Supabase in gateway-proxy bundle |
| CI Script   | `scripts/check-no-supabase.ts`              | Post-build scan of dist/assets/\*.js            |

### Auth Flow

```
User → auth.integratewise.ai/oauth/authorize (PKCE + state)
     → OAuth consent
     → /auth/callback?code=...&state=...
     → AuthManager.handleCallback() → token pair
     → Access token in memory, refresh in localStorage (iw_rt_{userId})
     → Proactive refresh at exp - 5min
     → On 401: single coalesced refresh → replay queued requests
```

### Data Flow (Authenticated)

```
Component → spineClient.from("table").select().eq() → SpineGatewayAdapter
         → QueryBuilder collects filters → .then() resolves
         → GatewayHttpClient.get(path, params)
         → Authorization: Bearer {token}, x-tenant-id: {tenant}
         → CF Gateway validates → D1/KV → response
         → { data, error } (Supabase-compatible shape)
```

---

## L0 — ONBOARDING

**Purpose:** Entry → Setup → First value in <2 minutes
**Route prefix:** `/onboarding`
**Code:** `apps/web/src/components/activation/onboarding/`

| Screen     | Component          | Route                | Data Source                   | Time |
| ---------- | ------------------ | -------------------- | ----------------------------- | ---- |
| Login      | CF Access          | `/` (intercepted)    | CF Zero Trust (Google/GitHub) | 0s   |
| Welcome    | WelcomeStep.tsx    | `/onboarding` step 1 | None (static)                 | ~15s |
| Profile    | ProfileStep.tsx    | `/onboarding` step 2 | None (user input)             | ~30s |
| Goals      | GoalsStep.tsx      | `/onboarding` step 3 | None → Spine Selector runs    | ~25s |
| Connectors | ConnectorsStep.tsx | `/onboarding` step 4 | GET /api/v1/connector/list    | ~45s |
| Loading    | AILoader.tsx       | (transition)         | Creamy sync running           | ~10s |

**After L0:** User lands in L1. Never returns unless adding a new tool.

**Backend calls:**

- `POST /api/v1/onboarding/initialize` → creates tenant_spine_config
- `POST /api/v1/onboarding/connect` → creates Nango session
- `GET /api/v1/connector/list` → catalog (domain-ranked)

---

## L1 — USER WORKBENCH

**Purpose:** Where you WORK. Personal + one domain. Daily use.
**Route prefix:** `/personal/*` and `/work/*`
**Code:** `apps/web/src/components/l1/`
**Shell:** `workspace-shell-new.tsx` (Personal/Work toggle)
**Config:** `workspace-config.ts` (drives sidebar per domain)

### Personal View (`/personal/*`)

| View          | Component                 | Route                   | Data Source                             |
| ------------- | ------------------------- | ----------------------- | --------------------------------------- |
| Dashboard     | dashboard.tsx             | /personal/dashboard     | GET /api/v1/projections/morning-context |
| Today         | hub-today-view.tsx        | /personal/hub-today     | GET /api/v1/workspace/space/today       |
| Tasks         | (shared)                  | /personal/tasks         | GET /api/v1/workspace/view/tasks        |
| Calendar      | (shared)                  | /personal/calendar      | GET /api/v1/workspace/view/calendar     |
| Notes         | (shared)                  | /personal/notes         | GET /api/v1/workspace/view/notes        |
| Projects      | founder-projects-view.tsx | /personal/projects      | GET /api/v1/workspace/view/projects     |
| Knowledge Hub | knowledge-hub-view.tsx    | /personal/knowledge-hub | GET /api/v1/knowledge/memories          |
| Bookmarks     | bookmarks-view.tsx        | /personal/bookmarks     | GET /api/v1/workspace/view/bookmarks    |
| What's New    | whats-new-view.tsx        | /personal/whats-new     | GET /api/v1/workspace/view/whats-new    |
| AI Chat       | (link to L3)              | /personal/ai-chat       | Opens Twin handoff                      |

### Work View (`/work/*`) — ONE domain per user

**Resolved by:** `tenant_users.department` → `workspace-config.ts`

#### Customer Success (43 views)

| View                 | Route                      | Data Source                                               |
| -------------------- | -------------------------- | --------------------------------------------------------- |
| Dashboard            | /work/dashboard            | GET /api/v1/workspace/dashboard?domain=CUSTOMER_SUCCESS   |
| Accounts             | /work/accounts             | GET /api/v1/pipeline/entities?type=account                |
| Today                | /work/cs-today             | GET /api/v1/projections/morning-context                   |
| Tasks                | /work/tasks                | GET /api/v1/workspace/view/tasks                          |
| Meetings             | /work/meetings             | GET /api/v1/workspace/view/meetings                       |
| Renewals             | /work/renewals             | GET /api/v1/pipeline/entities?type=renewal                |
| Risk Matrix          | /work/risk-matrix          | GET /api/v1/intelligence/signals?type=risk                |
| At-Risk              | /work/at-risk              | GET /api/v1/intelligence/signals?severity=critical        |
| Health Scores        | /work/account-health       | GET /api/v1/pipeline/entities?type=account                |
| API Portfolio        | /work/api-portfolio        | GET /api/v1/pipeline/entities?type=api_portfolio          |
| Platform Health      | /work/platform-health      | GET /api/v1/pipeline/entities?type=platform_health_metric |
| Success Plans        | /work/success-plans        | GET /api/v1/pipeline/entities?type=success_plan           |
| Engagement Log       | /work/engagement-log       | GET /api/v1/pipeline/entities?type=engagement             |
| Initiatives          | /work/initiatives          | GET /api/v1/pipeline/entities?type=initiative             |
| Strategic Objectives | /work/strategic-objectives | GET /api/v1/pipeline/entities?type=strategic_objective    |
| Risk Register        | /work/risk-register        | GET /api/v1/pipeline/entities?type=risk_register          |
| Value Streams        | /work/value-streams        | GET /api/v1/pipeline/entities?type=value_stream           |
| Capabilities         | /work/capabilities         | GET /api/v1/pipeline/entities?type=capability             |
| People & Team        | /work/people-team          | GET /api/v1/pipeline/entities?type=people_team            |
| Stakeholder Outcomes | /work/stakeholder-outcomes | GET /api/v1/pipeline/entities?type=stakeholder_outcome    |
| Insights             | /work/insights             | GET /api/v1/intelligence/signals                          |
| Documents            | /work/documents            | GET /api/v1/knowledge/documents                           |
| Contacts             | /work/contacts             | GET /api/v1/pipeline/entities?type=contact                |
| Kanban               | /work/kanban               | GET /api/v1/workspace/view/kanban                         |

#### BizOps / Founder (29 views)

| View              | Route               | Data Source                                      |
| ----------------- | ------------------- | ------------------------------------------------ |
| Dashboard         | /work/dashboard     | GET /api/v1/workspace/dashboard?domain=BIZOPS    |
| Founder Ops       | /work/founder-ops   | GET /api/v1/workspace/bi/founder                 |
| CEO View          | /work/ceo           | GET /api/v1/workspace/bi/executive               |
| COO View          | /work/coo           | GET /api/v1/workspace/bi/department/operations   |
| CIO/CTO View      | /work/cio-cto       | GET /api/v1/workspace/bi/department/engineering  |
| Strategic Hub     | /work/strategic-hub | GET /api/v1/workspace/bi/department/strategy     |
| Operations Center | /work/operations    | GET /api/v1/workspace/bi/department/ops          |
| BI View           | /work/bi            | GET /api/v1/workspace/bi/executive               |
| Knowledge Mgmt    | /work/knowledge     | GET /api/v1/knowledge/documents                  |
| HR View           | /work/hr            | GET /api/v1/workspace/bi/department/hr           |
| Legal View        | /work/legal         | GET /api/v1/workspace/bi/department/legal        |
| Partnerships      | /work/partnerships  | GET /api/v1/workspace/bi/department/partnerships |
| Sales Hub         | /work/sales         | GET /api/v1/workspace/bi/department/sales        |
| Marketing         | /work/marketing     | GET /api/v1/workspace/bi/department/marketing    |
| Clients           | /work/clients       | GET /api/v1/pipeline/entities?type=account       |
| Tasks             | /work/tasks         | GET /api/v1/workspace/view/tasks                 |
| Workflows         | /work/workflows     | GET /api/v1/pipeline/entities?type=workflow      |
| Analytics         | /work/analytics     | GET /api/v1/workspace/bi/signals                 |
| Today             | /work/bizops-today  | GET /api/v1/projections/morning-context          |

#### Sales (routes)

| View            | Route                 | Data Source                                       |
| --------------- | --------------------- | ------------------------------------------------- |
| Dashboard       | /work/dashboard       | GET /api/v1/workspace/dashboard?domain=SALES      |
| Pipeline        | /work/pipeline        | GET /api/v1/pipeline/entities?type=opportunity    |
| Pipeline Kanban | /work/pipeline-kanban | GET /api/v1/workspace/view/pipeline-kanban        |
| Deals           | /work/deals           | GET /api/v1/pipeline/entities?type=opportunity    |
| Contacts        | /work/contacts        | GET /api/v1/pipeline/entities?type=contact        |
| Activities      | /work/activities      | GET /api/v1/pipeline/entities?type=activity       |
| Forecasting     | /work/forecasting     | GET /api/v1/pipeline/entities?type=forecast       |
| Quotes          | /work/quotes          | GET /api/v1/pipeline/entities?type=quote          |
| Sequences       | /work/sequences       | GET /api/v1/pipeline/entities?type=email_sequence |
| Analytics       | /work/sales-analytics | GET /api/v1/workspace/bi/department/sales         |

#### Other Domains (same pattern)

All domains follow: `GET /api/v1/pipeline/entities?type={entity_type}` for entity views, `GET /api/v1/workspace/dashboard?domain={DOMAIN}` for dashboards.

### Shared Routes (all users)

| View       | Route          | Data Source                             |
| ---------- | -------------- | --------------------------------------- |
| Entity 360 | /entity360/:id | GET /api/v1/projections/entity360/:id   |
| Connectors | /connectors    | GET /api/v1/connector/list              |
| Bridge     | /bridge        | GET /api/v1/projections/morning-context |
| Settings   | /settings      | GET /api/v1/auth/me                     |

---

## L2 — OVERLAY (Awareness Drawer)

**Purpose:** Twin's passive presence. Interrupts only when warranted.
**Code:** `apps/web/src/components/l2/cognitive/`
**Trigger:** `cognitive-triggers.tsx` (evaluates awareness profile)

| Component              | Purpose                      | Data Source                               |
| ---------------------- | ---------------------------- | ----------------------------------------- |
| l2-drawer-animated.tsx | Drawer shell (bottom-to-top) | N/A (layout)                              |
| cognitive-triggers.tsx | Evaluates signals vs profile | GET /api/v1/intelligence/signals          |
| SpinePanel             | Entity operational context   | GET /api/v1/projections/entity360/:id     |
| ContextPanel           | Entity relationship context  | Same as above                             |
| live-signals-strip.tsx | Signal indicator bar         | GET /api/v1/intelligence/signals          |
| ai-insight-popup.tsx   | Critical popup               | POST from Twin via continuity-tool-server |
| [Open Twin ↗] button   | Handoff to L3                | twin-owui-handoff.ts                      |

**Awareness Profile (drives what appears):**

```json
{
  "signal_entitlements": ["health_drop", "renewal_approaching"],
  "panel_entitlements": ["spine", "context"],
  "threshold": 0.75,
  "department": "customer_success",
  "role": "manager"
}
```

---

## L3 — OWUI (Twin Full Surface)

**Purpose:** Where you THINK. Full reasoning. Voice. Agent execution.re
**URL:** `twin.integratewise.ai` (Hostinger)
**Code:** `integratewise-ops/vps-operations-stack/openwebui/`
**Embed:** `apps/web/src/components/l1/twin/twin-workbench.tsx` (iframe)

| Component              | Purpose                         | Technology                             |
| ---------------------- | ------------------------------- | -------------------------------------- |
| Open WebUI             | Chat surface, model switching   | ghcr.io/open-webui/open-webui:ollama   |
| Agent Zero             | Reasoning, tool use, delegation | frdel/agent-zero:latest                |
| x.ai Audio Proxy       | Voice (TTS + STT)               | Custom proxy → x.ai API                |
| Continuity Tool Server | Spine reads/writes              | Custom → pipeline.dev.integratewise.ai |
| Agent Zero Tool Server | A0 integration                  | Custom bridge                          |
| iw-l1-handoff-inlet.py | Reads L1→L3 context             | OWUI filter                            |

**MCP Connection:**

- URL: `https://mcp.integratewise.ai/invoke`
- Auth: `Bearer iw-mcp-spine-key-2026`
- Tools: 18 (memory._, spine._, book._, kb._)

**Voice:**

- TTS: x.ai via xai-audio-proxy (voice: "eve")
- STT: x.ai via xai-audio-proxy (Whisper)
- Model: Grok-4.3 (default, swappable)

---

## L4 — MEMORY (Knowledge Projection)

**Purpose:** Where you KNOW. The library. Governed knowledge.
**Surface:** Coda (external tool, projection)
**Sync:** `packages/coda-pack/sync-org-memory.ts`
**Data:** D1 org_memory → MCP → Coda tables

| Structure            | Content                                                                                                        | Source                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Departments (14)     | Strategy, Product, Marketing, Sales, CS, Ops, Finance, HR, Data, Legal, Security, Partnerships, Innovation, AI | org_memory.related_departments               |
| Functional Quadrants | Think / Decide / Work / Learn                                                                                  | org_memory.category → mapped                 |
| Node Fields          | ID, Title, Category, Function, Department, Content, Confidence, State, Date, Entity Refs                       | org_memory columns                           |
| Graph Relations      | depends_on, influences, leads_to                                                                               | org_memory.entity_refs (resolved from Spine) |

**No archive.** Everything active or superseded (with lineage).

---

## API Contract Summary

All frontend calls go through `gateway.dev.integratewise.ai`:

### Auth Endpoints (auth.integratewise.ai)

| Pattern                | Purpose                       | Used By                                      |
| ---------------------- | ----------------------------- | -------------------------------------------- |
| `GET /oauth/authorize` | Initiate OAuth (PKCE + state) | AuthManager.signIn()                         |
| `POST /oauth/token`    | Exchange code / refresh       | AuthManager.handleCallback(), refreshToken() |
| `POST /oauth/revoke`   | Revoke refresh token          | AuthManager.signOut()                        |

### Public Endpoints (no auth required)

| Pattern                      | Purpose       | Used By            |
| ---------------------------- | ------------- | ------------------ |
| `GET /api/v1/public/flags`   | Feature flags | usePublicFlags()   |
| `GET /api/v1/public/pricing` | Pricing data  | usePublicPricing() |
| `GET /api/v1/public/status`  | System status | usePublicStatus()  |

### Authenticated Endpoints

| Pattern                                      | Purpose            | Used By                     |
| -------------------------------------------- | ------------------ | --------------------------- |
| `GET /api/v1/projections/morning-context`    | Morning briefing   | useHydration(), L1 /desk    |
| `GET /api/v1/projections/entity360/:id`      | Full entity view   | L1 Entity 360, L2 panels    |
| `GET /api/v1/projections/governance/board`   | Tasks + proposals  | L1 governance views         |
| `GET /api/v1/projections/inbox`              | Unified queue      | L1 /inbox                   |
| `GET /api/v1/pipeline/entities?type=X`       | Entity queries     | L1 all domain views         |
| `GET /api/v1/pipeline/status?connector=X`    | Creamy Layer sync  | useSyncProgress()           |
| `GET /api/v1/pipeline/delta-status`          | Delta check        | useHydration() background   |
| `GET /api/v1/intelligence/signals`           | Active signals     | L2 triggers, L1 today views |
| `GET /api/v1/connector/list`                 | Connector catalog  | L0 + L1 /connectors         |
| `GET /api/v1/connectors/:provider/authorize` | OAuth redirect URL | Onboarding Step 3           |
| `GET /api/v1/connectors/:provider/callback`  | OAuth callback     | Onboarding Step 3           |
| `GET /api/v1/knowledge/memories`             | Org memory browse  | L1 knowledge views          |
| `POST /api/v1/workspace/initialize`          | Create workspace   | Onboarding Step 1           |
| `POST /api/v1/workspace/configure-domain`    | Domain config      | Onboarding Step 2           |
| `POST /api/v1/workspace/configure-rbac`      | RBAC config        | Onboarding Step 2           |
| `POST /api/v1/workspace/activate`            | Finalize setup     | Onboarding Step 4           |
| `GET /api/v1/workspace/dashboard?domain=X`   | Domain dashboard   | L1 work dashboards          |
| `GET /api/v1/workspace/bi/department/:dept`  | Department data    | L1 BizOps views             |
| `GET /api/v1/auth/me`                        | Session validation | All layers                  |

### Real-Time Endpoints

| Pattern                         | Purpose             | Used By                              |
| ------------------------------- | ------------------- | ------------------------------------ |
| `GET /stream/signals`           | SSE signal delivery | sseClient / useSSE()                 |
| `GET /stream/pipeline-progress` | SSE sync progress   | useSyncProgress() (optional upgrade) |

---

_One app. Five layers. Personal + Work. Same Spine. Same gateway. Same memory._
_Auth: OAuth 2.0 (RS256). Data: CF Gateway → D1/KV. Real-time: SSE. Zero Supabase frontend._
