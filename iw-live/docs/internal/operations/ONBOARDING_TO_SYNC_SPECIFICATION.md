## Surface Boundary Note

- Operational Workbench = the primary work surface; left sidebar nav; Twin sidebar pops out when needed.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- Flow C approvals do not terminate in a generic "Knowledge UI"; they route through governance review into approved knowledge.

---

# Onboarding to Sync Specification

## Tenant Onboarding Flow

```
Signup → Spine DB Auth → Tenant Created → Domain Selection → Connector OAuth
    ↓
Schema Resolution (department × industry) → Tenant Spine Config
    ↓
Connector Connected → Flow Classification (A/B/C) → Initial Hydration
    ↓
Creamy Load (30 days) → Pipeline → Spine → Entity 360 → Twin Active
```

## Step 1: Tenant Creation

- Spine DB auth creates user
- `provision_tenant_spine` RPC creates tenant record
- Tenant bucket computed: B0 (no data)

## Step 2: Domain Selection

- User selects department (CS, Sales, BizOps, etc.)
- Optional: industry selection (SaaS, Healthcare, etc.)
- Schema resolved: `getSpineConfig(industry, department)`
- Entity types and priority fields determined

## Step 3: Connector OAuth

- User selects connector from IntegrationsHub (filtered by domain)
- OAuth flow: `/api/v1/connectors/:provider/authorize`
- Callback: tokens encrypted and stored
- Flow classified: A (structured), B (context), C (AI)

## Step 4: Initial Hydration

### Flow A/B: Creamy Sync

```
triggerInitialConnectorHydration(env, tenantId, provider)
  → Loader extracts 30 days of data
  → Pipeline queue receives records
  → 8-stage normalizer processes each
  → Spine-v2 writes to schema-routed tables
  → Tenant bucket: B0 → B2 (creamy done)
```

### Flow C: D1 Buffer

```
initializeD1Buffer(tenantId, provider, env)
  → D1 buffer created for AI source
  → Triage rules applied
  → Approved content → Triage Bot review → approved knowledge
  → Tenant bucket stays at current level
```

## Step 5: Progressive Hydration (B0 → B7)

| Bucket | Trigger          | What Happens                  |
| ------ | ---------------- | ----------------------------- |
| B0→B1  | Domain selected  | Schema resolved               |
| B1→B2  | Creamy sync done | 30 days of data in Spine      |
| B2→B3  | Full sync done   | Complete historical data      |
| B3→B4  | Flow B connected | Context (emails, docs) linked |
| B4→B5  | Signals active   | Twin triggers start firing    |
| B5→B6  | Flow C active    | AI memory feeding Entity 360  |
| B6→B7  | All layers       | Full cognitive capability     |

## Sync Entitlements by Plan

| Plan         | Sync Interval | Max Records/Sync | Connectors | Delta Sync |
| ------------ | ------------- | ---------------- | ---------- | ---------- |
| Free         | 24h           | 1,000            | 1          | Yes        |
| Starter      | 4h            | 5,000            | 3          | Yes        |
| Professional | 1h            | 25,000           | 10         | Yes        |
| Enterprise   | 15min         | 100,000          | Unlimited  | Yes        |
