"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Users,
  Building2,
  Briefcase,
  ListTodo,
  MessageSquare,
} from "lucide-react"
import { useToast } from "@/app/hooks/use-toast"
import { Stage2Progress } from "./stage2-progress"

interface CreamyPreviewProps {
  creamyExtractId: string
  workspaceId: string
  onApprove?: (extractionJobId?: string) => void
}

export function CreamyPreview({ creamyExtractId, workspaceId, onApprove }: CreamyPreviewProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<any>(null)
  const [approving, setApproving] = useState(false)
  const [corrections, setCorrections] = useState<Record<string, any>>({})
  const [extractionJobId, setExtractionJobId] = useState<string | null>(null)
  const [showStage2Progress, setShowStage2Progress] = useState(false)

  useEffect(() => {
    loadPreview()
  }, [creamyExtractId])

  const loadPreview = async () => {
    try {
      const response = await fetch(`/api/loader/creamy-preview?creamyExtractId=${creamyExtractId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load preview")
      }

      setPreview(result.preview)
    } catch (error: any) {
      toast({
        title: "Failed to load preview",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setApproving(true)
    try {
      // First, approve the preview
      const approveResponse = await fetch("/api/loader/creamy-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creamyExtractId,
          approved: true,
          corrections: Object.values(corrections),
          stage2Config: {
            extraction_scope: {
              accounts: "all",
              contacts: "all",
              deals: "detected_only",
              tasks: "all",
            },
          },
        }),
      })

      const approveResult = await approveResponse.json()

      if (!approveResponse.ok) {
        throw new Error(approveResult.error || "Failed to approve")
      }

      // Then, trigger Stage 2
      const stage2Response = await fetch("/api/loader/stage2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creamyExtractId,
          extractionConfig: {
            scope: {
              accounts: { enabled: true, merge_existing: true },
              contacts: { enabled: true, merge_existing: true },
              deals: { enabled: true, merge_existing: false },
              tasks: { enabled: true, merge_existing: true },
            },
            identityMapping: {
              enabled: true,
              confidenceThreshold: 0.75,
              autoMerge: false,
            },
            governance: {
              piiDetection: true,
              piiAction: "redact",
            },
          },
        }),
      })

      const stage2Result = await stage2Response.json()

      if (!stage2Response.ok) {
        throw new Error(stage2Result.error || "Failed to start Stage 2")
      }

      setExtractionJobId(stage2Result.extractionJobId)
      setShowStage2Progress(true)

      toast({
        title: "Approved for full extraction",
        description: `Stage 2 processing started (Job: ${stage2Result.extractionJobId})`,
      })

      onApprove?.(stage2Result.extractionJobId)
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setApproving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading preview...</p>
        </CardContent>
      </Card>
    )
  }

  if (!preview) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No preview data available</p>
        </CardContent>
      </Card>
    )
  }

  const entities = preview.entities || {}
  const accounts = entities.accounts || []
  const contacts = entities.contacts || []
  const deals = entities.deals || []
  const tasks = preview.tasks || []
  const threads = preview.threads || []
  const highlights = preview.highlights || []
  const sourceSummary = preview.sourceSummary || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Creamy Preview Ready
              </CardTitle>
              <CardDescription>
                Extracted in {preview.extractionTimeMs}ms • {sourceSummary.filesAnalyzed} files analyzed
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              Stage 1 Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{accounts.length}</div>
              <div className="text-sm text-muted-foreground">Accounts</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{contacts.length}</div>
              <div className="text-sm text-muted-foreground">Contacts</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{tasks.length}</div>
              <div className="text-sm text-muted-foreground">Tasks</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{deals.length}</div>
              <div className="text-sm text-muted-foreground">Deals</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Highlights */}
      {highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Key Highlights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highlights.map((highlight: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  highlight.type === "revenue_opportunity"
                    ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                    : highlight.type === "risk_signal"
                      ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                      : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {highlight.type === "revenue_opportunity" && (
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  )}
                  {highlight.type === "risk_signal" && (
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  {highlight.type === "action_required" && (
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{highlight.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{highlight.detail}</div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Confidence: {Math.round(highlight.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top Accounts */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top Accounts ({accounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accounts.slice(0, 10).map((account: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{account.name}</div>
                    {account.industry && (
                      <div className="text-sm text-muted-foreground">{account.industry}</div>
                    )}
                  </div>
                  <Badge variant="outline">
                    {Math.round(account.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Contacts */}
      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Contacts ({contacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contacts.slice(0, 10).map((contact: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    {contact.email && (
                      <div className="text-sm text-muted-foreground">{contact.email}</div>
                    )}
                    {contact.company && (
                      <div className="text-sm text-muted-foreground">{contact.company}</div>
                    )}
                  </div>
                  <Badge variant="outline">
                    {Math.round(contact.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Tasks */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Key Tasks ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.slice(0, 5).map((task: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{task.title}</div>
                    {task.dueDate && (
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={
                      task.priority === "urgent" || task.priority === "high"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hot Threads */}
      {threads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Hot Threads ({threads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {threads.slice(0, 5).map((thread: any, idx: number) => (
                <div key={idx} className="p-3 border rounded">
                  <div className="font-medium">{thread.subject}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {thread.participants.join(", ")} • {thread.messageCount} messages
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{thread.sentiment}</Badge>
                    <Badge
                      variant={thread.urgency === "high" ? "destructive" : "outline"}
                    >
                      {thread.urgency}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage 2 Progress */}
      {showStage2Progress && extractionJobId && (
        <Stage2Progress extractionJobId={extractionJobId} workspaceId={workspaceId} />
      )}

      {/* Action Buttons */}
      {!showStage2Progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1"
                size="lg"
              >
                {approving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve & Start Full Extraction
                  </>
                )}
              </Button>
              <Button variant="outline" size="lg">
                Review & Edit
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Full extraction will process all files and create complete records in your Spine
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
