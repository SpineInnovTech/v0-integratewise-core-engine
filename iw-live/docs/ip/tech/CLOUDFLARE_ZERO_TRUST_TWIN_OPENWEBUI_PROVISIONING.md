# IntegrateWise — Cloudflare Zero Trust → Twin/OpenWebUI Provisioning

> ⚠️ **SUPERSEDED (v3.7, June 12 2026) — see AGENTS.md DECISION 22.**
> The product Twin is **NOT** OpenWebUI/Agent Zero on a VPS. The Twin runs **entirely in Cloudflare**
> (`services/iw-agent-runtime` — Cloudflare Agents SDK: TwinAgent + TenantBrainDO + TwinSessionDO).
> No OpenWebUI, no Hostinger/VPS, no Supabase in the product. This doc is retained for historical
> context on the Zero Trust identity flow only; ignore the OpenWebUI/Agent-Zero/Hostinger runtime parts.
> Canonical: `docs/architecture/USER_SYSTEM_JOURNEY_BLUEPRINT.md` + `AGENTS.md` (DECISION 22) + `CLAUDE.md`.

> **Date:** 2026-06-09
> **Status:** SUPERSEDED (was "Canonical")
> **Scope:** User provisioning, session handoff, and trusted identity flow for L3 Twin / OpenWebUI
> **Architecture:** Cloudflare Zero Trust already implemented
> **Auth Authority:** Cloudflare Access + Gateway D1 JWT
> **Runtime Authority:** IW Continuity Bridge
> **Twin Surface:** ~~Open WebUI + Agent Zero~~ → Cloudflare-native (iw-agent-runtime)
> **Rule:** OpenWebUI is not the identity authority. It is a trusted downstream runtime.

---

## 1. Executive Decision

Because Cloudflare Zero Trust is already implemented, IntegrateWise does not need OpenWebUI-native signup, password auth, or SCIM as the primary path.

The correct provisioning model is:

```
Cloudflare Access proves who the user is.
Gateway + D1 prove what the user can access.
Continuity Bridge provides what the Twin should know.
OpenWebUI provides where the user thinks.
```

Therefore, OpenWebUI provisioning should be treated as:

```
edge-authenticated runtime session injection
```

not:

```
standalone user registration
```

---

## 2. Canonical Flow

```
User
  │
  ▼
Cloudflare Access
  - Google / GitHub SSO
  - Zero Trust policy
  - Access JWT
  │
  ▼
Gateway
  - validates CF Access identity
  - resolves D1 user
  - resolves tenant
  - resolves role / department / plan
  - resolves awareness profile
  - issues Gateway JWT
  - creates Twin launch session
  │
  ▼
IW Continuity Bridge
  - stores context key
  - hydrates Entity 360
  - controls Spine / Memory / Signals access
  │
  ▼
OpenWebUI / Agent Zero
  - receives trusted user identity
  - receives continuity session pointer
  - loads context through Bridge
  - proposes, reasons, briefs
  - never becomes source of truth
```

---

## 3. Identity Ownership

| Concern                   | Owner                       |
| ------------------------- | --------------------------- |
| Human authentication      | Cloudflare Access           |
| Application authorization | Gateway + D1                |
| Tenant membership         | D1 tenant_users             |
| Department / role         | D1                          |
| Awareness profile         | D1 / KV                     |
| Twin continuity session   | Gateway + Continuity Bridge |
| Runtime chat UI           | OpenWebUI                   |
| Operational truth         | D1 spine_vault              |
| Memory                    | D1 + R2 + AI Search         |
| External agent access     | MCP, separately gated       |

---

## 4. Provisioning Is Just-in-Time

A user is provisioned when Cloudflare proves identity and the Gateway sees them.

Provisioning states:

```
identity_seen
  → d1_user_created
  → tenant_bound
  → awareness_profile_assigned
  → twin_entitlement_checked
  → continuity_session_created
  → openwebui_runtime_user_ready
```

OpenWebUI user records are only runtime convenience records. They are not the product identity layer.

---

## 5. Primary Pattern: Trusted Header + Signed Launch Session

### Why this is the right model

Since Twin is behind Cloudflare Zero Trust, IntegrateWise can safely pass identity downstream only after the request crosses the Cloudflare/Gateway boundary.

