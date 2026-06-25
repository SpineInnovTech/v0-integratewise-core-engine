# MCP Setup — SUPERSEDED

> **This document is superseded as of 2026-06-09.**
>
> It described a stale setup (16 tools, Supabase auth, removed `figma.*` namespace)
> and is no longer accurate.
>
> **Canonical reference:** [`tech/CONTINUITY_BRIDGE_DEPLOYMENT_STATUS.md`](./tech/CONTINUITY_BRIDGE_DEPLOYMENT_STATUS.md)
> **Architecture:** [`tech/MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md`](./tech/MCP_ADK_ROUTING_SPINE_MEMORY_ARCHITECTURE.md)

Current invariants: 20 tools · Cloudflare Access + Gateway JWT auth · Continuity
Bridge is the product · Twin reads via `continuity-tool-server` (MCP is the external door).
