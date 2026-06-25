# Tool Connection Flow — Complete Journey

When a user connects their first tool (e.g., Salesforce), here's exactly what happens across the platform.

## Quick Summary

```
User clicks "Connect Salesforce"
    ↓
Frontend requests Nango session token
    ↓
Nango Connect UI opens (OAuth modal)
    ↓
User authorizes Salesforce
    ↓
Nango posts auth.created webhook
    ↓
Loader writes D1 status + triggers Creamy sync
    ↓
Connector-Sync fetches Salesforce data
    ↓
Normalizer pipeline (NA0-NA5) transforms data
    ↓
Spine stores canonical entities
    ↓
Twin has data to reason over
    ↓
User sees proposals in "My Desk"
```

---

## Step-by-Step: The Complete Flow

### 1. Frontend Initiates Connection

**File:** `apps/web/src/components/connectors/ConnectorsStep.tsx`

```typescript
// User clicks "Connect Salesforce"
// Frontend calls:
POST /api/v1/connector/nango/session
{
  "integration_id": "salesforce"
}
```

**Headers:**
- `x-tenant-id`: The user's tenant ID (from auth context)

---

### 2. Backend Creates Nango Session Token

**File:** `services/connector/src/routes/internal.ts` → `/internal/nango/session`

```typescript
app.post("/internal/nango/session", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  
  // Convert "salesforce" → "salesforce" (from toNangoIntegrationId)
  const nangoIntegrationId = toNangoIntegrationId(integration_id);
  
  // Call Nango API to create a session
  const session = await createConnectSession(
    { NANGO_SECRET_KEY: c.env.NANGO_SECRET_KEY },
    {
      integrationId: nangoIntegrationId,        // "salesforce"
      connectionId: `${tenantId}`,              // unique per tenant+tool
      metadata: { tenant_id: tenantId }
    }
  );
  
  return {
    session_token: session.token,               // short-lived, for Nango UI
    expires_at: session.expires_at,
    integration_id: nangoIntegrationId
  };
});
```

**What Nango does:**
- Creates a short-lived session token
- Generates an OAuth URL for Salesforce
- Returns token to frontend

---

### 3. Frontend Shows Nango Connect UI

**File:** `apps/web/src/components/connectors/NangoConnect.tsx`

```typescript
// Frontend receives session_token
// Opens Nango Connect UI with the token

import { Nango } from "@nangohq/frontend";

const nango = new Nango();
await nango.openConnectUI({
  connectSessionToken: session_token,
  onConnect: (connection) => {
    console.log("Connected!", connection);
    // User has authorized Salesforce
  }
});
```

**What user sees:**
1. Nango modal appears
2. "Authorize with Salesforce" button
3. Redirected to Salesforce login
4. Grants permissions
5. Returns to app

---

### 4. Nango Posts `auth.created` Webhook

When the OAuth is complete, Nango POSTs to your backend:

**Endpoint:** `POST /nango/webhook` (services/loader)

**Webhook body:**
```json
{
  "type": "auth.created",
  "connectionId": "tenant-uuid",
  "providerConfigKey": "salesforce",
  "connection": {
    "id": "nango-connection-id",
    "credentials": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```

**File:** `services/loader/src/index.ts` → `/nango/webhook`

```typescript
app.post("/nango/webhook", async (c) => {
  const event = JSON.parse(rawBody);
  const eventType = event.type;                    // "auth.created"
  const tenantId = event.connectionId;            // tenant-uuid
  const provider = event.providerConfigKey;       // "salesforce"
  
  if (eventType === "auth.created") {
    // STEP A: Get schema for this connector
    const schemaEntityTypes = await getSchemaEntityTypes(
      c.env, 
      tenantId, 
      provider  // "salesforce"
    );
    
    // STEP B: Write D1 status (Cloudflare-only)
    // Update tenant_spine_config.connected_connectors array
    // Create row in D1 connectors table (token store)
    await db.prepare(
      `UPDATE tenant_spine_config 
       SET connected_connectors = ? 
       WHERE tenant_id = ?`
    ).bind(JSON.stringify([...connList, provider]), tenantId).run();
    
    // STEP C: Trigger Creamy sync immediately
    // (don't wait for 6h cron)
    await c.env.CONNECTOR_SYNC.fetch(
      new Request(`http://connector-sync/api/sync/${tenantId}`, {
        method: "POST",
        body: JSON.stringify({
          provider: "salesforce",
          phase: "creamy",           // initial full load
          entities: schemaEntityTypes
        })
      })
    );
  }
});
```

---

### 5. Connector-Sync Fetches Tool Data

**File:** `services/connector-sync/src/index.ts`

```typescript
// Receives the sync request
// Resolves Nango connection (gets access_token automatically)
const nangoConnection = await getNangoConnection(
  c.env,
  tenantId,
  "salesforce"
);

// Calls the Salesforce connector adapter
// (using the Nango access token)
const results = await salesforceConnector.sync(
  nangoConnection.credentials.access_token,
  schemaEntityTypes
);

// Results: [{type: "contact", data: {...}}, {type: "lead", data: {...}}]
```

**What happens:**
- Fetches ALL contacts, leads, accounts from Salesforce (creamy = full load)
- Returns structured data matching schema entity types

---

### 6. Normalizer Pipeline (NA0-NA5)

Data goes through 8-stage pipeline:

**File:** `services/normalizer/src/normalizer-accelerator.ts`

```typescript
// NA0: Schema Detector
// Maps "Salesforce Contact" → "person" entity type

