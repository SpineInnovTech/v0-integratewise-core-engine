# Twin + OpenRouter Deployment Status

**Date:** 2026-06-09
**Status:** ✅ Ready for Deployment

---

## Configuration Verification

### ✅ Intelligence Worker

**File:** `services/intelligence/wrangler.toml`

```toml
name = "intelligence"
account_id = "a1bbbb12a32cdbb68dd170b09fe8b5f3"  ✅
route = { pattern = "intelligence.dev.integratewise.ai", custom_domain = true }  ✅

[[secrets_store_secrets]]
binding = "OPENROUTER_API_KEY"  ✅
store_id = "1fd83fc5881e4cd296ae3c2fbe80693c"
secret_name = "OPENROUTER_API_KEY"
```

**Env Interface:** ✅ Fixed (added `OPENROUTER_API_KEY: string`)

**Endpoint:** `POST /v1/ai/agent` ✅

---

### ✅ Twin Orchestrator

**File:** `services/twin-orchestrator/wrangler.toml`

```toml
name = "twin-orchestrator"
account_id = "a1bbbb12a32cdbb68dd170b09fe8b5f3"  ✅ (just added)
route = { pattern = "twin.dev.integratewise.ai", custom_domain = true }  ✅

[triggers]
crons = ["*/5 * * * *"]  ✅ Every 5 minutes

[[services]]
binding = "INTELLIGENCE"
service = "intelligence"  ✅

[[d1_databases]]
binding = "D1"
database_name = "integratewise-spine-cache"  ✅
database_id = "ed1f534a-df1e-4783-8a74-8d6d70d067ff"

[[kv_namespaces]]
binding = "CACHE"
id = "18aa20dfeb304f0ba592d9070964dd31"  ✅
```

---

## Fixes Applied

1. ✅ Added `OPENROUTER_API_KEY: string` to intelligence Env interface
2. ✅ Added `account_id = "a1bbbb12a32cdbb68dd170b09fe8b5f3"` to twin-orchestrator

---

## Deploy Commands

```bash
# 1. Deploy Intelligence Worker
cd services/intelligence
unset CLOUDFLARE_API_TOKEN
wrangler deploy --env dev

# 2. Deploy Twin Orchestrator
cd ../twin-orchestrator
unset CLOUDFLARE_API_TOKEN
wrangler deploy --env dev
```

---

## Post-Deployment Verification

### 1. Check Intelligence Worker

```bash
# Health check
curl https://intelligence.dev.integratewise.ai/health

# Expected response:
{
  "status": "ok",
  "service": "intelligence",
  "components": ["think", "act", "govern", "agents", "ai-router"],
  "ai": {
    "workers_ai": "available",
    "openrouter": "configured",  ← Should show "configured"
    "gateway": "..."
  }
}
```

### 2. Check Twin Orchestrator

```bash
# Health check
curl https://twin.dev.integratewise.ai/health

# Expected response:
{
  "status": "ok",
  "service": "twin-orchestrator",
  "role": "cognitive-orchestrator",
  "capabilities": ["observe", "reason", "propose", "coordinate", "learn"],
  "infrastructure": {
    "mcp_connector": "bound",
    "intelligence": "bound",  ← Should show "bound"
    "pipeline": "bound",
    "knowledge": "bound",
    "continuity": "bound"
  }
}
```

### 3. Test Twin Observe Loop

```bash
# Manual trigger (don't wait for cron)
curl -X POST https://twin.dev.integratewise.ai/v1/twin/observe \
  -H "x-tenant-id: iw-customer-zero" \
  -H "Content-Type: application/json"

# Expected response structure:
{
  "success": true,
  "data": {
    "context": {
      "memory": {...},
      "signals": {...},
      "proposals": {...},
      "operations": {...},
      "time": {...}
    },
    "reasoning": {
      "timestamp": "...",
      "context_summary": "...",
      "observations": [...],
      "concerns": [...],
      "opportunities": [...],
      "suggested_actions": [...]
    },
    "proposals": [...]
  }
}
```

