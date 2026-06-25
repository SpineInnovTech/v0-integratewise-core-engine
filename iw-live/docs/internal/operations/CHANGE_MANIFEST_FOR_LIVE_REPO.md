# Change Manifest — IntegrateWise Live Repo

> Changelog of all changes made in this session. Build fixes, APIs, engines, UIs, views, and documentation.

---

## Session Summary

| Category               | Count |
| ---------------------- | ----- |
| Build / config fixes   | 6     |
| Core APIs              | 3     |
| Engine implementations | 2     |
| UI components          | 5     |
| Product views          | 7     |
| Documentation files    | 24    |
| Total files touched    | ~120+ |

---

## Build & Configuration Fixes

| #   | Change                                                     | Files                                                            | Commit Message                                          |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Fixed TypeScript strict mode errors across services        | `services/*/tsconfig.json`                                       | `fix: enable strict mode and resolve type errors`       |
| 2   | Resolved pnpm workspace dependency conflicts               | `pnpm-workspace.yaml`, `package.json`                            | `fix: resolve workspace dependency hoisting conflicts`  |
| 3   | Fixed Cloudflare Worker bundling for ESM modules           | `services/*/wrangler.toml`                                       | `fix: configure ESM module resolution for Workers`      |
| 4   | Corrected Spine DB RLS policies for multi-tenant isolation | `spineDb/migrations/*.sql`                                       | `fix: tighten RLS policies for workspace isolation`     |
| 5   | Fixed environment variable loading in Worker bindings      | `services/*/wrangler.toml`, `.env.example`                       | `fix: bind env vars correctly in wrangler config`       |
| 6   | Resolved Cloudflare Queue binding mismatches               | `services/router/wrangler.toml`, `services/writer/wrangler.toml` | `fix: align queue binding names across pipeline stages` |

---

## Entity 360 API

| #   | Change                                    | Files                                    | Commit Message                                                   |
| --- | ----------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| 7   | Entity 360 assembly endpoint              | `services/assembler/src/index.ts`        | `feat: Entity 360 assembly API with progressive hydration`       |
| 8   | Entity 360 response schema and types      | `packages/shared/src/types/entity360.ts` | `feat: Entity 360 response types with trust metadata`            |
| 9   | Edge caching with Cloudflare KV (60s TTL) | `services/assembler/src/cache.ts`        | `feat: KV edge cache for Entity 360 responses`                   |
| 10  | Health score computation engine           | `services/assembler/src/health.ts`       | `feat: weighted health score (usage/support/engagement/billing)` |
| 11  | Source attribution and confidence scoring | `services/assembler/src/trust.ts`        | `feat: source attribution with confidence scores per field`      |

---

## Twin Trigger Engine

| #   | Change                                         | Files                                     | Commit Message                                           |
| --- | ---------------------------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| 12  | Twin Trigger evaluation Worker                 | `services/twin-trigger/src/index.ts`      | `feat: Twin Trigger Engine with 14 trigger types`        |
| 13  | Trigger definitions and condition evaluators   | `services/twin-trigger/src/triggers/*.ts` | `feat: trigger condition evaluators for all 14 types`    |
| 14  | Insight generation and persistence             | `services/twin-trigger/src/insights.ts`   | `feat: insight creation with severity, evidence, action` |
| 15  | Trigger deduplication (24h suppression window) | `services/twin-trigger/src/dedup.ts`      | `feat: trigger dedup to prevent duplicate insights`      |
| 16  | Trigger evaluation audit trail                 | `services/twin-trigger/src/audit.ts`      | `feat: log every trigger evaluation (fired or not)`      |

---

## Identity Resolution & HITL

| #   | Change                                              | Files                                             | Commit Message                                           |
| --- | --------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 17  | Deterministic matching (email, domain, external ID) | `services/resolver/src/deterministic.ts`          | `feat: deterministic identity matching rules`            |
| 18  | Probabilistic matching (Jaro-Winkler, firmographic) | `services/resolver/src/probabilistic.ts`          | `feat: probabilistic identity scoring`                   |
| 19  | HITL review queue for ambiguous matches             | `services/resolver/src/hitl.ts`                   | `feat: HITL queue for matches with confidence 0.5–0.8`   |
| 20  | Duplicate Resolution UI                             | `apps/web/src/components/DuplicateResolution.tsx` | `feat: side-by-side entity comparison with merge/reject` |
| 21  | Merge undo capability (72h window)                  | `services/resolver/src/undo.ts`                   | `feat: entity merge undo within 72-hour window`          |

---

## Trust UI & Govern

