"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, TrendingUp, BarChart3, FolderKanban, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

export function BusinessSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-muted/30 p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Business</h3>
      <nav className="space-y-1">
        <SidebarLink href="/clients" icon={Users} label="Clients" active={pathname === "/clients"} />
        <SidebarLink href="/pipeline" icon={TrendingUp} label="Pipeline" active={pathname === "/pipeline"} />
        <SidebarLink href="/metrics" icon={BarChart3} label="Metrics" active={pathname === "/metrics"} />
        <SidebarLink href="/projects" icon={FolderKanban} label="Projects" active={pathname === "/projects"} />
        <SidebarLink href="/spend" icon={DollarSign} label="Spend" active={pathname === "/spend"} />
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
