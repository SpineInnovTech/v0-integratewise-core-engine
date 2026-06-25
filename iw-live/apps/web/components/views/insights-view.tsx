"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

interface Insight {
  id: string
  type: "trend" | "risk" | "opportunity" | "metric"
  title: string
  description: string
  value?: string
  change?: number
  priority: "high" | "medium" | "low"
  source: string
}

const mockInsights: Insight[] = [
  {
    id: "1",
    type: "metric",
    title: "Monthly Recurring Revenue",
    description: "Total MRR from all active subscriptions",
    value: "$124,500",
    change: 12.5,
    priority: "high",
    source: "Stripe",
  },
  {
    id: "2",
    type: "trend",
    title: "Customer Engagement Up",
    description: "Average session duration increased by 23% this week",
    change: 23,
    priority: "medium",
    source: "Analytics",
  },
  {
    id: "3",
    type: "risk",
    title: "Churn Risk Detected",
    description: "3 enterprise accounts showing reduced activity",
    priority: "high",
    source: "HubSpot",
  },
  {
    id: "4",
    type: "opportunity",
    title: "Upsell Opportunity",
    description: "5 accounts approaching usage limits, potential upgrade candidates",
    priority: "medium",
    source: "Internal",
  },
]

export function InsightsView() {
  const [activeTab, setActiveTab] = useState("all")

  const getIcon = (type: string) => {
    switch (type) {
      case "trend":
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      case "risk":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "opportunity":
        return <Lightbulb className="h-5 w-5 text-yellow-500" />
      case "metric":
        return <Activity className="h-5 w-5 text-green-500" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const filteredInsights = activeTab === "all" ? mockInsights : mockInsights.filter((i) => i.type === activeTab)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Insights</h1>
        <p className="text-muted-foreground mt-1">AI-powered insights and signals from your connected data</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">$124,500</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>+12.5%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold">48</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>+3</span>
              <span className="text-muted-foreground">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>+28%</span>
              <span className="text-muted-foreground">productivity</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
              <ArrowDownRight className="h-4 w-4" />
              <span>-2%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Feed */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights Feed</CardTitle>
          <CardDescription>Automatically generated insights from your connected sources</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="metric">Metrics</TabsTrigger>
              <TabsTrigger value="trend">Trends</TabsTrigger>
              <TabsTrigger value="risk">Risks</TabsTrigger>
              <TabsTrigger value="opportunity">Opportunities</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-4">
              {filteredInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 bg-muted rounded-lg">{getIcon(insight.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge
                        variant={
                          insight.priority === "high"
                            ? "destructive"
                            : insight.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {insight.value && <span className="text-lg font-semibold">{insight.value}</span>}
                      {insight.change !== undefined && (
                        <span
                          className={`flex items-center text-sm ${
                            insight.change > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {insight.change > 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {insight.change > 0 ? "+" : ""}
                          {insight.change}%
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">Source: {insight.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
