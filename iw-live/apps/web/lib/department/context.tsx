"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { Department } from "../rbac/types"
import { DEPARTMENT_ROUTES } from "../rbac/types"

interface DepartmentContextValue {
  activeDepartment: Department
  setActiveDepartment: (department: Department) => void
  availableDepartments: Department[]
  getDepartmentRoutes: (department: Department) => string[]
}

const DepartmentContext = createContext<DepartmentContextValue | undefined>(undefined)

interface DepartmentProviderProps {
  children: ReactNode
  defaultDepartment?: Department
  availableDepartments?: Department[]
}

export function DepartmentProvider({
  children,
  defaultDepartment = "personal",
  availableDepartments: providedDepartments,
}: DepartmentProviderProps) {
  const [activeDepartment, setActiveDepartmentState] = useState<Department>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("integratewise_active_department") as Department
      return stored || defaultDepartment
    }
    return defaultDepartment
  })

  // Get available departments from RBAC or use provided
  const [availableDepartments] = useState<Department[]>(
    providedDepartments || ["personal", "sales", "marketing", "product", "cs"],
  )

  useEffect(() => {
    const stored = localStorage.getItem("integratewise_active_department") as Department
    if (stored && availableDepartments.includes(stored)) {
      setActiveDepartmentState(stored)
    }
  }, [availableDepartments])

  const setActiveDepartment = (department: Department) => {
    if (availableDepartments.includes(department)) {
      setActiveDepartmentState(department)
      localStorage.setItem("integratewise_active_department", department)
    }
  }

  const getDepartmentRoutes = (department: Department): string[] => {
    return DEPARTMENT_ROUTES[department] || []
  }

  const value: DepartmentContextValue = {
    activeDepartment,
    setActiveDepartment,
    availableDepartments,
    getDepartmentRoutes,
  }

  return <DepartmentContext.Provider value={value}>{children}</DepartmentContext.Provider>
}

export function useDepartment() {
  const context = useContext(DepartmentContext)
  if (context === undefined) {
    throw new Error("useDepartment must be used within a DepartmentProvider")
  }
  return context
}
