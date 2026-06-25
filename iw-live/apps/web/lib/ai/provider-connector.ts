/**
 * AI PROVIDER CONNECTION ADAPTER
 *
 * Connects AI providers (Claude, GPT, Groq) to the Spine Connection Pool.
 * Handles:
 * - Core connection registration (first provider establishes connection)
 * - Indirect access granting (other providers reuse connections)
 * - Tool discovery via Spine (no direct connections needed)
 * - Secure tool execution (proxied through Spine)
 */

import {
  getSpineConnectionPool,
  ConnectionPoolEntry,
  IndirectTenantAccess,
} from '@/lib/spine/connection-pool'
import {
  getToolDiscoveryService,
  ToolUsageContext,
} from '@/lib/spine/tool-discovery'

export interface AIProviderConnectionConfig {
  provider: 'claude' | 'gpt' | 'groq'
  connectorId: string
  credentialId: string
  spineUrl: string
  spineApiKey: string
  systemId: string
  metadata?: Record<string, any>
}

export interface ConnectedSystemInfo {
  systemId: string
  connectedBy: string // Provider that established connection
  connectedAt: number
  isDirectConnection: boolean
  accessLevel: 'read' | 'write' | 'execute'
}

class AIProviderConnector {
  private provider: string
  private connectorId: string
  private pool: ReturnType<typeof getSpineConnectionPool>
  private discovery: ReturnType<typeof getToolDiscoveryService>
  private connectedSystems: Map<string, ConnectedSystemInfo> = new Map()

  constructor(config: AIProviderConnectionConfig) {
    this.provider = config.provider
    this.connectorId = config.connectorId
    this.pool = getSpineConnectionPool(
      config.spineUrl,
      config.spineApiKey,
      config.systemId
    )
    this.discovery = getToolDiscoveryService()
  }

  /**
   * CORE CONNECTION: Register this provider's direct connections
   * Used by first provider (e.g., Claude) that establishes connections to systems
   */
  async registerCoreConnection(
    systemId: string,
    credentialId: string,
    metadata: Record<string, any> = {}
  ): Promise<ConnectionPoolEntry> {
    const entry = await this.pool.registerCoreConnection(
      this.provider,
      this.connectorId,
      credentialId,
      metadata
    )

    this.connectedSystems.set(systemId, {
      systemId,
      connectedBy: this.provider,
      connectedAt: entry.connectedAt,
      isDirectConnection: true,
      accessLevel: 'execute',
    })

    console.log(
      `[${this.provider}] Registered core connection to ${systemId}`
    )

    return entry
  }

  /**
   * INDIRECT ACCESS: Request access to system connected by another provider
   * Used when GPT/Groq needs systems connected by Claude
   * No new connection needed - reuses Claude's connection through Spine
   */
  async requestIndirectAccess(
    targetProvider: string,
    systemId: string,
    accessLevel: 'read' | 'write' | 'execute' = 'read',
    ttlSeconds: number = 3600
  ): Promise<IndirectTenantAccess> {
    // Get the connector ID of the provider who connected to this system
    // In a real system, this would be queried from Spine
    const grantedByConnectorId = `${targetProvider}:connector`

    const access = await this.pool.grantIndirectAccess(
      this.provider,
      systemId,
      accessLevel,
      grantedByConnectorId,
      ttlSeconds
    )

    this.connectedSystems.set(systemId, {
      systemId,
      connectedBy: targetProvider,
      connectedAt: access.expiresAt - ttlSeconds * 1000,
      isDirectConnection: false,
      accessLevel,
    })

    console.log(
      `[${this.provider}] Granted indirect access to ${systemId} (by ${targetProvider})`
    )

    return access
  }

  /**
   * DISCOVER TOOLS: Find available tools without direct connections
   * Queries Spine for tools from all accessible systems
   */
  async discoverTools(
    filters?: {
      category?: string
      capability?: string
      accessLevel?: string
    }
  ) {
    const tools = await this.discovery.discoverTools(
      {
        provider: this.provider,
        tenantId: 'integratewise',
        userId: this.connectorId,
      },
      {
        category: filters?.category,
        capability: filters?.capability,
        accessLevel: filters?.accessLevel as any,
      }
    )

    return tools
  }

  /**
   * EXECUTE TOOL: Run a tool securely through Spine
   */
  async executeTool(
    systemId: string,
    toolId: string,
    input: Record<string, any>
  ): Promise<Record<string, any>> {
    const context: ToolUsageContext = {
      provider: this.provider as 'claude' | 'gpt' | 'groq',
      tenantId: 'integratewise',
      userId: this.connectorId,
      requestId: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }

    return this.discovery.executeTool(context, systemId, toolId, input)
  }

  /**
   * READ DATA: Get data using a tool securely through Spine
   */
  async readData(
    systemId: string,
    toolId: string
  ): Promise<Record<string, any>> {
    const context: ToolUsageContext = {
      provider: this.provider as 'claude' | 'gpt' | 'groq',
      tenantId: 'integratewise',
      userId: this.connectorId,
      requestId: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }

    return this.discovery.readData(context, systemId, toolId)
  }

  /**
   * WRITE DATA: Update data using a tool securely through Spine
   */
  async writeData(
    systemId: string,
    toolId: string,
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const context: ToolUsageContext = {
      provider: this.provider as 'claude' | 'gpt' | 'groq',
      tenantId: 'integratewise',
      userId: this.connectorId,
      requestId: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }

    return this.discovery.writeData(context, systemId, toolId, data)
  }

  /**
   * GET CONNECTED SYSTEMS: List all systems this provider can access
   * Includes both direct connections and indirect accesses
   */
  getConnectedSystems(): ConnectedSystemInfo[] {
    return Array.from(this.connectedSystems.values())
  }

  /**
   * GET POOL STATUS: Show connection pool statistics
   */
  async getPoolStatus(): Promise<{
    provider: string
    connectorId: string
    connectedSystems: number
    accessStats: Awaited<
      ReturnType<typeof this.discovery.getAccessStats>
    >
  }> {
    const stats = await this.discovery.getAccessStats({
      provider: this.provider as 'claude' | 'gpt' | 'groq',
      tenantId: 'integratewise',
      userId: this.connectorId,
    })

    return {
      provider: this.provider,
      connectorId: this.connectorId,
      connectedSystems: this.connectedSystems.size,
      accessStats: stats,
    }
  }

  /**
   * CAN ACCESS SYSTEM: Check if provider can access a system
   */
  async canAccessSystem(
    systemId: string,
    operation: 'read' | 'write' | 'execute' = 'read'
  ): Promise<boolean> {
    const system = this.connectedSystems.get(systemId)
    if (!system) return false

    return (
      operation === 'read' ||
      (operation === 'write' && system.accessLevel !== 'read') ||
      (operation === 'execute' && system.accessLevel === 'execute')
    )
  }
}

// Factory for creating provider adapters
export function createAIProviderConnector(
  config: AIProviderConnectionConfig
): AIProviderConnector {
  return new AIProviderConnector(config)
}

export { AIProviderConnector }
