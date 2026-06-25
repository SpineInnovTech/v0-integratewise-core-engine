# Twin Browser Execution Architecture

**Date:** 2026-06-09
**Status:** Design Proposal
**Integration:** Twin Orchestrator + Playwright MCP + Browser Automation Worker

---

## Overview

The Twin cognitive orchestrator needs to execute actions via browser automation in addition to API-based execution. This enables the Twin to:

1. **Interact with web interfaces without APIs** (legacy tools, admin panels, etc.)
2. **Perform complex multi-step web workflows** (form filling, data extraction, verification)
3. **Execute in environments where API access is restricted** (internal tools, authenticated portals)
4. **Verify execution outcomes visually** (screenshots, DOM inspection)
5. **Handle human-in-the-loop approvals** (approve in UI, Twin executes in browser)

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Twin Orchestrator (Cognitive Layer)                         │
│ - Observes system state                                     │
│ - Reasons via OpenRouter Agents                             │
│ - Proposes actions (API or Browser)                         │
│ - Coordinates execution                                     │
└──────────────┬──────────────────────────────────────────────┘
               │
         ┌─────┴─────┐
         │           │
         ▼           ▼
┌────────────┐  ┌────────────────────┐
│ Act Worker │  │ Browser Agent      │
│ (API exec) │  │ (Browser exec)     │
└────────────┘  └──────────┬─────────┘
                           │
                     ┌─────┴─────┐
                     │           │
                     ▼           ▼
            ┌────────────┐  ┌──────────────┐
            │ Playwright │  │ Puppeteer    │
            │ MCP Server │  │ (CF Browser) │
            └────────────┘  └──────────────┘
```

---

## Execution Decision Matrix

| Scenario                                 | Method      | Reason                        |
| ---------------------------------------- | ----------- | ----------------------------- |
| Create HubSpot contact                   | **API**     | Fast, reliable, structured    |
| Update Jira ticket                       | **API**     | Fast, reliable, structured    |
| Fill out complex web form                | **Browser** | No API, multi-step validation |
| Extract data from legacy admin panel     | **Browser** | No API, auth session required |
| Verify email was sent (in Gmail UI)      | **Browser** | Visual verification needed    |
| Approve workflow in custom internal tool | **Browser** | No API available              |
| Multi-step wizard with dynamic fields    | **Browser** | API too complex/unavailable   |
| Screenshot for audit trail               | **Browser** | Visual evidence required      |

**Decision Logic:**

1. **Prefer API** if available and sufficient
2. **Use Browser** if:
   - No API exists
   - API is too complex (multi-step wizard, dynamic fields)
   - Visual verification required
   - Authentication only works in browser session
   - Human-in-the-loop approval flow requires browser context

---

## Implementation Options

### Option 1: Playwright MCP (Local Development)

**Status:** Already configured in `.vscode/mcp.json`

**Pros:**

- Already available via MCP
- AI agents (Claude, Kiro) can call Playwright tools directly
- Rich debugging (screenshots, traces, videos)
- Good for development/testing

**Cons:**

- Runs on developer machine (not production)
- Not accessible to Twin Orchestrator worker (edge runtime)
- Session state management complex

**Use Case:** Development, testing, manual Twin interactions via IDE

---

### Option 2: Cloudflare Browser Rendering API

**Status:** Available (Cloudflare Workers can launch browsers)

**Architecture:**

```typescript
// services/browser-agent/src/index.ts
import { Fetcher } from "@cloudflare/workers-types";

export interface Env {
  BROWSER: Fetcher; // Cloudflare Browser binding
  D1: D1Database;
  CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { action, url, steps } = await request.json();

    // Launch browser via CF
    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();

