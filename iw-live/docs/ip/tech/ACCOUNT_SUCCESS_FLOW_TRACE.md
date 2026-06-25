# Account Success Flow Trace

> Step-by-step trace of a Salesforce account flowing through the entire IntegrateWise pipeline.

---

## Current Surface-Binding Doctrine

- Operational Workbench = the primary work surface; left sidebar nav; Twin sidebar pops out when needed.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- OpenWebUI is not the customer-facing product shell.
- Twin / OpenWebUI runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

Use older L1/L2 / workspace / knowledge-UI language in this file through that boundary if any historical phrasing remains.

---

## Scenario

A CSM connects their Salesforce instance. The account "Acme Corporation" flows through the system and surfaces an insight in the CSM Hub: "Acme Corp usage dropped 40% — renewal in 45 days."

---

## Step 1: OAuth Connection

```
User clicks "Connect Salesforce" → OAuth redirect → Salesforce login → Authorization grant
→ Callback to /api/connectors/salesforce/callback
→ Access token + refresh token encrypted and stored in connector_credentials table
→ Connector status set to "active" for workspace_id = ws_abc123
```

| Detail   | Value                                                  |
| -------- | ------------------------------------------------------ |
| Worker   | `connector-auth`                                       |
| Duration | ~3s (user interaction)                                 |
| Output   | Encrypted tokens in Spine DB, connector record created |

---

## Step 2: Loader — Fetch from Salesforce

```
Loader Worker triggered by connector activation event
→ Reads connector config: object = "Account", fields = [Name, Industry, AnnualRevenue, ...]
→ Calls Salesforce REST API: GET /services/data/v59.0/query?q=SELECT+...+FROM+Account
→ Receives 847 account records (paginated, 200 per page)
→ Each record wrapped in envelope: { source: "salesforce", workspace_id: "ws_abc123", raw: {...} }
→ Enqueued to normalizer-queue (Cloudflare Queue)
```

| Detail        | Value                                              |
| ------------- | -------------------------------------------------- |
| Worker        | `loader-salesforce`                                |
| Duration      | ~4.2s for 847 records                              |
| Output        | 847 messages on normalizer-queue                   |
| Rate limiting | Respects Salesforce API daily limit (15,000 calls) |

---

## Step 3: Normalizer — Map to Canonical Schema

```
Normalizer Worker consumes message from normalizer-queue
→ Reads field mapping config for Salesforce Account → IntegrateWise Account
→ Maps: SF.Name → iw.name, SF.Industry → iw.industry, SF.AnnualRevenue → iw.arr
→ Applies transformations: currency normalization, date format standardization
→ Validates required fields present (name, external_id)
→ Outputs canonical entity: { type: "account", name: "Acme Corporation", industry: "Technology", arr: 125000, external_ids: { salesforce: "001ABC123" } }
→ Enqueued to resolver-queue
```

| Detail   | Value                              |
| -------- | ---------------------------------- |
| Worker   | `normalizer`                       |
| Duration | ~12ms per record                   |
| Output   | Canonical entity on resolver-queue |

---

## Step 4: Resolver — Identity Matching

```
Resolver Worker consumes from resolver-queue
→ Checks deterministic rules: external_id "001ABC123" → no existing match (first sync)
→ Checks probabilistic: name "Acme Corporation" → no fuzzy match above threshold
→ Decision: CREATE new entity
→ Assigns entity_id: ent_acme_001
→ Creates identity_link: { entity_id: "ent_acme_001", source: "salesforce", external_id: "001ABC123" }
→ Enqueued to router-queue with action: "create"
```

On subsequent syncs with Zendesk data:

```
→ Zendesk org "Acme Corp" has email domain acme.com
→ Deterministic: domain match with Salesforce account (Website field = acme.com)
→ Confidence: 0.96 → auto-merge
→ identity_link added: { entity_id: "ent_acme_001", source: "zendesk", external_id: "org_789" }
```

| Detail   | Value                                                 |
| -------- | ----------------------------------------------------- |
| Worker   | `resolver`                                            |
| Duration | ~45ms per record (includes DB lookup)                 |
| Output   | Entity ID assignment + identity links on router-queue |

---

## Step 5: Router — Determine Entity Type and Destination

```
Router Worker consumes from router-queue
→ Reads entity type: "account"
→ Routes to account-writer-queue (not contact-writer-queue or opportunity-writer-queue)
→ Attaches routing metadata: { table: "entities_account", partition: "ws_abc123" }
→ Enqueued to writer-queue
```

| Detail   | Value                          |
| -------- | ------------------------------ |
| Worker   | `router`                       |
| Duration | ~3ms per record                |
| Output   | Routed message on writer-queue |

---

