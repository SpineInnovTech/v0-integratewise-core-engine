# IntegrateWise Service Inventory — Product vs Customer-Zero

## Executive Summary

**26 Product Services** (core platform infrastructure)
- 6 core services: Gateway, Tenants, Connector-Sync, Normalizer, Triage, Hermes
- 9 projection/rendering: Pipeline, Twin-Orchestrator, Workbench, L2, Intelligence, Knowledge, Govern, Store, Act
- 11 utility/support: MCP-Connector, Agent-Registry, Webhook-Ingress, Billing, Admin, Loader, Folder-Watcher, Continuity, IW-Agent-Runtime, Telemetry, Think

**1 Customer-Zero Service** (seeded tenant-specific infrastructure)
- The `iw-customer-zero` tenant itself (lives in D1 tenants table, seeded for testing)
- Deployed with `tenant_class = 'customer_zero'` (special execution posture)

---

## Product Services (Core Platform)

These run on every deployment and service **all tenants** (both customer-zero and external).

### Tier 0: Ingress & Routing

| Service | Purpose | Binding | Routes | Status |
|---------|---------|---------|--------|--------|
| **gateway** | Single entry point, JWT validation, tenant routing | GATEWAY | gateway.dev.integratewise.ai | ✅ Live |
| **webhook-ingress** | Receive webhooks from external systems (Salesforce, HubSpot, Stripe, GitHub, etc.) | WEBHOOK_INGRESS | *.integratewise.ai/webhooks/* | ✅ Live |

### Tier 1: Core Data & Context

| Service | Purpose | Binding | Database | Status |
|---------|---------|---------|----------|--------|
| **tenants** | Multi-tenant context resolution, tenant CRUD, SSO config, plan limits | TENANTS | D1: integratewise-spine-cache | ✅ Live |
| **connector-sync** | Orchestrate connector data sync (Creamy → Normalizer → Triage) | CONNECTOR_SYNC | D1: integratewise-spine-cache | ✅ Live |
| **normalizer** | Transform connector payloads → Spine schema (NA0-NA5 normalizers) | NORMALIZER | Supabase (auth, connectors table) | ✅ Live |

### Tier 2: Projection & Rendering

| Service | Purpose | Binding | Routes | Status |
|---------|---------|---------|--------|--------|
| **pipeline** | Product/Engineering domain renderer (projects, incidents, roadmap) | PIPELINE | pipeline.dev.integratewise.ai | ✅ Live |
| **twin-orchestrator** | Twin reasoning engine (persistent AI assistant per user) | TWIN_ORCHESTRATOR | twin.dev.integratewise.ai | ✅ Live |
| **l2** | L2 overlay renderer (department × industry projections) | L2 | (in-memory KV) | ✅ Live |
| **intelligence** | Analytics & insights renderer | INTELLIGENCE | intelligence.dev.integratewise.ai | ✅ Live |
| **knowledge** | Knowledge base, docs, semantic search (uses OpenRouter) | KNOWLEDGE | (in-memory) | ✅ Live |
| **govern** | Governance rules engine (approval gates, HITL thresholds) | GOVERN | Supabase | ✅ Live |
| **store** | Data persistence for projections (accounts, deals, tasks, etc.) | STORE | Supabase | ✅ Live |
| **act** | Action execution (write back to Spine) | ACT | Supabase | ✅ Live |

### Tier 3: Capability Runtime & Orchestration

| Service | Purpose | Binding | Database | Status |
|---------|---------|---------|----------|--------|
| **hermes** | Message queue + execution engine (DurableObject-based) | HERMES + EXECUTION_ENGINE DO | D1: integratewise-spine-cache | ✅ Live |
| **triage** | Message triage: confidence routing, active memory decay | (internal to hermes) | D1: integratewise-spine-cache | ✅ Live |
| **workflow** | Durable workflow orchestration (pause, retry, saga patterns) | WORKFLOW | Supabase | ✅ Live |
| **iw-agent-runtime** | MCP-compliant AI agent execution (GPT-5-mini default) | IW_AGENT_RUNTIME | OpenRouter | ✅ Live |
| **mcp-connector** | MCP bridge for external agents → scoped Spine/Memory access | MCP_CONNECTOR | mcp.integratewise.ai | ✅ Live |

### Tier 4: Supporting Services

| Service | Purpose | Binding | Storage | Status |
|---------|---------|---------|---------|--------|
| **agent-registry** | Catalog of available agents (integrations registry) | AGENT_REGISTRY | D1: integratewise-spine-cache | ✅ Live |
| **billing** | Tenant billing, usage tracking, plan enforcement | BILLING | Supabase | ✅ Live |
| **admin** | Platform admin operations (tenant management, overrides) | ADMIN | D1: integratewise-spine-cache | ✅ Live |
| **loader** | Data pre-loader for cold starts (reduces latency) | LOADER | Supabase | ✅ Live |
| **folder-watcher** | DurableObject-based file system watcher (for integrations) | FOLDER_WATCHER DO | (local to DO) | ✅ Live |
| **continuity** | Continuity Bridge logic (memory consolidation, decay) | CONTINUITY | D1: integratewise-spine-cache | ✅ Live |
| **telemetry** | Observability, traces, metrics collection | TELEMETRY | Cloudflare Logs | ✅ Live |
| **think** | LLM reasoning orchestration (separate from iw-agent-runtime) | THINK | Supabase | ✅ Live |
| **connector** | OAuth callback handler for connectors (Nango integration) | CONNECTOR | Supabase | ✅ Live |

---

## Gateway Service Bindings (All 26 Services Wired)

```toml
# Gateway ingress → routes to all 26 backend services
[env.production]
services = [
  { binding = "GATEWAY", service = "gateway" },
  { binding = "TENANTS", service = "tenants" },
  { binding = "CONNECTOR_SYNC", service = "connector-sync" },
  { binding = "NORMALIZER", service = "normalizer" },
  { binding = "PIPELINE", service = "pipeline" },
  { binding = "TWIN_ORCHESTRATOR", service = "twin-orchestrator" },
  { binding = "L2", service = "l2" },
  { binding = "INTELLIGENCE", service = "intelligence" },
  { binding = "KNOWLEDGE", service = "knowledge" },
  { binding = "GOVERN", service = "govern" },
  { binding = "STORE", service = "store" },
  { binding = "ACT", service = "act" },
  { binding = "HERMES", service = "hermes" },
  { binding = "WORKFLOW", service = "workflow" },
  { binding = "IW_AGENT_RUNTIME", service = "iw-agent-runtime" },
  { binding = "MCP_CONNECTOR", service = "mcp-connector" },
  { binding = "AGENT_REGISTRY", service = "agent-registry" },
  { binding = "BILLING", service = "billing" },
  { binding = "ADMIN", service = "admin" },
  { binding = "LOADER", service = "loader" },
  { binding = "FOLDER_WATCHER", service = "folder-watcher" },
  { binding = "CONTINUITY", service = "continuity" },
  { binding = "TELEMETRY", service = "telemetry" },
  { binding = "THINK", service = "think" },
  { binding = "CONNECTOR", service = "connector" },
  { binding = "WEBHOOK_INGRESS", service = "webhook-ingress" },
]
```

---

## Customer-Zero: Not a Service, It's a Tenant

### What Customer-Zero Is
**A single seeded tenant record** that lives in the D1 `tenants` table:

```sql
-- In D1: integratewise-spine-cache
INSERT INTO tenants (
  id,
  org_name,
  slug,
  plan,
  tenant_class,
  created_at
) VALUES (
  'iw-customer-zero',
  'Customer Zero (Demo)',
  'customer-zero',
  'enterprise',
  'customer_zero',  -- Special posture: allows S11 Hermes native execution
  NOW()
);
```

### How It's Referenced

| Location | Reference | Purpose |
|----------|-----------|---------|
| `apps/web/src/utils/spine/client.ts` | `tenantId: "iw-customer-zero"` | Frontend auth context defaults to CZ for demo |
| `apps/web/src/components/l1/admin/customer-zero-verification.tsx` | Displays CZ tenant status, seed data validation | Admin verification UI |
| `.kiro/specs/external-customer-surface-completion/` | `tenant_class: "customer_zero"` decision gate | S8 (Triage) → S11 (Hermes native exec) routing |
| `services/gateway/src/index.ts` | JWT decode checks `tenant_id === "iw-customer-zero"` | Authorization for demo execution |
| `services/tenants/src/index.ts` | Seeds CZ on first boot | Tenant initialization |

### Customer-Zero Execution Posture

When `tenant_class = 'customer_zero'`:

1. **S11 Entry is Allowed**: Hermes can execute native code (e.g., `eval(proposedCode)`)
2. **Approval Gates Still Apply**: Even CZ cannot bypass `alarm()` hard gates (approval expiry)
3. **Defense-in-Depth**: CZ gates at two layers:
   - D1 tenant_class check (tenants table)
   - Runtime JWT validation (gateway)

### No Customer-Zero-Specific Services

Customer-Zero **does not have separate Worker services**. Instead:
- All 26 product services serve CZ tenant like any other
- CZ differs only in **tenant_class** (database value) and **execution posture** (allowed to hit S11)
- The `iw-customer-zero` monorepo (Replit universal frontend) is a **separate repo**, not a service in this one

---

## Deployment Reality: Version Bloat & Fixes

### Current State (From Your Deployment Check)

| Service | Versions | Status | Issue |
|---------|----------|--------|-------|
| workflow-prod | 1.9M | ✅ Deployed | Runaway deployments (script loop?) |
| pipeline-prod | 1.18M | ✅ Deployed | Runaway deployments |
| gateway-staging | 156 | ✅ Deployed | Normal |
| connector-prod | 89 | ✅ Deployed | Normal |

**Root Cause**: No CI/CD gate. Every `wrangler deploy` command from a script creates a new version.

### What Needs Fixing

1. **Create GitHub Actions workflow** (Blocks: manual `wrangler deploy` with automated CI/CD)
2. **Add pre-deploy test gate** (Blocks: broken code from reaching prod)
3. **Investigate version bloat** (Debug: why versions spike to 1M+)
4. **Unified deployment pipeline** (All 26 services deploy together, not individually)

---

## Quick Reference: Service By Domain

### By Tier (Dependency Order)

```
Tier 0 (Ingress)
  ├─ gateway (entry point)
  └─ webhook-ingress (webhooks)

Tier 1 (Core Data)
  ├─ tenants (context resolution)
  ├─ connector-sync (orchestration)
  └─ normalizer (data transform)

Tier 2 (Rendering)
  ├─ pipeline (Product)
  ├─ twin-orchestrator (AI)
  ├─ l2 (Overlay)
  ├─ intelligence (Analytics)
  ├─ knowledge (Search)
  ├─ govern (Rules)
  ├─ store (Persistence)
  └─ act (Write-back)

Tier 3 (Runtime)
  ├─ hermes (Execution)
  ├─ workflow (Orchestration)
  ├─ iw-agent-runtime (AI Agents)
  └─ mcp-connector (MCP Bridge)

Tier 4 (Support)
  ├─ agent-registry (Catalog)
  ├─ billing (Monetization)
  ├─ admin (Platform)
  ├─ loader (Cache)
  ├─ folder-watcher (Events)
  ├─ continuity (Memory)
  ├─ telemetry (Observability)
  ├─ think (Reasoning)
  └─ connector (OAuth)
```

### By Data Storage

**D1 (Cloudflare)**: gateway, tenants, connector-sync, hermes, triage, agent-registry, continuity
**Supabase**: normalizer, govern, store, act, billing, admin, loader, workflow, think, connector, knowledge
**In-Memory/KV**: l2, iw-agent-runtime, folder-watcher, telemetry, intelligence, pipeline

---

## Deployment Next Steps

Choose one:

1. **Set up GitHub Actions** (Unified CI/CD for all 26 services)
2. **Debug version bloat** (Why pipeline/workflow have 1M+ versions)
3. **Add test gate** (Wire Vitest into pre-deploy check)
4. **Audit other broken projects** (integratewise-marketing, spine-org)
