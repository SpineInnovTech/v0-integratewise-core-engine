# IntegrateWise Architecture Documentation Index

**Status:** Complete System Architecture Extraction  
**Date:** June 25, 2026  
**Last Updated:** Production v3.8.0

---

## 📋 Quick Navigation

This index guides you through the complete IntegrateWise system architecture documentation. Start with the overview, then dive into specific areas.

---

## 🎯 START HERE: One-Line Summary

**IntegrateWise is a three-spine unified intelligence operating system connecting fragmented enterprise tools into one coherent, governed, reasoning workspace.**

- **Three Spines:** Human (ground truth), AI (reasoning), Collaboration (joint decisions)
- **Unified Lifecycle:** INTAKE → PROMOTION → MEMORY → DECAY → CONTINUITY
- **Architecture:** 28 Cloudflare Workers orchestrating 4 apps, governed by a canonical Spine data model
- **Core Principle:** One Spine. Many projections. The Spine is the source of truth.

---

## 📚 Documentation Hierarchy

### LEVEL 1: System Overview (READ FIRST)

Start with these to understand the big picture:

1. **[README.md](README.md)** - Product overview, live surfaces, memory architecture
2. **[SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)** - Complete technical reference (700 lines)
   - Executive overview
   - Monorepo structure
   - Three-spine architecture
   - All 28 backend services
   - Frontend architecture
   - Data layer
   - Deployment & operations
   - Security model
   - Observability & logging
   - Key invariants

3. **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** - Visual ASCII diagrams
   - Three-spine lifecycle
   - Monorepo structure
   - Data flow pipeline
   - Request routing
   - Frontend layers
   - Approval & execution
   - Deployment environments
   - Multi-tenancy isolation
   - Observability stack

---

### LEVEL 2: Core Architecture Documents (CANONICAL)

These are locked architectural decisions. Read before implementing anything:

1. **[docs/architecture/PRODUCT_ARCHITECTURE.md](docs/architecture/PRODUCT_ARCHITECTURE.md)** - v3.7 External Customer Surface Lock
   - Product positioning
   - Two modes (Customer Zero vs. External)
   - Five customer surfaces (L1-L4 + Approval Center)
   - Domain rules
   - User interactions
   - Handoff layer

2. **[docs/architecture/SPINE_MODEL.md](docs/architecture/SPINE_MODEL.md)** - Canonical Data Model
   - The Spine definition
   - Four founding pieces (Loader, Normalizer, Spine, Traits/Resources)
   - What the Spine holds (entities, relationships, signals, memory)
   - 18 canonical entity types
   - 12 logical domains
   - Relationships & Entity 360

3. **[docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md](docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md)** - Layers & Stages
   - Seven user-facing layers (L0-L7)
   - 12 backend processing stages (S0-S12)
   - Onboarding flow
   - Domain workbenches
   - Twin reasoning surface
   - Memory workbench
   - Approval center

4. **[AGENTS.md](AGENTS.md)** - v3.8.0 Locked Architecture Decisions
   - Mandatory read order for all AI agents
   - Protocol compliance rules
   - Decision log (DECISION 1-27)
   - Constitutional laws
   - Continuity plan

---

### LEVEL 3: Specific Deep Dives

Deep technical references for implementation:

**Frontend:**
- [docs/architecture/FRONTEND_LAYERED_STACK.md](docs/architecture/FRONTEND_LAYERED_STACK.md) - React components, state management, layer switching

**Data & Database:**
- [docs/internal/sql-migrations/](docs/internal/sql-migrations/) - Schema migrations (001-079)
- [docs/architecture/PROJECTION_MODEL.md](docs/architecture/PROJECTION_MODEL.md) - How projections work

