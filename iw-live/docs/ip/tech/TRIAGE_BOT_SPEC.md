# Triage Bot & Book of Projects Specification

> **Status:** Active
> **Context:** Governs the ingestion of institutional knowledge (Decisions, Commitments, Learnings, Episodes) into the Book of Projects (`memory.org_memory`).

## 1. The Core Principle: Spine vs. Book of Projects

IntegrateWise maintains a strict architectural boundary between operational truth and institutional memory:

- **The Spine (Operational Truth):** What the business knows about the world right now. Mutable, continuous, flat entities (Accounts, Deals, Tasks).
- **The Book of Projects (Institutional Memory):** What the business knows about itself. Append-only, episodic, versioned graphs of knowledge (Decisions, Learnings, Episodes).

### Conflation is a System-Level Failure

Putting Decisions/Learnings into the Spine breaks governance, update patterns, data shape, and consumption.
The Book of Projects connects to the Spine **only via directional entity references** (`entity_ref`). The Spine does not know about the Book of Projects.

## 2. Sole Writer Architecture

The Book of Projects (`memory.org_memory`) is **append-only** and **highly governed**. It is never written to directly by user tools, standard sync pipelines, or general backend processes.

**The Triage Bot is the sole writer to the Book of Projects.**

### Write Pipeline

1. **Source:** Twin reasoning, human judgment (HITL via Ops Surface), or pattern recognition generates a "Knowledge Proposal" (e.g., a new Decision or Learning).
2. **Staging:** The Proposal lands in the Triage Bot's staging queue (`proposal_queue`).
3. **Scoring & Review:** The Triage Bot evaluates the proposal against organizational doctrine and routes it to a human-in-the-loop (HITL) if the confidence/impact requires it.
4. **Commit:** Only after approval does the Triage Bot write the append-only entry into `memory.org_memory` (and its R2 backing store for large narrative context).

## 3. Proposal Schema for Institutional Knowledge

When an agent or system proposes knowledge for the Book of Projects, it must use the `memory.propose` interface. Direct `upsert` or `write` commands to `org_memory` are banned.

```typescript
type KnowledgeCategory = "decision" | "commitment" | "learning" | "episode" | "doctrine";

interface KnowledgeProposal {
  category: KnowledgeCategory;
  title: string;
  narrative_content: string; // The episodic context
  entity_refs: string[]; // e.g., ["account:Northwind", "deal:Renewal Q2"]
  source_evidence: any[]; // Links to the conversational memory, email, or signal that led to this
  confidence_score: number;
}
```

## 4. Triage Bot Governance Scoring & Staging

The Triage Bot evaluates every incoming memory or knowledge proposal against four scoring vectors to compute the final **Confidence Score ($S_c$)**:

$$S_c = (W_{ev} \cdot S_{ev}) + (W_{co} \cdot S_{co}) + (W_{re} \cdot S_{re}) + (W_{se} \cdot S_{se})$$

Where:

- **Evidence Score ($S_{ev}$)**: Weights the presence of trace IDs, source document links, or email logs. Missing evidence reduces this score.
- **Coherence Score ($S_{co}$)**: Checks if the proposal contradicts existing locked doctrine or approved history.
- **Relevance Score ($S_{re}$)**: Evaluates semantic similarity to L1 spine entities in the active schema.
- **Sentiment Coherence ($S_{se}$)**: Evaluates sentiment consistency between conversation logs and proposed insights.

### Governance Action Rails:

- **Auto-Approve ($S_c \ge 0.85$ and Category = `'learning'`)**: Automatically committed to `consolidated_memories` and cached in D1 edge.
- **HITL Review Required ($0.50 \le S_c < 0.85$ or Category $\in$ `['decision', 'commitment', 'doctrine']`)**: Staged in `ai_memories` with `status = 'pending_review'`. Surfaces in the human Command Center for manual approval/edit.
- **Auto-Reject ($S_c < 0.50$)**: Dropped with an entry to the `normalization_errors` table for auditing.

---

## 5. Dual-Write Memory Promotion Execution

Upon human or automated approval, the promotion workflow performs a transactional dual-write:

1.  **Supabase Postgres Write**: Inserts the record into the permanent `public.consolidated_memories` table, index-linked to entity IDs and equipped with pgvector embeddings for future semantic search query retrieval.
2.  **Filesystem Vault Write**: Writes a sanitized, markdown file containing the memory narrative and trace logs to the persistent filesystem directory `/org-memory/` to guarantee permanent offline access.
3.  **Edge Sync**: Pushes the consolidated record to the local edge `D1` SQLite mirror and invalidates the active `KV` cache signal window.

---

## 6. The Twin Context Assembly (Dual Read)

When the Twin requires context to answer a query or generate a recommendation, it must assemble context from both stores:

1.  **Spine Read**: Gets the current state (e.g., Account health, Deal stage, Open tasks).
2.  **Book of Projects Read**: Gets the institutional history for the referenced entities (e.g., Past decisions, Escalations, Learnings).

This ensures the Twin's reasoning benefits from both real-time operational data and permanent institutional memory.
