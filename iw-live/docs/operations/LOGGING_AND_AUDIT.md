# Logging & Audit Trail Architecture

**Continuity Bridge is Cloud-first.** All logs, audit events, and activity traces flow to Cloudflare infrastructure. There is no local file storage, no agent state, and no long-term client-side persistence.

## Two Classes of Logs

### 1. Tenant Activity Logs (Per-Tenant Isolated, User-Facing)

**Purpose:** Complete audit trail of every action within a tenant's workspace.

**Storage:** Cloudflare D1 (edge) + Supabase Fortress (SSOT).

**Tables:**
- `audit_logs` — who did what, when, and where
  - Columns: `id`, `tenant_id`, `actor_id`, `actor_type`, `action`, `entity_type`, `entity_id`, `metadata`, `timestamp`
  - Retention: Unlimited (per plan)
  - Accessible to: Tenant owner via governance/audit dashboard

- `governance_audit_log` — approval decisions and policy enforcement
  - Columns: `id`, `tenant_id`, `proposal_id`, `actor_id`, `decision`, `reason`, `confidence`, `timestamp`
  - Retention: Unlimited
  - Accessible to: Tenant owner, compliance/audit team

- `spine_audit_log` — Spine entity write operations
  - Columns: `id`, `tenant_id`, `entity_id`, `entity_type`, `change`, `actor_id`, `actor_type`, `reason`, `timestamp`
  - Retention: Unlimited
  - Accessible to: Tenant owner

- `twin_audit_events` — Twin reasoning sessions and decisions
  - Columns: `id`, `tenant_id`, `session_id`, `message`, `reasoning_trace`, `decision`, `timestamp`
  - Retention: 90 days (per plan) or unlimited (enterprise)
  - Accessible to: Tenant owner, Twin workbench

**Access Pattern:**
```typescript
// Read tenant's audit log
const logs = await spine.db.query(
  `SELECT * FROM audit_logs WHERE tenant_id = ? ORDER BY timestamp DESC LIMIT 100`,
  [tenantId]
);

// Write audit entry
await spine.db.execute(
  `INSERT INTO audit_logs (tenant_id, actor_id, actor_type, action, entity_type, entity_id, metadata, timestamp)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [tenantId, actorId, actorType, action, entityType, entityId, JSON.stringify(metadata), new Date().toISOString()]
);
```

### 2. System Logs (Operational, Internal)

**Purpose:** Infrastructure health, service errors, and performance monitoring.

**Storage:** Cloudflare Logpush (to customer's analytics service) or internal observability (Datadog/Grafana integration).

**Signals:**
- Worker errors and timeouts
- Queue consumer lag and failures
- D1 query performance
- Connector sync failures
- Pipeline stage errors

**Retention:** 30 days (operational), longer for compliance if configured.

**Access:** Founder via `/dashboard` (real-time system health metrics).

---

## Log Flow Architecture

### Flow 1: Direct Write (Fast Path)

```
Service (e.g., Act)
  ↓
  Executes action on entity
  ↓
  INSERT INTO audit_logs (tenant_id, actor_id, action, ...)
  ↓
  [D1 / Fortress]
  ↓
  Replicated to backup region
```

**Services that write directly:**
- `services/act` — action execution
- `services/govern` — approval decisions
- `services/intelligence` (Twin sessions) — reasoning events
- `services/gateway` — API route access

### Flow 2: Queue-Mediated Write (Batch Path)

```
Service (e.g., Connector)
  ↓
  Enqueue event (raw data, no transformation)
  ↓
  [Cloudflare Queue]
  ↓
  Pipeline consumer receives
  ↓
  Normalizes & logs
  ↓
  INSERT INTO audit_logs + INSERT INTO spine_audit_log
  ↓
  [D1 / Fortress]
```

**Services that queue:**
- `services/connector` — raw sync events
- `services/webhook-ingress` — inbound tool webhooks
- `services/connector-sync` — scheduled sync results
- `services/knowledge` — consolidation events

### Flow 3: Async Consolidation (Memory Lifecycle)

```
TriageBot (Knowledge)
  ↓
  Extract signal, propose categorization
  ↓
  Enqueue consolidation job
  ↓
  [Consolidation Queue]
  ↓
  Pipeline processes with confidence & reasoning
  ↓
  If approved: INSERT INTO memory_promotion_audit
  ↓
  If declined: INSERT INTO governance_audit_log (record decision)
  ↓
  [D1 / Fortress]
