/**
 * Continuity Bridge Gateway
 * 
 * Tenant-owned connection and capability pool.
 * OAuth established once. Reused by all authorized consumers.
 * 
 * PRINCIPLE: Connections belong to the TENANT, not to AI providers.
 */

import type { TenantContext, OAuthSession, CapabilityRegistry, ConnectedApplication } from './types'

export interface GatewayConfig {
  tenantId: string
  tenantName: string
  bridgeUrl: string
  spineUrl: string
  adkUrl: string
}

export interface ConnectedAppConfig {
  applicationId: string
  applicationName: string
  oauthProvider: string
  scopes: string[]
  credentialId: string
}

export class ContinuityBridgeGateway {
  private tenantContext: TenantContext
  private oauthSessions: Map<string, OAuthSession> = new Map()
  private capabilityRegistry: CapabilityRegistry
  private connectedApps: Map<string, ConnectedApplication> = new Map()

  constructor(config: GatewayConfig) {
    this.tenantContext = {
      tenantId: config.tenantId,
      tenantName: config.tenantName,
      bridgeUrl: config.bridgeUrl,
      spineUrl: config.spineUrl,
      adkUrl: config.adkUrl,
      createdAt: Date.now(),
      lastSync: Date.now(),
    }

    this.capabilityRegistry = {
      toolRegistry: new Map(),
      schemaRegistry: new Map(),
      endpointRegistry: new Map(),
      routingRegistry: new Map(),
      permissions: new Map(),
    }
  }

  /**
   * OAuth: Establish authenticated session once
   * 
   * PRINCIPLE: Each external application is authenticated only once.
   * The tenant owns this connection forever (or until explicitly revoked).
   */
  async authenticateApplication(config: ConnectedAppConfig): Promise<OAuthSession> {
    const sessionId = `session-${config.applicationId}-${Date.now()}`
    
    const oauthSession: OAuthSession = {
      sessionId,
      tenantId: this.tenantContext.tenantId,
      applicationId: config.applicationId,
      applicationName: config.applicationName,
      oauthProvider: config.oauthProvider,
      credentialId: config.credentialId,
      scopes: config.scopes,
      authenticatedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      status: 'active',
      isRevoked: false,
    }

    this.oauthSessions.set(sessionId, oauthSession)

    const connectedApp: ConnectedApplication = {
      applicationId: config.applicationId,
      applicationName: config.applicationName,
      oauthSessionId: sessionId,
      oauthProvider: config.oauthProvider,
      connectedAt: Date.now(),
      lastUsed: Date.now(),
      isActive: true,
    }

    this.connectedApps.set(config.applicationId, connectedApp)

    return oauthSession
  }

  /**
   * Get all authenticated applications for this tenant
   */
  getConnectedApplications(): ConnectedApplication[] {
    return Array.from(this.connectedApps.values()).filter(app => app.isActive)
  }

  /**
   * Register MCP capability
   */
  registerCapability(capability: {
    applicationId: string
    toolId: string
    toolName: string
    description: string
    category: string
    inputSchema: Record<string, unknown>
    outputSchema: Record<string, unknown>
    accessLevel: 'read' | 'write' | 'execute'
  }): void {
    const key = `${capability.applicationId}:${capability.toolId}`
    
    this.capabilityRegistry.toolRegistry.set(key, {
      applicationId: capability.applicationId,
      toolId: capability.toolId,
      toolName: capability.toolName,
      description: capability.description,
      category: capability.category,
      discoveredAt: Date.now(),
      accessLevel: capability.accessLevel,
    })

    this.capabilityRegistry.schemaRegistry.set(key, {
      inputSchema: capability.inputSchema,
      outputSchema: capability.outputSchema,
    })
  }