**Workflows:**
- [docs/architecture/ONBOARDING_FLOW.md](docs/architecture/ONBOARDING_FLOW.md) - User onboarding (~2 minutes)
- [docs/architecture/DETAILED_USER_FLOWS_AND_SYSTEM_PATHS.md](docs/architecture/DETAILED_USER_FLOWS_AND_SYSTEM_PATHS.md) - End-to-end flows
- [docs/architecture/CURRENT_CONTEXT_FLOW.md](docs/architecture/CURRENT_CONTEXT_FLOW.md) - Twin context assembly

**Operations:**
- [docs/operations/LOGGING_AND_AUDIT.md](docs/operations/LOGGING_AND_AUDIT.md) - Observability strategy
- [docs/tech/CONNECTOR_RUNTIME_PROOF.md](docs/architecture/CONNECTOR_RUNTIME_PROOF.md) - Connector proofs

---

## 🏗️ System Components Reference

### Frontend (apps/web/)

| Component | Purpose | Location |
|-----------|---------|----------|
| Layer Switcher | Navigate between spines (Human/AI/Collaborate/Approve) | `components/layer-switcher.tsx` |
| Domain Sidebar | Navigation and domain selection | `components/domain-sidebar.tsx` |
| Workbench | Domain-specific operational surface | `components/workbench/` |
| Twin Chat | Reasoning and planning interface | `components/twin/` |
| Cognitive Overlay | L2 signals and insights (`⌘J`) | `components/cognitive-overlay/` |
| Approval Center | L4 governance interface | `components/approval/` |
| Memory Search | L4 full-text + semantic search | `components/memory/` |

### Backend Services (28 Cloudflare Workers)

| Service | Stage | Purpose | Location |
|---------|-------|---------|----------|
| **GATEWAY** | S0 | Public ingress, auth, routing | `services/gateway/` |
| **LOADER** | S1 | Universal intake (MCP-native) | `services/loader/` |
| **CONNECTOR** | S1 | Tool integrations (OAuth, APIs) | `services/connector/` |
| **NORMALIZER** | S2-S4 | 8-stage LLM pipeline | `services/normalizer/` |
| **PIPELINE** | S4 | Entity resolution, Spine writes | `services/pipeline/` |
| **INTELLIGENCE** | S5 | Signal analysis, anomalies | `services/intelligence/` |
| **THINK** | S5 | Synchronous reasoning | `services/think/` |
| **IW-AGENT-RUNTIME** | S6 | Twin orchestration | `services/iw-agent-runtime/` |
| **CONTINUITY** | S7 | Memory consolidation, lifecycle | `services/continuity/` |
| **GOVERN** | S9 | Approval gate | `services/govern/` |
| **WORKFLOW** | S10 | Async execution orchestration | `services/workflow/` |
| **KNOWLEDGE** | S11 | Semantic search + embeddings | `services/knowledge/` |
| **TENANTS** | - | Tenant provisioning | `services/tenants/` |
| **ADMIN** | - | Internal operations | `services/admin/` |
| **BILLING** | - | Usage + SaaS management | `services/billing/` |
| **[13+ others]** | - | Support, integrations, ops | `services/` |

### Data Storage

| System | Purpose | Location |
|--------|---------|----------|
| **D1** | Hot edge storage (domain partitions, signals, queues) | Cloudflare-managed |
| **Supabase Fortress** | Authoritative SSOT (entities, audit logs, RLS) | PostgreSQL |
| **AI Search** | Vector embeddings + semantic search | Cloudflare-native |
| **KV** | Entity 360 caching, session storage | Cloudflare-native |
| **R2** | File storage (documents, reports) | Cloudflare-native |

---

## 🔄 Three-Spine Lifecycle

All signals (human, AI, collaboration) flow through this unified 5-phase lifecycle:

```
1. INTAKE     → Signal enters the system
2. PROMOTION  → Validates, resolves, ready to act
3. MEMORY     → Stored as ground truth
4. DECAY      → Aged signals archived
5. CONTINUITY → Outcome stored for future learning
```

