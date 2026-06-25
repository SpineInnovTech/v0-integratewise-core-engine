"use client"

import { useState } from "react"
import { Search, Bell, HelpCircle, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { EnhancedUserMenu } from "@/components/enhanced-user-menu"
import { DepartmentSwitcher } from "@/components/department/department-switcher"
import { cn } from "@/lib/utils"

interface EnhancedHeaderProps {
  onSearchClick: () => void
  onSidebarToggle: () => void
  sidebarOpen: boolean
}

export function EnhancedHeader({ onSearchClick, onSidebarToggle, sidebarOpen }: EnhancedHeaderProps) {
  const [notifications] = useState(3) // Mock notification count

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border/50 bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/70 shadow-sm">
      <div className="flex h-full items-center px-4 gap-4">
        {/* Sidebar Toggle - Enterprise Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-muted/50"
          onClick={onSidebarToggle}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          <div className="flex flex-col gap-1.5 w-4 h-4">
            <span className={cn(
              "h-0.5 w-full bg-foreground transition-all duration-300 rounded-full",
              sidebarOpen ? "rotate-45 translate-y-2" : ""
            )} />
            <span className={cn(
              "h-0.5 w-full bg-foreground transition-all duration-300 rounded-full",
              sidebarOpen ? "opacity-0" : "opacity-100"
            )} />
            <span className={cn(
              "h-0.5 w-full bg-foreground transition-all duration-300 rounded-full",
              sidebarOpen ? "-rotate-45 -translate-y-2" : ""
            )} />
          </div>
        </Button>

        {/* Enterprise Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              placeholder="Search workspace, commands, or ask anything..."
              className="pl-10 pr-4 h-10 bg-muted/30 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all rounded-lg backdrop-blur-sm"
              onClick={onSearchClick}
              readOnly
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        {/* Department Switcher */}
        <div className="hidden md:block w-48">
          <DepartmentSwitcher />
        </div>

        {/* Enterprise Actions */}
        <div className="flex items-center gap-2">
          {/* Help */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
            title="Help & Support"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold"
                  >
                    {notifications > 9 ? "9+" : notifications}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Badge variant="secondary" className="text-xs">
                  {notifications} new
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            title="Settings"
            asChild
          >
            <a href="/settings">
              <Settings className="h-5 w-5" />
            </a>
          </Button>

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* User Menu */}
          <EnhancedUserMenu />
        </div>
      </div>
    </header>
  )
}