OpenWebUI should receive a trusted identity envelope such as:

```
X-User-Email
X-User-Name
X-IW-User-ID
X-IW-Tenant-ID
X-IW-Role
X-IW-Department
X-IW-Groups
X-IW-Continuity-Session
X-IW-Context-Key
X-IW-Launch-JWT
```

Only the Gateway or trusted reverse proxy may inject these headers.
Browsers must never be allowed to provide these headers directly.

---

## 6. Cloudflare Access Input Headers

Gateway should consume Cloudflare Access identity from:

```
Cf-Access-Authenticated-User-Email
Cf-Access-Jwt-Assertion
```

The Gateway must validate:

```
Access JWT signature
Access JWT audience
Access JWT issuer expiration
email claim
```

Then Gateway maps the identity into IntegrateWise's internal model.

---

## 7. Gateway → Internal Identity Model

Canonical internal identity object:

```typescript
export interface IWResolvedUser {
  userId: string;
  email: string;
  displayName: string;

  tenantId: string;
  tenantSlug?: string;

  role: "founder" | "admin" | "manager" | "member" | "viewer";
  department:
    | "founder"
    | "bizops"
    | "account-success"
    | "sales"
    | "marketing"
    | "finance"
    | "engineering"
    | "hr"
    | "legal"
    | "security"
    | "partnerships"
    | "personal";

  plan: "free" | "starter" | "pro" | "enterprise";

  awarenessProfileId: string;
  signalThreshold: number;

  groups: string[];

  status: "active" | "invited" | "disabled";
}
```

---

## 8. Twin Launch Contract

L2 should never send trusted user or tenant data from the browser.

The browser may request Twin like this:

```typescript
export interface TwinLaunchRequest {
  source: "l2" | "l1" | "l4";
  domain: string;

  entityId?: string;
  entityType?: string;
  entityName?: string;

  insightId?: string;
  insightTitle?: string;

  returnUrl?: string;
}
```

The Gateway enriches it server-side into:

```typescript
export interface TwinLaunchSession {
  sessionId: string;
  contextKey: string;

  userId: string;
  email: string;
  tenantId: string;

  role: string;
  department: string;
  groups: string[];

  source: "l1" | "l2" | "l3" | "l4";
  domain: string;

  entityId?: string;
  entityType?: string;
  entityName?: string;

  insightId?: string;
  insightTitle?: string;

  createdAt: string;
  expiresAt: string;

  status: "created" | "opened" | "expired" | "revoked";
}
```

The launch session should be short-lived.

Recommended TTL:

```
Launch JWT: 60–180 seconds
Continuity session: 4–8 hours
Context key: 1 hour
```

---

## 9. Launch JWT Claims

Gateway should create a signed one-time Twin launch JWT.

```typescript
export interface TwinLaunchJwtClaims {
  iss: "gateway.dev.integratewise.ai";
  aud: "twin.integratewise.ai";

  sub: string; // IW user id
  email: string;

  tenant_id: string;
  role: string;
  department: string;

  context_key: string;
  continuity_session_id: string;

  jti: string;
  iat: number;
  exp: number;
}
```

Rules:

```
jti must be one-time-use
token must be short-lived
context data must not be embedded directly if large/sensitive
tenant_id must be server-derived
role must be server-derived
department must be server-derived
```

---

## 10. D1 Tables

Minimum D1 tables required for canonical provisioning:

```sql
CREATE TABLE IF NOT EXISTS tenant_users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  awareness_profile_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS awareness_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  signal_threshold REAL NOT NULL,
  signal_entitlements TEXT NOT NULL,
  panel_entitlements TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS twin_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  context_key TEXT NOT NULL,
  source TEXT NOT NULL,
  domain TEXT NOT NULL,
  entity_id TEXT,
  entity_type TEXT,
  entity_name TEXT,
  insight_id TEXT,
  insight_title TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  opened_at TEXT,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS twin_audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL
);
```

---

## 11. KV Keys

Use KV for hot session/context lookup.

```
twin:session:{sessionId}
twin:context:{contextKey}
twin:jti:{launchJwtId}
user:profile:{tenantId}:{email}
awareness:{tenantId}:{profileId}
```

