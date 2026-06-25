# Documentation Index — Continuity Bridge Platform

## Quick Start

**New to Continuity Bridge?** Start here:

1. [GTM_MOTION.md](GTM_MOTION.md) — Understand the product positioning and onboarding flow
2. [TOOL_CONNECTION_FLOW.md](TOOL_CONNECTION_FLOW.md) — See how the first tool connects end-to-end
3. [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) — Visual flows (7 complete architectures)

**Building on Continuity Bridge?**

4. [../REGISTRY.md](../REGISTRY.md) — All endpoints, secrets, services, schema
5. [../CONTRIBUTING.md](../CONTRIBUTING.md) — Development standards and tenant isolation rules
6. [operations/LOGGING_AND_AUDIT.md](operations/LOGGING_AND_AUDIT.md) — Audit architecture and compliance

**Operations & Troubleshooting:**

7. [operations/CONNECTORS.md](operations/CONNECTORS.md) — Connector registry and configuration
8. [operations/ALERTS_AND_MONITORING.md](operations/ALERTS_AND_MONITORING.md) — Health checks, SLOs, incident response

---

## Documentation by Role

### Product Managers / GTM

- **[GTM_MOTION.md](GTM_MOTION.md)** — Messaging, positioning, competitive analysis, funnel
- **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** — Show prospects the technical architecture
- Key metrics: Connector sync %, worker uptime, API latency, memory consolidation success rate

### Developers

- **[TOOL_CONNECTION_FLOW.md](TOOL_CONNECTION_FLOW.md)** — The complete journey (Nango → Normalizer → Spine)
- **[../REGISTRY.md](../REGISTRY.md)** — All endpoints, bindings, env vars
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** — Mandatory: Per-tenant isolation (WHERE tenant_id = ?), audit logging, no secrets in code
- **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** — Visual reference for 7 platform flows

### Operators / DevOps

- **[operations/CONNECTORS.md](operations/CONNECTORS.md)** — Connector lifecycle, Nango setup, OAuth management
- **[operations/ALERTS_AND_MONITORING.md](operations/ALERTS_AND_MONITORING.md)** — Health checks, metrics, incident response
- **[operations/LOGGING_AND_AUDIT.md](operations/LOGGING_AND_AUDIT.md)** — Audit tables, compliance, troubleshooting

### Security / Compliance

- **[operations/LOGGING_AND_AUDIT.md](operations/LOGGING_AND_AUDIT.md)** — Immutable audit trail, per-tenant isolation, GDPR/SOC2
- **[../REGISTRY.md](../REGISTRY.md)** — Secret management (Nango vault, encryption for free users)
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** — Code hygiene, attribution, no hardcoded secrets

---

## Core Concepts (Always Keep in Mind)

### 1. Per-Tenant Isolation (Non-Negotiable)
Every SQL query must have `WHERE tenant_id = ?`. Cross-tenant data access is a security violation. Fail loud on audit write failures.

### 2. Schema Hydration on First Auth
When a user signs up, the schema-generation AI (gpt-5-mini) hydrates their entire tenant schema based on identity provider metadata. This enables immediate, seamless first tool connection.

### 3. Continuity = Unified Reasoning
User connects tool A (Salesforce) → data normalizes into Spine → Twin reasons over unified Spine → proposing actions informed by all connected tools (even if only A is connected so far).

### 4. Tool Connection: Immediate Creamy Sync (No Cron Wait)
When `auth.created` webhook arrives from Nango:
1. D1 status updated (tenant_spine_config.connected_connectors)
2. Creamy sync triggered immediately (full load of tool data)
3. Normalizer processes (NA0-NA5)
4. Spine has live data within seconds (not hours)

### 5. Governance & Approval Gate
- Twin proposes with confidence score
- >0.85 confidence: auto-approve (log to governance_audit_log)
- <0.85 confidence: queued for owner review in "My Desk"
- Every decision logged (immutable audit trail)

### 6. Memory Consolidation Lifecycle
- TriageBot extracts knowledge (daily)
- Route by confidence (>0.85 auto-promote, staging, discard)
- Active memory available to Twin (autonomous reinforcement/decay)
- All changes logged (memory_promotion_audit)

