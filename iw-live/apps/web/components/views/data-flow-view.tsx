"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Globe,
  Users,
  PenTool,
  Webhook,
  Shield,
  FileSearch,
  Copy,
  Sparkles,
  Brain,
  Database,
  HardDrive,
  Search,
  BarChart3,
  LayoutDashboard,
  Lightbulb,
  Bell,
  FileText,
  ArrowRight,
  ArrowDown,
  Clock,
  Zap,
  Timer,
  CheckCircle2,
  Activity,
} from "lucide-react"

const dataSources = [
  {
    id: "website",
    name: "Website Visitors",
    icon: Globe,
    color: "bg-blue-500",
    items: ["Form Submissions", "Page Views", "Click Events"],
  },
  {
    id: "hubspot",
    name: "HubSpot CRM",
    icon: Users,
    color: "bg-orange-500",
    items: ["Leads", "Contacts", "Deals", "Companies"],
  },
  {
    id: "manual",
    name: "Manual Entry",
    icon: PenTool,
    color: "bg-green-500",
    items: ["Client Data", "Session Notes", "Documents"],
  },
  {
    id: "webhooks",
    name: "API Webhooks",
    icon: Webhook,
    color: "bg-purple-500",
    items: ["Slack", "Discord", "Asana", "Custom"],
  },
]

const ingestionSteps = [
  {
    id: "validation",
    name: "Validation Layer",
    icon: Shield,
    description: "Schema validation, auth check, rate limiting",
    timing: "< 50ms",
  },
  {
    id: "parser",
    name: "Data Parser",
    icon: FileSearch,
    description: "Normalize data format, extract fields",
    timing: "< 100ms",
  },
  {
    id: "dedup",
    name: "Duplicate Detection",
    icon: Copy,
    description: "Check for existing records, merge logic",
    timing: "< 200ms",
  },
  {
    id: "enrichment",
    name: "Data Enrichment",
    icon: Sparkles,
    description: "Add metadata, geo-location, timestamps",
    timing: "< 150ms",
  },
  { id: "ai", name: "AI Analysis", icon: Brain, description: "Claude/DeepSeek semantic analysis", timing: "< 2s" },
]

const storageTargets = [
  {
    id: "supabase",
    name: "Supabase DB",
    icon: Database,
    color: "bg-emerald-500",
    description: "Primary data store with RLS",
  },
  { id: "redis", name: "Redis Cache", icon: HardDrive, color: "bg-red-500", description: "Session & real-time cache" },
  {
    id: "search",
    name: "Search Index",
    icon: Search,
    color: "bg-amber-500",
    description: "Full-text search with vectors",
  },
  {
    id: "analytics",
    name: "Analytics DW",
    icon: BarChart3,
    color: "bg-indigo-500",
    description: "Aggregated metrics & reports",
  },
]

const outputs = [
  { id: "dashboard", name: "Dashboard Updates", icon: LayoutDashboard, timing: "Real-time" },
  { id: "insights", name: "AI Insights", icon: Lightbulb, timing: "Hourly" },
  { id: "notifications", name: "Webhook Alerts", icon: Bell, timing: "Instant" },
  { id: "reports", name: "Report Generation", icon: FileText, timing: "Daily" },
]

