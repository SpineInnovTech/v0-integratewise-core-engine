"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Calendar,
  Clock,
  Users,
  FileText,
  Video,
  CheckCircle2,
  Circle,
  Star,
  MessageSquare,
  Plus,
  Play,
  GitBranch,
  Rocket,
  ExternalLink,
  Activity,
  Target,
  IndianRupee,
} from "lucide-react"
import Link from "next/link"

interface ClientDetailViewProps {
  clientId: string
}

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const [client, setClient] = useState<any>(null)
  const [engagements, setEngagements] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showNewSession, setShowNewSession] = useState(false)
  const [newSession, setNewSession] = useState({
    title: "",
    type: "advisory",
    scheduled_at: "",
    duration_minutes: 60,
    location: "",
    agenda: "",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchClientData()
  }, [clientId])

  async function fetchClientData() {
    setLoading(true)

    const [clientRes, engRes, sessRes, projRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase
        .from("client_engagements")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("sessions")
        .select("*, session_notes(*)")
        .eq("client_id", clientId)
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("client_projects")
        .select("*, deployments(*), project_milestones(*)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
    ])

    if (clientRes.data) setClient(clientRes.data)
    if (engRes.data) setEngagements(engRes.data)
    if (sessRes.data) setSessions(sessRes.data)
    if (projRes.data) setProjects(projRes.data)

    setLoading(false)
  }

  async function createSession() {
    const { error } = await supabase.from("sessions").insert({
      client_id: clientId,
      engagement_id: engagements[0]?.id,
      ...newSession,
      status: "scheduled",
    })

    if (!error) {
      setShowNewSession(false)
      setNewSession({ title: "", type: "advisory", scheduled_at: "", duration_minutes: 60, location: "", agenda: "" })
      fetchClientData()
    }
  }

  async function updateSessionStatus(sessionId: string, status: string) {
    await supabase.from("sessions").update({ status }).eq("id", sessionId)
    fetchClientData()
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-500/20 text-emerald-400",
      completed: "bg-blue-500/20 text-blue-400",
      scheduled: "bg-amber-500/20 text-amber-400",
      cancelled: "bg-red-500/20 text-red-400",
      in_progress: "bg-teal-500/20 text-teal-400",
      planning: "bg-purple-500/20 text-purple-400",
      pending: "bg-slate-500/20 text-slate-400",
    }
    return colors[status] || "bg-slate-500/20 text-slate-400"
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      discovery: Target,
      training: Users,
      advisory: MessageSquare,
      coaching: Star,
      review: FileText,
      kickoff: Rocket,
    }
    return icons[type] || Calendar
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-700 rounded animate-pulse" />
        <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!client) {
    return <div className="p-6 text-slate-400">Client not found</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{client.company}</h1>
              <p className="text-slate-400">
                {client.primary_contact} · {client.primary_contact_title}
              </p>
            </div>
          </div>
        </div>
        <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
        <Badge variant="outline" className="border-teal-500/50 text-teal-400">
          {client.tier}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Revenue</p>
                <p className="text-xl font-bold text-white">{formatCurrency(client.total_revenue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Health Score</p>
                <p className="text-xl font-bold text-white">{client.health_score}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Active Engagements</p>
                <p className="text-xl font-bold text-white">
                  {engagements.filter((e) => e.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Video className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Sessions</p>
                <p className="text-xl font-bold text-white">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="engagements">Engagements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Contact Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-slate-300">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span>{client.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span>{client.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Globe className="h-4 w-4 text-slate-500" />
                  <span>{client.website || "No website"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span>
                    {client.industry} · {client.size}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-slate-400">Upcoming Sessions</CardTitle>
                <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="h-4 w-4 mr-1" /> Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Schedule New Session</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Title</Label>
                        <Input
                          value={newSession.title}
                          onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                          className="bg-slate-900 border-slate-600"
                          placeholder="Session title"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-300">Type</Label>
                          <Select
                            value={newSession.type}
                            onValueChange={(v) => setNewSession({ ...newSession, type: v })}
                          >
                            <SelectTrigger className="bg-slate-900 border-slate-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="discovery">Discovery</SelectItem>
                              <SelectItem value="training">Training</SelectItem>
                              <SelectItem value="advisory">Advisory</SelectItem>
                              <SelectItem value="coaching">Coaching</SelectItem>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="kickoff">Kickoff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-slate-300">Duration (mins)</Label>
                          <Input
                            type="number"
                            value={newSession.duration_minutes}
                            onChange={(e) =>
                              setNewSession({ ...newSession, duration_minutes: Number.parseInt(e.target.value) })
                            }
                            className="bg-slate-900 border-slate-600"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300">Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={newSession.scheduled_at}
                          onChange={(e) => setNewSession({ ...newSession, scheduled_at: e.target.value })}
                          className="bg-slate-900 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Location / Link</Label>
                        <Input
                          value={newSession.location}
                          onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                          className="bg-slate-900 border-slate-600"
                          placeholder="https://zoom.us/j/..."
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Agenda</Label>
                        <Textarea
                          value={newSession.agenda}
                          onChange={(e) => setNewSession({ ...newSession, agenda: e.target.value })}
                          className="bg-slate-900 border-slate-600"
                          placeholder="Session agenda..."
                        />
                      </div>
                      <Button onClick={createSession} className="w-full bg-teal-600 hover:bg-teal-700">
                        Schedule Session
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-2">
                {sessions
                  .filter((s) => s.status === "scheduled")
                  .slice(0, 3)
                  .map((session) => {
                    const Icon = getTypeIcon(session.type)
                    return (
                      <div key={session.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-teal-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{session.title}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(session.scheduled_at).toLocaleDateString()} · {session.duration_minutes}min
                          </p>
                        </div>
                        <Badge className={getStatusColor(session.status)}>{session.type}</Badge>
                      </div>
                    )
                  })}
                {sessions.filter((s) => s.status === "scheduled").length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No upcoming sessions</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Projects */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects
                  .filter((p) => p.status !== "completed")
                  .map((project) => (
                    <div key={project.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/50">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <GitBranch className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{project.name}</p>
                        <p className="text-sm text-slate-400">
                          {project.type} · {project.tech_stack?.join(", ")}
                        </p>
                      </div>
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-teal-400">{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full">
                          <div className="h-2 bg-teal-500 rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                      {project.staging_url && (
                        <a href={project.staging_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                {projects.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No active projects</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">All Sessions</h3>
            <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-2" /> New Session
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          <div className="space-y-3">
            {sessions.map((session) => {
              const Icon = getTypeIcon(session.type)
              const notes = session.session_notes || []
              const actionItems = notes.filter((n: any) => n.type === "action_item")

              return (
                <Card key={session.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-white">{session.title}</h4>
                          <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
                          <Badge variant="outline" className="border-slate-600">
                            {session.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(session.scheduled_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.duration_minutes} mins
                          </span>
                          {session.feedback_rating && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-400" />
                              {session.feedback_rating}/5
                            </span>
                          )}
                        </div>

                        {session.summary && <p className="text-sm text-slate-300 mb-3">{session.summary}</p>}

                        {actionItems.length > 0 && (
                          <div className="mt-3 p-3 rounded-lg bg-slate-900/50">
                            <p className="text-xs font-medium text-slate-400 mb-2">
                              Action Items ({actionItems.length})
                            </p>
                            <div className="space-y-1">
                              {actionItems.slice(0, 3).map((item: any) => (
                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                  {item.is_completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-slate-500" />
                                  )}
                                  <span
                                    className={item.is_completed ? "text-slate-500 line-through" : "text-slate-300"}
                                  >
                                    {item.content}
                                  </span>
                                  {item.assigned_to && (
                                    <Badge variant="outline" className="text-xs border-slate-600">
                                      {item.assigned_to}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {session.feedback_text && (
                          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs font-medium text-amber-400 mb-1">Client Feedback</p>
                            <p className="text-sm text-slate-300">{session.feedback_text}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {session.status === "scheduled" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => updateSessionStatus(session.id, "completed")}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
                            </Button>
                            {session.location && (
                              <a href={session.location} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="border-slate-600 bg-transparent">
                                  <Video className="h-4 w-4 mr-1" /> Join
                                </Button>
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Client Projects</h3>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" /> New Project
            </Button>
          </div>

          {projects.map((project) => (
            <Card key={project.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-semibold text-white">{project.name}</h4>
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-400">{project.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.github_repo && (
                      <a href={project.github_repo} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="border-slate-600 bg-transparent">
                          <GitBranch className="h-4 w-4 mr-1" /> GitHub
                        </Button>
                      </a>
                    )}
                    {project.staging_url && (
                      <a href={project.staging_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="border-slate-600 bg-transparent">
                          <ExternalLink className="h-4 w-4 mr-1" /> Staging
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-400">Overall Progress</span>
                    <span className="text-teal-400 font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full">
                    <div
                      className="h-3 bg-teal-500 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-400">Hours Used</p>
                    <p className="text-lg font-semibold text-white">
                      {project.actual_hours}/{project.estimated_hours}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-400">Budget Spent</p>
                    <p className="text-lg font-semibold text-white">{formatCurrency(project.spent)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-400">Target Date</p>
                    <p className="text-lg font-semibold text-white">
                      {project.target_date ? new Date(project.target_date).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-400">Tech Stack</p>
                    <p className="text-sm font-medium text-white truncate">{project.tech_stack?.join(", ")}</p>
                  </div>
                </div>

                {/* Milestones */}
                {project.project_milestones && project.project_milestones.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-400 mb-2">Milestones</p>
                    <div className="space-y-2">
                      {project.project_milestones.map((milestone: any) => (
                        <div key={milestone.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50">
                          {milestone.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : milestone.status === "in_progress" ? (
                            <Play className="h-5 w-5 text-teal-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-500" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{milestone.name}</p>
                            <p className="text-xs text-slate-400">
                              Due: {new Date(milestone.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(milestone.status)}>{milestone.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Deployments */}
                {project.deployments && project.deployments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-2">Recent Deployments</p>
                    <div className="space-y-2">
                      {project.deployments.slice(0, 3).map((deploy: any) => (
                        <div key={deploy.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50">
                          <Rocket
                            className={`h-4 w-4 ${deploy.status === "success" ? "text-emerald-400" : "text-red-400"}`}
                          />
                          <div className="flex-1">
                            <p className="text-sm text-white">
                              {deploy.version} → {deploy.environment}
                            </p>
                            <p className="text-xs text-slate-400">{deploy.commit_message}</p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(deploy.deployed_at).toLocaleDateString()}
                          </span>
                          <Badge
                            className={
                              deploy.status === "success"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                            }
                          >
                            {deploy.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Engagements Tab */}
        <TabsContent value="engagements" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Engagements & Contracts</h3>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" /> New Engagement
            </Button>
          </div>

          {engagements.map((engagement) => (
            <Card key={engagement.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{engagement.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>{engagement.type}</span>
                        <span>·</span>
                        <span>{engagement.billing_cycle}</span>
                        <span>·</span>
                        <span>
                          {new Date(engagement.start_date).toLocaleDateString()} -{" "}
                          {new Date(engagement.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{formatCurrency(engagement.value)}</p>
                      <p className="text-xs text-slate-400">
                        {engagement.hours_used}/{engagement.hours_allocated} hours
                      </p>
                    </div>
                    <Badge className={getStatusColor(engagement.status)}>{engagement.status}</Badge>
                  </div>
                </div>
                {/* Hours Progress */}
                <div className="mt-4">
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div
                      className="h-2 bg-teal-500 rounded-full"
                      style={{ width: `${(engagement.hours_used / engagement.hours_allocated) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
