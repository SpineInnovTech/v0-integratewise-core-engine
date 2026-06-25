---
# Fill in the fields below to create a basic custom agent for your repository.
# The Copilot CLI can be used for local testing: https://gh.io/customagents/cli
# To make this agent available, merge this file into the default repository branch.
# For format details, see: https://gh.io/customagents/config

name:
description:
---

# My Agent

INTEGRATEWISE
A Knowledge Workspace over the Spine, powered by AI
PROPOSED SYSTEM — COMPLETE TECHNICAL SPECIFICATION

AI-Powered Knowledge Workspace
First application since 1945 to complete the loop of human approval
and post-approval agent execution with audit rails and evidence backing
IntegrateWise LLP
Version 1.0 | February 2026
Confidential

1. Executive Summary
   IntegrateWise is a Knowledge Workspace built on the Spine, powered by governed AI — an AI-powered platform that fundamentally changes how organizations work with their tools, data, and AI. It is the first application since 1945 to complete the full loop of human approval and post-approval agent execution with audit rails and evidence backing.

CORE PHILOSOPHY
“AI That Thinks in Context, Waits for Approvals”
Normalize Once, Render Anywhere | Enhance, Don’t Replace

1.1 Three Core Problems Solved
Problem
Pain
IntegrateWise Solution
GenAI Divide
AI conversations lost in individual chat histories. Organizational knowledge dies with the session.
Brainstorming Layer captures AI conversations as organizational memory. MCP Connectors ingest AI sessions into the system.
Tool Sprawl
300+ fields across dozens of tools. No single truth. Humans become the integration layer.
Spine normalizes to 54 canonical fields (82% reduction). “Normalize Once, Render Anywhere.”
CS Team Paradox
Teams spend more time wrestling data than serving customers. Manual sync across siloed tools.
Loader + Cognitive Views eliminate humans as data middleware. Background intelligence replaces manual work.

1.2 The Core Loop
LOAD → NORMALIZE → STORE → THINK → REVIEW & APPROVE → ACT → REPEAT

The differentiator: The REVIEW & APPROVE (Govern) stage is a hard gate. Nothing executes without human approval + audit trail + evidence. This is what makes IntegrateWise fundamentally different from every AI-native tool on the market.

2. Four-Layer Architecture (L0–L3)
   IntegrateWise is organized into four architectural layers, each with distinct responsibilities. Data flows from external tools through L3 (backend engine), surfaces through L1 (workspace), and is reasoned about by L2 (cognitive layer). L0 handles the initial onboarding experience.

Layer
Name
Purpose
Key Components
L0
Onboarding
Signup, context questions, tool connect, first data hydration
4 stages: Entry + AI Insights → AI Loader Demo → Context Selection → Tool Connect + First Hydration
L1
Context-Aware Workspace
15 modules rendering context-specific views of normalized data
Home, Projects, Accounts, Contacts, Meetings, Docs, Tasks, Calendar, Notes, Knowledge Space, Team, Pipeline, Risks, Expansion, Analytics
L2
Universal Cognitive Layer
14 cognitive components for reasoning, action, and governance
SpineUI, ContextUI, KnowledgeUI, Evidence, Signals, Think, Act, HITL, Govern, Adjust, Repeat, AuditUI, AgentConfig, DigitalTwin
L3
Universal Backend
The engine: 8-stage mandatory pipeline, 4 accelerators, 6 data stores
Pipeline stages, accelerators, stores, engines, dual-loop architecture, security model

Every piece of data — whether ingested from connected tools, uploaded as documents, or captured from AI chat sessions — must flow through L3 before reaching the workspace (L1) or cognitive layer (L2). There are no shortcuts.

3. L0: Onboarding Flow
   L0 is the entry flow for new tenants. It is not a separate service — it is an orchestrated sequence across the Gateway, Connector, Pipeline, and Onboarding Accelerator. The design principle is to deliver value before asking for commitment.

Stage
What Happens
Duration

1. Entry + AI Insights
   Name + DOB input. AI personality analysis generates working style predictions, strengths, and growth areas. First “wow moment” for the user.
   0–15 sec
2. AI Loader Demo
   Natural language input demo. AI transforms unstructured input into structured actions across 4 tools simultaneously. Second “wow moment.”
   15–30 sec
