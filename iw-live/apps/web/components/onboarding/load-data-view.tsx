"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Plug,
  UploadCloud,
  Globe,
  SkipForward,
  Check,
  AlertTriangle,
  X,
  FileText,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const AVAILABLE_TOOLS = [
  { name: "Slack", time: "10s" },
  { name: "Salesforce", time: "15s" },
  { name: "Google Drive", time: "10s" },
  { name: "Notion", time: "10s" },
  { name: "HubSpot", time: "15s" },
  { name: "Zendesk", time: "15s" },
  { name: "GitHub", time: "15s" },
  { name: "Gmail", time: "10s" },
]

const ACCEPTED_FORMATS = [".txt", ".md", ".csv", ".json", ".pdf", ".docx", ".xlsx"]

export function LoadDataView() {
  const router = useRouter()
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [browserMemoryEnabled, setBrowserMemoryEnabled] = useState(false)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleToolToggle = (toolName: string) => {
    if (selectedTools.includes(toolName)) {
      setSelectedTools(selectedTools.filter((t) => t !== toolName))
    } else if (selectedTools.length < 2) {
      // Max 2 tools selectable
      setSelectedTools([...selectedTools, toolName])
    }
  }

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return
    const validFiles = Array.from(files).filter((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase()
      return ACCEPTED_FORMATS.includes(ext) && file.size <= 100 * 1024 * 1024 // 100MB
    })
    setUploadedFiles((prev) => [...prev, ...validFiles])
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContinue = () => {
    // Store selections
    localStorage.setItem("integratewise_selected_tools", JSON.stringify(selectedTools))
    localStorage.setItem("integratewise_uploaded_files", JSON.stringify(uploadedFiles.map((f) => f.name)))
    localStorage.setItem("integratewise_browser_memory", String(browserMemoryEnabled))
    localStorage.setItem("integratewise_load_data_done", "true")

    // Redirect to processing
    router.push("/onboarding/processing")
  }

  const handleSkip = () => {
    if (selectedTools.length === 0 && uploadedFiles.length === 0 && !browserMemoryEnabled) {
      setShowSkipConfirm(true)
    } else {
      handleContinue()
    }
  }

  const confirmSkip = () => {
    setShowSkipConfirm(false)
    // Skip with empty data
    localStorage.setItem("integratewise_selected_tools", "[]")
    localStorage.setItem("integratewise_uploaded_files", "[]")
    localStorage.setItem("integratewise_browser_memory", "false")
    router.push("/onboarding/processing")
  }

  const hasSelection = selectedTools.length > 0 || uploadedFiles.length > 0 || browserMemoryEnabled

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Load Your Data in 60 Seconds</h1>
          <p className="text-muted-foreground">Choose any combination. Add more later.</p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Connect Tools */}
          <Card className={cn("border-2", selectedTools.length > 0 && "border-primary")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plug className="h-5 w-5 text-primary" />
                  <CardTitle>Connect Tools</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">Recommended</Badge>
              </div>
              <CardDescription>One-click connections to your tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Pick 1-2 now. Connect more anytime.</p>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_TOOLS.map((tool) => {
                  const isSelected = selectedTools.includes(tool.name)
                  const canSelect = selectedTools.length < 2 || isSelected
                  return (
                    <button
                      key={tool.name}
                      onClick={() => canSelect && handleToolToggle(tool.name)}
                      disabled={!canSelect}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : canSelect
                          ? "border-border hover:border-primary/50"
                          : "border-border opacity-50 cursor-not-allowed",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{tool.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <span className="text-xs text-muted-foreground">{tool.time}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Dump Files */}
          <Card className={cn("border-2", uploadedFiles.length > 0 && "border-primary")}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-primary" />
                <CardTitle>Dump Files & Notes</CardTitle>
              </div>
              <CardDescription>Upload scattered data. We'll organize everything.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <UploadCloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag files here or click to browse
                </p>
                <Input
                  type="file"
                  multiple
                  accept={ACCEPTED_FORMATS.join(",")}
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  Browse Files
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Accepted: {ACCEPTED_FORMATS.join(", ")} (max 100MB per file)
                </p>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(index)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Browser Memory */}
          <Card className={cn("border-2", browserMemoryEnabled && "border-primary")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle>Browser Memory Fetch</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">Fastest</Badge>
              </div>
              <CardDescription>Instant context from your browsing history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Enable Browser Memory Fetch</p>
                  <p className="text-xs text-muted-foreground">Last 7 days - URLs, titles, bookmarks</p>
                </div>
                <Checkbox checked={browserMemoryEnabled} onCheckedChange={setBrowserMemoryEnabled} />
              </div>
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs font-medium mb-1">Your Privacy Guaranteed</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Data stays encrypted</li>
                  <li>• Disable anytime</li>
                  <li>• Never sell your data</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Skip */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SkipForward className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Skip For Now</CardTitle>
              </div>
              <CardDescription>Start with empty workspace (not recommended)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={handleSkip}>
                Skip
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Summary</p>
                <p className="text-xs text-muted-foreground">
                  {selectedTools.length} tools, {uploadedFiles.length} files, Browser: {browserMemoryEnabled ? "ON" : "OFF"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Estimated processing time: ~{Math.max(10, selectedTools.length * 5 + uploadedFiles.length * 2)} seconds
                </p>
              </div>
              <Button onClick={handleContinue} disabled={!hasSelection && !showSkipConfirm} size="lg">
                Continue to App
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skip Confirmation Dialog */}
        {showSkipConfirm && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle>Are you sure you want to skip?</CardTitle>
              </div>
              <CardDescription>You'll miss the instant value experience</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" onClick={() => setShowSkipConfirm(false)} className="flex-1">
                No, let me load data
              </Button>
              <Button variant="destructive" onClick={confirmSkip} className="flex-1">
                Yes, skip
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
