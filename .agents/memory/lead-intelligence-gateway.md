---
name: Lead Intelligence ("Obtain It") gateway
description: How the live, grounded lead-intelligence panel must read-through a platform gateway and never cache/store a copy
---

# Lead Intelligence ("Obtain It")

The lead-detail "Obtain It" panel answers six fixed questions (why qualified, why a first-fit, problem, current solution, in our track, recommended action) plus an Approach/Hold/Pass verdict. It is a **live read-through** feature: the api-server is a thin proxy to a platform intelligence gateway (`INTELLIGENCE_GATEWAY_URL`); Customer Zero does **no** local scoring and adds **no** DB columns. When the gateway is unset/unreachable/timeout/shape-mismatch it degrades honestly to `gateway_unavailable` (HTTP 200) with verdict `unknown` and all six answers literally `"unknown — needs enrichment"`.

**Rule: the client must keep NO cache of intelligence.**
The React Query for this panel sets `staleTime: 0`, `gcTime: 0`, `refetchOnMount: "always"`, and passes an explicit `queryKey` (the generated orval `query` option type requires `queryKey`). Every lead-open fetches fresh; the result is dropped on unmount.

**Why:** the doctrine is "data pulled once goes stale — Customer Zero stores no copy of strategy/ICP; read live at open time, stamped 'as of <time>'." Default React Query caching would flash a stale prior verdict when the same lead is reopened — a direct doctrine violation. Don't re-introduce caching here.

**How to apply:** when editing the panel or hook, preserve the no-cache options. When editing the server proxy, keep the honest `buildUnavailable` fallback, validate the gateway payload with the generated zod, and keep the guard that a `ready` response actually contains all six question keys (else degrade to `error`) so the panel never renders a partial read. Never fabricate, never store, never serve stale.
