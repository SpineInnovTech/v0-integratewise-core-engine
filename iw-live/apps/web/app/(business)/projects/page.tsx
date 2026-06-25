"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderKanban, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Project {
  id: string
  name: string
  status: string
  health_score: number
  start_date: string
  end_date: string
  stage: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    const { data, error } = await supabase.from("projects").select("*").order("start_date", { ascending: false })

    if (!error && data) {
      setProjects(data)
    }
    setLoading(false)
  }

  const statusColors = {
    Active: "bg-blue-100 text-blue-900",
    Completed: "bg-green-100 text-green-900",
    OnHold: "bg-yellow-100 text-yellow-900",
    Cancelled: "bg-red-100 text-red-900",
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="h-8 w-8" />
            Projects
          </h1>
          <p className="text-foreground/60 mt-2">Manage active and completed projects</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">Loading projects...</CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">No projects yet</CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{project.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/60">Status</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${statusColors[project.status as keyof typeof statusColors] || "bg-gray-100"}`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/60">Health</span>
                  <span className="text-sm font-bold text-green-600">{project.health_score || 0}%</span>
                </div>
                <div className="text-xs text-foreground/50">
                  {project.start_date && new Date(project.start_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
