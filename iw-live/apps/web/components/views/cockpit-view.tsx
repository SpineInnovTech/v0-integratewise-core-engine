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
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  CheckSquare,
  AlertTriangle,
  Lightbulb,
  Activity,
  Zap,
  Clock,
  Calendar,
  MessageSquare,
  Mail,
  Bot,
  BarChart3,
  Building2,
  FolderKanban,
  Sparkles,
  Settings,
  GitBranch,
  Brain,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { CognitiveTwinChat } from "@/components/cognitive-twin-chat"

// Fetchers
const fetcher = async (table: string, query?: any) => {
  const supabase = createClient()
  let q = supabase.from(table).select(query?.select || "*")
  if (query?.eq) q = q.eq(query.eq[0], query.eq[1])
  if (query?.limit) q = q.limit(query.limit)
  if (query?.order) q = q.order(query.order[0], { ascending: query.order[1] === "asc" })
  const { data } = await q
  return data
}

const miniChartData = [{ v: 20 }, { v: 35 }, { v: 28 }, { v: 45 }, { v: 40 }, { v: 55 }, { v: 52 }]

// Live KPI Card
function LiveKPI({
  label,
  value,
  change,
  trend,
  icon: Icon,
  href,
  loading,
  showChart,
}: {
  label: string
  value: string
  change?: number
  trend?: "up" | "down" | "stable"
  icon: any
  href: string
  loading?: boolean
  showChart?: boolean
}) {
  if (loading) {
    return <Skeleton className="h-28 w-full rounded-xl" />
  }

  return (
    <Link href={href}>
      <Card className="h-28 hover:border-primary/50 transition-all cursor-pointer group">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            {showChart && (
              <div className="w-16 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={miniChartData}>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.1)"
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{value}</span>
              {change !== undefined && (
                <span
                  className={cn(
                    "text-xs font-medium flex items-center",
                    trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground",
                  )}
                >
                  {trend === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : trend === "down" ? (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  ) : null}
                  {Math.abs(change)}%
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Activity Feed Item
function ActivityItem({ icon: Icon, title, time, type }: { icon: any; title: string; time: string; type: string }) {
  const colors: Record<string, string> = {
    task: "text-blue-500 bg-blue-500/10",
    deal: "text-green-500 bg-green-500/10",
    client: "text-purple-500 bg-purple-500/10",
    alert: "text-amber-500 bg-amber-500/10",
    insight: "text-primary bg-primary/10",
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={cn("p-2 rounded-lg shrink-0", colors[type] || colors.insight)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  )
}

// Quick Action Button
function QuickAction({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <Link href={href}>
      <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-10 bg-transparent">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{label}</span>
      </Button>
    </Link>
  )
}

// System Status Indicator
function SystemStatus({
  name,
  status,
  lastSync,
}: { name: string; status: "connected" | "syncing" | "error"; lastSync: string }) {
  const statusColors = {
    connected: "bg-green-500",
    syncing: "bg-amber-500 animate-pulse",
    error: "bg-red-500",
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full", statusColors[status])} />
        <span className="text-sm">{name}</span>
      </div>
      <span className="text-xs text-muted-foreground">{lastSync}</span>
    </div>
  )
}

export function CockpitView() {
  const [activeTab, setActiveTab] = useState<"overview" | "insights" | "alerts">("overview")

  // Live data fetching
  const { data: clients, isLoading: clientsLoading } = useSWR("clients", () => fetcher("clients"))
  const { data: deals, isLoading: dealsLoading } = useSWR("deals", () => fetcher("deals"))
  const { data: tasks, isLoading: tasksLoading } = useSWR("tasks", () =>
    fetcher("tasks", { eq: ["status", "pending"] }),
  )
  const { data: opportunities, isLoading: oppsLoading } = useSWR("opportunities", () => fetcher("opportunities"))
  const { data: subscriptions } = useSWR("subscriptions", () => fetcher("subscriptions", { eq: ["status", "active"] }))
  const { data: projects } = useSWR("projects", () => fetcher("projects", { eq: ["status", "active"] }))
  const { data: insights } = useSWR("daily_insights", () =>
    fetcher("daily_insights", { limit: 5, order: ["created_at", "desc"] }),
  )

  const isLoading = clientsLoading || dealsLoading || tasksLoading || oppsLoading

  // Computed metrics
  const totalClients = clients?.length || 0
  const activeDeals = deals?.filter((d: any) => d.status === "active")?.length || 0
  const pendingTasks = tasks?.length || 0
  const pipelineValue = opportunities?.reduce((sum: number, o: any) => sum + (o.value || 0), 0) || 0
  const mrr = subscriptions?.reduce((sum: number, s: any) => sum + (s.mrr || 0), 0) || 0
  const activeProjects = projects?.length || 0

  const formatCurrency = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n}`
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Nirmal's Cockpit</h1>
            <p className="text-base text-muted-foreground max-w-3xl">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
              Nirmal. Business OS - Your command center.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 py-1">
              <Activity className="h-3 w-3 text-green-600 dark:text-green-400" />
              All Systems Live
            </Badge>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Admin
              </Button>
            </Link>
            <Link href="/release-control">
              <Button variant="outline" size="sm" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Releases
              </Button>
            </Link>
            <Button size="sm" className="gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-4">
          {[
            { id: "overview", label: "Overview" },
            { id: "insights", label: "AI Insights" },
            { id: "alerts", label: "Alerts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <LiveKPI
            label="MRR"
            value={formatCurrency(mrr || 540000)}
            change={12}
            trend="up"
            icon={DollarSign}
            href="/metrics"
            loading={isLoading}
            showChart
          />
          <LiveKPI
            label="Pipeline"
            value={formatCurrency(pipelineValue || 12800000)}
            change={8}
            trend="up"
            icon={Target}
            href="/pipeline"
            loading={isLoading}
            showChart
          />
          <LiveKPI
            label="Active Clients"
            value={String(totalClients || 10)}
            change={5}
            trend="up"
            icon={Building2}
            href="/clients"
            loading={isLoading}
          />
          <LiveKPI
            label="Open Deals"
            value={String(activeDeals || 4)}
            icon={BarChart3}
            href="/deals"
            loading={isLoading}
          />
          <LiveKPI
            label="Pending Tasks"
            value={String(pendingTasks || 7)}
            icon={CheckSquare}
            href="/tasks"
            loading={isLoading}
          />
          <LiveKPI
            label="Active Projects"
            value={String(activeProjects || 3)}
            icon={FolderKanban}
            href="/projects"
            loading={isLoading}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Focus */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Today's Focus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights?.slice(0, 3).map((insight: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {insight.title || "Focus on converting HealthPlus opportunity"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {insight.summary || "High priority deal worth ₹1.2Cr in negotiation stage"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )) || (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-lg bg-green-500/10 shrink-0">
                        <Target className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Follow up with TechCorp India</p>
                        <p className="text-xs text-muted-foreground mt-1">Contract renewal due in 5 days</p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-lg bg-amber-500/10 shrink-0">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Review MuleSoft project milestone</p>
                        <p className="text-xs text-muted-foreground mt-1">Phase 2 deliverables pending review</p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
                        <Users className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Onboard EduTech Ventures</p>
                        <p className="text-xs text-muted-foreground mt-1">New client kickoff scheduled for today</p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* System Overview Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Pipeline Stages</span>
                    <Link href="/pipeline" className="text-xs text-primary hover:underline">
                      View all
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { stage: "Discovery", count: 2, value: "₹45L" },
                    { stage: "Qualification", count: 1, value: "₹28L" },
                    { stage: "Proposal", count: 3, value: "₹72L" },
                    { stage: "Negotiation", count: 1, value: "₹35L" },
                  ].map((item) => (
                    <div key={item.stage} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm">{item.stage}</span>
                        <Badge variant="secondary" className="text-xs">
                          {item.count}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Team Utilization</span>
                    <Link href="/metrics" className="text-xs text-primary hover:underline">
                      Details
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { team: "Consulting", value: 85 },
                    { team: "Implementation", value: 92 },
                    { team: "Support", value: 68 },
                  ].map((item) => (
                    <div key={item.team}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.team}</span>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            item.value > 80 ? "bg-green-500/80" : item.value > 60 ? "bg-amber-500/80" : "bg-red-500/80",
                          )}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Cognitive Twin Chat */}
            <CognitiveTwinChat />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <QuickAction icon={CheckSquare} label="New Task" href="/tasks?new=true" />
                <QuickAction icon={Target} label="Add Deal" href="/deals?new=true" />
                <QuickAction icon={Users} label="Add Client" href="/clients?new=true" />
                <QuickAction icon={Brain} label="IQ Hub" href="/iq-hub" />
                <QuickAction icon={Calendar} label="Schedule" href="/sessions" />
                <QuickAction icon={Mail} label="Compose" href="/campaigns?new=true" />
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Recent Activity</span>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64 px-4">
                  <ActivityItem
                    icon={CheckSquare}
                    title="Task completed: Review MuleSoft docs"
                    time="10 min ago"
                    type="task"
                  />
                  <ActivityItem icon={Target} title="Deal moved to Negotiation" time="25 min ago" type="deal" />
                  <ActivityItem icon={Users} title="New client: EduTech Ventures" time="1 hour ago" type="client" />
                  <ActivityItem
                    icon={Sparkles}
                    title="AI Insight: Revenue trend up 15%"
                    time="2 hours ago"
                    type="insight"
                  />
                  <ActivityItem
                    icon={AlertTriangle}
                    title="Alert: Invoice overdue - FitServ"
                    time="3 hours ago"
                    type="alert"
                  />
                  <ActivityItem
                    icon={MessageSquare}
                    title="Slack message from TechCorp"
                    time="4 hours ago"
                    type="task"
                  />
                </ScrollArea>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  Connected Systems
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                <SystemStatus name="Supabase" status="connected" lastSync="Live" />
                <SystemStatus name="Stripe" status="connected" lastSync="2 min ago" />
                <SystemStatus name="Slack" status="connected" lastSync="5 min ago" />
                <SystemStatus name="HubSpot" status="syncing" lastSync="Syncing..." />
                <SystemStatus name="Google Analytics" status="connected" lastSync="15 min ago" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
