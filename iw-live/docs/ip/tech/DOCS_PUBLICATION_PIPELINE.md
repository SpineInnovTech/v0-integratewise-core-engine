# IntegrateWise — Docs Publication Pipeline (internal + public)

> **Version:** 1.1 | **Date:** 2026-06-09 | **Status:** Canonical (design + doctrine)
> **Authority:** Nirmal (Founder)
> **Implements:** AGENTS.md "Connection 5 — Live → BrandDocumentations → integratewise-docs"
> **Companions:** `ARCHITECTURE_INDEX.md`, `MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md`

---

## 1. Principle — ALL docs are a governed projection of org_memory

Both **internal** docs (engineering / product / ops reference) and **public** docs
(`docs.integratewise.ai`) are projections of org_memory, rendered by the
docs-publish flow. Neither doc track is hand-published. The only difference between
them is **classification** → which decides the access gate and the sanitization
level. The path is identical:

```
No agent (and no human) hand-publishes a doc — internal or public.
Content is PROPOSED → GOVERNED → PROMOTED → PROJECTED → PUBLISHED.
docs-publish is the only writer of the published projection (humans never hand-edit).
```

> **Initial load scoping (the one carve-out):** the **one-time bulk seed** of the
> existing docs corpus runs on a **separate bulk path — NOT the live pipeline**
> (`pipeline-process`). It uses an isolated, lower-priority bulk queue (mirroring
> `BULK_MEMORY_QUEUE`) so backfilling the corpus never creates backpressure on live
> operations. **Steady-state (ongoing) publication** uses the normal governed flow
> below. This carve-out applies to the initial load only.

The docs repos are **outputs**, not inputs. Edits happen at the source
(org_memory), never in the rendered repo.

---

## 2. Two tracks, one publication path — routed by classification

```
classification = internal                  classification = public
  ─────────────────────────                  ─────────────────────────
  Audience: team / operators / agents        Audience: anyone
  Surface:  internal docs portal             Surface: docs.integratewise.ai
            (CF Access gated)                           (public, no auth)
  Repo:     integratewise-docs/docs/internal integratewise-docs/docs/ (public)
  Sanitize: strip secrets + raw credentials  strip secrets + PII + internal IDs
            (internal IDs/arch allowed)                 + tenant data + internal-only arch
  Gate:     CF Access (team identity)         none (public)
  Threshold: approved + classification=internal  approved + classification=public
                                                 + public-sanitization PASSED
```

Same Triage governance. Same docs-publish writer. Same no-archive + lineage rules.
Only the **filter, sanitization depth, and destination/gate** differ.

---

## 2. The publication flow (end to end)

```
UPSTREAM (how the source itself is earned)
  conversation → conversational_memory (raw capture)
              → propose → Triage (govern) → org_memory (approved/published)
  org_memory is NEVER authored directly. It is the governed promotion of
  conversational_memory. Docs project only from this earned layer.

SOURCE (record of truth for projection)
  org_memory WHERE governance_state = 'approved' | 'published'
  (D1 / Supabase fortress for promoted tenants; filesystem vault mirror)
        │
        ▼
SELECT (publishable subset — by classification)
  PUBLIC track:   classification = public   AND governance_state IN (approved, published)
  INTERNAL track: classification = internal AND governance_state IN (approved, published)
  Exclude (both): staging, rejected, superseded-without-replacement
        │
        ▼
TRANSFORM (docs-publish flow — projection stage)
  • render org_memory entries → doc pages (frontmatter + body)
  • resolve lineage (supersedes / superseded_by) into version notes
  • sanitize by track:
      PUBLIC   → strip secrets + PII + internal IDs + tenant data + internal-only arch
      INTERNAL → strip secrets + raw credentials (internal IDs/arch allowed)
  • map to Document Manifest entry (slug, section, nav order, classification)
        │
        ▼
PUBLISH (GitHub API → integratewise-docs)
  • docs-publish service commits rendered pages via GitHub API:
      PUBLIC   → integratewise-docs/docs/        (public site root)
      INTERNAL → integratewise-docs/docs/internal/ (CF Access gated)
  • Updates IntegrateWise_Document_Manifest.md (the docs index)
  • Marks source org_memory entry governance_state = 'published'
        │
        ▼
BUILD & SERVE
  PUBLIC   → docs.integratewise.ai            (Cloudflare, public)
  INTERNAL → docs.integratewise.ai/internal   (Cloudflare + CF Access team gate)
        │
        ▼
INDEX (AI Search — derived retrieval, not a source)
  • embed each published page → AI Search / Vectorize
  • namespace by classification:  docs-public  |  docs-internal
  • metadata: slug, classification, tenant scope, governance_state, lineage
  • retrieval is access-scoped: internal namespace only reachable by gated
    (CF Access) agents/users; public namespace open to any authorized reader
  • re-embed on re-projection; drop on supersede/takedown (lineage preserved)
```