3. Context Selection
   Two workspace paths: Productivity Hub (OS) for ICs/PMs/Team Leads, or CS Platform for CSMs/AMs/CS Leaders. Same user can switch anytime — two lenses, not separate products. Signup (Google OAuth / email) happens here.
   30–50 sec
4. Tool Connect + First Hydration
   Connect 1–2 tools via OAuth or upload a data dump (CSV/JSON/PDF). Backfill sync runs paginated historical import through the full 8-stage pipeline. Onboarding Accelerator bootstraps the workspace.
   50–120 sec

5. L1: Context-Aware Workspace (15 Modules)
   The L1 workspace is the user-facing surface of IntegrateWise. It consists of 15 modules, each providing a context-aware projection of normalized data from the Spine. Modules are not independent apps — they are views into the same SSOT, rendered based on the active CTX enum (context type).

Module
Purpose
Key Data Sources
Home
Personalized dashboard with signals, pending actions, and key metrics
All stores → aggregated view
Projects
Cross-tool project tracking with tasks, milestones, and ownership
Tasks, Accounts, Contacts
Accounts
Unified account view with health scores, risk signals, and engagement
Spine SSOT + Accelerators
Contacts
Normalized contact directory with engagement history and relationships
Spine + Context Store
Meetings
Calendar integration with AI-generated agendas and action items
Calendar tools + Think Engine
Docs
Document hub with unstructured content indexed and searchable
Context Store (embeddings)
Tasks
Cross-tool task aggregation with priority scoring and due dates
Spine + multiple tool sources
Calendar
Unified calendar view across all connected tools
Calendar tool connectors
Notes
AI-assisted note-taking with auto-linking to entities
Context Store + Spine links
Knowledge Space
Organizational knowledge base built from docs, chats, and interactions
Context Store + AI Chats Store
Team
Team performance, workload distribution, and collaboration metrics
Spine + Activity logs
Pipeline
Deal and opportunity tracking with velocity metrics
CRM connectors + Accelerators
Risks
Proactive risk detection with evidence-backed alerts
Think Engine + Signals component
Expansion
Upsell and growth opportunity identification
Accelerators + Spine analytics
Analytics
Cross-module analytics with growth-aligned reporting
All stores + Domain Accelerators

5. L2: Universal Cognitive Layer (14 Components)
   The L2 cognitive layer is the reasoning and governance engine. Its 14 components are universal — they operate across all workspace contexts, not tied to any single module. Together, they form the intelligence that makes IntegrateWise a cognitive system rather than a passive data viewer.

Component
Type
Purpose
SpineUI
Data Surface
Canonical data browser — view and navigate normalized SSOT records
ContextUI
Data Surface
Unstructured context viewer — documents, embeddings, related content
KnowledgeUI
Data Surface
Knowledge graph explorer — organizational knowledge from all three planes
Evidence
Intelligence
Evidence compiler — assembles proof backing every signal and recommendation
Signals
Intelligence
Signal detector — identifies patterns, anomalies, and changes across data
Think
Reasoning
Situation assessor — evaluates signals against goals and produces proposed actions
Act
Execution
Action executor — carries out approved actions with tool write-back
HITL
Governance
Human-in-the-loop approval gate — the hard stop before any AI action executes
Govern
Governance
Policy and compliance enforcement — ensures actions meet organizational rules
Adjust
Learning
Feedback loop — captures approval/rejection patterns to improve future proposals
Repeat
Learning
Continuous cycle driver — re-evaluates situations after actions complete
AuditUI
Compliance
Audit trail viewer — immutable log of all actions, approvals, and data changes
AgentConfig
Administration
Agent configuration — define, enable, tune, and monitor AI agents
DigitalTwin
Simulation
Workspace simulation — test proposed changes before committing to production

