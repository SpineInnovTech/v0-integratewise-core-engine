# TruthLayer (SpineVault) — Approval-Gated Memory Layer

> The platform capability beneath all three surfaces.
> Named capability, not a standalone product. Appears in every Full Twin product.
> AI proposes. You approve. Truth is written once. Every AI reads from it.

---

## What SpineVault Is

SpineVault is the verified, approval-gated memory layer that sits on the Spine. It is the reason IntegrateWise exists as a trusted platform rather than another AI dashboard.

Every AI interaction — conversations, tool outputs, data syncs, agent suggestions — passes through a triage bot before anything becomes truth. The triage bot proposes memory entries. You approve or reject. Only approved entries become Spine truth. That truth is open — any AI, any tool, any agent can read from it via MCP. But nothing writes without your approval.

---

## The Problem SpineVault Solves

The market has a $67 billion hallucination problem and nobody has built the answer.

Every major player shipped AI memory in 2025:

- **ChatGPT Memory**: Stores ~1,750 words, writes automatically, two major wipe incidents, researchers demonstrated memory hallucination across contexts
- **Gemini**: Opt-in but still auto-writes. No triage. No approval workflow
- **Microsoft Copilot**: Stores in Exchange mailboxes with enterprise compliance but no semantic triage — governance after the fact, not at the point of creation
- **Mem0** ($24M raised): Portable memory infrastructure but no approval gate — plumbing without governance
- **Guru** ($25/user/month): Approval workflows but only for enterprise knowledge articles — not personal memory, not cross-system, not AI-native

All of them let AI write to memory automatically. None implemented what SpineVault does.

### Market validation

- 82% of consumers see AI data collection as a serious threat
- 76% of enterprises implement human-in-the-loop specifically to catch hallucinations
- Only 17% of people trust AI without human oversight — 83% want exactly what SpineVault provides

---

## How SpineVault Works

```
ANY AI (Claude, GPT, Grok, Gemini, MCP, your own models)
    │
    ├── READ: Yes — all AIs read from verified Spine truth
    │         (approved, verified knowledge only)
    │
    └── WRITE: Only through the SpineVault approval gate
              │
              ├── AI generates insight / fact / decision / observation
              │
              ├── Triage Bot (Workers AI) processes:
              │   ├── Entity extraction (who/what is this about?)
              │   ├── Sentiment analysis
              │   ├── Key fact extraction
              │   ├── Confidence scoring (0.0 — 1.0)
              │   ├── Source attribution (which AI, which session)
              │   └── Duplicate detection against existing memory
              │
              ├── Routing decision:
              │   ├── High confidence + trusted source → auto-approve (configurable)
              │   ├── Low confidence → human review queue
              │   ├── New/unknown source → human review queue
              │   └── Conflicting with existing memory → human review queue
              │
              ├── Human review (governance layer, inline in Operational Workbench):
              │   ├── Approve → becomes approved knowledge with audit lineage
              │   ├── Reject → logged but never stored as fact
              │   ├── Edit → modify before approving
              │   └── Defer → revisit later
              │
              └── Approved truth:
                  ├── Written to Knowledge consolidated_memories
                  ├── Feeds Entity 360 Memory layer
                  ├── Available to all AIs via MCP read
                  ├── Full audit trail (who approved, when, from which AI)
                  └── Memory types: decision, preference, insight, action, rule, fact
```

---

## SpineVault Across Three Surfaces

### In Account Success

The triage bot watches every customer interaction across Salesforce, Zendesk, Slack, email, meetings.

| What happens  | Example                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| AI proposes   | "Customer X mentioned budget freeze in last QBR — flag as risk signal?" |
| You approve   | That becomes verified account memory                                    |
| Twin reads it | ChurnShield now factors confirmed budget freeze into churn prediction   |
| Result        | No hallucinated risk score triggers a false alarm to the CRO            |

Products that use SpineVault memory:

- **SuccessPilot** (Basic Twin) — reads verified memory for next-best-action
- **ChurnShield** (Full Twin) — reads verified memory for churn prediction, writes intervention proposals through SpineVault
- **SuccessCommand** (Full Twin) — reads full verified memory for strategic account planning