Recommended TTLs:

```
twin:context:*   1 hour
twin:session:*   4–8 hours
twin:jti:*       same as launch JWT expiry
awareness:*      5–15 minutes
```

---

## 12. OpenWebUI Runtime Mode

OpenWebUI should run as a trusted downstream app.

Recommended settings conceptually:

```
disable public signup
disable password-first product flow
enable trusted email/name header mode if supported
default runtime role = user
admin managed separately
```

Canonical headers to OpenWebUI:

```
X-User-Email: nirmal@integratewise.ai
X-User-Name: Nirmal
X-IW-User-ID: usr_xxx
X-IW-Tenant-ID: iw-customer-zero
X-IW-Role: founder
X-IW-Department: bizops
X-IW-Groups: founder,bizops,all-employees
X-IW-Continuity-Session: tws_xxx
X-IW-Context-Key: ctx_xxx
X-IW-Launch-JWT: eyJ...
```

If stock OpenWebUI only consumes email/name headers, that is fine.
Role, tenant, department, and context should be consumed by the IW Continuity Bridge, not by OpenWebUI's native RBAC.

---

## 13. Origin Protection Requirement

Because OpenWebUI runs on Hostinger, the origin must not be directly reachable without Cloudflare.

Acceptable origin protection:

```
Preferred:
  Cloudflare Tunnel from Hostinger to Cloudflare

Also acceptable:
  Cloudflare proxy + Access policy
  origin firewall allows only Cloudflare IP ranges
  authenticated origin pull
  no direct public bypass
```

Critical rule:

```
Trusted headers are safe only if users cannot bypass Cloudflare and hit the origin directly.
```

---

## 14. Twin Handoff Endpoint

Canonical endpoint:

```
POST /v1/twin/handoff
```

Responsibilities:

```
1. Validate Cloudflare Access identity
2. Resolve Gateway/D1 user
3. Validate tenant membership
4. Validate Twin entitlement by plan
5. Resolve department and awareness profile
6. Create context key
7. Create Twin session row
8. Create one-time launch JWT
9. Store context/session in KV
10. Return Twin launch URL
11. Write audit event
```

Response:

```json
{
  "success": true,
  "twinUrl": "https://twin.integratewise.ai/launch?token=...",
  "sessionId": "tws_123",
  "contextKey": "ctx_123",
  "expiresAt": "2026-06-09T12:00:00.000Z"
}
```

---

## 15. Continuity Context Resolution

OpenWebUI / Agent Zero should not directly query D1.

The Twin should call the Continuity Bridge:

```
POST /v1/continuity/session/resolve
```

With:

```json
{
  "contextKey": "ctx_123",
  "sessionId": "tws_123"
}
```

The Continuity Bridge returns:

```json
{
  "entity360": {},
  "signals": [],
  "memory": [],
  "permissions": {},
  "availableTools": ["spine.entity.get", "spine.entity.search", "memory.search", "proposal.create"]
}
```

---

## 16. Approval Boundary

The Twin may reason and propose.
The Twin must not be the final approval authority.

Canonical rule:

```
U3 Reason happens in Twin.
U4 Decide happens in Governance / L2 approval surface.
U5 Act happens only after policy or human approval.
```

Therefore:

```
OpenWebUI chat is not the audit trail.
OpenWebUI approval buttons are not canonical unless they write through Governance.
All decisions must write to D1 governance/audit tables.
```

---

## 17. L2 → L3 Behavior

When L2 awareness drawer shows a signal:

```
User clicks: Open Twin ↗
```

The frontend sends only contextual hints:

```json
{
  "source": "l2",
  "domain": "sales",
  "entityId": "ent_acme",
  "entityType": "opportunity",
  "entityName": "Acme Corp",
  "insightTitle": "Deal stalled 21 days"
}
```

The Gateway derives:

```
user
tenant
role
department
plan
awareness profile
permissions
```

Never trust these from browser input.

---

## 18. User Provisioning Rules

### Existing active user

```
CF Access identity found
D1 tenant_user active
Twin entitlement valid
Create session
Open Twin
```

### New user