```

---

## Log Access Patterns

### For Tenant/Owner (Read-Only)

**Via Gateway API:**
```typescript
GET /api/v1/audit/logs?limit=100&offset=0
GET /api/v1/audit/logs/:id
```

**Returns (filtered by tenant_id):**
```json
{
  "logs": [
    {
      "timestamp": "2026-06-24T14:32:15Z",
      "actor": { "id": "user_123", "name": "Alice", "email": "alice@acme.com" },
      "action": "lead.qualify",
      "entity": { "id": "lead_456", "type": "lead", "name": "ACME Inc" },
      "result": "success",
      "metadata": { "reason": "High intent signal detected" }
    }
  ]
}
```

### For Founder (System Health)

**Via `/dashboard` (read-only):**
- Last 24h activity count
- System service status (6 services: Spine, Twin, Connector, Knowledge, Gateway, Pipeline)
- API latency (p50, p95, p99)
- Worker uptime %
- D1 query health
- Pending approvals count

---

## Audit Trail Retention & Compliance

| Plan | Audit Retention | Governance Log | Twin Sessions | Accessible To |
|------|-----------------|----------------|---------------|---------------|
| Free | 30 days | 30 days | 7 days | Tenant owner |
| Starter | 90 days | 90 days | 30 days | Tenant owner |
| Pro | 1 year | 1 year | 90 days | Tenant owner + team |
| Enterprise | Unlimited | Unlimited | Unlimited | Tenant owner, team, compliance officer |

**GDPR/SOC2 Compliance:**
- Per-tenant isolation enforced at SQL level (`WHERE tenant_id = ?`)
- Audit logs cannot be deleted (only admins with VAULT_KEY can archive old data)
- All writes include timestamp and actor (immutable record)
- Change tracking via `spine_audit_log` for data lineage

---

## Error Handling & Logging

### In Services

**✅ DO:**
```typescript
try {
  const result = await connector.sync(tenantId);
  await spine.db.execute(
    `INSERT INTO audit_logs (tenant_id, actor_id, action, entity_type, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [tenantId, 'system', 'connector.sync', 'connector', JSON.stringify({ result, duration: elapsed })]
  );
} catch (err) {
  // Log error to audit (won't fail silently)
  await spine.db.execute(
    `INSERT INTO audit_logs (tenant_id, actor_id, action, metadata)
     VALUES (?, ?, ?, ?)`,
    [tenantId, 'system', 'connector.sync.error', JSON.stringify({ error: err.message })]
  );
  throw err; // Fail loud
}
```

**❌ DON'T:**
```typescript
// ❌ No console.log without audit trail
console.error("Sync failed:", err);

// ❌ No local file storage
fs.appendFileSync('/logs/sync.log', `Error: ${err.message}`);

// ❌ No cross-tenant data leaks
const logs = await db.query('SELECT * FROM audit_logs'); // ← Missing WHERE tenant_id
```

### Error Propagation

All errors flow through the same audit trail:
1. **Service detects error** → INSERT INTO audit_logs with error metadata
2. **Error bubbles to governance** → governance_audit_log records policy violation (if applicable)
3. **Frontend receives error** → user sees sanitized message ("Sync failed. Contact support.") + error ID for tracking
4. **Founder sees in dashboard** → system health shows error count in last 24h

---

## Monitoring & Alerting

**Real-time signals available on `/dashboard`:**
- **Red alert:** Any service down, connector sync failure, D1 unavailable
- **Yellow alert:** API latency > 1s, queue lag > 5min, approval queue > 50 items
- **Green:** All systems operational

**Logging endpoint for integrators:**
```bash
curl -H "Authorization: Bearer FOUNDER_TOKEN" \
  https://gateway.integratewise.ai/api/v1/admin/health/logs
```

Returns system state JSON with 24h activity summary.

---

## Best Practices

1. **Always filter by tenant_id** — Never query across tenants
2. **Log every material action** — Approvals, executions, errors, policy decisions
3. **Use structured metadata** — JSON object with context, not freeform strings
4. **Fail loud** — If audit write fails, fail the main transaction (don't silently ignore)
5. **No sensitive data in logs** — Redact PII, API keys, credentials (log entity ID, not content)
6. **Timestamp in UTC** — All times in ISO 8601 format, always UTC
7. **Correlation IDs** — Tie related logs together with `correlation_id` field

---

## Reference

- **Audit Tables Schema:** `services/pipeline/migrations/` (all audit table definitions)
- **Read Logs API:** `services/gateway/src/routes/audit.ts`
- **Write Logs:** Each service implements logging at the point of action (see `services/act`, `services/govern`)
- **Dashboard:** `apps/web/src/pages/FounderDashboard.tsx` (real-time metrics)
- **Compliance:** GDPR, SOC2, and HIPAA all rely on this audit trail