    try {
      await page.goto(url);

      // Execute steps
      for (const step of steps) {
        switch (step.type) {
          case "click":
            await page.click(step.selector);
            break;
          case "type":
            await page.type(step.selector, step.value);
            break;
          case "screenshot":
            const screenshot = await page.screenshot();
            // Store in R2
            break;
          case "extract":
            const data = await page.evaluate(step.extractor);
            break;
        }
      }

      return Response.json({ success: true, data });
    } finally {
      await browser.close();
    }
  },
};
```

**Pros:**

- Runs at edge (close to Twin Orchestrator)
- Scalable (Cloudflare handles browser instances)
- No local infrastructure needed
- Session state manageable (KV/Durable Objects)

**Cons:**

- Limited to Puppeteer (no Playwright)
- Resource limits (CPU time, memory)
- Cost per execution

**Use Case:** Production browser automation for Twin

---

### Option 3: VPS Browser Agent (Self-Hosted)

**Status:** Can deploy alongside LiteLLM/Twin UI on VPS

**Architecture:**

```
VPS (187.127.166.105)
├─ Docker: Open WebUI (Twin UI)
├─ Docker: LiteLLM
├─ Docker: Playwright/Puppeteer Agent  ← NEW
└─ Cloudflare Tunnel → browser-agent.operations.integratewise.ai
```

**Implementation:**

```typescript
// integratewise-ops/vps-operations-stack/browser-agent/
import { chromium } from "playwright";

const app = express();

app.post("/v1/browser/execute", async (req, res) => {
  const { action, url, steps, sessionId } = req.body;

  // Reuse browser context for session
  const context = await getOrCreateContext(sessionId);
  const page = await context.newPage();

  try {
    await page.goto(url);
    const results = await executeSteps(page, steps);

    res.json({ success: true, results });
  } finally {
    if (!req.body.keepSession) {
      await page.close();
    }
  }
});
```

**Pros:**

- Full Playwright support (better than Puppeteer)
- No resource limits (VPS control)
- Session persistence (cookies, auth state)
- Can run long-running automation
- Easy debugging (VNC, remote debug)

**Cons:**

- Single point of failure (1 VPS)
- Manual scaling
- Network latency (VPS → web targets)

**Use Case:** Complex, long-running automations; session-heavy workflows

---

### Option 4: Hybrid (Recommended)

**Architecture:**

```
Twin Orchestrator
    │
    ├─→ API Actions → Act Worker → APIs
    │
    ├─→ Quick Browser Actions → CF Browser Worker (Puppeteer)
    │
    └─→ Complex Browser Actions → VPS Browser Agent (Playwright)
```

**Decision Logic:**

- **Act Worker (API):** Structured API calls (HubSpot, Jira, etc.)
- **CF Browser Worker:** Quick browser actions (<10s, simple workflows)
- **VPS Browser Agent:** Complex browser automation (sessions, multi-step, >10s)

---

## Proposal Structure (Browser Actions)

When Twin generates a browser-based proposal:

```typescript
interface BrowserActionProposal {
  tenant_id: string;
  action_type: "browser_execute";
  target: {
    url: string;
    method: "cf_browser" | "vps_playwright" | "mcp_local"; // Routing
    session_required: boolean;
    estimated_duration_ms: number;
  };
  steps: Array<{
    type: "navigate" | "click" | "type" | "select" | "wait" | "extract" | "screenshot";
    selector?: string;
    value?: string;
    timeout_ms?: number;
    description: string; // For human approval
  }>;
  verification: {
    method: "screenshot" | "dom_check" | "api_callback";
    expected?: any;
  };
  reasoning: string; // Why browser is needed vs API
  confidence: number;
  risk: "low" | "medium" | "high"; // Browser actions are higher risk
}
```

**Example:**

```json
{
  "tenant_id": "iw-customer-zero",
  "action_type": "browser_execute",
  "target": {
    "url": "https://internal-tool.company.com/admin/users",
    "method": "vps_playwright",
    "session_required": true,
    "estimated_duration_ms": 8000
  },
  "steps": [
    {
      "type": "navigate",
      "description": "Navigate to user admin panel"
    },
    {
      "type": "click",
      "selector": "#add-user-btn",
      "description": "Click 'Add User' button"
    },
    {
      "type": "type",
      "selector": "#email-input",
      "value": "newuser@example.com",
      "description": "Enter user email"
    },
    {
      "type": "select",
      "selector": "#role-dropdown",
      "value": "admin",
      "description": "Select admin role"
    },
    {
      "type": "click",
      "selector": "#submit-btn",
      "description": "Submit form"
    },
    {
      "type": "wait",
      "selector": ".success-message",
      "timeout_ms": 3000,
      "description": "Wait for success confirmation"
    },
    {
      "type": "screenshot",
      "description": "Capture success state for audit"
    }
  ],
  "verification": {
    "method": "screenshot",
    "expected": { "contains": "User created successfully" }
  },
  "reasoning": "Internal tool has no API; browser automation required for user provisioning",
  "confidence": 0.75,
  "risk": "medium"
}
```

---

## Twin Orchestrator Integration

### Step 1: Reasoning (Twin Observes → Decides)

```typescript
// In reasonAboutContext() — Twin determines execution method
const reasoning: Reasoning = {
  suggested_actions: [
    {
      type: "provision_user_in_internal_tool",
      target: "internal-admin-panel",
      method: "browser", // ← Twin decides browser is needed
      reasoning: "Tool has no API; requires browser automation",
      impact: "high",
      risk: "medium",
      urgency: "high",
    },
  ],
};
```

### Step 2: Proposal Generation

```typescript
// In generateProposals() — Twin creates browser action proposal
const proposal = {
  tenant_id,
  type: "browser_execute",
  action_type: "provision_user",
  target: {
    url: "https://internal-tool.company.com/admin/users",
    method: "vps_playwright" // Route to VPS for session support
  },
  steps: [...], // Browser steps
  requires_approval: true, // Browser actions always require approval
  risk: "medium"
};

