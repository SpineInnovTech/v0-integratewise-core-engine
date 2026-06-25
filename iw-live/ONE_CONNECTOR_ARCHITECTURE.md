# One Single Connector Architecture

## Vision

**One Single Connector** serving as the unified entry point and central nervous system for the entire IntegrateWise ecosystem. All services, providers, and MCP connections flow through this single connector, connected via the Spine architecture.

```
┌─────────────────────────────────────────────────────────────────┐
│                   ONE SINGLE CONNECTOR                          │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────┐  ┌─────────┐            │
│  │   Auth   │  │ Database │  │  AI  │  │  Agent  │            │
│  │ Service  │  │ Service  │  │Serv. │  │Serv.    │            │
│  └──────────┘  └──────────┘  └──────┘  └─────────┘            │
│        │              │           │          │                 │
│        └──────────────┴───────────┴──────────┘                 │
│                      │                                          │
│              (Factory Pattern)                                  │
│                      │                                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              SPINE (Central Nervous System)             │  │
│  │  • Tenant Management                                    │  │
│  │  • Connection Lifecycle                                │  │
│  │  • Heartbeat & Health Monitoring                       │  │
│  │  • Signal Broadcasting                                 │  │
│  │  • Knowledge Base                                      │  │
│  │  • Memory Management                                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                      │                                          │
│              ┌───────┴───────────────┐                          │
│              │   MCP POOL            │                          │
│              │                       │                          │
│  ┌──────┐┌──────────┐┌───────┐┌────────┐  ┌─────────┐          │
│  │GitHub││Figma   ││Notion││Supabase│  │Cloudfl. │          │
│  └──────┘└──────────┘└───────┘└────────┘  └─────────┘          │
│  ┌────────┐┌──────────┐┌───────────┐┌────────────┐             │
│  │Slack   ││Stripe   ││Firebase   ││AWS Services│             │
│  └────────┘└──────────┘└───────────┘└────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture

### Core Components

#### 1. One Connector (lib/connector/index.ts)
- **Single instance** - Singleton pattern
- **Central hub** - All services route through here
- **Lifecycle management** - Connect, disconnect, heartbeat
- **Health monitoring** - Real-time status tracking
- **MCP bridge management** - Unified interface to all external services

#### 2. Provider Abstractions (4 layers)
```typescript
// All factories return through Connector
const auth = connector.getService('auth')      // Supabase or Clerk
const db = connector.getService('database')    // PostgreSQL or D1
const ai = connector.getService('ai')          // Claude, GPT, or Groq
const agent = connector.getService('agent')    // Vercel AI or LangChain
```

#### 3. Spine Connection
- Registers connector with Spine
- Sends periodic heartbeats
- Reports health status
- Receives commands/signals
- Manages tenant context

#### 4. MCP Pool
- All external services connected via MCP
- GitHub, Figma, Notion, Supabase, Cloudflare
- Slack, Stripe, Firebase, AWS, etc.
- Unified interface for tool access

### Connection Flow

```
Application
    │
    ├─→ useConnector()              (React hook)
    │
    ├─→ getConnector()              (Singleton)
    │
    ├─→ connector.getService()      (Get auth/db/ai/agent)
    │
    ├─→ Service Factory             (Returns provider instance)
    │
    └─→ Provider Implementation     (Actual service)
         │
         ├─→ Spine API              (Health, lifecycle)
         │
         └─→ MCP Bridges            (External services)
```

## Usage

### Basic Setup

```typescript
import { getConnector } from '@/lib/connector'

// Get connector instance (singleton)
const connector = getConnector({
  tenantId: 'integratewise',
  clientId: 'app-frontend',
  environment: 'production',
  spineUrl: 'https://spine.integratewise.ai',
  mcpUrl: 'https://mcp.integratewise.ai',
})

// Connect to Spine and MCP ecosystem
await connector.connect()
```

### In React Components

```typescript
import { useConnector, useConnectorStatus } from '@/lib/connector/hooks'

export function Dashboard() {
  // Get connector instance
  const connector = useConnector()

  // Get connector status
  const { status, isLoading } = useConnectorStatus()

  // Access specific services
  const auth = connector.getService('auth')
  const db = connector.getService('database')
  const ai = connector.getService('ai')

  return (
    <div>
      {isLoading ? (
        <p>Connecting to ecosystem...</p>
      ) : (
        <div>
          <p>Auth: {status?.services.auth.healthy ? '✅' : '❌'}</p>
          <p>Database: {status?.services.database.healthy ? '✅' : '❌'}</p>
          <p>AI: {status?.services.ai.healthy ? '✅' : '❌'}</p>
          <p>Agent: {status?.services.agent.healthy ? '✅' : '❌'}</p>
          <p>Connected MCP Bridges: {status?.mcpBridges}</p>
        </div>
      )}
    </div>
  )
}
```

### Execute Operations

```typescript
// Method 1: Direct service access
const user = await connector.getService('auth').getCurrentUser()

// Method 2: Execute through connector
const user = await connector.execute('auth.getCurrentUser')

// Method 3: In React hook
const execute = useConnectorExecute()
const result = await execute('database.query', 'SELECT * FROM users')
```

### Service Access Hooks

```typescript
// Specific service hooks
const auth = useConnectorAuth()
const db = useConnectorDatabase()
const ai = useConnectorAI()
const agent = useConnectorAgent()

// Or generic service hook
const service = useConnectorService('auth')
```

### Lifecycle Management

```typescript
const { isConnected, connect, disconnect } = useConnectorLifecycle()

