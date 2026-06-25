"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check, Loader2, Sparkles, ArrowRight } from "lucide-react"

const PROCESSING_UPDATES = [
  { text: "✓ Connected to Slack", delay: 1000 },
  { text: "✓ Reading 2,347 messages", delay: 2000 },
  { text: "✓ Extracting topics and people", delay: 4000 },
  { text: "✓ Connected to Notion", delay: 5000 },
  { text: "✓ Reading 89 pages", delay: 6000 },
  { text: "✓ Processing uploaded files", delay: 8000 },
  { text: "✓ Browser Memory: 847 URLs analyzed", delay: 10000 },
  { text: "✓ Normalizing all sources", delay: 12000 },
  { text: "✓ Building knowledge graph", delay: 15000 },
  { text: "✓ Generating embeddings", delay: 18000 },
  { text: "✓ Populating The Spine", delay: 20000 },
  { text: "✓ Ready! Preparing workspace", delay: 22000 },
]

const PROGRESS_STAGES = [
  { label: "Reading sources", range: [0, 30] },
  { label: "Extracting data", range: [30, 60] },
  { label: "Normalizing", range: [60, 90] },
  { label: "Finalizing", range: [90, 100] },
]

export function AILoaderProcessingView() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [completedUpdates, setCompletedUpdates] = useState<string[]>([])
  const [currentStage, setCurrentStage] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [stats, setStats] = useState({ sources: 0, items: 0, insights: 0 })

  useEffect(() => {
    // Simulate processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsComplete(true)
          // Set stats based on selections
          const tools = JSON.parse(localStorage.getItem("integratewise_selected_tools") || "[]")
          const files = JSON.parse(localStorage.getItem("integratewise_uploaded_files") || "[]")
          const browser = localStorage.getItem("integratewise_browser_memory") === "true"
          setStats({
            sources: tools.length + (files.length > 0 ? 1 : 0) + (browser ? 1 : 0),
            items: tools.length * 500 + files.length * 10 + (browser ? 847 : 0),
            insights: Math.floor((tools.length * 500 + files.length * 10) / 10),
          })
          return 100
        }
        return prev + 0.5
      })
    }, 100)

    // Show updates
    PROCESSING_UPDATES.forEach((update) => {
      setTimeout(() => {
        setCompletedUpdates((prev) => [...prev, update.text])
      }, update.delay)
    })

    // Update progress stages
    PROGRESS_STAGES.forEach((stage, index) => {
      const [min, max] = stage.range
      const checkInterval = setInterval(() => {
        if (progress >= min && progress < max && currentStage === index) {
          setCurrentStage(index + 1)
          clearInterval(checkInterval)
        }
      }, 100)
    })

    // Auto-redirect after completion
    setTimeout(() => {
      if (isComplete) {
        // Mark onboarding as complete
        localStorage.setItem("integratewise_onboarding_complete", "true")
        router.push("/today")
      }
    }, 25000)

    return () => clearInterval(interval)
  }, [router, progress, currentStage, isComplete])

  const handleEnterWorkspace = () => {
    router.push("/today")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-6">
      <Card className="w-full max-w-3xl">
        <CardContent className="pt-12 pb-12">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {isComplete ? (
                  <Sparkles className="h-8 w-8 text-primary" />
                ) : (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                )}
              </div>
              <h1 className="text-3xl font-bold">
                {isComplete ? "✨ Your Workspace is Ready!" : "AI Loader Working Its Magic"}
              </h1>
              <p className="text-muted-foreground">
                {isComplete
                  ? "Your data has been normalized and organized"
                  : "Normalizing your data into unified intelligence..."}
              </p>
            </div>

            {!isComplete ? (
              <>
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{PROGRESS_STAGES[currentStage]?.label || "Processing..."}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {/* Progress Stages */}
                <div className="grid grid-cols-4 gap-2">
                  {PROGRESS_STAGES.map((stage, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-center ${
                        index <= currentStage ? "bg-primary/10 border border-primary/20" : "bg-muted"
                      }`}
                    >
                      <p className="text-xs font-medium">{stage.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stage.range[0]}% - {stage.range[1]}%
                      </p>
                    </div>
                  ))}
                </div>

                {/* Real-time Updates */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {completedUpdates.map((update, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">{update}</span>
                    </div>
                  ))}
                  {completedUpdates.length === 0 && (
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                      <span className="text-sm text-muted-foreground">Initializing...</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Completion Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-3xl font-bold text-primary">{stats.sources}</div>
                    <div className="text-sm text-muted-foreground mt-1">Data Sources</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-3xl font-bold text-primary">{stats.items.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground mt-1">Items Organized</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-3xl font-bold text-primary">{stats.insights}</div>
                    <div className="text-sm text-muted-foreground mt-1">Insights Generated</div>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                  <Button onClick={handleEnterWorkspace} size="lg" className="gap-2">
                    Enter Your Workspace
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">Redirecting automatically in 2 seconds...</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
