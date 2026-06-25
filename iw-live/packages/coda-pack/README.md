# IntegrateWise Coda Pack — Control Surface

> **Version:** 1.0.0  
> **Authority:** Nirmal (Founder)  
> **Status:** Active

## Overview

The IntegrateWise Coda Pack is a complete control surface for managing IntegrateWise operations directly from Coda. It provides:

- **4 Sync Tables** — Live data from the Spine
- **5 Action Formulas** — Submit, approve, archive, and review records
- **4 Read Formulas** — Query memory, triage queue, and system status
- **10 Pages** — Mirroring the IntegrateWise architecture layers

## Architecture Mapping

| Coda Page       | Architecture Layer | Description                        |
| --------------- | ------------------ | ---------------------------------- |
| Dashboard       | Overview           | System counts, recent activity     |
| Spine           | Foundation         | Book of Records + Book of Projects |
| Personal Memory | L2                 | User's personal notes, patterns    |
| Org Memory      | L2.1               | Read-only canonical org memory     |
| Teams           | L3 Teams           | Shared context, collaborative ops  |
| Think           | L3 Think           | Strategy surface, AI Search        |
| Ops             | L4                 | Tasks, pipelines, connectors       |
| Agents          | L5                 | Autonomous execution, Twin status  |
| Admin           | L6                 | Audit logs, governance history     |
| Twin            | L7                 | Full memory view, Entity 360       |

## Sync Tables

### Book of Records

Canonical organizational memory — promoted, governed, and approved institutional knowledge.

**Source:** `org_memory` table  
**Fields:** id, tenantId, category, topic, content, version, governanceState, updatedAt

### Personal Memories

Per-user behavioral patterns, preferences, and context.

**Source:** `personal_memory` table  
**Fields:** id, tenantId, userId, memoryType, subject, content, confidenceScore, source, isActive, createdAt

### Triage Queue

Pending reviews and promotion candidates.

**Source:** `conversational_memory` table  
**Fields:** id, tenantId, sessionId, userId, role, content, promotionState, createdAt

### Book of Projects

What the business knows about its own initiatives.

**Source:** `projects` table  
**Fields:** id, tenantId, projectName, status, priority, owner, lastUpdated, summary

## Action Formulas

### CommitToBookOfRecords

Submit a new record to the Book of Records. Enters staging queue.

```
Parameters:
  - category: Memory category (e.g., "Engineering", "Sales")
  - topic: Document topic or file name
  - content: Clean Markdown content
```

### ApproveRecord

Approve a staging record. Moves to "approved" state.

```
Parameters:
  - recordId: ID of the record to approve
  - notes: Optional approval notes
```

### ArchiveRecord

Archive an approved record.

```
Parameters:
  - recordId: ID of the record to archive
  - reason: Reason for archiving
```

### SubmitPersonalMemory

Submit a personal memory entry.

```
Parameters:
  - memoryType: preference, behavioral_pattern, decision, skill_signal, communication_style, priority_pattern
  - subject: What this memory is about
  - content: Memory content (JSON or plain text)
  - source: explicit, inferred, connector_derived, session_derived
```

### ReviewTriage

Review a triage item — approve for promotion or reject.

```
Parameters:
  - itemId: ID of the triage item
  - action: approve or reject
  - notes: Optional review notes
```

## Read Formulas

### GetMemoryByCategory

Retrieve org memory filtered by category.

### GetTriageQueue

Retrieve all items pending triage review.

### GetPersonalMemories

Retrieve personal memory entries for the authenticated user.

### GetSystemStatus

Retrieve IntegrateWise system status.

## Setup

### 1. Install Dependencies

```bash
cd packages/coda-pack
npm install
```

### 2. Configure Authentication

The pack uses **Cloudflare Zero Trust SSO** for authentication. Users must have a valid Cloudflare Access token.

### 3. Build & Deploy

```bash
# Build the pack
npm run build

# Deploy to Coda
npm run deploy
```

### 4. Create Template (Optional)

To create a pre-configured Coda document:

```bash
# Set your Coda API token
export CODA_API_TOKEN=your_token_here

# Run the template builder
npm run template
```

## Gateway API Endpoints

The pack communicates with the IntegrateWise Gateway at `gateway.integratewise.ai`:

| Endpoint                                 | Method | Description           |
| ---------------------------------------- | ------ | --------------------- |
| `/api/v1/cognitive/memory/org`           | GET    | Fetch org memory      |
| `/api/v1/cognitive/memory/personal`      | GET    | Fetch personal memory |
| `/api/v1/cognitive/memory/triage`        | GET    | Fetch triage queue    |
| `/api/v1/cognitive/memory/approve`       | POST   | Approve a record      |
| `/api/v1/cognitive/memory/archive`       | POST   | Archive a record      |
| `/api/v1/cognitive/memory/triage/review` | POST   | Review triage item    |
| `/api/v1/cognitive/truth/commit`         | POST   | Commit new record     |
| `/api/v1/cognitive/projects`             | GET    | Fetch projects        |
| `/api/v1/cognitive/status`               | GET    | System status         |

## Governance

All writes to the Spine go through the **Triage Bot** — the sole memory writer. The Coda pack respects this governance model:

1. **Submit** → Record enters staging queue
2. **Triage Bot** → Reviews and classifies
3. **Human Approval** → Required before promotion
4. **Publish** → Record becomes canonical

## Security

- **Authentication:** Cloudflare Zero Trust SSO (HeaderBearerToken)
- **Tenant Isolation:** All queries scoped to authenticated tenant
- **Rate Limiting:** Enforced at gateway level
- **Write Governance:** All writes route through Triage Bot

## Related Files

- `pack.ts` — Pack definition (formulas, sync tables)
- `template.ts` — Template builder script
- `package.json` — Dependencies
- `README.md` — This file

## Support

For issues or questions, contact the IntegrateWise team or refer to the canonical architecture at:
`/Users/nirmal/Github/IntegrateWise - Memory/AGENTS.md`
