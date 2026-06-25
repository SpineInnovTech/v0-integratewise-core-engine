"use client"

import Link from "next/link"
import Image from "next/image"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrandHeaderProps {
  className?: string
  collapsed?: boolean
}

export function BrandHeader({ className, collapsed = false }: BrandHeaderProps) {
  return (
    <Link
      href="/today"
      className={cn(
        "flex items-center gap-3 px-3 py-4 border-b border-sidebar-border transition-all duration-200 hover:bg-sidebar-accent/50",
        collapsed && "justify-center px-2",
        className
      )}
    >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25",
              "transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105",
              collapsed && "w-8 h-8"
            )}>
              <Sparkles className={cn("h-5 w-5", collapsed && "h-4 w-4")} />
            </div>
      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
            IntegrateWise
          </span>
          <span className="text-xs text-sidebar-foreground/60 font-medium">
            Enterprise OS
          </span>
        </div>
      )}
    </Link>
  )
}
