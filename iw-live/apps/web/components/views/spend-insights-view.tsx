"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react"

interface SpendSummary {
  totalSpend: number
  totalSpendFormatted: string
  currency: string
  mrr: number
  arr: number
  activeSubscriptions: number
  churnRate: number
  avgRevenuePerAccount: number
  topSpendCategories: { category: string; amount: number; percent: number }[]
  insights: any[]
  period: { start: string; end: string }
}

export function SpendInsightsView() {
  const [summary, setSummary] = useState<SpendSummary | null>(null)
  const [trend, setTrend] = useState<{ date: string; mrr: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month")

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [summaryRes, trendRes] = await Promise.all([
        fetch(`/api/spend/summary?period=${period}`),
        fetch(`/api/spend/trend?months=12`),
      ])

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data)
      }

      if (trendRes.ok) {
        const data = await trendRes.json()
        setTrend(data.trend || [])
      }
    } catch (err) {
      console.error("[v0] Failed to fetch spend data:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Spend Insights</h1>
          <p className="text-muted-foreground mt-1">Track your billing, revenue, and spend patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold">{formatCurrency(summary?.mrr || 0)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>Monthly Recurring Revenue</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ARR</p>
                <p className="text-2xl font-bold">{formatCurrency(summary?.arr || 0)}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
              <TrendingUp className="h-4 w-4" />
              <span>Annual Recurring Revenue</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">{summary?.totalSpendFormatted || "$0"}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <span>This {period}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{summary?.churnRate || 0}%</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900/30">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowDownRight className="h-4 w-4" />
              <span>Healthy</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MRR Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>MRR Trend</CardTitle>
          <CardDescription>Monthly recurring revenue over the past 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-2">
            {trend.map((item, idx) => {
              const maxMrr = Math.max(...trend.map((t) => t.mrr), 1)
              const height = (item.mrr / maxMrr) * 100
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${item.date}: ${formatCurrency(item.mrr)}`}
                  />
                  <span className="text-xs text-muted-foreground rotate-45 origin-left">{item.date.split("-")[1]}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Insights Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Spend Insights</CardTitle>
          <CardDescription>AI-generated insights from your billing data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(summary?.insights || []).map((insight: any) => (
            <div
              key={insight.id}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="p-2 bg-muted rounded-lg">
                {insight.type === "spend" && <DollarSign className="h-5 w-5 text-green-500" />}
                {insight.type === "forecast" && <TrendingUp className="h-5 w-5 text-blue-500" />}
                {insight.type === "anomaly" && <AlertTriangle className="h-5 w-5 text-red-500" />}
                {insight.type === "usage" && <BarChart3 className="h-5 w-5 text-purple-500" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{insight.title}</h4>
                  <Badge variant="outline">{insight.period}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-lg font-semibold">{formatCurrency(insight.value)}</span>
                  <span className="text-xs text-muted-foreground">Source: {insight.source}</span>
                </div>
              </div>
            </div>
          ))}
          {(!summary?.insights || summary.insights.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              No insights available yet. Connect your billing to see spend analytics.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
