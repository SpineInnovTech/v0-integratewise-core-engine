'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  getAuthorizationContext,
  requestConnectorApproval,
  connectToEcosystem,
  getStoredConnectorContext,
  clearConnectorContext,
  type ConnectorAuthorizationContext,
  type ConnectorApprovalResponse,
} from './connector-approval'

interface UseConnectorApprovalState {
  showModal: boolean
  loading: boolean
  context?: ConnectorAuthorizationContext
  approval?: ConnectorApprovalResponse
  error?: string
  isConnected: boolean
}

interface UseConnectorApprovalActions {
  checkConnectorStatus: () => Promise<void>
  requestApproval: () => Promise<void>
  approve: () => Promise<void>
  dismiss: () => void
  reset: () => void
  disconnect: () => void
}

/**
 * Hook for managing connector approval flow
 * Handles the entire flow: identity → authorization → approval → connection
 */
export function useConnectorApproval(): UseConnectorApprovalState & UseConnectorApprovalActions {
  const [state, setState] = useState<UseConnectorApprovalState>({
    showModal: false,
    loading: false,
    isConnected: false,
  })

  // Check if already connected
  useEffect(() => {
    const context = getStoredConnectorContext()
    if (context) {
      setState((prev) => ({
        ...prev,
        isConnected: true,
      }))
    }
  }, [])

  // Check connector status on mount
  useEffect(() => {
    checkConnectorStatus()
  }, [])

  const checkConnectorStatus = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      // Check if user is authenticated
      const context = await getAuthorizationContext()

      if (!context) {
        // User not authenticated
        setState((prev) => ({
          ...prev,
          loading: false,
          showModal: false,
          isConnected: false,
        }))
        return
      }

      // Check if already connected
      const storedContext = getStoredConnectorContext()
      if (storedContext && storedContext.userId === context.userId) {
        setState((prev) => ({
          ...prev,
          loading: false,
          isConnected: true,
          context,
        }))
        return
      }

      // Not connected yet, show approval modal
      setState((prev) => ({
        ...prev,
        loading: false,
        showModal: true,
        context,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: String(error),
      }))
    }
  }, [])

  const requestApproval = useCallback(async () => {
    if (!state.context) return

    setState((prev) => ({ ...prev, loading: true, error: undefined }))
    try {
      const approval = await requestConnectorApproval(state.context)

      if (!approval.approved) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: approval.error || 'Approval denied',
          approval,
        }))
        return
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        approval,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: String(error),
      }))
    }
  }, [state.context])

  const approve = useCallback(async () => {
    if (!state.context || !state.approval) return

    setState((prev) => ({ ...prev, loading: true, error: undefined }))
    try {
      // Request approval if not already done
      if (!state.approval.approved) {
        await requestApproval()
        return
      }

      // Connect to ecosystem
      const connected = await connectToEcosystem(state.context, state.approval)

      if (!connected) {
        throw new Error('Failed to connect to ecosystem')
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        isConnected: true,
        showModal: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: String(error),
      }))
    }
  }, [state.context, state.approval, requestApproval])

  const dismiss = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showModal: false,
      error: undefined,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      showModal: false,
      loading: false,
      isConnected: false,
    })
  }, [])

  const disconnect = useCallback(() => {
    clearConnectorContext()
    setState({
      showModal: false,
      loading: false,
      isConnected: false,
    })
  }, [])

  return {
    ...state,
    checkConnectorStatus,
    requestApproval,
    approve,
    dismiss,
    reset,
    disconnect,
  }
}
