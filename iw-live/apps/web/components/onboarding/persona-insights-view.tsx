"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Users, Target, Megaphone, Gauge, Shield } from "lucide-react"

// Persona traits mapping
const PERSONA_TRAITS: Record<string, { traits: string[]; recommendedView: string; viewIcon: any; viewDescription: string }> = {
  "Strategic Orchestrator": {
    traits: ["Big picture thinking", "Cross-functional leadership", "System design"],
    recommendedView: "Business OS",
    viewIcon: Gauge,
    viewDescription: "KPI control tower for strategic oversight",
  },
  "Detail-Oriented Analyst": {
    traits: ["Data-driven", "Precision-focused", "Deep analysis"],
    recommendedView: "CS View",
    viewIcon: Users,
    viewDescription: "Health, risk, renewals, and detailed account insights",
  },
  "Customer Champion": {
    traits: ["Relationship-focused", "Advocacy-driven", "Success-oriented"],
    recommendedView: "CS View",
    viewIcon: Users,
    viewDescription: "Customer success intelligence and account management",
  },
  "Growth Hacker": {
    traits: ["Experiment-driven", "Metrics-focused", "Rapid iteration"],
    recommendedView: "Marketing View",
    viewIcon: Megaphone,
    viewDescription: "Campaigns, segmentation, and growth metrics",
  },
  "Rapid Executor": {
    traits: ["Action-oriented", "Fast-paced", "Results-driven"],
    recommendedView: "Sales View",
    viewIcon: Target,
    viewDescription: "Pipeline, deals, and next steps",
  },
}

// Default if persona not found
const DEFAULT_TRAITS = {
  traits: ["Adaptive", "Results-focused", "Collaborative"],
  recommendedView: "Business OS",
  viewIcon: Gauge,
  viewDescription: "KPI control tower for overall business oversight",
}

export function PersonaInsightsView() {
  const router = useRouter()
  const [persona, setPersona] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<string | null>(null)

  useEffect(() => {
    // Get persona from localStorage (set in previous step)
    const storedPersona = localStorage.getItem("integratewise_persona")
    if (storedPersona) {
      setPersona(storedPersona)
      const traits = PERSONA_TRAITS[storedPersona] || DEFAULT_TRAITS
      setSelectedView(traits.recommendedView)
    } else {
      // Fallback if no persona found
      setPersona("Strategic Orchestrator")
      setSelectedView("Business OS")
    }
  }, [])

  const handleContinue = () => {
    // Store selected view
    if (selectedView) {
      localStorage.setItem("integratewise_recommended_view", selectedView)
    }
    router.push("/onboarding/load-data")
  }

  const traits = persona ? PERSONA_TRAITS[persona] || DEFAULT_TRAITS : DEFAULT_TRAITS
  const ViewIcon = traits.viewIcon

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're a {persona || "Strategic Orchestrator"}</CardTitle>
          <CardDescription className="mt-2">Here's what we discovered about your working style</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Traits */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Key Traits:</p>
            <div className="flex flex-wrap gap-2">
              {traits.traits.map((trait, index) => (
                <Badge key={index} variant="outline" className="border-primary/20">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>

          {/* Recommended View */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ViewIcon className="h-5 w-5 text-primary" />
                Recommended Starting View
              </CardTitle>
              <CardDescription>{traits.recommendedView}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{traits.viewDescription}</p>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">This view matches your working style</span>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Views */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Or choose a different view:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "CS View", icon: Users, route: "/cs/accounts" },
                { name: "Sales View", icon: Target, route: "/pipeline" },
                { name: "Marketing View", icon: Megaphone, route: "/campaigns" },
                { name: "Business OS", icon: Gauge, route: "/cockpit" },
              ].map((view) => {
                const Icon = view.icon
                const isSelected = selectedView === view.name
                return (
                  <button
                    key={view.name}
                    onClick={() => setSelectedView(view.name)}
                    className={`p-4 rounded-lg border-2 transition-colors text-left ${
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{view.name}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Button onClick={handleContinue} className="w-full" size="lg">
              Perfect! Let's Load My Data
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
