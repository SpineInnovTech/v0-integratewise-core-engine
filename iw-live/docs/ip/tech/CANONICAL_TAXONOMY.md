# IntegrateWise — Canonical Taxonomy (FINAL)

> **Version:** 1.0 | **Date:** 2026-06-09 | **Status:** Canonical — locked
> **Authority:** Nirmal (Founder)
> **Rule:** These four path-series are orthogonal. Never collapse them into one
> layer-number hierarchy. Each answers a different question.

There is **one platform** seen through **four orthogonal paths**. A surface (S),
a stage (U), a render (V), and a self-run loop (CZ) can all describe the same
moment — they are not the same axis. Use the right prefix for the right question.

```
S-series  System Architecture     "how is the platform built?"   (surfaces)
U-series  Human Operating Model   "what is the human doing?"      (cognitive stages)
V-series  View Path               "how is information rendered?"  (render modes)
CZ-series Customer Zero Path      "how does IW run itself?"       (self-operation loop)
```

> Supersedes prior numbering: the earlier "H-series" Human Operating Model is
> renamed to **U-series**. The "L0–L4" UI layers are the **S-series** (the
> product surface table renders S1–S4 as L1–L4 — same thing; prefer S going forward).

---

## S-series — System Architecture (how IntegrateWise is built)

```
S0 Infrastructure   Nango · Connector-sync · Loader · Normalizer · Spine ·
                    Main Memory · Spine Cache · Continuity Bridge (Gateway · ADK · Auth)
                    — invisible to users.

S1 Workspace        Owner: IntegrateWise
                    Purpose: DO WORK
                    /desk · /entity360 · /inbox · /build · /run · /grow · /tasks ·
                    /horizon · /decide · /react · 12 domain views
                    Contains: Desk · Inbox · Entity360 · Tasks · Pipeline · Projects ·
                    Reports · Approvals · Actions · Triage · Domain Views
                    This is where users spend their day. OWUI never owns this.

S2 Awareness        Owner: IntegrateWise
                    Purpose: NOTICE
                    Drawer · Signals · Scoring · Predictions · Insights · Evidence ·
                    Lineage · Readiness · Triage · Governance Queue
                    THIS IS THE MOAT. If IW disappears and only OWUI remains,
                    signals, scoring, predictions, entity awareness, and governance
                    all disappear. The intelligence lives here, not in the chat.

S3 Twin             Owner: Open WebUI (runtime) + IntegrateWise (intelligence via Bridge)
                    Purpose: THINK
                    Open WebUI · Agent Zero · Grok-4.3 · x.ai voice "eve" ·
                    MCP tools · Reasoning · Planning · Playbooks · Briefings
                    The Twin is the CONVERSATION LAYER for the Spine.
                    Not the source of truth. Not the governance system.
                    Not the memory system. Just the reasoning surface.

S4 Library          Owner: IntegrateWise
                    Purpose: KNOW
                    Coda · Org Memory · Personal Memory · Book of Projects ·
                    Doctrine · Decisions · Research · Knowledge Assets
                    The permanent memory substrate.
                    The Twin reads from it. The Twin does not own it.
```

> The product surface table (L1–L4) = S1–S4. All surfaces read from Spine Cache.
> Open WebUI powers the Twin. IntegrateWise powers the intelligence.
> See: `docs/tech/LAYER_OWNERSHIP_AND_TWIN_RUNTIME.md` for full ownership doctrine.

---

## U-series — Human Operating Model (what the human does)

```
U1 Work       User operating              CRM · Projects · Campaigns · Operations
U2 Notice     Twin notices                Risk · Opportunity · Change · Alert
U3 Reason     User engages Twin           Why? · What changed? · What should we do?
U4 Decide     Governance                  Approve · Reject · Delegate · Escalate
U5 Act        Execution                   Playbook · Workflow · Agent · Human action
U6 Remember   Memory creation             Decision · Commitment · Learning · Policy → Memory
```

---

## V-series — View Path (how information is rendered)

```
V1 Operational   tables, queues, lists, KPI strips (work data)
V2 Entity        Entity 360 assembly (Spine ∩ Memory ∩ Signals)
V3 Awareness     signal cards, drawer overlays, presence
V4 Reasoning     reasoning stream, proposals, evidence
V5 Governance    proposal queue, decision ledger, audit lineage
V6 Execution     task trees, tool-call logs, playbook status
V7 Knowledge     library tree/graph/node, memory browser, lineage
```

---

## CZ-series — Customer Zero Path (how IntegrateWise runs itself)

```
CZ1 Build      build the product (this repo, the agents, the pipeline)
CZ2 Operate    run ops on IW itself (integratewise-ops, the Twin, the vault)
CZ3 Sell       GTM, positioning, pipeline — IW selling IW
CZ4 Deliver    onboarding, success, the Continuity Bridge in customers' hands
CZ5 Learn      capture decisions/learnings into governed memory
CZ6 Improve    promote learnings → doctrine → next iteration
```

---

## Cross-mapping (orthogonal — a row is "primarily supports", not "equals")

```
SYSTEM (S)          USER (U)         VIEW (V)              CUSTOMER ZERO (CZ)
S1 Workspace    →   U1 Work      →   V1 Operational / V2 Entity   →   CZ2 Operate
S2 Awareness    →   U2 Notice    →   V3 Awareness                 →   CZ2 Operate
S3 Twin         →   U3 Reason    →   V4 Reasoning                 →   CZ1/CZ3/CZ5
(governance)    →   U4 Decide    →   V5 Governance                →   CZ5 Learn
(execution)     →   U5 Act       →   V6 Execution                 →   CZ4 Deliver
S4 Library      →   U6 Remember  →   V7 Knowledge                 →   CZ6 Improve
```

---

## Governance, stated in the locked vocabulary

```
Approval is the U4 Decide stage.
Its UI is surfaced on the S2 Awareness surface (rendered as V5 Governance).
It is NEVER performed in the S3 Twin chat — chat is not an audit trail.
The Twin (U3 Reason on S3) only PROPOSES. It never Decides (U4) or Acts (U5).
```

Equivalent to the product-table note: _"Approval UI lives in L2 (=S2 Awareness)
only — never in L3 (=S3 Twin) chat."_

---

## The Rule (locked)

```
S = System surfaces      ·  use for "where / what surface"
U = Human stages         ·  use for "what is the human doing"
V = Render modes         ·  use for "how is it displayed"
CZ = Self-operation loop ·  use for "how IW runs itself"

Never describe a cognitive stage with an S number.
Never describe a surface with a U number.
Never describe a render mode with S or U.
One platform. Four orthogonal views.
```

---

_One platform, four paths. System builds it. Users operate it. Views render it.
Customer Zero proves it._
