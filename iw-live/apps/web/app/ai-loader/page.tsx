"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Loader2, User, Briefcase, HeadphonesIcon, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type LensType = "personal" | "business" | "cs";

interface PersonaResult {
  predictedRole: LensType;
  confidence: number;
  traits: string[];
  recommendedPath: string;
}

const lensConfig = {
  personal: {
    icon: User,
    title: "Personal Hub",
    description: "Your personal productivity and knowledge management space",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    route: "/personal/home",
  },
  business: {
    icon: Briefcase,
    title: "Business Dashboard",
    description: "Team operations, workflows, and business intelligence",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    route: "/business/dashboard",
  },
  cs: {
    icon: HeadphonesIcon,
    title: "Customer Success",
    description: "Health scoring, churn risk, and customer management",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    route: "/cs/tam",
  },
};

export default function AILoaderPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"analyzing" | "complete">("analyzing");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PersonaResult | null>(null);
  const [selectedLens, setSelectedLens] = useState<LensType | null>(null);

  useEffect(() => {
    const analyze = async () => {
      // Simulate AI analysis
      for (let i = 0; i <= 100; i += 5) {
        await new Promise((r) => setTimeout(r, 100));
        setProgress(i);
      }

      // Mock result - in real app, this comes from the API
      setResult({
        predictedRole: "business",
        confidence: 0.78,
        traits: ["Strategic", "Data-driven", "Collaborative"],
        recommendedPath: "Business Operations",
      });
      setStatus("complete");
    };

    analyze();
  }, []);

  const handleLensSelect = (lens: LensType) => {
    setSelectedLens(lens);
    // Set cookie and redirect
    document.cookie = `iw-lens=${lens}; path=/; max-age=31536000`;
    setTimeout(() => {
      router.push(lensConfig[lens].route);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {status === "analyzing" ? "Analyzing Your Workflow" : "Choose Your Lens"}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {status === "analyzing"
              ? "AI is analyzing your browser signals to recommend the best workspace..."
              : "Select the view that best fits your workflow"}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <div className="h-2 w-16 rounded-full bg-brand" />
          <div className="h-2 w-16 rounded-full bg-brand" />
          <div className="h-2 w-16 rounded-full bg-brand" />
          <div className="h-2 w-16 rounded-full bg-brand" />
        </div>

        {/* Analysis status */}
        {status === "analyzing" && (
          <Card className="mt-12 border-brand/20">
            <CardContent className="flex flex-col items-center py-12">
              <div className="relative">
                <Brain className="h-16 w-16 text-brand" />
                <Loader2 className="absolute -right-2 -top-2 h-6 w-6 animate-spin text-brand" />
              </div>
              <p className="mt-4 text-lg font-medium">Processing insights...</p>
              <Progress value={progress} className="mt-4 w-64" />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["Analyzing tabs", "Reading patterns", "Detecting workflows", "Building profile"].map(
                  (step, i) => (
                    <span
                      key={step}
                      className={`rounded-full px-3 py-1 text-xs ${
                        progress > i * 25
                          ? "bg-brand/10 text-brand"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step}
                    </span>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {status === "complete" && result && (
          <div className="mt-12 space-y-8">
            {/* Recommendation */}
            <Card className={`border-2 ${lensConfig[result.predictedRole].color.replace("text-", "border-")}/30`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  AI Recommendation
                </CardTitle>
                <CardDescription>
                  Based on your browser activity, we recommend:{" "}
                  <strong className={lensConfig[result.predictedRole].color}>
                    {lensConfig[result.predictedRole].title}
                  </strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Confidence:</span>{" "}
                    {Math.round(result.confidence * 100)}%
                  </div>
                  <div className="flex gap-2">
                    {result.traits.map((trait) => (
                      <span
                        key={trait}
                        className="rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lens selection */}
            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.entries(lensConfig) as [LensType, typeof lensConfig.personal][]).map(
                ([key, config]) => {
                  const isRecommended = key === result.predictedRole;
                  const isSelected = selectedLens === key;
                  return (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? `border-2 ${config.color.replace("text-", "border-")} ring-2 ring-offset-2`
                          : isRecommended
                          ? `border-2 ${config.color.replace("text-", "border-")}/50`
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                      onClick={() => handleLensSelect(key)}
                    >
                      <CardHeader className="pb-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg ${config.bgColor}`}
                        >
                          <config.icon className={`h-6 w-6 ${config.color}`} />
                        </div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {config.title}
                          {isRecommended && (
                            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                              Recommended
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {config.description}
                        </p>
                        <Button
                          className={`mt-4 w-full ${
                            isSelected ? "btn-brand" : ""
                          }`}
                          variant={isSelected ? "default" : "outline"}
                        >
                          {isSelected ? "Launching..." : "Select"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              You can switch between lenses anytime from the navigation menu
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
