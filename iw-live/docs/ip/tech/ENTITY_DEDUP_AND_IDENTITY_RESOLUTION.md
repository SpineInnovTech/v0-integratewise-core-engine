## Current Surface-Binding Doctrine

- Operational Workbench = the primary work surface; left sidebar nav; Twin sidebar pops out when needed.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- OpenWebUI is not the customer-facing product shell.
- Twin / OpenWebUI runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

Use older L1/L2 / workspace / knowledge-UI language in this file through that boundary if any historical phrasing remains.

---

# Entity Deduplication & Identity Resolution

## Overview

S7.5 Identity Resolution runs after S7 Sanity and before S8 Sectorize in the 8-stage normalizer pipeline. It detects potential cross-source duplicates but NEVER auto-merges. All merge decisions require human review (HITL).

## How It Works

### Detection (Automatic)

1. Entity passes through S1-S7 of the pipeline
2. S7.5 generates a signature from identifying fields (email, domain, name, phone)
3. Signature stored in D1 `entity_signatures` table
4. Query for matches: same tenant + entity type + different source system
5. If match found with sufficient confidence → create `merge_candidate` record
6. Entity ALWAYS written to Spine as separate record (never blocked)

### Supported Entity Types

account, contact, lead, ticket, opportunity, people_team

### Matching Logic

| Field  | Weight | Match Type          |
| ------ | ------ | ------------------- |
| email  | High   | Exact (normalized)  |
| domain | Medium | Exact               |
| name   | Medium | Fuzzy (normalized)  |
| phone  | Low    | Exact (digits only) |

### Confidence Scoring

- Email exact match: 0.95
- Domain + name match: 0.80
- Name + phone match: 0.75
- Domain only: 0.50

## Resolution (Human)

### API Endpoints

| Method | Path                                         | Action                        |
| ------ | -------------------------------------------- | ----------------------------- |
| GET    | `/api/identity/candidates`                   | List pending candidates       |
| GET    | `/api/identity/candidates/:id`               | Single with entity comparison |
| POST   | `/api/identity/candidates/:id/merge`         | Merge two records             |
| POST   | `/api/identity/candidates/:id/keep-separate` | Not duplicates                |
| POST   | `/api/identity/candidates/:id/defer`         | Revisit later                 |
| GET    | `/api/identity/stats`                        | Signature + candidate counts  |

### Merge Action

When merged:

1. Primary record kept as canonical
2. Secondary record's unique fields merged (if merge_fields strategy)
3. Merge logged to Spine DB `audit_log`
4. Candidate status → "merged"

### Keep Separate

When kept separate:

1. Candidate status → "rejected"
2. Future matching suppressed for this pair

## D1 Schema

```sql
-- entity_signatures: one per entity per source
CREATE TABLE entity_signatures (
  tenant_id TEXT, entity_type TEXT, source_system TEXT,
  external_id TEXT, signature TEXT, email TEXT,
  domain TEXT, name TEXT, phone TEXT, created_at TEXT
);

-- merge_candidates: pending HITL review
CREATE TABLE merge_candidates (
  tenant_id TEXT, entity_type TEXT,
  source_a TEXT, external_id_a TEXT,
  source_b TEXT, external_id_b TEXT,
  confidence REAL, matched_fields TEXT,
  status TEXT DEFAULT 'pending',
  resolved_by TEXT, resolved_at TEXT
);
```
