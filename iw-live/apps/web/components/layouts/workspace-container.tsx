/**
 * Workspace Container Component
 * Provides rich workspace feel with proper spacing and layout
 */

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface WorkspaceContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: "full" | "7xl" | "6xl" | "5xl" | "4xl"
}

export function WorkspaceContainer({
  children,
  className,
  maxWidth = "full",
}: WorkspaceContainerProps) {
  const maxWidthClasses = {
    full: "max-w-full",
    "7xl": "max-w-7xl",
    "6xl": "max-w-6xl",
    "5xl": "max-w-5xl",
    "4xl": "max-w-4xl",
  }

  return (
    <div
      className={cn(
        "workspace-container",
        maxWidthClasses[maxWidth],
        maxWidth !== "full" && "mx-auto",
        "px-6 py-8",
        className
      )}
    >
      {children}
    </div>
  )
}