### 7. Fail Loud = Security First
- Audit write fails → sync stops (not silent degradation)
- Cross-tenant query attempt → 403 Forbidden (not 404)
- Invalid signature → webhook rejected (not logged and ignored)

---

## Architecture Layers

### Layer 0: Identity Provider
- OAuth entry point (Google, GitHub, custom IdP)
- Provides credential + org metadata
- Triggers schema hydration

### Layer 1: Platform (Cloudflare Workers)
- **Spine** (D1): canonical entities, relationships, signals
- **Twin** (Intelligence): reasoning engine (gpt-5-mini)
- **Connector** (MCP): tool capabilities + OAuth management
- **Memory** (Knowledge): consolidation + lifecycle
- **Governance** (Admin): approvals + RBAC + audit

### Layer 2: Integration Layer
- **Nango**: OAuth + token management (per-tenant, encrypted)
- **Tool Adapters**: Salesforce, HubSpot, Stripe, GitHub, etc.
- **Webhook Ingress**: Real-time event processing
- **Normalizer**: Schema mapping (NA0-NA5 pipeline)

### Layer 3: Frontend (Replit)
- Universal UI (iwa-customer-zero monorepo)
- Workspace views (role-based L1)
- Approval workflows ("My Desk")
- Real-time metrics dashboard

---

## Key Files

| File | Purpose |
|------|---------|
| `services/connector/src/lib/nango.ts` | Nango API wrapper (session creation, token refresh, disconnect) |
| `services/loader/src/index.ts` | Webhook handler (auth.created → D1 status + Creamy sync trigger) |
| `services/connector-sync/src/index.ts` | Full/Delta/Polling sync engine (resolves Nango tokens + calls adapters) |
| `services/normalizer/src/normalizer-accelerator.ts` | 8-stage pipeline (NA0-NA5 entity mapping) |
| `services/pipeline/src/spine-publisher.ts` | Writes canonical entities to D1 Spine |
| `services/intelligence/src/index.ts` | Twin reasoning (gpt-5-mini + Spine grounding) |
| `services/knowledge/src/synthesis/triage-bot.ts` | Memory extraction + confidence scoring |
| `apps/web/src/components/l1/domains/bizops/my-desk.tsx` | Owner approval interface |

---

## Troubleshooting

### "User connected tool but no data appears"
1. Check `connectors` table (D1): `status = 'connected'`?
2. Check `audit_logs`: did Creamy sync trigger?
3. Check normalizer output: any validation errors?
4. Check Spine: did pipeline publish succeed?

### "Nango session fails"
- `NANGO_SECRET_KEY` set in wrangler.toml?
- Provider (Salesforce, HubSpot, etc.) registered in Nango dashboard?
- OAuth app created in SaaS provider (with correct redirect URI)?

### "Cross-tenant data leak"
- Audit query for `WHERE tenant_id = ?`
- Check all routes in gateway for x-tenant-id header extraction
- Trace through normalizer: does it enforce tenant_id on inserts?

### "Audit write failed"
- This is fail-loud by design (sync stops immediately)
- Check D1: audit tables have quota? Permission errors?
- Check pipeline: is PIPELINE_QUEUE bound correctly?

---

## Deployment Checklist

Before going live:

- [ ] Schema hydration AI tested (gpt-5-mini model works + costs bounded)
- [ ] Nango configured (secret keys, integrations registered, webhook URL set)
- [ ] D1 migrations run (all audit tables, tenant_spine_config, connectors)
- [ ] Cloudflare Workers deployed (connector, loader, pipeline, intelligence)
- [ ] Audit logging verified (every action creates immutable record)
- [ ] Per-tenant isolation tested (cross-tenant query returns 403)
- [ ] Landing page live (root `/` serves LandingPage, no 404)
- [ ] Founder dashboard live (`/dashboard` shows real metrics)
- [ ] First tenant can connect first tool end-to-end
- [ ] Approval workflow tested ("My Desk" shows + approves proposals)

---

## Contact & Support

For issues, questions, or contributions:
- Check the docs here first
- Open an issue on GitHub
- Refer to [../CONTRIBUTING.md](../CONTRIBUTING.md) for development standards
