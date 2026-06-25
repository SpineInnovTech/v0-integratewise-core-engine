"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { CommandSearch } from "@/components/command-search"
import { AIAssistant } from "@/components/ai-assistant"
import { Input } from "@/components/ui/input"
import { Search, PanelLeftClose, PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { DemoBanner } from "@/components/demo-banner"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn("h-full flex-shrink-0 transition-all duration-300 ease-in-out", sidebarOpen ? "w-64" : "w-0")}
      >
        <div
          className={cn(
            "h-full w-64 transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar onSearchClick={() => setSearchOpen(true)} onAIClick={() => setAiOpen(true)} />
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DemoBanner />
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                onClick={() => setSearchOpen(true)}
                readOnly
              />
            </div>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium"
          >
            Cmd+K
          </button>

          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <AIAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  )
}
