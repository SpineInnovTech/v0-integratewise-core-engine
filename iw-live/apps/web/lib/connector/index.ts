/**
 * ONE SINGLE CONNECTOR
 *
 * Central nervous system of IntegrateWise - unified entry point for entire ecosystem.
 * All services, providers, and MCP connections flow through this single connector.
 * Connected via the Spine architecture.
 */

import { getAuthProvider } from '@/lib/auth/factory'
import { getDatabaseProvider } from '@/lib/db/factory'
import { getAIProvider } from '@/lib/ai/factory'
import { getAgentProvider } from '@/lib/agent/factory'

export interface ConnectorConfig {
  tenantId: string
  clientId: string
  environment: 'development' | 'staging' | 'production'
  spineUrl: string
  mcpUrl: string
}

export interface ConnectorServices {
  auth: ReturnType<typeof getAuthProvider>
  database: ReturnType<typeof getDatabaseProvider>
  ai: ReturnType<typeof getAIProvider>
  agent: ReturnType<typeof getAgentProvider>
}

export interface ConnectorMCPBridges {
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

export interface ConnectorStatus {
  healthy: boolean
  services: {
    auth: { healthy: boolean; provider: string }
    database: { healthy: boolean; provider: string }
    ai: { healthy: boolean; provider: string }
    agent: { healthy: boolean; provider: string }
  }
  mcpBridges: ConnectorMCPBridges
  connectedAt: number
  lastHeartbeat: number
}

class OneConnector {
  private config: ConnectorConfig
  private services: ConnectorServices
  private status: ConnectorStatus
  private mcpPool: Map<string, any> = new Map()
  private heartbeatInterval: NodeJS.Timer | null = null

  constructor(config: ConnectorConfig) {
    this.config = config
    this.services = this.initializeServices()
    this.status = {
      healthy: false,
      services: {
        auth: { healthy: false, provider: 'unknown' },
        database: { healthy: false, provider: 'unknown' },
        ai: { healthy: false, provider: 'unknown' },
        agent: { healthy: false, provider: 'unknown' },
      },
      mcpBridges: {
        integratewise: {
          knowledge: false,
          memory: false,
          spine: false,
          signals: false,
          proposals: false,
          books: false,
        },
        github: false,
        figma: false,
        notion: false,
        supabase: false,
        cloudflare: false,
        slack: false,
        stripe: false,
      },
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
    }
  }

  /**
   * Initialize all service providers
   */
  private initializeServices(): ConnectorServices {
    return {
      auth: getAuthProvider(),
      database: getDatabaseProvider(),
      ai: getAIProvider(),
      agent: getAgentProvider(),
    }
  }

  /**
   * Connect to Spine and MCP pool
   */
  async connect(): Promise<boolean> {
    try {
      // Connect to Spine
      await this.connectToSpine()

      // Initialize MCP bridges
      await this.initializeMCPBridges()

      // Start heartbeat
      this.startHeartbeat()

      // Perform health checks
      await this.performHealthCheck()

      console.log(
        '[Connector] Successfully connected to Spine and MCP ecosystem'
      )
      return true
    } catch (error) {
      console.error('[Connector] Failed to connect:', error)
      return false
    }
  }

  /**
   * Connect to Spine - central nervous system
   */
  private async connectToSpine(): Promise<void> {
    try {
      const response = await fetch(`${this.config.spineUrl}/api/connector`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SPINE_API_KEY}`,
        },
        body: JSON.stringify({
          tenantId: this.config.tenantId,
          clientId: this.config.clientId,
          environment: this.config.environment,
          timestamp: Date.now(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Spine connection failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[Connector] Spine connected:', data)
    } catch (error) {
      console.error('[Connector] Spine connection error:', error)
      throw error
    }
  }

  /**
   * Initialize MCP bridges - connect to all external services
   */
  private async initializeMCPBridges(): Promise<void> {
    const bridges = [
      { name: 'integratewise', url: `${this.config.mcpUrl}/integratewise` },
      { name: 'github', url: `${this.config.mcpUrl}/github` },
      { name: 'figma', url: `${this.config.mcpUrl}/figma` },
      { name: 'notion', url: `${this.config.mcpUrl}/notion` },
      { name: 'supabase', url: `${this.config.mcpUrl}/supabase` },
      { name: 'cloudflare', url: `${this.config.mcpUrl}/cloudflare` },
      { name: 'slack', url: `${this.config.mcpUrl}/slack` },
      { name: 'stripe', url: `${this.config.mcpUrl}/stripe` },
    ]

    for (const bridge of bridges) {
      try {
        const response = await fetch(bridge.url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.MCP_TOKEN}`,
          },
        })

