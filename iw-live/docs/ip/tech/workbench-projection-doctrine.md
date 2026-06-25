# Workbench & Projection Doctrine

The Spine is the thinking substrate.
The Workbench is the order layer.
The Projection Layer is the bridge that makes one usable by the other.

---

## 1. Purpose

- Prevent a future where the architecture is powerful but the experience is chaotic.
- Define how Spine, Projection, and Workbench must relate, so continuity is always operational, not just conceptual.

---

## 2. The Three Structural Layers

- **Spine (Canonical Reality)**
  - Stores universal operational truth: entities, relationships, continuity objects, governance states, and lineage.
  - Ingests from all tools and AI sessions through the 8-stage pipeline (Ingest -> Parse -> Extract -> Normalize -> Deduplicate -> Link -> Score -> Write).

- **Projection Layer (Adaptive Relevance)**
  - Computes _what matters for this user right now_, given their role, department, industry, entitlements, and depth matrix.
  - Applies schema, RBAC, product catalog, and field policies to return a scoped slice of the Spine.

- **Workbench (Operational Closure)**
  - Renders the projected slice as tiles, cards, queues, panels, and canvases that humans can see, understand, and act on.
  - Is not "a dashboard that shows Spine data". It is the closure mechanism for the cognitive layer.

---

## 3. Two Conceptual Layers

At the conceptual level, it is useful to group the internals into two layers:

- **Cognitive Layer (The Thinking System)**
  - Spine, AI reasoning, Triage Bot, governance states, workflows, continuity memory.
  - Produces: data, signals, states, proposals, and knowledge artifacts.

- **Workbench (The Order Layer)**
  - Unified surface, tiles/cards/blocks, action layer, context preservation, visibility into continuity and change.
  - Produces: clarity, control, closure.

**Doctrine:**
Without the Workbench, the cognitive layer degenerates into chaos and overwhelm.
Without the cognitive layer, the Workbench becomes an empty, pretty shell.

---

## 4. Spine vs Projection vs Workbench

- The **Spine** contains the full 12 x 11 schema: 12 operational domains x 11 industry projections = 132 typed variations in the database.
- The **Projection Layer** computes the user's slice based on:
  - Role (owner, admin, manager, practitioner, readonly).
  - Department (strategy, product, engineering, marketing, sales, business ops, etc.).
  - Industry vertical and subsector.
  - Depth matrix (how deep cross-department/industry views are allowed).
  - Twin tier and product entitlements.
- The **Workbench** renders only that slice, plus two special scopes: Org View and Personal View.

**Doctrine:**
The schema may have 132 combinations. The human must never see 132 views. Each user sees _their_ operational reality, not the database.

---

## 5. The Three Views

Every human lives in exactly three Workbench views:

- **Department x Industry View (Primary Work View)**
  - URL: `/work/{department}` (for example, `/work/business-ops`).
  - Projection: department + industry + role.
  - Shows: domain-specific entities, metrics, workflows, and signals for that department in that industry.

- **Org View (Executive Cross-Cut)**
  - URL: `/work/org`.
  - Projection: cross-department rollups for the tenant, still industry-aware, but role-elevated.
  - Shows: CEO/COO dashboards, cross-department metrics, continuity gaps, and strategic health.

- **Personal View (Individual Space)**
  - URL: `/personal`.
  - Projection: user-scoped memory and tasks, independent of department/industry.
  - Shows: tasks, calendar, notes, personal AI sessions, decisions, bookmarks, and "today" for that individual.

**Doctrine:**
Every user always has three doors:
My Department. My Organization. My Self.
Nothing else is first-class navigation.

---

## 6. Projection Rules

The Projection Layer enforces a small set of rules:

- **Role**
  - Owner sees everything; manager sees their team; practitioner sees their assignments; readonly sees only approved, live data.

- **Department**
  - Only entity types mapped to the user's primary department are shown by default.
  - Cross-department access is only via Org View and only for roles that permit it.

- **Industry**
  - Only fields and relationships relevant to the tenant's vertical and subsector are visible.
  - For example, healthcare compliance fields are hidden for a SaaS tenant.

- **Depth Matrix**
  - `depth_matrix[industry][department]` controls how deep cross-department information appears.
  - A low depth shows summary tiles; a high depth shows full tables and detailed canvases.

- **Twin Tier**
  - `no_twin`: basic, contextual AI only.
  - `basic_twin`: suggestions and evidence-backed insights.
  - `full_twin`: proactive simulations and action proposals, still under governance.

- **Product Entitlements**
  - Only modules from `product_catalog` that the tenant has actually purchased appear as Workbench modules.

**Doctrine:**
Projection decides relevance. Workbench renders it. Spine never leaks its full complexity directly to a human.

---

## 7. Workbench Primitives

