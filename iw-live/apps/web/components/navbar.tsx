"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronDown, Menu, User, Briefcase, HeadphonesIcon, Settings, LogOut } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

/**
 * ViewSwitcher - Lens switching component
 * Allows navigation between Personal, Business, and CS views
 */
export function ViewSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          Switch View <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/personal/home" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4 text-blue-500" />
            Personal Hub
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/business/dashboard" className="flex items-center gap-2 cursor-pointer">
            <Briefcase className="h-4 w-4 text-emerald-500" />
            Business Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/cs/tam" className="flex items-center gap-2 cursor-pointer">
            <HeadphonesIcon className="h-4 w-4 text-purple-500" />
            Customer Success
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * UserMenu - User account dropdown
 */
export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 rounded-full bg-brand/10 text-brand hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive">
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * AppNavbar - Main application navigation
 * Uses theme tokens from CSS variables
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link 
            href="/" 
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          >
            <Image
              src="/images/integrateway-logo-markonly-transparent-indigo-v1.svg"
              alt="IntegrateWise"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="text-lg font-semibold text-foreground">
              IntegrateWise
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-1 lg:flex">
            <Button variant="ghost" size="sm" asChild className="text-foreground hover:bg-muted">
              <Link href="/knowledge">Knowledge</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-foreground hover:bg-muted">
              <Link href="/integrations">Integrations</Link>
            </Button>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <ViewSwitcher />
          <UserMenu />
        </div>

        {/* Mobile menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 bg-background">
            <div className="flex flex-col gap-4 py-8">
              <Link
                href="/knowledge"
                className="px-4 py-2 text-base font-medium rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setIsOpen(false)}
              >
                Knowledge
              </Link>
              <Link
                href="/integrations"
                className="px-4 py-2 text-base font-medium rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setIsOpen(false)}
              >
                Integrations
              </Link>
              <Link
                href="/settings"
                className="px-4 py-2 text-base font-medium rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setIsOpen(false)}
              >
                Settings
              </Link>
              <Link
                href="/profile"
                className="px-4 py-2 text-base font-medium rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </Link>
              
              <div className="mt-4 border-t border-border pt-4">
                <p className="px-4 text-sm text-muted-foreground mb-2">Switch View</p>
                <Link
                  href="/personal/home"
                  className="flex items-center gap-2 px-4 py-2 text-base font-medium rounded-md text-foreground hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-4 w-4 text-blue-500" />
                  Personal Hub
                </Link>
                <Link
                  href="/business/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-base font-medium rounded-md text-foreground hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <Briefcase className="h-4 w-4 text-emerald-500" />
                  Business Dashboard
                </Link>
                <Link
                  href="/cs/tam"
                  className="flex items-center gap-2 px-4 py-2 text-base font-medium rounded-md text-foreground hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <HeadphonesIcon className="h-4 w-4 text-purple-500" />
                  Customer Success
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
