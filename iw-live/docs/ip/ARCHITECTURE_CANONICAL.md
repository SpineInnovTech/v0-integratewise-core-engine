# IntegrateWise Architecture Document

**Status:** CANONICAL — Supersedes all prior architecture descriptions  
**Authority:** Nirmal, Founder  
**Date:** May 28, 2026 | Updated June 3, 2026

---

## Problem

Modern work is fragmented across CRMs, support desks, communication tools, documentation systems, project trackers, and AI interfaces, which forces the human to become the integration layer between systems that do not share context.

In this model, AI repeatedly starts cold, workflows break when context is missing, and the user must continuously re-inject knowledge that no system persists operationally.

IntegrateWise is designed to solve that deeper operating-model problem by creating persistent, operational, model-independent memory that keeps AI and human work aligned across sessions, tools, models, providers, and infrastructure changes.

---

## Architectural Thesis

IntegrateWise is built on a simple thesis: humans and machines enter through different channels, but both converge into the same Spine, the same memory system, and the same governed decision model.

The interaction layer is dual-channel, the persistence layer is singular, and the projection layer surfaces the same underlying truth into three product surfaces designed for different modes of work.

This architecture positions IntegrateWise not as a chat interface, not as a workflow engine, and not as a dashboard, but as an operating environment where context is unified, memory persists, continuity survives change, and governance remains intact.

---

## Interaction Model

IntegrateWise has two channels of entry.

| Channel         | Entry Actor                 | Interface                                                                                | Purpose                                                                      |
| --------------- | --------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Human channel   | User                        | Natural language plus direct tool interaction through the Twin and Operational Workbench | Lets the user reason, inspect, edit, approve, and operate on projected truth |
| Machine channel | External tools and software | MCP pipeline                                                                             | Lets connected systems send data into IntegrateWise in a canonical way       |

On the human side, the user speaks in natural language, invokes tools, and works directly on projected data in the Operational Workbench while the Twin reasons over the same Spine-backed memory.

On the machine side, connected systems enter through MCP, which serves as the primary protocol boundary for software-to-software communication into IntegrateWise.

---

## Connection Layer

The connection layer has three distinct components that together maintain ingestion and continuity across the ecosystem.

| Component                         | Role                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| MCP Pipeline                      | Primary connector for tools and software; protocol-level bridge for inbound and outbound tool communication                         |
| Folder / File / Location Watchers | Passive ingestion paths that fetch records and files from designated locations into the Spine                                       |
| AI Connectors                     | Active bidirectional read/write paths that maintain file continuity, data continuity, and tool-to-tool continuity through workflows |

Loader and Normalizer are not alternatives to MCP; they are internal stages of IntegrateWise's MCP implementation. Watchers complement that protocol path by bringing records and files into the system from designated locations, while AI connectors maintain active bidirectional continuity between tools and the Spine through workflow-driven interactions.

---

## MCP Pipeline

The inbound machine flow through the protocol layer is:

```
External Tool
│
▼
MCP ──── Loader (fetch) ──── Normalizer (transform) ──── Spine
```

MCP is the boundary contract, Loader is the fetch stage, and Normalizer is the transformation stage that reformats heterogeneous source data into a common internal shape before it lands in the Spine.

IntegrateWise uses real MCP. Loader and Normalizer are appended as part of its implementation rather than presented as a proprietary alternative.

---

## Data Flow

IntegrateWise operates as a continuous round trip, not a one-way ingestion system. Data enters from tools, watchers, and connected locations, gets normalized, lands in the Spine, is projected into product surfaces, gets acted on by the user, and then maintains continuity back across the ecosystem through governed handoff and bidirectional connector paths.

The top-level flow is:

```
HUMAN                                    TOOLS / SOFTWARE / LOCATIONS
│                                                  │
│ NLP + Tools                                      │ MCP / Watchers / AI Connectors
▼                                                  ▼
Operational Workbench / Twin                        Loader → Normalizer / Watchers / Connector Flows
└──────────────────────┬──────────────────────────────┘
                       ▼
                     Spine
                       ▼
             Projection into Surfaces
                       ▼
          User review, approval, planning
                       ▼
        Handoff to user's agentic claw
                       ▼
       User executes in their own stack
                       ▼
    Continuity returns through connectors/watchers
```

This round trip is central to the architecture because continuity is only real when the system can absorb change from tools and files, preserve memory through the Spine, and maintain aligned state across future cycles.

---

## Spine

