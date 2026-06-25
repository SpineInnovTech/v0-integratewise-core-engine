'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react'
import type { ConnectorAuthorizationContext, ConnectorApprovalResponse } from '@/lib/auth/connector-approval'

interface ConnectorApprovalModalProps {
  open: boolean
  loading: boolean
  context?: ConnectorAuthorizationContext
  error?: string
  onApprove: () => Promise<void>
  onDismiss: () => void
}

export function ConnectorApprovalModal({
  open,
  loading,
  context,
  error,
  onApprove,
  onDismiss,
}: ConnectorApprovalModalProps) {
  const [isApproving, setIsApproving] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      await onApprove()
    } finally {
      setIsApproving(false)
    }
  }

  if (loading || !context) {
    return (
      <Dialog open={open} onOpenChange={onDismiss}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Connecting to IntegrateWise...</DialogTitle>
            <DialogDescription>
              Initializing the ecosystem connection
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onDismiss}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Connection Error
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={onDismiss} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onDismiss}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500" />
            <DialogTitle>Connect to Ecosystem</DialogTitle>
          </div>
          <DialogDescription>
            Approve connection to IntegrateWise Continuity Bridge
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* User Info */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Your Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{context.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{context.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tenant:</span>
                <span className="font-medium">{context.tenantId}</span>
              </div>
              {context.isAdmin && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="secondary">Administrator</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Granted Permissions</h3>
            <div className="flex flex-wrap gap-2">
              {context.permissions.map((permission) => (
                <Badge key={permission} variant="outline">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {permission}
                </Badge>
              ))}
            </div>
          </div>

          {/* What You'll Access */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Connected Services</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Authentication & Identity</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Database & Storage</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>AI & Agents</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>20+ External Integrations</span>
              </li>
            </ul>
          </div>

          {/* Security Notice */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium mb-1">🔒 Secure Connection</p>
            <p>
              This connection is encrypted and monitored via Spine architecture.
              Your permissions are scoped and revocable at any time.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onDismiss}
            variant="outline"
            disabled={isApproving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            className="flex-1"
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve & Connect
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
