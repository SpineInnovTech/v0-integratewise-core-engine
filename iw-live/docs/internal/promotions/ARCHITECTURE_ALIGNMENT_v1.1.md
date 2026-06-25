# Promotion Package — Architecture Alignment v1.1

> **⚠️ SUPERSEDED (2026-06-12):** This is a dated v1.1 snapshot from 2026-06-09. Its data-layer
> facts (the legacy SQL fortress and its auth path) are RETIRED by DECISION 22 (100% Cloudflare —
> single plane, no legacy store). Read it as history only. Current canon:
> `docs/architecture/PRODUCT_ARCHITECTURE.md`, `docs/architecture/SPINE_MODEL.md`, `AGENTS.md`,
> and the map in `docs/CANON.md`.
>
> **Status:** APPLIED DIRECTLY — authorized by Nirmal (Founder) on 2026-06-09,
> overriding the Triage-first default for this batch. Founder is the owner of the
> governance rule and explicitly directed direct application. Manifest update still required.
> **Date:** 2026-06-09 | **Authority:** Nirmal (Founder)
> **Source of truth:** `integratewise-live/docs/ARCHITECTURE_INDEX.md`

---

## Why

Architecture facts drifted across `integratewise-docs` and internal docs. This
package freezes the canonical v1.1 facts and lists every change required so the
public/governed docs match the source repo.

## Changes to apply (governed docs)

```
1. TOOL COUNT
   16 / 18  →  20   (figma.* purged 2026-06-06; D-2026-06-06-008)

2. AUTH MODEL
   Supabase Auth (PKCE/JWT)  →  Cloudflare Access (Google + GitHub) + Gateway D1 JWT
   Supabase is fortress DATA record only — never an auth path.

3. DATA TIER
   Supabase is NOT provisioned at signup. Initial users are D1-edge only.
   Supabase fortress is ALLOTTED based on usage, not chosen at signup.

4. BRIDGE FRAMING
   "MCP" as the product  →  Continuity Bridge is the product; MCP is one interface inside it.

5. TWIN ACCESS PATH
   "Twin reads via MCP"  →  Twin reads via Continuity Bridge (continuity-tool-server → pipeline).
   mcp.integratewise.ai is the EXTERNAL door (Claude, ChatGPT, 3rd-party agents).

6. GATEWAY RESPONSIBILITY
   "context assembly"  →  request-context assembly (auth + tenant + policy envelope).
   Data context is Spine Cache; not the Gateway.

7. ADK CLARIFICATION
   Stateless · Zero I/O · capability resolution only · no tenant/data access before Gateway auth.

8. SPINE ABSTRACTION (operating model)
   Tools push to Spine once; agents read from Spine forever; agents never read tools directly.
   Unconnected app → authorize THROUGH IntegrateWise → data lands in Spine → agent reads Spine.
   Never agent → direct tool.

9. CANONICAL TAXONOMY (four orthogonal path-series — stop using one L-number)
   S-series = System Architecture (S0 Infra · S1 Workspace · S2 Awareness · S3 Twin · S4 Library)
   U-series = Human Operating Model (U1 Work · U2 Notice · U3 Reason · U4 Decide · U5 Act · U6 Remember)
   V-series = View Path · CZ-series = Customer Zero Path
   Approval = U4 Decide; UI on S2 Awareness; never in S3 Twin chat.
   "L1–L4" UI table = S1–S4. See docs/tech/CANONICAL_TAXONOMY.md.

10. DOCS PUBLICATION (how docs.integratewise.ai + internal docs are produced)
   Governed PROJECTION of org_memory via the docs-publish flow
   (propose → govern → promote → project → publish). integratewise-docs is an
   OUTPUT repo — never hand-edited. Classification routes the surface:
   internal → CF Access gated; public → open. INITIAL LOAD ONLY runs on a separate
   bulk queue (not the live pipeline-process queue); steady-state uses the normal flow.
   See docs/tech/DOCS_PUBLICATION_PIPELINE.md.
```

## Target files in integratewise-docs (audit list)

```
docs/internal/gtm/positioning-framework.md      (tool count, multi-AI via MCP wording)
docs/internal/operations/sync-spec.md           (Signup → Supabase Auth → ... )
docs/internal/operations/api-reference.md        (Authorization: Bearer <supabase_jwt>)
docs/internal/architecture/data-access-patterns.md (Supabase Auth PKCE/JWT, reads via RLS)
docs/internal/architecture/technical-architecture-kt.md (L0–L3 layer naming → S/U series)
docs/internal/architecture/l2-twin-surface-contract.md  (L2 wording → S2 Awareness)
docs/internal/product/spinevault-spec.md          (verify auth/bridge framing)
+ any doc matching the Drift Watchlist in ARCHITECTURE_INDEX.md
```

## Acceptance criteria

```
□ No "Supabase Auth" / "supabase_jwt" as an auth mechanism in governed docs.
□ No "16 tools" / "18 tools" — all read 20.
□ Twin access described as Continuity Bridge, MCP as external door.
□ Layer language uses S-series (surfaces) / U-series (stages); no L/H ambiguity.
□ Approval described as U4 Decide, surfaced on S2 Awareness, never in S3 Twin chat.
□ Docs publication described as governed projection (initial-load carve-out noted).
□ Manifest entry added/updated in IntegrateWise_Document_Manifest.md.
□ Promoted via Triage Bot (governance_state: approved) before publish.
```

---

_Submit this package to Triage. On approval, apply the changes above to the
governed docs and update the Document Manifest. Until then, integratewise-docs
remains untouched._
