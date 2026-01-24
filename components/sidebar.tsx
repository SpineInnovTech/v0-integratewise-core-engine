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
  Layers,
  GitBranch,
} from "lucide-react"
import { useState } from "react"
import { IntegrateWiseLogo } from "@/components/integratewise-logo"

interface SidebarProps {
  onSearchClick: () => void
  onAIClick: () => void
}

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

  const renderLink = (href: string, icon: React.ReactNode, label: string) => {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
          isActive(href)
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-sidebar-foreground",
        )}
      >
        {icon}
        <span className="flex-1">{label}</span>
        {isActive(href) && <div className="w-1 h-5 bg-sidebar-primary rounded-full" />}
      </Link>
    )
  }

  return (
    <aside className="w-full md:w-64 bg-sidebar flex flex-col h-full border-r border-sidebar-border overflow-hidden">
      <div className="p-4 pb-4 border-b border-sidebar-border flex-shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#3F3182] to-[#E94B8A] flex items-center justify-center shadow-sm flex-shrink-0">
            <IntegrateWiseLogo className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-sidebar-foreground truncate">IntegrateWise OS</h1>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain touch-pan-y">
        {renderLink("/", <Home className="h-4.5 w-4.5 flex-shrink-0" />, "Home")}
        {renderLink("/architecture", <Layers className="h-4.5 w-4.5 flex-shrink-0" />, "Architecture")}
        {renderLink("/data-flow", <GitBranch className="h-4.5 w-4.5 flex-shrink-0" />, "Data Flow")}
        {renderLink("/strategy", <Compass className="h-4.5 w-4.5 flex-shrink-0" />, "Strategic Hub")}
        {renderLink("/metrics", <BarChart3 className="h-4.5 w-4.5 flex-shrink-0" />, "Metrics Dashboard")}
        {renderLink("/brainstorming", <Lightbulb className="h-4.5 w-4.5 flex-shrink-0" />, "Brainstorming")}
        {renderLink("/website", <Globe className="h-4.5 w-4.5 flex-shrink-0" />, "Website Manager")}

        <div>
          <button
            onClick={() => setCrmOpen(!crmOpen)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              pathname.startsWith("/leads") || pathname === "/pipeline" || pathname === "/deals"
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-sidebar-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <Target className="h-4.5 w-4.5 flex-shrink-0" />
              CRM
            </span>
            {crmOpen ? <ChevronDown className="h-4 w-4 opacity-60" /> : <ChevronRight className="h-4 w-4 opacity-60" />}
          </button>
          {crmOpen && (
            <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-4">
              {[
                { name: "Leads", href: "/leads" },
                { name: "Campaigns", href: "/campaigns" },
                { name: "Pipeline", href: "/pipeline" },
                { name: "Deals", href: "/deals" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive(item.href)
                      ? "text-sidebar-primary font-medium bg-sidebar-accent/50"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-muted/50",
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
              "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              pathname.startsWith("/content") || pathname === "/campaigns"
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-sidebar-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <Megaphone className="h-4.5 w-4.5 flex-shrink-0" />
              Marketing
            </span>
            {marketingOpen ? (
              <ChevronDown className="h-4 w-4 opacity-60" />
            ) : (
              <ChevronRight className="h-4 w-4 opacity-60" />
            )}
          </button>
          {marketingOpen && (
            <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-4">
              {[
                { name: "Content Library", href: "/content" },
                { name: "Campaigns", href: "/campaigns" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive(item.href)
                      ? "text-sidebar-primary font-medium bg-sidebar-accent/50"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-muted/50",
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {renderLink("/products", <ShoppingBag className="h-4.5 w-4.5 flex-shrink-0" />, "Products")}
        {renderLink("/services", <Package className="h-4.5 w-4.5 flex-shrink-0" />, "Services")}
        {renderLink("/sales", <ShoppingCart className="h-4.5 w-4.5 flex-shrink-0" />, "Sales Hub")}

        <div>
          <button
            onClick={() => setClientsOpen(!clientsOpen)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              pathname.startsWith("/clients") || pathname === "/sessions" || pathname === "/projects"
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-sidebar-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <Building2 className="h-4.5 w-4.5 flex-shrink-0" />
              Clients
            </span>
            {clientsOpen ? (
              <ChevronDown className="h-4 w-4 opacity-60" />
            ) : (
              <ChevronRight className="h-4 w-4 opacity-60" />
            )}
          </button>
          {clientsOpen && (
            <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-4">
              {[
                { name: "All Clients", href: "/clients" },
                { name: "Sessions", href: "/sessions" },
                { name: "Projects", href: "/projects" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive(item.href)
                      ? "text-sidebar-primary font-medium bg-sidebar-accent/50"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-muted/50",
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {renderLink("/tasks", <FolderKanban className="h-4.5 w-4.5 flex-shrink-0" />, "Tasks")}

        <div>
          <button
            onClick={() => setKnowledgeOpen(!knowledgeOpen)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              pathname.startsWith("/knowledge")
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-sidebar-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <BookOpen className="h-4.5 w-4.5 flex-shrink-0" />
              Knowledge Hub
            </span>
            {knowledgeOpen ? (
              <ChevronDown className="h-4 w-4 opacity-60" />
            ) : (
              <ChevronRight className="h-4 w-4 opacity-60" />
            )}
          </button>
          {knowledgeOpen && (
            <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-4 max-h-60 overflow-y-auto overscroll-contain">
              {[
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
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                      pathname === item.href
                        ? "text-sidebar-primary font-medium bg-sidebar-accent/50"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-muted/50",
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

        {renderLink("/data-sources", <Database className="h-4.5 w-4.5 flex-shrink-0" />, "Data Sources")}
        {renderLink("/integrations", <Webhook className="h-4.5 w-4.5 flex-shrink-0" />, "Integrations")}

        {renderLink("/admin", <Shield className="h-4.5 w-4.5 flex-shrink-0" />, "Admin Console")}

        <button
          onClick={onAIClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-sidebar-foreground transition-all duration-150 w-full text-left"
        >
          <Bot className="h-4.5 w-4.5 flex-shrink-0" />
          AI Assistant
        </button>

        {renderLink("/settings", <Settings className="h-4.5 w-4.5 flex-shrink-0" />, "Settings")}
      </nav>

      <div className="p-3 border-t border-sidebar-border flex-shrink-0">
        <Link
          href="/settings"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-muted transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-sidebar-border flex-shrink-0">
            <span className="text-sm font-semibold text-sidebar-primary">DU</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Demo User</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">demo@integratewise.online</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
