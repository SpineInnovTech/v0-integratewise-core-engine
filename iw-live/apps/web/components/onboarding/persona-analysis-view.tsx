"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Loader2 } from "lucide-react"

// 20 Persona Types from Relume Spec
const PERSONA_TYPES = [
  "Strategic Orchestrator",
  "Detail-Oriented Analyst",
  "Creative Synthesizer",
  "Rapid Executor",
  "Collaborative Facilitator",
  "Data-Driven Optimizer",
  "Big Picture Visionary",
  "Methodical Builder",
  "Adaptive Problem Solver",
  "Relationship Cultivator",
  "Technical Deep-Diver",
  "Cross-Functional Connector",
  "Process Innovator",
  "Customer Champion",
  "Growth Hacker",
  "Quality Guardian",
  "Learning Explorer",
  "Crisis Manager",
  "Systems Thinker",
  "Entrepreneurial Driver",
]

const ANALYSIS_STEPS = [
  { text: "Reading your patterns (2s)", delay: 2000 },
  { text: "Understanding your style (3s)", delay: 5000 },
  { text: "Identifying your persona (2s)", delay: 7000 },
  { text: "Preparing your workspace (3s)", delay: 10000 },
]

export function PersonaAnalysisView() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [persona, setPersona] = useState<string | null>(null)

  useEffect(() => {
    // Simulate 6-10 second analysis
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          // Select random persona (in real app, use actual analysis)
          const selectedPersona = PERSONA_TYPES[Math.floor(Math.random() * PERSONA_TYPES.length)]
          setPersona(selectedPersona)
          return 100
        }
        return prev + 2
      })
    }, 200)

    // Update step text
    let stepIndex = 0
    ANALYSIS_STEPS.forEach((step) => {
      setTimeout(() => {
        setCurrentStep(stepIndex)
        stepIndex++
      }, step.delay)
    })

    // Complete after 10 seconds
    setTimeout(() => {
      if (!persona) {
        const selectedPersona = PERSONA_TYPES[Math.floor(Math.random() * PERSONA_TYPES.length)]
        setPersona(selectedPersona)
      }
      // Store persona in localStorage for next step
      localStorage.setItem("integratewise_persona", persona || PERSONA_TYPES[0])
      // Redirect to persona insights after 1 second
      setTimeout(() => {
        router.push("/onboarding/persona-insights")
      }, 1000)
    }, 10000)

    return () => clearInterval(interval)
  }, [router, persona])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Analyzing Your Persona & Working Style</CardTitle>
          <CardDescription className="mt-2">
            We're analyzing your patterns to personalize your workspace (6-10 seconds)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            {ANALYSIS_STEPS.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  index <= currentStep ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
                }`}
              >
                {index < currentStep ? (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                ) : index === currentStep ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
                <span className={`text-sm ${index <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>

          {persona && (
            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">Detected Persona:</p>
              <p className="text-lg font-semibold text-primary">{persona}</p>
            </div>
          )}

          <div className="mt-6 p-4 rounded-lg bg-muted/50">
            <p className="text-xs font-medium mb-2">What we analyze:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Email domain (company size/type)</li>
              <li>• Role keywords</li>
              <li>• Signup time (timezone)</li>
              <li>• Referring source</li>
              <li>• Device type</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
