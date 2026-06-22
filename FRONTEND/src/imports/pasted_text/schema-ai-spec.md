# Schema AI — The Adaptive Schema Governance Engine

**Document Type:** Technical Specification  
**Status:** Active  
**Evolved Decision Date:** 2026-05-25  
**Author:** Hermes (Operator) + Nirmal (Strategist)  
**Location in Codebase:** `integratewise-live/services/intelligence/schema_ai/`

---

## 1. The Problem — Hand-Written Schemas Don't Scale

IntegrateWise connects to 50+ external services. Each service exposes entities with different field names, types, nesting patterns, and semantics. Writing schemas by hand means:

- Every new connector requires a developer to read API docs, map fields, write a schema, test it, and deploy.
- Schema drift (when the external API changes) goes undetected until records fail validation.
- Cross-connector harmonization (knowing that HubSpot Contact == Salesforce Lead == Pipedrive Person) is ad hoc tribal knowledge, not codified.
- Schema evolution (adding a field when the API adds one) requires a manual process.

At 5 connectors, this is manageable. At 50, it breaks. Schema AI eliminates this bottleneck.

---

## 2. What Schema AI Is

Schema AI is an internal service — **not a third-party product** — living at `integratewise-live/services/intelligence/schema_ai/`. It is a purpose-built AI-assisted governance engine with four responsibilities:

1. **Connector Schema Generation** — Given a connector's API spec or sample payload, generate a draft schema.
2. **DB Write Format Enforcement** — Own the canonical format for all writes to all stores.
3. **Schema Evolution** — Detect when an external API changes and propose schema updates.
4. **Cross-Connector Harmonization** — Map semantically equivalent entities across connectors.

Schema AI does not replace human judgment. It proposes. Humans (or auto-approval rules for low-risk changes) approve. Nothing reaches `active` state without going through the full lifecycle.

---

## 3. The schema_pool Table

The schema_pool table is the single source of truth for all data shapes in IntegrateWise. Every connector schema, every DB write format, every normalized entity shape lives here.

```sql
CREATE TABLE schema_pool (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    connector_name      TEXT NOT NULL,           -- e.g. 'hubspot', 'salesforce', 'global'
    entity_type         TEXT NOT NULL,           -- e.g. 'contact', 'deal', 'task'
    schema_version      TEXT NOT NULL,           -- e.g. '1.0.0', '1.1.0'
    schema_body         JSONB NOT NULL,          -- full JSON Schema (Draft 7)
    canonical_mapping   JSONB,                   -- field → canonical_field mappings
    harmonization_group TEXT,                    -- e.g. 'person', 'deal', 'activity'
    lifecycle_state     TEXT NOT NULL DEFAULT 'proposed'
                        CHECK (lifecycle_state IN ('proposed', 'reviewed', 'approved', 'active', 'deprecated')),
    proposed_by         TEXT NOT NULL,           -- 'schema_ai' or user_id
    proposed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by         UUID REFERENCES users(id),
    reviewed_at         TIMESTAMPTZ,
    approved_by         UUID REFERENCES users(id),
    approved_at         TIMESTAMPTZ,
    activated_at        TIMESTAMPTZ,
    deprecated_at       TIMESTAMPTZ,
    deprecation_reason  TEXT,
    source_payload_hash TEXT,                    -- SHA256 of the sample payload used to generate
    training_signal     BOOLEAN NOT NULL DEFAULT false,  -- marks as training input for future fine-tune
    confidence_score    NUMERIC(4,3),            -- Schema AI's confidence in this draft (0.000–1.000)
    validation_errors   JSONB,                   -- errors found during review phase
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_schema_pool_tenant_connector ON schema_pool(tenant_id, connector_name);
CREATE INDEX idx_schema_pool_lifecycle_state ON schema_pool(lifecycle_state);
CREATE INDEX idx_schema_pool_harmonization_group ON schema_pool(harmonization_group);
CREATE UNIQUE INDEX idx_schema_pool_active_version 
    ON schema_pool(tenant_id, connector_name, entity_type, schema_version)
    WHERE lifecycle_state = 'active';

-- RLS
ALTER TABLE schema_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY schema_pool_tenant_isolation ON schema_pool
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY schema_pool_read_global ON schema_pool
    FOR SELECT
    USING (connector_name = 'global' OR tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## 4. The Full Schema Lifecycle

```
External API Payload / API Spec
            │
            ▼
    Schema AI Analysis
    (services/intelligence/schema_ai)
            │
            │  analyzes field names, types, nesting, semantics
            │  compares against existing schemas in schema_pool
            │  checks harmonization_group candidates
            │  computes confidence_score
            │
            ▼
    Draft Schema Generated
    (JSON Schema Draft 7, canonical_mapping included)
            │
            ▼
    Inserted into schema_pool
    lifecycle_state = 'proposed'
    proposed_by = 'schema_ai'
            │
            ▼
    Automated Pre-Review Checks
    ├── JSON Schema validity check
    ├── Required fields present (id, created_at, tenant_id)
    ├── No PII fields without explicit pii_classification tag
    ├── Harmonization group assigned
    └── Confidence score ≥ 0.75 (else flagged for mandatory human review)
            │
            ▼
    lifecycle_state = 'reviewed'
    (auto if all checks pass + confidence ≥ 0.75, else human reviews)
            │
            ▼
    HITL Approval
    (Nirmal reviews in UI — Ops+Governance room)
    lifecycle_state = 'approved'
    approved_by = user_id
            │
            ▼
    Activation
    (CF MCP Worker picks up on next poll cycle, ≤60s)
    lifecycle_state = 'active'
    activated_at = now()
    training_signal = true  ← every approval is a training signal
            │
            ▼
    Active Schema Used By:
    ├── CF MCP Worker (validates all writes against this schema)
    ├── Normalizer (uses canonical_mapping to transform payloads)
    ├── Schema AI (uses as reference for harmonization)
    └── UI (uses for form field generation and validation display)
