# Ingestion, Pipeline, and Agent Processing Specification

This document details the canonical architecture of the IntegrateWise data ingestion pipeline and AI agent processing core. It maps exactly how files are captured, when sync triggers fire, how data connects to the Spine database (Core Memory Substrate), and how specialized agents orchestrate reasoning.

---

## 1. File Ingestion Mechanics & Triggers

To maintain a zero-overhead server footprint, data capture operates on a decentralized, event-driven model.

```
Local Folder Monitor (chokidar) ──[HTTP POST]──▶ Webhook Ingress Worker
                                                        │
                                                        ▼
                                                Loader (provenance)
                                                        │
                                                        ▼
                                            Cloudflare Ingestion Queue
                                                        │
                                                        ▼
                                            Normalizer (8-Stage Pipeline)
```

### Ingestion Triggers (The Instants of Capture)

Data ingestion and run flow updates are initiated by four distinct trigger types:

1.  **Event-Driven Folder Monitor (Instantaneous)**:
    - **The Actor**: The local `Folder Monitor` (built using `chokidar` in Node.js) runs as a background process on the user's operational Mac/ops machine.
    - **The Instant**: Triggered instantaneously when a file is **created**, **modified**, or **saved** inside monitored filesystem directories (such as the local markdown memory vault).
    - **The Flow**: The monitor instantly reads the file chunk, extracts basic file-system metadata (path, size, modification timestamp), and streams the payload via an HTTP POST request to the `webhook-ingress` worker, which passes it to the `loader`.
2.  **API Connector Delta Sync (Scheduled Intervals)**:
    - **The Actor**: The `connector-sync` scheduler.
    - **The Instant**: Triggered at intervals determined by the tenant's sync entitlement tier (Free: every 24h, Starter: 4h, Professional: 1h, Enterprise: 15min).
    - **The Flow**: The loader retrieves delta updates (records modified since `last_sync_at`) directly from third-party tools (HubSpot, Salesforce, Jira) and queues them for processing.
3.  **Manual User Upload (On-Demand)**:
    - **The Actor**: The frontend Workspace Shell.
    - **The Instant**: Triggered instantly when a user drags-and-drops a document or file into the loader interface.
    - **The Flow**: The client streams the file upload to the Hono Gateway, which routes it directly to the `loader` service.
4.  **User Workbench Interactive Changes & Run-Flow Updates (Real-Time State Ingestion)**:
    - **The Actor**: The frontend User Workbench (interactive pages, settings panels, curated memory boards, governance panels, and playbook trigger dashboards).
    - **The Instant**: Triggered in real-time when the user makes any interactive update in their workbench—such as toggling alert settings, modifying account health thresholds, approving pending queue curation tasks, editing memory text blocks, or initiating a new run flow.
    - **The Flow**: The frontend client captures all changes and updates in the user workbench and immediately executes a write/update through the `spineClient` layer back to the **Spine DB / Core Memory Substrate**. This instantly emits a state change signal, triggering the **Twin Reasoning Engine** to re-ground its context and the **Signal Engine** to recalculate company KPIs, while automatically initiating any approved playbook execution flows.

---

## 2. Ingestion to Spine Database Connectivity

Every ingestion path flows through the `loader` into the Cloudflare Ingestion Queue (`pipeline-process`) before hitting the **8-Stage Normalizer**.

### The 8-Stage Normalizer Pipeline

The `normalizer` processes incoming records sequentially to build the Spine context substrate:

```
[S1: Intake] ──▶ [S2: Classify] ──▶ [S3: Filter] ──▶ [S4: Refine]
                                                         │
                                                         ▼
[S8: Resolve] ◀── [S7.5: Identity] ◀── [S7: Sanity] ◀── [S6: Validate] ◀── [S5: Extract]
```

1.  **S1: Intake**: Receives raw payloads, assigns a provenance hash (`source_id`), and logs metadata.
2.  **S2: Classify**: Classifies the incoming record into one of our 7 canonical resource types (Person, Account, Task, Note, Alert, Conversation, Signal) using light AI-in-the-loop if the type is ambiguous.
3.  **S3: Filter**: Filters out spam, template code, and redundant noise.
4.  **S4: Refine**: Sanitizes values and normalizes schema mapping to our strict TypeScript definitions.
5.  **S5: Extract**: Extracts entities, values, or semantic topics.
6.  **S6: Validate**: Enforces structural constraints and data invariants.
7.  **S7: Sanity**: Verifies logic consistency, flagging anomalous data points.
8.  **S7.5: Entity Resolution (Identity Matching)**:
    - _The Core Challenge_: Mapping scattered identities across platforms (e.g., Salesforce contact `nirmal@org.com` = Jira assignee `Nirmal Prince` = HubSpot deal champion).
    - _The Resolution_: Normalizer queries the edge `link_data` table to resolve entities to a single, unified canonical ID. If no match exists, a new identity is provisioned.
9.  **S8: Resolve / Write**: Writes the clean, normalized entity to the **Spine DB / Core Memory Substrate** through a secure service binding.

---

## 3. AI Agent Processing Flow

Once data is securely resolved inside the Spine DB, the **Intelligence Layer (Agents)** activates to orchestrate reasoning, governance, and updates:

```
Spine DB Entity Write
      │
      ├─▶ Triage Bot (Governance Scoring: auto-approves or stages in Queue)
      │
      └─▶ Signal Engine (Always active: compares state and detects deviations)
                │
                ▼
           Twin Interface (Assembles 360-degree context and reasoning)
                │
                ▼
           Operator Handoff (Hands playbooks to local client for execution)
```

### The Ingestion-to-Agent Lifecycles

#### A. The Triage Bot (Governance Gate)

- **Trigger**: Fires on _every_ proposed write or memory promotion.
- **Operation**: Evaluates the proposal against our 5-dimension scoring model (Evidence, Category Fit, Novelty, Specificity, Linkage).
- **Outcome**:
  - `Score >= 0.85`: Auto-approves the proposal, committing the change immediately to the Spine DB.
  - `Score 0.60 - 0.84`: Stages the proposal in the Governance Queue (`pending_review`) for human HITL approval.
  - `Score < 0.60`: Auto-rejects the change, logging the decision logic securely.

#### B. The Signal Engine (Continuous Awareness)

- **Trigger**: Always active, continuously scanning the edge databases.
- **Operation**: Compares current Spine entity states against baseline goals. It checks for slippage, commitment breaches, or critical anomalies.
- **Outcome**: Generates an actionable `signal` record in the database if an anomaly is detected, and flags it in the user's Twin brief.

#### C. The Twin (Context Assembly & Conversation)

- **Trigger**: Activated by user session loading, alert triage, or conversation.
- **Operation**: Assembles a complete 360-degree context by pulling operational signals from edge cache D1 tables and historical decisions from the Spine DB. It ranks and compresses the dataset before reasoning.
- **Outcome**: Presents the user with clear proposals, reasoning chains, and playbooks.

#### D. The Operator & Handoff Boundary

- **Trigger**: User approves a staged proposal.
- **Operation**: The Operator parses the approved proposal, compiles the step-by-step instructions into a functional **Playbook JSON**, and dispatches it.
- **Boundary Handoff**: The server-side Operator hands off the **Playbook JSON** directly to the customer's local client/agent running on their own machine. The local client executes the actual write operations locally (e.g., calling HubSpot APIs), keeping our server runtime footprint at zero.
