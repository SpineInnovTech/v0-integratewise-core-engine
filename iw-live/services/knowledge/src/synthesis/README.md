# Synthesis Pipeline

The Synthesis Pipeline transforms raw CouchDB conversational memory into structured, governed organizational knowledge.

## Architecture

```
┌─────────────────┐     ┌─────────────────────────┐     ┌─────────────────────┐
│  CouchDB Raw    │────▶│  1. Triage Bot          │────▶│  2. Continuity      │
│  SessionEvents  │     │  (classifySession)      │     │  Object Factory     │
└─────────────────┘     └─────────────────────────┘     └─────────────────────┘
                                                                  │
                                                                  ▼
┌─────────────────┐     ┌─────────────────────────┐     ┌─────────────────────┐
│  Knowledge      │◀────│  4. Lineage Tracker     │◀────│  3. Promotion Gate  │
│  Persisted      │     │  (recordPromotion)      │     │  (evaluatePromotion)│
└─────────────────┘     └─────────────────────────┘     └─────────────────────┘
```

## Stages

### 1. Triage Bot (`triage-bot.ts`)

**Input:** `SessionContainer` + `SessionEvent[]`  
**Output:** `TriageClassification`

Classifies a session into extraction candidates with:

- Heuristic event classification (decision, action_item, insight, preference, doctrine_update)
- Domain inference from content signals
- Confidence scoring
- HITL requirement flag

### 2. Continuity Object Factory (`continuity-object-factory.ts`)

**Input:** `TriageClassification`  
**Output:** `UnderstandingObject`

Creates canonical draft knowledge objects with:

- Structured content (title, summary, body, facts, decisions, actions, relationships)
- Provenance chain linking back to source events
- Lineage record for audit and versioning
- Metadata for governance decisions

Supports merging multiple objects into consolidated knowledge.

### 3. Promotion Gate (`promotion-gate.ts`)

**Input:** `UnderstandingObject`  
**Output:** `PromotionResult`

Decides promotion path:

- **AUTO_APPROVED**: High confidence + safe domain + within rate limits
- **HITL_REQUIRED**: Low confidence, governance domain, or daily cap reached
- **REJECTED**: Contains rejection keywords (test/draft/temporary)
- **DEFERRED**: Explicitly deferred for later review

### 4. Lineage Tracker (`lineage-tracker.ts`)

**Input:** `UnderstandingObject` + promotion result  
**Output:** Updated object with immutable audit trail

Records:

- Creation provenance
- Promotion decisions
- Merge history
- Supersede chains
- Visualization graph (DAG)

## Domain Model

Knowledge is organized by domain:

```
/{domain}/triage                    # Working area (drafts, pending review)
/{domain}/knowledge-persisted       # Canonical approved knowledge
/{domain}/references                # Cross-domain links and citations
```

Domains:

- `executive`
- `product`
- `engineering`
- `design`
- `ai-operations`
- `business-operations`
- `sales`
- `marketing`
- `customer-success`
- `finance`
- `research-and-continuity`
- `infrastructure-and-security`

## Integration Points

- **Upstream:** Continuity Service (CouchDB sessions)
- **Downstream:** Knowledge Service (vector DB, search)
- **Governance:** HITL Gate Durable Object (workflow service)
- **Execution:** Hermes Worker (outcome persistence)