### In Business Ops

The triage bot watches financial data, vendor communications, team updates, operational signals.

| What happens  | Example                                                            |
| ------------- | ------------------------------------------------------------------ |
| AI proposes   | "Vendor Y invoice is 22% above contracted rate — flag for review?" |
| You approve   | That becomes verified operational truth                            |
| Twin reads it | FinPulse now factors confirmed overspend into budget projections   |
| Result        | No hallucinated financial projections in your board deck           |

Products that use SpineVault memory:

- **GrowthDesk** (Basic Twin) — reads verified memory for GTM pattern detection
- **FinPulse** (Full Twin) — reads verified memory for financial projections, writes budget proposals through SpineVault
- **OpsCore** (Full Twin) — reads full verified memory for cross-functional operating decisions

### In Personal Space

The triage bot watches goals, health data, learning progress, relationship interactions.

| What happens  | Example                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| AI proposes   | "You completed Module 7 of AWS certification — update learning path?"    |
| You approve   | That becomes verified personal truth                                     |
| Twin reads it | LifeOps now knows your real progress, not an AI's guess                  |
| Result        | Your personal memory is yours — verified, portable, accessible to any AI |

Products that use SpineVault memory:

- **LearningDesk** (Basic Twin) — reads verified memory for learning path suggestions
- **RelationshipMap** (Basic Twin) — reads verified memory for follow-up context
- **LifeOps** (Full Twin) — reads full verified memory for life operating decisions

---

## SpineVault Features

### Triage Bot

- Entity extraction from any AI output
- Sentiment analysis
- Key fact extraction
- Confidence scoring (0.0 — 1.0)
- Source attribution (which AI, which session, which tool)
- Duplicate detection against existing verified memory
- Conflict detection (new fact contradicts existing verified fact)

### Approval Gate

- Auto-approve rules (configurable per tenant):
  - Trusted sources (e.g., "claude", "system")
  - Minimum confidence threshold (e.g., 0.8)
  - Rate limit (max auto-approves per day)
  - Entity link required (must reference a known entity)
- Human review queue (governance layer):
  - Approve / Reject / Edit / Defer
  - Bulk approve for high-confidence batches
  - Filter by source AI, confidence level, entity
- Notification on pending reviews (FCM, in-app)

### Verified Memory Store

- Memory types: decision, preference, insight, action, rule, fact
- Entity-linked (every memory tied to an entity in the Spine)
- Source-attributed (which AI generated it, when, in what context)
- Confidence-scored (0.0 — 1.0, visible in UI)
- Revocable (approved memory can be revoked — logged but removed from active truth)
- Versioned (memory updates create new versions, old versions preserved)

### Open Read Layer

- Any AI reads from the same verified truth via Entity 360 Memory layer
- MCP-accessible (external AIs can read via MCP connector)
- No vendor lock-in — switch AI providers, the verified memory stays
- Cross-surface (Account Success memory, Business Ops memory, Personal memory — all in one Spine)

### Audit Trail

- Every memory entry: who proposed, which AI, confidence score, when
- Every approval: who approved/rejected, when, reason
- Every revocation: who revoked, when, reason
- Every read: which AI/agent accessed which memory (optional, configurable)
- Exportable for compliance

---

## SpineVault Configuration

```typescript
// Per-tenant SpineVault configuration
{
  auto_approve: {
    enabled: true,
    trusted_sources: ["claude", "system", "mcp"],
    min_confidence: 0.8,
    max_per_day: 50,
    require_entity_link: true,
  },
  triage: {
    conflict_detection: true,      // flag when new memory contradicts existing
    duplicate_detection: true,      // flag when similar memory already exists
    sentiment_analysis: true,       // extract sentiment from AI output
    entity_extraction: true,        // auto-link to entities in Spine
  },
  notifications: {
    on_auto_approve: true,          // notify when something is auto-approved
    on_pending_review: true,        // notify when human review needed
    on_conflict_detected: true,     // notify when memory conflict found
    channel: "in_app",              // "in_app" | "email" | "fcm" | "slack"
  },
  memory_types: {
    allowed: ["decision", "preference", "insight", "action", "rule", "fact"],
    require_type: true,             // triage bot must classify memory type
  },
  retention: {
    auto_archive_after_days: null,  // null = keep forever
    require_periodic_review: false, // prompt user to re-verify old memories
  }
}
```