The Spine is the core persistence layer of IntegrateWise. It is not a single database but a living record implemented as one logical memory layer across multiple physical storage systems, including Postgres, Redis, Cloudflare KV, Cloudflare R2, Cloudflare D1, and a Spine DB-managed database that is accessed only through a Cloudflare Worker.

Different data types live in different storage layers according to their access patterns, but the architecture presents them as one coherent memory to every layer above. This is what allows the system to survive model switches, provider switches, and infrastructure changes without forcing the user to re-explain context.

---

## Surface Model

IntegrateWise surfaces the Spine through three product surfaces.

| Surface               | What It Is                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operational Workbench | Primary work surface where projected truth is shown and work happens. Left sidebar navigation. The Twin is a collapsible sidebar that pops out only when needed — surfacing insights, requesting approvals, executing actions inline. |
| Twin Workbench        | Full AI ecosystem surface — skills, knowledge, agents, prompts, conversational library. OpenWebUI-style. Conversational memory lives here. Can be positioned at different locations in the shell.                                     |
| Memory View           | Personal, Organizational, and Conversational memory surfaced in a documentation-site style. Can be positioned at different locations.                                                                                                 |

The Operational Workbench is the primary work surface. Left sidebar navigation. Domain-specific views (BizOps, Account Success, Sales, Finance, etc.). The Twin is a collapsible sidebar that pops out only when needed — surfacing insights, requesting approvals, and executing actions inline without occupying permanent screen space. Business Operations is a department within the Operational Workbench — 14 modules, cross-department rollup, founder/CEO/COO/CTO lenses.

The Twin also exists independently in the Twin Workbench as the full AI ecosystem surface — skills, knowledge, agents, prompts, conversational library. OpenWebUI-style. Conversational memory lives here. Can be positioned at different locations in the shell.

---

## Memory Model

IntegrateWise uses three memory layers: Personal Memory, Organizational Memory, and Conversational Memory. These are persistent memory layers, not temporary context windows, and they survive model changes, provider changes, and session boundaries.

| Memory Layer          | Purpose                                                                                        | Surfacing and Sharing                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Personal Memory       | Private preferences, personal context, notes, and working patterns belonging to the user alone | Hard-separated from organizational memory; surfacable through internal views and user-owned connectors             |
| Organizational Memory | Shared institutional knowledge, decisions, patterns, doctrine, and team-level intelligence     | Shared at company level with governed promotion paths; surfacable through internal views and user-owned connectors |
| Conversational Memory | Staging layer for interactions, discussions, raw decisions, and working context                | Surfaced within the Twin Workbench; not a separate surface                                                         |

The key architectural principle is that memory stays independent by design; sharing is not automatic and is not an architectural leak path. Information moves between layers only through governed promotion, explicit user action, or AI recommendation followed by human approval.

Personal and Organizational Memory are surfacable not only inside IntegrateWise views but also through user-owned connectors, allowing users to access their memory from their own tools and systems without collapsing the underlying separation model. Conversational Memory lives inside the Twin Workbench and serves as the staging layer between interaction and permanent knowledge.

---

## Governance

Governance is not a wrapper added on top of the system; it is part of the architecture at every layer. The governing principle is simple: AI proposes, human approves, and execution happens only after handoff into the user's own environment.

Every action has lineage, every decision is recorded, approval gates exist before execution, and governed promotion ensures that memory movement is reviewed before becoming permanent. IntegrateWise reasons, plans, and prepares actions, but execution remains outside the product boundary and is carried out by the user through their own agentic claw and stack.

The handoff model is:

```
Twin reasons and plans
│
▼
Handoff to user's agentic claw
│
▼
User executes in their own stack
```

---

## Security and Control

IntegrateWise secures external machine access to the ecosystem through Cloudflare Access at the perimeter, routes every authenticated request through a tenant-aware Gateway, and keeps internal service execution inside Cloudflare through private Worker-to-Worker bindings. This creates a clean three-part security and runtime model: Access verifies who is calling, the Gateway determines what tenant and capabilities the caller is allowed to reach, and the internal services execute platform logic without exposing private coordination paths to the public internet.

For machine-to-machine MCP traffic, the correct pattern is to protect the public MCP entrypoint with a Cloudflare Access **Service Auth** policy rather than an interactive browser login flow. MCP clients, agent runtimes, and external services must therefore authenticate using `CF-Access-Client-Id` and `CF-Access-Client-Secret`, allowing JSON-RPC, SSE, and similar machine protocols to cross the Access membrane without being broken by a human login redirect. Where a hostname is already covered by an existing Access application, the Service Auth policy should be attached to that application instead of creating a second overlapping application definition, because overlapping scopes can produce blocking or inconsistent behavior.

