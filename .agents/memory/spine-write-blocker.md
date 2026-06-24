---
name: Spine memory.propose write blocker (D1) + repo reality
description: Why the only governed write path fails, that it's payload-independent, and why it can't be fixed from this workspace.
---

# memory.propose fails with a payload-independent D1 binding error

The only governed write path, `memory.propose` on the live Spine (`mcp.integratewise.ai`),
fails with `D1_ERROR: Wrong number of parameter bindings for SQL query.`

**Proven payload-INDEPENDENT (live-tested, not assumed):** a minimal, schema-exact call
sending ONLY the 4 required fields (`tenant_id`, `content_type`, `title`, `body`) fails
identically to the full 11-field call. On the SAME minted token + transport,
`proposal.list` and `tools/list` SUCCEED. So the token, the `memory:write` scope, the
tenant, the SSE transport, and the argument shape are all correct — only this one tool's
INSERT is broken. The defect is the platform's SQL (its `?` placeholders vs. bound values),
not anything the relay sends.

**Why it is NOT fixable from this repo:** the SQL that throws runs on the remote platform
server (`integratewise-live`). That server's source is NOT in this workspace. Despite the
"three-repo architecture" doctrine in replit.md, this Replit workspace is physically ONE
pnpm monorepo containing only: the Customer Zero frontend + the api-server RELAY (a *client*
of the platform) + shared lib packages — plus leftover imported copies of old apps
(`FRONTEND` = `@figma/my-make-file`; `temp_apps_web` = `@integratewise/web`;
`.migration-backup` = `my-v0-project`). There is no Cloudflare Worker, no `wrangler`/D1
config, and no MCP-server / `memory.propose` handler in-repo. The relay reaches the platform
purely by `fetch()` to `mcp.integratewise.ai/mcp`.

**How to apply:**
- Do NOT keep re-firing `memory.propose` hoping a different arg shape clears it — it won't.
  The relay already handles it honestly: records the error, no faked success, verification
  reports `not_proposed`, and the local proposal ledger still persists the intent.
- The real fix belongs in the `integratewise-live` repo (align the INSERT's placeholder
  count with its bound values). Re-test occasionally since the remote service evolves, but
  treat a repeated identical D1 error as the platform's bug, not a local one.
- I (the agent) CAN test the wire behavior here (token mint + live network), but I CANNOT
  edit the remote SQL — that distinction matters when reporting status.
