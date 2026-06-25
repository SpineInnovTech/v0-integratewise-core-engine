# n8n Integration Design

## Status

**n8n is currently UNREACHABLE** on the VPS (`<N8N_VPS_HOST>:5678`).
Connection test returned `000` (connection refused/timeout).

## Architecture

```
Hermes Worker ──▶ n8n API (Hostinger VPS)
        │              │
        │              ▼
        │         [Workflow Execution]
        │              │
        ▼              ▼
   Fallback:      Outcome → Spine
   Durable Object  Outcome → CouchDB
   Direct Service  SSE → Frontend
```

## How Hermes Calls n8n

### 1. Workflow Execution

```typescript
POST ${N8N_BASE_URL}/api/v1/workflows/${workflowId}/execute
Headers:
  Content-Type: application/json
  X-N8N-API-KEY: ${N8N_API_KEY}
Body:
  {
    "data": {
      "taskId": "...",
      "actionId": "...",
      "tenantId": "...",
      "payload": { ... }
    }
  }
```

### 2. Workflow Deployment

```typescript
POST ${N8N_BASE_URL}/api/v1/workflows
Headers:
  Content-Type: application/json
  X-N8N-API-KEY: ${N8N_API_KEY}
Body:
  { id, name, active, nodes[], connections{} }
```

### 3. Workflow Activation

```typescript
PATCH ${N8N_BASE_URL}/api/v1/workflows/${workflowId}
Body: { active: true | false }
```

## Environment Variables

| Variable            | Value                        | Purpose            |
| ------------------- | ---------------------------- | ------------------ |
| `N8N_BASE_URL`      | `http://<N8N_VPS_HOST>:5678` | n8n instance URL   |
| `N8N_API_KEY`       | (Cloudflare Secret)          | API authentication |
| `N8N_FALLBACK_MODE` | `durable_object`             | Fallback strategy  |

## Fallback Strategy

When n8n is unavailable, Hermes automatically falls back through this chain:

### Priority 1: Durable Object Execution

- `ExecutionEngineDO` runs the workflow logic
- Stateful, supports long-running tasks
- Ideal for timeouts > 30s

### Priority 2: Direct Service Mesh

- Simple CRUD ops go directly to SPINE
- No orchestration overhead
- Fastest path for entity mutations

### Priority 3: Queue Deferral

- `OUTCOMES_QUEUE` holds the task
- Background worker picks it up when n8n recovers
- Guaranteed delivery via Cloudflare Queues

### Code Path

```typescript
// executor.ts :: selectBackend()
async function selectBackend(task, env) {
  const n8nHealthy = await isN8nHealthy(env);
  if (n8nHealthy && task.payload.actionType.startsWith("workflow.")) {
    return "n8n";
  }
  if (task.payload.timeoutMs > 30000) return "durable_object";
  if (isSimpleCrud(task)) return "direct";
  return env.OUTCOMES_QUEUE ? "queued" : "durable_object";
}
```

## Health Checking

Hermes checks n8n health on:

1. Worker startup (cold start)
2. Before each workflow execution (3s timeout)
3. `/health` endpoint (for monitoring)

```typescript
async function isN8nHealthy(env) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${env.N8N_BASE_URL}/healthz`, {
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  }
}
```

## Recovery Behavior

| Scenario                     | Behavior                                      |
| ---------------------------- | --------------------------------------------- |
| n8n down during execution    | Failover to DO execution, record lineage      |
| n8n down at orchestrate time | Store as pending workflow, deploy on recovery |
| n8n returns 5xx              | Retry once, then fallback                     |
| n8n returns 4xx              | No retry, log error, route to HITL            |

## Action Items

1. **Investigate Hostinger VPS**: Check if n8n container is running

   ```bash
   ssh user@<N8N_VPS_HOST>
   docker ps | grep n8n
   docker logs n8n --tail 100
   ```

2. **Verify API Key**: Ensure `N8N_API_KEY` is set in Cloudflare Secrets Store

3. **Add Monitoring**: Set up health check cron to alert when n8n is down > 5 min

4. **VPN/Tunnel Option**: If Hostinger blocks direct access, use Cloudflare Tunnel

## Security Notes

- n8n API key is stored in Cloudflare Secrets Store, never in code
- Hostinger IP is HTTP (not HTTPS) — consider Cloudflare Tunnel for encryption
- Workflow credentials are passed per-request, never cached in KV
