---
name: Customer Zero tenant isolation decision
description: Why Customer Zero must stay on its own tenant (iw-customer-zero), never the integratewise platform tenant.
---

# Keep Customer Zero on its own tenant

**Decision (user directive):** the relay MUST keep `tenant_id = iw-customer-zero`.
Do NOT repoint Customer Zero at the `integratewise` platform tenant — not even to make
the governed write "work sooner." (I had offered to align it to `integratewise` +
`client_id=kiro-iw`; the user explicitly declined.)

**Why:** `integratewise` is the PLATFORM org (registry, shared MCP, shared
skills/models/policies). `iw-customer-zero` is a real OPERATIONAL, customer-shaped tenant
(memory, Spine, research, tasks, signals). Eventually there will be customer-a/b/c
alongside iw-customer-zero. Customer Zero must behave like a real customer tenant so it
serves as the canonical proof that tenant + memory + governance provisioning
(Clerk → tenant created → Schema AI → memory space → MCP registration → Spine hydration)
actually works end-to-end. If it only passes on the special `integratewise` tenant, you've
proven a platform tenant, not a customer tenant.

**How to apply:**
- Leave `SPINE_TENANT_ID` defaulting to `iw-customer-zero`. No code change is needed (the
  relay already uses it).
- Switching tenants would NOT fix the write anyway: the memory.propose D1 binding error is
  caller-independent and reproduces on `integratewise` too (see spine-write-blocker). So a
  tenant switch only muddies the isolation proof for zero benefit.
- Real fix path is platform-side: fix the memory.propose INSERT in `integratewise-live`,
  then verify proposal.create / proposal.list / proposal.approve and the promotion path
  (Proposal → Triage → Approved → Memory, the "Continuity Bridge") end-to-end ON
  `iw-customer-zero`.