Once Access has authenticated the caller, the request enters the Gateway, where IntegrateWise resolves tenant context and enforces application-level authorization. The `x-tenant-id` header may be passed through to the Gateway, but tenant trust is not something Cloudflare validates on your behalf; the Gateway must verify that the authenticated client is actually allowed to operate against the requested tenant boundary before exposing tools, actions, memory, or Spine partitions. In IntegrateWise terms, Access is the perimeter membrane, but tenant isolation remains a governed platform responsibility inside the system.

Inside the ecosystem, service-to-service execution uses Cloudflare Service Bindings or Workers RPC rather than public URLs. In that mode, one Worker calls another through Cloudflare’s internal runtime path, which means the request does not traverse the public internet and does not pass back through the Access-protected hostname. This distinction matters: external MCP clients always authenticate through Access, while internal IntegrateWise services communicate privately through bindings, preserving speed, reducing surface area, and keeping the internal nervous system separate from public ingress.

The operational rule is therefore simple and final: all external MCP traffic enters through an Access-protected public endpoint using Service Auth; all tenant interpretation and authorization happen inside the Gateway; and all internal platform coordination happens through private Worker bindings. This is the correct Cloudflare-native pattern for a Spine-powered, multi-tenant MCP architecture because it separates perimeter authentication, tenant governance, and internal execution into distinct layers without collapsing them into one mechanism.

### Canonical Doctrine Block

> IntegrateWise treats Cloudflare Access as the authentication membrane for all external machine traffic, the Gateway as the tenant and capability router for all authenticated requests, and Cloudflare Service Bindings as the private execution path for internal services. External MCP clients must authenticate with Service Auth credentials so JSON-RPC and SSE connections remain machine-safe; internal Workers never use the public MCP hostname and instead communicate through private bindings inside Cloudflare’s runtime. This separation is the governing rule of the ecosystem: perimeter authentication at Access, tenant enforcement in the Gateway, and private coordination inside the platform.

### Security Terminology

- **Access membrane**: The Cloudflare Access boundary where external machine callers are authenticated before entering IntegrateWise.
- **Gateway**: The tenant-aware routing and authorization layer that decides what an authenticated caller may see or do.
- **Private nervous system**: The internal Worker-to-Worker execution path implemented through Service Bindings or Workers RPC.
- **Spine-aligned ingress**: The rule that every external call enters through one governed perimeter before touching tenant memory, tools, or records.

---

## MCP OAuth Resource Server

IntegrateWise exposes its external MCP interface as an OAuth-protected MCP resource server. The MCP host publishes Protected Resource Metadata, directs clients to the authorization server through standard OAuth discovery, and accepts only bearer tokens issued for the IntegrateWise MCP resource. Tenant routing remains a gateway responsibility after token validation, while internal platform services continue to communicate through private Worker bindings rather than the public MCP ingress.

### Target Architecture

```
External MCP Client (Cursor, Claude, Agent Runtime)
        │
        │ 1. Discovery
        ▼
mcp.integratewise.ai/.well-known/oauth-protected-resource
        │
        │ 2. Redirect to Authorization Server
        ▼
auth.integratewise.ai/.well-known/oauth-authorization-server
        │
        │ 3. Authorization Code Flow → Token
        ▼
Client receives Bearer token (aud: https://mcp.integratewise.ai)
        │
        │ 4. Authenticated MCP Call
        ▼
mcp.integratewise.ai (Gateway validates token → tenant scope → MCP tools)
```

Four components make this work:

| Component                                      | Role                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| MCP Resource Server (`mcp.integratewise.ai`)   | Serves MCP endpoints + Protected Resource Metadata                                                   |
| Authorization Server (`auth.integratewise.ai`) | OAuth discovery, authorize, token, dynamic client registration                                       |
| Protected Resource Metadata                    | `/.well-known/oauth-protected-resource` with `resource`, `authorization_servers`, `scopes_supported` |
| Bearer Token Validation                        | Gateway validates issuer, audience, expiry, scopes before exposing tenant-scoped tools               |

### What Must Exist on the MCP Host

- `/.well-known/oauth-protected-resource` returning JSON with `resource`, `authorization_servers`, and `scopes_supported`.
- A `401 Unauthorized` response on unauthenticated MCP calls with `WWW-Authenticate: Bearer ... resource_metadata=...` pointing to the protected-resource metadata URL.
- Bearer-token validation inside the gateway for every call, including **audience restriction** so tokens are explicitly meant for `https://mcp.integratewise.ai`.
- Tenant authorization enforced after token validation — `x-tenant-id` header checked against token claims or server-side entitlement map, never trusted alone.

