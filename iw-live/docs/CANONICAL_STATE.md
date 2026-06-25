# Canonical State — IW Continuity Bridge Launch Control

> **Last Updated:** 2026-06-18T21:13:00+05:30  
> **Status:** Authoritative Active State  
> **Directive:** This file is the single source of active context. Paste this file into every new agent session to ensure continuity and prevent assumption drift.

---

## 1. Authoritative Architecture References

Do not copy-paste or redefine these. Always refer directly to these canonical files:

- **Ecosystem Master Protocol & Rules:** [AGENTS.md](file:///Users/nirmal/Github/integratewise-live/AGENTS.md) (v3.8.0, June 18, 2026) — Mandates the 24-hour product completion directive (Decision 24) and Cloudflare-only infrastructure (Decision 22).
- **Product Specifications:** [PRODUCT_ARCHITECTURE.md](file:///Users/nirmal/Github/integratewise-live/docs/architecture/PRODUCT_ARCHITECTURE.md) (v3.7) — Defines the vendor-neutral Handoff contract, Approval Center, two-mode split (CS/ops), and async state machine.
- **Layers & System Flow:** [USER_SYSTEM_JOURNEY_BLUEPRINT.md](file:///Users/nirmal/Github/integratewise-live/docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md) (v3.7) — Maps L0–L7 user layers, S1–S12 backend stages, Twin context hydration logic, and the 7-stage Customer Zero verification checklist.
- **Master Entry Protocol (All Repos):** [Intake/AGENTS.md](file:///Users/nirmal/Github/IntegrateWise - Memory/Intake/AGENTS.md) (v3.8.0, June 18, 2026).
- **Database Schema (SSOT):** D1 (`integratewise-spine-cache`) + domain partitions (`decide_data`, `build_data`, `grow_data`, `run_data`, `cross_data`).

---

## 2. Changelog of Work Shipped (Since June 18, 2026)

- **2026-06-18 (Timeline Acceleration):** Materialized the 24-hour product completion mandate (Decision 24) in the root [AGENTS.md](file:///Users/nirmal/Github/integratewise-live/AGENTS.md) and memory [Intake/AGENTS.md](file:///Users/nirmal/Github/IntegrateWise - Memory/Intake/AGENTS.md).
- **2026-06-18 (Doctrine Materialization):** Appended detailed specifications for the L7 → L6 data flow, Twin context hydration grounding, and 7-stage Customer Zero checklist directly to [USER_SYSTEM_JOURNEY_BLUEPRINT.md](file:///Users/nirmal/Github/integratewise-live/docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md).
- **2026-06-18 (Dashboard Hang Fix):** Diagnosed D1 query timeouts and resolved the dashboard rendering hangs.
- **2026-06-18 (CZ E2E Loop Closure):** Validated the full loop: Twin DO generates the Handoff package, L5/L6 workbenches render it, Hermes picks up the package and executes mutations directly on D1 SQLite partitions, writes back status, and updates continuity memory.
- **2026-06-18 (Connector Bindings Fix):** Resolved mismatch between deployed worker bindings and gateway routing catalog.

---

## 3. Remaining 24-Hour Production Launch Punch List

These items are pulled from Section 11 of the Product Architecture and the June 18 Deep Excavation Report. They must be fully shipped within 24 hours:

### 3.1 Feature Deliverables & Infrastructure

- [ ] **Approval Center UI (External):** Build and deploy the user interface for external customers to review, approve, and select execution adapters (to be integrated into the main Vite app at `apps/web`).
- [ ] **Handoff Adapter Pipeline:** Implement the canonical JSON handoff contract exporter (JSON export first, followed by specific Hermes/OpenClaw translation mappings).
- [ ] **Async Webhooks state machine:** Implement `/api/v1/handoff/outcome` endpoint on the Cloudflare Gateway (`services/gateway` / `services/bff`) to process execution results from external agents.
- [ ] **Outcome Ingestion & Writeback:** Establish the pipeline to ingest outcome POSTs, validate governance tokens (`x-approval-token`), and record execution memory back to D1 domain partitions.
- [ ] **S11 Boundary Enforcement:** Write the tenant-level logic flag in S8/S11 boundary to enforce strict separation: Customer Zero (Hermes auto-execute) vs External Tenants (async Handoff only).

### 3.2 Critical Security Violations (P0)

- [ ] **RSA Private Key hardcoded in Source (`services/gateway/src/lib/jwt.ts`):** Remove the fallback `DEFAULT_PRIVATE_JWK` block and load strictly from env `OAUTH_PRIVATE_KEY` secret.
- [ ] **Exposed database credentials (`services/loader/check-tables.js`):** Remove hardcoded Neon password; read strictly from `process.env.DATABASE_URL`.
- [ ] **Exposed WebUI password (`scripts/knowledge-write.ts` & `packages/api/src/knowledge-sync.ts`):** Remove hardcoded password; read from `process.env.WEBUI_PASS` or throw.
- [ ] **Root `.env` secrets committed to git:** Remove `.env` from git tracking index (`git rm --cached .env`) and keep it local (relies on `.env.example`).
- [ ] **Hardcoded MCP API Key fallback (`services/intelligence/src/twin-orchestrator.ts`):** Remove the plain key string fallback and fail-closed if `env.MCP_API_KEY` is missing.
- [ ] **Auth Bypass in `iw-agent-runtime` (`services/iw-agent-runtime/src/index.ts`):** Refuse connection and fail-closed if `c.env.JWT_SECRET` is unset and no valid fallback auth is provided.
- [ ] **Cross-Tenant Data Leak in Intelligence:** Ensure Kanban snapshot and Ops status queries filter strictly by `tenant_id` (`services/intelligence/src/index.ts`).
- [ ] **Tenant Identity Spoofing:** Update Gateway routing to strip and overwrite inbound `x-tenant-id` / `x-user-id` headers based on JWT verification.
- [ ] **Tenant Middleware No-Op (`services/tenants/src/index.ts`):** Apply resolved tenant context headers back to the request instead of discarding them.
- [ ] **Invitation Accept Cross-Tenant Scan:** Query the `tenant_users` table with a specific `tenant_id` filter when accepting invitations.
- [ ] **Hardcoded service auth fallback:** Remove `"internal-default"` fallback in `services/intelligence/src/index.ts`.
- [ ] **SQL Injection in Continuity & Knowledge:** Refactor `db-shim.ts` and `supabase.ts` to use parameterized queries instead of executing raw unescaped SQL strings.

### 3.3 High Correctness & Architecture Violations (P1)

- [ ] **Migrate Billing Service from Supabase to D1:** Re-route subscription CRUD, entitlement checking, and payment tracking to Cloudflare D1 (Decision 22).
- [ ] **Gateway Rate Limiting Fail-Open:** Change gateway rate limiter to deny requests if Cloudflare KV fails instead of allowing bypass.
- [ ] **CORS Open Credential Reflecting:** Stop reflecting arbitrary request origins when credentialed access is enabled in the Gateway.
- [ ] **MCP gateway JWT verification bypass:** Require Gateway JWT verification for `/tools`, `/invoke`, `/mcp`, and `/sessions` paths.
- [ ] **Unsigned Webhooks auto-approval:** Add signature validation for webhook providers (WhatsApp, Discord, Notion, etc.) at the Gateway.
- [ ] **Webhook Replay Protection:** Enforce freshness checks on timestamps in webhook headers (Stripe/GitHub/HubSpot) to prevent replay.
- [ ] **Timing-Safe Comparison Length Leak:** Fix timing leaks in webhook verification by avoiding early returns on signature length mismatches.
- [ ] **Nango Signature verification timing leak:** Use `crypto.subtle.timingSafeEqual()` for signature checks.
- [ ] **HITL Durable Object Tenant Leak:** Avoid using `idFromName("global")` for HITL sessions; scope Durable Object IDs by `tenant_id`.
- [ ] **Weak Password Hashing:** Replace Gateway simple SHA-256 with pbkdf2 or bcrypt (or a stretched hash with unique per-user salts).
- [ ] **Type errors in `iw-agent-runtime`:** Fix the 6 compiler errors in `twin-agent.ts` and `index.ts`.
- [ ] **Remove `@supabase/supabase-js` from Monorepo:** Delete `@supabase/supabase-js` from all package.json files and remove `packages/supabase/` to complete Decision 22.
