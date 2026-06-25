'use client'

import { useEffect } from 'react'
import { useConnectorApproval } from '@/lib/auth/use-connector-approval'
import { ConnectorApprovalModal } from './connector-approval-modal'

interface AuthConnectorProviderProps {
  children: React.ReactNode
}

/**
 * Provider component that wraps the application and handles connector approval flow
 * 
 * Flow:
 * 1. User authenticates (via Clerk/Supabase)
 * 2. Component checks authorization context
 * 3. If not connected, shows approval modal
 * 4. User approves connection
 * 5. One Connector initializes and connects to Spine
 * 6. All ecosystem services become available
 */
export function AuthConnectorProvider({ children }: AuthConnectorProviderProps) {
  const {
    showModal,
    loading,
    context,
    error,
    isConnected,
    approve,
    dismiss,
  } = useConnectorApproval()

  // Log connection status for debugging
  useEffect(() => {
    if (isConnected) {
      console.log('[AuthConnector] Connected to ecosystem:', {
        userId: context?.userId,
        tenantId: context?.tenantId,
        permissions: context?.permissions,
      })
    }
  }, [isConnected, context])

  return (
    <>
      {children}
      
      {/* Show approval modal when not connected */}
      <ConnectorApprovalModal
        open={showModal && !isConnected}
        loading={loading}
        context={context}
        error={error}
        onApprove={approve}
        onDismiss={dismiss}
      />
    </>
  )
}
