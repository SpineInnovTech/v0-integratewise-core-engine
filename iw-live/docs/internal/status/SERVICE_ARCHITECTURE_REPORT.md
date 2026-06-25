# IntegrateWise Live - Service Architecture Report

# Generated: 2026-05-25

# Based on: Reading every .ts file in each service's src/ directory

---

## 1. ACT SERVICE (services/act/)

**Files:** src/index.ts, src/act.test.ts
**What it does:** Action Execution Layer - the final stage of the cognitive loop: Think → Govern → HITL → ACT → REPEAT. Executes approved actions through connectors, re-ingests results through pipeline, and sends outcome feedback to Think service.

**Imports:** hono, hono/cors
**Database:** Supabase (REST API for truth) + D1 (edge cache for audit_logs)
**Tables READ:** actions, action_proposals
**Tables WRITE:** audit_logs (D1), actions (Supabase PATCH), engagement_log (Supabase POST)
**External APIs:** None directly (uses service bindings)
**Routes:**

- GET /health
- POST /execute — Execute an action (MANDATORY approval token validation)
- GET /proposals/:situation_id — Get action proposals for a situation

**Service Bindings Used:** GOVERN (check), THINK (feedback), CONNECTOR (execute), PIPELINE (re-ingestion), STORE
**Real logic?** YES - Fully implemented with governance double-check, approval token enforcement, connector execution, pipeline re-ingestion, engagement logging, and outcome learning.
**TODO/FIXME/HACK:** None found

---

## 2. ADMIN SERVICE (services/admin/)

**Files:** src/index.ts, src/admin.test.ts
**What it does:** Full CRUD API for tenant management, user management, system health, newsletter subscribers, contact form submissions, support tickets, and support feedback (CSAT/NPS). Integrates with Zendesk for ticket creation.

**Imports:** hono, hono/cors, @neondatabase/serverless (neon)
**Database:** Neon PostgreSQL (DATABASE_URL)
**Tables READ:** tenants, subscriptions, tenant_users, workspaces, connectors, iq_sessions, newsletter_subscribers, contact_submissions, support_tickets
**Tables WRITE:** tenants, workspaces, tenant_users, subscriptions, newsletter_subscribers, contact_submissions, support_tickets
**External APIs:** Zendesk API (ticket creation via REST)
**Routes:**

- GET /, GET /health
- GET /v1/tenants — List all tenants with pagination
- GET /v1/tenants/:tenantId — Get tenant details
- POST /v1/tenants — Create tenant (with workspace + owner + trial subscription)
- PATCH /v1/tenants/:tenantId — Update tenant
- DELETE /v1/tenants/:tenantId — Soft/hard delete tenant
- GET /v1/tenants/:tenantId/users — List users
- POST /v1/tenants/:tenantId/users — Add user
- PATCH /v1/tenants/:tenantId/users/:userId — Update user
- DELETE /v1/tenants/:tenantId/users/:userId — Remove user
- GET /v1/tenants/:tenantId/workspaces — List workspaces
- POST /v1/tenants/:tenantId/workspaces — Create workspace
- POST /v1/newsletter/subscribe, POST /v1/public/newsletter — Subscribe to newsletter
- GET /v1/newsletter/subscribers — List subscribers (admin)
- POST /v1/contact-submissions, POST /v1/public/contact — Submit contact form
- GET /v1/contact-submissions — List submissions (admin)
- POST /v1/support/tickets, POST /v1/support-tickets — Create support ticket
- GET /v1/support-tickets — List tickets (admin)
- GET /v1/support-tickets/:ticketId — Get ticket
- PATCH /v1/support-tickets/:ticketId — Update ticket
- POST /v1/support/feedback, POST /v1/support/csat, POST /v1/support/nps — Submit feedback

**Real logic?** YES - Full CRUD with JWT validation, admin role checking, Zendesk integration, pagination, filtering.
**TODO/FIXME/HACK:** None found

---

## 3. AGENTS SERVICE (services/agents/)

**Files:** src/index.ts, src/agents.test.ts
**What it does:** Agent Colony - multi-agent orchestration system using Cloudflare Workflows. Implements 6 specialized AI agents (Orchestrator, Research, Analyst, Writer, Planner, Executor) that collaborate to complete complex tasks. Uses Cloudflare Workers AI (@cf/meta/llama-3.1-70b-instruct).

**Imports:** hono, cloudflare:workers (WorkflowEntrypoint, WorkflowEvent, WorkflowStep)
**Database:** Supabase (agent_registry truth) + D1 (agent_colony_runs edge cache)
**Tables READ:** agent_colony_runs (D1)
**Tables WRITE:** agent_colony_runs (D1)
**External APIs:** Knowledge service (search), Spine service (entity data), Think service (proposals), Govern service (approvals), Act service (execution)
**Routes:**

- GET /health
- POST /colony/run — Start new agent colony task
- GET /colony/:instanceId — Get colony run status
- POST /agent/:agentType — Quick single-agent execution
- GET /colony/history/:tenantId — Get colony run history

**Service Bindings Used:** THINK, GOVERN, KNOWLEDGE
**Real logic?** YES - Full agent implementation with AI-powered thinking, knowledge base queries, Spine entity lookups, proposal creation, governance approval, and execution through Act service.
**TODO/FIXME/HACK:** None found

---

## 4. BILLING SERVICE (services/billing/)

**Files:** src/index.ts, src/billing-service.ts, lib/_.ts, lib/**tests**/_.ts
**What it does:** Subscription management, usage tracking, Stripe/RazorPay integration, webhook handling with signature verification, entitlement enforcement, SKU-based checkout, and invoice management.

