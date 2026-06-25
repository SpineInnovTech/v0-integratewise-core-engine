# @integratewise/hermes-spine-memory

CouchDB memory substrate for IntegrateWise.

## Responsibilities

- **CouchDB HTTP client** — fetch-based, works in Node.js, Workers, and browser
- **Namespace isolation** — `personal:user:{id}` vs `org:{tenant_id}`
- **Continuity Object CRUD** — 6 Understanding Object schemas
- **Twin context switching** — route memory queries to the correct namespace

## Install

```bash
pnpm add @integratewise/hermes-spine-memory
```

## Usage

```typescript
import { CouchDbClient, ContinuityObjectStore, routeTwinMemory } from "@integratewise/hermes-spine-memory";

const client = new CouchDbClient({
  url: process.env.COUCHDB_URL!,
  username: "hermes",
  password: process.env.COUCHDB_PASSWORD!,
});

const store = new ContinuityObjectStore(client);

// Create an organizational synthesis
const { id, rev } = await store.create({
  type: "organizational-synthesis",
  domain: "revenue",
  content: { theme: "Q2 churn spike", insights: [...], recommendedActions: [...], stakeholderIds: [...], timeframe: { from: "2026-04-01", to: "2026-06-30" } },
  userId: "usr_abc",
  scope: "org",
  tenantId: "tenant_xyz",
});

// Route Twin memory context
const { namespace } = routeTwinMemory({
  requestedScope: "personal",
  userId: "usr_abc",
  tenantId: "tenant_xyz",
});

const memories = await store.recent(namespace.scope, namespace.subjectId, { limit: 10 });
```

## File Structure

```
src/
  index.ts              — main exports
  types.ts              — TypeScript types & schemas
  client.ts             — CouchDbClient (fetch-based HTTP wrapper)
  namespaces.ts         — namespace resolution & Twin routing logic
  continuity-objects.ts — ContinuityObjectStore CRUD
```

## CouchDB Setup

See [COUCHDB_SETUP.md](./COUCHDB_SETUP.md) for CORS, auth, and compaction configuration.

## Twin Memory Routing

See [TWIN_MEMORY_ROUTING.md](./TWIN_MEMORY_ROUTING.md) for integration with `services/think`.
