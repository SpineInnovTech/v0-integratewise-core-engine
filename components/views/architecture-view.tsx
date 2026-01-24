"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Target,
  Globe,
  Users,
  BarChart3,
  Clock,
  MessageSquare,
  Webhook,
  RefreshCw,
  Brain,
  Database,
  ArrowRight,
  ArrowDown,
  Zap,
  TrendingUp,
  FileText,
  Layers,
  Server,
  Cloud,
  Monitor,
} from "lucide-react"

export function ArchitectureView() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">IntegrateWise OS Architecture</h1>
        <p className="text-muted-foreground">Comprehensive system overview showing all layers, APIs, and data flows</p>
      </div>

      {/* Architecture Layers */}
      <div className="space-y-6">
        {/* Layer 1: Frontend */}
        <Card
          className={`border-2 transition-all cursor-pointer ${activeLayer === "frontend" ? "border-blue-500 bg-blue-500/5" : "border-blue-500/30 hover:border-blue-500/60"}`}
          onClick={() => setActiveLayer(activeLayer === "frontend" ? null : "frontend")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Frontend Layer</CardTitle>
              <Badge variant="outline" className="ml-auto bg-blue-500/10 text-blue-600 border-blue-500/30">
                Next.js App Router
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { icon: Home, name: "Home Dashboard", path: "/" },
                { icon: Target, name: "Strategic Hub", path: "/strategy" },
                { icon: Globe, name: "Website Manager", path: "/website" },
                { icon: Users, name: "CRM & Sales Hub", path: "/sales" },
                { icon: BarChart3, name: "Metrics Dashboard", path: "/metrics" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
                >
                  <item.icon className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.path}</p>
                  </div>
                </div>
              ))}
            </div>
            {activeLayer === "frontend" && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <strong>Additional Views:</strong> Brainstorming, Knowledge Hub, Products, Services, Clients, Sessions,
                Projects, Tasks, Leads, Campaigns, Pipeline, Integrations, Settings
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ArrowDown className="h-6 w-6" />
            <span className="text-xs">REST / Server Actions</span>
          </div>
        </div>

        {/* Layer 2: Backend APIs */}
        <Card
          className={`border-2 transition-all cursor-pointer ${activeLayer === "backend" ? "border-green-500 bg-green-500/5" : "border-green-500/30 hover:border-green-500/60"}`}
          onClick={() => setActiveLayer(activeLayer === "backend" ? null : "backend")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Backend API Layer</CardTitle>
              <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-600 border-green-500/30">
                Route Handlers
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cron Jobs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <Clock className="h-4 w-4" />
                  Scheduled Jobs
                </div>
                <div className="space-y-1.5">
                  {[
                    { path: "/api/cron/hourly-insights", desc: "AI Webhook Reports" },
                    { path: "/api/cron/daily-insights", desc: "Daily Summaries" },
                  ].map((item, i) => (
                    <div key={i} className="p-2 rounded bg-green-500/10 border border-green-500/20 text-xs">
                      <code className="text-green-700">{item.path}</code>
                      <p className="text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhooks */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <Webhook className="h-4 w-4" />
                  Webhook Handlers
                </div>
                <div className="space-y-1.5">
                  {[
                    { path: "/api/webhooks/slack", desc: "Slack Events" },
                    { path: "/api/webhooks/discord", desc: "Discord Events" },
                    { path: "/api/webhooks/hubspot", desc: "HubSpot CRM" },
                    { path: "/api/webhooks/brainstorm", desc: "Brainstorm Sync" },
                  ].map((item, i) => (
                    <div key={i} className="p-2 rounded bg-green-500/10 border border-green-500/20 text-xs">
                      <code className="text-green-700">{item.path}</code>
                      <p className="text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sync APIs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <RefreshCw className="h-4 w-4" />
                  Sync & Analysis
                </div>
                <div className="space-y-1.5">
                  {[
                    { path: "/api/hubspot/sync", desc: "HubSpot Bidirectional" },
                    { path: "/api/brainstorm/analyze", desc: "AI Analysis" },
                    { path: "/api/brainstorm/execute", desc: "Action Execution" },
                    { path: "/api/website/track", desc: "Visitor Tracking" },
                  ].map((item, i) => (
                    <div key={i} className="p-2 rounded bg-green-500/10 border border-green-500/20 text-xs">
                      <code className="text-green-700">{item.path}</code>
                      <p className="text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bidirectional Arrows */}
        <div className="flex justify-center gap-12">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ArrowDown className="h-6 w-6" />
            <span className="text-xs">Supabase Client</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ArrowDown className="h-6 w-6 rotate-180" />
            <ArrowDown className="h-6 w-6" />
            <span className="text-xs">External APIs</span>
          </div>
        </div>

        {/* Layer 3: External Integrations & Database (Side by Side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* External Integrations */}
          <Card
            className={`border-2 transition-all cursor-pointer ${activeLayer === "external" ? "border-purple-500 bg-purple-500/5" : "border-purple-500/30 hover:border-purple-500/60"}`}
            onClick={() => setActiveLayer(activeLayer === "external" ? null : "external")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">External Integrations</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* AI */}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">AI Intelligence</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    Claude 3.5 Sonnet
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    DeepSeek
                  </Badge>
                </div>
              </div>

              {/* CRM */}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">CRM & Marketing</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    HubSpot
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Pipedrive
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    LinkedIn
                  </Badge>
                </div>
              </div>

              {/* Communication */}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Communication</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    Slack
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Discord
                  </Badge>
                </div>
              </div>

              {/* Productivity */}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Productivity</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    Asana
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Google Sheets
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Notion
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database */}
          <Card
            className={`border-2 transition-all cursor-pointer ${activeLayer === "database" ? "border-amber-500 bg-amber-500/5" : "border-amber-500/30 hover:border-amber-500/60"}`}
            onClick={() => setActiveLayer(activeLayer === "database" ? null : "database")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Database Layer</CardTitle>
                <Badge variant="outline" className="ml-auto bg-amber-500/10 text-amber-600 border-amber-500/30">
                  Supabase PostgreSQL
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Strategic */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Strategic</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <code className="px-1.5 py-0.5 bg-background rounded">business_goals</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">company_values</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">tools_registry</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">roi_tracking</code>
                </div>
              </div>

              {/* CRM & Sales */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">CRM & Sales</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <code className="px-1.5 py-0.5 bg-background rounded">leads</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">deals</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">clients</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">client_engagements</code>
                </div>
              </div>

              {/* Content & Knowledge */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Content & Knowledge</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <code className="px-1.5 py-0.5 bg-background rounded">documents</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">content_library</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">brainstorm_chats</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">brainstorm_insights</code>
                </div>
              </div>

              {/* Website */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Website & Analytics</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <code className="px-1.5 py-0.5 bg-background rounded">website_pages</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">website_visitors</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">form_submissions</code>
                  <code className="px-1.5 py-0.5 bg-background rounded">conversion_funnel</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Flow Diagram */}
        <Card className="border-2 border-cyan-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-lg">Data Flow Pipeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Main Flow */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {[
                  { icon: Globe, label: "Website Visitors", color: "bg-blue-500" },
                  { icon: Brain, label: "AI Analysis", color: "bg-purple-500" },
                  { icon: Users, label: "CRM/Leads", color: "bg-green-500" },
                  { icon: TrendingUp, label: "Sales Pipeline", color: "bg-amber-500" },
                  { icon: BarChart3, label: "ROI Tracking", color: "bg-cyan-500" },
                ].map((item, i, arr) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${item.color} text-white`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium">{item.label}</div>
                    {i < arr.length - 1 && <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />}
                  </div>
                ))}
              </div>

              {/* Secondary Flow */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-3">Hourly AI Webhook Reports</p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline">Business Metrics</Badge>
                  <ArrowRight className="h-4 w-4" />
                  <Badge variant="outline">Claude/DeepSeek Analysis</Badge>
                  <ArrowRight className="h-4 w-4" />
                  <Badge variant="outline">Formatted Report</Badge>
                  <ArrowRight className="h-4 w-4" />
                  <div className="flex gap-2">
                    <Badge className="bg-[#4A154B]">Slack</Badge>
                    <Badge className="bg-[#5865F2]">Discord</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Frontend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Backend APIs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span>External Services</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span>Database</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cyan-500"></div>
            <span>Data Flow</span>
          </div>
        </div>
      </div>
    </div>
  )
}
