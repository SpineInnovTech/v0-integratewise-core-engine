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
  GitBranch,
  Rocket,
  ExternalLink,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Activity,
  Github,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AddProjectDialog } from "@/components/dialogs/add-project-dialog"

const statusColors: Record<string, string> = {
  planning: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  deployed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  on_hold: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  completed: "bg-teal-500/10 text-teal-400 border-teal-500/20",
}

const typeColors: Record<string, string> = {
  mulesoft: "bg-blue-500/10 text-blue-400",
  integration: "bg-teal-500/10 text-teal-400",
  saas: "bg-purple-500/10 text-purple-400",
  automation: "bg-amber-500/10 text-amber-400",
  training: "bg-emerald-500/10 text-emerald-400",
}

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("client_projects")
    .select(`
      *,
      clients(id, company),
      deployments(id, environment, status, deployed_at, version),
      project_milestones(id, name, status, due_date)
    `)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export function ProjectsView() {
  const { data: projects, isLoading } = useSWR("all-projects", fetcher)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredProjects = projects?.filter((project: any) => {
    const matchesSearch =
      !search ||
      project.name?.toLowerCase().includes(search.toLowerCase()) ||
      project.clients?.company?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    const matchesType = typeFilter === "all" || project.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    total: projects?.length || 0,
    inProgress: projects?.filter((p: any) => p.status === "in_progress").length || 0,
    deployed: projects?.filter((p: any) => p.status === "deployed" || p.status === "completed").length || 0,
    totalBudget: projects?.reduce((sum: number, p: any) => sum + (p.budget || 0), 0) || 0,
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">Track all client projects and deployments</p>
        </div>
        <AddProjectDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GitBranch className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Rocket className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deployed</p>
              <p className="text-2xl font-bold text-foreground">{stats.deployed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-teal-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalBudget)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="deployed">Deployed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all">All Types</TabsTrigger>
            <TabsTrigger value="mulesoft">MuleSoft</TabsTrigger>
            <TabsTrigger value="saas">SaaS</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects?.map((project: any) => {
            const latestDeployment = project.deployments?.sort(
              (a: any, b: any) => new Date(b.deployed_at).getTime() - new Date(a.deployed_at).getTime(),
            )[0]
            const pendingMilestones = project.project_milestones?.filter(
              (m: any) => m.status === "pending" || m.status === "in_progress",
            ).length

            return (
              <Link key={project.id} href={`/clients/${project.client_id}`}>
                <Card className="bg-card hover:bg-muted/50 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`h-12 w-12 rounded-xl ${typeColors[project.type]} flex items-center justify-center`}
                        >
                          <GitBranch className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{project.name}</h3>
                            <Badge variant="outline" className={statusColors[project.status]}>
                              {project.status?.replace("_", " ")}
                            </Badge>
                            <Badge variant="outline" className={typeColors[project.type]}>
                              {project.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {project.clients?.company}
                            </span>
                            {project.target_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Due {new Date(project.target_date).toLocaleDateString()}
                              </span>
                            )}
                            {project.tech_stack && (
                              <div className="flex gap-1">
                                {project.tech_stack.slice(0, 3).map((tech: string) => (
                                  <Badge key={tech} variant="secondary" className="text-xs">
                                    {tech}
                                  </Badge>
                                ))}
                                {project.tech_stack.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{project.tech_stack.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {/* Progress */}
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="text-primary">{project.progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full">
                            <div
                              className="h-2 bg-primary rounded-full transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Budget */}
                        <div className="text-center min-w-[80px]">
                          <p className="text-lg font-semibold text-foreground">{formatCurrency(project.budget || 0)}</p>
                          <p className="text-xs text-muted-foreground">Budget</p>
                        </div>

                        {/* Milestones */}
                        {pendingMilestones > 0 && (
                          <div className="flex items-center gap-1 text-amber-500">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{pendingMilestones} milestones</span>
                          </div>
                        )}

                        {/* Links */}
                        <div className="flex items-center gap-2">
                          {project.github_repo && (
                            <a
                              href={project.github_repo}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Github className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                          {project.staging_url && (
                            <a
                              href={project.staging_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                                <ExternalLink className="h-3.5 w-3.5" />
                                Staging
                              </Button>
                            </a>
                          )}
                          {project.production_url && (
                            <a
                              href={project.production_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                                <Rocket className="h-3.5 w-3.5" />
                                Live
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Latest Deployment */}
                    {latestDeployment && (
                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Latest deployment:</span>
                        <Badge variant="secondary">{latestDeployment.environment}</Badge>
                        <span className="text-muted-foreground">v{latestDeployment.version}</span>
                        <span className="text-muted-foreground">
                          {new Date(latestDeployment.deployed_at).toLocaleDateString()}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            latestDeployment.status === "success"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }
                        >
                          {latestDeployment.status}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}

          {filteredProjects?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No projects found matching your filters.</div>
          )}
        </div>
      )}
    </div>
  )
}
