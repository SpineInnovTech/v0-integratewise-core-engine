"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { Role, Permission, Department } from "./types"
import { hasPermission, hasDepartmentAccess, getRoleDepartments } from "./types"

interface RBACContextValue {
  role: Role
  setRole: (role: Role) => void
  hasPermission: (permission: Permission) => boolean
  hasDepartmentAccess: (department: Department) => boolean
  departments: Department[]
  isLoading: boolean
}

const RBACContext = createContext<RBACContextValue | undefined>(undefined)

interface RBACProviderProps {
  children: ReactNode
  defaultRole?: Role
}

export function RBACProvider({ children, defaultRole = "member" }: RBACProviderProps) {
  const [role, setRole] = useState<Role>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("integratewise_user_role") as Role
      return stored || defaultRole
    }
    return defaultRole
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real app, fetch user role from API/database
    // For now, we'll use localStorage
    const storedRole = localStorage.getItem("integratewise_user_role") as Role
    if (storedRole) {
      setRole(storedRole)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    localStorage.setItem("integratewise_user_role", role)
  }, [role])

  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(role, permission)
  }

  const checkDepartmentAccess = (department: Department): boolean => {
    return hasDepartmentAccess(role, department)
  }

  const departments = getRoleDepartments(role)

  const value: RBACContextValue = {
    role,
    setRole,
    hasPermission: checkPermission,
    hasDepartmentAccess: checkDepartmentAccess,
    departments,
    isLoading,
  }

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>
}

export function useRBAC() {
  const context = useContext(RBACContext)
  if (context === undefined) {
    throw new Error("useRBAC must be used within a RBACProvider")
  }
  return context
}