> AI Search is a **derived index of the published projection**, never authored
> directly. org_memory remains the source of truth; the rendered page is the
> projection; the embedding is a retrieval accelerator. If the AI Search index is
> wiped it rebuilds from the published pages — same rebuildable-cache discipline
> as Spine Cache. This is what lets the Twin answer "what do our docs say about X"
> via `kb.search` / `memory.search_org` without ever reading the docs repo directly.

> The transform/publish stages run in the **docs-publish flow** (a projection +
> GitHub-publish job). **Initial-load carve-out:** the one-time bulk seed of the
> existing corpus runs on a **separate bulk queue, not the live `pipeline-process`
> queue** (backpressure isolation, like `BULK_MEMORY_QUEUE`). Steady-state
> publication uses the normal governed flow. Either way, docs are a projection of
> governed org_memory and `integratewise-docs` is an output repo, never hand-edited.

---

## 3. Governance gate (same Triage Bot, classification-aware threshold)

```
PROPOSE    memory.propose with classification ∈ {internal, public} → proposals (D1)
GOVERN     Triage Bot scores. Both tracks require:
             • governance_state = approved
             • classification set (internal | public)
             • sanitization check PASSED for that track
                 internal → no secrets / raw credentials
                 public   → no secrets / PII / internal IDs / tenant data
           ≥ 0.85 auto-approve · 0.60–0.84 HITL (L2) · < 0.60 reject
PROMOTE    approved → eligible for projection on its track
PUBLISH    docs-publish service projects → integratewise-docs → internal or public surface
           → source entry flipped to governance_state = published
```

No doc — internal or public — exists without a promoted, governed org_memory entry.

---

## 4. No-archive + lineage (carried into all docs)

```
Every page (internal + public) inherits the no-archive rule (D-2026-06-05-013):
  • active        → published and current
  • superseded    → replaced; old page shows "replaced by [X]" with lineage link
  • rejected      → never published
No archive tab. No hidden pages. Unpublishing requires a superseding entry or an
explicit governed takedown decision (logged with reason).
```

---

## 5. Update flow (how a doc changes — internal or public)

```
1. Edit happens at the SOURCE (org_memory), never in integratewise-docs.
2. Re-propose → Triage → approve.
3. docs-publish service re-projects the page (new version; old version linked as lineage).
4. Manifest updated. Site rebuilds. docs.integratewise.ai reflects the change.

To align existing drifted public docs (v1.1 facts), use the promotion package:
  docs/promotions/ARCHITECTURE_ALIGNMENT_v1.1.md  → submit through Triage.
```

---

## 6. Invariants

```
• docs-publish is the only writer of the published projection (internal + public);
  humans never hand-edit. INITIAL LOAD ONLY uses a separate bulk queue (not the
  live pipeline-process queue) for backpressure isolation; steady-state uses the
  normal governed flow.
• integratewise-docs is an OUTPUT repo — never hand-edited (internal or public).
• Every page (internal or public) traces to an approved/published org_memory entry.
• Sanitization is a hard gate before publish — depth set by classification.
• Internal surface is CF Access gated; public surface is open.
• Document Manifest is the index (carries classification); updated by docs-publish.
• AI Search is a DERIVED retrieval index of published pages (namespaced
  docs-public / docs-internal), never a source of truth; access-scoped by
  classification; rebuildable from the published projection.
• Same governance model as the Spine: propose → govern → promote → publish.
```

---

## 7. Build status

```
PENDING (Phase 4 — Docs):
  □ docs-publish flow — org_memory → pages (steady-state)
  □ INITIAL LOAD: separate bulk-seed queue (NOT live pipeline-process; backpressure isolation)
  □ classification routing (internal → /docs/internal gated; public → /docs)
  □ GitHub API publish step (commit to integratewise-docs + Manifest update)
  □ sanitization gate (per-track scrub: internal vs public) in transform
  □ CF Access gate on the internal docs surface (docs.integratewise.ai/internal)
  □ governance_state lifecycle: approved → published flip on publish
  □ AI Search indexing of published pages (namespaces: docs-public / docs-internal;
    access-scoped retrieval; re-embed on re-projection; drop on supersede)
  □ wire docs build to consume the projected output only (both tracks)
```

---

_All docs — internal and public — are projections of org_memory, published by the
docs-publish flow. The one-time initial corpus load runs on a separate bulk queue
(not the live pipeline). Classification decides the gate and the sanitization
depth. Connect once, govern once, publish the truth. The repo is the output,
never the input._
