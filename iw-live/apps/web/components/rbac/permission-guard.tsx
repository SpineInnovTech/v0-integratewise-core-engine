"use client"

import { ReactNode } from "react"
import { useRBAC } from "@/lib/rbac/context"
import type { Permission, Department } from "@/lib/rbac/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Shield, Lock } from "lucide-react"

interface PermissionGuardProps {
  children: ReactNode
  permission?: Permission
  department?: Department
  fallback?: ReactNode
  showError?: boolean
}

export function PermissionGuard({
  children,
  permission,
  department,
  fallback,
  showError = true,
}: PermissionGuardProps) {
  const { hasPermission: checkPermission, hasDepartmentAccess: checkDepartmentAccess } = useRBAC()

  // Check permission if provided
  if (permission && !checkPermission(permission)) {
    if (fallback) return <>{fallback}</>
    if (showError) {
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this resource. Required permission: {permission}
          </AlertDescription>
        </Alert>
      )
    }
    return null
  }

  // Check department access if provided
  if (department && !checkDepartmentAccess(department)) {
    if (fallback) return <>{fallback}</>
    if (showError) {
      return (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have access to the {department} department. Contact your administrator to request access.
          </AlertDescription>
        </Alert>
      )
    }
    return null
  }

  return <>{children}</>
}