### Token Model Rules

- `aud` must equal `https://mcp.integratewise.ai`.
- Scopes are narrow and purpose-specific: `mcp:tools`, `mcp:resources`, `tenant:read`, `tenant:write`, `memory:read`, `memory:write`.
- `x-tenant-id` is validated against token claims or entitlement map, not trusted as a standalone header.
- Internal Worker-to-Worker traffic continues through Service Bindings, never through OAuth over the public hostname.

### Implementation Path on Cloudflare

The most practical production path for IntegrateWise:

- Keep Cloudflare Access for human/admin surfaces if desired, but do not rely on it as the MCP OAuth layer.
- Stand up a proper OAuth authorization server, either:
  - **Cloudflare Workers OAuth Provider** for a Cloudflare-native implementation, or
  - an external IdP such as Keycloak/Auth0/Descope/Keycard for faster standards-complete rollout.
- Implement the MCP server on Workers so it serves both the MCP endpoint and the protected-resource metadata endpoints on the same host.

### Build Checklist

- [ ] Create an OAuth issuer for IntegrateWise.
- [ ] Publish auth metadata at `auth.integratewise.ai/.well-known/oauth-authorization-server` or OIDC discovery.
- [ ] Add `/.well-known/oauth-protected-resource` to `mcp.integratewise.ai`.
- [ ] Make unauthenticated MCP requests return `401` with `WWW-Authenticate` and `resource_metadata`.
- [ ] Validate bearer tokens in the gateway using issuer JWKS or introspection.
- [ ] Enforce audience = `https://mcp.integratewise.ai`.
- [ ] Enforce tenant authorization after token validation.
- [ ] Keep internal services on Service Bindings.

---

## Product Ecosystem

IntegrateWise is built across multiple repositories that each own a distinct responsibility. No single repo contains the entire product; the system emerges from the interaction between them.

```
Folder Monitor (laptop/server)
        ↓ detects files, events, changes
        ↓ writes to QUEUE
Queue + Routing layer
        ↓ promotion logic, error logging
        ↓ routes to correct destination
        ↓
┌───────────────────────────────────────────────────────┐
│ INTAKE                 GOVERNANCE                     │
│ Downloads/Desktop/Docs  System proposes               │
│ → staging queue        Human approves                 │
│ → never auto-moves     Audit log every action         │
└───────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  THE FULL PRODUCT                                               │
│                                                                 │
│  IntegrateWise - Memory          ← THE SUBSTRATE                │
│  → Conversational + Org + Personal memory unified               │
│  → The vault. The thing that cannot be deleted.                 │
│                                                                 │
│  integratewise-live               ← THE ENGINE                  │
│  → 25 CF workers, 8-stage pipeline, HITL loop,                 │
│    Entity 360, knowledge service, Think/Govern/Act,             │
│    Stripe+Razorpay billing, 50+ connectors                      │
│                                                                 │
│  integratewise-ops                ← PROVEN SURFACES              │
│  → Founder Command Center, IntegrationHealth, Tool ROI          │
│                                                                 │
│  IntegrateWise Folder Monitor     ← INTAKE PIPE                 │
│  → Files, events, changes enter the system here                 │
│                                                                 │
│  integratewise-docs               ← PUBLIC DOCS                 │
│                                                                 │
│  integratewise-marketing          ← MARKETING SITE              │
│                                                                 │
│  EXCEPTION: Twin memory wiring (behavioral logging →            │
│  personal memory → prompt injection)                             │
└─────────────────────────────────────────────────────────────────┘
```

### Repository Contributions

| Repository                   | What It Contributes                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| IntegrateWise - Memory       | The substrate — canonical memory vault that the folder monitor feeds into and the Twin reads from |
| integratewise-live           | The engine — pipeline, memory, governance, billing, connectors, 25 CF Workers                     |
| integratewise-ops            | The operational truth — proven working surfaces, 28 connected systems, founder view               |
| IntegrateWise Folder Monitor | The intake pipe — files, events, changes enter the system here                                    |
| integratewise-docs           | Public documentation site                                                                         |
| integratewise-marketing      | Marketing site with Sanity CMS                                                                    |

---

## Assembly Sequence

The product is assembled in five phases, each building on the previous one.

