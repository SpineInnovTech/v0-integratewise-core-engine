---
name: Duplicate React from the FRONTEND workspace member
description: Why vite artifacts can crash with ReactCurrentDispatcher, and the fix
---

# Duplicate React landmine (FRONTEND pins react@18)

`FRONTEND/` (the iwa-frontend customer product, a workspace member) pins
`react`/`react-dom` to 18.3.1. That copy lands in the shared pnpm store and can
leak into a vite artifact's dependency optimizer even when that artifact's own
graph resolves react 19.x — producing two React copies at runtime and a
`Cannot read properties of ... ReactCurrentDispatcher` / "invalid hook call"
crash (often first seen in `react/jsx-dev-runtime`).

**Why:** the artifact's local `node_modules/react` is correct (19.x), but vite's
optimizer / module resolution can still pick the hoisted 18.3.1 copy for the JSX
runtime. Installing any new React-adjacent dep re-triggers the linking that
surfaces it.

**How to apply:** for any vite artifact in this repo, force a single React via
`resolve.alias` to the artifact-local copy (plus `resolve.dedupe`):
`react -> <artifact>/node_modules/react`, `react-dom -> <artifact>/node_modules/react-dom`.
Don't assume `dedupe` alone is enough — the optimizer scan needs the alias.
If a broader fix is ever wanted, align FRONTEND's react to the catalog or exclude
it from the workspace, but that is a shared-workspace change with wider blast radius.
