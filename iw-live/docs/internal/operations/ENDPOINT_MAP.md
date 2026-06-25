# IntegrateWise — Approved Endpoint Map

> **Authority:** Nirmal (Founder)
> **Last updated:** 2026-05-29
> **Status:** LOCKED — this is the canonical DNS and routing source of truth.
>
> Rule: Only expose routes that map to **product meaning**, **customer access**,
> or **documented external integration surfaces**. Everything else stays private
> behind gateway, loader, MCP, and governed Cloudflare ingress.

---

## Production — Public

| Domain                        | Worker                             | Role                                             | Auth                         |
| ----------------------------- | ---------------------------------- | ------------------------------------------------ | ---------------------------- |
| `integratewise.ai`            | marketing/site worker              | Main website, canonical public brand surface     | Public                       |
| `www.integratewise.ai`        | redirect → apex                    | Canonical web alias                              | Public                       |
| `app.integratewise.ai`        | CF Pages — `integratewise` project | Frontend workspace app                           | Public, Spine DB auth        |
| `admin.integratewise.ai`      | `integratewise-admin`              | Admin console                                    | Public, authenticated        |
| `gateway.integratewise.ai`    | `integratewise-gateway`            | Primary external ingress / API gateway           | Public                       |
| `mcp.integratewise.ai`        | `integratewise-mcp-connector`      | MCP connector surface                            | Public                       |
| `think.integratewise.ai`      | `integratewise-think`              | AI reasoning / proposal surface                  | Public, partner-controlled   |
| `knowledge.integratewise.ai`  | `integratewise-knowledge`          | Knowledge / query surface                        | Public or authenticated      |
| `hooks.integratewise.ai`      | `integratewise-loader`             | Webhooks / inbound ingestion entrypoint          | Public, machine ingress only |
| `files.integratewise.ai`      | `integratewise-store`              | File / object access layer                       | Public or signed-access      |
| `spine.integratewise.ai`      | `integratewise-spine`              | Spine runtime surface (if intentionally exposed) | Public, tightly controlled   |
| `continuity.integratewise.ai` | `integratewise-continuity`         | Continuity product / API surface                 | Public, tightly controlled   |

## Production — Optional Controlled

| Domain                          | Worker                 | Role                                           | Auth                                 |
| ------------------------------- | ---------------------- | ---------------------------------------------- | ------------------------------------ |
| `iqhub.integratewise.ai`        | `integratewise-iq-hub` | Intelligence hub (if productized)              | Public if productized; else internal |
| `customerzero.integratewise.ai` | `continurityops`       | Customer zero / dogfooding surface (canonical) | Public, access-controlled            |

> `customer0.integratewise.ai` (`cus0`) — **retire or redirect to `customerzero.integratewise.ai`**.
> Two routes for the same surface is noise. Pick one canonical name.

---

## Staging — Private Only

All staging routes must be:

- Access-controlled (auth required)
- `X-Robots-Tag: noindex` header set
- Not linked from any public surface

| Domain                                | Worker                             | Role                     |
| ------------------------------------- | ---------------------------------- | ------------------------ |
| `staging-admin.integratewise.ai`      | `integratewise-admin-staging`      | Admin staging            |
| `staging-api.integratewise.ai`        | `integratewise-gateway-staging`    | Gateway staging          |
| `staging-hooks.integratewise.ai`      | `integratewise-loader-staging`     | Loader / webhook staging |
| `staging-files.integratewise.ai`      | `integratewise-store-staging`      | File layer staging       |
| `staging-normalizer.integratewise.ai` | `integratewise-normalizer-staging` | Normalizer staging       |

---

## SEO / Public Docs

| Domain                                                      | Purpose                                                        | Status      |
| ----------------------------------------------------------- | -------------------------------------------------------------- | ----------- |
| `docs.integratewise.ai`                                     | Public product docs, architecture explainers, API overviews    | Build out   |
| `platform.integratewise.ai`                                 | Public platform overview / solution architecture / product map | Build out   |
| `spine.integratewise.ai` or `/spine` on main site           | Public Spine doctrine and architecture overview                | Build out   |
| `continuity.integratewise.ai` or `/continuity` on main site | Public continuity concept page                                 | Build out   |
| `/about` on main site                                       | Founder, company, mission entity page                          | Build out   |
| `developers.integratewise.ai`                               | Developer-facing integration docs                              | When mature |