// Submit to Governance
await env.MCP_CONNECTOR.fetch(
  new Request("http://internal/v1/proposals/create", {
    method: "POST",
    body: JSON.stringify(proposal)
  })
);
```

### Step 3: Approval (HITL)

Human reviews:

- **What:** "Provision user in internal admin panel"
- **Why:** "Tool has no API; browser automation required"
- **Steps:** List of browser actions (click, type, etc.)
- **Risk:** Medium (browser can have side effects)
- **Screenshot preview:** (optional) Show what UI will be interacted with

### Step 4: Execution Coordination

```typescript
// In coordinateApprovedActions() — Twin dispatches browser execution
async function coordinateApprovedActions(env: Env, tenantId: string) {
  const approved = await fetchApprovedProposals(env, tenantId);

  for (const proposal of approved) {
    if (proposal.action_type === "browser_execute") {
      // Route to browser agent based on method
      const agentUrl =
        proposal.target.method === "vps_playwright"
          ? "https://browser-agent.operations.integratewise.ai/v1/execute"
          : "https://browser-agent.connect-a1b.workers.dev/v1/execute";

      const response = await fetch(agentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-proposal-id": proposal.id,
        },
        body: JSON.stringify({
          url: proposal.target.url,
          steps: proposal.steps,
          verification: proposal.verification,
          sessionId: proposal.session_id, // For session reuse
        }),
      });

      const result = await response.json();

      // Store execution outcome
      await storeExecutionOutcome(env, {
        proposal_id: proposal.id,
        status: result.success ? "completed" : "failed",
        screenshots: result.screenshots, // Store in R2
        extracted_data: result.data,
        error: result.error,
      });
    }
  }
}
```

### Step 5: Outcome Monitoring

```typescript
// In monitorOutcomes() — Twin verifies execution
async function monitorOutcomes(env: Env, tenantId: string) {
  const executions = await fetchRecentExecutions(env, tenantId);

  for (const execution of executions) {
    if (execution.status === "failed") {
      // Twin reasons about failure
      const retry = await reasonAboutFailure(env, execution);

      if (retry.should_retry) {
        // Create new proposal with adjusted steps
        await generateRetryProposal(env, execution, retry.adjustments);
      }
    }
  }
}
```

---

## Implementation Plan

### Phase 1: VPS Browser Agent (Self-Hosted Playwright)

**Goal:** Deploy Playwright agent on VPS for complex browser automation

**Tasks:**

1. Create `integratewise-ops/vps-operations-stack/browser-agent/`
2. Dockerfile with Playwright + dependencies
3. Express API: POST `/v1/execute` (steps, session management)
4. Docker Compose: Add browser-agent service
5. Cloudflare Tunnel: Expose as `browser-agent.operations.integratewise.ai`
6. Session store: Redis/SQLite for browser contexts
7. Screenshot storage: Local filesystem or R2

**Deliverables:**

- `/v1/execute` endpoint (execute browser steps)
- `/v1/sessions` endpoint (create/restore browser sessions)
- `/v1/health` endpoint
- Authentication: X-IW-BROWSER-KEY (in ~/.iw/secrets.env)

---

### Phase 2: CF Browser Worker (Quick Actions)

**Goal:** Deploy Puppeteer worker on CF for quick browser actions

**Tasks:**

1. Create `integratewise-live/services/browser-agent/`
2. Wrangler config with Browser Rendering API binding
3. Puppeteer launch + execute steps
4. Screenshot storage → R2
5. Service binding from Twin Orchestrator

**Deliverables:**

- `browser-agent.dev.integratewise.ai`
- POST `/v1/execute` (simpler than VPS agent)
- Max 10s execution time
- No session persistence

---

### Phase 3: Twin Integration

**Goal:** Wire Twin Orchestrator to browser agents

**Tasks:**

1. Update `reasonAboutContext()`: Decide API vs Browser
2. Update `generateProposals()`: Create browser action proposals
3. Update `coordinateApprovedActions()`: Route to browser agents
4. Update `monitorOutcomes()`: Verify browser execution outcomes
5. Add browser action templates (form fill, data extract, screenshot)

**Deliverables:**

- Twin can reason about browser vs API
- Twin proposes browser actions with steps
- Twin coordinates browser execution after approval
- Twin monitors and retries failed browser actions

---

### Phase 4: MCP Playwright Integration (Optional)

**Goal:** Enable local development/testing via Playwright MCP

**Tasks:**

1. Twin → MCP Playwright tools (via Kiro/Claude)
2. Local browser session management
3. Developer workflow: Test browser actions locally before deploying

**Use Case:** Development only (not production)

---

## Security Considerations

### 1. Approval Required

**ALL browser actions must be approved.** No auto-execution.

Reason: Browser can have unintended side effects (form submissions, account changes, etc.)

### 2. Session Isolation

**Each tenant gets isolated browser context.**

Prevent cross-tenant data leakage via cookies/storage.

### 3. Screenshot Redaction

**Redact sensitive data from screenshots before storage.**

PII, credentials, internal IPs should be masked.

### 4. Audit Trail

**Every browser action logged with:**

- Proposal ID
- Approved by (user ID)
- Executed at (timestamp)
- Steps performed
- Outcome (success/failure)
- Screenshots (if applicable)

### 5. Rate Limiting

**Limit browser executions per tenant:**

- Max 10 concurrent browser sessions
- Max 100 executions per day
- Max 5 retries per failed execution

### 6. Authentication

**Browser agent endpoints require:**

- X-IW-BROWSER-KEY (for VPS agent)
- Service binding auth (for CF worker)
- Tenant ID validation

---

## Cost Estimate

### VPS Browser Agent (Self-Hosted)

- **VPS:** Already running (no additional cost)
- **Playwright:** Free
- **Storage:** Minimal (screenshots, sessions)
- **Total:** ~$0/month (already paying for VPS)

### CF Browser Worker

- **Browser Rendering API:** $0.005 per request
- **Estimated usage:** 1000 executions/month = $5/month
- **Workers compute:** Included in paid plan
- **R2 storage:** <$1/month (screenshots)
- **Total:** ~$6/month

### Combined

- **Total:** ~$6/month for browser automation

---

## Next Steps

1. **Phase 1 (VPS Browser Agent):** Deploy Playwright agent on VPS
2. **Test:** Manual browser action via curl
3. **Phase 2 (CF Browser Worker):** Deploy Puppeteer worker
4. **Test:** Quick browser action via CF
5. **Phase 3 (Twin Integration):** Wire Twin to browser agents
6. **Test:** End-to-end Twin → Proposal → Approval → Browser Execution

---

## Summary

**Twin Browser Execution enables:**

- ✅ Actions in web interfaces without APIs
- ✅ Complex multi-step workflows
- ✅ Visual verification (screenshots)
- ✅ Session-based automation
- ✅ Hybrid API + Browser execution

**Architecture:**

- **VPS Playwright Agent:** Complex, session-heavy automations
- **CF Puppeteer Worker:** Quick, simple browser actions
- **Twin Orchestrator:** Reasons, proposes, coordinates, monitors

**Security:**

- All browser actions require approval
- Session isolation per tenant
- Screenshot redaction
- Full audit trail

**Cost:** ~$6/month (mostly CF Browser Rendering API)

**Ready to implement Phase 1 (VPS Browser Agent)?**
