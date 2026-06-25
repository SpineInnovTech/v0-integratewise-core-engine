"use client"

import { useOnboardingState } from "@/lib/hooks/use-onboarding"
import { useConnections } from "@/lib/hooks/use-connections"
import { useInsights } from "@/lib/hooks/use-insights"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Target,
  ExternalLink,
  Zap,
  Loader2,
  Database,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Empty state when no tools connected
function ConnectCTA() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-lg w-full border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-12 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Connect a tool to generate AI Insights</h2>
            <p className="text-muted-foreground">
              Connect your existing tools to unlock personalized insights from your real data.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/data-sources">
              Connect Your First Tool
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// KPI Card component
function KPICard({
  label,
  value,
  trend,
  change,
  loading,
}: {
  label: string
  value: number | string
  trend: "up" | "down" | "stable"
  change: number
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    )
  }

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</span>
          {change !== 0 && (
            <span className={cn("flex items-center text-sm font-medium", trendColor)}>
              <TrendIcon className="w-4 h-4 mr-0.5" />
              {Math.abs(change)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Insight Card component
function InsightCard({
  insight,
  variant = "default",
}: {
  insight: any
  variant?: "trend" | "risk" | "opportunity" | "default"
}) {
  const icons = {
    trend: TrendingUp,
    risk: AlertTriangle,
    opportunity: Target,
    default: Lightbulb,
  }
  const colors = {
    trend: "text-blue-500 bg-blue-500/10",
    risk: "text-amber-500 bg-amber-500/10",
    opportunity: "text-green-500 bg-green-500/10",
    default: "text-primary bg-primary/10",
  }

  const Icon = icons[variant]
  const colorClass = colors[variant]

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className={cn("mt-0.5 p-2 rounded-lg shrink-0", colorClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="font-medium text-sm leading-snug">{insight.title}</p>
            {insight.recommended_actions?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {insight.recommended_actions.slice(0, 2).map((action: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {action}
                  </Badge>
                ))}
              </div>
            )}
            {insight.source_refs?.length > 0 && (
              <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground">
                <ExternalLink className="w-3 h-3 mr-1" />
                View source
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Ingesting state
function IngestingState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-lg w-full">
        <CardContent className="p-12 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Generating AI Insights...</h2>
            <p className="text-muted-foreground">
              We're analyzing your data and generating personalized insights. This usually takes less than a minute.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full animate-pulse" />
            <Skeleton className="h-2 w-2 rounded-full animate-pulse delay-75" />
            <Skeleton className="h-2 w-2 rounded-full animate-pulse delay-150" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main InsightsHome component
export function InsightsHome() {
  const { data: homeState, isLoading: stateLoading } = useOnboardingState()
  const { connections } = useConnections()
  const { data: insightsData, isLoading: insightsLoading } = useInsights()

  // Show loading skeleton
  if (stateLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  // Show connect CTA if no tools connected
  if (homeState?.onboarding_state === "unconnected") {
    return <ConnectCTA />
  }

  // Show ingesting state
  if (homeState?.onboarding_state === "ingesting") {
    return <IngestingState />
  }

  const kpis = insightsData?.kpis
  const trends = insightsData?.trends || []
  const risks = insightsData?.risks || []
  const opportunities = insightsData?.opportunities || []

  const connectedCount = connections.filter((c) => c.status === "connected").length

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground mt-1">
            Personalized insights from {connectedCount} connected tool{connectedCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/data-sources">
            <Zap className="w-4 h-4 mr-2" />
            Manage Connections
          </Link>
        </Button>
      </div>

      {/* KPIs Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard
            label="Revenue"
            value={kpis?.revenue.value || 0}
            trend={kpis?.revenue.trend || "stable"}
            change={kpis?.revenue.change || 0}
            loading={insightsLoading}
          />
          <KPICard
            label="Pipeline"
            value={kpis?.pipeline.value || 0}
            trend={kpis?.pipeline.trend || "stable"}
            change={kpis?.pipeline.change || 0}
            loading={insightsLoading}
          />
          <KPICard
            label="Active Projects"
            value={kpis?.active_projects.value || 0}
            trend={kpis?.active_projects.trend || "stable"}
            change={kpis?.active_projects.change || 0}
            loading={insightsLoading}
          />
          <KPICard
            label="Visitors"
            value={kpis?.visitors.value || 0}
            trend={kpis?.visitors.trend || "stable"}
            change={kpis?.visitors.change || 0}
            loading={insightsLoading}
          />
          <KPICard
            label="Conversions"
            value={kpis?.conversions.value || 0}
            trend={kpis?.conversions.trend || "stable"}
            change={kpis?.conversions.change || 0}
            loading={insightsLoading}
          />
        </div>
      </section>

      {/* Insights Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trends */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Trends</h2>
          </div>
          <div className="space-y-3">
            {insightsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : trends.length > 0 ? (
              trends.slice(0, 5).map((insight) => <InsightCard key={insight.id} insight={insight} variant="trend" />)
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">No trends detected yet</CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Risks */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Risks</h2>
          </div>
          <div className="space-y-3">
            {insightsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : risks.length > 0 ? (
              risks.slice(0, 5).map((insight) => <InsightCard key={insight.id} insight={insight} variant="risk" />)
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">No risks identified</CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Opportunities */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">Opportunities</h2>
          </div>
          <div className="space-y-3">
            {insightsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : opportunities.length > 0 ? (
              opportunities
                .slice(0, 5)
                .map((insight) => <InsightCard key={insight.id} insight={insight} variant="opportunity" />)
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">No opportunities found yet</CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="pt-4">
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/brainstorming">
              <Lightbulb className="w-4 h-4 mr-2" />
              Open Brainstorming
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tasks">
              View All Tasks
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
