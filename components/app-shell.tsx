"use client"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { CommandSearch } from "@/components/command-search"
import { AIAssistant } from "@/components/ai-assistant"
import { Input } from "@/components/ui/input"
import { Search, PanelLeftClose, PanelLeft, X, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { DemoBanner } from "@/components/demo-banner"

interface AppShellProps {
  children: ReactNode
}

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function AppShell({ children }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">("desktop")

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < MOBILE_BREAKPOINT) {
        setScreenSize("mobile")
        setSidebarOpen(false) // Auto-fold on mobile
        setMobileDrawerOpen(false)
      } else if (width < TABLET_BREAKPOINT) {
        setScreenSize("tablet")
        setSidebarOpen(false) // Auto-fold on tablet (icon-only available)
      } else {
        setScreenSize("desktop")
        setSidebarOpen(true) // Auto-expand on desktop
      }
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  const handleSidebarToggle = () => {
    if (screenSize === "mobile") {
      setMobileDrawerOpen(!mobileDrawerOpen)
    } else {
      setSidebarOpen(!sidebarOpen)
    }
  }

  const handleMobileNavClick = () => {
    if (screenSize === "mobile") {
      setMobileDrawerOpen(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {screenSize === "mobile" && mobileDrawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileDrawerOpen(false)} />
      )}

      {screenSize === "mobile" && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar transform transition-transform duration-300 ease-in-out lg:hidden",
            mobileDrawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <span className="text-base font-semibold text-sidebar-foreground">Menu</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileDrawerOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div onClick={handleMobileNavClick}>
            <Sidebar
              onSearchClick={() => {
                setSearchOpen(true)
                setMobileDrawerOpen(false)
              }}
              onAIClick={() => {
                setAiOpen(true)
                setMobileDrawerOpen(false)
              }}
            />
          </div>
        </aside>
      )}

      {screenSize !== "mobile" && (
        <aside
          className={cn(
            "h-full flex-shrink-0 transition-all duration-300 ease-in-out hidden md:block",
            sidebarOpen ? "w-64" : "w-0",
          )}
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
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DemoBanner />
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleSidebarToggle}
            title={screenSize === "mobile" ? "Open menu" : sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {screenSize === "mobile" ? (
              <Menu className="h-4 w-4" />
            ) : sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search anything..."
                className="pl-9 h-9 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                onClick={() => setSearchOpen(true)}
                readOnly
              />
            </div>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium border border-border/50 hover:bg-muted/80 transition-colors"
          >
            <kbd className="font-mono">⌘</kbd>
            <kbd className="font-mono">K</kbd>
          </button>

          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <AIAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  )
}