## Step 6: Writer — Persist to Spine

```
Writer Worker consumes from writer-queue
→ Upserts to entities_account table in Spine DB:
  INSERT INTO entities_account (entity_id, workspace_id, name, industry, arr, ...)
  VALUES ('ent_acme_001', 'ws_abc123', 'Acme Corporation', 'Technology', 125000, ...)
  ON CONFLICT (entity_id) DO UPDATE SET ...
→ Writes source_attribution record: { entity_id, field: "arr", source: "salesforce", confidence: 0.95, synced_at: now() }
→ Emits entity_changed event to assembler-queue
```

| Detail   | Value                                                  |
| -------- | ------------------------------------------------------ |
| Worker   | `writer`                                               |
| Duration | ~25ms per record (DB round-trip)                       |
| Output   | Row in Spine + entity_changed event on assembler-queue |

---

## Step 7: Assembler — Build Entity 360

```
Assembler Worker consumes entity_changed event
→ Reads all source data for ent_acme_001 from Spine tables
→ Merges: Salesforce account data + Zendesk ticket history + Amplitude usage + Stripe billing
→ Resolves field conflicts using trust rules (highest-confidence-wins for ARR)
→ Computes health score: weighted formula across usage (40%), support (25%), engagement (20%), billing (15%)
→ Health score = 48 (usage dropped, support tickets up)
→ Builds Entity 360 response object and caches at edge (Cloudflare KV, 60s TTL)
→ Emits entity_assembled event to trigger-queue
```

| Detail   | Value                                                       |
| -------- | ----------------------------------------------------------- |
| Worker   | `assembler`                                                 |
| Duration | ~85ms (multi-table read + computation)                      |
| Output   | Cached Entity 360 + entity_assembled event on trigger-queue |

---

## Step 8: Twin Trigger Engine — Evaluate and Generate Insight

```
Twin Worker consumes entity_assembled event
→ Fetches Entity 360 snapshot for ent_acme_001
→ Evaluates 14 trigger conditions:
  ✗ usage_decline: usage dropped 42% over 30 days → FIRES (severity: high)
  ✗ renewal_risk: renewal in 45 days + health 48 → FIRES (severity: critical)
  ✓ support_spike: 2 tickets (below threshold of 3) → does not fire
  ... (11 more evaluated, none fire)
→ Creates 2 insights:
  1. { trigger: "usage_decline", severity: "high", evidence: "DAU dropped from 89 to 52 over 30 days", action: "Schedule usage review call" }
  2. { trigger: "renewal_risk", severity: "critical", evidence: "Renewal in 45 days, health score 48, usage declining", action: "Escalate to manager, schedule executive sponsor call" }
→ Writes to twin_insights table (NOT to Spine entity tables)
→ Emits insight_created events to notification-queue
```

| Detail   | Value                                                 |
| -------- | ----------------------------------------------------- |
| Worker   | `twin-trigger`                                        |
| Duration | ~120ms (Entity 360 fetch + 14 evaluations + 2 writes) |
| Output   | 2 insights in twin_insights + notification events     |

---

## Step 9: Insight Displayed in CSM Hub

```
Notification Worker routes insights to CSM Hub:
→ Realtime subscription (Spine DB Realtime) pushes to connected CSM browser
→ CSM Hub morning briefing updates:
  "🔴 Acme Corporation — Usage dropped 42%, renewal in 45 days"
  Recommended: "Schedule usage review call, escalate to manager"
→ Account card updates: health badge changes from yellow to red
→ Timeline entry added: "Twin detected usage decline and renewal risk"
```

| Detail   | Value                                                            |
| -------- | ---------------------------------------------------------------- |
| Delivery | Spine DB Realtime (WebSocket)                                    |
| Latency  | < 200ms from insight write to UI update                          |
| Output   | CSM sees actionable insight with evidence and recommended action |

---

## End-to-End Timing Summary

| Stage        | Worker            | Latency    | Cumulative |
| ------------ | ----------------- | ---------- | ---------- |
| OAuth        | connector-auth    | ~3s (user) | 3s         |
| Loader       | loader-salesforce | ~4.2s      | 7.2s       |
| Normalizer   | normalizer        | ~12ms      | 7.2s       |
| Resolver     | resolver          | ~45ms      | 7.3s       |
| Router       | router            | ~3ms       | 7.3s       |
| Writer       | writer            | ~25ms      | 7.3s       |
| Assembler    | assembler         | ~85ms      | 7.4s       |
| Twin         | twin-trigger      | ~120ms     | 7.5s       |
| Notification | notifier          | ~200ms     | 7.7s       |

From first Salesforce fetch to insight in CSM Hub: **~7.7 seconds** (excluding OAuth user interaction).
