"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Zap, AlertTriangle, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export function CSSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-muted/30 p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">CS Operations</h3>
      <nav className="space-y-1">
        <SidebarLink href="/tam" icon={BarChart3} label="TAM Command Center" active={pathname === "/tam"} />
        <SidebarLink href="/accounts" icon={Users} label="Accounts" active={pathname === "/accounts"} />
        <SidebarLink href="/war-room" icon={Zap} label="War Room" active={pathname === "/war-room"} />
        <SidebarLink href="/risks" icon={AlertTriangle} label="Risks" active={pathname === "/risks"} />
      </nav>
    </aside>
  )
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: React.ElementType
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded px-2 py-2 text-sm transition-colors",
        active ? "bg-primary/10 text-primary font-medium" : "text-foreground/80 hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}