The Workbench is built from a small set of universal primitives. Each primitive accepts a projected slice and turns it into closure:

- **Metric Tile**
  - Cognitive input: Spine aggregates and sync status.
  - Closure: "Your pipeline is INR 1.3Cr. 3 sources synced."

- **Entity Card**
  - Cognitive input: normalized entity, source lineage, health signals.
  - Closure: "Acme Corp -- Salesforce + Gmail. Health: 87%."

- **Insight Block**
  - Cognitive input: AI observations across systems.
  - Closure: "Legal review is blocking 3 deals. Follow up?"

- **Timeline Stream**
  - Cognitive input: continuity events, governance state changes, workflow transitions.
  - Closure: "Approved -> Live. Written back to Salesforce."

- **Governance Panel**
  - Cognitive input: pending approvals, HITL queue, autonomy levels.
  - Closure: "3 items need your approval. [Review]"

- **Action Tile**
  - Cognitive input: workflow triggers, write-back proposals.
  - Closure: "Update Salesforce stage? [Confirm]"

- **Health Ring**
  - Cognitive input: entity/system health, sync gaps.
  - Closure: "2 sources stale. 5 entities at risk."

- **Operational Canvas**
  - Cognitive input: full entity graph and pipeline state.
  - Closure: one composed view: all tools, all entities, all actions in context.

**Doctrine:**
Do not build 132 custom pages. Build ~8 primitives that can express any projected slice.

---

## 8. v0 vs v1: The Canonical Lesson

- **v0**
  - Workbench: complete -- tiles, cards, blocks, working memory, action buttons, health bars, metric dashboards, AI chat sidebar.
  - Cognitive layer: implicit -- lean loader, normalizer, early Spine concepts.
  - Experience: one tile, one context, one action. Chaos closed.

- **v1**
  - Cognitive layer: complete -- 12 x 11 Spine, continuity objects, governance, triage bot, workflows.
  - Workbench: deprecated -- moved to `_deprecated/`, replaced by fragmented domain shells.
  - Experience: powerful backend, but humans must navigate 12 empty shells and broken flows.

**Doctrine:**
Spine may deepen. Cognitive capabilities may expand.
The Workbench may never again be deprecated without an equal or better closure layer in place.

---

## 9. Implementation Contracts

### 9.1 Projection Engine

- **useProjection()**
  - Inputs: user role, department, industry, depth_matrix, twin_tier, tenant products.
  - Reads: `tenant_spine_config`, `spine_schema_registry`, `entity_type_map`, `product_catalog`.
  - Returns: projection objects for primitives (metric labels, values, trends, health, allowed actions).

**Contract:**
No Workbench component may query raw Spine tables directly. Every read must go through the Projection Layer.

### 9.2 Module Resolver

- Replaces hard-coded `DOMAIN_CONTENT_MAP`.
- Builds the left-hand navigation from: tenant configuration x product catalog x user role/permissions.
- Ensures each user sees 8-15 modules, not 132 domain x industry combinations.

### 9.3 Field Policy Renderer

- Reads `field_policies`, `required_fields`, `allowed_fields`, `ai_readable`, `searchable` per entity type.
- Decides, per user and per view:
  - Which fields are visible.
  - Which are editable.
  - Which are required.
  - Which can be read by the Twin for reasoning.

**Contract:**
Policy logic lives in the Projection Layer, not in ad-hoc JSX or component code paths.

---

## 10. Governance & HITL in the Workbench

- The cognitive layer may propose, but it never mutates truth directly.
- All Twin outputs and automated workflows surface as **Approval Cards** in the Governance Panel.
- Governance Panel guarantees:
  - Evidence chain: which signals and reasoning led to the proposal.
  - Actions: Approve, Reject, Edit, Defer.
  - Audit: who acted, when, against which prior state.

**Doctrine:**
The Workbench is the only place where AI proposals cross from cognition to action. No invisible execution is allowed.

---

## 11. Rebuild Order

To realign runtime with doctrine:

1. **Projection Engine**
   - Implement `useProjection()` and field policy rendering.
   - Migrate existing Workbench read paths to use it.

2. **Business Ops Workbench (Canonical Pattern)**
   - Rebuild Business Ops using the 8 primitives + Projection.
   - Treat this as the reference implementation for all future workbenches.

3. **Org View and Personal View**
   - Layer them on top of the same primitives and projection contracts.

4. **Governance Panel & HITL UI**
   - Wire the existing backend queue into a first-class Workbench primitive.

5. **Extend by Configuration, Not Code**
   - New departments/industries should be introduced via schema + projection configuration, not a new set of bespoke views.

**Doctrine:**
Once the adaptive Business Ops Workbench exists on top of the Projection Layer, every other workbench is a configuration, not a new product.
