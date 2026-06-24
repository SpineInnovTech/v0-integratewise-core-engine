---
name: Contextual memory moat
description: Doctrine for the local "one memory that compounds as tools connect" layer — the single remember() doorway, idempotent growth, honest availability, and the deferred cross-entity identity gap.
---

# Contextual memory moat (local connective tissue)

The moat is ONE contextual memory of the user/org that COMPOUNDS as tools connect,
built LOCALLY in Customer Zero as the demoable surface. It is explicitly **NOT** a
6th Spine SQL generation and **NOT** a Spine write — it is local connective tissue
(memory_atoms + goals/metrics + an assembler) over the relay's own Postgres.

## Rules (do not violate without re-deciding)

- **Single doorway.** Every growth path — connectors (Gmail), the Twin, manual notes —
  MUST funnel through `memory-writer-service.remember()`. Do not insert atoms directly.
  **Why:** the idempotency key (tenant|subjectType|subjectId|kind|connector|external_id-or-source_id|body_hash)
  is what makes re-ingest DEEPEN coverage instead of INFLATING it (duplicating). Bypassing
  remember() breaks the "compounds, never duplicates" guarantee that is the whole demo.
  **How to apply:** when wiring any new connector/tool, map its records to RememberInput and call remember().

- **Assembler does not own truth.** The ContextPacket is a provenance-tagged projection with
  explicit per-store availability/coverage; mirror the no-silent-fallback pattern. Embeddings
  degrade honestly to lexical + salience + recency with `availability.embedding="unavailable"`
  (semantic store shows OFF in the UI), never a faked vector.

## Decisions (consistency anchors)

- **Memory is written even in Gmail ingest `dryRun`.** dryRun suppresses *Spine writes* only;
  memory atoms are local and idempotent, like the schema-delta upserts that already run in dryRun.
  **Why:** the moat's growth must not require the governed Spine-propose path. If dryRun semantics
  ever become user-facing, add an explicit `writeMemory=false` flag rather than silently changing this.

- **Twin memory write is best-effort (try/catch + console.error).** The Twin is draft-only; the
  memory atom is a side effect of returning a draft. A memory hiccup must never break the draft.
  **Why:** this is NOT a no-silent-fallback violation — no *truth* is faked; only a non-essential
  side-effect write is swallowed (and logged).

## Known gap (DEFERRED — cross-entity identity resolution)

Gmail atoms key to **contact** subjects (`gmail:contact:<emailLower>`), but the Contextual Memory
UI subject selector and the live structured assembler are **lead-only**. So Gmail compounding is
provable via the packet/coverage API for a contact subject, but is NOT naturally visible in the
lead-focused UI. The Twin path keys directly to the lead UUID, so Twin compounding IS visible in the
lead packet/UI. To make Gmail visible later: bridge `lead.email === sender_email`, or add
contact-subject selection to the UI. Do not treat this gap as a bug — it is the documented deferral.