// NA1: Canonical Transformer
// Applies traits: is_customer=true, source=salesforce

// NA2: SSOT Binder
// Creates stable UUID: person:contact:salesforce:001A000000...

// NA3: Lineage Manager
// Tracks: this came from Salesforce Contact ID xyz at timestamp T

// NA4: Relation Binder
// Links: Contact → Company (relationship edge)

// NA5: Spine Publisher
// Enqueues to PIPELINE_QUEUE for commit to Spine
```

Each stage validates and enriches. Final output: canonical entities ready for Spine.

---

### 7. Pipeline Commits to Spine

**File:** `services/pipeline/src/spine-publisher.ts`

```typescript
// For each normalized entity:
await db.prepare(`
  INSERT INTO entities (id, tenant_id, type, data, created_at)
  VALUES (?, ?, ?, ?, datetime('now'))
  ON CONFLICT(id) DO UPDATE SET data=excluded.data
`).bind(entityId, tenantId, entityType, JSON.stringify(entityData)).run();

// For each relationship:
await db.prepare(`
  INSERT INTO relationships (source_id, target_id, tenant_id, type, metadata)
  VALUES (?, ?, ?, ?, ?)
`).bind(sourceId, targetId, tenantId, relType, metadata).run();
```

**Spine now contains:**
- 500 Salesforce contacts → 500 canonical "person" entities
- 50 Salesforce leads → 50 canonical "lead" entities
- Relationships: person → company, lead → opportunity, etc.

---

### 8. Twin Reasons Over Spine Data

**File:** `services/intelligence/src/index.ts` + `apps/web/src/components/l1/twin/twin-workbench.tsx`

Twin now has live Salesforce data grounded in Spine:

```typescript
// Twin reads Spine (latest data)
const contacts = await spine.query("SELECT * FROM entities WHERE type='person' AND tenant_id=?", [tenantId]);

// Twin uses gpt-5-mini to reason
const proposal = await twin.propose({
  context: "These are our Salesforce contacts...",
  task: "Identify high-priority leads for outreach",
  data: contacts
});

// Proposal: {
//   action: "send_email",
//   to: ["contact-id-123", "contact-id-456"],
//   reasoning: "These leads match our ICP: high company size, active engagement"
// }
```

---

### 9. Owner Approves in "My Desk"

**File:** `apps/web/src/components/l1/domains/bizops/my-desk.tsx`

```typescript
// Owner sees proposal
// Clicks "Approve"
// Sends to Act service → Connector → Salesforce

// Activity log records:
// - Proposal ID: prop-456
// - Status: approved
// - Approved by: owner-id
// - Action: send_email to 2 contacts
// - Result: success
```

---

## Files Involved (Quick Reference)

| Step | Service | File | What |
|------|---------|------|------|
| 1 | Web | `ConnectorsStep.tsx` | User clicks "Connect" |
| 2 | Connector | `routes/internal.ts` | Create Nango session |
| 3 | Nango | N/A | OAuth modal |
| 4 | Loader | `index.ts` | Webhook: auth.created |
| 5 | Connector-Sync | `index.ts` | Fetch tool data |
| 6 | Normalizer | `normalizer-accelerator.ts` | NA0-NA5 pipeline |
| 7 | Pipeline | `spine-publisher.ts` | Write to Spine |
| 8 | Intelligence | `index.ts` | Twin reasoning |
| 9 | Web | `my-desk.tsx` | Owner approval |

---

## Key Design Decisions

### Per-Tenant Isolation
- `connectionId` in Nango = `tenant_id` (one connection per tenant+tool)
- All queries filter by `tenant_id`
- Credentials stored per-tenant in Nango vault (encrypted at rest)

### Immediate Creamy Sync (No Cron Wait)
- When auth.created webhook arrives, sync triggers immediately
- User sees data within seconds, not hours
- Improves GTM motion: "authorize → see data → start using"

### D1-Native Status
- `tenant_spine_config.connected_connectors` = list of active tools
- `connectors` table = token store + sync status
- No Supabase for connector state (Cloudflare-only plane)

### Fail-Loud on Audit
- Every step logs to audit_logs
- If Spine write fails, sync stops and logs error
- Owner sees "Sync failed on 50 contacts" (not silent degradation)

---

## Troubleshooting

### "Nango not configured" error
Check `services/connector/wrangler.toml`:
```toml
[env.production.vars]
NANGO_SECRET_KEY = "..."
NANGO_BASE_URL = "https://api.nango.dev"
```

### User connects tool but no data appears
1. Check `connectors` table (D1) — is status="connected"?
2. Check `audit_logs` — did Creamy sync trigger?
3. Check normalizer output — any validation errors?
4. Check Spine — did pipeline commit write succeed?

### "Invalid Nango signature"
Webhook signature verification failed. Check:
- `NANGO_WEBHOOK_SECRET` matches Nango dashboard
- Request body wasn't modified in transit
- Webhook was recent (< 5 min old)

---

## External References

- **Nango Docs:** https://docs.nango.dev
- **Nango API:** https://api.nango.dev/
- **Nango Integrations:** https://nango.dev/integrations
