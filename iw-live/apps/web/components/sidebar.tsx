"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BrandHeader } from "@/components/brand-header"
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
  Layers,
  GitBranch,
  Rocket,
  Gauge,
  Brain,
  User,
  Box,
  Heart,
  ChevronUp,
} from "lucide-react"
import { useState } from "react"
import { IntegrateWiseLogo } from "@/components/integratewise-logo"
import { Badge } from "@/components/ui/badge"
import { LayerSwitcher } from "@/components/layer-switcher"

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
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const renderLink = (href: string, icon: React.ReactNode, label: string, badge?: string) => {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
          isActive(href)
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <span className={cn(
          "transition-transform duration-200",
          isActive(href) ? "scale-110" : "group-hover:scale-105"
        )}>
          {icon}
        </span>
        <span className="flex-1">{label}</span>
        {badge && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            {badge}
          </Badge>
        )}
      </Link>
    )
  }

  return (
    <aside className="w-64 bg-sidebar flex flex-col h-full border-r border-sidebar-border shadow-sm">
      <BrandHeader />

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
        {/* Universal Core Navigation (v11.0) */}
        <div className="px-2 py-1 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-1">
          Core
        </div>
        {renderLink("/today", <Home className="h-5 w-5" />, "Today")}
        {renderLink("/tasks", <FolderKanban className="h-5 w-5" />, "Work Queue")}
        {renderLink("/iq-hub", <Brain className="h-5 w-5" />, "IQ Hub")}
        {renderLink("/integrations", <Webhook className="h-5 w-5" />, "Integrations")}
        
        <div className="h-px bg-sidebar-border my-2" />
        
        {/* Hub Switcher (Relume Spec) */}
        <div className="px-2 py-1 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
          Workspaces
        </div>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mb-2">
          Switchable hubs for Sales, Marketing, Product, and CS workflows
        </div>
        {[
          { id: "personal", name: "Personal", icon: User, enabled: true, requires: null },
          { id: "sales", name: "Sales", icon: Target, enabled: false, requires: "Pro" },
          { id: "marketing", name: "Marketing", icon: Megaphone, enabled: false, requires: "Pro" },
          { id: "product", name: "Product", icon: Package, enabled: false, requires: "Pro" },
          { id: "cs", name: "Customer Success", icon: Heart, enabled: false, requires: "Enterprise" },
        ].map((hub) => {
          const Icon = hub.icon
          return (
            <button
              key={hub.id}
              className={cn(
                "flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                hub.enabled
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                !hub.enabled && "opacity-60 cursor-not-allowed"
              )}
              disabled={!hub.enabled}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span>{hub.name}</span>
              </div>
              {hub.requires && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-semibold">
                  {hub.requires}
                </Badge>
              )}
              {hub.enabled && <ChevronUp className="h-4 w-4 opacity-70" />}
            </button>
          )
        })}
        
        <div className="h-px bg-sidebar-border my-2" />
        
        {/* Role-Based Views (v11.0) */}
        <div className="px-2 py-1 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
          Role-Based Views
        </div>
        {renderLink("/cs/accounts", <Users className="h-5 w-5" />, "CS View")}
        {renderLink("/pipeline", <Target className="h-5 w-5" />, "Sales View")}
        {renderLink("/campaigns", <Megaphone className="h-5 w-5" />, "Marketing View")}
        {renderLink("/cockpit", <Gauge className="h-5 w-5" />, "Business OS")}
        
        <div className="h-px bg-sidebar-border my-2" />
        
        {/* Admin & System */}
        {renderLink("/admin", <Shield className="h-5 w-5" />, "Admin View")}
        {renderLink("/governance", <Shield className="h-5 w-5" />, "Governance")}
        {renderLink("/release-control", <Rocket className="h-5 w-5" />, "Release Control")}
        
        <div className="h-px bg-sidebar-border my-2" />
        
        {/* Additional Tools */}
        {renderLink("/architecture", <Layers className="h-5 w-5" />, "Architecture")}
        {renderLink("/data-flow", <GitBranch className="h-5 w-5" />, "Data Flow")}
        {renderLink("/strategy", <Compass className="h-5 w-5" />, "Strategic Hub")}
        {renderLink("/metrics", <BarChart3 className="h-5 w-5" />, "Metrics Dashboard")}
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
        {renderLink("/services", <Box className="h-5 w-5" />, "Services")}
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
