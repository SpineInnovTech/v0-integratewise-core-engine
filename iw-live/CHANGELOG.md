# Changelog

All notable changes to IntegrateWise are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [0.5.0] - 2026-06-24

### Added — GTM Motion & Landing Page (platform.integrate-voice.ai)

- **Landing page** now at root `/` (not `/landing`): schema hydration flow visualization
- **GTM motion documentation** (`docs/GTM_MOTION.md`): positioning, funnel, technical proof, competitive matrix
- **Founder dashboard** at `/dashboard`: real-time business metrics + system health (Connector sync %, worker uptime, D1 queries, API latency)
- **Schema-generation AI flow** documented: identity provider → schema hydrate → tenant init → first tool connect (single "authorize" click)

### Fixed — Landing Page Routing

- Landing page moved from `/landing` to `/` (root entry point)
- Root previously redirected to `/app`; now serves public landing page directly
- App workspace entry point is now `/app` (was `/`)
- All public routes (landing, dashboard) bypass AppShell auth gate

### Documentation

- `docs/GTM_MOTION.md`: Full GTM positioning, messaging by audience, funnel, success metrics, competitive analysis
- Updated README with platform surfaces + memory/logging architecture
- Added `CONTRIBUTING.md`: development standards, tenant isolation rules, code hygiene
- Added `LOGGING_AND_AUDIT.md`: complete audit logging architecture + compliance model

---

## [0.4.0] - 2026-04-10

### Added — India/Dubai Market Connectors

- **Google Sheets** connector — full Sheets API v4 + Drive API v3 with OAuth
- **Tally ERP/Prime** connector — XML HTTP API for Indian accounting (port 9000)
- **Razorpay** connector — REST API for Indian payment processing (payments, settlements, customers, disputes)
- **Vyapar** connector — REST API for Indian SMB invoicing and inventory
- **Khatabook** connector — REST API for Indian SMB bookkeeping (ledger, transactions, parties)
- **Shiprocket** connector — Token-based auth for Indian e-commerce logistics (orders, shipments, tracking)
- Sync adapter count: 46 → 52 providers

### Fixed — Billing System (7 disconnections resolved)

- Plan IDs unified: backend now matches frontend (`free` / `starter` $29 / `growth` $79 / `enterprise` custom)
- Dual-schema entitlement read: `/v1/entitlements/:tenantId` reads Schema A + Schema B with fallback
- `SubscriptionsPage` mounted on `billing` route across all 12 domain content maps
- `SubscriptionsPage` rewritten with real TenantContext data, BillingClient invoice fetching, Stripe checkout
- `TenantProvider` mounted in AppShell wrapping workspace stage (was missing from component tree)
- Free subscription auto-created on onboarding completion
- `UpgradePrompt` fixed: uses `useNavigate()` instead of dead `/upgrade` link

### Changed — Loader Service

- `processCreamyLayer()` and `processBackgroundSync()` now call real `universalSync()` instead of generating mock data
- Graceful fallback to placeholder records if provider not in SYNC_REGISTRY

---

## [0.3.0] - 2026-04-10

### Fixed — Security & Infrastructure (Phase 1 Audit)

- Removed hardcoded Figma access token from source
- Removed MCP connector tokens from source
- Deleted root `wrangler.toml` containing credentials
- Resolved v3.6 split-brain across 6 service wrangler.toml files (gateway routing)

### Added

- OAuth token refresh module (`services/connector/src/token-refresh.ts`) with automatic retry and expiry detection

### Changed — Product Terminology

- Replaced all "IntegrateWise OS" / "Cognitive OS" references with "Knowledge Workspace" across codebase

---

## [0.2.0] - 2026-04-09

### Changed — Repository Cleanup

- Deleted 5 empty service directories (cognitive-brain, memory-consolidator, stream-gateway, views, iq-hub)
- Deleted legacy Bitbucket pipeline configs
- Deleted orphaned packages (os-ui, hub)
- Fixed Figma secrets in `.env.example`

### Added

- Activity log at `.logs/ACTIVITY_LOG.md`
- System flow documentation rewrite from architectural review

---

## [0.1.0] - 2026-04-08

### Added — Initial Architecture

- 22 Cloudflare Worker services (6 deployed: mcp-connector, gateway, knowledge, workflow, think, normalizer)
- 18 shared packages (connectors, accelerators, types, etc.)
- Web app with 12 domain-specific L1 views + 14 L2 cognitive overlay components
- Spine v2 adaptive intelligence layer
- Entity 360 convergence point
- Knowledge service with ~25 endpoints
- MCP connector with 12 tools (7 kb._, 5 figma._)
- Loader service with 8-stage processing pipeline
- Billing infrastructure (Stripe + Razorpay dual-provider)
- 46 sync adapters for third-party data ingestion
