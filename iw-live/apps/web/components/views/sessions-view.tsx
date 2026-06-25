"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Video,
  Users,
  Star,
  Search,
  Building2,
  MessageSquare,
  Target,
  Rocket,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AddSessionDialog } from "@/components/dialogs/add-session-dialog"

const typeIcons: Record<string, any> = {
  discovery: Target,
  training: Users,
  advisory: MessageSquare,
  coaching: Star,
  review: FileText,
  kickoff: Rocket,
}

const statusColors: Record<string, string> = {
  scheduled: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  "no-show": "bg-slate-500/10 text-slate-500 border-slate-500/20",
}

const typeColors: Record<string, string> = {
  discovery: "bg-purple-500/10 text-purple-400",
  training: "bg-blue-500/10 text-blue-400",
  advisory: "bg-teal-500/10 text-teal-400",
  coaching: "bg-amber-500/10 text-amber-400",
  review: "bg-slate-500/10 text-slate-400",
  kickoff: "bg-emerald-500/10 text-emerald-400",
}

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      clients(id, company, primary_contact),
      session_notes(id, type, content, is_completed)
    `)
    .order("scheduled_at", { ascending: false })
  if (error) throw error
  return data
}

export function SessionsView() {
  const { data: sessions, isLoading } = useSWR("all-sessions", fetcher)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredSessions = sessions?.filter((session: any) => {
    const matchesSearch =
      !search ||
      session.title?.toLowerCase().includes(search.toLowerCase()) ||
      session.clients?.company?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || session.status === statusFilter
    const matchesType = typeFilter === "all" || session.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const upcomingSessions = filteredSessions?.filter(
    (s: any) => s.status === "scheduled" && new Date(s.scheduled_at) >= new Date(),
  )
  const pastSessions = filteredSessions?.filter(
    (s: any) => s.status !== "scheduled" || new Date(s.scheduled_at) < new Date(),
  )

  const stats = {
    total: sessions?.length || 0,
    upcoming: sessions?.filter((s: any) => s.status === "scheduled").length || 0,
    completed: sessions?.filter((s: any) => s.status === "completed").length || 0,
    avgRating:
      sessions?.filter((s: any) => s.feedback_rating).length > 0
        ? (
            sessions.filter((s: any) => s.feedback_rating).reduce((sum: number, s: any) => sum + s.feedback_rating, 0) /
            sessions.filter((s: any) => s.feedback_rating).length
          ).toFixed(1)
        : "N/A",
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessions</h1>
          <p className="text-muted-foreground">Manage all client sessions across engagements</p>
        </div>
        <AddSessionDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold text-foreground">{stats.upcoming}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <Star className="h-6 w-6 text-teal-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold text-foreground">{stats.avgRating}/5</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all">All Types</TabsTrigger>
            <TabsTrigger value="discovery">Discovery</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="advisory">Advisory</TabsTrigger>
            <TabsTrigger value="coaching">Coaching</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          {upcomingSessions && upcomingSessions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Upcoming Sessions
              </h3>
              <div className="space-y-3">
                {upcomingSessions.map((session: any) => {
                  const Icon = typeIcons[session.type] || Calendar
                  const actionItems = session.session_notes?.filter((n: any) => n.type === "action_item") || []
                  const pendingActions = actionItems.filter((n: any) => !n.is_completed).length

                  return (
                    <Link key={session.id} href={`/clients/${session.client_id}`}>
                      <Card className="bg-card hover:bg-muted/50 transition-all cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`h-12 w-12 rounded-xl ${typeColors[session.type]} flex items-center justify-center`}
                              >
                                <Icon className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground">{session.title}</h3>
                                  <Badge variant="outline" className={statusColors[session.status]}>
                                    {session.status}
                                  </Badge>
                                  <Badge variant="outline" className={typeColors[session.type]}>
                                    {session.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {session.clients?.company}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(session.scheduled_at).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {new Date(session.scheduled_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <span>{session.duration_minutes} min</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {session.location && (
                                <a
                                  href={session.location}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                                    <Video className="h-4 w-4" />
                                    Join
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Past Sessions */}
          {pastSessions && pastSessions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Past Sessions
              </h3>
              <div className="space-y-3">
                {pastSessions.map((session: any) => {
                  const Icon = typeIcons[session.type] || Calendar
                  const actionItems = session.session_notes?.filter((n: any) => n.type === "action_item") || []
                  const pendingActions = actionItems.filter((n: any) => !n.is_completed).length

                  return (
                    <Link key={session.id} href={`/clients/${session.client_id}`}>
                      <Card className="bg-card hover:bg-muted/50 transition-all cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`h-12 w-12 rounded-xl ${typeColors[session.type]} flex items-center justify-center`}
                              >
                                <Icon className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground">{session.title}</h3>
                                  <Badge variant="outline" className={statusColors[session.status]}>
                                    {session.status}
                                  </Badge>
                                  <Badge variant="outline" className={typeColors[session.type]}>
                                    {session.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {session.clients?.company}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(session.scheduled_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              {session.feedback_rating && (
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${i < session.feedback_rating ? "text-amber-400 fill-amber-400" : "text-muted"}`}
                                    />
                                  ))}
                                </div>
                              )}
                              {pendingActions > 0 && (
                                <div className="flex items-center gap-1 text-amber-500">
                                  <AlertCircle className="h-4 w-4" />
                                  <span className="text-sm">{pendingActions} pending</span>
                                </div>
                              )}
                              {session.summary && (
                                <Badge variant="secondary" className="text-xs">
                                  Has Summary
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {filteredSessions?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No sessions found matching your filters.</div>
          )}
        </div>
      )}
    </div>
  )
}