**Imports:** hono, hono/cors
**Database:** Supabase (REST API - SINGLE SOURCE OF TRUTH) + D1 (edge cache) + KV (webhook replay dedup)
**Tables READ:** subscriptions, usage_records, invoices, product_skus, tenant_subscriptions, payment_transactions
**Tables WRITE:** subscriptions, usage_records, invoices, payment_transactions
**External APIs:** Stripe API (checkout sessions), RazorPay API (orders)
**Routes:**

- GET /, GET /health
- GET /v1/plans — List active plans
- GET /v1/plans/:planId — Get plan details
- GET /v1/subscriptions/:tenantId — Get subscription
- POST /v1/subscriptions — Create subscription
- PUT /v1/subscriptions/:tenantId — Update subscription
- POST /v1/usage — Record usage
- GET /v1/usage/:tenantId — Get usage
- GET /v1/invoices/:tenantId — Get invoices
- POST /webhooks/stripe — Stripe webhook (with signature verification)
- POST /webhooks/razorpay — RazorPay webhook (with signature verification)
- GET /v1/entitlements/:tenantId — Check entitlements
- GET /v1/billing/plans — List product SKUs
- POST /v1/billing/checkout — Create checkout session

**Real logic?** YES - Full implementation with webhook signature verification (Stripe + RazorPay), idempotent webhook processing (KV + local cache), HMAC-based signature verification, entitlement calculation, SKU-based checkout.
**TODO/FIXME/HACK:** None found

---

## 5. CONNECTOR SERVICE (services/connector/)

**Files:** src/index.ts, src/sync-producer.ts, src/sync-consumer.ts, src/token-refresh.ts, src/types.ts, src/entitlement-gate.ts, src/routes/internal.ts, src/connector.test.ts
**What it does:** Consolidated Connector Worker that merges loader + mcp-connector + store. Handles webhook reception, connector polling, MCP tool server, file storage, and action execution write-back. Routes requests to appropriate sub-service.

**Imports:** hono (indirectly via sub-services), @integratewise/types, @integratewise/accelerators, @integratewise/lib
**Database:** Supabase (REST API) + D1 (EDGE_DB for MCP) + KV (MCP_IDEMPOTENCY) + R2 (FILES)
**Tables READ:** Various via sub-services
**Tables WRITE:** Various via sub-services
**External APIs:** External tool APIs via loader adapters
**Routes:**

- GET /, GET /health
- /api/v1/connector/\* — MCP tool server routes
- /api/v1/loader/\* — Loader routes (webhooks, connectors, OAuth)
- /files/_, /upload/_ — Store routes
- POST /api/v1/connector/execute — Execute action via connector
- /internal/\* — Internal routes
- Cron: every 5 minutes — Connector polling

**Queue Consumers:** PIPELINE_QUEUE, KNOWLEDGE_QUEUE
**Real logic?** YES - Full consolidation of 3 services, with entitlement-gated sync producer, token refresh, idempotent webhook processing, and action execution with pipeline re-ingestion.
**TODO/FIXME/HACK:** None found

---

## 6. CONNECTOR-SYNC SERVICE (services/connector-sync/)

**Files:** src/index.ts
**What it does:** Universal Connector Sync Service - scheduled + on-demand sync for ALL connector providers (30+ providers). Schema-driven: entity types resolved from tenant_spine_config. Supports creamy (initial), full, and delta sync phases.

**Imports:** hono, hono/cors, @integratewise/types
**Database:** Supabase (REST API for tenant_spine_config, sync_checkpoints) + KV (CONNECTOR_STATUS)
**Tables READ:** tenant_spine_config, sync_checkpoints
**Tables WRITE:** sync_checkpoints
**External APIs:** None directly (queues jobs to SYNC_QUEUE)
**Routes:**

- GET /health
- POST /api/sync/:tenantId — Trigger sync for tenant/provider
- GET /api/status/:tenantId — Get sync status for all providers
- GET /api/status/:tenantId/:provider — Get provider-specific status
- Cron: every 6 hours — Sync all active connectors
- Queue: connector-sync — Process sync jobs

**Supported Providers:** hubspot, salesforce, stripe, quickbooks, chargebee, github, google-analytics, mixpanel, linear, jira, pipedrive, freshsales, close, gmail, outlook, intercom, slack, notion, zendesk, tableau, google-drive, zoho-crm, freshdesk, front, helpscout, kustomer, whatsapp-business
**Real logic?** YES - Full schema-driven sync with entity type resolution from tenant_spine_config, cursor-based delta sync, creamy/full/delta phases, checkpoint tracking in Supabase, status tracking in KV.
**TODO/FIXME/HACK:** None found

---

## 7. CONTINUITY SERVICE (services/continuity/)

**Files:** src/index.ts, src/types.ts, src/couchdb.ts, src/continuity.test.ts
**What it does:** CouchDB Memory Layer - session event write (append-only), session read (events + checkpoints), session listing (by user, status, tags), triage integration (promote to canonical layer), TTL cleanup.

**Imports:** hono, hono/cors, zod, ./couchdb (CouchDB client)
**Database:** CouchDB (session*memory*{tenantId} databases)
**Tables READ:** session containers, session events, continuity checkpoints (all CouchDB)
**Tables WRITE:** session containers, session events, continuity checkpoints (all CouchDB)
**External APIs:** None (uses KNOWLEDGE service binding for triage promotion)
**Routes:**

