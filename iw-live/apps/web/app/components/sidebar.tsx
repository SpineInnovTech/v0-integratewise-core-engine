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
  Webhook,
  Package,
  Building2,
  Target,
  FolderKanban,
  ShoppingBag,
  Database,
  Megaphone,
  Lightbulb,
  ShoppingCart,
  Compass,
  Globe,
  Palette,
  Shield,
  Lock,
  HeadphonesIcon,
  Monitor,
  DollarSign,
  FlaskConical,
  TrendingUp,
  Users,
  Workflow,
  Github,
  FileText,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
import { IntegrateWiseLogo } from "@/components/integratewise-logo"

interface SidebarProps {
  onSearchClick: () => void
  onAIClick: () => void
}

const knowledgeBaseItems = [
  { name: "All Documents", href: "/knowledge", icon: BookOpen },
  { name: "Branding & Assets", href: "/knowledge/branding", icon: Palette },
  { name: "Compliance & Legal", href: "/knowledge/compliance", icon: Shield },
  { name: "Credentials & Security", href: "/knowledge/credentials", icon: Lock },
  { name: "Customer & Support", href: "/knowledge/customer-support", icon: HeadphonesIcon },
  { name: "Digital Presence & IT", href: "/knowledge/digital-it", icon: Monitor },
  { name: "Finance & Billing", href: "/knowledge/finance", icon: DollarSign },
  { name: "Innovation & R&D", href: "/knowledge/innovation", icon: FlaskConical },
  { name: "Investor Relations", href: "/knowledge/investor-relations", icon: TrendingUp },
  { name: "Marketing & Brand", href: "/knowledge/marketing", icon: Megaphone },
  { name: "Metrics & Dashboard", href: "/knowledge/metrics", icon: BarChart3 },
  { name: "Misc & General Ops", href: "/knowledge/misc-ops", icon: FolderKanban },
  { name: "SaaS & Tech", href: "/knowledge/saas-tech", icon: Database },
  { name: "Sales & Growth", href: "/knowledge/sales", icon: Target },
  { name: "Startup Launch", href: "/knowledge/startup-launch", icon: Sparkles },
  { name: "Team & Culture", href: "/knowledge/team-culture", icon: Users },
  { name: "Automations", href: "/knowledge/automations", icon: Workflow },
  { name: "GitHub & Internal", href: "/knowledge/github-internal", icon: Github },
  { name: "Product Docs & Runbooks", href: "/knowledge/product-docs", icon: FileText },
  { name: "AI Exports", href: "/knowledge/ai-exports", icon: Bot },
]

const crmItems = [
  { name: "Leads", href: "/leads" },
  { name: "Campaigns", href: "/campaigns" },
  { name: "Pipeline", href: "/pipeline" },
  { name: "Deals", href: "/deals" },
]

const marketingItems = [
  { name: "Content Library", href: "/content" },
  { name: "Campaigns", href: "/campaigns" },
]

const clientItems = [
  { name: "All Clients", href: "/clients" },
  { name: "Sessions", href: "/sessions" },
  { name: "Projects", href: "/projects" },
]

export function Sidebar({ onSearchClick, onAIClick }: SidebarProps) {
  const pathname = usePathname()
  const [knowledgeOpen, setKnowledgeOpen] = useState(false)
  const [crmOpen, setCrmOpen] = useState(false)
  const [marketingOpen, setMarketingOpen] = useState(false)
  const [clientsOpen, setClientsOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const renderLink = (href: string, icon: React.ReactNode, label: string) => {
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

  return (
    <aside className="w-64 bg-sidebar flex flex-col h-full border-r border-sidebar-border">
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
        {renderLink("/dashboard", <Home className="h-5 w-5" />, "Home")}
        {renderLink("/strategy", <Compass className="h-5 w-5" />, "Strategic Hub")}
        {renderLink("/metrics", <BarChart3 className="h-5 w-5" />, "Metrics Dashboard")}
        {renderLink("/brainstorming", <Lightbulb className="h-5 w-5" />, "Brainstorming")}
        {renderLink("/website", <Globe className="h-5 w-5" />, "Website Manager")}

        <div>
          <button
            onClick={() => setCrmOpen(!crmOpen)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/leads") || pathname === "/pipeline" || pathname === "/deals"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <Target className="h-5 w-5" />
              CRM
            </span>
            {crmOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {crmOpen && (
            <div className="ml-8 mt-1 space-y-0.5 border-l border-sidebar-border pl-4">
              {crmItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive(item.href)
                      ? "text-sidebar-primary font-medium"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setMarketingOpen(!marketingOpen)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/content") || pathname === "/campaigns"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <Megaphone className="h-5 w-5" />
              Marketing
            </span>
            {marketingOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {marketingOpen && (
            <div className="ml-8 mt-1 space-y-0.5 border-l border-sidebar-border pl-4">
              {marketingItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive(item.href)
                      ? "text-sidebar-primary font-medium"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {renderLink("/products", <ShoppingBag className="h-5 w-5" />, "Products")}
        {renderLink("/services", <Package className="h-5 w-5" />, "Services")}
        {renderLink("/sales", <ShoppingCart className="h-5 w-5" />, "Sales Hub")}

        <div>
          <button
            onClick={() => setClientsOpen(!clientsOpen)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/clients") || pathname === "/sessions" || pathname === "/projects"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <Building2 className="h-5 w-5" />
              Clients
            </span>
            {clientsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {clientsOpen && (
            <div className="ml-8 mt-1 space-y-0.5 border-l border-sidebar-border pl-4">
              {clientItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive(item.href)
                      ? "text-sidebar-primary font-medium"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {renderLink("/tasks", <FolderKanban className="h-5 w-5" />, "Tasks")}

        <div>
          <button
            onClick={() => setKnowledgeOpen(!knowledgeOpen)}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/knowledge")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <BookOpen className="h-5 w-5" />
              Knowledge Hub
            </span>
            {knowledgeOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {knowledgeOpen && (
            <div className="ml-8 mt-1 space-y-0.5 border-l border-sidebar-border pl-4 max-h-80 overflow-y-auto">
              {knowledgeBaseItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                      pathname === item.href
                        ? "text-sidebar-primary font-medium"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {renderLink("/data-sources", <Database className="h-5 w-5" />, "Data Sources")}
        {renderLink("/integrations", <Webhook className="h-5 w-5" />, "Integrations")}

        <button
          onClick={onAIClick}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground transition-colors w-full text-left"
        >
          <Bot className="h-5 w-5" />
          AI Assistant
        </button>

        {renderLink("/settings", <Settings className="h-5 w-5" />, "Settings")}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link href="/settings" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
