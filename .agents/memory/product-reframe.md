---
name: Customer Zero reframe → whole product front-end
description: This repo now builds the entire IntegrateWise product UI, not just internal ops — supersedes the replit.md framing
---

The active directive: `artifacts/integratewise` builds the COMPLETE front-end for the
ENTIRE IntegrateWise product — the universal/projection UI over the live Cloudflare
platform gateway — NOT just internal "Customer Zero" ops. The UI is the only go-live
blocker and is the agent's sole responsibility.

**Conflict to flag (do not silently rewrite):** `replit.md` still says "Customer Zero
is the internal ops surface, not a customer-facing product" and lists it under user
preferences. That framing is SUPERSEDED by this directive. Because it lives in the
user-preferences section, surface the contradiction to the user and offer to update it
rather than rewriting unilaterally.

**Doctrine (hard rules):**
- Never show fake data as real.
- Live-read at open; no stale caches masquerading as fresh.
- Honest states everywhere: watching / not-connected / entitlement-off / preview.
- The Twin is grounded + drafts-only — it never mutates or auto-executes; a human runs every action.
- Governance gates all writes.
