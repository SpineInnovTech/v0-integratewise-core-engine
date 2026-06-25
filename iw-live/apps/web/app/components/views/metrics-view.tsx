"use client"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"
import { Bot, TrendingUp, Briefcase, Cloud, Package, GraduationCap } from "lucide-react"
import { useMetrics } from "@/lib/hooks/use-data"
import { createClient } from "@/lib/supabase/client"

const tierData = [
  { name: "Professional", value: 35, color: "hsl(var(--chart-1))", icon: Briefcase },
  { name: "Recurring", value: 25, color: "hsl(var(--chart-2))", icon: TrendingUp },
  { name: "Scalable", value: 15, color: "hsl(var(--chart-3))", icon: GraduationCap },
  { name: "SaaS", value: 20, color: "hsl(var(--chart-4))", icon: Cloud },
  { name: "Digital", value: 5, color: "hsl(var(--chart-5))", icon: Package },
]

const teamUtilization = [
  { team: "Consulting", value: 85 },
  { team: "Implementation", value: 90 },
  { team: "Support", value: 75 },
]

const aiInsights = [
  "MuleSoft projects driving 60% of revenue",
  "SaaS platform subscriptions growing 15% MoM",
  "Focus on converting HealthPlus opportunity (₹1.2Cr)",
  "Recommend expanding advisory retainer offerings",
]

const pipelineData = [
  { stage: "Discovery", value: 20, color: "hsl(var(--chart-1))" },
  { stage: "Qualification", value: 15, color: "hsl(var(--chart-2))" },
  { stage: "Proposal", value: 25, color: "hsl(var(--chart-3))" },
  { stage: "Negotiation", value: 10, color: "hsl(var(--chart-4))" },
]

const revenueData = [
  { month: "Jul", value: 18 },
  { month: "Aug", value: 22 },
  { month: "Sep", value: 19 },
  { month: "Oct", value: 28 },
  { month: "Nov", value: 32 },
  { month: "Dec", value: 26 },
]

const miniChartData = [
  { value: 20 },
  { value: 35 },
  { value: 25 },
  { value: 45 },
  { value: 40 },
  { value: 55 },
  { value: 50 },
]

const fetchPipelineStats = async () => {
  const supabase = createClient()
  const { data } = await supabase.from("opportunities").select("value, stage").not("stage", "like", "closed%")
  return data
}

const fetchRevenueStats = async () => {
  const supabase = createClient()
  const { data } = await supabase.from("revenue").select("amount, tier, payment_status").eq("payment_status", "paid")
  return data
}

const fetchSubscriptionStats = async () => {
  const supabase = createClient()
  const { data } = await supabase.from("subscriptions").select("mrr, status").eq("status", "active")
  return data
}

const fetchProjectStats = async () => {
  const supabase = createClient()
  const { data } = await supabase.from("projects").select("id, status, health_score").eq("status", "active")
  return data
}

export function MetricsView() {
  const { data: metrics, isLoading: metricsLoading } = useMetrics()
  const { data: pipeline } = useSWR("pipeline-stats", fetchPipelineStats)
  const { data: revenue } = useSWR("revenue-stats", fetchRevenueStats)
  const { data: subscriptions } = useSWR("subscription-stats", fetchSubscriptionStats)
  const { data: projects } = useSWR("project-stats", fetchProjectStats)

  const isLoading = metricsLoading

  const totalPipeline = pipeline?.reduce((sum: number, o: any) => sum + (o.value || 0), 0) || 0
  const totalMRR = subscriptions?.reduce((sum: number, s: any) => sum + (s.mrr || 0), 0) || 0
  const totalRevenue = revenue?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0
  const activeProjects = projects?.length || 0

  const formatLakhs = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n}`
  }

  const kpiCards = [
    { title: "MRR", value: formatLakhs(totalMRR || 2600000), hasChart: true },
    { title: "Pipeline", value: formatLakhs(totalPipeline || 12800000), hasChart: true },
    { title: "Revenue (YTD)", value: formatLakhs(totalRevenue || 4250000), hasChart: true },
    { title: "Active Projects", value: String(activeProjects || 3), hasChart: false },
  ]

  const quickStats = [
    { label: "Clients", value: "5" },
    { label: "Opportunities", value: pipeline?.length || "2" },
    { label: "Subscriptions", value: subscriptions?.length || "2" },
    { label: "Win Rate", value: "60%" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Business Metrics</h1>
        <p className="text-muted-foreground">IntegrateWise LLP performance dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          : kpiCards.map((kpi) => (
              <Card key={kpi.title} className="bg-primary text-primary-foreground overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">{kpi.title}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  {kpi.hasChart && (
                    <div className="w-16 h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={miniChartData}>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="rgba(255,255,255,0.8)"
                            fill="rgba(255,255,255,0.2)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Pipeline */}
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sales Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pipelineData.map((item) => (
                <div key={item.stage} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24">{item.stage}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.value}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-10">{item.value}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue Trend (6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(v) => `₹${v}L`}
                      />
                      <Tooltip formatter={(value: number) => [`₹${value}L`, "Revenue"]} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--chart-1))"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Win Rate Donut */}
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Deal Win Rate</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="relative">
                  <svg className="w-28 h-28 -rotate-90">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth="12"
                      strokeDasharray={`${60 * 3.02} ${40 * 3.02}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">60%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            {quickStats.map((stat) => (
              <div key={stat.label} className="text-center p-2 bg-card rounded-lg border border-border">
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Revenue by Tier */}
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue by Service Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {tierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {tierData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Utilization */}
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Team Utilization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamUtilization.map((item) => (
                <div key={item.team}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.team}</span>
                    <span className="text-foreground font-medium">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Insights */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            AI Business Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {aiInsights.map((insight, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {insight}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
