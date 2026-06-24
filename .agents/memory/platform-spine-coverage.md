---
name: Platform spine coverage & drift
description: What the 12-domain spine ACTUALLY covers across integratewise-live and Customer Zero, and the real gaps (drift + missing goals/metrics enforcement)
---

# Platform spine coverage & drift (verified via GitHub read, NirmalPrinceJ/integratewise-live)

## integratewise-live ALREADY has the full 12-domain × 11-industry deep spine — ~5× over
Five overlapping generations coexist (different prefixes, different goal-linking) — there is **no single canonical spine**:
- `033/045/046/047` — per-domain DEEP, `spine_*` prefix, but NO goal_refs / dual-context. (033 = the exact MuleSoft CSM "Accounts Intelligence" model the user keeps citing. 047 = 71 tables: Finance, Legal, HR, Engineering, Personal, BizOps.)
- `048_spine_universal_depth` — `cs_/sal_/rev_` prefix, HAS goal_refs + spine_goals + vendor_org_id/client_org_id + vector(1536) + ctx.
- `050_adaptive_spine_12_domains` — `csm_/sales_/revops_` prefix, goals_master + provenance_log + spine_completeness + ai_chat ledger.
- `055_adaptive_spine_12x11_full` — schema-qualified (`spine.goal`, `spine.metric`, `sales.deal`, `cs.account_health`, `sc.order`, `hr.employee`, `legal.contract`, `industry_hc.patient`, `industry_edu.student`, `industry_auto.vehicle`, …). MOST COMPLETE: all 9 depts (incl. Supply Chain = `sc.*`) + 11 industries. Best base to standardize on.
- plus `supabase/migrations/*adaptive_spine_12x11_full` + `*cs_mulesoft_account_success_spine` + `d1/*` SSOT v11_7/v11_8 variants.

## "Everything maps to goals & metrics" enforcement was NEVER committed (grep of all 229 .sql)
NOT FOUND anywhere: `goal_templates`, `metric_templates`, `fn_seed_domain_for_org`, `metric_requires_goal` constraint, a `spine_metrics` table.
Goal/metric OBJECTS exist (048 spine_goals, 050 goals_master, 055 spine.goal+spine.metric+goal_refs) but the canonical TEMPLATE LIBRARY, the auto-SEEDER, and R1 (no metric without goal) DB enforcement do not. Prior chat claimed an "Iw goals metrics canonical" artifact — not in repo.

## Customer Zero main (this repo) = breadth only, no depth, not SQL
`lib/spine-schema/src/canonical-schema.ts` (~2600 lines) is a TS ADAPTIVE REGISTRY, not SQL.
- 12 dept configs: CUSTOMER_SUCCESS, REVOPS, SALES, MARKETING, PRODUCT_ENGINEERING, FINANCE, SERVICE, PROCUREMENT, IT_ADMIN, STUDENT_TEACHER, BIZOPS, PERSONAL — **no Legal, no HR**; Engineering folded into Product.
- 11 industry profiles: SAAS_TECH, PROFESSIONAL_SERVICES, HEALTHCARE, EDUCATION, MANUFACTURING, AUTOMOTIVE, RETAIL_COMMERCE, FINANCIAL_SERVICES, LOGISTICS, MEDIA, PUBLIC_SECTOR (matches 11).
- Depth = entity_types + priority_fields only (shallow). No goal_refs, no metrics, no continuity. Used by relay/normalizer to PRUNE, not as truth depth.

**Implication:** the real work behind "create the spine as SQL for 12 domains, everything maps to goals/metrics" is (1) consolidate the 5 drifting generations into ONE canonical spine, and (2) author the missing goals/metrics enforcement+seeding layer. Generating a fresh 6th spine = deepening drift.

## Spine + Memory are MORE than SQL — full substrate verified (the moat = ONE contextual memory that compounds)
User thesis: the real moat is one contextual memory of the user that grows, linking KV/R2/D1/AI Search/Vector/Bindings/Workers/AI Memory/Tool Memory/agent-to-agent/capabilities/ask/MCP. The SQL spine is just ONE projection of it.
Platform substrate (31 wrangler configs, 26 Worker services): Workers ✓26; ServiceBindings ✓20; D1 ✓20; KV ✓17; Queues ✓17; WorkersAI ✓7; DurableObjects ✓7; R2 ✓5 (connector/intelligence/knowledge/store); Vectorize ✓4. Memory stores: memory.conversational_memory + memory.org_memory (Supabase, vector1536+hnsw), consolidated_memories, decision_memory+patterns+embeddings, personal_memory+conversational_memory (D1 mirror), continuity_objects, memory_promotion_audit, memory_writeback_dlq. Agent layer: agent_registry, agent_communication_log (a2a), connector_catalog (capabilities), twin_sessions+twin_audit_events, iw-agent-runtime (DO), twin-orchestrator. MCP: mcp-connector + integratewise-mcp-tool-connector. RAG/AI Search: knowledge svc = R2+Vectorize+WorkersAI.
**Every named primitive EXISTS. The moat does NOT — it's fragmented.** 4 fractures: (1) spine drift 5+ gens; (2) memory scattered across ≥6 stores, TWO conversational_memory shapes (Supabase+D1); (3) TWO vector backends (Cloudflare Vectorize + Postgres pgvector1536) — no single index/identity; (4) NO contextual-memory assembler + NO single identity/context key joining all stores per user/org into one compounding packet, and goals/metrics anchor (R1) unenforced so memory accumulates but doesn't compound. The build is INTEGRATION (identity key + assembler/projection + one canonical vector store + R1 anchor + HITL + collapse drift), not more tables.
