# Twin Memory Context Routing

## Overview

The Digital Twin reads from **two memory substrates** depending on context:

| Scope      | Database Pattern           | Contents                                   |
| ---------- | -------------------------- | ------------------------------------------ |
| `personal` | `iw_mem_personal_{userId}` | Private twin chats, personal notes, drafts |
| `org`      | `iw_mem_org_{tenantId}`    | Shared decisions, governance, ops memory   |

## Routing Logic

```typescript
import { routeTwinMemory } from "@integratewise/hermes-spine-memory";

const result = routeTwinMemory({
  requestedScope: "personal", // from UI toggle or intent classifier
  userId: "usr_abc123",
  tenantId: "tenant_xyz789",
  currentScope: "org", // last known scope for this session
});

// result.namespace.dbName  → "iw_mem_personal_usr_abc123"
// result.switched          → true
// result.previousScope     → "org"
```

### Decision Rules

1. **Explicit preference wins**
   - If `requestedScope` is provided, use it.
   - UI toggle: "Personal Mode" / "Workspace Mode"
   - Intent classifier: keywords like "my", "my personal", "just for me" → `personal`

2. **Default when no preference**
   - If `tenantId` exists → `org`
   - Otherwise → `personal`

3. **Context switch detection**
   - Track `currentScope` in the Twin's SSE session state.
   - On switch, fetch memories from the new namespace.
   - Optionally: surface a brief transition summary from the previous scope.

## Integration Points

### 1. `POST /v1/twin/chat` (cognitive-brain.ts)

Current request body:

```json
{
  "message": "...",
  "entity_id": "...",
  "history": [...],
  "model": "..."
}
```

**Proposed addition**:

```json
{
  "message": "...",
  "entity_id": "...",
  "history": [...],
  "model": "...",
  "memory_context": "personal"
}
```

In the chat handler:

```typescript
const memoryContext = body.memory_context || "org";
const { namespace, switched } = routeTwinMemory({
  requestedScope: memoryContext,
  userId,
  tenantId,
});

// Load continuity objects from the resolved namespace
const store = new ContinuityObjectStore(couchClient);
const memories = await store.recent(namespace.scope, namespace.subjectId, { limit: 10 });

// Inject into system prompt
const memoryBlock = memories
  .map((m) => `- [${m.type}] ${m.domain}: ${JSON.stringify(m.content).slice(0, 200)}`)
  .join("\n");
```

### 2. `GET /v1/twin/memories`

Currently queries Supabase `decision_memory`. Extend to query CouchDB:

```typescript
app.get("/v1/twin/memories", async (c) => {
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id");
  const scope = (c.req.query("scope") as MemoryScope) || "org";

  const { namespace } = routeTwinMemory({ requestedScope: scope, userId, tenantId });
  const store = new ContinuityObjectStore(couchClient);
  const memories = await store.recent(namespace.scope, namespace.subjectId, { limit: 20 });

  return c.json({ scope, memories });
});
```

### 3. `GET /v1/twin/proactive`

Proactive suggestions currently pull from Supabase only. Add CouchDB layer:

```typescript
// After fetching recentDecisions + activeDrifts
const { namespace } = routeTwinMemory({ userId, tenantId });
const store = new ContinuityObjectStore(couchClient);
const recentObjects = await store.recent(namespace.scope, namespace.subjectId, { limit: 5 });
```

## Schema Mapping

| Twin Chat Memory Block | Continuity Object Type      |
| ---------------------- | --------------------------- |
| Recent decisions       | `governance-outcome`        |
| Active workflows       | `operational-realization`   |
| Deployment status      | `deployment-lineage`        |
| Customer health        | `customer-continuity-state` |
| Strategic themes       | `organizational-synthesis`  |
| State transitions      | `continuity-transition`     |

## Implementation Priority

1. **P0**: Accept `memory_context` in `POST /v1/twin/chat`
2. **P0**: Route to correct CouchDB namespace
3. **P1**: Surface top-N recent continuity objects in system prompt
4. **P1**: Update `GET /v1/twin/memories` to read from CouchDB
5. **P2**: Context-switch animations / summaries in UI
