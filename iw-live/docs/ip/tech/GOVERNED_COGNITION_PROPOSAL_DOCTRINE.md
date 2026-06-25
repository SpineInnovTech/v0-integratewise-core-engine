# Governed Cognition Proposal Doctrine

**Version:** 1.0  
**Date:** May 28, 2026  
**Authority:** Nirmal (Founder)  
**Status:** LOCKED — Architectural Completion Point

---

## What This Document Is

This is the founding doctrine for the **Governed Cognition Proposal** — the canonical continuity primitive that bridges Twin cognition and operational reality in IntegrateWise.

This document records:

- What was missing before
- What was built
- Why it matters architecturally
- The laws that now govern the system

Do not modify the architectural laws section without Nirmal's explicit instruction.

---

## The Gap That Was Closed (May 28, 2026)

Before this change, the platform had:

| Layer               | Existed |
| ------------------- | ------- |
| Twin cognition      | ✅      |
| Signal scoring      | ✅      |
| Governance policies | ✅      |
| Approval workflows  | ✅      |
| Execution engine    | ✅      |
| Ops projections     | ✅      |

But the **transition between them** was structurally implicit.

There was no:

- Canonical proposal object
- Governance lifecycle model
- Operational transition state
- Execution continuity tracking
- Reasoning traceability
- Lineage from cognition to mutation

The Twin produced signals, flat actions, and recommendations — but there was no formal object that carried cognition through governance into operational reality.

**That was the missing bridge. It now exists.**

---

## The Architectural Breakthrough

> **Twin now proposes, not writes.**

This single change enforces the most important separation in the platform:

```
cognition ≠ mutation
```

The full governed loop is now:

```
Twin cognition
  → Proposal object (governed intent)
  → Governance resolution (auto / manual / restricted)
  → Triage Bot scoring
  → HITL approval queue
  → Human authorization
  → Operator execution
  → Continuity writeback
  → Spine persistence
  → Ops projection
```

Every step is now explicit, traceable, and governed.

---

## The Canonical Lifecycle

```
draft → pending_review → approved | rejected → executing → completed | failed | superseded
```

| State            | Meaning                                                    |
| ---------------- | ---------------------------------------------------------- |
| `draft`          | Created by Twin, not yet submitted                         |
| `pending_review` | In Triage / governance queue                               |
| `approved`       | Human or auto-approved, ready for execution                |
| `rejected`       | Rejected — terminal, continuity writeback triggered        |
| `executing`      | Operator is acting                                         |
| `completed`      | Execution confirmed, Spine writeback done                  |
| `failed`         | Execution failed — can be re-submitted                     |
| `superseded`     | Replaced by a newer proposal — terminal, lineage preserved |

State transitions are enforced by `canTransition()` — no illegal jumps.

---

## The Proposal Object — Key Fields

```typescript
Proposal {
  // Identity + lifecycle
  id, tenant_id, status, governance_level

  // Cognition origin — immutable link back to Twin reasoning
  originating_entity_id, originating_entity_type
  originating_signal: ProposalSignalLink {
    signal_id, signal_category, signal_confidence,
    signal_severity, key_indicators, reasoning
  }

  // Lineage — full chain across all proposals in a reasoning sequence
  lineage_id          // shared across the chain
  parent_proposal_id  // explicit parent link

  // Governed intent
  action_type, action_target, action_parameters, action_description

  // Confidence
  confidence, reasoning_summary, evidence_count

  // Governance
  policy_id, review_deadline, reviewed_by, reviewed_at, review_notes

  // Execution
  execution_result: { started_at, completed_at, executed_by, target_tool, outcome_summary }

  // Continuity
  continuity_writeback: { written, spine_id, memory_id, written_at }

  // Ops projection
  ops_priority: low | medium | high | critical
  ops_surface: queue | tile | notification | command_center | timeline
}
```

---

## Governance Level Auto-Resolution

The system automatically resolves governance level from signal data:

| Level        | Condition                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| `auto`       | High confidence (≥0.85) + safe action type + non-critical severity                                           |
| `manual`     | Default — human validation required                                                                          |
| `restricted` | Critical severity + destructive action type (update_entity, archive_entity, trigger_workflow, create_record) |

This creates **adaptive operational trust** — low-risk cognition flows automatically, high-risk cognition requires human authorization. Future scaling does not require manual approval bottlenecks everywhere.

---

## The toOpsProjection() Separation

The Ops surface receives a `ProposalOpsProjection` — not the full internal proposal.