- GET /health
- POST /v1/continuity/events — Write event (core)
- GET /v1/continuity/sessions — List sessions
- GET /v1/continuity/sessions/:id — Read session + events
- POST /v1/continuity/sessions/:id/resume — Resume session
- POST /v1/continuity/sessions/:id/close — Close session
- POST /v1/continuity/sessions/:id/triage — Triage session
- GET /v1/continuity/sessions/:id/events — Get session events
- GET /v1/continuity/checkpoints/:sessionId — Get checkpoints
- Cron: TTL cleanup — Delete expired sessions

**Queue Consumers:** TASKS_QUEUE (async triage promotion)
**Real logic?** YES - Full CouchDB implementation with Mango queries, view queries, TTL management, checkpoint creation, session lifecycle (active → closed → triage), and async triage promotion via queue.
**TODO/FIXME/HACK:** None found

---

## 8. GATEWAY SERVICE (services/gateway/)

**Files:** src/index.ts, src/gateway.test.ts
**What it does:** Single Entry Point for ALL requests into the workspace. Validates JWTs, resolves tenant context, injects trusted headers, applies rate limiting, and routes requests to the correct service. Implements the full routing table for the entire system.

**Imports:** hono (indirectly), imports admin/billing/tenants apps directly
**Database:** Supabase (REST API for tenant resolution) + KV (RATE_LIMITS, SESSIONS, CONNECTOR_STATUS, SIGNAL_CACHE, METRICS)
**Tables READ:** None directly (delegates to sub-services)
**Tables WRITE:** None directly
**External APIs:** None (pure routing layer)
**Routes:** (Full routing table - 40+ route mappings)

- /api/v1/billing/\* → INTERNAL_BILLING (billing app)
- /api/v1/tenants/\* → INTERNAL_TENANTS (tenants app)
- /api/v1/support/\* → INTERNAL_SUPPORT (admin app)
- /api/v1/analytics/\* → BFF (workflow)
- /api/v1/agents/\* → INTELLIGENCE (intelligence)
- /api/v1/connectors/\* → CONNECTOR
- /api/v1/connector/\* → CONNECTOR
- /api/v1/loader/\* → CONNECTOR
- /api/v1/pipeline/\* → PIPELINE
- /api/v1/intelligence/\* → INTELLIGENCE
- /api/v1/cognitive/\* → INTELLIGENCE or BFF (various)
- /api/v1/knowledge/\* → KNOWLEDGE
- /api/v1/workspace/\* → BFF (workflow)
- /api/v1/l2/\* → L2
- /ws, /sse, /stream → BFF
- /admin/\* → INTERNAL_ADMIN (admin app)
- /oauth/\* → INTERNAL_TENANTS (tenants app)
- /webhooks/\* → WEBHOOK_INGRESS or CONNECTOR

**Real logic?** YES - Full gateway implementation with JWT validation, tenant context resolution, rate limiting, CORS, path rewriting, webhook routing (provider-specific), connector sync status fallback, and service binding routing.
**TODO/FIXME/HACK:** None found

---

## 9. GOVERN SERVICE (services/govern/)

**Files:** src/index.ts, src/types.ts, src/policies.ts, src/workflow.ts, src/audit.ts, src/governance-engine.ts, src/policies.test.ts
**What it does:** Policy engine and approval workflows. Manages governance policies, checks if actions can be executed, handles approve/reject workflows with approval tokens, and maintains audit trails.

**Imports:** hono, hono/cors, hono/logger, hono/secure-headers, zod
**Database:** Neon PostgreSQL (DATABASE_URL via policies.ts/workflow.ts/audit.ts)
**Tables READ:** governance_policies, governance_audit_log, governance_workflow_items (inferred from functions)
**Tables WRITE:** governance_policies, governance_audit_log, governance_workflow_items
**External APIs:** None
**Routes:**

- GET /health
- GET /v1/policies — List policies
- GET /v1/policies/:id — Get policy
- POST /v1/policies — Create policy
- PUT /v1/policies/:id — Update policy
- DELETE /v1/policies/:id — Deactivate policy
- POST /v1/check — Check if action can be executed
- POST /v1/approve — Approve action
- POST /v1/reject — Reject action
- GET /v1/pending — Get pending actions
- GET /v1/audit — Get audit log
- GET /v1/audit/summary — Get audit summary

**Real logic?** YES - Full governance engine with policy CRUD, action checking with role-based access, approval workflow with approval tokens (HMAC-signed), audit logging with correlation IDs, and internal service authentication.
**TODO/FIXME/HACK:** None found

---

## 10. HERMES SERVICE (services/hermes/)

**Files:** src/index.ts, src/executor.ts, src/orchestrator.ts, src/stream.ts, src/types.ts
**What it does:** Orchestration Intelligence Worker - executes approved actions via n8n workflows or Durable Objects, provides SSE streaming of execution status, and manages workflow deployment to n8n.

**Imports:** hono, hono/cors, zod
**Database:** KV (EXECUTION_META, RATE_LIMIT) + Durable Objects (STREAM_HUB)
**Tables READ:** None (uses KV for task metadata)
**Tables WRITE:** None (uses KV for task metadata)
**External APIs:** n8n API (workflow execution, deployment, health check)
**Routes:**

- GET /health
- POST /execute — Execute approved action
- GET /stream/:taskId — SSE stream of execution status
- POST /orchestrate — Orchestrate workflow
- POST /workflows — Deploy workflow to n8n
- PATCH /workflows/:id/active — Activate/deactivate workflow
- GET /tasks/:taskId — Get task status

**Queue Consumers:** OUTCOMES_QUEUE (execute_task messages)
**Real logic?** YES - Full execution engine with n8n integration, Durable Object SSE streaming, task lifecycle management, workflow deployment, and queue-based async execution.
**TODO/FIXME/HACK:** None found

