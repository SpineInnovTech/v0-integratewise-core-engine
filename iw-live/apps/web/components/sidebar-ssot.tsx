"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Loader2,
  CheckSquare,
  Lightbulb,
  LineChart,
  Settings,
  User,
  Webhook,
  ChevronDown,
  ChevronRight,
  BookOpen,
  BarChart3,
  Target,
  Building2,
  Megaphone,
  ShoppingBag,
  Package,
  ShoppingCart,
  Globe,
  Compass,
  FolderKanban,
  Database,
  Bot,
} from "lucide-react"
import { useState } from "react"
import { IntegrateWiseLogo } from "@/components/integratewise-logo"

interface SidebarSSOTProps {
  onSearchClick?: () => void
  onAIClick?: () => void
  /** User's onboarding state - controls progressive reveal */
  userState?: {
    hasConnectedSource: boolean
    hasCompletedOnboarding: boolean
    tier: "free" | "paid" | "enterprise"
    hubsUnlocked: string[]
  }
}

// Core Navigation (5) - Always visible after onboarding
const coreNavItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Loader", href: "/loader", icon: Loader2 },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Brainstorming", href: "/brainstorming", icon: Lightbulb },
  { name: "Insights", href: "/insights", icon: LineChart },
]

// Settings Area - Secondary navigation
const settingsItems = [
  { name: "Profile", href: "/profile", icon: User },
  { name: "Integrations", href: "/integrations", icon: Webhook },
  { name: "Settings", href: "/settings", icon: Settings },
]

// Hub families - Progressively revealed based on integrations
const hubFamilies = {
  os: [
    { name: "Knowledge Hub", href: "/knowledge", icon: BookOpen },
    { name: "Data Sources", href: "/data-sources", icon: Database },
  ],
  team: [
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Sessions", href: "/sessions", icon: Target },
  ],
  cs: [
    { name: "Clients", href: "/clients", icon: Building2 },
    { name: "Sales Hub", href: "/sales", icon: ShoppingCart },
  ],
  business: [
    { name: "Strategic Hub", href: "/strategy", icon: Compass },
    { name: "Metrics", href: "/metrics", icon: BarChart3 },
    { name: "Website", href: "/website", icon: Globe },
    { name: "Products", href: "/products", icon: ShoppingBag },
    { name: "Services", href: "/services", icon: Package },
    { name: "CRM", href: "/leads", icon: Target },
    { name: "Marketing", href: "/content", icon: Megaphone },
  ],
}

export function SidebarSSOT({ onSearchClick, onAIClick, userState }: SidebarSSOTProps) {
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hubsOpen, setHubsOpen] = useState(false)

  // Default to minimal state for new users
  const state = userState || {
    hasConnectedSource: false,
    hasCompletedOnboarding: false,
    tier: "free" as const,
    hubsUnlocked: [],
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const renderLink = (href: string, icon: React.ReactNode, label: string, disabled = false) => {
    if (disabled) {
      return (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/30 cursor-not-allowed"
          title="Complete onboarding to unlock"
        >
          {icon}
          <span className="flex-1">{label}</span>
        </div>
      )
    }

    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
          isActive(href)
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground",
        )}
      >
        {icon}
        <span className="flex-1">{label}</span>
      </Link>
    )
  }

  // Determine which hubs to show based on user state
  const visibleHubs = state.hasCompletedOnboarding
    ? [
        ...hubFamilies.os,
        ...(state.hubsUnlocked.includes("team") ? hubFamilies.team : []),
        ...(state.hubsUnlocked.includes("cs") ? hubFamilies.cs : []),
        ...(state.hubsUnlocked.includes("business") ? hubFamilies.business : []),
      ]
    : []

  return (
    <aside className="w-64 bg-sidebar flex flex-col h-full border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-5 pb-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <IntegrateWiseLogo className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-sidebar-foreground">IntegrateWise OS</h1>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {/* Core Navigation (5) - Always visible */}
        <div className="space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Core</p>
          {coreNavItems.map((item) => {
            const Icon = item.icon
            // Loader, Tasks, Brainstorming, Insights require connected source
            const requiresSource = ["Loader", "Tasks", "Brainstorming", "Insights"].includes(item.name)
            const isDisabled = requiresSource && !state.hasConnectedSource
            return (
              <div key={item.href}>{renderLink(item.href, <Icon className="h-5 w-5" />, item.name, isDisabled)}</div>
            )
          })}
        </div>

        {/* AI Assistant - Always available */}
        {onAIClick && (
          <button
            onClick={onAIClick}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground transition-colors w-full text-left"
          >
            <Bot className="h-5 w-5" />
            AI Assistant
          </button>
        )}

        {/* Hubs - Progressively revealed */}
        {visibleHubs.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => setHubsOpen(!hubsOpen)}
              className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider"
            >
              <span>Hubs</span>
              {hubsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {hubsOpen && (
              <div className="space-y-1 mt-1">
                {visibleHubs.map((item) => {
                  const Icon = item.icon
                  return <div key={item.href}>{renderLink(item.href, <Icon className="h-5 w-5" />, item.name)}</div>
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings Area - Secondary */}
        <div className="pt-4">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider"
          >
            <span>Settings</span>
            {settingsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {settingsOpen && (
            <div className="space-y-1 mt-1">
              {settingsItems.map((item) => {
                const Icon = item.icon
                return <div key={item.href}>{renderLink(item.href, <Icon className="h-5 w-5" />, item.name)}</div>
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="h-10 w-10 rounded-full bg-sidebar-muted flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-foreground">DU</span>
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">Demo User</p>
            <p className="text-xs text-sidebar-foreground/60">demo@integratewise.online</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
