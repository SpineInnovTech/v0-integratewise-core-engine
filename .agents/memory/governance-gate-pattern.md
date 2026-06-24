---
name: Governance gate pattern
description: How M5 governance gates protect every destructive write; Twin is proposals-only
---

## Doctrine (M5)
Every destructive or state-changing write must go through an explicit human confirmation step. The twin never auto-executes — it proposes, the human runs.

## GovernanceGate component

Located at `artifacts/integratewise/src/platform/governance-gate.tsx`.

```typescript
import { useGovernanceGate, GovernanceGate } from "@/platform/governance-gate";

// Inside the component:
const gate = useGovernanceGate();

// Before a write:
gate.request({
  operation: "Convert to client",       // title shown in dialog
  entity: leadName,                      // subject (lead name, etc.)
  impact: "Creates a Client record...", // what will happen — be specific
  danger: true,                          // turns confirm button destructive-red
  onConfirm: () => mutation.mutate(...), // only called if user clicks Confirm
});

// In the render:
<GovernanceGate gate={gate} />
```

## Currently gated operations
- **Qualify lead** (`handleQualify` in leads-view.tsx) — medium impact, standard confirm
- **Convert lead to client** (`handleConvert` in leads-view.tsx) — high impact, `danger: true`, explicitly warns about irreversibility

## Twin grounding
The twin-chat (`twin-chat.tsx`) has `actions` on messages typed as:
```typescript
actions?: { label: string; type: "approve" | "view" | "link" }[];
```
There are no `useCreate*` / `useMutate` calls anywhere in `twin-ui/`. The twin proposes actions (type `"approve"`) — the human then executes through the normal UI flow, which goes through the governance gate.

**Why:** The doctrine is "Twin grounded + drafts-only; governance gates writes; the human runs every action." The gate is the checkpoint between the twin's proposals and actual data mutation.

**How to apply:** Any new mutation that changes CRM state (status transitions, deletions, irreversible conversions) must be wrapped in `gate.request(...)` before calling `.mutate()`. Additive low-risk writes (creating a note, adding a tag) may skip the gate if they are trivially reversible.
