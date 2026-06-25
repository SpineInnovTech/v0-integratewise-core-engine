/**
 * TOOL DISCOVERY SERVICE
 *
 * Enables tool discovery without direct connections.
 * Uses Spine Connection Pool for:
 * - Tool probing (discover what's available)
 * - Tool metadata (get tool definitions)
 * - Tool usage (execute tools securely)
 * - Access validation (verify permissions)
 */

import {
  getSpineConnectionPool,
  ToolProbeRequest,
  ToolProbeResponse,
  ToolDefinition,
  SecureDataAccessRequest,
  SecureDataAccessResponse,
} from './connection-pool'

export interface DiscoveryFilter {
  category?: string
  capability?: string
  accessLevel?: 'read' | 'write' | 'execute'
  search?: string
}

export interface AIProviderContext {
  provider: string // 'claude' | 'gpt' | 'groq'
  tenantId: string
  userId: string
}

export interface ToolUsageContext extends AIProviderContext {
  requestId: string
  timestamp: number
}

class ToolDiscoveryService {
  private pool = getSpineConnectionPool()

  /**
   * Discover available tools for a provider
   * Provider doesn't need direct connections - queries through pool
   */
  async discoverTools(
    context: AIProviderContext,
    filters?: DiscoveryFilter
  ): Promise<ToolDefinition[]> {
    try {
      // Get all systems provider has access to
      const systems = await this.pool.listConnectedSystems(
        context.provider
      )

      if (systems.length === 0) {
        console.log(
          `[Tool Discovery] No systems accessible for ${context.provider}`
        )
        return []
      }

      const allTools: ToolDefinition[] = []

      // Probe each system for available tools
      for (const systemId of systems) {
        try {
          const response = await this.pool.probeTools({
            provider: context.provider,
            systemId,
            filters: {
              category: filters?.category,
              capability: filters?.capability,
              accessLevel: filters?.accessLevel,
            },
          })

          allTools.push(...response.tools)
        } catch (error) {
          console.warn(
            `[Tool Discovery] Failed to probe ${systemId}: ${error}`
          )
        }
      }

      // Apply text search if provided
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        return allTools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(searchLower) ||
            tool.description.toLowerCase().includes(searchLower)
        )
      }

      return allTools
    } catch (error) {
      console.error('[Tool Discovery] Discovery failed:', error)
      return []
    }
  }

  /**
   * Get details for a specific tool
   */
  async getToolDetails(
    context: AIProviderContext,
    systemId: string,
    toolId: string
  ): Promise<ToolDefinition | null> {
    try {
      const response = await this.pool.probeTools({
        provider: context.provider,
        systemId,
        filters: {
          search: toolId,
        },
      })

      const tool = response.tools.find((t) => t.id === toolId)
      return tool || null
    } catch (error) {
      console.error('[Tool Discovery] Failed to get tool details:', error)
      return null
    }
  }

  /**
   * Execute a tool securely through Spine
   */
  async executeTool(
    context: ToolUsageContext,
    systemId: string,
    toolId: string,
    inputData: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const response = await this.pool.accessSecureData({
        toolId,
        systemId,
        provider: context.provider,
        operation: 'execute',
        data: inputData,
        context: {
          requestId: context.requestId,
          tenantId: context.tenantId,
          userId: context.userId,
          timestamp: context.timestamp,
        },
      })

      if (!response.success) {
        throw new Error(response.error || 'Tool execution failed')
      }

      return response.data || {}
    } catch (error) {
      console.error('[Tool Discovery] Tool execution failed:', error)
      throw error
    }
  }

  /**
   * Read data using a tool
   */
  async readData(
    context: ToolUsageContext,
    systemId: string,
    toolId: string
  ): Promise<Record<string, any>> {
    try {
      const response = await this.pool.accessSecureData({
        toolId,
        systemId,
        provider: context.provider,
        operation: 'read',
        context: {
          requestId: context.requestId,
          tenantId: context.tenantId,
          userId: context.userId,
          timestamp: context.timestamp,
        },
      })

      if (!response.success) {
        throw new Error(response.error || 'Data read failed')
      }

      return response.data || {}
    } catch (error) {
      console.error('[Tool Discovery] Data read failed:', error)
      throw error
    }
  }

  /**
   * Write data using a tool
   */
  async writeData(
    context: ToolUsageContext,
    systemId: string,
    toolId: string,
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const response = await this.pool.accessSecureData({
        toolId,
        systemId,
        provider: context.provider,
        operation: 'write',
        data,
        context: {
          requestId: context.requestId,
          tenantId: context.tenantId,
          userId: context.userId,
          timestamp: context.timestamp,
        },
      })

      if (!response.success) {
        throw new Error(response.error || 'Data write failed')
      }

      return response.data || {}
    } catch (error) {
      console.error('[Tool Discovery] Data write failed:', error)
      throw error
    }
  }

  /**
   * Get tools by category (no direct connections needed)
   */
  async getToolsByCategory(
    context: AIProviderContext,
    category: string
  ): Promise<ToolDefinition[]> {
    return this.discoverTools(context, { category })
  }

  /**
   * Get tools by capability
   */
  async getToolsByCapability(
    context: AIProviderContext,
    capability: string
  ): Promise<ToolDefinition[]> {
    return this.discoverTools(context, { capability })
  }

  /**
   * Check if provider can access a specific tool
   */
  async canAccessTool(
    context: AIProviderContext,
    systemId: string,
    toolId: string,
    operation: 'read' | 'write' | 'execute' = 'read'
  ): Promise<boolean> {
    try {
      const tool = await this.getToolDetails(context, systemId, toolId)
      if (!tool) return false

      // Check access level
      const canAccess =
        operation === 'read' ||
        (operation === 'write' && tool.accessLevel !== 'read') ||
        (operation === 'execute' && tool.accessLevel === 'execute')

      return canAccess
    } catch (error) {
      return false
    }
  }

  /**
   * Get access statistics
   */
  async getAccessStats(
    context: AIProviderContext
  ): Promise<{
    provider: string
    accessibleSystems: number
    accessibleTools: number
    permissions: string[]
  }> {
    try {
      const systems = await this.pool.listConnectedSystems(
        context.provider
      )

      let toolCount = 0
      const permissions = new Set<string>()

      for (const systemId of systems) {
        try {
          const response = await this.pool.probeTools({
            provider: context.provider,
            systemId,
          })

          toolCount += response.totalCount

          response.tools.forEach((tool) => {
            permissions.add(tool.accessLevel)
          })
        } catch (error) {
          // Continue with next system
        }
      }

      return {
        provider: context.provider,
        accessibleSystems: systems.length,
        accessibleTools: toolCount,
        permissions: Array.from(permissions),
      }
    } catch (error) {
      return {
        provider: context.provider,
        accessibleSystems: 0,
        accessibleTools: 0,
        permissions: [],
      }
    }
  }
}

// Singleton instance
let discoveryInstance: ToolDiscoveryService | null = null

export function getToolDiscoveryService(): ToolDiscoveryService {
  if (!discoveryInstance) {
    discoveryInstance = new ToolDiscoveryService()
  }
  return discoveryInstance
}

export { ToolDiscoveryService }
