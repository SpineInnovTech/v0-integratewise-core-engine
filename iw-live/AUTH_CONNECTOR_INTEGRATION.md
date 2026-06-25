# Auth ↔ Connector Integration Guide

## IntegrateWise - Continuity Bridge: Complete Flow

The authentication system is seamlessly integrated with the One Connector to create a unified ecosystem experience.

### Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER JOURNEY: From Identity to Ecosystem Connection             │
└─────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION (Identity)
   └─→ User logs in via Clerk or Supabase
   └─→ Auth provider confirms identity
   └─→ Session/JWT issued

2. AUTHORIZATION (Permissions)
   └─→ Check user role (admin/user)
   └─→ Load permission scope
   └─→ Determine connector access level
   └─→ Create authorization context

3. APPROVAL (Confirmation)
   └─→ Modal shows user information
   └─→ Display granted permissions
   └─→ List connected services
   └─→ User approves connection
   └─→ Generate connector approval token

4. CONNECTION (Integration)
   └─→ Initialize One Connector
   └─→ Connect to Spine API
   └─→ Initialize MCP pool bridges
   └─→ Send heartbeat to Spine
   └─→ Services become available

5. OPERATION (Usage)
   └─→ Application code uses getConnector()
   └─→ Services route through One Connector
   └─→ Health monitoring via Spine
   └─→ All 4 provider layers functional
```

## Implementation

### 1. Connector Approval Service

**File:** `lib/auth/connector-approval.ts` (304 lines)

Core functions:
- `getAuthorizationContext()` - Get user's authorization level
- `requestConnectorApproval()` - Request ecosystem connection approval
- `connectToEcosystem()` - Establish One Connector connection
- `initializeConnectorWithAuth()` - Full flow orchestration

```typescript
// Full initialization
const result = await initializeConnectorWithAuth()
if (result.success) {
  // User is authenticated, authorized, and connected
  // All ecosystem services available
}
```

### 2. Connector Approval Modal

**File:** `components/auth/connector-approval-modal.tsx` (200 lines)

Shows user:
- Their identity information
- Granted permissions
- Connected services
- Security notice

User can:
- Approve connection
- Cancel/dismiss

### 3. Connector Approval Hook

**File:** `lib/auth/use-connector-approval.ts` (203 lines)

Manages entire flow:
```typescript
const {
  showModal,      // Modal visibility
  loading,        // Operation in progress
  context,        // User authorization context
  approval,       // Connector approval response
  error,          // Error message
  isConnected,    // Connection status
  approve,        // Function to approve
  dismiss,        // Function to dismiss modal
} = useConnectorApproval()
```

### 4. Auth Connector Provider

**File:** `components/auth/auth-connector-provider.tsx` (60 lines)

Wrapper component that:
- Checks connector status on mount
- Shows approval modal when needed
- Handles full flow automatically
- Wraps entire application

## Usage

### Setup in Root Layout

```typescript
// app/layout.tsx
import { AuthConnectorProvider } from '@/components/auth/auth-connector-provider'
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <ClerkProvider>
          <AuthConnectorProvider>
            {children}
          </AuthConnectorProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
```

### Automatic Flow

1. User visits app
2. Clerk provider handles authentication
3. AuthConnectorProvider checks status
4. If user not connected to ecosystem:
   - Shows approval modal
   - User approves
   - One Connector initializes
   - Modal closes
   - User has full ecosystem access

### Manual Control

```typescript
// In any component
import { useConnectorApproval } from '@/lib/auth/use-connector-approval'

