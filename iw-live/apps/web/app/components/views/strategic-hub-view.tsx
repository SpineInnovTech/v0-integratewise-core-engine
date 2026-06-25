"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Target,
  Heart,
  Wrench,
  TrendingUp,
  DollarSign,
  Plus,
  CheckCircle2,
  Zap,
  BookOpen,
  Lightbulb,
  Eye,
  Users,
  ExternalLink,
  RefreshCw,
} from "lucide-react"

interface Goal {
  id: string
  title: string
  description: string
  goal_type: string
  period_type: string
  period_start: string
  period_end: string
  target_value: number
  current_value: number
  target_unit: string
  currency: string
  status: string
  progress: number
  owner: string
  priority: string
}

interface Value {
  id: string
  name: string
  description: string
  icon: string
  color: string
  principles: string[]
  examples: string[]
}

interface Tool {
  id: string
  name: string
  description: string
  category: string
  vendor: string
  url: string
  icon: string
  status: string
  integration_status: string
  api_connected: boolean
  monthly_cost: number
  currency: string
  used_by: string[]
  features: string[]
}

interface ROI {
  id: string
  entity_type: string
  entity_name: string
  period_start: string
  period_end: string
  investment: number
  revenue_generated: number
  leads_generated: number
  deals_closed: number
  roi_percentage: number
}

const iconMap: Record<string, React.ReactNode> = {
  zap: <Zap className="h-5 w-5" />,
  heart: <Heart className="h-5 w-5" />,
  "book-open": <BookOpen className="h-5 w-5" />,
  lightbulb: <Lightbulb className="h-5 w-5" />,
  eye: <Eye className="h-5 w-5" />,
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  green: "bg-green-500/10 text-green-600 border-green-500/20",
  purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  cyan: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
}