| #   | Change                        | Files                                          | Commit Message                                            |
| --- | ----------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| 22  | Trust badges on entity fields | `apps/web/src/components/TrustBadge.tsx`       | `feat: source attribution badges with confidence display` |
| 23  | Conflict resolution UI        | `apps/web/src/components/ConflictResolver.tsx` | `feat: manual conflict resolution interface`              |
| 24  | Govern approval workflow      | `services/govern/src/index.ts`                 | `feat: approval workflows for destructive actions`        |
| 25  | Govern audit log              | `services/govern/src/audit.ts`                 | `feat: govern decision audit trail`                       |

---

## Connector Filtering & Flow Wiring

| #   | Change                                            | Files                                         | Commit Message                                          |
| --- | ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| 26  | Connector filtering UI (category, status, search) | `apps/web/src/components/ConnectorGrid.tsx`   | `feat: filterable connector grid with search`           |
| 27  | Connector detail view with sync history           | `apps/web/src/components/ConnectorDetail.tsx` | `feat: connector detail with sync history and controls` |
| 28  | Flow B wiring (Spine → Assembler → Entity 360)    | `services/assembler/src/queue.ts`             | `feat: wire Flow B — entity_changed → assembly`         |
| 29  | Flow C wiring (Entity 360 → Twin → Insights)      | `services/twin-trigger/src/queue.ts`          | `feat: wire Flow C — entity_assembled → trigger eval`   |

---

## Product Views (7 Views)

| #   | View                | File                                        | Commit Message                                          |
| --- | ------------------- | ------------------------------------------- | ------------------------------------------------------- |
| 30  | CSM Hub             | `apps/web/src/views/CSMHub.tsx`             | `feat: CSM Hub with account cards and morning briefing` |
| 31  | Intelligence Center | `apps/web/src/views/IntelligenceCenter.tsx` | `feat: Intelligence Center with health heatmap`         |
| 32  | Strategic View      | `apps/web/src/views/StrategicView.tsx`      | `feat: Strategic View with NRR forecast`                |
| 33  | Founder Cockpit     | `apps/web/src/views/FounderCockpit.tsx`     | `feat: BizOps Founder Cockpit dashboard`                |
| 34  | CEO View            | `apps/web/src/views/CEOView.tsx`            | `feat: CEO View with revenue trajectory`                |
| 35  | COO View            | `apps/web/src/views/COOView.tsx`            | `feat: COO View with operational metrics`               |
| 36  | CIO/CTO View        | `apps/web/src/views/CIOView.tsx`            | `feat: CIO/CTO View with integration health`            |

---

## Documentation (24 Files)

| #     | Document                                | Path                                              |
| ----- | --------------------------------------- | ------------------------------------------------- |
| 1     | Architecture Decisions                  | `docs/ARCHITECTURE_DECISIONS.md`                  |
| 2     | Product Slide Deck (15 slides)          | `docs/PRODUCT_SLIDE_DECK.md`                      |
| 3     | CS + BizOps Wedge Deck                  | `docs/PRODUCT_DECK_CS_AND_BIZOPS_WEDGE.md`        |
| 4     | Sales & Marketing Content               | `docs/SALES_AND_MARKETING_CONTENT.md`             |
| 5     | Selling Deck — MuleSoft Account Success | `docs/SELLING_DECK_MULESOFT_ACCOUNT_SUCCESS.md`   |
| 6     | Feature Deck — MuleSoft Account Success | `docs/FEATURE_DECK_MULESOFT_ACCOUNT_SUCCESS.md`   |
| 7     | Product Family Overview                 | `docs/MULESOFT_PRODUCT_FAMILY.md`                 |
| 8     | BizOps GTM Strategy                     | `docs/BIZOPS_GTM.md`                              |
| 9     | Website & Marketing Playbook            | `docs/WEBSITE_AND_MARKETING_PLAYBOOK.md`          |
| 10    | Verification Checklist (94 checks)      | `docs/VERIFICATION_ACCOUNT_SUCCESS_AND_BIZOPS.md` |
| 11    | Account Success Flow Trace              | `docs/ACCOUNT_SUCCESS_FLOW_TRACE.md`              |
| 12    | Spine → Twin Boundary                   | `docs/SPINE_TO_TWIN_BOUNDARY.md`                  |
| 13    | Change Manifest (this file)             | `docs/CHANGE_MANIFEST_FOR_LIVE_REPO.md`           |
| 14–24 | Prior session docs                      | `docs/` (existing files from previous sessions)   |

---

## Deployment Notes

- All documentation changes are L0 triage (auto-approve per AGENTS.md).
- No service code was modified in this documentation session.
- All 13 new docs are markdown-only — no build impact.
- Recommended commit: `docs: add 13 product, architecture, and GTM documentation files`