### 4. Monitor Cron Execution

```bash
# Watch Twin logs
wrangler tail twin-orchestrator --env dev

# Look for (every 5 minutes):
[Twin Orchestrator] Scheduled trigger: */5 * * * *
[Twin] Context built: { memory_items: X, signals: Y, proposals: Z }
[Twin] Reasoning complete: { observations: N, concerns: M, suggested_actions: P }
[Twin] Proposals created: X
[Twin] Observe loop complete
```

### 5. Check OpenRouter Usage

```bash
# Intelligence worker logs
wrangler tail intelligence --env dev

# Look for:
POST /v1/ai/agent
OpenRouter agent response: { model: "...", provider: "openrouter-agent", usage: {...} }
```

---

## Routing Architecture

```
User/System
    │
    ├─→ https://twin.dev.integratewise.ai
    │   ├─ GET  /health
    │   └─ POST /v1/twin/observe
    │
    └─→ https://intelligence.dev.integratewise.ai
        ├─ GET  /health
        └─ POST /v1/ai/agent  ← OpenRouter Agents endpoint
```

**Service Binding (Internal):**

```
Twin Orchestrator
    ↓ (env.INTELLIGENCE)
Intelligence Worker
    ↓ (HTTPS)
OpenRouter API
    ↓ (ecosystem agent)
Multiple Models (coordinated)
```

---

## Custom Domains Status

All custom domains configured:

- ✅ `intelligence.dev.integratewise.ai` → intelligence worker
- ✅ `twin.dev.integratewise.ai` → twin-orchestrator worker
- ✅ `gateway.dev.integratewise.ai` → gateway worker

**Test environments:**

- `intelligence.test.integratewise.ai`
- `twin.test.integratewise.ai`

**Production:**

- `intelligence.integratewise.ai`
- `twin.integratewise.ai`

---

## Known Good Configuration

Based on working workers (gateway, pipeline, mcp-connector):

```toml
name = "worker-name"
account_id = "a1bbbb12a32cdbb68dd170b09fe8b5f3"  ← Required
main = "src/index.ts"
compatibility_date = "2026-06-09"
compatibility_flags = ["nodejs_compat"]

route = { pattern = "subdomain.dev.integratewise.ai", custom_domain = true }
```

Both intelligence and twin-orchestrator now match this pattern ✅

---

## What Could Go Wrong

### Issue: "Worker not found"

**Cause:** Missing `account_id`
**Fix:** ✅ Added to twin-orchestrator

### Issue: "Route already exists"

**Cause:** Multiple workers claiming same route
**Check:**

```bash
wrangler deployments list --name intelligence
wrangler deployments list --name twin-orchestrator
```

### Issue: "Service binding failed"

**Cause:** Intelligence worker not deployed yet
**Fix:** Deploy intelligence first, then twin-orchestrator

### Issue: "OPENROUTER_API_KEY undefined"

**Cause:** Secret not created in Secrets Store
**Check:**

```bash
# List secrets
wrangler secret list --name intelligence

# Should show:
OPENROUTER_API_KEY
```

If missing, add it:

```bash
cd services/intelligence
wrangler secret put OPENROUTER_API_KEY
# Paste key when prompted
```

---

## Deployment Order

**IMPORTANT:** Deploy in this order to avoid service binding errors:

1. ✅ Intelligence worker (provides `/v1/ai/agent` endpoint)
2. ✅ Twin orchestrator (depends on intelligence via service binding)

---

## Next: Deploy

```bash
cd /Users/nirmal/Github/integratewise-live

# 1. Intelligence
cd services/intelligence
unset CLOUDFLARE_API_TOKEN
wrangler deploy --env dev

# 2. Twin
cd ../twin-orchestrator
unset CLOUDFLARE_API_TOKEN
wrangler deploy --env dev
```

Then verify with health checks above.

**Ready to deploy!** ✅
