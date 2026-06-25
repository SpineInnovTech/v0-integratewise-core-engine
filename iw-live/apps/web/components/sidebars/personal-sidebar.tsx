"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CheckSquare, BookOpen, Target, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

export function PersonalSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-muted/30 p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Personal</h3>
      <nav className="space-y-1">
        <SidebarLink href="/home" icon={Home} label="Home" active={pathname === "/home"} />
        <SidebarLink href="/today" icon={CheckSquare} label="Today" active={pathname === "/today"} />
        <SidebarLink href="/goals" icon={Target} label="Goals" active={pathname === "/goals"} />
        <SidebarLink href="/knowledge" icon={BookOpen} label="Knowledge" active={pathname === "/knowledge"} />
        <SidebarLink href="/brain" icon={Brain} label="Brain" active={pathname === "/brain"} />
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
