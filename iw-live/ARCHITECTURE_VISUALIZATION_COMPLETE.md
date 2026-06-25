# Architecture Visualization — Complete Documentation Package

## What Was Delivered

You asked: **"Create a visual architecture document that maps this diagram to the code?"**

I have created a **comprehensive 3-document package** that maps every component in the Continuity Bridge Operating System diagram to actual code files:

---

## Document 1: ARCHITECTURE_VISUALIZATION_MAPPING.md (890 lines)

**Canonical mapping reference — Every diagram component → Code location**

**Structure:**
- Left Column: Tenant Lifecycle (8 stages)
  - Voice/Clark → D1 Record → Schema AI → Continuity Bridge → Entity Written
  - Each stage: code files, database schema, functions

- Center Column: User Flow (7-stage journey)
  1. DISCOVER & SIGN UP
  2. IDENTITY & ORGS SETUP
  3. SCHEMA DISCOVERY
  4. CONNECT YOUR WORLD
  5. HYDRATE & NORMALIZE
  6. ACTIVATE CONTINUITY
  7. OPERATE & EVOLVE

- Top Center: Projection Layer (7 different frontends)
  - Native Workbench (IntegrateWise)
  - Role-Based Workbenches (Sales, CS, Finance, Ops, Eng, HR, Legal)
  - AI-Generated Apps
  - Customer Portal (Branded)
  - Embedded Experiences
  - Mobile & Desktop

- Center: Gateway Layer
  - Single Worker: `integratewise-gateway`
  - 8 Endpoint Groups with routes and handlers

- Core Services (Detailed breakdowns):
  - Spine Service (Normalize → Graph)
  - Continuity Engine (Memory Intake → Decay)
  - Twin Service (Reasoning + Memory)
  - Governance Service (Approval & Evaluation)

- Registry Layer:
  - Connector Registry
  - MCP Registry
  - Tool Registry
  - Agent Registry

- Capability Runtime:
  - MCP Runtime
  - ADK Runtime
  - Tool Runtime
  - Agent Runtime (IW-AGENT-RUNTIME)

- Data Layer:
  - D1 (Durable Objects): All tables
  - KV (Spine Cache): All keys
  - R2 (Object Storage): Raw events, artifacts
  - Vectorize: Embeddings & search

- Cross-Cutting Concerns:
  - Security (RBAC, RLS, Auth, Tenancy)
  - Observability (Logs, Metrics, Traces, Audit)
  - Reliability (Retries, Rate Limiting, DLQ, Backup)

- Integrations:
  - 25+ External Tools (HubSpot, Salesforce, Slack, Notion, Jira, etc.)
  - Each with adapter file locations

**Key Example:**
```
Component: "Entity 360" (Gateway layer)
Code Location: services/gateway/src/routes/entity.ts
Logic: lib/entity/entity-360.ts
Database: entities table in D1
Cache: entity:{entity_id}:360 in KV (Spine Cache)
Endpoint: POST /api/v1/entity/type/id
Description: Returns complete entity view across all sources
```

**Navigation Guide:**
1. Find diagram component
2. Look up in mapping table
3. Navigate to code file
4. Check related files for dependencies
5. Query database schema section for data

---

## Document 2: SYSTEM_ARCHITECTURE.md (700 lines) - Already Delivered

**Complete system overview covering:**
- Executive summary
- Monorepo structure (4 apps, 28 workers, 10+ packages)
- Three-spine architecture (Human, AI, Collaboration)
- All 28 backend services with responsibilities
- Frontend architecture (Next.js 16, layer switcher)
- Data layer strategy (D1 + Supabase)
- Deployment procedures
- Security model & multi-tenancy
- Observability & logging
- Key invariants

---

## Document 3: MCP_ADK_SPINE_CACHE_ARCHITECTURE.md (788 lines) - Already Delivered

**Universal communication layer covering:**
- Three connectivity paths:
  1. **Connector Path** — External tools (26+ Nango providers)
  2. **MCP-to-MCP Path** — Direct protocol (mcp.integratewise.ai endpoint)
  3. **ADK Agent Path** — Spine-based coordination (Registry + Cache + Log)

- Detailed breakdowns of each path with flow diagrams
- Agent coordination examples
- Performance metrics and SLAs
- Security & multi-tenancy model
- Multi-agent workflow example (Update HubSpot from Coda)

---

## Total Documentation Delivered

| Document | Lines | Focus |
|----------|-------|-------|
| ARCHITECTURE_VISUALIZATION_MAPPING.md | 890 | Diagram → Code mapping (canonical) |
| SYSTEM_ARCHITECTURE.md | 700 | Complete system architecture |
| MCP_ADK_SPINE_CACHE_ARCHITECTURE.md | 788 | Universal communication layer |
| ARCHITECTURE_DIAGRAMS.md | 578 | Visual ASCII diagrams |
| ARCHITECTURE_INDEX.md | 289 | Navigation hub |
| **TOTAL** | **3,245** | **Complete architecture extraction** |

---

## Why the Deployed App Shows Vercel Auth

The deployed app at:
```
https://web-arugyvamj-integratewises-projects.vercel.app/
```

Shows Vercel SSO login because:
1. **Vercel Project-Level Auth** — The team has enabled authentication at the project level
2. **No Public Routes** — Even `/public-demo` is behind Vercel's auth layer
3. **Solution:** Run locally or disable project auth in Vercel dashboard

---

## How to Use These Documents

### For Onboarding
1. Start with: **ARCHITECTURE_INDEX.md** (290 lines) — Navigation hub
2. Read: **SYSTEM_ARCHITECTURE.md** (700 lines) — Full system picture
3. Reference: **ARCHITECTURE_VISUALIZATION_MAPPING.md** (890 lines) — Component → Code

