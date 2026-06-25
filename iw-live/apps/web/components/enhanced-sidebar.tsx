"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BrandHeader } from "@/components/brand-header"
import {
  Home,
  FolderKanban,
  Brain,
  Webhook,
  User,
  Target,
  Megaphone,
  Package,
  Heart,
  Users,
  Gauge,
  Shield,
  Rocket,
  Settings,
  Bot,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRBAC } from "@/lib/rbac/context"
import { useDepartment } from "@/lib/department/context"
import type { Department } from "@/lib/rbac/types"

interface EnhancedSidebarProps {
  onSearchClick: () => void
  onAIClick: () => void
}

export function EnhancedSidebar({ onSearchClick, onAIClick }: EnhancedSidebarProps) {
  const pathname = usePathname()
  const [workspacesOpen, setWorkspacesOpen] = useState(true)
  const { hasPermission, hasDepartmentAccess, role } = useRBAC()
  const { activeDepartment, setActiveDepartment, availableDepartments } = useDepartment()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const renderLink = (href: string, icon: React.ReactNode, label: string, badge?: string) => {
    const active = isActive(href)
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md shadow-sidebar-primary/10"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:shadow-sm",
        )}
      >
        <span className={cn(
          "transition-all duration-200",
          active ? "scale-110 text-sidebar-primary" : "group-hover:scale-105"
        )}>
          {icon}
        </span>
        <span className="flex-1">{label}</span>
        {badge && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-semibold">
            {badge}
          </Badge>
        )}
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-r-full" />
        )}
      </Link>
    )
  }

  return (
    <aside className="w-64 bg-sidebar/95 backdrop-blur-sm flex flex-col h-full border-r border-sidebar-border/50 shadow-xl">
      <BrandHeader />

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {/* Universal Core Navigation */}
        <div className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-1">
          Core
        </div>
        {renderLink("/today", <Home className="h-5 w-5" />, "Today")}
        {renderLink("/tasks", <FolderKanban className="h-5 w-5" />, "Work Queue")}
        {renderLink("/iq-hub", <Brain className="h-5 w-5" />, "IQ Hub")}
        {renderLink("/integrations", <Webhook className="h-5 w-5" />, "Integrations")}

        <div className="h-px bg-sidebar-border my-3" />

        {/* Workspaces */}
        <div className="px-2 py-1.5">
          <button
            onClick={() => setWorkspacesOpen(!workspacesOpen)}
            className="flex items-center justify-between w-full text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider"
          >
            <span>Workspaces</span>
            {workspacesOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        </div>
        {workspacesOpen && (
          <div className="space-y-1 mb-2">
            {[
              { id: "personal" as Department, name: "Personal", icon: User },
              { id: "sales" as Department, name: "Sales", icon: Target },
              { id: "marketing" as Department, name: "Marketing", icon: Megaphone },
              { id: "product" as Department, name: "Product", icon: Package },
              { id: "cs" as Department, name: "Customer Success", icon: Heart },
            ]
              .filter((hub) => hasDepartmentAccess(hub.id))
              .map((hub) => {
                const Icon = hub.icon
                const isActive = hub.id === activeDepartment
                const isEnabled = availableDepartments.includes(hub.id)
                return (
                <button
                  key={hub.id}
                  onClick={() => isEnabled && setActiveDepartment(hub.id)}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md shadow-sidebar-primary/10"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:shadow-sm",
                    !isEnabled && "opacity-60 cursor-not-allowed"
                  )}
                  disabled={!isEnabled}
                >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{hub.name}</span>
                    </div>
                    {isActive && <ChevronUp className="h-3.5 w-3.5 opacity-70" />}
                  </button>
                )
              })}
          </div>
        )}

        <div className="h-px bg-sidebar-border my-3" />

        {/* Role-Based Views - RBAC Protected */}
        <div className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
          Role Views
        </div>
        {hasDepartmentAccess("cs") && hasPermission("read:accounts") && (
          renderLink("/cs/accounts", <Users className="h-5 w-5" />, "CS View")
        )}
        {hasDepartmentAccess("sales") && hasPermission("read:pipeline") && (
          renderLink("/pipeline", <Target className="h-5 w-5" />, "Sales View")
        )}
        {hasDepartmentAccess("marketing") && hasPermission("read:campaigns") && (
          renderLink("/campaigns", <Megaphone className="h-5 w-5" />, "Marketing View")
        )}
        {(role === "owner" || role === "admin") && (
          renderLink("/cockpit", <Gauge className="h-5 w-5" />, "Business OS")
        )}

        <div className="h-px bg-sidebar-border my-3" />

        {/* Admin & System - RBAC Protected */}
        {(hasPermission("read:admin") || hasPermission("read:governance")) && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              System
            </div>
            {hasPermission("read:admin") && (
              renderLink("/admin", <Shield className="h-5 w-5" />, "Admin")
            )}
            {hasPermission("read:governance") && (
              renderLink("/governance", <Shield className="h-5 w-5" />, "Governance")
            )}
            {(role === "owner" || role === "admin") && (
              renderLink("/release-control", <Rocket className="h-5 w-5" />, "Release Control")
            )}
          </>
        )}

        <div className="h-px bg-sidebar-border my-3" />

        {/* AI Assistant */}
        <button
          onClick={onAIClick}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200 w-full text-left group"
        >
          <Bot className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
          <span>AI Assistant</span>
        </button>

        {renderLink("/settings", <Settings className="h-5 w-5" />, "Settings")}
      </nav>

      {/* Workspace Footer */}
      <div className="p-4 border-t border-sidebar-border/50 bg-sidebar-accent/20 backdrop-blur-sm">
        <Link href="/settings" className="flex items-center gap-3 hover:opacity-90 transition-all duration-200 group rounded-xl p-2 hover:bg-sidebar-accent/30">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sidebar-primary via-sidebar-primary to-sidebar-primary/90 flex items-center justify-center shadow-lg shadow-sidebar-primary/20 group-hover:shadow-xl group-hover:shadow-sidebar-primary/30 group-hover:scale-105 transition-all duration-200">
            <span className="text-sm font-bold text-sidebar-primary-foreground">DU</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">Demo User</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">demo@integratewise.online</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