```
CF Access identity found
No tenant_user found
Create edge user
Create or attach tenant
Set onboarding_required = true
Assign default awareness profile
Route to L0 onboarding
Do not open Twin until entitlement allows it
```

### Disabled user

```
CF Access may prove identity
D1 status = disabled
Gateway denies
No Twin session created
Audit event written
```

### Free-plan user

```
Can access L0/L1
No Twin unless plan allows
Return upgrade/entitlement response
```

---

## 19. Awareness Profile Mapping

Default profile thresholds:

```
Founder  → 0.65
Manager  → 0.75
Member   → 0.85
Viewer   → 0.95
```

Example profile:

```json
{
  "role": "manager",
  "department": "account-success",
  "signalThreshold": 0.75,
  "signalEntitlements": ["renewal_risk", "health_drop", "escalation", "engagement_drop"],
  "panelEntitlements": ["spine", "context"]
}
```

---

## 20. Security Controls

Required controls:

```
Strip all inbound X-User-* and X-IW-* headers from public requests.
Inject trusted headers only after CF Access validation.
Validate Access JWT at Gateway.
Use one-time launch JWT.
Store jti to prevent replay.
Keep tenant_id server-derived.
Keep role server-derived.
Keep raw context out of query strings.
Use contextKey instead of full payload in URL.
Require service auth between Twin and Continuity Bridge.
Audit every handoff.
Audit every proposal.
Audit every approval.
Audit every act.
```

Forbidden:

```
OpenWebUI as primary auth
Supabase auth
browser-provided tenant_id
browser-provided role
OpenWebUI direct D1 access
OpenWebUI direct source-tool access
Nango token exposure to Twin
approval only in chat
public Hostinger origin bypassing Cloudflare
```

---

## 21. SCIM Position

SCIM is not required for the current architecture.

Use SCIM later only for enterprise lifecycle automation:

```
Okta
Azure AD
Google Workspace
enterprise provisioning
automatic deprovisioning
group sync
```

Primary path remains:

```
Cloudflare Access → Gateway D1 identity → Continuity session → OpenWebUI runtime
```

---

## 22. MCP Position

The Twin should use:

```
continuity-tool-server → pipeline → Spine
```

External agents should use:

```
mcp.integratewise.ai
```

MCP is the external door.
The Bridge is the product runtime.

Therefore:

```
OpenWebUI / Agent Zero should not be treated as an external MCP client by default.
It is inside the Bridge experience.
```

---

## 23. Rollout Plan

### P0 — Required

```
1. Lock OpenWebUI behind Cloudflare Access.
2. Prevent direct Hostinger origin bypass.
3. Add /v1/twin/handoff to Gateway.
4. Add twin_sessions table.
5. Add twin_audit_events table.
6. Add KV context/session keys.
7. Generate one-time launch JWT.
8. Inject trusted user headers to OpenWebUI.
9. Make Twin resolve context through Continuity Bridge.
10. Disable OpenWebUI public signup/password path.
```

### P1 — Operational

```
1. Add awareness profile resolution.
2. Add plan/tier Twin entitlement checks.
3. Add proposal.create from Twin.
4. Route approval to Governance Workbench.
5. Add audit trail UI.
6. Add session revocation.
7. Add disabled-user denial test.
```

### P2 — Enterprise

```
1. Add SCIM only for enterprise tenants.
2. Add custom domain Twin routing.
3. Add per-tenant encryption keys.
4. Add enterprise group sync.
5. Add admin lifecycle dashboard.
```

---

## 24. Definition of Done

Provisioning is complete when:

```
A Cloudflare-authenticated active user can open Twin with no OpenWebUI login.
A disabled D1 user cannot open Twin even if Cloudflare authenticates them.
A free-plan user cannot open Twin unless entitled.
A replayed launch token fails.
A browser-spoofed X-IW-Tenant-ID is ignored or stripped.
OpenWebUI cannot be reached directly outside Cloudflare.
Twin loads Entity 360 only through Continuity Bridge.
Twin can propose but not approve.
Governance approval writes to D1 audit trail.
No source tool credentials are exposed to OpenWebUI.
No Supabase auth is involved.
```

---

## 25. Final Canonical Statement