export function DataFlowView() {
  const [activeSource, setActiveSource] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<string | null>(null)

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Ingestion Flow</h1>
        <p className="text-muted-foreground mt-1">How data moves through IntegrateWise OS</p>
      </div>

      <Tabs defaultValue="diagram" className="w-full">
        <TabsList>
          <TabsTrigger value="diagram">Flow Diagram</TabsTrigger>
          <TabsTrigger value="timing">Timing Details</TabsTrigger>
          <TabsTrigger value="processing">Processing Modes</TabsTrigger>
        </TabsList>

        <TabsContent value="diagram" className="mt-6">
          {/* Main Flow Diagram */}
          <div className="space-y-8">
            {/* Data Sources */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-500 font-bold text-sm">1</span>
                </div>
                <h2 className="text-lg font-semibold">Data Sources</h2>
                <Badge variant="outline" className="ml-2">
                  Input Layer
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dataSources.map((source) => (
                  <Card
                    key={source.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${activeSource === source.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setActiveSource(activeSource === source.id ? null : source.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg ${source.color} flex items-center justify-center`}>
                          <source.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">{source.name}</span>
                      </div>
                      <div className="space-y-1">
                        {source.items.map((item) => (
                          <div key={item} className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Flow Arrow */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center text-muted-foreground">
                <ArrowDown className="w-6 h-6" />
                <span className="text-xs mt-1">Incoming Data</span>
              </div>
            </div>

            {/* Ingestion Pipeline */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-500 font-bold text-sm">2</span>
                </div>
                <h2 className="text-lg font-semibold">Ingestion Pipeline</h2>
                <Badge variant="outline" className="ml-2">
                  Processing Layer
                </Badge>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {ingestionSteps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-2">
                        <div
                          className={`flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-all hover:bg-accent ${activeStep === step.id ? "bg-accent border-primary" : ""}`}
                          onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                        >
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                            <step.icon className="w-6 h-6 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-center">{step.name}</span>
                          <span className="text-xs text-muted-foreground mt-1">{step.timing}</span>
                        </div>
                        {index < ingestionSteps.length - 1 && (
                          <ArrowRight className="w-5 h-5 text-muted-foreground hidden md:block" />
                        )}
                      </div>
                    ))}
                  </div>
                  {activeStep && (
                    <div className="mt-4 p-3 bg-accent rounded-lg">
                      <p className="text-sm">
                        <strong>{ingestionSteps.find((s) => s.id === activeStep)?.name}:</strong>{" "}
                        {ingestionSteps.find((s) => s.id === activeStep)?.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Flow Arrow */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center text-muted-foreground">
                <ArrowDown className="w-6 h-6" />
                <span className="text-xs mt-1">Processed Data</span>
              </div>
            </div>

            {/* Storage Layer */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-500 font-bold text-sm">3</span>
                </div>
                <h2 className="text-lg font-semibold">Storage Layer</h2>
                <Badge variant="outline" className="ml-2">
                  Persistence
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {storageTargets.map((target) => (
                  <Card key={target.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg ${target.color} flex items-center justify-center`}>
                          <target.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">{target.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{target.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Flow Arrow */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center text-muted-foreground">
                <ArrowDown className="w-6 h-6" />
                <span className="text-xs mt-1">Query & Transform</span>
              </div>
            </div>

            {/* Output Layer */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-500 font-bold text-sm">4</span>
                </div>
                <h2 className="text-lg font-semibold">Output Layer</h2>
                <Badge variant="outline" className="ml-2">
                  Delivery
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {outputs.map((output) => (
                  <Card key={output.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <output.icon className="w-5 h-5 text-foreground" />
                          </div>
                          <span className="font-medium">{output.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {output.timing}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                End-to-End Timing Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <span className="font-medium">Total Pipeline Time (Real-time)</span>
                  <Badge className="bg-green-500">~2.5s</Badge>
                </div>
                <div className="space-y-2">
                  {ingestionSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-4">
                      <div className="w-8 text-center text-sm text-muted-foreground">{index + 1}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{step.name}</span>
                          <span className="text-xs text-muted-foreground">{step.timing}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width:
                                step.id === "ai"
                                  ? "80%"
                                  : step.id === "dedup"
                                    ? "20%"
                                    : step.id === "enrichment"
                                      ? "15%"
                                      : step.id === "parser"
                                        ? "10%"
                                        : "5%",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Timing Notes</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>- AI Analysis is the most time-consuming step (~2s)</li>
                    <li>- Non-AI path completes in ~500ms for real-time needs</li>
                    <li>- Batch processing runs hourly for non-critical data</li>
                    <li>- Cache hits skip validation, reducing time to ~50ms</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Real-time Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Critical data that requires immediate processing and visibility.
                </p>
                <div className="space-y-2">
                  {[
                    "Form submissions from website",
                    "New lead creation from HubSpot",
                    "Deal stage changes",
                    "Slack/Discord urgent messages",
                    "Payment events",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-green-500" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
                  <span className="text-sm font-medium text-green-600">SLA: &lt; 5 seconds</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-blue-500" />
                  Batch Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Non-critical data processed hourly for efficiency.</p>
                <div className="space-y-2">
                  {[
                    "Analytics aggregation",
                    "AI insight generation",
                    "ROI calculations",
                    "Report compilation",
                    "Search index updates",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                  <span className="text-sm font-medium text-blue-600">Schedule: Every hour at :00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
