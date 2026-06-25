# Entity Binding & Relationship Graph Architecture

> **Date:** 2026-06-09  
> **Version:** 1.0.0  
> **Authority:** Nirmal (Founder)  
> **Status:** Canonical Reference

---

## Overview

The **Spine** is IntegrateWise's relationship graph - the single source of truth that binds emails, documents, chats, and all entities together. This document describes how entity resolution, binding, and relationships work across the entire system.

---

## The Three Layers

### Layer 1: Structured Truth (Spine Entities)

- **Source:** Flow A (Connectors → Normalizer → Spine)
- **Writer:** Pipeline service (SOLE writer to Spine)
- **Storage:** D1 (edge cache) + Supabase (fortress backup for promoted users)
- **Entity Types:** Person, Account, Deal, Task, Ticket, Invoice, Project, etc.
- **How It Works:** HubSpot Contact + Jira Reporter + Gmail sender → SAME Person entity

### Layer 2: Unstructured Context (Linked to Entities)

- **Source:** Flow B (Documents, emails, Slack, meetings, files)
- **Writer:** Knowledge service
- **Storage:** R2 (raw content) + Vectorize (embeddings) + D1 (metadata + entity_refs)
- **Table:** `context_extractions` with `entity_refs` column
- **How It Works:** Email about Account X → linked to Account X via entity_refs

### Layer 3: AI Memory (Linked to Entities)

- **Source:** Flow C (Twin sessions, AI learnings)
- **Writer:** Triage Bot (SOLE writer to memory after governance)
- **Storage:** Supabase `memory.*` tables + D1 mirror + Vectorize
- **Tables:** `conversational_memory`, `org_memory`, `personal_memory`
- **How It Works:** Twin learns about Account X → memory entry linked to Account X

---

## Entity Resolution (How We Bind)

### The 18 Core Traits

Every entity from every tool is analyzed for these traits:

```typescript
const CORE_TRAITS = [
  "name",
  "email",
  "domain",
  "phone",
  "address",
  "company",
  "title",
  "identifier",
  "status",
  "stage",
  "amount",
  "date",
  "assignee",
  "priority",
  "description",
  "url",
  "type",
  "category",
];
```

### The 7 Canonical Resource Types

All entities map to one of 7 types:

1. **Person** - HubSpot Contact, Salesforce Lead, Jira Reporter, Gmail sender
2. **Account** - HubSpot Company, Salesforce Account, Stripe Customer
3. **Deal** - HubSpot Deal, Salesforce Opportunity, PandaDoc Proposal
4. **Task** - Jira Issue, Asana Task, GitHub Issue, Linear Issue
5. **Communication** - Email, Slack message, Intercom conversation
6. **Document** - Google Doc, Notion page, Confluence page, PDF upload
7. **Event** - Calendar meeting, Zoom call, webhook event

### Resolution Algorithm

**Normalizer Stage 4: Entity Resolution**

```
For each incoming entity:
1. Extract traits (name, email, domain, etc.)
2. Detect resource type (Person, Account, Deal, etc.)
3. Query Spine for potential matches:
   - Exact email match (high confidence)
   - Domain + name fuzzy match (medium confidence)
   - Identifier match (tool-specific ID, low confidence)
4. If match found → UPDATE existing entity
5. If no match → CREATE new entity
6. Record provenance: which tools contributed to this entity
```

---

## Relationship Graph

### Core Relationships Table

**`entity_relationships` (D1)**

```sql
CREATE TABLE entity_relationships (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  from_entity_id TEXT NOT NULL,      -- spine_id
  from_entity_type TEXT NOT NULL,    -- Person, Account, etc.
  to_entity_id TEXT NOT NULL,        -- spine_id
  to_entity_type TEXT NOT NULL,
  relationship_type TEXT NOT NULL,   -- see types below
  strength REAL DEFAULT 1.0,         -- 0.0-1.0 confidence
  metadata JSONB,                    -- context, source, timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_from_entity (from_entity_id),
  INDEX idx_to_entity (to_entity_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_relationship_type (relationship_type)
);
```

### Relationship Types

**Primary relationships (auto-detected by Normalizer):**

