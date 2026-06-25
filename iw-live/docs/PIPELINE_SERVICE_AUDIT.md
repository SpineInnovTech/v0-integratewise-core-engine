# Pipeline Service — Deployment Pipeline Audit

## Service Overview

**Service Name:** `integratewise-pipeline` (Worker)  
**Purpose:** Consolidated data normalization + Spine writes (Stage 2/5 in the data pipeline)  
**Deployment:** Manual `wrangler deploy --env=[dev|test|prod]`  
**Code Entry:** `src/index.ts` (Hono-based HTTP handler)  

---

## What It Does

The pipeline service is the **only service with write access to the Spine**. It:

1. **Receives normalized payloads** from connectors (Nango OAuth → Normalizer → Pipeline)
2. **Applies schema validation** via Zod
3. **Commits to Spine** (D1 write)
4. **Triggers downstream queues:**
   - `pipeline-process` → Knowledge indexing
   - `accelerator-trigger` → Signal acceleration
   - `memory-promote` → Memory consolidation

---

## Current Deployment Architecture

### Environments

| Env | DB | Queue Binding | Service Bindings | Log Level | Status |
|-----|----|----|--------|----------|--------|
| **dev** | `spine-dev` | 6 queues (dev) | KNOWLEDGE, MCP, INTELLIGENCE | debug | 🟢 Active |
| **test** | `spine-test` | 6 queues (test) | SPINE, BFF, KNOWLEDGE, MCP, INTELLIGENCE | info | 🟡 Config |
| **prod** | `spine-prod` | 6 queues (prod) | SPINE, BFF, KNOWLEDGE, MCP, INTELLIGENCE | warn | 🟡 Manual |

### Queue Consumers (Triggered)

```
├─ pipeline-process (max batch 10, timeout 30s)
├─ accelerator-trigger (max batch 10, timeout 30s)
└─ memory-promote (max batch 10, timeout 30s)
```

### Queue Producers (Outbound)

```
├─ PIPELINE_QUEUE → pipeline-process
├─ KNOWLEDGE_QUEUE → knowledge-ingest
├─ ACCELERATOR_QUEUE → accelerator-trigger
├─ INTELLIGENCE_QUEUE → intelligence-events
├─ DLQ_QUEUE → ops-dlq (dead letter)
├─ SIGNAL_QUEUE → signals
└─ MEMORY_PROMOTE → memory-promote
```

### Service Bindings (Inbound)

| Binding | Service | Purpose |
|---------|---------|---------|
| KNOWLEDGE | `integratewise-knowledge` | Index entities for search |
| MCP | `integratewise-mcp-connector` | MCP bridge for external agents |
| INTELLIGENCE | `integratewise-intelligence` | Signal generation |

### Data Bindings

- **D1 (Edge Cache):** `integratewise-spine-cache` (Read-write for caching)
- **KV Namespaces:** CACHE, KV_CACHE, SIGNAL_CACHE, SCHEMA_CACHE, METRICS

---

## Current Deployment Method

### Manual CLI Deploys

```bash
# Dev (default)
wrangler deploy

# Test
wrangler deploy --env=test

# Prod
wrangler deploy --env=prod
```

**Issues:**
- ❌ No GitHub Actions automation
- ❌ No version tracking (see: 1.2M+ versions)
- ❌ Manual coordination needed across 3 environments
- ❌ No rollback automation
- ❌ No environment parity enforcement

---

## Deployment Pipeline Gaps

### Missing Automation

| Layer | Missing | Impact |
|-------|---------|--------|
| **Trigger** | Git hook or GitHub Actions | Every code change requires manual deploy |
| **Build** | No CI checks (TypeScript, tests) | Breaking changes can deploy silently |
| **Test** | No pre-deploy test suite | No guarantee `test` env matches prod behavior |
| **Promotion** | Manual `--env=prod` flag | No gating between environments |
| **Rollback** | Manual version selection | Can't quickly recover from bad deploy |
| **Observability** | No deployment timeline | Hard to correlate deploys with issues |

---

## Current State vs. Production Ready

| Aspect | Current | Needed | Gap |
|--------|---------|--------|-----|
| **Version Control** | Manual per-env | Semantic versioning per env | 🔴 Critical |
| **CI/CD** | None | GitHub Actions workflow | 🔴 Critical |
| **Environment Parity** | Manual sync | Automated config validation | 🟡 High |
| **Rollback** | Manual | Auto-revert on errors | 🟡 High |
| **Observability** | Logs in Workers | Deployment + source mapping | 🟡 Medium |
| **Testing** | Vitest available | Pre-deploy test gate | 🟡 Medium |

---

## What Needs to Happen for M3+

### M3 (Immediate)
- [ ] Create `.github/workflows/deploy-pipeline.yml`
- [ ] Trigger on merge to `main` → deploy to `test`
- [ ] Manual gate for `prod` deploy (via workflow dispatch or release tags)
- [ ] Fix 1.2M+ version count (investigate runaway deploy process)

### M4 (Production Ready)
- [ ] Add `npm run test` pre-deploy check
- [ ] Add TypeScript typecheck gate
- [ ] Add environment parity validation (dev ≈ test ≈ prod)
- [ ] Implement semantic versioning (v1.x.y per env)
- [ ] Add deployment timeline + rollback dashboard

### M5+ (Mature)
- [ ] Canary deployments (1% → 10% → 100%)
- [ ] Automated rollback on error thresholds
- [ ] Cross-service deployment coordination (pipeline → knowledge → intelligence)
- [ ] Deployment approval workflows (for production)

---

## Next Action

Would you like me to:

1. **Create GitHub Actions workflow** for pipeline deployment?
2. **Investigate version bloat** (1.2M+ versions) and fix the runaway process?
3. **Add pre-deploy tests** (TypeScript + Vitest)?