### For Development
1. Find component in diagram
2. Look up in ARCHITECTURE_VISUALIZATION_MAPPING.md
3. Navigate to code file
4. Check related files and database schema

### For Understanding Communication
1. Read: **MCP_ADK_SPINE_CACHE_ARCHITECTURE.md** (788 lines)
2. Understand: Three connectivity paths (Connector, MCP, ADK)
3. Learn: Multi-agent coordination via Spine

### For Visual Reference
1. View: **ARCHITECTURE_DIAGRAMS.md** (578 lines)
2. 9 ASCII diagrams showing system flows

---

## Key Mappings (Quick Reference)

| Diagram Component | Code Location | Purpose |
|------------------|---------------|---------|
| Discover & Sign Up | apps/web/app/auth/signup/ | User registration |
| Tenant Record → D1 | services/tenants/src/ | Tenant provisioning |
| Schema AI | services/intelligence/src/schema-analyzer.ts | Schema generation |
| Connectors | services/connectors/src/adapters/ | 26+ provider support |
| Loader | services/loader/src/ | Intake service |
| Normalizer | services/normalizer/src/ | 8-stage LLM pipeline |
| Spine | services/spine/src/ | Entity normalization & graph |
| Continuity Engine | services/continuity/src/ | Memory system |
| Twin | services/twin/src/ | Reasoning + memory |
| Governance | services/governance/src/ | Approval gate |
| Gateway | services/gateway/src/ | Single public worker |
| MCP Runtime | services/mcp-runtime/src/ | Protocol server |
| ADK Runtime | services/adk-runtime/src/ | Agent coordination |
| Registry | services/registry/src/ | Discovery & capability |

---

## Database Schema Summary

### D1 (Authoritative SSOT)
- `tenants` — Tenant records
- `entities` — Canonical business entities
- `org_memory` — Organization memory
- `personal_memory` — User memory
- `conversational_memory` — Session memory
- `connector_registry` — Available connectors
- `agent_registry` — Agent discovery
- `agent_communication_log` — Agent messages
- `event_log` — System events
- `audit_log` — All actions

### KV (Spine Cache)
- `entity:{entity_id}:360` — Cached entity views
- `agent:{agent_id}:state` — Agent state
- `request:{request_id}` — In-flight requests
- `cache:signals` — Signal cache
- `cache:metrics` — Metrics cache

### R2 (Lineage & Artifacts)
- Raw provider events (lineage tracking)
- Large artifacts and files
- Vector embeddings

### Vectorize
- Semantic search index
- Embedding vectors

---

## The Diagram Visualized

```
DIAGRAM STRUCTURE:

Left:                  Center:                                    Right:
┌──────────────┐      ┌─────────────────────────────────┐        ┌──────────┐
│ Tenant       │      │ 7-Stage User Flow               │        │ Cross-   │
│ Lifecycle    │──→   │ + Projection Layer (7 frontends)│        │ Cutting  │
│              │      │ + Gateway Layer (1 worker, 8 EP)│        │ Concerns │
│ 1. Voice     │      │ + Core Services (4 major)       │        │          │
│ 2. D1 Record │      │ + Registry Layer (discovery)    │        │ Security │
│ 3. Schema AI │      │ + Capability Runtime (4 types)  │        │ Observ.  │
│ 4. Authz     │      │ + Data Layer (D1+KV+R2+Vector) │        │ Reliab.  │
│ 5. Discovery │      │                                 │        │ 25+ Intg │
│ 6. Loader    │      │ ↓ All components map to         │        │          │
│ 7. Hydration │      │   ARCHITECTURE_VISUALIZATION_   │        │          │
│ 8. D1 Write  │      │   MAPPING.md (890 lines)        │        │          │
└──────────────┘      └─────────────────────────────────┘        └──────────┘
```

---

## Next Steps

**To view the architecture:**
1. Read `ARCHITECTURE_INDEX.md` first (quick overview)
2. Then `ARCHITECTURE_VISUALIZATION_MAPPING.md` (detailed mapping)
3. Reference `SYSTEM_ARCHITECTURE.md` for context

**To run locally:**
```bash
cd /vercel/share/v0-project/apps/web
pnpm dev
# Visit localhost:3333/public-demo (no auth required)
```

**To deploy to Vercel:**
- Disable project-level auth in Vercel dashboard
- Push code to main branch
- Vercel auto-deploys

---

## Files Created/Updated

```
✓ ARCHITECTURE_VISUALIZATION_MAPPING.md (890 lines)
✓ SYSTEM_ARCHITECTURE.md (700 lines, existing)
✓ MCP_ADK_SPINE_CACHE_ARCHITECTURE.md (788 lines, existing)
✓ ARCHITECTURE_DIAGRAMS.md (578 lines, existing)
✓ ARCHITECTURE_INDEX.md (289 lines, existing)
✓ ARCHITECTURE_VISUALIZATION_COMPLETE.md (this file)
```

**Total:** 3,245 lines of comprehensive architecture documentation

---

## Conclusion

You now have:
✅ Diagram component → Code file mapping (890 lines)
✅ Complete system architecture overview (700 lines)
✅ Universal communication layer (788 lines)
✅ Visual architecture diagrams (578 lines)
✅ Navigation hub & index (289 lines)

**This enables:**
- Onboarding engineers in <1 hour
- Understanding any component quickly
- Debugging across distributed services
- Building new features with confidence
- Complete architectural compliance verification

The Continuity Bridge Operating System is fully documented and mapped to codebase.