---

## 11. INTELLIGENCE SERVICE (services/intelligence/)

**Files:** src/index.ts, src/signal-analyzer.ts, src/intelligence.test.ts
**What it does:** Consolidated Intelligence Worker that merges think + act + govern + agents + cognitive-brain. Routes requests to appropriate sub-service. Processes signal queue messages with TypeScript-native signal analysis (via SignalAnalyzer from @integratewise/types), manages HITL approval workflows, and handles intelligence event processing.

**Imports:** Imports think/act/govern/agents sub-services directly, SignalAnalyzer from @integratewise/types
**Database:** Supabase (REST API for actions, signals) + D1 (entity360_cache)
**Tables READ:** entity360_cache (D1), actions, signals (Supabase)
**Tables WRITE:** actions (Supabase), signals (Supabase)
**External APIs:** OpenRouter (optional, via OPENROUTER_API_KEY for S7 sanity checks)
**Routes:** (Delegates to sub-services based on path)

- /health
- /act/\* → actApp
- /policies/_, /approve/_, /audit/\* → governApp
- /colony/_, /agents/_ → agentsApp
- /v1/cognitive/_, /v1/brainstorm, /v1/twin/_, /v1/insights → cognitiveBrain
- Default → thinkWorker

**Queue Consumers:** signals, intelligence-events, intelligence-act, ops-dlq
**Real logic?** YES - Full consolidation with signal processing, Python AI analysis integration, Govern→HITL approval enforcement (KT Note Rule 5), action proposal creation, and outcome learning.
**TODO/FIXME/HACK:** None found

---

## 12. KNOWLEDGE SERVICE (services/knowledge/)

**Files:** src/index.ts, src/chunking/_.ts, src/embedding/_.ts, src/search/_.ts, src/synthesis/_.ts, src/iq-hub.ts, src/memory-consolidator.ts, src/triage-bot.ts, src/embeddings.ts, src/services/_.ts, server/src/_.ts
**What it does:** Semantic search, document chunking, embedding management, triage bot (Cloudflare AI), memory consolidation, IQ Hub for MCP sessions, and knowledge ingestion pipeline.

**Imports:** hono, @neondatabase/serverless (neon), zod, hono/cors, @integratewise/connector-utils, OpenAI/OpenRouter APIs
**Database:** Neon PostgreSQL (DATABASE_URL) + Supabase (optional for spine config)
**Tables READ:** triage_results, document_chunks, session_embeddings, knowledge_documents, topics, triage_sessions (inferred)
**Tables WRITE:** triage_results, document_chunks, session_embeddings, knowledge_documents, topics
**External APIs:** OpenAI API (embeddings), OpenRouter API (embeddings), Cloudflare AI (triage bot)
**Routes:**

- GET /health
- POST /knowledge/search — Semantic search (vector/keyword/hybrid)
- POST /knowledge/search/sessions — Session search
- POST /knowledge/ingest — Ingest document
- POST /knowledge/embed/session — Embed session summary
- GET /v1/knowledge/inbox — Triage inbox (pending/deferred items)
- PATCH /v1/knowledge/triage/:id — Approve/discard/defer triage item
- GET /v1/triage/approved — Get approved triage items
- POST /v1/triage/session — Triage session (Cloudflare AI)
- /iq/\* — IQ Hub (MCP session capture → Triage → Consolidation)
- Cron: memory consolidation — Consolidate approved triage items

**Queue Consumers:** TASKS_QUEUE (immediate consolidation triggers)
**Real logic?** YES - Full implementation with document chunking, embedding generation (OpenAI/OpenRouter), vector search (pgvector), hybrid search, triage bot (Cloudflare AI), memory consolidation, and IQ Hub for MCP session capture.
**TODO/FIXME/HACK:**

- Line 2050: "Tenant-scoped consumer (CONSOLIDATED_AGENT_TODO D.19): skip messages without tenant_id"
- Line 273 (chunker.ts): "TODO: list preservation (extractLists) – currently unused by the chunker flow."

---

## 13. L2 SERVICE (services/l2/)

**Files:** src/index.ts, src/l2.test.ts
**What it does:** L2 Cognitive Layer Backend - read/write service over the spine for AI-derived insights, recommendations, and decision tracking. Uses KV for persistence when available, falls back to demo data.

**Imports:** hono, hono/cors
**Database:** KV (L2_INSIGHTS namespace)
**Tables READ:** KV (insights, recommendations, dismissed items)
**Tables WRITE:** KV (insights, recommendations, decisions, dismissed items)
**External APIs:** None
**Routes:**

- GET /health, GET /api/v1/l2/health
- GET /api/v1/l2/insights — Get AI-derived insights for a view
- GET /api/v1/l2/recommendations — Get recommendations
- POST /api/v1/l2/recommendations/:id/decision — Record approve/reject decision
- POST /api/v1/l2/events — Ingest events (dismiss actions)

**Real logic?** PARTIAL - Has real KV-backed logic for insights, recommendations, decisions, and dismissals. Falls back to demo data when KV is unavailable. The demo data is seeded, not hardcoded per se.
**TODO/FIXME/HACK:** None found

---

## 14. LOADER SERVICE (services/loader/)

**Files:** src/index.ts, src/pipeline.ts, src/pipeline-stages.ts, src/types.ts, src/lib/_.ts, src/handlers/_.ts, src/jobs/_.ts, scripts/_.ts
**What it does:** Schema-Driven Extraction - handles creamy layer sync (Phase 1), background sync (Phase 2 - needed/delta), and scheduled polling. Extracts data from connectors based on tenant_spine_config schema.

