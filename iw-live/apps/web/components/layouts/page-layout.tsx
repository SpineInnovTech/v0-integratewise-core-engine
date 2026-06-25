/**
 * Standardized Page Layout Component
 * Ensures consistent spacing, typography, and structure across all pages
 */

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: ReactNode
  className?: string
  /**
   * Page header content (title, description, actions)
   */
  header?: ReactNode
  /**
   * Whether to show the standard page padding
   * @default true
   */
  padded?: boolean
  /**
   * Maximum width of the content area
   * @default "full"
   */
  maxWidth?: "full" | "7xl" | "6xl" | "5xl" | "4xl"
}

export function PageLayout({
  children,
  className,
  header,
  padded = true,
  maxWidth = "full",
}: PageLayoutProps) {
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
        "min-h-full w-full",
        padded && "p-6",
        maxWidthClasses[maxWidth],
        maxWidth !== "full" && "mx-auto",
        className
      )}
    >
      {header && (
        <div className="mb-6 space-y-2">
          {header}
        </div>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}

/**
 * Standardized Page Header Component
 */
interface PageHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
  badge?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>
        {description && (
          <p className="text-base text-muted-foreground max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}

/**
 * Standardized Section Component
 */
interface SectionProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  headerActions?: ReactNode
}

export function Section({
  children,
  title,
  description,
  className,
  headerActions,
}: SectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description || headerActions) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h2 className="text-xl font-semibold text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}
