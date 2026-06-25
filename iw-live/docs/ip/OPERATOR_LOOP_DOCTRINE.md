# IntegrateWise — Operator Loop Doctrine

**v1.0 · May 28, 2026**  
**Author:** Nirmal, Founder  
**Scope:** Internal reference. The operational proof of Architecture v2.0.  
**Companion to:** `docs/ARCHITECTURE_V2.md`

---

> The Twin generates the _what_. The Operator executes the _how_. MCP closes the loop automatically.

---

## The Three Agents in the System

| Agent                      | What It Is                                 | What It Does                                                                   |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| **IntegrateWise**          | The engine                                 | Normalizes, detects, reasons, surfaces, recommends, routes                     |
| **IntegrateWise Ops**      | The operational layer inside IntegrateWise | Manages the playbook — what needs to happen, in what order, with what priority |
| **IntegrateWise Operator** | The human CSM                              | Executes in native tools (HubSpot, Jira, Slack, Calendar)                      |

---

## The Handoff Point

```
INTEGRATEWISE ENGINE                    OPERATOR (Human)
───────────────────                    ────────────────
Spine: data normalized
        │
        ▼
SignalAnalyzer: "Acme Corp at risk"
        │
        ▼
Intelligent Routing:
"Here's the playbook for Acme Corp:"

┌─────────────────────────────────────────┐
│ PRIORITY 1 — Today                      │
│ → Escalate ACME-234 in Jira to eng lead │
│   Why: 14-day P1, SLA breached          │
│   Tool: Jira                            │
│   Action: Set priority=Critical,        │
│           assign=eng lead,              │
│           add comment                   │
│                                         │
│ PRIORITY 2 — This week                  │
│ → Schedule QBR with Acme CTO            │
│   Why: No engagement 18 days,           │
│         renewal in 42 days              │
│   Tool: HubSpot + Calendar              │
│   Action: Create meeting,               │
│           log activity                  │
│                                         │
│ PRIORITY 3 — This week                  │
│ → Send product roadmap update           │
│   Why: Champion asking about features,  │
│         expansion deal at risk          │
│   Tool: HubSpot email                   │
│   Action: Draft from template,          │
│           personalize, send             │
│                                         │
│ ESTIMATED IMPACT:                       │
│ Health score: 52 → 68 (if all done)     │
│ Risk level: HIGH → MEDIUM               │
│ Renewal confidence: 40% → 72%           │
└─────────────────────────────────────────┘
        │
        │ ← HANDOFF
        ▼
OPERATOR sees this in the workbench
Reads the playbook
Makes the judgment call
Executes in native tools

In Jira: escalates ACME-234        ✓
In HubSpot: schedules QBR          ✓
In HubSpot: sends roadmap email    ✓
        │
        │ ← RETURN (via MCP read)
        ▼
INTEGRATEWISE ENGINE (next sync)
        │
        ▼
MCP connector re-reads HubSpot + Jira
        │
        ▼
Normalizer detects changes:
- ACME-234 priority changed to Critical
- New calendar event: QBR June 3
- New activity: roadmap email sent
        │
        ▼
Spine updates:
- account_master.last_engagement_date = today
- risk.mitigation_status = "in progress"
- engagement_log: new entry (email sent)
- task_item: ACME-234 escalated
        │
        ▼
SignalAnalyzer re-evaluates:
- Health score recalculated: 52 → 64
- Risk level: HIGH → MEDIUM
- Renewal confidence: 40% → 68%
        │
        ▼
Memory records:
"On May 28, Operator escalated ACME-234,
scheduled QBR for June 3, sent roadmap update.
Risk reduced from HIGH to MEDIUM.
Next check: June 4 (post-QBR)."
        │
        ▼
Next playbook generated for next cycle
```

---

## Where the Handoff Occurs

The handoff is the **intelligent routing output** — the ordered, prioritized, tool-specific playbook that the Operator receives.

```
┌─────────────────────────────────────────────────────────────┐
│                    HANDOFF BOUNDARY                          │
│                                                              │
│   INTEGRATEWISE PROVIDES:          OPERATOR EXECUTES:        │
│                                                              │
│   ✓ What to do                    ✓ In which tool            │
│   ✓ In what order                 ✓ With what judgment       │
│   ✓ With what priority            ✓ With what context        │
│   ✓ For which account             ✓ With what timing         │
│   ✓ Why (data-backed)             ✓ With what tone           │
│   ✓ Expected impact               ✓ With what relationship   │
│   ✓ In which tool                                            │
│   ✓ What specific action                                     │
│                                                              │
│   This is INTELLIGENCE.            This is EXECUTION.        │
│   IntegrateWise owns this.         The Operator owns this.   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

The handoff is not a button click. It's not "approve and we'll send the email." It's:

> **"Here is the complete playbook. You are the Operator. Execute in your tools. We'll see the results on the next sync."**

---

## How the Results Return

The Operator doesn't "submit results" back to IntegrateWise. The MCP connectors **pull the results automatically** on the next sync cycle.

```
Operator executes in Jira (escalates ticket)
        │
        │ [hours pass]
        │
        ▼
MCP connector reads Jira on scheduled sync
        │
        ▼
Normalizer detects: ACME-234 has changed
- priority: High → Critical
- assignee: unassigned → eng lead
- new comment: "Escalated per CSM recommendation"
        │
        ▼