```typescript
const RELATIONSHIP_TYPES = {
  // Person → Account
  works_at: "Person works at Account",
  contacts_with: "Person is contact at Account",

  // Person → Deal
  owns_deal: "Person owns Deal",
  involved_in: "Person involved in Deal",

  // Account → Deal
  has_deal: "Account has Deal",

  // Person → Task
  assigned_to: "Person assigned to Task",
  created_task: "Person created Task",

  // Account → Task
  related_to_account: "Task related to Account",

  // Communication → Any
  mentions: "Communication mentions Entity",
  about: "Communication about Entity",

  // Document → Any
  references: "Document references Entity",
  belongs_to: "Document belongs to Entity",

  // Memory → Any
  learned_about: "AI learned about Entity",
};
```

---

## Context Linking (Flow B)

### How Emails/Docs/Chats Get Linked

**`context_extractions` table (D1):**

```sql
CREATE TABLE context_extractions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  content_type TEXT NOT NULL,        -- email, slack, doc, meeting
  source_tool TEXT NOT NULL,         -- gmail, slack, notion, etc.
  source_id TEXT NOT NULL,           -- original ID from source
  title TEXT,
  summary TEXT,                      -- AI-generated summary
  content_hash TEXT,                 -- R2 object key
  entity_refs JSONB NOT NULL,        -- [{entity_id, entity_type, confidence}]
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_entity_refs (entity_refs),  -- GIN index for JSONB queries
  INDEX idx_tenant (tenant_id),
  INDEX idx_source (source_tool, source_id)
);
```

**Example: Email about Account**

```json
{
  "id": "ctx_abc123",
  "tenant_id": "iw-customer-zero",
  "content_type": "email",
  "source_tool": "gmail",
  "source_id": "msg_xyz789",
  "title": "RE: Q4 Renewal Discussion",
  "summary": "Discussion about Q4 contract renewal with pricing options",
  "content_hash": "r2://emails/msg_xyz789.json",
  "entity_refs": [
    {
      "entity_id": "spine_account_001",
      "entity_type": "Account",
      "confidence": 0.95,
      "extraction_method": "email_domain_match"
    },
    {
      "entity_id": "spine_person_042",
      "entity_type": "Person",
      "confidence": 0.98,
      "extraction_method": "email_sender_match"
    },
    {
      "entity_id": "spine_deal_017",
      "entity_type": "Deal",
      "confidence": 0.85,
      "extraction_method": "subject_line_analysis"
    }
  ],
  "extracted_at": "2026-06-09T10:30:00Z"
}
```

### Entity Extraction Process

**Knowledge Service Pipeline:**

```
1. Receive document/email/chat
2. Extract text content
3. Run AI extraction (via Workers AI + OpenRouter):
   - Identify mentioned entities (people, accounts, deals)
   - Extract key topics and intents
   - Generate summary
4. Query Spine for entity matches:
   - Email address → Person
   - Company name → Account
   - Deal ID / subject keywords → Deal
5. Create context_extractions record with entity_refs
6. Store raw content in R2
7. Embed and index in Vectorize
8. Update Entity 360 cache in D1
```

---

## Entity 360 View

### What It Is

Entity 360 is the **unified view** of everything related to an entity:

- Structured data (Spine)
- Unstructured context (linked emails, docs, chats)
- AI memory (learnings, signals)
- Relationship graph (connected entities)

### How It's Built

**L2 Service: Entity 360 Worker**

