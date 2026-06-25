"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Database,
  Users,
  Briefcase,
  ListTodo,
} from "lucide-react"

interface Stage2ProgressProps {
  extractionJobId: string
  workspaceId: string
}

export function Stage2Progress({ extractionJobId, workspaceId }: Stage2ProgressProps) {
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJobStatus()
    const interval = setInterval(loadJobStatus, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [extractionJobId])

  const loadJobStatus = async () => {
    try {
      const response = await fetch(`/api/loader/stage2?extractionJobId=${extractionJobId}`)
      const result = await response.json()

      if (response.ok && result.job) {
        setJob(result.job)

        // Stop polling if completed or failed
        if (result.job.status === "completed" || result.job.status === "failed") {
          setLoading(false)
        }
      }
    } catch (error) {
      console.error("Failed to load job status:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading job status...</p>
        </CardContent>
      </Card>
    )
  }

  const progress = job.progress || {}
  const overallPercent = progress.overall_percent || 0
  const currentPhase = progress.current_phase || "initializing"
  const results = job.results || {}

  const phaseIcons: Record<string, any> = {
    initializing: Loader2,
    extracting: Database,
    mapping_identities: Users,
    applying_governance: AlertCircle,
    rendering: Briefcase,
    syncing_byot: CheckCircle2,
    completed: CheckCircle2,
  }

  const PhaseIcon = phaseIcons[currentPhase] || Clock

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PhaseIcon
                className={`h-6 w-6 ${
                  job.status === "completed"
                    ? "text-green-600"
                    : job.status === "failed"
                      ? "text-red-600"
                      : "text-blue-600 animate-spin"
                }`}
              />
              <div>
                <CardTitle>
                  Stage 2: Full Extraction
                  {job.status === "completed" && " - Complete"}
                  {job.status === "failed" && " - Failed"}
                </CardTitle>
                <CardDescription>
                  Job ID: {extractionJobId.slice(0, 8)}...
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={
                job.status === "completed"
                  ? "default"
                  : job.status === "failed"
                    ? "destructive"
                    : "secondary"
              }
            >
              {job.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{Math.round(overallPercent)}%</span>
              </div>
              <Progress value={overallPercent} className="h-2" />
            </div>

            {/* Current Phase */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Current Phase:</span>
              <span className="font-medium capitalize">{currentPhase.replace(/_/g, " ")}</span>
            </div>

            {/* Results */}
            {job.status === "completed" && results.entitiesCreated && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">{results.entitiesCreated.accounts || 0}</div>
                  <div className="text-xs text-muted-foreground">Accounts</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">{results.entitiesCreated.contacts || 0}</div>
                  <div className="text-xs text-muted-foreground">Contacts</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">{results.entitiesCreated.deals || 0}</div>
                  <div className="text-xs text-muted-foreground">Deals</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xl font-bold">{results.entitiesCreated.tasks || 0}</div>
                  <div className="text-xs text-muted-foreground">Tasks</div>
                </div>
              </div>
            )}

            {/* Errors */}
            {job.errors && job.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-900 dark:text-red-100">
                    {job.errors.length} Error(s) Occurred
                  </span>
                </div>
                <div className="space-y-1">
                  {job.errors.slice(0, 3).map((error: any, idx: number) => (
                    <div key={idx} className="text-sm text-red-700 dark:text-red-300">
                      {error.phase}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase Details */}
      {progress.phases && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Phase Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(progress.phases).map(([phase, details]: [string, any]) => (
                <div key={phase} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm capitalize">{phase.replace(/_/g, " ")}</span>
                  <Badge variant={details.status === "completed" ? "default" : "outline"}>
                    {details.status || "pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