function MyComponent() {
  const { isConnected, approve, disconnect } = useConnectorApproval()

  if (!isConnected) {
    return <p>Not connected to ecosystem</p>
  }

  return (
    <div>
      <p>Connected to ecosystem!</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  )
}
```

## Authorization Context

```typescript
interface ConnectorAuthorizationContext {
  userId: string
  tenantId: string
  email: string
  name: string
  isAdmin: boolean
  permissions: string[]
  hasConnectorAccess: boolean
}
```

### Default Permissions

**Regular Users:**
- `connector:read` - Read connector status
- `connector:execute` - Execute through connector
- `auth:access` - Access auth service
- `database:read` - Read database

**Administrators:**
- All regular user permissions +
- `connector:admin` - Full connector control
- `auth:admin` - Full auth control
- `database:write` - Write to database
- `ai:execute` - Execute AI services
- `agent:execute` - Execute agents

## Approval Flow

```typescript
interface ConnectorApprovalResponse {
  approved: boolean
  connectorId: string
  connectedAt: number
  expiresAt: number            // 24 hours
  permissions: string[]
  error?: string
}
```

- Connector ID: Unique identifier for this connection
- Connected At: Timestamp when connection established
- Expires At: When approval expires (24 hours by default)
- Permissions: Scoped permissions for this session

## Storage

Connection context stored in:
- **SessionStorage**: `connector_context`
- **Cleared on**: Logout, disconnect, window close

```typescript
// Structure
{
  userId: string
  tenantId: string
  connectorId: string
  connectedAt: number
  expiresAt: number
  permissions: string[]
}
```

## Lifecycle

### On Login
1. Auth provider authenticates user
2. AuthConnectorProvider detects authenticated user
3. Checks if connector already connected
4. If not connected, shows approval modal

### On Approval
1. User reviews information
2. Clicks "Approve & Connect"
3. System:
   - Generates connector ID
   - Initializes One Connector
   - Connects to Spine API
   - Stores connection context
   - Closes modal

### On Use
1. Application calls `getConnector()`
2. Returns same connector instance (singleton)
3. All services route through connector
4. Spine monitors health
5. Heartbeat sent every 30 seconds

### On Logout
1. Auth provider signs out user
2. AuthConnectorProvider detects logout
3. Clears connector context
4. Disconnects from ecosystem
5. User must re-authenticate and approve on next login

## Security

### Token Management
- Connector approval includes `expiresAt` (24 hours)
- Session storage cleared on tab close
- Service role keys never exposed to client
- Only necessary permissions scoped

### Spine Integration
- All connections authenticated with Spine API key
- Heartbeat validates connection health
- Signals can revoke connector at any time
- Tenant isolation enforced

### MCP Bridges
- Each service has its own credentials
- Never shared across connectors
- Per-service rate limiting
- Audit trail for all operations

## Troubleshooting

### Modal Not Showing
1. Check if user is authenticated
2. Verify `AuthConnectorProvider` is in layout
3. Check browser console for errors

### Approval Fails
1. Check Spine API connectivity
2. Verify user has connector access permission
3. Check MCP pool status

### Services Not Working After Connection
1. Verify connector is connected: `useConnector().getStatus()`
2. Check individual service health
3. Verify environment variables are set

## Environment Variables

```bash
# Required for Spine integration
SPINE_URL=https://spine.integratewise.ai
SPINE_API_KEY=...

# Required for MCP pool
MCP_URL=https://mcp.integratewise.ai
MCP_TOKEN=...

# Tenant info
INTEGRATEWISE_TENANT_ID=integratewise
INTEGRATEWISE_CLIENT_ID=app-frontend

# Auth provider (Clerk or Supabase)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
# OR
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Testing

### Test Both Auth Providers

```typescript
// Test with Clerk
NEXT_PUBLIC_AUTH_PROVIDER=clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

// Test with Supabase
NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
```

### Test Approval Flow

1. **Start fresh:**
   - Open incognito window
   - Clear session storage
   - Verify no connector context

2. **Login:**
   - Click login
   - Authenticate with provider
   - Should redirect back

3. **Approval Modal:**
   - Should automatically appear
   - Verify user info is correct
   - Verify permissions list

4. **Approve:**
   - Click "Approve & Connect"
   - Should show connecting state
   - Modal should close
   - All services should be available

5. **Refresh:**
   - Reload page
   - Modal should NOT appear (already connected)
   - Services should still work

6. **Logout:**
   - Click logout
   - Connection context cleared
   - Session storage empty
   - Modal should appear on next login

## API Reference

### getAuthorizationContext()
Returns user's authorization level and permissions

```typescript
const context = await getAuthorizationContext()
```

### requestConnectorApproval(context)
Request approval for connector connection

```typescript
const approval = await requestConnectorApproval(context)
```

### connectToEcosystem(context, approval)
Establish One Connector connection

```typescript
const connected = await connectToEcosystem(context, approval)
```

### initializeConnectorWithAuth()
Execute full flow (recommended)

```typescript
const result = await initializeConnectorWithAuth()
if (result.success) {
  // Connected
}
```

### useConnectorApproval()
React hook for managing approval flow

```typescript
const {
  showModal,
  context,
  isConnected,
  approve,
  dismiss,
  disconnect,
} = useConnectorApproval()
```

## Summary

**IntegrateWise - Continuity Bridge** creates a seamless path from authentication to full ecosystem access:

1. **Identity** - Know who the user is
2. **Authorization** - Know what they can do
3. **Approval** - User confirms connection
4. **Connection** - One Connector initialized
5. **Operation** - Full ecosystem access

All handled automatically through the `AuthConnectorProvider` wrapper with user-friendly approval modal.

**Result: Single identity. Complete ecosystem. Infinite integration.**
