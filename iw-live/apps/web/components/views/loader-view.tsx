"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/app/hooks/use-toast"
import {
  Upload,
  Link2,
  Globe,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { TemplateBYOT } from "@/components/loader/template-byot"
import { CreamyPreview } from "@/components/loader/creamy-preview"

interface LoaderRun {
  id: string
  source: string
  status: "running" | "completed" | "failed"
  itemsProcessed: number
  itemsCreated: number
  itemsUpdated: number
  itemsSkipped: number
  startedAt: string
  completedAt?: string
}

const mockLoaderRuns: LoaderRun[] = [
  {
    id: "1",
    source: "slack",
    status: "completed",
    itemsProcessed: 156,
    itemsCreated: 42,
    itemsUpdated: 12,
    itemsSkipped: 102,
    startedAt: "2026-01-10T10:00:00Z",
    completedAt: "2026-01-10T10:02:30Z",
  },
  {
    id: "2",
    source: "hubspot",
    status: "completed",
    itemsProcessed: 89,
    itemsCreated: 23,
    itemsUpdated: 8,
    itemsSkipped: 58,
    startedAt: "2026-01-10T09:30:00Z",
    completedAt: "2026-01-10T09:31:45Z",
  },
]

export function LoaderView() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("ingest")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [inputSourceId, setInputSourceId] = useState<string | null>(null)
  const [creamyExtractId, setCreamyExtractId] = useState<string | null>(null)
  const [extractionJobId, setExtractionJobId] = useState<string | null>(null)
  const [workspaceId] = useState("current-workspace") // TODO: Get from context

  const handleSync = async (source: string) => {
    setIsLoading(true)
    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  const handleFileUpload = async () => {
    setUploadProgress(0)
    
    // Simulate file upload
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // TODO: Actual file upload implementation
    // After upload, create input source and trigger Stage 1
    try {
      // const formData = new FormData()
      // formData.append('file', file)
      // const response = await fetch('/api/loader/input-source', {
      //   method: 'POST',
      //   body: formData
      // })
      // const result = await response.json()
      // setInputSourceId(result.inputSourceId)
      // 
      // // Trigger Stage 1
      // const stage1Response = await fetch('/api/loader/stage1', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ inputSourceId: result.inputSourceId })
      // })
      // const stage1Result = await stage1Response.json()
      // setCreamyExtractId(stage1Result.creamyExtractId)
      // setActiveTab('preview')
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Loader</h1>
        <p className="text-muted-foreground mt-1">Import, normalize, and structure your data from any source</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="ingest">Data Ingest</TabsTrigger>
          <TabsTrigger value="history">Sync History</TabsTrigger>
          <TabsTrigger value="preview">Preview Mode</TabsTrigger>
          <TabsTrigger value="byot">BYOT Templates</TabsTrigger>
        </TabsList>

        {/* Data Ingest Tab */}
        <TabsContent value="ingest" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Data Dump */}
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Data Dump</CardTitle>
                    <CardDescription>Upload files or paste data</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors"
                  onClick={handleFileUpload}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drop CSV, JSON, or Excel files here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tool Connection */}
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Link2 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Tool Connection</CardTitle>
                    <CardDescription>Connect to existing tools</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleSync("slack")}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  <img src="/slack-logo.png" alt="Slack" className="h-5 w-5 mr-2" />
                  Slack
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleSync("hubspot")}
                  disabled={isLoading}
                >
                  <img src="/hubspot-logo.png" alt="HubSpot" className="h-5 w-5 mr-2" />
                  HubSpot
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleSync("notion")}
                  disabled={isLoading}
                >
                  <img src="/notion-logo.png" alt="Notion" className="h-5 w-5 mr-2" />
                  Notion
                </Button>
              </CardContent>
            </Card>

            {/* Browser Capture */}
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Globe className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Browser Capture</CardTitle>
                    <CardDescription>Capture from browser memory</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Capture conversations, notes, and data directly from your browser tabs.
                </p>
                <Button variant="outline" className="w-full bg-transparent">
                  <Globe className="h-4 w-4 mr-2" />
                  Start Capture
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Sync</CardTitle>
              <CardDescription>Sync all connected sources at once</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={() => handleSync("all")} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Sync All Sources
                </Button>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Schedule Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Loader Runs</CardTitle>
              <CardDescription>History of data normalization operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockLoaderRuns.map((run) => (
                  <div key={run.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{run.source}</p>
                        <p className="text-sm text-muted-foreground">{new Date(run.startedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm">
                          <span className="text-green-600">+{run.itemsCreated}</span>
                          {" / "}
                          <span className="text-blue-600">~{run.itemsUpdated}</span>
                          {" / "}
                          <span className="text-muted-foreground">{run.itemsSkipped} skipped</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{run.itemsProcessed} items processed</p>
                      </div>
                      <Badge
                        variant={
                          run.status === "completed"
                            ? "default"
                            : run.status === "running"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {run.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {run.status === "running" && <Clock className="h-3 w-3 mr-1" />}
                        {run.status === "failed" && <AlertCircle className="h-3 w-3 mr-1" />}
                        {run.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Mode Tab */}
        <TabsContent value="preview" className="space-y-4">
          {creamyExtractId ? (
            <CreamyPreview
              creamyExtractId={creamyExtractId}
              workspaceId={workspaceId}
              onApprove={(jobId) => {
                if (jobId) {
                  setExtractionJobId(jobId)
                }
                toast({
                  title: "Full extraction started",
                  description: "Processing all files in the background",
                })
                setActiveTab("history")
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Preview Mode</CardTitle>
                <CardDescription>See how your data will be normalized before committing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-6 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Upload or connect a data source to see a preview of the normalized output
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Stage 1 processing takes ~60 seconds and shows you a preview before full extraction
                  </p>
                  <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setActiveTab("ingest")}>
                    Upload Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* BYOT Template Tab */}
        <TabsContent value="byot" className="space-y-4">
          <TemplateBYOT workspaceId="current-workspace" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