```

---

## 5. Responsibility 1 — Connector Schema Generation

When a new connector is added to IntegrateWise:

1. The connector's registration payload includes a `sample_payload` or `api_spec_url`.
2. Schema AI receives this via MCP tool call: `propose_schema({connector_name, sample_payload, entity_type})`.
3. Schema AI:
   - Parses all fields from the sample payload.
   - Infers types (string, number, boolean, ISO8601 date, UUID, enum).
   - Identifies likely PII fields (email, phone, name patterns).
   - Tags PII fields with `pii_classification: "personal_data"`.
   - Generates JSON Schema Draft 7 body.
   - Computes canonical_mapping against the harmonization_group's canonical schema.
   - Computes confidence_score.
4. Inserts into schema_pool as `proposed`.
5. If confidence_score ≥ 0.75 and all automated checks pass, advances to `reviewed`.
6. Awaits human approval in the UI.

**No code changes are required to add a connector.** The process is: register connector → Schema AI generates schema → human approves → connector is active.

---

## 6. Responsibility 2 — DB Write Format Enforcement

Schema AI owns the canonical format for every write to every store:

| Store | What Schema AI Governs |
|---|---|
| Supabase Postgres (conversational_memory) | Session record format, role enum, content structure |
| Supabase Postgres (org_memory) | Promoted document format, governance_state transitions |
| Supabase Postgres (personal_memory) | Behavioral pattern format, confidence score bounds |
| CF KV | Key format, TTL rules per entity type |
| CF D1 | Mirror record format (subset of Postgres schema) |
| CF Queues | Message envelope format, retry metadata fields |

When a write arrives at the CF MCP Worker, the Worker calls `query_schema_pool` to get the active schema for the write's `connector_name + entity_type`. If no active schema exists, the write is rejected with:

```json
{
  "error": {
    "code": "SCHEMA_NOT_FOUND",
    "message": "No active schema for connector 'hubspot' entity 'contact'. Schema may be pending approval.",
    "trace_id": "..."
  }
}
```

This makes Schema AI the enforcement layer, not just a documentation layer.

---

## 7. Responsibility 3 — Schema Evolution

External APIs change. Fields are added, renamed, deprecated. Schema AI detects this via:

1. **Payload Drift Detection:** Every incoming payload is hashed and compared against the current active schema. If fields appear in the payload that are not in the schema, a drift event is recorded.
2. **Drift Threshold:** If 10 consecutive payloads contain unrecognized fields, Schema AI triggers a schema evolution proposal.
3. **Evolution Proposal:** Schema AI generates a new schema version (e.g., `1.0.0` → `1.1.0`) that adds the new fields. It inserts this as `proposed` in schema_pool.
4. **Side-by-Side:** The `1.0.0` schema remains `active` until the `1.1.0` schema is approved and activated. No data loss during transition.
5. **Deprecation:** When `1.1.0` activates, `1.0.0` moves to `deprecated` with `deprecation_reason: "superseded by 1.1.0"`.

---

## 8. Responsibility 4 — Cross-Connector Harmonization

The insight: **HubSpot Contact == Salesforce Lead == Pipedrive Person.** They are the same real-world entity. When IntegrateWise holds both HubSpot and Salesforce data for a tenant, it must know these records may refer to the same person.

Schema AI manages this via `harmonization_group`:

```
harmonization_group: "person"
    ├── hubspot / contact (canonical_mapping: {firstname → name.first, lastname → name.last, email → contact.email})
    ├── salesforce / lead (canonical_mapping: {FirstName → name.first, LastName → name.last, Email → contact.email})
    ├── pipedrive / person (canonical_mapping: {first_name → name.first, last_name → name.last, email[0].value → contact.email})
    └── canonical_schema: {name: {first, last}, contact: {email, phone}, ...}
