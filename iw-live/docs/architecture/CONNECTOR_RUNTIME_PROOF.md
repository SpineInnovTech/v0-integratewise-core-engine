# Connector Runtime Proof — GitHub → Spine → Projection

> **Tier:** B (Build proof). Canon: `SPINE_MODEL.md`, `PROJECTION_MODEL.md`, `AGENTS.md`.
> **Date:** June 12, 2026 | **Status:** transformation PROVEN (offline, tested); runtime GATED on P1 deploy.

The strategic question: **can external reality enter the Spine and produce useful projections?**
GitHub is the chosen first proof (rich entities, no OAuth dance to validate the mapping, central to IW).

```text
GitHub → Nango Connector → Connector Registry → SPINE (entity resolution) → D1 → Projection → Workbench/Twin
```

---

## 1. Proven now (offline, unit-tested) ✅

**External reality → canonical Spine entities.** This is the architectural heart — that GitHub
records become _canonical_ Spine types, never raw GitHub blobs.

| GitHub       | Canonical type | Why                                                                     |
| ------------ | -------------- | ----------------------------------------------------------------------- |
| repo         | `repository`   | canonical (PRODUCT_ENGINEERING)                                         |
| issue        | `task`         | engineering work item; blocked-work flagged from labels                 |
| pull request | `pull_request` | canonical; merged/draft/open status                                     |
| commit       | `activity`     | matches canonical `push → activity` alias                               |
| contributor  | `contact`      | a contributor is a Person — entity resolution unifies them across tools |

- Mapper: `packages/connectors/src/project-management/github-spine-mapping.ts` (pure functions).
- Tests: `…/github-spine-mapping.test.ts` — 7 tests, incl. PR-disguised-as-issue detection and the
  invariant that **every** emitted entity uses a canonical type with `source`/`source_id` provenance.
- Sync adapter `syncGitHub` (`packages/connectors/src/sync-adapters.ts`) now routes all GitHub data
  through the mapper (was: repo→`project`, issue→`ticket` only).
- Spine routing: `getDomainForType` (`services/pipeline/src/spine/index.ts`) now sends engineering
  types (`repository`, `pull_request`, …) to the **build** partition so the Engineering projection
  co-locates instead of scattering into `cross_data`.
- **Engineering projection read path:** `GET /api/v1/workspace/engineering`
  (`services/gateway/src/workspace-spine.ts` → `getEngineeringProjection`) reads `build_data`
  D1-direct and shapes Active Repositories · Open PRs · Recent Commits · Blocked Work. Tested
  (`engineering-projection.test.ts`, 3 tests) incl. the no-raw-leak invariant; degrades to an empty
  projection before any data is synced.

## 2. Gated on P1 (needs deployed infra + Nango connection) ⛔

These require the Cloudflare deploy + a live GitHub connection (see `DEPLOYMENT_RUNBOOK.md`):

- **Connector layer:** register the GitHub connection via Nango; persist sync cursor/state; accept
  webhooks (`services/webhook-ingress` → `services/connector-sync`).
- **Spine write:** sync → normalizer → pipeline → D1 `build_data` partition (tenant-scoped).
- **Projection:** an Engineering projection (Open PRs · Recent Commits · Active Repos · Blocked Work)
  read D1-direct via the gateway (`PROJECTION_MODEL.md`), derived from Spine entities only.
- **Twin:** answer "what changed in engineering this week?" from the Spine — no live GitHub query.

## 3. Success criteria (the proof is complete when…)

- [x] GitHub payloads map to canonical entities (no raw records downstream) — **tested**
- [x] Engineering types co-locate in one Spine partition — **routing in place**
- [x] Engineering projection read path (D1-direct, shaped, no-leak) — **built + tested**
- [ ] A live GitHub connection syncs into D1 (cursor tracked) — _needs P1_
- [ ] The projection renders live data in the Engineering workbench (frontend hook) — _needs P1 data_
- [ ] The Twin answers an engineering question from the Spine — _needs P1_

## 4. Why this generalizes

Once GitHub → Spine → Projection runs end-to-end, the pattern repeats for HubSpot, Notion, Google
Workspace, Slack, Linear: each is a new mapper (`map<Tool>` → canonical types) plus the same
runtime. The runtime is shared; only the per-tool mapping changes — and that mapping is now a
proven, unit-tested pattern.

---

_Transformation proven offline; runtime is one deploy away. When P1 lands, wire a live GitHub
connection and check off §3._