```
Cloudflare Zero Trust is the identity membrane.
Gateway is the authorization brain.
D1 is the edge identity and Spine substrate.
Continuity Bridge is the runtime access path.
OpenWebUI is the Twin surface.

Provisioning is not account creation inside OpenWebUI.
Provisioning is continuity session creation after Cloudflare and Gateway trust are established.

The user does not log into Twin.
The user is carried into Twin by the Bridge.
```

---

## Final System Architecture

> **Status:** Canonical
> **Date:** 2026-06-09
> **Architecture Principle:** One Twin. One Spine. One Memory. One Bridge.
> **Auth:** Cloudflare Zero Trust + Gateway D1 JWT
> **Product:** IW Continuity Bridge
> **Runtime Surface:** OpenWebUI + Agent Zero
> **Operational Truth:** Cloudflare D1 spine_vault
> **External Agent Door:** MCP
> **Tool Token Vault:** Nango
> **Supabase:** No auth. Usage-allocated fortress storage only for promoted tenants.

### Final One-Line Architecture

```
Tools → Nango → Connector Sync/Webhooks → Loader → Normalizer → Cloudflare Spine
→ Signals + Memory + Intelligence → IW Continuity Bridge → L1/L2/L3/L4 Surfaces
→ Human Approves → Act → Tools → Spine Updates Again
```

The system never starts cold because every session, signal, decision, and memory loops back into the Spine and Memory substrate.

### System Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER SURFACES                                  │
│                                                                             │
│  L0 Onboarding                                                              │
│  L1 Workspace: BI Hub / Account Success / Ops Board / Personal / Work       │
│  L2 Awareness Drawer: signals, context, HITL approval surface               │
│  L3 Twin: OpenWebUI + Agent Zero + Grok + Voice                             │
│  L4 Library: Coda / Knowledge / Memory / Playbooks                          │
│                                                                             │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      IW CONTINUITY BRIDGE                                   │
│                                                                             │
│  Runtime path for Twin                                                       │
│                                                                             │
│  OpenWebUI / Agent Zero                                                      │
│      → continuity-tool-server                                                │
│      → Gateway                                                               │
│      → Pipeline / Intelligence / Knowledge                                   │
│      → Spine + Memory + Signals                                              │
│                                                                             │
│  The Bridge is the product experience.                                       │
│  MCP is only the external agent door.                                        │
│                                                                             │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE EDGE                                     │
│                                                                             │
│  Cloudflare Zero Trust                                                       │
│  Gateway                                                                     │
│  D1 JWT                                                                      │
│  Workers                                                                     │
│  Queues                                                                      │
│  KV                                                                          │
│  R2                                                                          │
│  Vectorize / AI Search                                                       │
│  D1 spine_vault                                                              │
│                                                                             │
│  Cloudflare is the edge substrate.                                           │
│  D1 spine_vault is the operational Spine.                                    │
│                                                                             │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL TOOLS                                      │
│                                                                             │
│  HubSpot / Salesforce / Jira / Stripe / Slack / Gmail / Drive / GitHub      │
│  Intercom / Linear / Notion / ERP / Calendar / Documents                    │
│                                                                             │
│  Tool identity dies at the Normalizer.                                      │
│  Spine stores canonical truth, not source labels.                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hard Rules

```
1. Cloudflare Zero Trust is the identity membrane.
2. Gateway is the authorization brain.
3. D1 spine_vault is operational truth.
4. Pipeline is the only Spine writer.
5. Normalizer erases source identity.
6. Nango owns tool credentials.
7. Twin reads through Continuity Bridge.
8. MCP is for external agents.
9. L2 is an awareness service, not a page.
10. Twin proposes; Governance decides; Act executes.
11. Chat is not the audit trail.
12. Coda is projection, not truth.
13. Supabase is not auth.
14. Supabase is not default.
15. Every query is tenant-scoped.
16. No surface reads source tools directly.
17. No agent gets raw source credentials.
18. Every action loops back through Spine.
19. Every useful learning can become Memory.
20. The system never starts cold.
```

### Final Architecture Statement

