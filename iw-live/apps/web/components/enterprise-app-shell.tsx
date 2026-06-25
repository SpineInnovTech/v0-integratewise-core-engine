"use client"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { EnhancedSidebar } from "@/components/enhanced-sidebar"
import { CommandSearch } from "@/components/command-search"
import { AIAssistant } from "@/components/ai-assistant"
import { cn } from "@/lib/utils"
import { DemoBanner } from "@/components/demo-banner"
import { EnhancedHeader } from "@/components/enhanced-header"
import { EnterpriseFooter } from "@/components/enterprise-footer"

interface EnterpriseAppShellProps {
  children: ReactNode
  showFooter?: boolean
}

export function EnterpriseAppShell({ children, showFooter = false }: EnterpriseAppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const pathname = usePathname()
  
  // Sidebar state - view-aware: some views default to collapsed for better content visibility
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Views that benefit from collapsed sidebar (more screen space for data tables)
    const collapsedViews = ["/cs/accounts", "/cs/contacts", "/cs/meetings"]
    return !collapsedViews.some((view) => pathname?.startsWith(view))
  })

  // Update sidebar state when pathname changes (view-aware collapse)
  useEffect(() => {
    // Views that should default to collapsed sidebar for better content visibility
    const collapsedViews = ["/cs/accounts", "/cs/contacts", "/cs/meetings"]
    const shouldCollapse = collapsedViews.some((view) => pathname?.startsWith(view))
    
    // Auto-adjust sidebar based on view, but user can still manually toggle
    setSidebarOpen(!shouldCollapse)
  }, [pathname])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Enterprise Sidebar */}
      <aside
        className={cn(
          "h-full flex-shrink-0 transition-all duration-300 ease-in-out border-r border-sidebar-border",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        <div
          className={cn(
            "h-full w-64 transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <EnhancedSidebar 
            onSearchClick={() => setSearchOpen(true)} 
            onAIClick={() => setAiOpen(true)} 
          />
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DemoBanner />
        <EnhancedHeader
          onSearchClick={() => setSearchOpen(true)}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-auto bg-background">
          <div className="min-h-full">
            {children}
          </div>
          {showFooter && <EnterpriseFooter />}
        </main>
      </div>
      
      {/* Enterprise Modals */}
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <AIAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  )
}
