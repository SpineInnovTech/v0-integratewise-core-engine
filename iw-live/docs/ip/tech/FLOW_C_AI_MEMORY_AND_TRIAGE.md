## Current Surface-Binding Doctrine

- Operational Workbench = the primary work surface; left sidebar nav; Twin sidebar pops out when needed.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- OpenWebUI is not the customer-facing product shell.
- Twin / OpenWebUI runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

Use older L1/L2 / workspace / knowledge-UI language in this file through that boundary if any historical phrasing remains.

---

# Flow C: AI Memory & Triage

## Principle

Flow C (AI reasoning) NEVER writes directly to Spine. All AI-generated content goes through triage → governance review → approved knowledge. Only approved content feeds Entity 360.

## Architecture

```
AI Source (MCP, OpenAI, Claude, Moonshot)
    ↓
D1 Buffer (flow_c_config rules)
    ↓
Triage Bot (Workers AI extraction)
    ↓
  ┌─────────────┐
  │ Auto-approve │ ← High confidence + trusted source
  │ HITL Review  │ ← Low confidence or new source
  │ Reject       │ ← Below threshold
  └─────────────┘
    ↓
Triage Bot review → approved knowledge
    ↓
Entity 360 Memory Layer → Twin Triggers
```

## Flow C Config

Each tenant has a `flow_c_config` in D1:

```typescript
interface FlowCConfig {
  auto_approve_sources: string[]; // e.g. ["claude", "system"]
  min_confidence: number; // 0-1, default 1.0 (all to HITL)
  max_auto_approve_per_day: number; // rate limit
  require_entity_link: boolean; // must link to entity
  notifications: {
    slack_webhook_url?: string;
    notify_on_auto_approve: boolean;
    notify_on_triage: boolean;
  };
}
```

## Triage Bot

Located in `services/knowledge/src/triage-bot.ts`:

1. Receives content from D1 buffer
2. Uses Workers AI (Llama 3.1 8B) for extraction
3. Extracts: entities mentioned, sentiment, key facts, action items
4. Scores confidence based on extraction quality
5. Routes based on flow_c_config rules

## Memory Consolidation

The Knowledge service consolidates memories via Durable Object (`MemoryConsolidator`):

1. Sessions accumulate in D1
2. Consolidator runs periodically (or on-demand via `/v1/triage/run`)
3. Extracts patterns across sessions
4. Creates `consolidated_memories` records
5. Types: decision, preference, insight, action, rule, fact

## Entity 360 Integration

Entity 360 Memory layer fetches from:

- `GET /v1/memories?entity_id=X` on Knowledge service
- Falls back to Spine DB `ai_memories` table
- Twin trigger `memory_conflict` detects low-confidence decisions

## Twin Memory Triggers

- **memory_conflict**: 2+ low-confidence decisions → "Review memories"
- **context_gap**: High-value account with 0 context items → "Connect integrations"
