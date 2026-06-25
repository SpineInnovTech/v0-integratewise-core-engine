# Contributing to Continuity Bridge

Thank you for contributing to Continuity Bridge. This guide outlines our practices for code quality, Cloud-first architecture, and tenant isolation.

## Core Principles

### 1. Cloud-First, No Local State

**All data and logs go to Cloudflare.** There is no local file storage, no persistent agent state, and no client-side caching beyond temporary request context.

**Do:**
- Write audit logs to `audit_logs` table
- Store tenant data in D1 (edge) or Fortress (SSOT)
- Use KV for ephemeral caches (queues, sessions, temporary state)

**Don't:**
- Write to local filesystem (`fs` module)
- Store state in memory across requests
- Use SQLite connections for anything other than migrations
- Keep agent logs longer than request lifetime

### 2. Per-Tenant Isolation

**Every query must filter by `tenant_id`.** Data leaks across tenants are security violations.

**Template:**
```typescript
// ✅ CORRECT
const data = await spine.db.query(
  `SELECT * FROM entities WHERE tenant_id = ? AND entity_type = ?`,
  [tenantId, type]
);

// ❌ WRONG — cross-tenant leak
const data = await spine.db.query(
  `SELECT * FROM entities WHERE entity_type = ?`,
  [type]
);
```

### 3. Audit Every Action

**Every material action must be logged.** "Material" means: reads from external systems, data writes, approvals, errors, policy decisions.

**Pattern:**
```typescript
try {
  // Do work
  const result = await connector.sync(tenantId);
  
  // Log success
  await spine.db.execute(
    `INSERT INTO audit_logs (tenant_id, actor_id, action, metadata, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [tenantId, actorId, 'connector.sync', JSON.stringify({ result }), new Date().toISOString()]
  );
} catch (err) {
  // Log error (fail loud)
  await spine.db.execute(
    `INSERT INTO audit_logs (tenant_id, actor_id, action, metadata, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [tenantId, actorId, 'connector.sync.error', JSON.stringify({ error: err.message }), new Date().toISOString()]
  );
  throw err;
}
```

### 4. No Secrets in Code

**All secrets go in Cloudflare bindings or environment variables.**

**Do:**
```typescript
const NANGO_SECRET = env.NANGO_SECRET_KEY; // From wrangler.toml binding
const VAULT_KEY = env.VAULT_ENCRYPTION_KEY; // From CF env vars
```

**Don't:**
```typescript
const API_KEY = "sk_live_1234567890"; // ❌ Hardcoded
const token = `Bearer ${secrets.token}`; // ❌ Committed to git
```

### 5. Borrowed Code Must Be Attributed

**If you adapt code from external sources**, always document:
- The source repository URL
- The license (MIT, Apache 2.0, etc.)
- What you changed and why

**Pattern:**
```typescript
/**
 * Based on: https://github.com/example/library (MIT License)
 * Adapted for: Tenant isolation, Cloud-first architecture, per-entity error handling
 */
export function processEntity(entity: Entity): Result {
  // ...
}
```

---

## Development Workflow

### 1. Set Up

```bash
git clone https://github.com/NirmalPrinceJ/integratewise-live
cd integratewise-live
pnpm install
```

### 2. Branch Naming

Use semantic branch names:
- `feat/description` — new feature
- `fix/description` — bug fix
- `docs/description` — documentation
- `chore/description` — maintenance
- `refactor/description` — code cleanup

### 3. Commit Message

Write clear, structured commits:

```
feat: add approval gate for risky actions

- Implement governance.checkPolicy() check in act service
- Add policy evaluation to approval workflow
- Log all policy decisions to governance_audit_log
- Fail loud if policy check unavailable (no silent bypass)

Closes #42
```

### 4. Code Review Checklist

Before submitting a PR, verify:

- [ ] **Tenant isolation:** Every query has `WHERE tenant_id = ?`
- [ ] **Audit logging:** All material actions are logged
- [ ] **No secrets:** No hardcoded API keys or credentials
- [ ] **Type safety:** `pnpm typecheck` passes (0 errors)
- [ ] **Attribution:** Any borrowed code is documented with source + license
- [ ] **Tests pass:** `pnpm test` succeeds
- [ ] **No console errors in production:** Only audit logs

### 5. Testing

Before pushing:

```bash
pnpm typecheck       # TypeScript validation
pnpm lint            # Code style
pnpm test            # Run tests
pnpm preflight       # Full check
```

---

## Common Patterns

### Logging an Action

```typescript
// Service: act/src/index.ts
export async function executeAction(tenantId: string, proposalId: string, actorId: string): Promise<void> {
  const proposal = await getProposal(tenantId, proposalId);
  
  try {
    // Execute action via connector
    const result = await connector.invoke(proposal.action);
    
    // Log success
    await logAudit(tenantId, actorId, 'action.execute', {
      proposalId,
      action: proposal.action,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // Log error
    await logAudit(tenantId, actorId, 'action.execute.error', {
      proposalId,
      error: err.message,
      timestamp: new Date().toISOString()
    });
    throw err;
  }
}
```

### Querying Tenant Data

```typescript
// Services should use spine client
import { spine } from '@integratewise/spine-client';

const entities = await spine.query(tenantId, {
  entity_type: 'lead',
  filters: { status: 'qualified' },
  limit: 100
});
```

### Per-Tenant Encryption

```typescript
// Free users get vault-encrypted storage
if (plan === 'free') {
  const encrypted = await vault.encrypt(entityData, env.VAULT_KEY);
  await spine.db.execute(
    `INSERT INTO entities (tenant_id, entity_type, data_encrypted) VALUES (?, ?, ?)`,
    [tenantId, 'private_entity', encrypted]
  );
}
```

---

## Architecture Decisions

### Should I Write Directly to D1 or Queue to Pipeline?

**Direct write (fast path):** Use for immediate, non-normalizing operations.
- Auth decisions
- Approval gates
- Session reads
- Tenant queries

**Queue to pipeline (standard path):** Use for external data, transformations, and audit.
- Connector sync results
- Webhook ingress from tools
- Data normalization
- Memory consolidation

### Where Should Logging Happen?

**Always log at the point of action.** Each service responsible for its own audit trail.

- `act` logs execution
- `govern` logs approval decisions
- `intelligence` logs reasoning sessions
- `connector` logs sync events
- `gateway` logs API access

### When to Fail Loud vs. Graceful Degradation?

**Fail loud (throw):** Security, governance, audit writes.
- If audit log write fails → throw (don't proceed)
- If approval gate unavailable → throw (don't auto-approve)
- If tenant isolation check fails → throw (data leak prevention)

**Graceful degradation:** Performance, optional features.
- If Twin reasoning unavailable → return entities without AI insights
- If optional KV cache misses → recompute (don't throw)
- If secondary data source offline → use primary

---

## Reporting Issues

### Security Vulnerabilities

**Do NOT file a public issue.** Email security@integratewise.ai with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

### Bugs & Feature Requests

Use GitHub issues with:
- Clear title
- Reproduction steps (or feature description)
- Expected vs. actual behavior
- Relevant logs (audit trail if applicable)

---

## Code of Conduct

- Be respectful and inclusive
- No harassment, discrimination, or hostility
- Report violations to founders@integratewise.ai

---

## Questions?

- **Architecture:** See `docs/architecture/`
- **Operations:** See `docs/operations/`
- **API:** See `REGISTRY.md`
- **Platform:** See `README.md`

Welcome aboard! 🚀