```
IntegrateWise is an edge-native continuity system.

Cloudflare provides the identity membrane, routing layer, compute substrate,
queues, cache, encrypted operational store, and semantic memory infrastructure.

The Spine is the canonical D1 operational truth.
The Pipeline is the only writer to that truth.
The Normalizer turns every tool into one source-agnostic model.
Nango protects all external credentials.
The Intelligence layer turns state changes into signals and proposals.
L2 manifests only entitled awareness.
L3 Twin reasons through the IW Continuity Bridge.
L4 projects governed organizational memory.
MCP lets external agents reach the same Spine without becoming the runtime path.

The user buys the IW Continuity Bridge: the guarantee that their AI, dashboards,
agents, memory, and tools all share one continuous context.

Connect once. Normalize once. Render anywhere.
Reason continuously. Approve deliberately. Act safely. Remember forever.
```

---

## 26. Implementation Status (2026-06-09)

This section maps the **canonical target** (sections 1–25) to what is **live in code and ops today**.

### 26.1 Identity & Auth

| Component                        | Target                                    | Live today                             | Gap                                   |
| -------------------------------- | ----------------------------------------- | -------------------------------------- | ------------------------------------- |
| Cloudflare Access SSO            | Primary identity membrane                 | ✅ Implemented (Google + GitHub)       | —                                     |
| Gateway CF JWT verification      | Validates `Cf-Access-Jwt-Assertion`       | ✅ `services/gateway/src/index.ts`     | —                                     |
| Gateway D1 JWT + `x-tenant-id`   | App session for L0–L2                     | ✅ Live                                | —                                     |
| OpenWebUI trusted headers        | `WEBUI_AUTH_TRUSTED_*` from gateway/proxy | ❌ Not in VPS compose                  | Add when Twin is CF-fronted           |
| OpenWebUI public signup disabled | No standalone Twin login                  | ⚠️ Partial — OWUI has local auth today | Lock when trusted-header path is live |
| SCIM 2.0                         | Enterprise lifecycle only                 | ❌ Not configured                      | P2 — optional                         |

### 26.2 L2 → L3 Handoff (Continuity, not account creation)

| Component                                     | Target                           | Live today                                                         | Gap                                            |
| --------------------------------------------- | -------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| `POST /v1/twin/handoff` (Gateway)             | Server-side session + launch JWT | ❌ Not implemented                                                 | **P0** — see §14                               |
| `twin_sessions` / `twin_audit_events` (D1)    | Session + audit trail            | ❌ Tables not migrated                                             | **P0**                                         |
| KV `twin:context:*` / `twin:session:*`        | Hot context lookup               | ❌ Not wired for Twin launch                                       | **P0**                                         |
| Client handoff (`twin-owui-handoff.ts`)       | Browser opens Twin with context  | ✅ Live                                                            | Interim path — query params + `sessionStorage` |
| `IW_HANDOFF:` envelope in prompt              | L1/L2 context in first message   | ✅ `iw-l1-handoff-inlet.py` filter on VPS                          |
| `TwinInsightsSurface` → `openTwinWorkbench()` | L2 "Open Twin ↗"                 | ✅ `apps/web/src/components/l2/insights/twin-insights-surface.tsx` |
| Server-derived tenant/role in handoff         | Never trust browser              | ❌ Client passes entity hints only today                           | Gateway handoff closes this                    |

**Interim handoff (live):**

```
L1/L2 click "Open Twin"
  → writeTwinHandoffContext() (sessionStorage)
  → buildTwinOwuiUrl() with iw_context, iw_prompt, iw_domain, iw_source
  → window.open("https://twin.integratewise.ai?...")
  → OWUI inlet filter parses IW_HANDOFF: from first user message
  → continuity-tool-server reads Spine/Memory via pipeline
```

**Target handoff (canonical):**

```
L1/L2 POST /v1/twin/handoff { entityId, domain, source }  (hints only)
  → Gateway validates CF Access + D1 user + plan entitlement
  → Creates twin_sessions row + KV context key + one-time launch JWT
  → Returns twinUrl with token (60–180s TTL)
  → User lands on CF-protected Twin; proxy injects X-IW-* headers
  → Continuity Bridge resolves contextKey → Entity 360
```

### 26.3 L3 Runtime (Hostinger VPS)

