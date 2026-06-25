# Spine Connection Pool Architecture

## The Problem: Independent Connections

**Without connection pooling:**
```
Claude establishes 100 connections
  ├─ System A, System B, System C, ... (100 systems)

GPT establishes 100 connections  
  ├─ System A, System B, System C, ... (100 systems)

Groq establishes 100 connections
  ├─ System A, System B, System C, ... (100 systems)

TOTAL: 300 connections, duplicate overhead, credential management nightmare
```

## The Solution: Shared Connection Pool via Spine

**With connection pooling (the shared connector pattern):**
```
Claude establishes core connection to Spine (1 connection)
  └─ Gets access to 100 systems through Spine broker

GPT queries Spine for available tools (0 new connections)
  └─ Uses Claude's connections via Spine proxy

Groq queries Spine for available tools (0 new connections)
  └─ Uses Claude's connections via Spine proxy

TOTAL: 1 core connection + Spine-mediated indirect access
```

## Architecture

### Three Tiers

```
┌──────────────────────────────────────────────────────────────────┐
│ AI PROVIDERS (Claude, GPT, Groq)                                 │
│ • No direct connections needed                                   │
│ • Query Spine for tools (tool probing)                          │
│ • Execute through Spine (secure proxy)                          │
│ • Full access to all connected systems                          │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│ SPINE CONNECTION POOL (Connection Broker)                        │
│ • Manages core connections (who connected to what)              │
│ • Manages indirect accesses (who can access what)               │
│ • Handles tool probing requests                                 │
│ • Proxies secure data access                                    │
│ • Enforces security policies                                    │
│ • Maintains audit logs                                          │
└──────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│ EXTERNAL SYSTEMS (GitHub, Figma, Notion, Supabase, etc.)        │
│ • Connected by first provider (e.g., Claude)                    │
│ • Reused by other providers via Spine                           │
│ • No knowledge of multiple providers                            │
│ • Only communicates with Spine                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Concepts

### 1. Core Connection

A direct connection established by an AI provider to a system. Only created once, then shared.

```typescript
// Claude establishes core connection
const claudeConnector = new AIProviderConnector({
  provider: 'claude',
  connectorId: 'claude-main-1',
  credentialId: 'cred-github-123', // GitHub API token
  systemId: 'github',
  spineUrl: 'https://spine.api.com',
  spineApiKey: 'key-xxx',
})

// Register core connection to 100 systems
await claudeConnector.registerCoreConnection('github', 'cred-github-123')
await claudeConnector.registerCoreConnection('figma', 'cred-figma-456')
await claudeConnector.registerCoreConnection('notion', 'cred-notion-789')
// ... 97 more systems
```

**Spine stores:**
```typescript
ConnectionPoolEntry {
  systemId: 'github',
  connectorId: 'claude-main-1',
  provider: 'claude',
  connectedAt: 1699564800000,
  credentials: {
    credentialId: 'cred-github-123',
    encryptionKey: '...' // Never expose raw credential
  },
  isActive: true,
}
```

### 2. Indirect Access

When another provider (GPT, Groq) requests access to a system already connected by Claude.
No new connection needed - Spine validates and proxies.

```typescript
// GPT requests indirect access to GitHub
const gptConnector = new AIProviderConnector({
  provider: 'gpt',
  connectorId: 'gpt-main-1',
  // ... same config
})

// Request indirect access to GitHub (connected by Claude)
await gptConnector.requestIndirectAccess(
  'claude',        // Provider who connected to GitHub
  'github',        // System ID
  'read',          // Access level
  3600             // TTL: 1 hour
)

// Spine stores:
IndirectTenantAccess {
  provider: 'gpt',
  systemId: 'github',
  accessLevel: 'read',
  grantedBy: 'claude-main-1',
  expiresAt: 1699568400000,
  permissions: ['read', 'probe']
}
```

### 3. Tool Probing

Discover available tools without direct connections. Queries Spine, which returns tool definitions from connected systems.

```typescript
// GPT discovers tools in GitHub (via Spine)
const tools = await gptConnector.discoverTools({
  category: 'repository',
  capability: 'list'
})

// Spine queries: "Which tools does GitHub have?"
// Returns:
[
  {
    id: 'list-repos',
    name: 'List Repositories',
    description: 'List repositories accessible to authenticated user',
    category: 'repository',
    capabilities: ['list', 'filter', 'search'],
    accessLevel: 'read',
    // ... tool schema
  },
  // ... more tools
]
```

### 4. Secure Data Access

Execute tools securely through Spine. All requests validated and logged.

```typescript
// GPT executes tool through Spine
const result = await gptConnector.executeTool(
  'github',           // systemId
  'list-repos',       // toolId
  { sort: 'updated' } // input data
)

// Spine:
// 1. Validates: Can GPT access GitHub? (check indirect access)
// 2. Validates: Is 'list-repos' callable? (check permissions)
// 3. Retrieves: GitHub credential from secure storage
// 4. Executes: Calls GitHub API with credential
// 5. Returns: Result to GPT
// 6. Logs: Request for audit trail
```

## Flow Diagrams

### Initial Setup (Claude connects to 100 systems)

```
Claude Connector
    ↓