**For each spine:**
- **Human:** Goals, decisions, outcomes (L1 Workbench)
- **AI:** Reasoning traces, proposals, signals (L3 Twin)
- **Collaboration:** Approvals, feedback, compounded outcomes (L2 Overlay)

---

## 🔐 Key Invariants

These are non-negotiable principles embedded in the system:

1. **One Spine, Many Projections** - All UI surfaces are views of the same Spine
2. **Never Reason at Intake** - Loader never transforms. Transformation paid once per entity.
3. **No Execution Without Approval** - Every action is governance-gated
4. **Tenant Isolation** - Every query includes `tenant_id` scoping
5. **Audit Everything** - All actions logged with actor, timestamp, reasoning, outcome
6. **Cloud-First Memory** - No local agent state. All memory in cloud (D1/Supabase)
7. **Zero-Trust Routing** - Workers never exposed publicly. All traffic via Gateway
8. **Continuous Learning** - Outcomes feed back into system memory for future signals

---

## 🚀 Deployment Reference

**Environments:**
- `dev` → localhost:3333 (pnpm dev)
- `test` → staging.integratewise.ai
- `prod` → app.integratewise.ai

**Deploy Commands:**
```bash
# Deploy all workers
pnpm deploy:prod

# Deploy specific worker
pnpm deploy:gateway:prod

# Deploy frontend (automatic via Vercel on git push)
git push origin main
```

**Pre-Launch Checklist:**
- [ ] Supabase Fortress provisioned (RLS active)
- [ ] D1 schemas applied (all 12 domains)
- [ ] Cloudflare API tokens set
- [ ] Service bindings verified
- [ ] `pnpm preflight` passing
- [ ] Health endpoints responding
- [ ] Smoke tests passing

---

## 📊 Observability

**100% Cloud Audit Trail (No Local Logging)**

| System | Tables | Observability |
|--------|--------|----------------|
| **D1** | audit_logs, governance_audit_log, spine_audit_log | All actions logged |
| **Supabase** | usage_logs, billing_events, support_tickets | Usage tracking |
| **Sentry** | (errors) | 5xx, 4xx, LLM failures |
| **Grafana** | (metrics) | P95 latency, error rates, memory |
| **Cloudflare** | (analytics) | Requests/sec, cache hits, DDoS |

---

## 🔗 Canonical References

When architecture decisions conflict across docs, trust these in order:

1. **Code** - The actual implementation
2. **SPINE_MODEL.md** - Data model canon
3. **PRODUCT_ARCHITECTURE.md** - Product design canon
4. **AGENTS.md** - Locked system decisions
5. Session logs in IntegrateWise Memory

---

## 📞 Questions?

- **Architecture questions:** See AGENTS.md (locked decisions)
- **Product positioning:** See PRODUCT_ARCHITECTURE.md
- **Data model questions:** See SPINE_MODEL.md
- **Implementation questions:** See specific service README in `services/*/`
- **Deployment questions:** See docs/operations/
- **Large-scale questions:** Contact Nirmal (Founder/CEO)

---

## ✅ What This Extraction Covers

This architecture extraction includes:

✅ Complete system overview (monorepo to microservices)  
✅ All 28 backend services mapped and documented  
✅ Three-spine lifecycle explained with concrete examples  
✅ Frontend layer architecture (Next.js + layer switching)  
✅ Data flow from tools → Spine → surfaces  
✅ Multi-tenancy isolation strategy  
✅ Deployment process for all environments  
✅ Security model and RBAC  
✅ Observability and monitoring stack  
✅ Key invariants and non-negotiable principles  
✅ Visual ASCII diagrams for all major flows  
✅ References to canonical architecture docs  

---

**Version:** v3.8.0  
**Authority:** Nirmal Prince J (Founder) + Engineering Team  
**Last Verified:** June 25, 2026

This documentation is the single source of truth for IntegrateWise system architecture. For questions about design decisions or implementation, refer to the appropriate reference document above.
