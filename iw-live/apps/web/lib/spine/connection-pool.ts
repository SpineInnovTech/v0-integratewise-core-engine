/**
 * SPINE CONNECTION POOL
 *
 * Shared connector pattern: Instead of each AI provider establishing independent connections,
 * they share core connections through Spine as a broker. Multiple providers can access the same
 * connected systems securely via indirect tenancy.
 *
 * Pattern:
 * - Claude connects to 100 systems via Spine (core connection)
 * - GPT queries Spine for available tools (indirect access)
 * - Groq queries Spine for available tools (indirect access)
 * - Data flows through Spine with security validation
 * - No new connections needed, only tool probing and data access
 */

export interface ConnectionPoolEntry {
  systemId: string
  connectorId: string
  provider: string
  connectedAt: number
  credentials: {
    // Never expose raw credentials - only reference IDs
    credentialId: string
    encryptionKey?: string
  }
  isActive: boolean
  metadata: Record<string, any>
}

export interface IndirectTenantAccess {
  provider: string
  systemId: string
  accessLevel: 'read' | 'write' | 'execute'
  grantedBy: string // Original connector ID that established connection
  expiresAt: number
  permissions: string[]
}

export interface ToolProbeRequest {
  provider: string // 'claude' | 'gpt' | 'groq'
  systemId?: string // Optional - probe specific system
  filters?: {
    category?: string
    capability?: string
    accessLevel?: string
  }
}

export interface ToolProbeResponse {
  tools: ToolDefinition[]
  systemId: string
  provider: string
  totalCount: number
  accessLevel: 'read' | 'write' | 'execute'
}

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: string
  capabilities: string[]
  inputSchema: Record<string, any>
  outputSchema: Record<string, any>
  requiresAuth: boolean
  accessLevel: 'read' | 'write' | 'execute'
}

export interface SecureDataAccessRequest {
  toolId: string
  systemId: string
  provider: string // Which provider is requesting access
  operation: 'read' | 'write' | 'execute'
  data?: Record<string, any>
  context: {
    requestId: string
    tenantId: string
    userId: string
    timestamp: number
  }
}

export interface SecureDataAccessResponse {
  success: boolean
  data?: Record<string, any>
  error?: string
  auditLog: {
    requestId: string
    provider: string
    toolId: string
    timestamp: number
    status: 'approved' | 'denied' | 'error'
  }
}

class SpineConnectionPool {
  private poolEntries: Map<string, ConnectionPoolEntry> = new Map()
  private indirectAccess: Map<string, IndirectTenantAccess[]> = new Map()
  private spineUrl: string
  private spineApiKey: string
  private systemId: string

  constructor(
    spineUrl: string,
    spineApiKey: string,
    systemId: string
  ) {
    this.spineUrl = spineUrl
    this.spineApiKey = spineApiKey
    this.systemId = systemId
  }

  /**
   * Register a core connection established by a provider
   * This becomes available for indirect access by other providers
   */
  async registerCoreConnection(
    provider: string,
    connectorId: string,
    credentialId: string,
    metadata: Record<string, any> = {}
  ): Promise<ConnectionPoolEntry> {
    const entry: ConnectionPoolEntry = {
      systemId: this.systemId,
      connectorId,
      provider,
      connectedAt: Date.now(),
      credentials: {
        credentialId,
        encryptionKey: this.generateEncryptionKey(),
      },
      isActive: true,
      metadata,
    }

    this.poolEntries.set(`${provider}:${connectorId}`, entry)

    // Register with Spine
    await this.notifySpineOfConnection(entry)

    return entry
  }

  /**
   * Grant indirect access to a connected system for another provider
   * No new connection needed - uses existing pooled connection
   */
  async grantIndirectAccess(
    requestingProvider: string,
    systemId: string,
    accessLevel: 'read' | 'write' | 'execute' = 'read',
    grantedByConnectorId: string,
    ttlSeconds: number = 3600
  ): Promise<IndirectTenantAccess> {
    const access: IndirectTenantAccess = {
      provider: requestingProvider,
      systemId,
      accessLevel,
      grantedBy: grantedByConnectorId,
      expiresAt: Date.now() + ttlSeconds * 1000,
      permissions: this.getDefaultPermissions(accessLevel),
    }

    const key = `${requestingProvider}:${systemId}`
    if (!this.indirectAccess.has(key)) {
      this.indirectAccess.set(key, [])
    }
    this.indirectAccess.get(key)!.push(access)

    // Notify Spine of indirect access grant
    await this.notifySpineOfIndirectAccess(access)

    return access
  }