registerCoreConnection(github, cred-xxx)
    ↓
Spine Connection Pool
    ├─ Store: claude → github (credential ID)
    ├─ Notify Spine API
    └─ Return: entry + pool status
```

### Indirect Access (GPT accesses GitHub without new connection)

```
GPT Connector
    ↓
requestIndirectAccess('claude', 'github', 'read')
    ↓
Spine Connection Pool
    ├─ Verify: Claude connected to GitHub? YES
    ├─ Store: gpt → github (read access)
    ├─ TTL: 1 hour
    └─ Return: access grant
```

### Tool Discovery (Groq finds tools without connection)

```
Groq Connector
    ↓
discoverTools({ category: 'repository' })
    ↓
Tool Discovery Service
    ├─ Get systems Groq can access
    ├─ For each system:
    │   └─ Query Spine: listTools(systemId)
    └─ Return: aggregated tools
    ↓
Spine Connection Pool
    ├─ Check: Groq has indirect access? YES
    ├─ Query: GitHub tools
    └─ Return: tool definitions
```

### Secure Execution (GPT executes tool through Spine)

```
GPT Connector
    ↓
executeTool('github', 'list-repos', { sort: 'updated' })
    ↓
Tool Discovery Service
    ↓
Spine Connection Pool
    ├─ Validate: GPT → GitHub access? (check indirect grant)
    ├─ Validate: 'list-repos' permissions? (check tool ACL)
    ├─ Get: GitHub credential (encrypted)
    ├─ Execute: Call GitHub API
    ├─ Log: Audit record
    └─ Return: Result + audit log
```

## Implementation

### Files Created

**Core Pool Management (459 lines):**
- `lib/spine/connection-pool.ts`
  - `SpineConnectionPool` class
  - Core connection registration
  - Indirect access granting
  - Tool probing interface
  - Secure data access proxy

**Tool Discovery (340 lines):**
- `lib/spine/tool-discovery.ts`
  - `ToolDiscoveryService` class
  - Tool discovery without connections
  - Access validation
  - Statistics and monitoring

**AI Provider Adapter (269 lines):**
- `lib/ai/provider-connector.ts`
  - `AIProviderConnector` class
  - Wrapper for Claude, GPT, Groq
  - Core connection registration
  - Indirect access requests
  - Tool execution interface

### Usage Example: Complete Flow

```typescript
import { createAIProviderConnector } from '@/lib/ai/provider-connector'

// ============ PHASE 1: CLAUDE CONNECTS ============

const claudeConfig = {
  provider: 'claude',
  connectorId: 'claude-1',
  credentialId: 'claude-key',
  spineUrl: 'https://spine.api.com',
  spineApiKey: 'spine-key',
  systemId: 'integratewise',
}

const claudeConnector = createAIProviderConnector(claudeConfig)

// Register core connections to 100 systems
const systems = [
  'github', 'figma', 'notion', 'supabase', 'cloudflare',
  // ... 95 more
]

for (const systemId of systems) {
  const credentialId = `cred-${systemId}-${Date.now()}`
  await claudeConnector.registerCoreConnection(systemId, credentialId)
}

console.log('Claude connected to 100 systems via Spine')

// ============ PHASE 2: GPT REQUESTS INDIRECT ACCESS ============

const gptConfig = {
  provider: 'gpt',
  connectorId: 'gpt-1',
  credentialId: 'gpt-key',
  spineUrl: 'https://spine.api.com',
  spineApiKey: 'spine-key',
  systemId: 'integratewise',
}

const gptConnector = createAIProviderConnector(gptConfig)

// Request indirect access to systems Claude connected to
for (const systemId of systems) {
  await gptConnector.requestIndirectAccess('claude', systemId, 'read')
}

console.log('GPT granted indirect access to 100 systems (no new connections)')

// ============ PHASE 3: GROQ REQUESTS INDIRECT ACCESS ============

const groqConfig = {
  provider: 'groq',
  connectorId: 'groq-1',
  credentialId: 'groq-key',
  spineUrl: 'https://spine.api.com',
  spineApiKey: 'spine-key',
  systemId: 'integratewise',
}

const groqConnector = createAIProviderConnector(groqConfig)

// Request indirect access to systems Claude connected to
for (const systemId of systems) {
  await groqConnector.requestIndirectAccess('claude', systemId, 'read')
}

console.log('Groq granted indirect access to 100 systems (no new connections)')

// ============ PHASE 4: ALL PROVIDERS USE SHARED POOL ============

// Claude discovers tools
const claudeTools = await claudeConnector.discoverTools({
  category: 'repository',
})

// GPT discovers same tools (no new connection!)
const gptTools = await gptConnector.discoverTools({
  category: 'repository',
})

// Groq discovers same tools (no new connection!)
const groqTools = await groqConnector.discoverTools({
  category: 'repository',
})