```typescript
async function buildEntity360(entityId: string, tenantId: string, env: Env) {
  // 1. Get core entity from Spine (D1)
  const entity = await env.D1.prepare("SELECT * FROM spine_entities WHERE id = ? AND tenant_id = ?")
    .bind(entityId, tenantId)
    .first();

  // 2. Get relationships
  const relationships = await env.D1.prepare(
    `
      SELECT * FROM entity_relationships 
      WHERE (from_entity_id = ? OR to_entity_id = ?) 
      AND tenant_id = ?
    `
  )
    .bind(entityId, entityId, tenantId)
    .all();

  // 3. Get linked context (emails, docs, chats)
  const context = await env.D1.prepare(
    `
      SELECT * FROM context_extractions 
      WHERE entity_refs @> ?
      AND tenant_id = ?
      ORDER BY extracted_at DESC
      LIMIT 50
    `
  )
    .bind(JSON.stringify([{ entity_id: entityId }]), tenantId)
    .all();

  // 4. Get AI memory
  const memory = await env.D1.prepare(
    `
      SELECT * FROM org_memory 
      WHERE metadata->>'entity_id' = ?
      AND tenant_id = ?
      AND governance_state = 'approved'
      ORDER BY updated_at DESC
      LIMIT 20
    `
  )
    .bind(entityId, tenantId)
    .all();

  // 5. Get signals
  const signals = await env.D1.prepare(
    `
      SELECT * FROM signals 
      WHERE entity_id = ?
      AND tenant_id = ?
      AND processed = 0
      ORDER BY created_at DESC
      LIMIT 10
    `
  )
    .bind(entityId, tenantId)
    .all();

  return {
    entity,
    relationships: relationships.results,
    context: context.results,
    memory: memory.results,
    signals: signals.results,
    _cached_at: new Date().toISOString(),
  };
}
```

---

## MCP Tool Exposure

### Spine Tools (Available to Twin via MCP)

```typescript
// Read single entity + relationships
spine.entity.get({ entity_id: "spine_account_001" });

// Search entities by trait/type
spine.entity.search({
  type: "Account",
  traits: { domain: "acme.com" },
});

// List relationships for an entity
spine.relationship.list({
  entity_id: "spine_person_042",
  relationship_type: "works_at",
});

// Get Entity 360 view
spine.entity360.get({ entity_id: "spine_account_001" });
```

---

## Data Flow Summary

### Flow A: Structured Entities (Repeat Loop)

```
HubSpot → Connector → Loader → Pipeline (Normalizer 8 stages)
  → Spine D1 (entity resolution + relationships)
  → Signal detection → Think → HITL → Act → back to HubSpot
```

### Flow B: Unstructured Context (No Repeat Loop)

```
Gmail/Slack/Docs → Connector → Loader → Knowledge service
  → Extract entities → Link via entity_refs → context_extractions D1
  → R2 (raw content) + Vectorize (embeddings)
  → Enriches Entity 360 (read-only, no loop back)
```

### Flow C: AI Memory (No Repeat Loop, Governed)

```
Twin session → Twin proposes memory → Triage Bot scores
  → HITL approval → Triage Bot writes org_memory
  → Linked to entities → Vectorize (retrieval)
  → Twin reads via memory.* MCP tools
```

---

## Current Implementation Status

### ✅ Implemented (Phase 1)

- Spine entity resolution (Normalizer stages 1-8)
- Relationship graph (entity_relationships table)
- Context extraction (context_extractions table)
- Entity 360 caching (D1)
- Memory linking (org_memory metadata)
- MCP tools: spine.entity.get, spine.relationship.list

### ⏳ Pending (Phase 2-4)

- Auto-linking for emails (Gmail connector Flow B)
- Auto-linking for Slack messages
- Auto-linking for documents (Drive, Notion)
- Relationship strength scoring algorithm
- Entity merge/split UI
- Relationship visualization

---

## Key Rules

1. **Single Source of Truth:** Spine entities are canonical. Everything else links TO them, never replaces them.

2. **One Writer Per Layer:**
   - Spine: Pipeline service only
   - Context: Knowledge service only
   - Memory: Triage Bot only

3. **No Direct Access:** Twin never writes to Spine. Twin proposes → Govern approves → Act executes → Pipeline writes.

4. **Entity Refs Everywhere:** Every piece of unstructured content MUST have entity_refs. No orphaned context.

5. **Provenance Tracking:** Every entity records which tools contributed to it. Every relationship records its source.

6. **Edge-First:** D1 for speed, Supabase for durability (promoted users only).

---

## Related Documents

- `INTEGRATEWISE_PRODUCT_ARCHITECTURE.md` - Overall system design
- `MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md` - MCP tools and routing
- `CANONICAL_TAXONOMY.md` - S/U/V/CZ layers
- `LAYER_OWNERSHIP_AND_TWIN_RUNTIME.md` - Twin responsibilities

---

**Document Status:** CANONICAL REFERENCE  
**Last Updated:** 2026-06-09  
**Next Review:** After Phase 2 Queue Wiring