  /**
   * TOOL PROBING: Provider queries available tools without direct connection
   * Spine returns tool definitions from connected systems
   */
  async probeTools(request: ToolProbeRequest): Promise<ToolProbeResponse> {
    // Check if provider has indirect access
    const hasAccess = this.hasIndirectAccess(
      request.provider,
      request.systemId
    )

    if (!hasAccess) {
      throw new Error(
        `Provider ${request.provider} does not have access to system ${request.systemId}`
      )
    }

    // Query Spine for available tools
    const response = await fetch(`${this.spineUrl}/api/tools/probe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Spine-API-Key': this.spineApiKey,
        'X-Connector-ID': this.systemId,
      },
      body: JSON.stringify({
        provider: request.provider,
        systemId: request.systemId,
        filters: request.filters,
      }),
    })

    if (!response.ok) {
      throw new Error(`Tool probe failed: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * SECURE DATA ACCESS: Provider accesses data through Spine proxy
   * All requests validated against security policies
   */
  async accessSecureData(
    request: SecureDataAccessRequest
  ): Promise<SecureDataAccessResponse> {
    // Validate access permission
    const access = this.validateAccess(
      request.provider,
      request.systemId,
      request.operation
    )

    if (!access) {
      return {
        success: false,
        error: 'Access denied',
        auditLog: {
          requestId: request.context.requestId,
          provider: request.provider,
          toolId: request.toolId,
          timestamp: Date.now(),
          status: 'denied',
        },
      }
    }

    try {
      // Proxy request through Spine
      const response = await fetch(
        `${this.spineUrl}/api/systems/${request.systemId}/tools/${request.toolId}/access`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Spine-API-Key': this.spineApiKey,
            'X-Connector-ID': this.systemId,
            'X-Provider': request.provider,
            'X-Request-ID': request.context.requestId,
          },
          body: JSON.stringify({
            operation: request.operation,
            data: request.data,
            context: request.context,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Data access failed: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        data,
        auditLog: {
          requestId: request.context.requestId,
          provider: request.provider,
          toolId: request.toolId,
          timestamp: Date.now(),
          status: 'approved',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        auditLog: {
          requestId: request.context.requestId,
          provider: request.provider,
          toolId: request.toolId,
          timestamp: Date.now(),
          status: 'error',
        },
      }
    }
  }

  /**
   * List all connected systems (for provider discovery)
   * Returns only systems provider has access to
   */
  async listConnectedSystems(provider: string): Promise<string[]> {
    const systems = new Set<string>()

    // Add systems from core connections (if provider made them)
    this.poolEntries.forEach((entry) => {
      if (entry.provider === provider && entry.isActive) {
        systems.add(entry.systemId)
      }
    })

    // Add systems from indirect access
    this.indirectAccess.forEach((accesses) => {
      accesses.forEach((access) => {
        if (access.provider === provider && access.expiresAt > Date.now()) {
          systems.add(access.systemId)
        }
      })
    })

    return Array.from(systems)
  }

  /**
   * Get connection status for all providers
   */
  async getPoolStatus(): Promise<{
    coreConnections: number
    indirectAccesses: number
    activeProviders: string[]
    systemsConnected: number
  }> {
    const activeProviders = new Set<string>()
    let activeCount = 0

    this.poolEntries.forEach((entry) => {
      if (entry.isActive) {
        activeProviders.add(entry.provider)
        activeCount++
      }
    })

    return {
      coreConnections: activeCount,
      indirectAccesses: this.indirectAccess.size,
      activeProviders: Array.from(activeProviders),
      systemsConnected: this.poolEntries.size,
    }
  }

  // Private helper methods

  private async notifySpineOfConnection(
    entry: ConnectionPoolEntry
  ): Promise<void> {
    await fetch(`${this.spineUrl}/api/connections/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Spine-API-Key': this.spineApiKey,
      },
      body: JSON.stringify({
        systemId: entry.systemId,
        connectorId: entry.connectorId,
        provider: entry.provider,
        connectedAt: entry.connectedAt,
        credentialId: entry.credentials.credentialId,
      }),
    })
  }

  private async notifySpineOfIndirectAccess(
    access: IndirectTenantAccess
  ): Promise<void> {
    await fetch(`${this.spineUrl}/api/access/indirect-grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Spine-API-Key': this.spineApiKey,
      },
      body: JSON.stringify(access),
    })
  }

  private hasIndirectAccess(
    provider: string,
    systemId?: string
  ): boolean {
    if (!systemId) return this.indirectAccess.size > 0

    const key = `${provider}:${systemId}`
    const accesses = this.indirectAccess.get(key)

    return (
      accesses?.some((a) => a.expiresAt > Date.now()) ?? false
    )
  }

  private validateAccess(
    provider: string,
    systemId: string,
    operation: string
  ): boolean {
    const key = `${provider}:${systemId}`
    const accesses = this.indirectAccess.get(key)

    if (!accesses) return false

    return accesses.some((a) => {
      if (a.expiresAt < Date.now()) return false

      const canAccess =
        operation === 'read' ||
        (operation === 'write' && a.accessLevel !== 'read') ||
        (operation === 'execute' && a.accessLevel === 'execute')

      return canAccess && a.permissions.includes(operation)
    })
  }

  private getDefaultPermissions(
    accessLevel: 'read' | 'write' | 'execute'
  ): string[] {
    switch (accessLevel) {
      case 'read':
        return ['read', 'probe']
      case 'write':
        return ['read', 'write', 'probe']
      case 'execute':
        return ['read', 'write', 'execute', 'probe']
      default:
        return ['read']
    }
  }

  private generateEncryptionKey(): string {
    return Buffer.from(Math.random().toString()).toString('base64').slice(0, 32)
  }
}

// Singleton instance
let poolInstance: SpineConnectionPool | null = null

export function getSpineConnectionPool(
  spineUrl?: string,
  spineApiKey?: string,
  systemId?: string
): SpineConnectionPool {
  if (!poolInstance) {
    if (!spineUrl || !spineApiKey || !systemId) {
      throw new Error(
        'SpineConnectionPool must be initialized with required parameters'
      )
    }
    poolInstance = new SpineConnectionPool(spineUrl, spineApiKey, systemId)
  }
  return poolInstance
}

export { SpineConnectionPool }