// All providers execute through Spine
const claudeRepos = await claudeConnector.executeTool(
  'github',
  'list-repos',
  { sort: 'stars' }
)

const gptRepos = await gptConnector.executeTool(
  'github',
  'list-repos',
  { sort: 'updated' }
)

const groqRepos = await groqConnector.executeTool(
  'github',
  'list-repos',
  { sort: 'forks' }
)

// ============ PHASE 5: POOL STATISTICS ============

const claudeStatus = await claudeConnector.getPoolStatus()
// {
//   provider: 'claude',
//   connectorId: 'claude-1',
//   connectedSystems: 100,
//   accessStats: {
//     provider: 'claude',
//     accessibleSystems: 100,
//     accessibleTools: 1250,
//     permissions: ['read', 'write', 'execute']
//   }
// }

const gptStatus = await gptConnector.getPoolStatus()
// {
//   provider: 'gpt',
//   connectorId: 'gpt-1',
//   connectedSystems: 100,
//   accessStats: {
//     provider: 'gpt',
//     accessibleSystems: 100,
//     accessibleTools: 1250,
//     permissions: ['read']  // Only read access
//   }
// }
```

## Benefits

### Reduced Overhead
- **Before**: 300 connections (100 × 3 providers)
- **After**: ~100 connections (1 core + shared access)
- **Savings**: 66% connection reduction

### Simplified Credential Management
- Store credentials once in Spine
- Never expose to client code
- Encrypt with unique keys per connection
- Audit all access

### Flexible Access Control
- Grant different access levels per provider
- Time-limited indirect access (TTL)
- Per-system permission scoping
- Audit trail for compliance

### Provider Independence
- External systems don't know about multiple providers
- Claude's connection invisible to GPT/Groq
- Providers can't leak each other's credentials
- Data flows through Spine validation

### Efficient Resource Usage
- Reuse established connections
- Lazy initialization of indirect access
- Connection pooling at Spine level
- Automatic cleanup of expired access

### Security
- No credentials in client code
- Encryption keys per connection
- Access validation on every request
- Audit logging for compliance
- Rate limiting at Spine level

## Security Model

### Credential Isolation

```
Spine Secure Storage:
┌─ System: GitHub
│  ├─ Credential: cred-github-123 (encrypted)
│  ├─ Encryption Key: key-xxx-yyy (isolated)
│  ├─ Connected By: claude-main-1
│  └─ Access Grants:
│     ├─ gpt-main-1: read access, expires 1h
│     └─ groq-main-1: read access, expires 1h

Access Request Flow:
1. GPT: "I want to call list-repos on GitHub"
2. Spine: "Do you have indirect access?" YES ✓
3. Spine: "Is this tool callable?" YES ✓
4. Spine: "Retrieve credential" → cred-github-123
5. Spine: "Execute with credential"
6. Spine: "Log audit entry"
7. Spine: "Return result to GPT"

GPT never sees credential ✓
```

### Access Control Matrix

```
Provider  | GitHub | Figma | Notion | AWS   | Stripe
----------|--------|-------|--------|-------|--------
Claude    | RWE    | RWE   | RWE    | RWE   | RWE
GPT       | R      | R     | R      | R     | R
Groq      | R      | R     | R      | R     | R
```

R = Read, W = Write, E = Execute

## Monitoring

### Pool Statistics

```typescript
// Get pool status
const status = await claudeConnector.getPoolStatus()
// {
//   provider: 'claude',
//   connectorId: 'claude-main-1',
//   connectedSystems: 100,
//   accessStats: {
//     provider: 'claude',
//     accessibleSystems: 100,
//     accessibleTools: 1250,
//     permissions: ['read', 'write', 'execute']
//   }
// }
```

### Audit Logging

```typescript
// Each access is logged
SecureDataAccessResponse {
  success: true,
  data: { /* result */ },
  auditLog: {
    requestId: 'req-123',
    provider: 'gpt',
    toolId: 'list-repos',
    timestamp: 1699568400000,
    status: 'approved'
  }
}
```

## Deployment

### Environment Variables

```bash
SPINE_URL=https://spine.api.com
SPINE_API_KEY=...
INTEGRATEWISE_SYSTEM_ID=integratewise
```

### Configuration

```typescript
const config = {
  spineUrl: process.env.SPINE_URL,
  spineApiKey: process.env.SPINE_API_KEY,
  systemId: process.env.INTEGRATEWISE_SYSTEM_ID,
}
```

## Summary

**Spine Connection Pool** implements the **shared connector pattern**:

✓ One AI provider establishes core connections (100 systems)
✓ Other providers access via Spine (no new connections)
✓ Tool discovery via Spine (not direct)
✓ Secure data access via Spine (proxied, encrypted)
✓ Audit logging for compliance
✓ Access control per provider and system

**Result:**
- 66% reduction in connections
- Centralized credential management
- Flexible access control
- Complete audit trail
- Production-ready shared pool

---

*Pattern: Shared Connector Pool via Spine*
*Benefit: One connection to 100 systems shared by 3+ providers*
*Outcome: Efficient, secure, scalable ecosystem access*
