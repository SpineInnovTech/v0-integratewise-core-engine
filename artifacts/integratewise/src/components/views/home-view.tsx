
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTasks, useCalendarEvents, useDriveFiles, useActivities, useMetrics } from "@/lib/hooks/use-data"
import { useGmailInbox } from "@/platform/gateway-email"
import { SOURCE_META } from "@/platform/data-source"
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

const aiInsights = ["Revenue on track", "Pipeline declining urgent", "DM response down"]

export function HomeView() {
  const { data: tasks, mutate: mutateTasks } = useTasks()
  const { data: calendarEvents } = useCalendarEvents()
  const emailResource = useGmailInbox()
  const emails = emailResource.data
  const { data: driveFiles } = useDriveFiles()
  const { data: activities } = useActivities(5)
  const { data: metrics } = useMetrics()

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
      const metric = metrics.find((m: any) => m.metric_name === name) as any
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

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1 font-medium">IntegrateWise's internal operations at a glance.</p>
        </div>
      </div>

      {/* Top Row: Health Score + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <CheckCircle className="w-32 h-32" />
          </div>
          <CardContent className="p-8 relative z-10">
            <p className="text-primary-foreground/80 font-medium tracking-wide uppercase text-sm mb-6">System Health</p>
            <div className="flex items-end gap-3">
              <p className="text-6xl font-light tracking-tighter">8<span className="text-3xl text-primary-foreground/60">/10</span></p>
            </div>
            <p className="text-primary-foreground/90 mt-4 text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              All systems nominal
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border shadow-sm">
          <CardHeader className="pb-2 border-b border-border/50 px-6 py-4">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Intelligence Brief
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {aiInsights.map((insight, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-4 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="bg-card border shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-muted-foreground tracking-wide">{kpi.title}</p>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground">
                  <kpi.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-light tracking-tight text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tasks Panel */}
        <Card className="bg-card border shadow-sm flex flex-col">
          <CardHeader className="px-6 py-5 border-b border-border/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Tasks</CardTitle>
                <CardDescription className="text-xs">{pendingTaskCount} pending actions</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-secondary">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-border/50">
            {!tasks
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-12 w-full" /></div>)
              : tasks.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 p-4 transition-colors hover:bg-secondary/50",
                      task.status === "done" && "opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={task.status === "done"}
                      onCheckedChange={() => toggleTask(task.id, task.status)}
                      className="mt-1 rounded-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium text-foreground",
                          task.status === "done" && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase tracking-wider font-semibold border-none px-2 py-0.5 rounded-full",
                            task.priority === "high" && "bg-rose-500/10 text-rose-600",
                            task.priority === "medium" && "bg-amber-500/10 text-amber-600",
                            task.priority === "low" && "bg-emerald-500/10 text-emerald-600",
                          )}
                        >
                          {task.priority}
                        </Badge>
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(task.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Panel */}
        <Card className="bg-card border shadow-sm flex flex-col">
          <CardHeader className="px-6 py-5 border-b border-border/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Schedule</CardTitle>
                <CardDescription className="text-xs">
                  {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-secondary rounded-full p-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-1 mb-6">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div key={i} className="text-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase py-1">
                  {day}
                </div>
              ))}
              {getDaysInMonth().map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-center text-sm py-2 rounded-full font-medium transition-colors",
                    day === new Date().getDate() &&
                      selectedDate.getMonth() === new Date().getMonth() &&
                      "bg-primary text-primary-foreground shadow-sm",
                    day && day !== new Date().getDate() && "hover:bg-secondary cursor-pointer text-foreground",
                    !day && "text-transparent"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Upcoming</p>
              <div className="space-y-4">
              {!calendarEvents
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                : calendarEvents.slice(0, 3).map((event: any) => (
                    <div key={event.id} className="flex items-center gap-4">
                      <div className="w-12 text-right">
                        <span className="text-xs font-semibold text-muted-foreground">{formatTime(event.start_time)}</span>
                      </div>
                      <div
                        className={cn(
                          "w-1 h-10 rounded-full",
                          event.event_type === "meeting" && "bg-blue-500",
                          event.event_type === "call" && "bg-amber-500",
                          event.event_type === "break" && "bg-muted",
                          event.event_type === "focus" && "bg-emerald-500",
                        )}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{event.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{event.event_type}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Panel */}
        <Card className="bg-card border shadow-sm flex flex-col">
          <CardHeader className="px-6 py-5 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Inbox</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-2">
                    Connected to <span className="font-medium text-foreground">{SOURCE_META[emailResource.source]?.label}</span>
                  </CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-bold shadow-sm">
                {emails?.filter((e) => !e.is_read).length || 0}
              </Badge>
            </div>
            <div className="flex gap-1 p-1 bg-secondary rounded-lg">
              {[
                { id: "inbox" as const, icon: Inbox, label: "Inbox" },
                { id: "sent" as const, icon: Send, label: "Sent" },
                { id: "archive" as const, icon: Archive, label: "Archive" },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={emailTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex-1 h-8 text-xs font-medium rounded-md",
                    emailTab === tab.id ? "shadow-sm bg-background text-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => setEmailTab(tab.id)}
                >
                  <tab.icon className="h-3 w-3 mr-1.5" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-border/50">
            {emailResource.state === "loading" &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4"><Skeleton className="h-16 w-full" /></div>
              ))}
            {emailResource.state === "error" && (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
                  <Mail className="w-6 h-6 opacity-50" />
                </div>
                <p className="text-sm font-medium text-foreground">Connection Error</p>
                <p className="text-xs text-muted-foreground mt-1">{emailResource.error}</p>
              </div>
            )}
            {emailResource.state === "empty" && (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-foreground">You're all caught up</p>
                <p className="text-xs text-muted-foreground mt-1">No new messages in inbox</p>
              </div>
            )}
            {emailResource.state === "ready" &&
              emails!.slice(0, 4).map((email) => (
                <div
                  key={email.id}
                  className={cn(
                    "p-4 transition-colors hover:bg-secondary/50 cursor-pointer flex gap-4",
                    !email.is_read ? "bg-primary/5" : "bg-transparent"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0 uppercase">
                    {email.sender_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={cn("text-sm text-foreground truncate", !email.is_read ? "font-bold" : "font-medium")}>
                        {email.sender_name}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(email.received_at)}
                      </span>
                    </div>
                    <p className={cn("text-xs truncate mb-1 text-foreground", !email.is_read ? "font-semibold" : "font-medium")}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      {email.preview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activities Panel */}
        <Card className="bg-card border shadow-sm">
          <CardHeader className="px-6 py-5 border-b border-border/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Activity Feed</CardTitle>
                <CardDescription className="text-xs">Recent cross-platform events</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
            {!activities
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              : activities.map((activity: any, i: number) => (
                  <div key={activity.id} className="relative flex gap-4">
                    {i !== activities.length - 1 && (
                      <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-border"></div>
                    )}
                    <div
                      className={cn(
                        "relative z-10 w-8 h-8 rounded-full border-2 border-background flex items-center justify-center shrink-0 shadow-sm",
                        activity.activity_type === "task" && "bg-emerald-100 text-emerald-600",
                        activity.activity_type === "email" && "bg-blue-100 text-blue-600",
                        activity.activity_type === "document" && "bg-amber-100 text-amber-600",
                        activity.activity_type === "calendar" && "bg-indigo-100 text-indigo-600",
                        activity.activity_type === "drive" && "bg-violet-100 text-violet-600",
                      )}
                    >
                      {activity.activity_type === "task" && <CheckSquare className="h-3 w-3" />}
                      {activity.activity_type === "email" && <Mail className="h-3 w-3" />}
                      {activity.activity_type === "document" && <FileText className="h-3 w-3" />}
                      {activity.activity_type === "calendar" && <Calendar className="h-3 w-3" />}
                      {activity.activity_type === "drive" && <HardDrive className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap bg-secondary px-2 py-0.5 rounded-full">
                          {formatRelativeTime(activity.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Webhook Scheduler Widget */}
        <WebhookSchedulerWidget />
      </div>

      {/* Recent Documents */}
      <Card className="bg-card border shadow-sm">
        <CardHeader className="px-6 py-5 border-b border-border/50">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-500" />
            Recent Files
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {!driveFiles
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              : driveFiles
                  .filter((f: any) => f.file_type === "document")
                  .slice(0, 3)
                  .map((doc: any) => (
                    <div
                      key={doc.id}
                      className="group flex flex-col gap-3 p-4 rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-sm cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <FileText className="h-5 w-5" />
                        </div>
                        <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground block truncate">{doc.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1 block">Document</span>
                      </div>
                    </div>
                  ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