**Imports:** hono, zod, @neondatabase/serverless (neon), @integratewise/connectors (universalSync), @integratewise/types, token-refresh
**Database:** Neon PostgreSQL (DATABASE_URL for tenant_spine_config, sync_jobs) + KV (CONNECTOR_STATUS for job state)
**Tables READ:** tenant_spine_config, sync_jobs, tenant_onboarding_state
**Tables WRITE:** sync_jobs, tenant_onboarding_state
**External APIs:** External tool APIs via universalSync connector adapters
**Routes:**

- POST /internal/creamy — Start Creamy layer sync (Phase 1)
- GET /internal/creamy/:jobId — Get Creamy job status
- POST /internal/background-sync — Start background sync (Phase 2)
- POST /internal/sync — General sync trigger
- POST /internal/webhook/:provider — Webhook handler
- GET /internal/status/:tenantId — Sync status
- Cron: every 5 minutes — Scheduled connector polling

**Queue Consumers:** PIPELINE_QUEUE, KNOWLEDGE_QUEUE
**Real logic?** YES - Full schema-driven extraction with token refresh, universal connector sync, creamy/full/delta phases, pipeline queue integration, and job state management in KV.
**TODO/FIXME/HACK:** None found

---

## 15. MCP-CONNECTOR SERVICE (services/mcp-connector/)

**Files:** src/index.ts, src/handlers/tools.ts, src/handlers/coda-proxy.ts, src/lib/\*.ts, src/index.test.ts
**What it does:** MCP Tool Server - provides 12 tools for Knowledge Bank operations and Figma integration. Handles AI session memory capture with entity linking, auto-embedding, and triage bot integration.

**Imports:** hono, hono/cors, zod, @integratewise/connector-utils, ./lib/logging, ./handlers/tools, ./handlers/coda-proxy
**Database:** D1 (DB for ai_sessions, ai_session_memories) + KV (MCP_IDEMPOTENCY)
**Tables READ:** ai_sessions, ai_session_memories (D1)
**Tables WRITE:** ai_sessions, ai_session_memories (D1)
**External APIs:** Figma API (via FIGMA_ACCESS_TOKEN), Knowledge service (via binding for embedding/triage)
**Routes:**

- GET /, GET /health
- GET /config/mcp-server — MCP server configuration
- GET /tools — Tool discovery
- POST /invoke — Tool invocation
- GET /test/figma — Test Figma connectivity
- POST /v1/mcp/save_session_memory — Save AI session memory
- POST /v1/mcp/capture_session — Enhanced session capture with entity linking
- GET /v1/mcp/sessions — List captured sessions

**Tools Available:** kb.write_session_summary, kb.write_article, kb.get_artifact, kb.list_recent, kb.search, kb.topic_upsert, kb.topic_list, figma.get_file, figma.get_components, figma.get_node, figma.export_image, figma.get_comments
**Real logic?** YES - Full MCP tool server with 12 tools, Figma integration, session memory capture, entity linking, auto-embedding via Knowledge service binding, and triage bot integration.
**TODO/FIXME/HACK:** None found

---

## 16. NORMALIZER SERVICE (services/normalizer/)

**Files:** src/index.ts, src/types.ts, src/normalize.ts, src/dlq.ts, src/identity-mapper.ts, src/idempotency.ts, src/normalizer-accelerator.ts, src/schemas/index.ts, src/identity-resolution-api.ts, src/normalize.test.ts
**What it does:** 8-Stage Pipeline (KT Note §7) - mandatory normalization pipeline that ALL data must pass through before becoming canonical truth in the Spine. Stages: Analyze → Classify → Filter → Refine → Extract → Validate → Sanity → Sectorize.

**Imports:** @integratewise/types (resolveTenantAdaptiveSchema, SchemaAccessor, etc.), @supabase/supabase-js, ./identity-resolution-api
**Database:** Supabase (REST API + @supabase/supabase-js for quarantine, identity resolution) + KV (SCHEMA_CACHE)
**Tables READ:** pipeline_quarantine, spine_schema_registry, identity resolution tables
**Tables WRITE:** pipeline_quarantine (Supabase)
**External APIs:** OpenRouter (optional, via OPENROUTER_API_KEY for S7 sanity checks)
**Routes:**

- GET /health
- GET /api/v1/pipeline/status — Pipeline status
- /v1/identity/\* — Identity Resolution API

**Queue Consumers:** PIPELINE_QUEUE (8-stage processing), DLQ_QUEUE (dead letters)
**Real logic?** YES - Full 8-stage pipeline with schema-driven filtering, field normalization, canonical mapping, sanity scoring (≥70 required), quarantine management, identity resolution, and DLQ handling with retries.
**TODO/FIXME/HACK:** None found

---

## 17. PIPELINE SERVICE (services/pipeline/)

**Files:** src/index.ts, src/pipeline.test.ts
**What it does:** Consolidated Pipeline Worker that merges normalizer + spine-v2. The ONLY service with Spine write credentials. Handles 8-stage pipeline processing and Spine SSOT reads/writes.

**Imports:** @supabase/supabase-js, @integratewise/types, imports normalizer and spine-v2 sub-services
**Database:** Supabase (createClient for spine queries, REST API) + D1 (CACHE_DB) + KV (CACHE, SIGNAL_CACHE, METRICS) + R2 (SPINE_STORAGE)
**Tables READ:** spine_schema_registry, entities (public), plus all schema-specific tables (spine.account, sales.deal, etc.)
**Tables WRITE:** All schema-specific tables via spine-v2
**External APIs:** None (uses service bindings)
**Routes:**

