'use client'

import { useEffect, useState, useCallback } from 'react'
import { getConnector, ConnectorStatus } from './index'

/**
 * Hook to access the One Connector
 */
export function useConnector() {
  const connector = getConnector()
  return connector
}

/**
 * Hook to get connector status
 */
export function useConnectorStatus() {
  const [status, setStatus] = useState<ConnectorStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const connector = getConnector()

  useEffect(() => {
    const checkStatus = () => {
      try {
        const currentStatus = connector.getStatus()
        setStatus(currentStatus)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    checkStatus()

    // Poll status every 10 seconds
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [connector])

  return { status, isLoading, error }
}

/**
 * Hook to access a specific service (auth, database, ai, agent)
 */
export function useConnectorService<T extends keyof any>(
  service: string
) {
  const connector = getConnector()
  return connector.getService(service as any)
}

/**
 * Hook to access auth service
 */
export function useConnectorAuth() {
  const connector = getConnector()
  return connector.getService('auth')
}

/**
 * Hook to access database service
 */
export function useConnectorDatabase() {
  const connector = getConnector()
  return connector.getService('database')
}

/**
 * Hook to access AI service
 */
export function useConnectorAI() {
  const connector = getConnector()
  return connector.getService('ai')
}

/**
 * Hook to access agent service
 */
export function useConnectorAgent() {
  const connector = getConnector()
  return connector.getService('agent')
}

/**
 * Hook to execute connector operations
 */
export function useConnectorExecute() {
  const connector = getConnector()

  const execute = useCallback(
    async (operation: string, ...args: any[]) => {
      try {
        return await connector.execute(operation, ...args)
      } catch (error) {
        console.error('[Connector Hook] Execution error:', error)
        throw error
      }
    },
    [connector]
  )

  return execute
}

/**
 * Hook to get MCP bridge connections
 */
export function useConnectorMCPBridges() {
  const [bridges, setBridges] = useState<string[]>([])
  const connector = getConnector()

  useEffect(() => {
    const mcp = connector.listMCPBridges()
    setBridges(mcp)
  }, [connector])

  return bridges
}

/**
 * Hook to connect/disconnect connector
 */
export function useConnectorLifecycle() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const connector = getConnector()

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const result = await connector.connect()
      setIsConnected(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [connector])

  const disconnect = useCallback(async () => {
    try {
      await connector.disconnect()
      setIsConnected(false)
      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
    }
  }, [connector])

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  }
}
