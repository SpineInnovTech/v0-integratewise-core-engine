# IntegrateWise — Secondary Mac Workflow Node Plan

## Distributed Continuity Runtime Expansion — May 2026

Primary Mac = Hermes orchestration HQ
Secondary Mac = workflow execution + automation node
Shared Fabric = Spine DB
Open WebUI = operational continuity surface

## PHASE 1 — Base Connectivity

1. Connect second Mac via Tailscale + SSH
2. Clone integratewise-live repos
3. Sync secrets/environment
4. Install Docker + n8n
5. Configure shared Firestore/Spine DB access

## PHASE 2 — Workflow Execution Node

Always-on: n8n, cron jobs, ingestion worker, telemetry worker, sync daemon, replay worker

## PHASE 3 — Continuity Sync

Secondary ingests deltas, checkpoints continuity, updates operational fabric, syncs Open WebUI knowledge on every event.

## PHASE 4 — Background Execution

Move to secondary: indexing, ingestion, compaction, replay, sync jobs, scheduled summaries, workflow retries, telemetry, MCP health checks.

## PHASE 5 — Beacon System

Each node emits: heartbeat, CPU/thermal, workflow state, queue depth, checkpoint freshness, sync latency, provider health.

## PHASE 6 — Failover

Secondary preserves continuity if primary fails. NOT autonomous replacement — continuity survival only.

## GOVERNANCE RULE

Secondary Node → Operational Fabric → Governance → Spine. Never direct canonical mutation.

## MINIMUM VIABLE NODE

Git sync, SSH, shared secrets, n8n, cron, Firestore access, Docker. WebUI/GPU optional.