- GET /health
- GET /api/v1/pipeline/status — Pipeline status
- GET /api/v1/spine/entities — List entities (with filtering, pagination)
- GET /api/v1/spine/entities/:entityType/:id — Get single entity
- POST /api/v1/spine/:entityType — Write entities to spine
- GET /api/v1/spine/schema/:entityType — Get schema fields
- GET /api/v1/entity360/:entityType/:id — Entity 360 view
- POST /api/v1/entity360/batch — Entity 360 batch
- POST /api/write — Generic write endpoint (used by Act service re-ingestion)

**Queue Consumers:** PIPELINE_QUEUE (routes to normalizer), ACCELERATOR_QUEUE
**Real logic?** YES - Full spine routing with 100+ entity type → schema.table mappings, upsert logic, completeness scoring, Entity 360 assembly, and schema field observation.
**TODO/FIXME/HACK:** None found

---

## 18. SPINE-V2 SERVICE (services/spine-v2/)

**Files:** src/index.ts, src/entity360-assembler.ts, src/spine-v2.test.ts
**What it does:** Spine SSOT (Single Source of Truth) - entity type → schema.table router with 100+ entity type mappings. Handles spine-routed writes, entity 360 assembly, and schema field observation.

**Imports:** @supabase/supabase-js, @integratewise/types, ./entity360-assembler
**Database:** Supabase (createClient with schema routing) + KV (CACHE) + D1 (CACHE_DB) + R2 (SPINE_STORAGE)
**Tables READ:** All schema-specific tables (spine.account, sales.deal, cs.renewal, etc.) + public.entities (fallback)
**Tables WRITE:** All schema-specific tables via upsert/insert + public.entities (fallback)
**External APIs:** None
**Routes:**

- GET /health
- POST /v1/spine/:entityType — Write entities (schema-routed)
- GET /v1/spine/entities — List entities
- GET /v1/spine/entities/:entityType/:id — Get single entity
- GET /v1/spine/entity360/:entityType/:id — Entity 360 view
- POST /v1/spine/entity360/batch — Entity 360 batch

**Real logic?** YES - Full entity type routing with 100+ mappings across 15+ schemas (spine, sales, marketing, revops, cs, support, eng, product, finance, legal, hr, sc, svc, bizops, it, procurement, industry\_\*), entity 360 assembly, and schema field observation.
**TODO/FIXME/HACK:** None found

---

## 19. STORE SERVICE (services/store/)

**Files:** src/index.ts, src/store.test.ts
**What it does:** File storage service using D1 + R2. Handles file uploads, R2 storage, processing pipeline, and triggers Knowledge ingestion.

**Imports:** hono, zod, hono/cors, hono/secure-headers
**Database:** Supabase (REST API for files table) + D1 (edge cache, not directly used in index.ts) + R2 (R2_BUCKET for file storage)
**Tables READ:** files (Supabase)
**Tables WRITE:** files (Supabase)
**External APIs:** Knowledge service (via binding for document ingestion)
**Routes:**

- GET /
- POST /store/files — Initiate file upload
- PUT /store/files/:id/upload — Upload file content to R2
- GET /store/files/:id — Get file details
- GET /store/files — List files
- POST /v1/store/upload — Gateway-facing multipart upload

**Real logic?** YES - Full file upload flow with R2 storage, Supabase metadata tracking, and async Knowledge ingestion trigger via service binding.
**TODO/FIXME/HACK:** None found

---

## 20. TENANTS SERVICE (services/tenants/)

**Files:** src/index.ts, src/types.ts, src/context.ts, src/oauth-configs.ts, src/flow-c-config.ts
**What it does:** Multi-tenant context resolution, tenant CRUD, invitation system, SSO/OAuth configuration, connector management, workspace management, and tenant management API.

**Imports:** hono, hono/cors, @neondatabase/serverless (neon), @integratewise/connectors (getSerializableCatalog), @integratewise/types, @integratewise/lib/crypto
**Database:** Neon PostgreSQL (DATABASE_URL) + Supabase (REST API for tenant_spine_config)
**Tables READ:** tenants, subscriptions, tenant_users, workspaces, connectors, tenant_spine_config, tenant_onboarding_state
**Tables WRITE:** tenants, workspaces, tenant_users, connectors, tenant_spine_config, tenant_onboarding_state
**External APIs:** None directly (triggers connector-sync via service binding)
**Routes:**

- GET /health
- GET /context — Get tenant context
- GET /resolve/:slug — Resolve tenant from slug
- GET /limits/:plan — Get plan limits
- GET /v1/tenants/:tenantId — Get tenant details
- PATCH /v1/tenants/:tenantId — Update tenant settings
- GET /v1/tenants/:tenantId/workspaces — List workspaces
- POST /v1/tenants/:tenantId/workspaces — Create workspace
- DELETE /v1/tenants/:tenantId/workspaces/:workspaceId — Delete workspace
- GET /v1/tenants/:tenantId/users — List users
- POST /v1/tenants/:tenantId/invitations — Invite user
- POST /v1/invitations/accept — Accept invitation
- GET /v1/tenants/:tenantId/connectors — List connectors
- POST /v1/tenants/:tenantId/connectors — Register connector
- DELETE /v1/tenants/:tenantId/connectors/:provider — Disconnect connector
- GET /oauth/:provider — OAuth redirect
- GET /oauth/:provider/callback — OAuth callback
- POST /api/v1/tenants/:tenantId/spine-config — Update spine config

