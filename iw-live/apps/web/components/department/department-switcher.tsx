"use client"

import { useDepartment } from "@/lib/department/context"
import { useRBAC } from "@/lib/rbac/context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Target, Megaphone, Package, Heart, Code, DollarSign, Users, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Department } from "@/lib/rbac/types"

const DEPARTMENT_ICONS: Record<Department, typeof User> = {
  personal: User,
  sales: Target,
  marketing: Megaphone,
  product: Package,
  cs: Heart,
  engineering: Code,
  finance: DollarSign,
  hr: Users,
}

const DEPARTMENT_LABELS: Record<Department, string> = {
  personal: "Personal",
  sales: "Sales",
  marketing: "Marketing",
  product: "Product",
  cs: "Customer Success",
  engineering: "Engineering",
  finance: "Finance",
  hr: "Human Resources",
}

export function DepartmentSwitcher() {
  const { activeDepartment, setActiveDepartment, availableDepartments } = useDepartment()
  const { hasDepartmentAccess } = useRBAC()

  const ActiveIcon = DEPARTMENT_ICONS[activeDepartment]

  // Filter departments based on RBAC access
  const accessibleDepartments = availableDepartments.filter((dept) => hasDepartmentAccess(dept))

  if (accessibleDepartments.length <= 1) {
    // Only one department, no need for switcher
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-full justify-between border-border bg-background hover:bg-muted",
            "text-sm font-medium text-foreground",
          )}
        >
          <div className="flex items-center gap-2">
            <ActiveIcon className="h-4 w-4" />
            <span>{DEPARTMENT_LABELS[activeDepartment]}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Department</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accessibleDepartments.map((dept) => {
          const Icon = DEPARTMENT_ICONS[dept]
          const isActive = dept === activeDepartment
          return (
            <DropdownMenuItem
              key={dept}
              onClick={() => setActiveDepartment(dept)}
              className={cn(
                "cursor-pointer",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{DEPARTMENT_LABELS[dept]}</span>
              {isActive && (
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  Active
                </Badge>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