| Component                          | Target                        | Live today                                                   | Gap                                        |
| ---------------------------------- | ----------------------------- | ------------------------------------------------------------ | ------------------------------------------ |
| `twin.integratewise.ai`            | Primary L3 surface            | ✅ Traefik + OWUI (`integratewise-ops/vps-operations-stack`) | —                                          |
| `twin.operations.integratewise.ai` | Ops-branded first-win Twin    | ❌ DNS/route not provisioned                                 | See CONTINUITY_BRIDGE_DEPLOYMENT_STATUS §8 |
| `continuity-tool-server`           | Bridge read path to pipeline  | ✅ Container in openwebui compose                            | Extend for `session/resolve`               |
| `agentzero-tool-server`            | Multi-step execution          | ✅ Container live                                            | —                                          |
| LiteLLM + Ollama fallback          | Local models when cloud fails | ✅ `iw-ollama` + LiteLLM                                     | —                                          |
| CF Tunnel / origin lock            | No direct Hostinger bypass    | ⚠️ Traefik on host :443                                      | Prefer CF Tunnel or origin firewall        |
| Infisical secrets wire             | Runtime env from vault        | ⚠️ Deployed, not wired to stack                              | `infisical-wire-stack.sh`                  |

### 26.4 L2 Cognitive Layer (from `l2.zip` contract)

| L2 surface                                | Maps to S-series        | OWUI / Bridge role                       | Status               |
| ----------------------------------------- | ----------------------- | ---------------------------------------- | -------------------- |
| Spine panel                               | S2 Awareness / evidence | `spine.entity.get` via continuity        | ✅ Partial in drawer |
| Context panel                             | S2 / think substrate    | Entity 360 assembly                      | ✅ Live              |
| LiveSignalsStrip                          | S2 / U2 Notice          | Signal cards in L1 shell                 | ✅ Live              |
| HITL / PendingApprovals                   | S2 / **U4 Decide**      | Governance workbench — **not** OWUI chat | ✅ Live in L2        |
| TwinInsightsSurface                       | S2 digest → S3 handoff  | `openTwinWorkbench()`                    | ✅ Live              |
| Domain happy path (Today/Queue/Decisions) | S2 per-domain           | Routes in workbench                      | ✅ Live              |
| SlidingPanel / cognitive triggers         | S2 overlay              | `cognitive-triggers.tsx`                 | ⚠️ Partial triggers  |

### 26.5 Code References

| Artifact                            | Path                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| Client handoff library              | `integratewise-live/apps/web/src/lib/twin-owui-handoff.ts`                         |
| L2 Twin insights + Open Twin button | `integratewise-live/apps/web/src/components/l2/insights/twin-insights-surface.tsx` |
| OWUI handoff inlet filter           | `integratewise-ops/vps-operations-stack/openwebui/filters/iw-l1-handoff-inlet.py`  |
| VPS Twin compose                    | `integratewise-ops/vps-operations-stack/openwebui/docker-compose.yml`              |
| Continuity tool server              | `integratewise-ops/vps-operations-stack/tool-servers/tool_server.py`               |
| Gateway CF Access verification      | `integratewise-live/services/gateway/src/index.ts`                                 |
| L2 surface contract                 | `integratewise-docs/docs/internal/architecture/l2-twin-surface-contract.md`        |
| MCP / Bridge canon                  | `integratewise-docs/docs/internal/architecture/mcp-continuity-bridge.md`           |

### 26.6 Next implementation sequence

```
P0 (closes provisioning gap)
  1. Add POST /v1/twin/handoff to Gateway (§14 request/response)
  2. Migrate twin_sessions + twin_audit_events (§10)
  3. Wire KV context keys (§11)
  4. Put Twin origin behind Cloudflare Access (§13)
  5. Add WEBUI_AUTH_TRUSTED_* to openwebui/docker-compose.yml when CF proxy injects headers

P1 (continuity hardening)
  6. POST /v1/continuity/session/resolve from continuity worker (§15)
  7. Plan-tier Twin entitlement check in handoff (§18)
  8. Switch openTwinWorkbench() to call Gateway handoff instead of direct URL

P2 (enterprise)
  9. SCIM for Okta/Azure AD lifecycle (§21)
  10. twin.operations.integratewise.ai branded route
```