**Service Bindings Used:** CONNECTOR_SYNC (trigger initial hydration)
**Real logic?** YES - Full tenant management with plan limits, invitation system with tokens, OAuth flow (HubSpot, Salesforce, GitHub, Slack, Stripe, Notion), connector registration with initial hydration trigger, and spine config management.
**TODO/FIXME/HACK:**

- Line 66: "TODO: Implement D1 buffer initialization" (in initializeD1Buffer function)

---

## 21. THINK SERVICE (services/think/)

**Files:** src/index.ts, src/engine.ts, src/actions.ts, src/ai-provider.ts, src/context.ts, src/fusion.ts, src/narrative.ts, src/semantic-lookup.ts, src/tenant-config.ts, src/twin-triggers.ts, src/entity360-client.ts, src/cognitive-brain.ts, src/cognitive-routes/_.ts, src/use-cases/_.ts, src/\*.test.ts
**What it does:** Think Engine (Layer 2) - signal analysis, situation detection, entity analysis, brainstorm layer, success intelligence routing, digital twin, and cognitive brain. Routes signals to appropriate sections based on entity type.

**Imports:** hono, zod, hono/cors, hono/secure-headers, @integratewise/types, SignalEngine, tenant-config
**Database:** Supabase (REST API for signals, situations, action_proposals) + D1 (edge cache)
**Tables READ:** signals, situations, action_proposals, entity360_cache (D1)
**Tables WRITE:** action_proposals (via Supabase)
**External APIs:** OpenRouter (optional, via OPENROUTER_API_KEY for S7 sanity checks), OpenAI/OpenRouter (via OPENAI_API_KEY/OPENROUTER_API_KEY)
**Routes:**

- GET /health
- GET /v1/signals — Signals feed
- GET /v1/success/intelligence — Success intelligence (schema-filtered)
- GET /v1/situations — Situations feed
- POST /v1/think/analyze — Analyze entity
- GET /v1/accelerator/health-score — Health score accelerator
- GET /v1/accelerator/engagement — Engagement accelerator
- GET /v1/accelerator/risk — Risk accelerator
- POST /v1/propose — Create action proposal
- POST /v1/outcome/feedback — Outcome feedback (learning)
- /v1/twin/\* — Digital twin routes (via cognitive-brain)
- /v1/brainstorm — Brainstorm routes (via cognitive-brain)
- /v1/insights/\* — Insights routes (via cognitive-brain)
- /v1/cognitive/\* — Cognitive routes (via cognitive-brain)

**Real logic?** YES - Full implementation with signal routing to 9 success intelligence sections (renewals, risks, support, usage, technical_health, tasks, stakeholders, integrations, insights), role-based lens filtering, schema-aware entity analysis, and cognitive brain integration.
**TODO/FIXME/HACK:** None found

---

## 22. WEBHOOK-INGRESS SERVICE (services/webhook-ingress/)

**Files:** src/index.ts, src/handlers/slack-workflow.ts
**What it does:** Receives webhooks from external systems (HubSpot, Salesforce, Stripe, GitHub, Slack) and broadcasts real-time updates. Verifies webhook signatures, deduplicates deliveries, forwards to pipeline, and broadcasts via Stream Gateway.