```typescript
ProposalOpsProjection {
  id, status, ops_priority, ops_surface,
  action_type, action_description,
  entity_id, entity_type,
  confidence, reasoning_summary,
  signal_severity, governance_level,
  review_deadline, created_at, lineage_id
}
```

**Governance internals stay hidden. Cognitive metadata stays governed. Operational UI stays clean.**

This is the projection doctrine applied to cognition governance.

---

## The Triage Bot Role — Now Formally Defined

The Triage Bot is no longer "an approval queue."

It is: **the continuity mutation gateway.**

```
No operational mutation enters continuity
without passing through governed proposal lifecycle enforcement.
```

This is the law that separates AI assistants from governed operational cognition infrastructure.

The Triage Bot:

- Receives proposals from the Twin
- Scores governance level
- Routes to auto-approval or HITL queue
- Is the SOLE mutation gateway between cognition and operations

---

## Lineage — The Hidden Breakthrough

Every operational action can now trace back to:

- Originating signal (what the Twin saw)
- Originating cognition (what the Twin reasoned)
- Originating evidence (what data supported it)
- Originating confidence (how certain the Twin was)
- Originating continuity state (what the entity looked like)

This gives the system: **explainable operational cognition.**

The `lineage_id` is shared across all proposals in a reasoning chain. `getProposalLineage()` returns the full chain in chronological order.

---

## Architectural Laws (Locked)

These laws are now enforced by the proposal system:

```
LAW 1: Twin proposes. Triage governs. Human approves. Operator executes. Spine records.
       No step may be skipped.

LAW 2: Cognition ≠ mutation.
       The Twin never directly mutates Ops state.

LAW 3: Lineage is immutable.
       No proposal is hard-deleted. Superseded proposals are preserved.

LAW 4: Every terminal state triggers continuity writeback.
       completed, rejected, and failed all write back to Spine/org_memory.

LAW 5: Ops receives projections, not internals.
       toOpsProjection() is the only shape the Ops surface consumes.

LAW 6: Governance level is auto-resolved from signal data.
       It is never hardcoded by the caller.
```

---

## What This Enables (Future)

Now that Proposal exists canonically, future systems can build on:

- **Replay** — re-run a proposal chain against new data
- **Simulation** — what would happen if this proposal were approved?
- **Drift analysis** — how has proposal confidence changed over time for an entity?
- **Proposal learning** — which proposal types get approved/rejected most?
- **Confidence calibration** — tune SignalAnalyzer thresholds from approval history
- **Autonomous trust escalation** — auto-approve proposal types with 100% approval history
- **Execution benchmarking** — how long does each action_type take to execute?
- **Governance analytics** — policy effectiveness, review latency, rejection patterns
- **Continuity evolution tracking** — how does an entity's state change across proposal chains?

All of this is possible because the mutation lifecycle is now **explicit**.

---

## Files Created

| File                                                     | Purpose                                                                      |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `packages/types/src/proposal.ts`                         | Canonical type contract + state machine                                      |
| `services/govern/src/proposal.ts`                        | Lifecycle engine (create, approve, reject, execute, complete, fail, lineage) |
| `services/govern/src/index.ts`                           | 9 new proposal routes wired into govern service                              |
| `packages/spineDb/migrations/032_governed_proposals.sql` | DB schema with RLS, indexes, enum types                                      |
| `services/intelligence/src/index.ts`                     | Twin now calls `POST /v1/proposals` instead of writing flat actions          |

---

## API Surface

```
POST   /v1/proposals                        — Twin/Triage submits proposal
GET    /v1/proposals                        — Ops queue (pending + approved, priority-sorted)
GET    /v1/proposals/:id                    — Single proposal
POST   /v1/proposals/:id/approve            — Human approves
POST   /v1/proposals/:id/reject             — Human rejects (review_notes required)
POST   /v1/proposals/:id/execute            — Operator starts execution
POST   /v1/proposals/:id/complete           — Operator confirms completion
POST   /v1/proposals/:id/fail               — Execution failed
GET    /v1/proposals/lineage/:lineage_id    — Full reasoning chain
```

---

## Context

This architectural completion was reached on May 28, 2026, during a session focused on the Twin → Ops handover path.

The realization: the system could think and the system could operate, but the governed continuity bridge between thinking and operating was not yet canonicalized.

That bridge now exists.

---

_This document is a permanent architectural record. It belongs in the doctrine layer alongside the founding four axioms._
