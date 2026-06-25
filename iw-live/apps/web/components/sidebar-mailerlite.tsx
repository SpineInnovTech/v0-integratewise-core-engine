"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  BarChart3,
  BookOpen,
  Bot,
  Settings,
  ChevronDown,
  ChevronRight,
  Package,
  Building2,
  Target,
  Database,
  Megaphone,
  Lightbulb,
  Compass,
  Globe,
  CheckSquare,
  Sparkles,
  Search,
  ShoppingBag,
  ShoppingCart,
  Shield,
} from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { IntegrateWiseLogo } from "@/components/integratewise-logo"

interface SidebarMailerLiteProps {
  user?: {
    name: string
    email: string
    initials: string
    isAdmin?: boolean
  }
  onSearchClick?: () => void
  onAIClick?: () => void
}

type NavItem = {
  name: string
  href: string
  icon: React.ElementType
  badge?: string
  children?: { name: string; href: string }[]
}

const mainNavItems: NavItem[] = [
  { name: "Command Center", href: "/command-center", icon: Home },
  { name: "AI Insights", href: "/insights", icon: Sparkles },
  { name: "Tasks", href: "/tasks", icon: CheckSquare, badge: "7" },
  { name: "Brainstorming", href: "/brainstorming", icon: Lightbulb },
]

const businessNavItems: NavItem[] = [
  { name: "Strategic Hub", href: "/strategy", icon: Compass },
  { name: "Metrics", href: "/metrics", icon: BarChart3 },
  { name: "Sales Hub", href: "/sales", icon: ShoppingCart },
  {
    name: "CRM",
    href: "/crm",
    icon: Target,
    children: [
      { name: "Leads", href: "/leads" },
      { name: "Pipeline", href: "/pipeline" },
      { name: "Deals", href: "/deals" },
    ],
  },
  {
    name: "Clients",
    href: "/clients",
    icon: Building2,
    children: [
      { name: "All Clients", href: "/clients" },
      { name: "Sessions", href: "/sessions" },
      { name: "Projects", href: "/projects" },
    ],
  },
  { name: "Marketing", href: "/campaigns", icon: Megaphone },
  { name: "Products", href: "/products", icon: ShoppingBag },
  { name: "Services", href: "/services", icon: Package },
]

const systemNavItems: NavItem[] = [
  { name: "Website", href: "/website", icon: Globe },
  { name: "Knowledge Hub", href: "/knowledge", icon: BookOpen },
  { name: "Data Sources", href: "/data-sources", icon: Database },
  { name: "Settings", href: "/settings", icon: Settings },
]

const adminNavItems: NavItem[] = [{ name: "TAM Cockpit", href: "/tam", icon: Shield, badge: "4" }]

export function SidebarMailerLite({ user, onSearchClick, onAIClick }: SidebarMailerLiteProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const isActive = (href: string) => {
    if (href === "/command-center") return pathname === "/command-center" || pathname === "/dashboard"
    if (href === "/tam") return pathname === "/tam" || pathname.startsWith("/tam/")
    return pathname === href || pathname.startsWith(href + "/")
  }

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) => (prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]))
  }

  const NavLink = ({ item, indent = false }: { item: NavItem; indent?: boolean }) => {
    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.name)
    const active = isActive(item.href) || item.children?.some((c) => isActive(c.href))

    return (
      <div>
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(item.name)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-[18px] w-[18px]" />
              {item.name}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              indent && "pl-10",
              active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              {!indent && <Icon className="h-[18px] w-[18px]" />}
              {item.name}
            </span>
            {item.badge && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {item.badge}
              </span>
            )}
          </Link>
        )}

        {hasChildren && isExpanded && (
          <div className="mt-1 ml-3 pl-3 border-l border-border space-y-0.5">
            {item.children?.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-150",
                  isActive(child.href)
                    ? "text-primary font-medium"
                    : "text-foreground/60 hover:text-foreground hover:bg-muted/50",
                )}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="px-3 pt-6 pb-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</span>
    </div>
  )

  return (
    <aside className="w-[260px] h-screen flex flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link href="/command-center" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <IntegrateWiseLogo className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-semibold text-foreground">IntegrateWise</span>
            <span className="text-xs text-muted-foreground block -mt-0.5">Business OS</span>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1 text-sm"
            onClick={onSearchClick}
            readOnly
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {/* Main */}
        <div className="space-y-0.5">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {user?.isAdmin && (
          <>
            <SectionLabel label="Admin" />
            <div className="space-y-0.5">
              {adminNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </>
        )}

        {/* Business */}
        <SectionLabel label="Business" />
        <div className="space-y-0.5">
          {businessNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* System */}
        <SectionLabel label="System" />
        <div className="space-y-0.5">
          {systemNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* AI Assistant */}
        <div className="pt-4">
          <button
            onClick={onAIClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground transition-all duration-150"
          >
            <Bot className="h-[18px] w-[18px]" />
            AI Assistant
          </button>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-border">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{user?.initials || "NP"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || "Nirmal Prince"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || "nirmal@integratewise.com"}</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