**Imports:** hono, hono/cors, @integratewise/types (resolveEntityTypeAlias)
**Database:** KV (WEBHOOK_LOG, WEBHOOK_SECRETS, CONNECTOR_STATUS)
**Tables READ:** KV (tenant mappings)
**Tables WRITE:** KV (webhook logs, delivery dedup)
**External APIs:** None (receives webhooks, doesn't call external APIs)
**Routes:**

- GET /health
- POST /webhooks/hubspot — HubSpot webhook (with signature verification)
- POST /webhooks/salesforce — Salesforce webhook
- POST /webhooks/stripe — Stripe webhook (with signature verification)
- POST /webhooks/github — GitHub webhook (with signature verification)
- POST /webhooks/slack-workflow — Slack Workflow Builder step
- POST /webhooks/slack/interactivity — Slack interactivity payloads

**Queue Consumers:** PIPELINE_QUEUE (forward webhook data to 8-stage normalization)
**Real logic?** YES - Full webhook handling with provider-specific signature verification (HMAC for HubSpot/Stripe/GitHub, Slack signing secret), idempotent delivery via KV, tenant resolution from portal IDs/installation IDs, and pipeline forwarding.
**TODO/FIXME/HACK:** None found

---

## 23. WORKFLOW SERVICE (services/workflow/)

**Files:** src/index.ts, src/views.ts, src/analytics.ts, src/stream-gateway.ts, src/tenant-spine-config.ts, src/durable-objects/hitl.ts, src/transformers/\*.ts, src/workflow.test.ts, src/analytics.test.ts
**What it does:** Backend-for-Frontend (BFF) - workspace runtime, HITL approval queue, analytics, real-time streaming (SSE/WebSocket via Durable Objects), spine initialization, connector registration, schema templates, and onboarding state management.

**Imports:** hono (indirectly via stream-gateway), @integratewise/types, @integratewise/connectors, Durable Objects (HITLGate, SignalStreamDO, PresenceDO, RoomDO)
**Database:** Supabase (REST API + createClient for spine queries, schema registry) + D1 (ANALYTICS_DB for analytics) + KV (CONNECTION_META, RATE_LIMIT, CONNECTOR_STATUS)
**Tables READ:** spine_schema_registry, connectors, tenant_spine_config, tenant_onboarding_state, entities (public + schema-specific)
**Tables WRITE:** tenant_spine_config, tenant_onboarding_state, spine_schema_registry
**External APIs:** OpenRouter (optional, via OPENROUTER_API_KEY for S7 sanity checks)
**Routes:**

- GET /health
- POST /api/v1/workspace/initialize — Initialize workspace
- GET /api/v1/workspace/tenant-config — Get tenant spine config
- GET /api/v1/workspace/link-knowledge-ui — Knowledge UI read policy
- GET /api/v1/workspace/ai-context — AI context URLs
- POST /api/v1/workspace/python/analyze — Python analyze proxy
- GET /api/v1/workspace/projection/:dept — Spine projection
- GET /api/v1/workspace/readiness — Readiness buckets
- POST /api/v1/workspace/register-connector — Register connector
- GET /api/v1/workspace/dashboard — Dashboard
- GET /api/v1/workspace/entities — Entity list
- GET /api/v1/workspace/goals — Goals and metrics
- GET /api/v1/cognitive/hitl/queue — HITL approval queue
- POST /api/v1/cognitive/hitl/queue — Approve/deny action
- GET /api/v1/cognitive/hitl/history — Approval history
- /hitl/\* — Durable Object HITL endpoints
- GET /api/v1/cognitive/audit — Audit trail
- GET /stream/events — SSE stream (legacy)
- /stream/_, /ws/_, /sse/\* — Stream gateway (Durable Objects)
- /analytics/_, /api/v1/analytics/_ — Analytics endpoints
- GET /api/v1/cognitive/evidence/\* — Evidence trail
- POST /api/v1/workspace/initialize-spine — Initialize adaptive spine
- GET /api/v1/workspace/schema-template — Schema template preview
- GET /api/v1/workspace/onboarding-state — Onboarding state
- POST /api/v1/workspace/complete-onboarding — Complete onboarding
- POST /api/v1/workspace/hydrate-connectors — Hydrate connectors
- GET /api/v1/workspace/progress — Sync progress (JSON/SSE)
- GET /api/v1/workspace/completeness — Spine completeness scoring
- /api/v1/workspace/cs/_, /api/v1/workspace/csm/_, /api/v1/workspace/tam/_, /api/v1/workspace/success/_ — Workspace L1 routes
- GET /api/v1/workspace/navigation — Navigation
- GET /api/v1/workspace/space/:type — Space
- GET /api/v1/workspace/view/:viewId — View
- GET /api/v1/workspace/hydration/manifest — Hydration manifest
- GET /api/v1/workspace/connectors — Workspace connectors

**Durable Objects:** HITLGate (approval gate), SignalStreamDO (real-time signals), PresenceDO (user presence), RoomDO (collaboration rooms)
**Queue Consumers:** ACT_QUEUE (action execution)
**Real logic?** YES - Full BFF implementation with 30+ endpoints, Durable Objects for real-time streaming and HITL, analytics aggregation, schema template generation, onboarding state management, and workspace L1/L2 routing.
**TODO/FIXME/HACK:**

- Line 2327: "TODO: Connect to Supabase Realtime and forward events"

---

## SUMMARY

### Total Services: 23

### Service Categories:

1. **Gateway/Entry:** Gateway (single entry point)
2. **Data Ingestion:** Connector, Connector-Sync, Loader, Webhook-Ingress, MCP-Connector, Store
3. **Data Processing:** Normalizer (8-stage pipeline), Pipeline (consolidated normalizer+spine), Spine-V2 (SSOT router)
4. **Intelligence:** Think, Act, Govern, Agents, Intelligence (consolidated), Hermes
5. **Knowledge:** Knowledge, Continuity (CouchDB memory)
6. **Workspace Runtime:** Workflow (BFF), L2 (Cognitive Layer)
7. **Infrastructure:** Admin, Tenants, Billing

### Database Usage:

- **Supabase PostgreSQL:** Primary truth database (most services)
- **Neon PostgreSQL:** Admin, Tenants, Knowledge, Govern (via @neondatabase/serverless)
- **CouchDB:** Continuity (session memory)
- **D1 (Cloudflare):** Edge cache across most services
- **KV (Cloudflare):** Caching, rate limiting, idempotency, status tracking
- **R2 (Cloudflare):** File storage (Store, Spine-V2)

### Consolidated Workers (v3.6 Architecture):

- **Connector** = Loader + MCP-Connector + Store
- **Pipeline** = Normalizer + Spine-V2
- **Intelligence** = Think + Act + Govern + Agents + Cognitive-Brain

### External API Integrations:

- Stripe (billing)
- RazorPay (billing)
- Zendesk (support tickets)
- Figma (design tools via MCP)
- n8n (workflow orchestration via Hermes)
- OpenAI/OpenRouter (AI embeddings)
- Python Intelligence Service (signal analysis)
- Cloudflare AI (triage bot)

### Real vs Placeholder:

- **ALL 23 services have REAL logic** - none are pure placeholders
- The L2 service has some demo seed data but real KV-backed logic
- All TODO/FIXME comments are minor (6 total across entire codebase)

### TODO/FIXME/HACK Found:

1. `tenants/src/index.ts:66` — "TODO: Implement D1 buffer initialization"
2. `knowledge/src/index.ts:2050` — "Tenant-scoped consumer (CONSOLIDATED_AGENT_TODO D.19)"
3. `knowledge/src/chunking/chunker.ts:273` — "TODO: list preservation (extractLists)"
4. `workflow/src/index.ts:2327` — "TODO: Connect to Supabase Realtime and forward events"
5. `loader/src/handlers/ai-relay.ts:4` — "TODO: Move AIRelayWebhookSchema to @integratewise/types"
6. `webhook-ingress/src/handlers/slack-workflow.ts:60,69` — "TODO: Store/query mapping in tenant_spine_config"
