"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Clock,
  Cpu,
  Shield,
  Zap,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// Fetcher
const fetcher = async (table: string) => {
  const supabase = createClient()
  const { data } = await supabase.from(table).select("*").order("created_at", { ascending: false })
  return data
}

// Account Health Card Component
function AccountHealthCard({ account, loading }: { account: any; loading?: boolean }) {
  if (loading) {
    return <Skeleton className="h-48" />
  }

  const healthColors = {
    Green: "border-green-500 bg-green-500/5",
    Amber: "border-amber-500 bg-amber-500/5",
    Red: "border-red-500 bg-red-500/5",
    Growth: "border-blue-500 bg-blue-500/5",
    Stable: "border-gray-500 bg-gray-500/5",
  }

  const healthBadgeColors = {
    Green: "bg-green-500/10 text-green-700 dark:text-green-400",
    Amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    Red: "bg-red-500/10 text-red-700 dark:text-red-400",
    Growth: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    Stable: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  }

  const daysToRenewal = account.renewal_date
    ? Math.ceil((new Date(account.renewal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const isUrgent = daysToRenewal !== null && daysToRenewal < 90

  return (
    <Link href={`/tam/${account.id}`}>
      <Card
        className={cn(
          "h-full transition-all hover:shadow-lg cursor-pointer border-l-4",
          healthColors[account.health_status],
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base mb-1">{account.account_name}</h3>
              <p className="text-xs text-muted-foreground">{account.industry}</p>
            </div>
            <Badge className={cn("text-xs font-medium", healthBadgeColors[account.health_status])}>
              {account.health_status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Technical Score</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold">{account.technical_score}</span>
                {account.technical_score >= 80 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : account.technical_score < 60 ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Adoption Score</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold">{account.adoption_score}%</span>
                {account.adoption_score >= 75 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : account.adoption_score < 50 ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Cpu className="h-3 w-3" />
                vCore Usage
              </span>
              <span className="font-medium">{account.vcores_current_usage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3 w-3" />
                Message Flow
              </span>
              <span className="font-medium">{(account.message_flow_daily / 1000).toFixed(0)}K/day</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Next ATHR
              </span>
              <span className="font-medium">
                {account.next_athr_date
                  ? new Date(account.next_athr_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                  : "Not scheduled"}
              </span>
            </div>
            {daysToRenewal !== null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Renewal
                </span>
                <span className={cn("font-medium", isUrgent && "text-amber-600 dark:text-amber-400")}>
                  {daysToRenewal} days
                </span>
              </div>
            )}
          </div>

          {account.health_status === "Red" && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium">Critical: Requires immediate attention</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

// Priority Action Item
function PriorityAction({ icon: Icon, title, subtitle, urgency, href }: any) {
  const urgencyColors = {
    critical: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400",
    high: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
    medium: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
  }

  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
          urgencyColors[urgency],
        )}
      >
        <div className="p-2 rounded-lg bg-background/50 shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs opacity-80 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </Link>
  )
}

export function TAMCommandCenter() {
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month">("week")

  // Fetch TAM data
  const { data: accounts, isLoading: accountsLoading } = useSWR("tam_accounts", () => fetcher("tam_accounts"))
  const { data: escalations } = useSWR("tam_escalations", () => fetcher("tam_escalations"))
  const { data: activities } = useSWR("tam_activities", () => fetcher("tam_activities"))
  const { data: meetings } = useSWR("tam_meetings", () => fetcher("tam_meetings"))

  // Computed metrics
  const redAccounts = accounts?.filter((a: any) => a.health_status === "Red") || []
  const amberAccounts = accounts?.filter((a: any) => a.health_status === "Amber") || []
  const greenAccounts = accounts?.filter((a: any) => a.health_status === "Green") || []
  const growthAccounts = accounts?.filter((a: any) => a.health_status === "Growth") || []

  const activeEscalations = escalations?.filter((e: any) => e.status === "Active") || []
  const openIncidents = activities?.filter((a: any) => a.activity_type === "Incident" && a.status === "Open") || []
  const upcomingMeetings = meetings?.filter((m: any) => new Date(m.scheduled_at) > new Date()) || []

  const totalARR = accounts?.reduce((sum: number, a: any) => sum + (a.arr || 0), 0) || 0
  const arrAtRisk = redAccounts.reduce((sum: number, a: any) => sum + (a.arr || 0), 0)

  // Sort accounts: Red first, then Amber, then by renewal date
  const sortedAccounts = [...(accounts || [])].sort((a, b) => {
    const healthPriority = { Red: 0, Amber: 1, Green: 2, Growth: 3, Stable: 4 }
    const aPriority = healthPriority[a.health_status as keyof typeof healthPriority] || 5
    const bPriority = healthPriority[b.health_status as keyof typeof healthPriority] || 5
    if (aPriority !== bPriority) return aPriority - bPriority
    return new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nirmal&apos;s Command Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Technical Account Management Cockpit</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 py-1">
              <Activity className="h-3 w-3 text-green-500" />
              {accounts?.length || 0} Accounts
            </Badge>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
              <Calendar className="h-4 w-4" />
              Schedule Review
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">
                  {accounts?.length || 0}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total ARR</p>
                <p className="text-xl font-bold">${(totalARR / 1000000).toFixed(1)}M</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <Badge variant="destructive" className="text-xs">
                  {redAccounts.length}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Red Accounts</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  ${(arrAtRisk / 1000000).toFixed(1)}M at risk
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-4 w-4 text-amber-500" />
                <Badge className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  {amberAccounts.length}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Amber Accounts</p>
                <p className="text-xl font-bold">Needs Attention</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-4 w-4 text-green-500" />
                <Badge className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                  {greenAccounts.length + growthAccounts.length}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Healthy</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {greenAccounts.length}G + {growthAccounts.length}Gr
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Health Cards */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Account Health Overview</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {accountsLoading
                  ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)
                  : sortedAccounts.map((account: any) => <AccountHealthCard key={account.id} account={account} />)}
              </div>
            </div>

            {/* Active Escalations */}
            {activeEscalations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Active Escalations ({activeEscalations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    {activeEscalations.map((esc: any) => {
                      const account = accounts?.find((a: any) => a.id === esc.account_id)
                      return (
                        <div
                          key={esc.id}
                          className="mb-4 last:mb-0 p-3 border border-red-500/20 rounded-lg bg-red-500/5"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{account?.account_name}</h4>
                              <p className="text-xs text-muted-foreground">{esc.trigger}</p>
                            </div>
                            <Badge variant="destructive" className="text-xs">
                              {esc.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{esc.description}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <span>
                              ARR at Risk: <strong>${(esc.mrr_at_risk / 1000).toFixed(0)}K</strong>
                            </span>
                            <span>
                              Progress: <strong>{esc.progress_percent}%</strong>
                            </span>
                            <span>
                              Days to Renewal: <strong>{esc.days_to_renewal}</strong>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Priority Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Today&apos;s Priorities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {redAccounts.length > 0 && (
                  <PriorityAction
                    icon={AlertTriangle}
                    title={`${redAccounts[0]?.account_name} - Critical`}
                    subtitle="Daily war room at 2pm"
                    urgency="critical"
                    href={`/tam/${redAccounts[0]?.id}`}
                  />
                )}
                {amberAccounts.length > 0 && (
                  <PriorityAction
                    icon={Shield}
                    title={`${amberAccounts[0]?.account_name} - Follow-up`}
                    subtitle="Check-in call in 2 days"
                    urgency="high"
                    href={`/tam/${amberAccounts[0]?.id}`}
                  />
                )}
                {openIncidents.length > 0 && (
                  <PriorityAction
                    icon={Activity}
                    title={`${openIncidents.length} Open Incidents`}
                    subtitle="Requires attention"
                    urgency="high"
                    href="/tam/activities"
                  />
                )}
                {upcomingMeetings.slice(0, 2).map((meeting: any) => {
                  const account = accounts?.find((a: any) => a.id === meeting.account_id)
                  return (
                    <PriorityAction
                      key={meeting.id}
                      icon={Calendar}
                      title={meeting.title}
                      subtitle={`${account?.account_name} - ${new Date(meeting.scheduled_at).toLocaleDateString()}`}
                      urgency="medium"
                      href={`/tam/${meeting.account_id}`}
                    />
                  )
                })}
              </CardContent>
            </Card>

            {/* Upcoming ATHRs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Upcoming ATHRs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {accounts
                    ?.filter((a: any) => a.next_athr_date && new Date(a.next_athr_date) > new Date())
                    .sort(
                      (a: any, b: any) => new Date(a.next_athr_date).getTime() - new Date(b.next_athr_date).getTime(),
                    )
                    .slice(0, 4)
                    .map((account: any) => {
                      const daysUntil = Math.ceil(
                        (new Date(account.next_athr_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                      )
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium">{account.account_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(account.next_athr_date).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {daysUntil} days
                          </Badge>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Meetings Scheduled</span>
                  <span className="text-sm font-medium">{upcomingMeetings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Open Activities</span>
                  <span className="text-sm font-medium">
                    {activities?.filter((a: any) => a.status === "Open").length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">CSM Hours Logged</span>
                  <span className="text-sm font-medium">
                    {activities?.reduce((sum: number, a: any) => sum + (a.csm_hours_spent || 0), 0).toFixed(1) || "0"}h
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