        if (response.ok) {
          this.mcpPool.set(bridge.name, {
            connected: true,
            url: bridge.url,
            connectedAt: Date.now(),
          })
          this.status.mcpBridges[bridge.name as keyof ConnectorMCPBridges] =
            true
        }
      } catch (error) {
        console.warn(`[Connector] Failed to connect MCP bridge: ${bridge.name}`)
      }
    }
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthCheck(): Promise<void> {
    const checks = [
      {
        name: 'auth',
        check: () => this.services.auth.healthCheck(),
      },
      {
        name: 'database',
        check: () => this.services.database.healthCheck(),
      },
      {
        name: 'ai',
        check: () => this.services.ai.healthCheck(),
      },
      {
        name: 'agent',
        check: () => this.services.agent.healthCheck(),
      },
    ]

    for (const check of checks) {
      try {
        const result = await check.check()
        this.status.services[check.name as keyof typeof this.status.services] =
          {
            healthy: result.healthy,
            provider: result.provider,
          }
      } catch (error) {
        console.error(`[Connector] Health check failed for ${check.name}`)
      }
    }

    this.status.healthy =
      this.status.services.auth.healthy &&
      this.status.services.database.healthy &&
      this.status.services.ai.healthy &&
      this.status.services.agent.healthy
  }

  /**
   * Start heartbeat to maintain connection
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.performHealthCheck()

        // Update spine with status
        await fetch(`${this.config.spineUrl}/api/connector/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.SPINE_API_KEY}`,
          },
          body: JSON.stringify({
            tenantId: this.config.tenantId,
            clientId: this.config.clientId,
            status: this.status,
            timestamp: Date.now(),
          }),
        })

        this.status.lastHeartbeat = Date.now()
      } catch (error) {
        console.error('[Connector] Heartbeat error:', error)
      }
    }, 30000) // 30 second heartbeat
  }

  /**
   * Stop the connector
   */
  async disconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    try {
      await fetch(`${this.config.spineUrl}/api/connector/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SPINE_API_KEY}`,
        },
        body: JSON.stringify({
          tenantId: this.config.tenantId,
          clientId: this.config.clientId,
          timestamp: Date.now(),
        }),
      })

      console.log('[Connector] Disconnected from Spine')
    } catch (error) {
      console.error('[Connector] Disconnect error:', error)
    }
  }

  /**
   * Get current status
   */
  getStatus(): ConnectorStatus {
    return this.status
  }

  /**
   * Access a service
   */
  getService<K extends keyof ConnectorServices>(
    service: K
  ): ConnectorServices[K] {
    return this.services[service]
  }

  /**
   * Get MCP bridge
   */
  getMCPBridge(name: string) {
    return this.mcpPool.get(name)
  }

  /**
   * List all connected MCP bridges
   */
  listMCPBridges(): string[] {
    return Array.from(this.mcpPool.keys())
  }

  /**
   * Execute operation through connector
   */
  async execute(
    operation: string,
    ...args: any[]
  ): Promise<any> {
    const [service, method] = operation.split('.')

    if (service === 'auth') {
      return (this.services.auth as any)[method](...args)
    } else if (service === 'database') {
      return (this.services.database as any)[method](...args)
    } else if (service === 'ai') {
      return (this.services.ai as any)[method](...args)
    } else if (service === 'agent') {
      return (this.services.agent as any)[method](...args)
    }

    throw new Error(`Unknown operation: ${operation}`)
  }
}

// Singleton instance
let connectorInstance: OneConnector | null = null

/**
 * Get or create the One Connector instance
 */
export function getConnector(
  config?: ConnectorConfig
): OneConnector {
  if (!connectorInstance) {
    if (!config) {
      config = {
        tenantId: process.env.INTEGRATEWISE_TENANT_ID || 'default',
        clientId:
          process.env.INTEGRATEWISE_CLIENT_ID ||
          'integratewise-app',
        environment: (process.env.NODE_ENV as any) || 'development',
        spineUrl: process.env.SPINE_URL || 'http://localhost:3000',
        mcpUrl: process.env.MCP_URL || 'http://localhost:3001',
      }
    }
    connectorInstance = new OneConnector(config)
  }
  return connectorInstance
}

/**
 * Reset connector instance (for testing)
 */
export function resetConnector(): void {
  connectorInstance = null
}

export default getConnector
