---
name: Spine memory.propose D1 write blocker — ROOT CAUSE FOUND
description: The D1 "Wrong number of parameter bindings" error on memory.propose is a real, located bug in the integratewise-live platform repo (not unfixable). Exact file/line and fix recorded.
---

# memory.propose D1 binding bug — root cause located

`memory.propose` is the ONLY Spine tool that writes the D1 `proposals` table (no
`proposal.create` exists). It fails for EVERY arg shape with
`D1_ERROR: Wrong number of parameter bindings` — payload-independent (fails on a
minimal 4-field call too), while `proposal.list` / `tools/list` / `memory.write_conversational`
(Supabase) / `kb.write_article` (Knowledge Bank) all SUCCEED on the same token. So the
write plane is healthy; only this one INSERT is broken.

**Root cause (CONFIRMED via GitHub read of the platform repo):**
- Repo: `NirmalPrinceJ/integratewise-live` (private). Reachable read/write through the
  workspace's GitHub connection (authed as the owner).
- File: `services/mcp-connector/src/handlers/tools.ts`, function `proposeMemory`.
- The `INSERT INTO proposals (... 19 cols ...) VALUES (...)` clause has **11 `?`
  placeholders** because `evidence_count` is hardcoded as the literal `0`.
- But `.bind(...)` passes **12 values**, including `input.evidence_chain?.length || 0`
  intended for `evidence_count`. 11 placeholders vs 12 binds → the D1 error.
- The sibling `spine-mcp-server.ts` INSERT is balanced (9/9) and is NOT the live path.

**Live path verified:** `index.ts` mounts the MCP server at `POST /` and `/mcp` →
`createMcpServer` (`mcp-server.ts`) whose `case "memory.propose"` calls `proposeMemory`
in `tools.ts`. So the deployed `mcp.integratewise.ai` endpoint runs the buggy function.

**Fix (one change, intent-preserving):** in the `proposeMemory` VALUES clause, change the
`evidence_count` literal `0` to a `?`. That makes 12 placeholders = 12 binds and stores
the real evidence count. (Alternative: drop the `evidence_chain?.length` bind arg — keeps
evidence_count always 0.)

**Deploy caveat:** the live endpoint is a Cloudflare Worker (`wrangler.toml`,
`mcp.integratewise.ai`). A repo fix only takes effect after THEIR Cloudflare deploy — this
workspace has no Cloudflare deploy credential, so we can land the fix (PR) but cannot
deploy it.

**Status:** as of this session, NO change was pushed to the platform repo (user said
"stop there"). The relay already handles the failure honestly (verification reports
not_proposed; no faked success), so nothing in THIS repo needs to change for correctness.
