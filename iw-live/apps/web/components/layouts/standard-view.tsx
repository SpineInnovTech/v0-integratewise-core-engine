/**
 * Standard View Wrapper
 * All view components should use this wrapper for 100% consistency
 */

import { ReactNode } from "react"
import { PageLayout, PageHeader, Section } from "./page-layout"
import { cn } from "@/lib/utils"

interface StandardViewProps {
  children: ReactNode
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
  badge?: ReactNode
  className?: string
  maxWidth?: "full" | "7xl" | "6xl" | "5xl" | "4xl"
  padded?: boolean
}

/**
 * Standard View Component
 * Use this for all page views to ensure 100% consistency
 */
export function StandardView({
  children,
  title,
  description,
  icon,
  actions,
  badge,
  className,
  maxWidth = "full",
  padded = true,
}: StandardViewProps) {
  return (
    <PageLayout
      className={className}
      maxWidth={maxWidth}
      padded={padded}
      header={
        <PageHeader
          title={title}
          description={description}
          icon={icon}
          actions={actions}
          badge={badge}
        />
      }
    >
      {children}
    </PageLayout>
  )
}

export { Section }