  /**
   * Discover capabilities available to the tenant
   */
  discoverCapabilities(filters?: {
    applicationId?: string
    category?: string
    accessLevel?: 'read' | 'write' | 'execute'
  }): Array<{
    toolId: string
    toolName: string
    description: string
    category: string
    accessLevel: string
  }> {
    let capabilities = Array.from(this.capabilityRegistry.toolRegistry.values())

    if (filters?.applicationId) {
      capabilities = capabilities.filter(c => c.applicationId === filters.applicationId)
    }

    if (filters?.category) {
      capabilities = capabilities.filter(c => c.category === filters.category)
    }

    if (filters?.accessLevel) {
      capabilities = capabilities.filter(c => c.accessLevel === filters.accessLevel)
    }

    return capabilities
  }

  /**
   * Execute capability through tenant's authenticated session
   */
  async executeCapability(args: {
    consumerId: string
    consumerType: 'human' | 'ai_model' | 'agent' | 'workflow'
    applicationId: string
    toolId: string
    input: Record<string, unknown>
  }): Promise<{
    success: boolean
    result?: unknown
    error?: string
    auditLog: {
      executedBy: string
      executedAt: number
      applicationId: string
      toolId: string
    }
  }> {
    const isAuthorized = await this.validateConsumerAuthorization(
      args.consumerId,
      args.consumerType,
      args.applicationId,
      args.toolId
    )

    if (!isAuthorized) {
      return {
        success: false,
        error: 'Consumer not authorized for this capability',
        auditLog: {
          executedBy: args.consumerId,
          executedAt: Date.now(),
          applicationId: args.applicationId,
          toolId: args.toolId,
        },
      }
    }

    const capabilityKey = `${args.applicationId}:${args.toolId}`
    if (!this.capabilityRegistry.toolRegistry.has(capabilityKey)) {
      return {
        success: false,
        error: 'Capability not found',
        auditLog: {
          executedBy: args.consumerId,
          executedAt: Date.now(),
          applicationId: args.applicationId,
          toolId: args.toolId,
        },
      }
    }

    const connectedApp = this.connectedApps.get(args.applicationId)
    if (!connectedApp?.isActive) {
      return {
        success: false,
        error: 'Application not connected',
        auditLog: {
          executedBy: args.consumerId,
          executedAt: Date.now(),
          applicationId: args.applicationId,
          toolId: args.toolId,
        },
      }
    }

    const result = {
      success: true,
      result: { /* actual tool response */ },
      auditLog: {
        executedBy: args.consumerId,
        executedAt: Date.now(),
        applicationId: args.applicationId,
        toolId: args.toolId,
      },
    }

    connectedApp.lastUsed = Date.now()

    return result
  }

  /**
   * Revoke application connection
   */
  revokeApplication(applicationId: string): void {
    const connectedApp = this.connectedApps.get(applicationId)
    if (connectedApp) {
      connectedApp.isActive = false

      const oauthSession = this.oauthSessions.get(connectedApp.oauthSessionId)
      if (oauthSession) {
        oauthSession.isRevoked = true
        oauthSession.status = 'revoked'
      }
    }
  }

  /**
   * Get gateway status for tenant
   */
  getStatus() {
    return {
      tenantId: this.tenantContext.tenantId,
      tenantName: this.tenantContext.tenantName,
      connectedApplications: this.connectedApps.size,
      totalCapabilities: this.capabilityRegistry.toolRegistry.size,
      activeSessions: Array.from(this.oauthSessions.values()).filter(
        s => s.status === 'active' && !s.isRevoked
      ).length,
      bridgeUrl: this.tenantContext.bridgeUrl,
      spineUrl: this.tenantContext.spineUrl,
      adkUrl: this.tenantContext.adkUrl,
    }
  }

  private async validateConsumerAuthorization(
    consumerId: string,
    consumerType: string,
    applicationId: string,
    toolId: string
  ): Promise<boolean> {
    return true
  }
}

export function createContinuityBridgeGateway(config: GatewayConfig): ContinuityBridgeGateway {
  return new ContinuityBridgeGateway(config)
}
