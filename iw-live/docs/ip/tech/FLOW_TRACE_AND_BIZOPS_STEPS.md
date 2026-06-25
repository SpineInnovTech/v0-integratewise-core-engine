## Current Surface-Binding Doctrine

- Operational Workbench = the primary work surface; left sidebar nav; Twin sidebar pops out when needed.
- Twin Workbench = full AI ecosystem surface (skills, knowledge, agents, prompts, conversational library).
- Governance is embedded at every layer — not a separate workbench.
- OpenWebUI is not the customer-facing product shell.
- Twin / OpenWebUI runtime surfaces use the canonical Forest + Paper system language.
- Midnight Executive is investor-deck / fundraising language only.

Use older L1/L2 / workspace / knowledge-UI language in this file through that boundary if any historical phrasing remains.

---

# Flow Trace & BizOps Steps

## Flow A Trace (Structured Data)

```
1. Connector OAuth complete (e.g. HubSpot)
2. classifyConnector("hubspot") → "A"
3. triggerInitialConnectorHydration() → Loader queue
4. Loader: creamy extract (30 days) → Pipeline queue
5. Normalizer S1: Analyze (detect entity type)
6. Normalizer S2: Classify (assign category)
7. Normalizer S3: Filter (schema-allowed types only)
8. Normalizer S4: Refine (normalize fields, split composites)
9. Normalizer S5: Extract (priority fields only per schema)
10. Normalizer S6: Validate (type checks, required fields)
11. Normalizer S7: Sanity (anomaly detection, score ≥ 70)
12. Normalizer S7.5: Identity Resolution (dedup detection)
13. Normalizer S8: Sectorize (route to Spine table, write)
14. Spine-v2: schema-routed write (e.g. cs.account_master)
15. Entity 360 cache refresh
16. Signal queue → Intelligence service
17. Twin triggers evaluate → insights generated
```

## Flow B Trace (Context)

```
1. Connector OAuth (e.g. Gmail, Slack)
2. classifyConnector("gmail") → "B"
3. Loader extracts emails/messages
4. Pipeline processes (same 8 stages)
5. Spine write (structured metadata)
6. Knowledge queue → Knowledge service
7. Embedding generated → knowledge_extractions table
8. Entity 360 Context layer populated
```

## Flow C Trace (AI)

```
1. AI source connected (MCP, Claude, etc.)
2. classifyConnector("claude") → "C"
3. D1 buffer initialized
4. Content arrives → flow_c_config evaluated
5. Triage bot extracts entities/facts
6. Auto-approve or HITL review
7. Approved → Triage Bot review → approved knowledge
8. Entity 360 Memory layer populated
9. Twin memory_conflict trigger evaluates
```

## BizOps Data Steps

### Founder Ops View

```
useHydrateProjection("bizops") → slot resolution → provider fetch
useWorkspaceEntities("account") → /api/v1/workspace/entities?entity_type=account
useWorkspaceEntities("opportunity") → pipeline data
useWorkspaceEntities("ops_metric") → operational metrics
useWorkspaceEntities("generated_insight") → AI signals
→ Render: MRR, pipeline, clients, deals, tasks, signals
```

### CEO View

```
Same hooks + useWorkspaceEntities("okr")
→ Render: ARR, pipeline, customers, OKR progress, critical signals
```

### COO View

```
Same + workflow, cross_dept_initiative, kpi
→ Render: active workflows, initiatives, KPI tracker
```

### CIO/CTO View

```
Same + filter ops_metrics for tech keywords
→ Render: integrations, incidents, tech metrics, tech signals
```