// Empty state component for better UX when no data
function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: { 
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export function StrategicHubView() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [values, setValues] = useState<Value[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [roiData, setRoiData] = useState<ROI[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("goals")
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalDeals: 0,
    totalLeads: 0,
    avgRoi: 0,
  })

  const supabaseRef = useRef(createClient())

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = supabaseRef.current
    if (!supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [goalsRes, valuesRes, toolsRes, roiRes, dealsRes, leadsRes] = await Promise.all([
        supabase.from("business_goals").select("*").order("priority"),
        supabase.from("company_values").select("*").order("sort_order"),
        supabase.from("tools_registry").select("*").order("category"),
        supabase.from("roi_tracking").select("*").order("period_end", { ascending: false }),
        supabase.from("deals").select("value, stage"),
        supabase.from("leads").select("id, status"),
      ])

      if (goalsRes.data) setGoals(goalsRes.data)
      if (valuesRes.data) setValues(valuesRes.data)
      if (toolsRes.data) setTools(toolsRes.data)
      if (roiRes.data) setRoiData(roiRes.data)

      // Calculate metrics
      const totalRevenue = roiRes.data?.reduce((sum, r) => sum + (r.revenue_generated || 0), 0) || 0
      const totalDeals = dealsRes.data?.filter((d) => d.stage === "won").length || 0
      const totalLeads = leadsRes.data?.length || 0
      const avgRoi = roiRes.data?.length
        ? roiRes.data.reduce((sum, r) => sum + (r.roi_percentage || 0), 0) / roiRes.data.length
        : 0

      setMetrics({ totalRevenue, totalDeals, totalLeads, avgRoi })
    } catch (error) {
      console.error("Error fetching strategic data:", error)
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(value: number, currency = "INR") {
    if (currency === "INR") {
      if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
      if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
      if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
      return `₹${value.toLocaleString()}`
    }
    return `$${value.toLocaleString()}`
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "achieved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Achieved</Badge>
      case "active":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Active</Badge>
      case "missed":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Missed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  function getIntegrationBadge(status: string) {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Connected</Badge>
      case "partial":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Partial</Badge>
      default:
        return <Badge className="bg-muted text-muted-foreground">Not Connected</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Strategic Hub</h1>
          <p className="text-muted-foreground">Business goals, values, tools, and ROI mapping</p>
        </div>
        <Button onClick={() => setShowAddGoal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deals Won</p>
                <p className="text-2xl font-bold">{metrics.totalDeals}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{metrics.totalLeads}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg ROI</p>
                <p className="text-2xl font-bold">{metrics.avgRoi.toFixed(0)}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="values">Values</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          {goals.length === 0 ? (
            <Card>
              <EmptyState
                icon={Target}
                title="No goals set yet"
                description="Define your business goals to track progress and align your team. Start by creating quarterly or annual targets."
                actionLabel="Add Your First Goal"
                onAction={() => setShowAddGoal(true)}
              />
            </Card>
          ) : (
          <div className="grid gap-4">
            {/* Quarterly Goals */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Q1 2025 Goals</h3>
              {goals.filter((g) => g.period_type === "quarterly").length === 0 ? (
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground text-center">No quarterly goals set. <button onClick={() => setShowAddGoal(true)} className="text-primary underline">Add one</button></p>
                </Card>
              ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals
                  .filter((g) => g.period_type === "quarterly")
                  .map((goal) => (
                    <Card key={goal.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {goal.goal_type}
                            </Badge>
                            {getStatusBadge(goal.status)}
                          </div>
                          <span className="text-xs text-muted-foreground">{goal.priority} priority</span>
                        </div>
                        <CardTitle className="text-base mt-2">{goal.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Current</span>
                          <span className="font-medium">
                            {goal.target_unit === "currency"
                              ? formatCurrency(goal.current_value, goal.currency)
                              : goal.current_value.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-medium">
                            {goal.target_unit === "currency"
                              ? formatCurrency(goal.target_value, goal.currency)
                              : goal.target_value.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              )}
            </div>

            {/* Annual Goals */}
            <div>
              <h3 className="text-lg font-semibold mb-3">FY 2025 Goals</h3>
              {goals.filter((g) => g.period_type === "annual").length === 0 ? (
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground text-center">No annual goals set. <button onClick={() => setShowAddGoal(true)} className="text-primary underline">Add one</button></p>
                </Card>
              ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals
                  .filter((g) => g.period_type === "annual")
                  .map((goal) => (
                    <Card key={goal.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {goal.goal_type}
                            </Badge>
                            {getStatusBadge(goal.status)}
                          </div>
                        </div>
                        <CardTitle className="text-base mt-2">{goal.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-medium">
                            {goal.target_unit === "currency"
                              ? formatCurrency(goal.target_value, goal.currency)
                              : goal.target_value.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              )}
            </div>
          </div>
          )}
        </TabsContent>

        {/* Values Tab */}
        <TabsContent value="values" className="space-y-4">
          {values.length === 0 ? (
            <Card>
              <EmptyState
                icon={Heart}
                title="No company values defined"
                description="Define your core values to guide decision-making and build a strong company culture."
              />
            </Card>
          ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map((value) => (
              <Card key={value.id} className={`border ${colorMap[value.color] || ""}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${colorMap[value.color]?.split(" ")[0] || "bg-muted"}`}
                    >
                      {iconMap[value.icon] || <Heart className="h-5 w-5" />}
                    </div>
                    <CardTitle className="text-lg">{value.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{value.description}</p>

                  {value.principles?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Principles</p>
                      <ul className="space-y-1">
                        {value.principles.map((p, i) => (
                          <li key={i} className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          {tools.length === 0 ? (
            <Card>
              <EmptyState
                icon={Wrench}
                title="No tools registered"
                description="Register your business tools to track integrations, costs, and usage across your organization."
              />
            </Card>
          ) : (
          <div className="grid gap-4">
            {["crm", "sales", "marketing", "analytics", "productivity", "development"].map((category) => {
              const categoryTools = tools.filter((t) => t.category === category)
              if (categoryTools.length === 0) return null

              return (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 capitalize">{category}</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTools.map((tool) => (
                      <Card key={tool.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                <Wrench className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium">{tool.name}</h4>
                                <p className="text-xs text-muted-foreground">{tool.vendor}</p>
                              </div>
                            </div>
                            {getIntegrationBadge(tool.integration_status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tool.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {tool.used_by?.slice(0, 2).map((dept, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {dept}
                                </Badge>
                              ))}
                            </div>
                            {tool.url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={tool.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </TabsContent>

        {/* Marketing & Sales Tab */}
        <TabsContent value="marketing" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Active Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Campaigns</CardTitle>
                <CardDescription>Current marketing initiatives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roiData
                    .filter((r) => r.entity_type === "campaign")
                    .slice(0, 5)
                    .map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div>
                          <p className="font-medium text-sm">{campaign.entity_name}</p>
                          <p className="text-xs text-muted-foreground">{campaign.leads_generated} leads generated</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm text-green-600">
                            {formatCurrency(campaign.revenue_generated)}
                          </p>
                          <p className="text-xs text-muted-foreground">{campaign.roi_percentage}% ROI</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Sales Pipeline Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sales Performance</CardTitle>
                <CardDescription>Pipeline and conversion metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Total Leads</p>
                      <p className="text-2xl font-bold">{metrics.totalLeads}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Deals Closed</p>
                      <p className="text-2xl font-bold">{metrics.totalDeals}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Conversion Rate</span>
                      <span className="font-medium">
                        {metrics.totalLeads > 0 ? ((metrics.totalDeals / metrics.totalLeads) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <Progress
                      value={metrics.totalLeads > 0 ? (metrics.totalDeals / metrics.totalLeads) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ROI Tab */}
        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ROI Analysis</CardTitle>
              <CardDescription>Return on investment by campaign and initiative</CardDescription>
            </CardHeader>
            <CardContent>
              {roiData.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No ROI data available"
                  description="Track your campaigns and initiatives to measure return on investment and optimize your spending."
                />
              ) : (
              <div className="space-y-4">
                {roiData.map((roi) => (
                  <div key={roi.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Badge variant="outline" className="text-xs capitalize mb-2">
                          {roi.entity_type}
                        </Badge>
                        <h4 className="font-medium">{roi.entity_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(roi.period_start).toLocaleDateString()} -{" "}
                          {new Date(roi.period_end).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`text-right ${roi.roi_percentage > 0 ? "text-green-600" : "text-red-600"}`}>
                        <p className="text-2xl font-bold">{roi.roi_percentage.toFixed(0)}%</p>
                        <p className="text-xs">ROI</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Investment</p>
                        <p className="font-medium">{formatCurrency(roi.investment)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-medium text-green-600">{formatCurrency(roi.revenue_generated)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Leads</p>
                        <p className="font-medium">{roi.leads_generated}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deals</p>
                        <p className="font-medium">{roi.deals_closed}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Goal Dialog */}
      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Business Goal</DialogTitle>
            <DialogDescription>Create a new quarterly or annual goal</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const supabase = supabaseRef.current
              if (!supabase) return
              const formData = new FormData(e.currentTarget)
              const { error } = await supabase.from("business_goals").insert({
                title: formData.get("title"),
                description: formData.get("description"),
                goal_type: formData.get("goal_type"),
                period_type: formData.get("period_type"),
                period_start: formData.get("period_start"),
                period_end: formData.get("period_end"),
                target_value: Number(formData.get("target_value")),
                target_unit: formData.get("target_unit"),
                owner: "Nirmal Prince",
                priority: formData.get("priority"),
              })
              if (!error) {
                setShowAddGoal(false)
                fetchData()
              }
            }}
          >
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Q1 Revenue Target" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Goal description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goal_type">Goal Type</Label>
                  <Select name="goal_type" defaultValue="revenue">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="period_type">Period</Label>
                  <Select name="period_type" defaultValue="quarterly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period_start">Start Date</Label>
                  <Input id="period_start" name="period_start" type="date" required />
                </div>
                <div>
                  <Label htmlFor="period_end">End Date</Label>
                  <Input id="period_end" name="period_end" type="date" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_value">Target Value</Label>
                  <Input id="target_value" name="target_value" type="number" placeholder="1000000" required />
                </div>
                <div>
                  <Label htmlFor="target_unit">Unit</Label>
                  <Select name="target_unit" defaultValue="currency">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="high">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddGoal(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Goal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
