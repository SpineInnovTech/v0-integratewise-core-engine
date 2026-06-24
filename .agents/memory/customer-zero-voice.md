---
name: Customer Zero single-voice framing
description: Every surface must read as IntegrateWise dogfooding its own platform; how to spot/fix template fiction without stripping legit content.
---

# Customer Zero must speak in one voice

**Rule:** Every screen in this repo (iwa-customer-zero) must read as IntegrateWise's
own internal operations cockpit — IntegrateWise dogfooding its own platform. The true
model to express anywhere architecture/data is described: three-repo split
(integratewise-live = the Spine / Cloudflare truth; iwa-frontend = customer product;
this repo = internal ops surface) → Customer Zero client → governed `/api` relay
(Express + Drizzle / local Postgres, swappable to integratewise-live) → Spine. Live
connector = Gmail, flowing through the schema-first pipeline
(Connector → Schema Delta → Normalize → Govern (memory.propose→approve, HITL) → Verify).

**Why:** Most views were ported from a generic Vercel CRM template and carried fiction
presented as the real backend/architecture — "Supabase DB", "HubSpot CRM", "Redis Cache",
"DeepSeek", a "Website ↔ HubSpot sync", and a data-sources page listing ~9 sources as if
all live. That mixed/fictional framing made the app feel like an unfinished demo of
someone else's stack, which the user explicitly rejected ("every surface should speak
Customer Zero only; no mixed/weird feel").

**How to apply:**
- Re-voice page titles, subtitles, section headers, empty states, badges to the internal-ops
  voice. Static architecture/stack diagrams must reflect the real model above, not invent.
- CRITICAL distinction — do NOT over-strip: the Integrations catalog (integrations-view) and
  the "available to connect" list legitimately name third-party services (HubSpot, Slack,
  etc.). Listing connectable connectors is correct. The problem is only fiction shown as the
  *live backend/architecture* in other views. Mark what is actually live (Gmail) honestly and
  the rest as available — never pretend.
- Scope when delegating this: copy/markup/className inside artifacts/integratewise/src/components/**
  ONLY. Do NOT touch data-fetching/hooks, src/platform/**, src/spine/**, src/lib/**, lib/**, or
  api-server. Many views still read a Supabase STUB for data — that is intentional tech debt; leave
  the data layer alone, fix presentation only. data-flow-view.tsx is the reference for correct voice.
- A focused GENERAL subagent with a tight, grounded brief is safer here than an open-ended DESIGN
  subagent — the latter previously timed out mid-edit and left broken files. Always end with
  `pnpm --filter @workspace/integratewise exec tsc --noEmit` (exit 0) and screenshot-verify the
  rewritten routes yourself (subagents cannot preview/test).
