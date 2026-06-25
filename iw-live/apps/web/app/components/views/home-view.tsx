"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  CheckCircle,
  FileText,
  Mail,
  Calendar,
  CheckSquare,
  FolderOpen,
  Clock,
  MoreHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Send,
  Archive,
  Star,
  HardDrive,
  File,
  ImageIcon,
  FileSpreadsheet,
  Presentation,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTasks, useCalendarEvents, useEmails, useDriveFiles, useActivities, useMetrics } from "@/lib/hooks/use-data"
import { createClient } from "@/lib/supabase/client"
import { WebhookSchedulerWidget } from "@/components/widgets/webhook-scheduler-widget"

function getFileIcon(type: string) {
  switch (type) {
    case "spreadsheet":
      return FileSpreadsheet
    case "presentation":
      return Presentation
    case "folder":
      return FolderOpen
    case "image":
      return ImageIcon
    default:
      return File
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return "Yesterday"
  return `${diffDays} days ago`
}

// Dynamic AI insights generator based on actual data
function generateAIInsights(metrics: any[], tasks: any[], calendarEvents: any[]) {
  const insights: string[] = []
  
  if (!metrics || metrics.length === 0) {
    return ["Loading business insights...", "Analyzing your data...", "Preparing recommendations..."]
  }

  // Check MRR trend
  const mrrMetric = metrics.find((m: any) => m.metric_name === "mrr")
  if (mrrMetric) {
    const change = Number(mrrMetric.change_percentage) || 0
    if (change > 0) {
      insights.push(`MRR growing +${change}% this month`)
    } else if (change < 0) {
      insights.push(`MRR declining ${change}% - review pricing`)
    } else {
      insights.push("MRR stable - explore growth opportunities")
    }
  }

  // Check pipeline health
  const pipelineMetric = metrics.find((m: any) => m.metric_name === "pipeline")
  if (pipelineMetric) {
    const change = Number(pipelineMetric.change_percentage) || 0
    if (change < -10) {
      insights.push("Pipeline declining - urgent attention needed")
    } else if (change > 10) {
      insights.push("Pipeline growing strongly - great momentum!")
    } else {
      insights.push("Pipeline steady - focus on conversions")
    }
  }

  // Check task completion
  if (tasks && tasks.length > 0) {
    const completedTasks = tasks.filter((t: any) => t.status === "done").length
    const totalTasks = tasks.length
    const completionRate = Math.round((completedTasks / totalTasks) * 100)
    if (completionRate < 50) {
      insights.push(`Task completion at ${completionRate}% - prioritize backlog`)
    } else if (completionRate >= 80) {
      insights.push(`Excellent task completion: ${completionRate}%`)
    } else {
      insights.push(`Task completion: ${completionRate}% - on track`)
    }
  }

  // Check calendar load
  if (calendarEvents && calendarEvents.length > 0) {
    const todayEvents = calendarEvents.filter((e: any) => {
      const eventDate = new Date(e.start_time).toDateString()
      return eventDate === new Date().toDateString()
    }).length
    if (todayEvents > 5) {
      insights.push(`Heavy meeting day: ${todayEvents} events scheduled`)
    } else if (todayEvents === 0) {
      insights.push("Clear calendar - focus time available")
    }
  }

  return insights.length > 0 ? insights.slice(0, 3) : ["All systems operational", "No urgent items", "Business health: Good"]
}

// Dynamic health score calculator
function calculateHealthScore(metrics: any[], tasks: any[]) {
  if (!metrics || metrics.length === 0) {
    return { score: 0, loading: true }
  }

  let score = 5 // Base score

  // MRR contribution (up to +2 points)
  const mrrMetric = metrics.find((m: any) => m.metric_name === "mrr")
  if (mrrMetric) {
    const change = Number(mrrMetric.change_percentage) || 0
    if (change > 10) score += 2
    else if (change > 0) score += 1
    else if (change < -10) score -= 1
  }

  // Pipeline contribution (up to +2 points)
  const pipelineMetric = metrics.find((m: any) => m.metric_name === "pipeline")
  if (pipelineMetric) {
    const change = Number(pipelineMetric.change_percentage) || 0
    if (change > 10) score += 2
    else if (change > 0) score += 1
    else if (change < -10) score -= 1
  }

  // Task completion contribution (up to +1 point)
  if (tasks && tasks.length > 0) {
    const completedTasks = tasks.filter((t: any) => t.status === "done").length
    const completionRate = completedTasks / tasks.length
    if (completionRate >= 0.8) score += 1
    else if (completionRate < 0.3) score -= 1
  }

  // Clamp score between 1 and 10
  return { score: Math.max(1, Math.min(10, score)), loading: false }
}

export function HomeView() {
  const { data: tasks, isLoading: tasksLoading, mutate: mutateTasks } = useTasks()
  const { data: calendarEvents, isLoading: calendarLoading } = useCalendarEvents()
  const { data: emails, isLoading: emailsLoading } = useEmails("inbox")
  const { data: driveFiles, isLoading: filesLoading } = useDriveFiles()
  const { data: activities, isLoading: activitiesLoading } = useActivities(5)
  const { data: metrics, isLoading: metricsLoading } = useMetrics()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [emailTab, setEmailTab] = useState<"inbox" | "sent" | "archive">("inbox")

  const kpiCards = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return [
        { title: "MRR", value: "₹26L", icon: TrendingUp },
        { title: "Pipeline", value: "₹45L", icon: TrendingUp },
        { title: "Revenue", value: "₹12.8L", icon: TrendingUp },
        { title: "Active Projects", value: "3", icon: TrendingUp },
      ]
    }

    const getMetricValue = (name: string) => {
      const metric = metrics.find((m: any) => m.metric_name === name)
      if (!metric) return "—"
      const value = Number(metric.metric_value)
      if (metric.metric_unit === "currency") {
        return `₹${(value / 100000).toFixed(1)}L`
      }
      return value.toString()
    }

    return [
      { title: "MRR", value: getMetricValue("mrr"), icon: TrendingUp },
      { title: "Pipeline", value: getMetricValue("pipeline"), icon: TrendingUp },
      { title: "Revenue", value: getMetricValue("revenue"), icon: TrendingUp },
      { title: "Active Projects", value: getMetricValue("active_projects"), icon: TrendingUp },
    ]
  }, [metrics])

  const toggleTask = async (id: string, currentStatus: string) => {
    const supabase = createClient()
    const newStatus = currentStatus === "done" ? "todo" : "done"
    await supabase.from("tasks").update({ status: newStatus }).eq("id", id)
    mutateTasks()
  }

  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const pendingTaskCount = tasks?.filter((t: any) => t.status !== "done").length || 0

  // Calculate dynamic health score and AI insights
  const healthScore = useMemo(() => calculateHealthScore(metrics || [], tasks || []), [metrics, tasks])
  const aiInsights = useMemo(
    () => generateAIInsights(metrics || [], tasks || [], calendarEvents || []),
    [metrics, tasks, calendarEvents]
  )

  const renderKPICards = () => {
    if (metricsLoading) {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-secondary border-2 border-primary/30">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="bg-secondary border-2 border-primary/30 text-secondary-foreground">
            <CardContent className="p-5">
              <p className="text-sm text-secondary-foreground/70 mb-1">{kpi.title}</p>
              <p className="text-3xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">HOME</h1>
      </div>

      {/* Top Row: Health Score + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-1 h-16 rounded-full",
                healthScore.score >= 7 ? "bg-primary" : healthScore.score >= 4 ? "bg-amber-500" : "bg-rose-500"
              )} />
              <div>
                <p className="text-sm text-secondary-foreground/70">Health Score</p>
                {healthScore.loading || metricsLoading ? (
                  <Skeleton className="h-12 w-20" />
                ) : (
                  <p className="text-5xl font-bold">{healthScore.score}/10</p>
                )}
              </div>
            </div>
            <div className={cn(
              "h-12 w-12 rounded-full border-4 flex items-center justify-center ml-auto",
              healthScore.score >= 7 ? "border-primary" : healthScore.score >= 4 ? "border-amber-500" : "border-rose-500"
            )}>
              <CheckCircle className={cn(
                "h-6 w-6",
                healthScore.score >= 7 ? "text-primary" : healthScore.score >= 4 ? "text-amber-500" : "text-rose-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              AI Insights
              {metricsLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <ul className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Skeleton className="h-1.5 w-1.5 rounded-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                {aiInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      insight.toLowerCase().includes("urgent") || insight.toLowerCase().includes("declining") 
                        ? "bg-rose-500" 
                        : insight.toLowerCase().includes("great") || insight.toLowerCase().includes("excellent") || insight.toLowerCase().includes("growing")
                        ? "bg-emerald-500"
                        : "bg-foreground"
                    )} />
                    {insight}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards with loading state */}
      {renderKPICards()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Panel */}
        <Card className="bg-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                Tasks
                {tasksLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </CardTitle>
              <CardDescription>{tasksLoading ? "Loading..." : `${pendingTaskCount} pending`}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasksLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Skeleton className="h-4 w-4 rounded mt-0.5" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                ))
              : tasks?.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-colors",
                      task.status === "done" ? "bg-muted/30" : "bg-muted/50 hover:bg-muted",
                    )}
                  >
                    <Checkbox
                      checked={task.status === "done"}
                      onCheckedChange={() => toggleTask(task.id, task.status)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          task.status === "done" && "line-through text-muted-foreground",
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            task.priority === "high" && "bg-rose-500/10 text-rose-500",
                            task.priority === "medium" && "bg-amber-500/10 text-amber-500",
                            task.priority === "low" && "bg-emerald-500/10 text-emerald-500",
                          )}
                        >
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>

        {/* Calendar Panel */}
        <Card className="bg-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Calendar
                {calendarLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </CardTitle>
              <CardDescription>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
              {getDaysInMonth().map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-center text-xs py-1.5 rounded",
                    day === new Date().getDate() &&
                      selectedDate.getMonth() === new Date().getMonth() &&
                      "bg-primary text-primary-foreground font-medium",
                    day && day !== new Date().getDate() && "hover:bg-muted cursor-pointer",
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Today&apos;s Schedule</p>
              {calendarLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="w-1 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-2/3 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))
                : calendarEvents?.slice(0, 3).map((event: any) => (
                    <div key={event.id} className="flex items-center gap-2 text-sm">
                      <div
                        className={cn(
                          "w-1 h-8 rounded-full",
                          event.event_type === "meeting" && "bg-primary",
                          event.event_type === "call" && "bg-amber-500",
                          event.event_type === "break" && "bg-muted-foreground",
                          event.event_type === "focus" && "bg-emerald-500",
                        )}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(event.start_time)}</p>
                      </div>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

        {/* Email Panel */}
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email
                {emailsLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {emailsLoading ? "..." : `${emails?.filter((e: any) => !e.is_read).length || 0} new`}
              </Badge>
            </div>
            <div className="flex gap-1 mt-2">
              {[
                { id: "inbox" as const, icon: Inbox, label: "Inbox" },
                { id: "sent" as const, icon: Send, label: "Sent" },
                { id: "archive" as const, icon: Archive, label: "Archive" },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={emailTab === tab.id ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setEmailTab(tab.id)}
                >
                  <tab.icon className="h-3 w-3 mr-1" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {emailsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))
              : emails?.slice(0, 4).map((email: any) => (
                  <div
                    key={email.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors",
                      !email.is_read ? "bg-primary/5 hover:bg-primary/10" : "bg-muted/30 hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {email.is_starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                          <span className={cn("text-sm", !email.is_read && "font-semibold")}>{email.sender_name}</span>
                        </div>
                        <p className={cn("text-sm truncate", !email.is_read ? "font-medium" : "text-muted-foreground")}>
                          {email.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{email.preview}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(email.received_at)}
                      </span>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activities Panel */}
        <Card className="bg-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Activity
                {activitiesLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </CardTitle>
              <CardDescription>Your latest actions across the system</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activitiesLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-2/3 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))
              : activities?.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        activity.activity_type === "task" && "bg-emerald-500/10 text-emerald-500",
                        activity.activity_type === "email" && "bg-blue-500/10 text-blue-500",
                        activity.activity_type === "document" && "bg-amber-500/10 text-amber-500",
                        activity.activity_type === "calendar" && "bg-primary/10 text-primary",
                        activity.activity_type === "drive" && "bg-violet-500/10 text-violet-500",
                      )}
                    >
                      {activity.activity_type === "task" && <CheckSquare className="h-4 w-4" />}
                      {activity.activity_type === "email" && <Mail className="h-4 w-4" />}
                      {activity.activity_type === "document" && <FileText className="h-4 w-4" />}
                      {activity.activity_type === "calendar" && <Calendar className="h-4 w-4" />}
                      {activity.activity_type === "drive" && <HardDrive className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(activity.created_at)}</span>
                  </div>
                ))}
          </CardContent>
        </Card>

        {/* Webhook Scheduler Widget */}
        <WebhookSchedulerWidget />
      </div>

      {/* Recent Documents */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Recent Documents
            {filesLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filesLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))
              : driveFiles
                  ?.filter((f: any) => f.file_type === "document")
                  .slice(0, 3)
                  .map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20"
                    >
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">{doc.name}</span>
                    </div>
                  ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
