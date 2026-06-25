# Parent Repositories & Operational Roles Specification

Under our canonical **Customer Zero** operating mandate, we run the IntegrateWise engine to operate, monitor, and synchronize IntegrateWise itself.

Our company runs as a network of **seven specialized repositories** in `/Users/nirmal/Github/`. This document defines the exact, immutable roles and operational boundaries of the ecosystem:

```
                  ┌──────────────────────────────┐
                  │    IntegrateWise - Memory    │
                  │   (Filesystem Memory Vault)  │
                  └──────────────┬───────────────┘
                                 │
                     [IntegrateWise Folder Monitor] (Folder monitor)
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │      integratewise-live      │ ──[feeds telemetry]──▶  integratewise-ops (Ops)
                  │ (Unified View Surface Backend)│
                  └──────────────┬───────────────┘
                                 ├──────────────────────────────┐
                                 ▼                              ▼
                  ┌──────────────────────────────┐ ┌──────────────────────────────┐
                  │  integratewise-business-...  │ │ org-mem.bookofprojects-...   │
                  │ (BI Visual Cockpit - Chart)  │ │(CSM Success Cockpit - Con CS)│
                  └──────────────────────────────┘ └──────────────────────────────┘
                                                                │
                                                       [publishes approved]
                                                                │
                                                                ▼
                                                       integratewise-docs (Docs)
```

---

## Shared Ecosystem Primitives & Repositories

### 1. The Core Engine (The Backend Substrate)

- **Repository**: `integratewise-live` (this repo)
- **Role**: **The Unified View Surface Backend (Memory, Ingestion, Gateway)**
- **Operational Mechanism**:
  - Acts as the central engine, Normalizer pipeline, Spine DB PostgreSQL, and Cloudflare Edge databases (D1/KV/Queues).
  - Serves as the single backend that powers all visual frontends/cockpits. Everything compiles and routes here.
  - Handles authentications, processes S1-S8 normalizer stages, and exposes edge tables to frontend visual shells.

---

### 2. The Visual Cockpits (The View Surfaces)

- **BI Cockpit (Chart)**:
  - **Repository**: `integratewise-business-intelligence-hub` (aka `v0-realistic-design-main`)
  - **Role**: **The Business Intelligence Visual System**
  - **Operational Mechanism**: Surfaces executive/founder metrics, trendlines, and performance charts, backed strictly by `integratewise-live`.
- **Customer Success Cockpit (Con Success / CSM Success)**:
  - **Repository**: `org-mem.bookofprojects-integratewise`
  - **Role**: **The Account Success / CSM Success Visual System**
  - **Operational Mechanism**: Surfaces specialized account success views, personal/organizational memory projections, case studies, and corporate project records, backed by `integratewise-live`.

---

### 3. The Operations Telemetry (Ops)

- **Repository**: `integratewise-ops`
- **Role**: **The Operations Controller Board**
- **Operational Mechanism**:
  - Vue 3 dashboard command center used to monitor the live pipeline queues, Normalizer checkpoints, active signal caches, and quarantine logs.

---

### 4. Inbound File Ingestion & Filesystem Intelligence (Folder Monitor)

- **Folder Monitor**:
  - **Repository**: `IntegrateWise Folder Monitor`
  - **Role**: **The Filesystem Intelligence Dashboard & Local Ingestion Monitor**
  - **Operational Mechanism**:
    - **Local Folder Watcher (Chokidar Daemon)**: Runs as a background daemon on the operational Mac/ops machine. It monitors `IntegrateWise - Memory` directories in real-time, capturing file modifications and streaming the payload chunks directly to `webhook-ingress` via HTTP POST.
    - **Filesystem Intelligence Dashboard**: A static, single-page, vanilla JS dashboard (`index.html` + `app.js` with `IW_DATA` pre-built bundle) projecting the operational filesystem structure, department mapped folders (00-09 model), file explorer manifests, review queue lifecycles, and Mac system health/cleanup candidates.
    - **Governance Rule**: To uphold our primary governance primitive (_the system proposes, humans approve_), the dashboard is strictly read-only, and all action buttons are permanently disabled with the label "Approval required".
- **Memory Substrate**:
  - **Repository**: `IntegrateWise - Memory`
  - **Role**: **The Filesystem Vault Substrate**
  - **Operational Mechanism**: Permanent, offline-first physical storage vault for organizational context, decisions, and system guidelines using markdown folder structures.

---

### 5. Document Publication (Docs)

- **Repository**: `integratewise-docs`
- **Role**: **The Brand Documentation Hub**
- **Operational Mechanism**:
  - Hosts public and internal documentation, which differ based on context.
  - Wired to a sync pipeline: when a memory is published or promoted via governance inside **Ops / Governance**, the doc system automatically captures, sanitizes, and syncs the content.

---

## Governance & Action Boundaries

**Governance** is the central workspace layer where **digital works** (approved mutations), **digital orders** (compiled Playbooks), and **folder monitor** statuses are made visible and manageable:

- **Digital Works**: Proposals staged or approved by the Triage Bot scoring model. Staged items wait for human approval in the Governance Queue before committing.
- **Digital Orders**: Step-by-step playbooks generated by the Twin and sent to local secure client CLI instances for execution, keeping server runtime footprints at zero.
- **Folder Monitor Visibility**: Monitors active file-sync states and edge caches in real-time.

---

## The Core Substrate: User Workbench State Capture & Run Flow Loop

Under the **Customer Zero** operational model, the **User Workbench** (located inside the primary monorepo at `integratewise-live/apps/web`) acts as the active human-governed command membrane. Every single interactive change, curation task, threshold modification, setting toggle, or playbook activation made by the operator inside the workbench is captured in real-time and orchestrates the system's runtime flows:

```
                  ┌──────────────────────────────┐
                  │   User Workbench Interface   │
                  │  (apps/web/src/components)   │
                  └──────────────────────────────┘
                                 │
                   [Direct spineClient Mutation]
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Spine DB / Substrate      │ ──[Dual-Write]──▶  IntegrateWise - Memory
                  │ (Authoritative SQL Fortress) │                     (Local Filesystem Vault)
                  └──────────────────────────────┘
                                 │
                           [State Signal]
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Twin & Signal Engines     │ ──[Handoff]────▶   Local Playbook Executon
                  │  (Real-Time Cognitive Loops) │                     (Zero-Server footprint)
                  └──────────────────────────────┘
```

### Operational Loop Lifecycle:

1. **Workbench Mutation**: When the user changes settings (e.g., in the CSM settings-view), approves an organic memory promotion, or clicks "Run" on a playbook, the frontend client intercepts the action and executes a write operation through the abstracted `spineClient` layer.
2. **State DB Hydration**: The update is committed securely to the authoritative **Spine DB**.
3. **Core Memory Dual-Write**: The sync worker dual-writes the update directly back to the physical `IntegrateWise - Memory` markdown files, preserving permanent historical records.
4. **Signal & Execution Flow**: The commit instantly triggers a `state-change` signal. The **Signal Engine** flags anomalies on the `integratewise-ops` telemetry board, the **Twin Engine** updates L2 cognitive overlays in the workbench, and the operator hands off compiled **Playbook JSONs** for execution inside the user's secure local environment.