---

## Internal-Only — No Public Domain

These workers must **not** get public custom domains or `workers.dev` routes.
They are implementation details behind gateway, MCP, loader, or other controlled surfaces.

| Worker                                         | Why internal                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `integratewise-bff`                            | Frontend-facing API is gateway. BFF is internal aggregation only. |
| `integratewise-normalizer` (raw routes)        | Pipeline infrastructure, not a public product noun.               |
| `integratewise-pipeline`                       | Spine write path — internal only.                                 |
| `integratewise-connector`                      | OAuth token holder — never public.                                |
| `integratewise-connector-sync`                 | Sync orchestration — internal.                                    |
| `integratewise-govern`                         | HITL / approval queue — internal, reached via gateway.            |
| `integratewise-act`                            | Action execution — internal, reached via gateway.                 |
| `integratewise-intelligence`                   | Schema AI — internal, reached via gateway.                        |
| `integratewise-webhook-ingress`                | Reached via `hooks.integratewise.ai` (loader).                    |
| `integratewise-workflow`                       | Cloudflare Workflows/Queues orchestration — internal (NOT n8n).   |
| `integratewise-billing`                        | Stripe/Razorpay — internal, reached via gateway.                  |
| `integratewise-tenants`                        | Tenant management — internal.                                     |
| `integratewise-hermes`                         | Hermes agent — internal service binding.                          |
| `integratewise-l2`                             | Entity 360 / cognitive overlay — internal.                        |
| `integratewise-store` (internal routes)        | Public facade only via `files.integratewise.ai`.                  |
| `integratewise-admin` (internal routes)        | Public facade only via `admin.integratewise.ai`.                  |
| `agents-starter` and all agent/runtime workers | Orchestration details, not public platform entities.              |
| Memory plumbing, session workers, watchers     | Governed write paths — Cloudflare-internal only.                  |
| `integratewise-spine-v2`                       | Deprecated — consolidated into pipeline in v3.6.                  |
| `integratewise-agents`                         | Deprecated — consolidated into intelligence in v3.6.              |

---

## Naming Corrections Required

| Current (wrong)                                                | Approved (correct)                                 | Action             |
| -------------------------------------------------------------- | -------------------------------------------------- | ------------------ |
| `mc1p.integratewise.ai`                                        | `mcp-tools.integratewise.ai` or retire to internal | Rename or remove   |
| `normalizerp.integratewise.ai`                                 | `normalizer.integratewise.ai` (if production)      | Rename             |
| `normalizer.integratewise.ai` (currently staging)              | `staging-normalizer.integratewise.ai`              | Swap               |
| `customer0.integratewise.ai` + `customerzero.integratewise.ai` | Keep `customerzero.integratewise.ai` only          | Retire `customer0` |
| `api.integratewise.online` (`hub-api-prod`)                    | Migrate to `gateway.integratewise.ai`              | Retire `.online`   |

---

## Frontend Deployment Rule (locked)

| Target                            | Automation                                                    | Who promotes to prod                 |
| --------------------------------- | ------------------------------------------------------------- | ------------------------------------ |
| `app.integratewise.ai` (CF Pages) | Preview only — never `--branch=main` or `--branch=production` | **Nirmal manually** via CF dashboard |
| CF Workers (backend)              | CI with explicit instruction only                             | CI / Nirmal                          |

---

## Summary — Final Approved Set

**Production public:**
`integratewise.ai`, `www.integratewise.ai`, `app.integratewise.ai`,
`admin.integratewise.ai`, `gateway.integratewise.ai`, `mcp.integratewise.ai`,
`think.integratewise.ai`, `knowledge.integratewise.ai`, `hooks.integratewise.ai`,
`files.integratewise.ai`, `spine.integratewise.ai`, `continuity.integratewise.ai`

**Optional controlled production:**
`iqhub.integratewise.ai`, `customerzero.integratewise.ai` (one canonical route only)

**Staging only:**
`staging-admin.integratewise.ai`, `staging-api.integratewise.ai`,
`staging-hooks.integratewise.ai`, `staging-files.integratewise.ai`,
`staging-normalizer.integratewise.ai`

**SEO / public docs:**
`docs.integratewise.ai`, `platform.integratewise.ai`,
plus `/spine`, `/continuity`, `/about`, `/faq` on main site

**Internal-only:**
All remaining workers — no public domain, no `workers.dev` route.