6. L3: Universal Backend Engine
   The L3 backend is the engine that powers the entire platform. It follows three inviolable principles:
   • "Normalize Once, Render Anywhere" — every data object is transformed into a canonical schema exactly once and can then be projected into any context.
   • "AI That Thinks in Context, Waits for Approvals" — all AI-driven actions require human-in-the-loop governance before execution.
   • "Every Path is Mandatory" — no data bypasses the 8-stage pipeline regardless of source.
   6.1 Three Data Ingestion Planes
   All data entering IntegrateWise arrives via one of three planes. All three converge into the Think Engine, which produces Situations and Proposed Actions.
   Plane
   Data Type
   Ingestion Path
   Storage
   Plane 1: Structured (Tool Data)
   CRM deals, support tickets, billing events, calendar entries
   Webhooks/Polling → Connector Service → 8-Stage Pipeline
   Spine (Neon PostgreSQL)
   Plane 2: Unstructured (Documents)
   PDFs, CSVs, spreadsheets, emails, images
   Upload/Watch → R2 raw storage → Knowledge Service → Chunk + Embed
   Context Store (pgvector + R2)
   Plane 3: AI Chats (MCP Sessions)
   Conversations from Claude, ChatGPT, other AI providers
   MCP Connectors → Session Summarization → Compress at Source
   AI Chats Store
   6.2 Eight-Stage Mandatory Pipeline
   Every piece of data entering IntegrateWise — regardless of source, type, or urgency — must pass through all 8 stages. There are no shortcuts. This ensures data quality, consistency, security, and auditability. The pipeline is implemented as a series of Cloudflare Queue consumers, with each stage reading from an inbound queue, processing, and writing to the next stage’s queue. Failed items at any stage are routed to the DLQ (Dead Letter Queue).

Stage
Name
Processing
Failure Mode
1
Analyzer
Source detection, object type identification, metadata extraction, schema version check. Stamps payload with pipeline_id for traceability.
Unknown source or malformed payload → DLQ
2
Classifier
Category mapping to internal taxonomy, CTX enum assignment, priority scoring (critical/normal/batch), accelerator routing flags.
Unmappable object type → DLQ
3
Filter
Tenant-level and user-level data scope enforcement. Checks data against scope definitions set during L0 onboarding. PII detection flags.
Scope rule error → pass-through with warning
4
Refiner
Field-level transformations: date normalization (ISO 8601 UTC), currency conversion, text cleaning (HTML strip), entity resolution across tools.
Schema mapping failure → DLQ
5
Extractor
Relationship extraction (account→contacts, deal→line items), computed fields (deal velocity, sentiment), change delta calculation, embedding generation for documents.
Extraction failure → DLQ with partial results
6
Validator
Data integrity checks, deduplication (exact + fuzzy), business rule validation, cross-reference verification against existing Spine records.
Integrity violation → DLQ
7
Sanity Scan
AI-powered anomaly detection, outlier identification, test data detection. Uses rules + ML to quarantine suspicious data before it enters stores.
Anomaly detected → Quarantine for human review
8
Sectorizer
Final routing to appropriate stores (Spine, Context, AI Chats). Performs the dual-write. Emits events to Think Engine and triggers Accelerator recalculation.
Write failure → retry queue with backoff
6.3 Four Accelerator Systems
Accelerators are specialized computation engines that operate on data after it has been normalized and stored. They produce derived intelligence that feeds the L1 workspace and L2 cognitive layer.

Accelerator
Purpose
Key Components
Extraction Accelerator
Preserve tool-native structure during ingestion. Captures formulas, automations, and relationships that would be lost in normalization.
Ingress Controller, Tool Puller, Object Graph Builder, Formula Capture, Automation Capture, External ID Resolver
Normalization Accelerator
Map extracted data to the SSOT canonical schema. Handles schema detection, field transformation, and relationship preservation.
Schema Detector, Schema Registry, Category Mapper, Field Transformer, Relationship Preserver, SSOT Builder
Onboarding Accelerator
L0-specific compute. Analyzes initial data to bootstrap the workspace with presets, templates, and scope definitions.
Context Analyzer, Preset/Template Selector, Data Scope Definition
Domain Accelerators (×6)
Post-normalization domain-specific intelligence. Each produces scored, goal-linked metrics.
Customer Health Score, Churn Prediction, Revenue Forecaster, Pipeline Velocity, Support Health, Marketing Attribution
6.4 Six Data Stores
Store
Technology
Purpose
Access Pattern
Spine (SSOT)
Neon PostgreSQL
Canonical normalized records. The single source of truth for all structured data.
Read/write via Pipeline + Act Engine
Context Store
pgvector on Neon + R2
Embeddings, document chunks, and metadata for unstructured content. Enables semantic search.
Write via Pipeline; read via Knowledge components
AI Chats Store
Neon PostgreSQL
Summarized AI chat sessions. Never stores full transcripts — only compressed summaries.
Write via MCP Connectors; read via KnowledgeUI
Audit Store
Neon (append-only)
Immutable log of every action, approval, data change, and system event.
Write-only from all services; read via AuditUI
Hot Memory
Cloudflare Durable Objects
Real-time state for active sessions, collaboration, and in-flight computations.
Read/write by Workers; auto-evicts to cold storage
Dead Letter Queue (DLQ)
Cloudflare Queue + Neon
Failed pipeline items with full context for debugging and replay.
Write from any pipeline stage; read by ops tooling

