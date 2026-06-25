## Current Surface-Binding Doctrine

- Operational Workbench = the primary work surface; left sidebar nav; Twin sidebar pops out when needed.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- OpenWebUI is not the customer-facing product shell.
- Twin / OpenWebUI runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

Use older L1/L2 / workspace / knowledge-UI language in this file through that boundary if any historical phrasing remains.

---

# Entity 360 + Twin Trigger Scoring & Guardrails

## Entity 360 API

### Endpoints

| Method | Path                   | Description                 |
| ------ | ---------------------- | --------------------------- |
| GET    | `/api/entity360/:id`   | Single entity 360           |
| POST   | `/api/entity360`       | Single with layer selection |
| POST   | `/api/entity360/batch` | Multiple entities           |

### Request

```json
{
  "tenant_id": "uuid",
  "spine_id": "uuid",
  "layers": ["truth", "context", "signals", "memory", "goals", "relationships"],
  "limits": { "context": 10, "signals": 20, "memory": 15 }
}
```

### Response Structure

```typescript
interface Entity360 {
  spine_id: string;
  tenant_id: string;
  entity_type: string;
  display_name: string;
  truth: { data, source_table, freshness, sources };
  context: { recent: ContextItem[], total_count };
  signals: { active: Signal[], summary: { critical, high, medium, low, info } };
  memory: { recent: MemoryItem[], total_count };
  goals: { active: Goal[], health: "on_track" | "at_risk" | "off_track" | "no_goals" };
  relationships: { parent?, children[], related[] };
  meta: { assembled_at, hydration_bucket, department, cache_hit, assembly_ms };
}
```

## Twin Trigger Scoring

### Severity Levels

| Level    | Threshold               | Example                              |
| -------- | ----------------------- | ------------------------------------ |
| Critical | Immediate action needed | Health drop 15+, signal cluster 3+   |
| High     | Action within 48h       | Renewal 30d + low health, 5+ tickets |
| Medium   | Action within 1 week    | Engagement drop 30d, stale data      |
| Low      | Monitor                 | ARR growth, context gap              |
| Info     | Informational           | Data freshness, memory status        |

### Confidence Scoring

Each trigger produces a confidence score (0-1):

- 0.95: Data-driven with clear threshold (renewal date, ARR change)
- 0.90: Pattern-based with strong signal (health drop, signal cluster)
- 0.85: Multi-source correlation (goal at risk, support escalation)
- 0.80: Single-source inference (engagement drop)
- 0.70: Heuristic (stale data)
- 0.60: AI-derived (memory conflict)

### Guardrails

1. **Max 3 insights per entity per day** — prevents alert fatigue
2. **Severity-first sorting** — critical always surfaces first
3. **Evidence required** — no insight without at least 1 evidence item
4. **Source layer attribution** — every evidence tagged with origin layer
5. **Four-question standard** — what, why, action, risk_if_ignored
6. **Flow C separation** — AI insights never write to Spine directly
7. **Govern gate** — all autonomous actions require approval
8. **Cache TTL 60s** — Entity 360 cached to prevent over-fetching

## Trust Layer Contract

Every insight displayed in UI must show:

- Severity badge with color coding
- Confidence percentage with bar
- Source layers (icons: Database, MessageSquare, Zap, Brain, Target)
- Evidence chain (expandable)
- Risk if ignored (red warning)
- Recommended action (green panel)
- Timestamp of assembly