```

When the Normalizer processes a HubSpot contact, it uses the canonical_mapping to produce a `canonical_record` that matches the harmonization group's canonical schema. The same canonical_record shape applies whether the source is HubSpot, Salesforce, or Pipedrive.

This means `read_org_memory` can return people records regardless of which connector ingested them, in a consistent shape, sortable, filterable, and comparable.

**Harmonization Groups (initial set):**

| Group | Connectors |
|---|---|
| `person` | HubSpot Contact, Salesforce Lead/Contact, Pipedrive Person, Gmail Sender |
| `deal` | HubSpot Deal, Salesforce Opportunity, Pipedrive Deal |
| `company` | HubSpot Company, Salesforce Account, Pipedrive Organization |
| `activity` | HubSpot Activity, Salesforce Task, Gmail Message, Slack Message |
| `document` | Google Drive File, Notion Page, BrandDocumentations entry |

---

## 9. Training Loop and Fine-Tune Path

Every schema approval is tagged `training_signal = true`. This creates a growing dataset of:
- Sample payload → approved schema mappings
- Connector-specific field name patterns
- PII classification decisions
- Harmonization group assignments

**Training Loop:**

```
schema_pool WHERE training_signal = true
    │
    ▼
Export pipeline (weekly batch)
    │  SELECT connector_name, entity_type, source_payload_hash, schema_body, canonical_mapping
    │  FROM schema_pool WHERE training_signal = true AND lifecycle_state IN ('active', 'deprecated')
    │
    ▼
Fine-tune dataset (JSONL format)
    │  {input: sample_payload, output: schema_body + canonical_mapping}
    │
    ▼
Fine-tune run (Nous Research or compatible provider)
    │
    ▼
Updated Schema AI model deployed to services/intelligence/schema_ai
    │
    ▼
Confidence scores improve over time
Schema generation accuracy improves
Human approval workload decreases
```

Over time, Schema AI moves from requiring human approval for ~100% of schemas to requiring human approval only for novel entity types it has never seen, while auto-approving known patterns with high confidence.

---

## 10. Integration with the CF MCP Worker

The CF MCP Worker integrates with Schema AI at two points:

1. **Write Validation:** Before every write, the Worker fetches the active schema from schema_pool (via D1 for speed). Validates the payload. Rejects if invalid.

2. **Schema Proposal Forwarding:** When a write arrives with `propose_schema: true` flag (used during connector setup), the Worker forwards the payload to Schema AI for processing, queuing the write until the schema is approved.

The Worker caches active schemas in CF KV with a 300s TTL. Schema activations invalidate the relevant KV key immediately via the `write_kv` tool.

---

*This specification governs all schema management within IntegrateWise. No connector may write data without an active schema in schema_pool. Schema AI is the sole authority on schema generation; humans are the sole authority on schema approval.*