**Phase 1 — Intake pipe (Folder Monitor + Queue)**
Folder Monitor runs on laptop/server. Detects. Writes to queue. Never acts. Queue routes to correct service based on file type, source, content. Error log captures every failure. This is the entry point for all external data.

**Phase 2 — Routing layer**
Queue consumer reads each item. Classifies: is this a document (Flow B), a webhook event (Flow A), an AI session (Flow C)? Routes to correct service. Promotion logic: when does a staged file become canonical? Only on human approval.

**Phase 3 — Wire the ops surfaces**
Take what was built (Founder Command Center, IntegrationHealth, Tool ROI, Brainstorming Layer) and wire them to integratewise-live's backend. The ops surfaces had the right interfaces on the wrong stack. The backend has the right stack with surfaces missing. Merge the two.

**Phase 4 — Twin memory (the 5% exception)**
Behavioral logging → personal memory schema → prompt injection. This is what makes the Twin a Twin and not a chatbot. Cannot be skipped — but it goes after the intake pipe is solid.

**Phase 5 — The combined shell**
One shell that houses all of it. OS cockpit as the frame. Domain shells as the rooms. Knowledge base as the memory. Folder monitor as the intake. Twin as the operator. Approval gate on every action.

---

## MCP as Protocol, Not Architecture

A core insight distinguishes IntegrateWise from every other MCP implementation: the architecture was built from the data problem backward, not from the protocol forward.

Most systems implementing MCP start with the protocol — "how do tools speak to the LLM?" — and expose whatever data their existing schema already has. The result is fragmented, tool-specific context that still leaves the LLM partially blind.

IntegrateWise started with the data problem — "the LLM needs the full picture" — and built the architecture to produce that. The Normalizer and Spine were built in August 2025, before MCP was published as a protocol specification. The founding insight was not "implement MCP." The founding insight was "normalize everything and hold one truth."

This produces what can be called **proof by convergence**: two independent derivations — one starting from the protocol spec, one starting from the data problem — arrive at exactly the same architecture. When two different paths lead to the same result, that result is not a preference or a design choice. It is the answer the problem structurally demands.

The practical implication: MCP is the protocol that makes normalization native and uniform. But the intelligence was already there the moment the decision was made — one truth, one source, everything normalized. MCP is what makes it elegant. The Normalizer and Spine are what make it real.

```
Fragmented data → blind LLM
Normalized data → LLM sees everything

It does not matter what carries
the normalized data to the LLM.
The normalization is the insight.
The single truth is the insight.
The protocol is just the delivery mechanism.
```

---

## Continuity Across Change

A defining property of the architecture is continuity across sessions, tools, files, models, providers, and infrastructure. The model is treated as a variable and the memory as a constant, which means switching from one LLM to another does not reset the system's understanding.

That continuity is maintained not only through the Spine but also through AI connectors and watcher-based ingestion paths that preserve file continuity, data continuity, and tool-to-tool continuity across the operating environment. In IntegrateWise, continuity is not a feature flag; it is the foundation that connects the Spine, the memory layers, the three-surface model, and the governance model into one coherent operating environment.

---

## Architectural Summary

IntegrateWise can be summarized as a top-down architecture with five linked layers.

1. **Problem layer:** fragmented tools, cold-start AI, and human-held context.
2. **Interaction layer:** humans enter through NLP and tools; machines and software enter through MCP, watchers, and connector paths.
3. **Processing layer:** Loader fetches, Normalizer transforms, and all inbound continuity paths converge into the Spine.
4. **Surface and memory layer:** the Spine persists truth and projects it into the Operational Workbench, Twin Workbench, and Memory View, backed by personal, organizational, and conversational memory.
5. **Governance layer:** every action, promotion, and handoff passes through approval, lineage, and control before the user executes in their own stack.

The security layer sits across all five: Cloudflare Access authenticates external machine traffic at the perimeter, the Gateway resolves tenant context and enforces authorization after token validation, the MCP endpoint publishes OAuth Protected Resource Metadata and accepts only bearer tokens with audience restriction, and all internal platform coordination runs through private Worker bindings with no public ingress.

Together, these layers define IntegrateWise as a unified operating environment where users work in one place, memory persists across change, continuity extends across the ecosystem, and execution remains under explicit human control outside the product boundary.

---

_Document: IntegrateWise Architecture — Canonical_  
_Author: Nirmal, Founder_  
_Status: Supersedes ARCHITECTURE_V2.md and all prior architecture descriptions._  
_Date: May 28, 2026 | Updated June 3, 2026_