// Connect on mount
useEffect(() => {
  connect()
  return () => disconnect()
}, [connect, disconnect])
```

### MCP Bridge Access

```typescript
// List connected MCP bridges
const bridges = connector.listMCPBridges()
// Returns: ['integratewise', 'github', 'figma', 'notion', 'supabase', ...]

// Get specific MCP bridge
const github = connector.getMCPBridge('github')
```

## Status Monitoring

### Health Check Structure

```typescript
interface ConnectorStatus {
  healthy: boolean
  services: {
    auth: { healthy: boolean; provider: string }
    database: { healthy: boolean; provider: string }
    ai: { healthy: boolean; provider: string }
    agent: { healthy: boolean; provider: string }
  }
  mcpBridges: {
    integratewise: {
      knowledge: boolean
      memory: boolean
      spine: boolean
      signals: boolean
      proposals: boolean
      books: boolean
    }
    github: boolean
    figma: boolean
    notion: boolean
    supabase: boolean
    cloudflare: boolean
    slack: boolean
    stripe: boolean
  }
  connectedAt: number
  lastHeartbeat: number
}
```

### Heartbeat Mechanism

- **Interval**: 30 seconds
- **Content**: Full status + timestamp
- **Destination**: Spine API
- **Triggered by**: Service health checks
- **Purpose**: Real-time system monitoring

## Integration with Spine

### Connector Registration

```
POST /spine/api/connector
{
  tenantId: "integratewise",
  clientId: "app-frontend",
  environment: "production",
  timestamp: 1234567890
}
```

### Heartbeat Report

```
POST /spine/api/connector/heartbeat
{
  tenantId: "integratewise",
  clientId: "app-frontend",
  status: { /* full status object */ },
  timestamp: 1234567890
}
```

### Disconnection

```
POST /spine/api/connector/disconnect
{
  tenantId: "integratewise",
  clientId: "app-frontend",
  timestamp: 1234567890
}
```

## MCP Pool Configuration

All MCP servers are configured in `mcp-pool.json`:

- **IntegrateWise Platform** (SSE + Stdio)
  - Knowledge Base, Memory, Spine, Signals, Proposals, Books

- **Development Tools**
  - GitHub, Figma, Notion, Playwright, VS Code

- **Infrastructure**
  - Cloudflare (Workers, Pages, D1, KV, R2)
  - AWS (DynamoDB, S3, SQS, Lambda)
  - Firebase (Realtime DB, Auth, Cloud Functions)

- **Services**
  - Supabase (PostgreSQL, Auth)
  - Stripe (Payments, Subscriptions)
  - Slack (Chat, Workflows)

- **Knowledge**
  - AWS Knowledge Base
  - Cloudflare Docs
  - Context7 (Extended Memory)
  - Hugging Face (Models)

## Environment Configuration

```bash
# Connector Configuration
INTEGRATEWISE_TENANT_ID=integratewise
INTEGRATEWISE_CLIENT_ID=app-frontend
SPINE_URL=https://spine.integratewise.ai
MCP_URL=https://mcp.integratewise.ai
SPINE_API_KEY=...
MCP_TOKEN=...

# Provider Configuration (Auth/DB/AI/Agent)
NEXT_PUBLIC_AUTH_PROVIDER=clerk
NEXT_PUBLIC_DB_PROVIDER=d1
NEXT_PUBLIC_AI_PROVIDER=claude
NEXT_PUBLIC_AGENT_PROVIDER=vercel-ai

# Provider-Specific Keys
CLERK_SECRET_KEY=...
ANTHROPIC_API_KEY=...
# etc.
```

## Benefits

### Single Entry Point
- No scattered imports across codebase
- One place to understand ecosystem
- Easy to add new services

### Unified Lifecycle
- Single connect/disconnect
- Coordinated health checks
- Synchronized heartbeat

### Provider Agnostic
- Swap providers via env vars
- All code works with any provider
- Factory pattern for clean abstraction

### Comprehensive Monitoring
- Real-time health status
- Service availability tracking
- MCP bridge connectivity
- Spine integration status

### Type Safe
- Full TypeScript support
- Autocompletion for all services
- Interface definitions for all operations

## File Structure

```
apps/web/lib/connector/
├── index.ts          (397 lines - OneConnector class)
├── hooks.ts          (170 lines - React hooks)
└── __tests__/
    └── connector.test.ts

ONE_CONNECTOR_ARCHITECTURE.md (this file)
```

## Integration Checklist

- [x] Connector singleton created
- [x] Service factory integration
- [x] Spine connection implemented
- [x] MCP pool bridge initialization
- [x] Health check mechanism
- [x] Heartbeat system
- [x] React hooks for component usage
- [x] Status monitoring
- [x] TypeScript type safety
- [ ] Deployment testing
- [ ] E2E tests
- [ ] Production monitoring

## Next Steps

1. **Deploy to production** - Test with real Spine instance
2. **Add E2E tests** - Verify all 24 provider combinations through connector
3. **Monitor heartbeats** - Track connector health metrics
4. **Expand MCP pool** - Add more service integrations
5. **Implement signal handlers** - Respond to Spine signals
6. **Add metrics** - Track operation latencies per service

## Summary

The **One Single Connector** provides:

✅ **Unified interface** to entire ecosystem
✅ **Central lifecycle** management for all services
✅ **Type-safe** access to all providers (4 layers)
✅ **Real-time monitoring** via Spine integration
✅ **MCP pool access** to 20+ external services
✅ **React hooks** for seamless component integration
✅ **Singleton pattern** for efficient resource management
✅ **Provider agnostic** - switch via environment variables

**Result: One connection. Entire ecosystem. Infinite possibilities.**