7. AI Agent System
   only one cognitive twin

forecast adjustments

Approval-only execution: Every agent proposal passes through the HITL gate. The Think Engine generates situations and proposed actions; the Govern layer enforces policy compliance; the HITL component presents proposals to the human approver. Only after explicit approval does the Act Engine execute. The Adjust component captures the approval or rejection to improve future proposals.

8. Dual-Loop Architecture
   IntegrateWise operates two reinforcing feedback loops that converge to create a self-improving system. This is the mechanism that closes the “data-back-to-learning” loop — the core differentiator.

8.1 Loop A: Context-to-Truth (Human-Governed)
Loop A captures human intelligence from governed channels (Slack, WhatsApp, Telegram, Custom GPTs) and converts it into executable actions.
Context → Brainstorming → Action → Tool Write → Ingest → Normalize → Truth → View → Repeat

Critical Rule: Brainstorming NEVER becomes truth directly. Truth is only created when an action writes to a tool, and the ingestion pipeline confirms and normalizes it.
8.2 Loop B: Tool-to-Truth (System-Governed)
Loop B processes structured tool data through the continuous intelligence cycle.
Loader → 8-Stage Pipeline → Store (Spine) → Think Engine → Act Engine → Tool Write-Back → Repeat
8.3 Convergence
Loop A feeds Loop B through tools: human decisions result in tool updates, which Loop B ingests and normalizes. Loop A triggers change; Loop B confirms truth. Both converge into the Think Engine’s views, and both repeat continuously. The convergence point is the Spine, where all validated truth resides regardless of origin.

9. Infrastructure Stack
   The backend is built on a serverless-first infrastructure, optimized for cost efficiency at early scale while maintaining the ability to handle enterprise workloads.

Layer
Service
Purpose
Compute
Cloudflare Workers
API Gateway, pipeline stages, connector logic, engine services. Workers Paid plan; 50ms CPU limit; auto-scaling.
Queue
Cloudflare Queues
Pipeline stage-to-stage messaging, DLQ, event bus. Dedicated queues per stage; batch size 10; max retries 3.
Database
Neon PostgreSQL
Spine (SSOT), Context Store, AI Chats Store, Audit Store. Serverless compute; auto-suspend; PITR enabled.
Vector Search
pgvector on Neon
Embedding storage and similarity search for Context Store. HNSW index; cosine distance.
Object Storage
Cloudflare R2
Raw files, document blobs, archived sessions, evidence attachments. S3-compatible; no egress fees.
Cache
Upstash Redis
Rate limiting, session tokens, temporary computation results. Serverless; per-request pricing.
Durable State
Cloudflare Durable Objects
Hot Memory, real-time collaboration state, connection sessions. Per-object isolation; transactional.
Cron / Scheduling
Cloudflare Cron Triggers
Scheduled sync polling, accelerator recalculation, cleanup jobs. Minute-level granularity.
DNS / CDN
Cloudflare
Domain routing, SSL termination, DDoS protection, edge caching. Full proxy mode; WAF rules.
AI Inference
OpenRouter
AI calls for Sanity Scan, Think Engine, session summarization. Multi-model routing; fallback chains.
Auth
Supabase Auth
User authentication, JWT issuance, social login, MFA. RLS integration with Neon PostgreSQL.
Workflow Automation
Cloudflare Workflows + Queues (CF-native, services/workflow — NOT n8n)
Internal operational workflows, email triage, notification routing.

10. Security Model
    Security is enforced at every layer, from network edge to database row. The model follows zero-trust principles: every request is authenticated, every query is scoped, and every action is audited.