Spine updates the entity
        │
        ▼
SignalAnalyzer sees: mitigation in progress
        │
        ▼
Risk score adjusts automatically
        │
        ▼
Memory records the outcome
        │
        ▼
Next playbook reflects the new state
```

**The Operator never "reports back."** IntegrateWise sees the results because it reads the same tools the Operator writes to. The loop closes automatically. That's the architecture — the Operator is inside the loop, not outside it.

---

## Where We Prove This Architecture

**The proof is the closed loop.** Not just one direction. The full cycle:

| Phase           | What Happens                                | Where It Happens                      | Proof                                                         |
| --------------- | ------------------------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| **1. Detect**   | SignalAnalyzer identifies Acme Corp at risk | IntegrateWise engine                  | Risk signal appears in At-Risk Brief                          |
| **2. Route**    | Intelligent playbook generated              | IntegrateWise Ops                     | Playbook shows prioritized actions with tool, reason, impact  |
| **3. Handoff**  | Operator receives the playbook              | Workbench (Account detail)            | Operator reads it, understands it, knows what to do           |
| **4. Execute**  | Operator acts in native tools               | HubSpot, Jira (outside IntegrateWise) | Jira ticket escalated, QBR scheduled, email sent              |
| **5. Return**   | MCP connectors re-read the tools            | IntegrateWise engine                  | Changes detected, entities updated                            |
| **6. Close**    | SignalAnalyzer re-evaluates                 | IntegrateWise engine                  | Risk score drops, memory records outcome                      |
| **7. Compound** | Next playbook generated from enriched state | IntegrateWise Ops                     | New playbook reflects what was done, what worked, what's next |

**The proof moment:** When the Operator executes step 4, and IntegrateWise sees the results in step 5 without the Operator doing anything to "report back." The architecture proves itself when the loop closes automatically.

---

## The OpenClaw Demo (Corrected)

```
[Minute 0-2]
"I manage 25 accounts. My data lives in HubSpot and Jira.
IntegrateWise connected to both. Read-only. My tools aren't affected."

[Minute 2-4]
"The engine ran. It normalized my HubSpot companies and Jira projects
into canonical accounts. Same entity, one view."

[Minute 4-6]
"At-Risk Brief. Acme Corp flagged. Health dropped, 3 P1 bugs,
no engagement in 18 days."

[Minute 6-8]
"Entity 360. Everything about Acme Corp from both tools in one
intelligence canvas. I used to build this picture in my head from 4 tabs."

[Minute 8-10]
"Intelligent routing. IntegrateWise didn't just tell me 'Acme is at risk.'
It told me: 'Escalate ACME-234 in Jira today. Schedule QBR this week.
Send roadmap update.' In that order. With that priority.
For that reason. In that tool."

[Minute 10-12]
"I'm the Operator. I execute in my tools. Watch —
I escalate the Jira ticket.
I schedule the QBR in HubSpot.
I send the email."

[Minute 12-14]
"Now watch what happens. The next sync runs. IntegrateWise sees that
ACME-234 was escalated. It sees the QBR is scheduled. It sees the email
was sent. Risk score drops from HIGH to MEDIUM.
The loop closed. Automatically."

[Minute 14-16]
"Next playbook. IntegrateWise says: 'QBR is in 6 days. Prepare the
pre-read. Here's the account history. Here are the talking points.
Here's what to cover.' The engine got smarter because it saw my actions."

[Minute 16-17]
"Normalize Once, Render Anywhere. Two tools in. Intelligent routing out.
I execute. The loop closes. Memory compounds. This is IntegrateWise."
```

---

## The Architecture, Restated

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  INTEGRATEWISE ENGINE                                    │
│                                                          │
│  MCP ──→ Loader ──→ Normalizer ──→ Spine                │
│                                      │                   │
│                                      ▼                   │
│                              SignalAnalyzer              │
│                                      │                   │
│                                      ▼                   │
│                             Intelligent Routing          │
│                              (the playbook)              │
│                                      │                   │
│                                      ▼                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │              HANDOFF BOUNDARY                      │  │
│  │                                                    │  │
│  │   IntegrateWise provides: the playbook             │  │
│  │   Operator executes: in native tools               │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                      │                   │
│                                      ▼                   │
│  MCP re-reads tools ◄── Operator's actions detected      │
│      │                                                    │
│      ▼                                                    │
│  Spine updates ──→ SignalAnalyzer re-evaluates            │
│      │                      │                             │
│      ▼                      ▼                             │
│  Memory records      Next playbook generated              │
│      │                                                    │
│      └──────────── Loop continues ────────────────────┘  │
│                                                          │
│  INTEGRATEWISE OWNS: Memory, Intelligence, Routing       │
│  OPERATOR OWNS: Execution, Judgment, Timing              │
│  MCP CONNECTS THE TWO                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## The One-Line Statement

> **"The Twin generates the what. The Operator executes the how. MCP closes the loop automatically."**

This is what Architecture v2.0 means. The Operator IS the execution stack. The playbook IS the handoff. The MCP re-read IS the return path. The loop IS the proof.

This is IntegrateWise.

---

_Document: IntegrateWise Operator Loop Doctrine v1.0_  
_Author: Nirmal, Founder_  
_Companion to: `docs/ARCHITECTURE_V2.md`_
