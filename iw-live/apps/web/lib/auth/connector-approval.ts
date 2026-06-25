/**
 * Connector Approval Service
 * Manages the authorization and approval flow for connecting to the ecosystem
 * 
 * Flow: Identity (Auth) → Authorization Check → Approval Required → Connector Connected
 */

import { getConnector } from '@/lib/connector'
import { getAuthProvider } from '@/lib/auth/factory'

export interface ConnectorApprovalRequest {
  userId: string
  tenantId: string
  email: string
  name: string
  timestamp: number
}

export interface ConnectorApprovalResponse {
  approved: boolean
  connectorId: string
  connectedAt: number
  expiresAt: number
  permissions: string[]
  error?: string
}

export interface ConnectorAuthorizationContext {
  userId: string
  tenantId: string
  email: string
  name: string
  isAdmin: boolean
  permissions: string[]
  hasConnectorAccess: boolean
}

/**
 * Get authorization context for the current user
 * Determines if user can access the connector
 */
export async function getAuthorizationContext(): Promise<ConnectorAuthorizationContext | null> {
  try {
    const auth = getAuthProvider()
    const user = await auth.getCurrentUser()

    if (!user) {
      return null
    }

    // Extract tenant from email domain or user metadata
    const tenantId = (user as any).tenantId || 'integratewise'
    const isAdmin = (user as any).role === 'admin' || (user as any).isAdmin === true

    return {
      userId: user.id,
      tenantId,
      email: user.email || '',
      name: user.name || user.email || 'User',
      isAdmin,
      permissions: getDefaultPermissions(isAdmin),
      hasConnectorAccess: true, // Can be enhanced with role-based checks
    }
  } catch (error) {
    console.error('[Connector Auth] Failed to get authorization context:', error)
    return null
  }
}

/**
 * Request connector approval
 * Called after user is authenticated and authorized
 */
export async function requestConnectorApproval(
  context: ConnectorAuthorizationContext
): Promise<ConnectorApprovalResponse> {
  try {
    const timestamp = Date.now()
    const expiresAt = timestamp + 24 * 60 * 60 * 1000 // 24 hours

    // Create approval request
    const approvalRequest: ConnectorApprovalRequest = {
      userId: context.userId,
      tenantId: context.tenantId,
      email: context.email,
      name: context.name,
      timestamp,
    }

    // In production, this would call your Spine API for approval
    // For now, auto-approve for authenticated users
    const approved = true

    if (!approved) {
      return {
        approved: false,
        connectorId: '',
        connectedAt: 0,
        expiresAt,
        permissions: [],
        error: 'Connector approval denied by administrator',
      }
    }

    // Generate connector ID
    const connectorId = `${context.userId}-${context.tenantId}-${timestamp}`

    return {
      approved: true,
      connectorId,
      connectedAt: timestamp,
      expiresAt,
      permissions: context.permissions,
    }
  } catch (error) {
    console.error('[Connector Auth] Approval request failed:', error)
    return {
      approved: false,
      connectorId: '',
      connectedAt: 0,
      expiresAt: 0,
      permissions: [],
      error: String(error),
    }
  }
}

/**
 * Connect to the ecosystem via the One Connector
 * Called after approval is granted
 */
export async function connectToEcosystem(
  context: ConnectorAuthorizationContext,
  approval: ConnectorApprovalResponse
): Promise<boolean> {
  try {
    if (!approval.approved) {
      throw new Error('Cannot connect without approval')
    }

    const connector = getConnector({
      tenantId: context.tenantId,
      clientId: context.userId,
      environment: process.env.NODE_ENV || 'production',
      spineUrl: process.env.SPINE_URL || 'https://spine.integratewise.ai',
      mcpUrl: process.env.MCP_URL || 'https://mcp.integratewise.ai',
    })

    // Connect to Spine and initialize services
    await connector.connect()

    // Store connection context in session/local storage
    storeConnectorContext({
      userId: context.userId,
      tenantId: context.tenantId,
      connectorId: approval.connectorId,
      connectedAt: approval.connectedAt,
      expiresAt: approval.expiresAt,
      permissions: approval.permissions,
    })

    return true
  } catch (error) {
    console.error('[Connector Auth] Connection failed:', error)
    return false
  }
}

/**
 * Full flow: authenticate → authorize → approve → connect
 */
export async function initializeConnectorWithAuth(): Promise<{
  success: boolean
  context?: ConnectorAuthorizationContext
  approval?: ConnectorApprovalResponse
  connected?: boolean
  error?: string
}> {
  try {
    // Step 1: Get authorization context (after auth)
    const context = await getAuthorizationContext()
    if (!context) {
      return {
        success: false,
        error: 'User authentication required',
      }
    }

    // Step 2: Check if user has connector access
    if (!context.hasConnectorAccess) {
      return {
        success: false,
        context,
        error: 'User does not have connector access permissions',
      }
    }

    // Step 3: Request connector approval
    const approval = await requestConnectorApproval(context)
    if (!approval.approved) {
      return {
        success: false,
        context,
        approval,
        error: approval.error || 'Connector approval required',
      }
    }

    // Step 4: Connect to ecosystem
    const connected = await connectToEcosystem(context, approval)
    if (!connected) {
      return {
        success: false,
        context,
        approval,
        error: 'Failed to connect to ecosystem',
      }
    }

    return {
      success: true,
      context,
      approval,
      connected: true,
    }
  } catch (error) {
    console.error('[Connector Auth] Initialization failed:', error)
    return {
      success: false,
      error: String(error),
    }
  }
}

/**
 * Get default permissions for user role
 */
function getDefaultPermissions(isAdmin: boolean): string[] {
  const basePermissions = [
    'connector:read',
    'connector:execute',
    'auth:access',
    'database:read',
  ]

  const adminPermissions = [
    ...basePermissions,
    'connector:admin',
    'auth:admin',
    'database:write',
    'ai:execute',
    'agent:execute',
  ]

  return isAdmin ? adminPermissions : basePermissions
}

/**
 * Store connector context in session/localStorage
 */
function storeConnectorContext(context: {
  userId: string
  tenantId: string
  connectorId: string
  connectedAt: number
  expiresAt: number
  permissions: string[]
}) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('connector_context', JSON.stringify(context))
  }
}

/**
 * Retrieve stored connector context
 */
export function getStoredConnectorContext() {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('connector_context')
    return stored ? JSON.parse(stored) : null
  }
  return null
}

/**
 * Clear connector context on logout
 */
export function clearConnectorContext() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('connector_context')
  }
}

/**
 * Check if connector is still authorized (not expired)
 */
export function isConnectorAuthorized(): boolean {
  const context = getStoredConnectorContext()
  if (!context) return false

  const now = Date.now()
  return now < context.expiresAt
}