Layer
Mechanism
Implementation
Network Edge
DDoS protection, WAF, rate limiting
Cloudflare proxy with WAF rules; per-IP and per-tenant rate limits
Transport
TLS 1.3 everywhere
Cloudflare SSL termination; encrypted connections to Neon and R2
Authentication
JWT + HMAC + OAuth
Supabase Auth for users; HMAC for service-to-service; OAuth for tool connections
Authorization
RBAC + RLS
Role-based access control at API layer; Row-Level Security at database layer
Data Isolation
Tenant isolation via RLS
Every database query automatically scoped to tenant_id via PostgreSQL RLS policies
Encryption at Rest
AES-256
Neon PostgreSQL encryption; R2 server-side encryption
Secret Management
Workers Secrets
OAuth tokens, API keys, HMAC secrets stored as encrypted Worker secrets
Audit
Immutable audit log
Every data access, modification, and action logged to append-only Audit Store
PII Handling
Field-level detection
Pipeline Filter stage flags PII fields; configurable masking and retention policies
Compliance
GDPR, DPDP Act 2023
Right to access, erasure, portability. Cascade delete with audit trail.

10.1 Data Commitments
• No data selling — data is never sold, rented, or shared with third parties
• No AI training — customer data is never used to train AI models
• Full portability — export all data at any time
• Complete deletion — request deletion and everything is removed, with audit confirmation
• Transparent processing — data is only processed as the customer directs

11. Queue and Event Architecture
    Each pipeline stage and major subsystem has its own dedicated Cloudflare Queue. This provides isolation, independent scaling, and granular monitoring.

Queue Name
Producer
Consumer
Purpose
connector.inbound
Webhook handlers / Cron pollers
Stage 1: Analyzer
Raw payloads from connectors
pipeline.analyzed
Stage 1: Analyzer
Stage 2: Classifier
Annotated payloads
pipeline.classified
Stage 2: Classifier
Stage 3: Filter
Classified payloads
pipeline.filtered
Stage 3: Filter
Stage 4: Refiner
Scope-approved payloads
pipeline.refined
Stage 4: Refiner
Stage 5: Extractor
Normalized payloads
pipeline.extracted
Stage 5: Extractor
Stage 6: Validator
Enriched payloads
pipeline.validated
Stage 6: Validator
Stage 7: Sanity Scan
Validated payloads
pipeline.scanned
Stage 7: Sanity Scan
Stage 8: Sectorizer
Quality-approved payloads
pipeline.dlq
Any stage on failure
DLQ Manager
Failed/quarantined items
engine.think
Sectorizer (post-write)
Think Engine
Data change events for reasoning
engine.act
HITL approval
Act Engine
Approved actions for execution
accelerator.trigger
Sectorizer (post-write)
Accelerator Router
Accelerator recalculation triggers
context.events
Slack / WhatsApp / Telegram
Context Processor
Governed channel messages
mcp.sessions
MCP Connectors
Session Processor
AI chat session captures

12. Growth-Aligned Data Model
    IntegrateWise does not just track data — it tracks growth. Every record, metric, and signal is linked to organizational goals. This is the non-negotiable differentiator.

Dimension
Traditional Systems
IntegrateWise
Data Model
Static records: “We have 100 accounts with $850k ARR”
Active, goal-linked: “100 accounts at 85% of $1M goal, $150k gap, Acme at MEDIUM RISK”
View
Reactive — “What happened?”
Proactive, risk-aware — “What should I do to hit my goals?”
Action
Manual — human interprets and decides
Suggested, evidence-based — AI proposes, human approves
Learning
None — same static view regardless of outcomes
Continuous — every approval/rejection improves future proposals
Alignment
Data disconnected from goals
Every metric is a percentage of a goal, with risk scoring and gap analysis

13. Unique Architectural Combination
    IntegrateWise combines eight architectural elements that no single competitor has brought together:

Element
Exists Elsewhere?
IntegrateWise
L0–L3 Cognitive Architecture
No
✓ Full 4-layer cognitive system
MCP-Native (AI Tool Discovery)
Anthropic only
✓ Integrated for AI session capture
Dual-Write (Truth + Context)
No
✓ Spine + Context Store parallel writes
Preserved Work Layer
Traditional apps only
✓ Enhance, don’t replace existing workflows
Approval-Only Agents
No
✓ Hard HITL gate before every action
Edge Correction (Self-Learning)
Research papers only
✓ Adjust + Repeat components in production
Growth-Aligned Schema
BI tools (static)
✓ Active, goal-linked at database level
Continuous Learning Loop
No
✓ Dual-loop with convergence at Spine

No competitor has more than 2–3 of these elements. IntegrateWise has all eight, working together.
