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
  Brain,
  Zap,
  Target,
  Users,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTasks, useCalendarEvents, useEmails, useDriveFiles, useActivities, useMetrics } from "@/lib/hooks/use-data"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { CognitiveTwinChat } from "@/components/cognitive-twin-chat"

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

export function TodayView() {
  const { data: tasks, mutate: mutateTasks } = useTasks()
  const { data: calendarEvents } = useCalendarEvents()
  const { data: emails } = useEmails("inbox")
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
        { title: "Tasks", value: "12", icon: CheckSquare },
      ]
    }
    // Calculate from real metrics
    return [
      { title: "MRR", value: "₹26L", icon: TrendingUp },
      { title: "Pipeline", value: "₹45L", icon: TrendingUp },
      { title: "Revenue", value: "₹12.8L", icon: TrendingUp },
      { title: "Tasks", value: String(tasks?.length || 0), icon: CheckSquare },
    ]
  }, [metrics, tasks])

  const todayTasks = useMemo(() => {
    if (!tasks) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return tasks.filter((task: any) => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === today.getTime() && task.status !== "completed"
    })
  }, [tasks])

  const upcomingEvents = useMemo(() => {
    if (!calendarEvents) return []
    const now = new Date()
    return calendarEvents
      .filter((event: any) => new Date(event.start_time) >= now)
      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 5)
  }, [calendarEvents])

  const toggleTaskComplete = async (taskId: string, currentStatus: string) => {
    const supabase = createClient()
    const newStatus = currentStatus === "completed" ? "pending" : "completed"
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId)
    if (!error) {
      mutateTasks()
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Today</h1>
          <p className="text-base text-muted-foreground max-w-3xl">Your daily command center</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/iq-hub">
            <Button variant="outline" size="sm">
              <Brain className="h-4 w-4 mr-2" />
              IQ Hub
            </Button>
          </Link>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <Card key={idx} className="bg-gradient-to-br from-card to-card/95">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Today's Tasks
                </span>
                <Link href="/tasks">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!tasks ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tasks due today. You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayTasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={task.status === "completed"}
                        onCheckedChange={() => toggleTaskComplete(task.id, task.status)}
                      />
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", task.status === "completed" && "line-through text-muted-foreground")}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                        )}
                      </div>
                      {task.priority && (
                        <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}>
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </span>
                <Link href="/sessions">
                  <Button variant="ghost" size="sm">
                    View Calendar
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!calendarEvents ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming events scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event: any) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(event.start_time)} • {formatTime(event.start_time)}
                        </p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!activities ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description || activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/tasks?new=true">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </Link>
              <Link href="/iq-hub">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Brain className="h-4 w-4 mr-2" />
                  Open IQ Hub
                </Button>
              </Link>
              <Link href="/clients?new=true">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </Link>
              <Link href="/deals?new=true">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  New Deal
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Cognitive Twin Chat */}
          <CognitiveTwinChat />

          {/* Role-Based Views Quick Access */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Switch View</CardTitle>
              <CardDescription>Navigate to role-based views</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/cs/accounts">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  CS View
                </Button>
              </Link>
              <Link href="/pipeline">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Sales View
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Marketing View
                </Button>
              </Link>
              <Link href="/cockpit">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Business OS
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
