/**
 * Continuity Bridge Type Definitions
 * 
 * Tenant-centric architecture where connections belong to the tenant,
 * not to individual AI providers or applications.
 */

// Tenant Context - the owner of everything
export interface TenantContext {
  tenantId: string
  tenantName: string
  bridgeUrl: string
  spineUrl: string
  adkUrl: string
  createdAt: number
  lastSync: number
}

// OAuth Session - managed by Bridge, reused by all consumers
export interface OAuthSession {
  sessionId: string
  tenantId: string
  applicationId: string
  applicationName: string
  oauthProvider: string
  credentialId: string
  scopes: string[]
  authenticatedAt: number
  expiresAt: number
  status: 'active' | 'expired' | 'revoked'
  isRevoked: boolean
}

// Connected Application - authenticated once for the tenant
export interface ConnectedApplication {
  applicationId: string
  applicationName: string
  oauthSessionId: string
  oauthProvider: string
  connectedAt: number
  lastUsed: number
  isActive: boolean
}

// Tool Definition - discovered capability in connected app
export interface ToolDefinition {
  applicationId: string
  toolId: string
  toolName: string
  description: string
  category: string
  discoveredAt: number
  accessLevel: 'read' | 'write' | 'execute'
}

// Schema Definition - input/output structure for tools
export interface SchemaDefinition {
  inputSchema: Record<string, unknown>
  outputSchema: Record<string, unknown>
}

// Endpoint Registry - how to reach the tool
export interface EndpointDefinition {
  applicationId: string
  toolId: string
  mcpServer: string
  resourceName: string
  protocol: string
}

// Routing Registry - how requests flow through the system
export interface RoutingRule {
  toolId: string
  adkEndpoint: string
  spineCache: string
  mcpBridge: string
  fallbackBehavior: 'direct' | 'cached' | 'error'
}

// Capability Registry - all available capabilities
export interface CapabilityRegistry {
  toolRegistry: Map<string, ToolDefinition>
  schemaRegistry: Map<string, SchemaDefinition>
  endpointRegistry: Map<string, EndpointDefinition>
  routingRegistry: Map<string, RoutingRule>
  permissions: Map<string, PermissionRule>
}

// Permission Rule - RBAC for capabilities
export interface PermissionRule {
  consumerId: string
  consumerType: 'human' | 'ai_model' | 'agent' | 'workflow'
  applicationId: string
  toolId: string
  accessLevel: 'read' | 'write' | 'execute'
  grantedAt: number
  expiresAt?: number
}

// Consumer - any entity that can request capabilities
export interface Consumer {
  consumerId: string
  consumerType: 'human' | 'ai_model' | 'agent' | 'workflow'
  tenantId: string
  role: 'admin' | 'user' | 'service'
  permissions: string[]
}

// ADK Request - request routed through ADK layer
export interface ADKRequest {
  consumerId: string
  applicationId: string
  toolId: string
  input: Record<string, unknown>
  requestId: string
  timestamp: number
}

// Spine Cache Entry - cached continuity data
export interface SpineCacheEntry {
  entityId: string
  entityType: string
  data: Record<string, unknown>
  cachedAt: number
  expiresAt: number
  isDirty: boolean
}

// Sync State - track synchronization with source systems
export interface SyncState {
  applicationId: string
  lastSyncAt: number
  nextSyncAt: number
  syncStatus: 'synced' | 'syncing' | 'failed'
  error?: string
}

// Audit Log Entry - complete trail of all operations
export interface AuditLogEntry {
  auditId: string
  tenantId: string
  consumerId: string
  consumerType: string
  applicationId: string
  toolId: string
  action: 'discover' | 'execute' | 'connect' | 'disconnect' | 'revoke'
  status: 'success' | 'failure'
  result?: unknown
  error?: string
  timestamp: number
  duration: number
}