---

## Competitive Positioning

| Capability               | ChatGPT Memory | Gemini           | Copilot           | Mem0    | Guru                   | **SpineVault**                |
| ------------------------ | -------------- | ---------------- | ----------------- | ------- | ---------------------- | ----------------------------- |
| AI writes to memory      | Auto           | Auto             | Auto              | Auto    | Manual (articles only) | **Triage → Approval → Truth** |
| Human approval gate      | No             | No               | No                | No      | Yes (articles)         | **Yes (everything)**          |
| Triage bot scoring       | No             | No               | No                | No      | No                     | **Yes**                       |
| Multi-AI read            | No (GPT only)  | No (Gemini only) | No (Copilot only) | Yes     | No                     | **Yes (any AI via MCP)**      |
| Entity-linked memory     | No             | No               | No                | Partial | No                     | **Yes (Spine entities)**      |
| Cross-system context     | No             | No               | Partial           | Partial | No                     | **Yes (70+ connectors)**      |
| Confidence scoring       | No             | No               | No                | No      | No                     | **Yes (0.0–1.0)**             |
| Conflict detection       | No             | No               | No                | No      | No                     | **Yes**                       |
| Audit trail              | No             | No               | Partial           | No      | Yes                    | **Full**                      |
| Memory portability       | No             | No               | No                | Yes     | No                     | **Yes**                       |
| Hallucination prevention | After the fact | After the fact   | After the fact    | None    | N/A                    | **At point of creation**      |

---

## Pricing Implication

SpineVault is not a standalone SKU. It is the capability that justifies the Full Twin pricing tier.

| Tier                        | SpineVault access    | What it means                                                                                    |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| No Twin (Data + Dashboards) | Read-only            | Products see verified memory but don't generate new memory proposals                             |
| Basic Twin                  | Read + limited write | Twin proposes memory entries, auto-approve for high-confidence, human review for rest            |
| Full Twin                   | Full SpineVault      | Twin proposes, drafts, learns. Full triage pipeline. Full approval workflow. Full learning loop. |

The Twin without verified memory is just another chatbot guessing.
The Twin WITH verified memory is an advisor you can actually trust.
That trust delta is worth the entire pricing gap between Basic Twin and Full Twin.

---

## The Positioning Line

> "Every AI remembers. Only IntegrateWise remembers the truth."

> "AI proposes. You approve. Truth is written once. Every AI reads from it. Nothing hallucinated. Nothing assumed. Nothing written without your say."

---

## Where SpineVault Lives in the UI

- **Governance** — Triage / approval queue embedded in the Operational Workbench
- **Entity 360 Memory layer** — Every entity's verified memory visible with source attribution and confidence
- **Twin Insight panels** — Every Twin insight shows which verified memories it used as evidence
- **Notification Center** — Pending SpineVault reviews surface as notifications with badge count
- **Command Palette** — Quick access to triage queue via ⌘K search

---

## Summary

TruthLayer is not product #21. It is the architectural reason IntegrateWise exists.

The Spine without verified memory is just a database.
The Spine with approval-gated memory is the first AI platform people can actually trust.

Every Full Twin product (ChurnShield, SuccessCommand, FinPulse, OpsCore, LifeOps) is powered by TruthLayer. Every Basic Twin product (SuccessPilot, DealDesk, GrowthDesk, HirePilot, LearningDesk, RelationshipMap) reads from TruthLayer. Every No Twin product (DataSentinel, VaultGuard, ArchitectIQ, TemplateForge, ComplianceVault, VendorGuard, PartnerBridge, WealthPilot, WellnessCore) benefits from the verified data TruthLayer ensures.

20 products. 1 truth layer. The first AI platform people can actually trust.
