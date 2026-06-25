# System Data Flow & Twin Activation

## End-to-End Data Flow

```
Connector OAuth → Loader (creamy/full/delta) → Pipeline Queue
    ↓
8-Stage Normalizer:
  S1 Analyze → S2 Classify → S3 Filter → S4 Refine
  S5 Extract → S6 Validate → S7 Sanity → S7.5 Identity Resolution → S8 Sectorize
    ↓
Spine-v2 (schema-routed write) → Entity 360 Cache
    ↓
Signal Queue → Intelligence Service → Python Analysis (B5-B7)
    ↓
Twin Trigger Engine (10 triggers) → Evidence-backed Insights
    ↓
Govern (approval gate) → Act (execution) → Re-ingestion
```

## Twin Activation

The Twin reads ONLY from Entity 360. Never from scattered sources.

### Entity 360 Assembly (6 layers, parallel fetch)

| Layer         | Source                          | Content                              |
| ------------- | ------------------------------- | ------------------------------------ |
| Truth         | Spine-v2 / Spine DB             | Canonical entity data with freshness |
| Context       | Knowledge service               | Emails, docs, meetings (Flow B)      |
| Signals       | Spine DB signals table          | Active alerts with evidence          |
| Memory        | Knowledge consolidated_memories | AI-extracted knowledge (Flow C)      |
| Goals         | Spine DB goals table            | Linked goals with health scoring     |
| Relationships | Spine DB entities               | Parent/child/related graph           |

### Twin Trigger Evaluation

10 hardcoded triggers evaluate Entity 360:

1. **health_drop** — 15+ point decline → critical
2. **renewal_approaching** — 90/60/30 day windows
3. **engagement_drop** — 30+ days no activity
4. **arr_change** — 10%+ revenue change
5. **goal_at_risk** — linked goals failing
6. **support_escalation** — 5+ open tickets
7. **stale_data** — entity data older than 24h
8. **memory_conflict** — low-confidence AI decisions
9. **context_gap** — high-value account with no context
10. **signal_cluster** — 3+ critical/high signals

### Constraints

- Max 3 insights per entity per day
- Every insight must have evidence chain
- Every insight answers: what, why, action, risk_if_ignored
- Sorted by severity then confidence

## Hydration Buckets (B0-B7)

| Bucket | State            | Twin Capability        |
| ------ | ---------------- | ---------------------- |
| B0     | No data          | None                   |
| B1     | Schema resolved  | Entity types known     |
| B2     | Creamy load done | Basic truth available  |
| B3     | Full load done   | Complete truth         |
| B4     | Context linked   | Flow B active          |
| B5     | Signals active   | Twin triggers fire     |
| B6     | Memory active    | Flow C feeding Twin    |
| B7     | Full cognitive   | All layers operational |
