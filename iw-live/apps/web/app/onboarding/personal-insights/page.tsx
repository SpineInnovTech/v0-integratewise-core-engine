"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ArrowRight, Loader2 } from "lucide-react"

// Pythagorean numerology calculation
function calculateLifePath(dateOfBirth: string): number {
  const digits = dateOfBirth.replace(/-/g, "").split("").map(Number)
  let sum = digits.reduce((a, b) => a + b, 0)
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum
      .toString()
      .split("")
      .map(Number)
      .reduce((a, b) => a + b, 0)
  }
  return sum
}

const lifePathMeanings: Record<number, { title: string; traits: string[]; suggestedPath: string }> = {
  1: {
    title: "The Leader",
    traits: ["Independent", "Ambitious", "Innovative"],
    suggestedPath: "Start with Tasks to organize your initiatives",
  },
  2: {
    title: "The Diplomat",
    traits: ["Cooperative", "Intuitive", "Harmonious"],
    suggestedPath: "Start with Brainstorming to collaborate on ideas",
  },
  3: {
    title: "The Communicator",
    traits: ["Creative", "Expressive", "Social"],
    suggestedPath: "Start with AI Insights to explore opportunities",
  },
  4: {
    title: "The Builder",
    traits: ["Practical", "Reliable", "Systematic"],
    suggestedPath: "Start with AI Loader to structure your data",
  },
  5: {
    title: "The Adventurer",
    traits: ["Dynamic", "Versatile", "Freedom-loving"],
    suggestedPath: "Start with Brainstorming for new ideas",
  },
  6: {
    title: "The Nurturer",
    traits: ["Responsible", "Caring", "Harmonious"],
    suggestedPath: "Start with Tasks to help your team",
  },
  7: {
    title: "The Seeker",
    traits: ["Analytical", "Intuitive", "Introspective"],
    suggestedPath: "Start with AI Insights for deep analysis",
  },
  8: {
    title: "The Achiever",
    traits: ["Ambitious", "Authoritative", "Material"],
    suggestedPath: "Start with Tasks to track your goals",
  },
  9: {
    title: "The Humanitarian",
    traits: ["Compassionate", "Generous", "Creative"],
    suggestedPath: "Start with Brainstorming to help others",
  },
  11: {
    title: "The Intuitive",
    traits: ["Visionary", "Inspirational", "Sensitive"],
    suggestedPath: "Start with AI Insights for visionary guidance",
  },
  22: {
    title: "The Master Builder",
    traits: ["Powerful", "Disciplined", "Practical"],
    suggestedPath: "Start with AI Loader to build your foundation",
  },
  33: {
    title: "The Master Teacher",
    traits: ["Nurturing", "Selfless", "Spiritual"],
    suggestedPath: "Start with Brainstorming to share wisdom",
  },
}

export default function PersonalInsightsPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<{ lifePath: number; meaning: (typeof lifePathMeanings)[1] } | null>(null)

  const handleCalculate = async () => {
    if (!name || !dateOfBirth) return

    setIsCalculating(true)

    // Simulate calculation for UX
    await new Promise((r) => setTimeout(r, 1500))

    const lifePath = calculateLifePath(dateOfBirth)
    const meaning = lifePathMeanings[lifePath] || lifePathMeanings[1]

    setResult({ lifePath, meaning })
    setIsCalculating(false)

    // Store in localStorage for profile
    localStorage.setItem(
      "integratewise_personal_insights",
      JSON.stringify({
        name,
        dateOfBirth,
        lifePath,
        calculatedAt: new Date().toISOString(),
      }),
    )
  }

  const handleContinue = () => {
    // Mark personal insights as complete
    localStorage.setItem("integratewise_onboarding_step", "connect")
    router.push("/loader")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Personal Insights</CardTitle>
          <CardDescription>
            Get immediate value in 60 seconds. Enter your name and date of birth for personalized insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!result ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleCalculate} disabled={!name || !dateOfBirth || isCalculating}>
                {isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get My Insights
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center p-6 rounded-lg bg-primary/5 border border-primary/20">
                <div className="text-4xl font-bold text-primary mb-2">Life Path {result.lifePath}</div>
                <div className="text-xl font-semibold mb-4">{result.meaning.title}</div>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {result.meaning.traits.map((trait) => (
                    <span key={trait} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-2">Recommended starting point:</p>
                <p className="font-medium">{result.meaning.suggestedPath}</p>
              </div>

              <Button className="w-full" onClick={handleContinue}>
                Continue to Connect Tools
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
