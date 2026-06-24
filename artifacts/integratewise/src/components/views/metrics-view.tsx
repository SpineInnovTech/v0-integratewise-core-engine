import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Area as AreaBase,
  AreaChart,
  ResponsiveContainer,
  XAxis as XAxisBase,
  YAxis as YAxisBase,
  Tooltip as TooltipBase,
  PieChart,
  Pie as PieBase,
  Cell,
} from "recharts"
import type { FC } from "react"
import { Bot, TrendingUp, Briefcase, Cloud, Package, GraduationCap } from "lucide-react"
import { useMetrics } from "@/lib/hooks/use-data"
import { createClient } from "@/lib/supabase/client"

const Area = AreaBase as unknown as FC<any>
const XAxis = XAxisBase as unknown as FC<any>
const YAxis = YAxisBase as unknown as FC<any>
const Tooltip = TooltipBase as unknown as FC<any>
const Pie = PieBase as unknown as FC<any>

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
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">Business Metrics</h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Performance overview & intelligence dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
          : kpiCards.map((kpi) => (
              <Card key={kpi.title} className="bg-primary text-primary-foreground overflow-hidden border-none shadow-md relative group transition-transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary-foreground/80">{kpi.title}</p>
                    {kpi.hasChart && (
                      <div className="w-16 h-8 opacity-70 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={miniChartData}>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="rgba(255,255,255,1)"
                              fill="rgba(255,255,255,0.3)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <p className="text-4xl font-light tracking-tight">{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Sales Pipeline */}
          <Card className="bg-card border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border/50 bg-secondary/20">
              <CardTitle className="text-base font-semibold tracking-wide">Sales Pipeline Progression</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {pipelineData.map((item) => (
                <div key={item.stage} className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-sm font-semibold text-muted-foreground w-32 uppercase tracking-wider">{item.stage}</span>
                  <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden shadow-inner">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="text-sm font-bold text-foreground w-12 text-right">{item.value}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Revenue Trend & Win Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="p-6 border-b border-border/50 bg-secondary/20">
                <CardTitle className="text-base font-semibold tracking-wide">Revenue Trend (6M)</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-48 w-full -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} dy={10} />
                      <YAxis
                        tick={{ fontSize: 11, fontWeight: 600 }}
                        tickFormatter={(v: number) => `₹${v}L`}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`₹${value}L`, "Revenue"]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Win Rate Donut */}
            <Card className="bg-card border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="p-6 border-b border-border/50 bg-secondary/20">
                <CardTitle className="text-base font-semibold tracking-wide">Deal Win Rate</CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[220px]">
                <div className="relative transform hover:scale-105 transition-transform duration-500">
                  <svg className="w-36 h-36 -rotate-90">
                    <circle cx="72" cy="72" r="60" fill="none" stroke="hsl(var(--secondary))" strokeWidth="16" />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="16"
                      strokeDasharray={`${60 * 3.77} ${40 * 3.77}`}
                      strokeLinecap="round"
                      className="drop-shadow-sm"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-light tracking-tight text-foreground">60<span className="text-2xl text-muted-foreground">%</span></span>
                  </div>
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-6">Above target by 5%</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            {quickStats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center p-5 bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-3xl font-light text-foreground">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-2 text-center">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Revenue by Tier */}
          <Card className="bg-card border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-5 border-b border-border/50 bg-secondary/20">
              <CardTitle className="text-sm font-semibold tracking-wide">Revenue by Product Line</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {tierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3 px-2">
                {tierData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Insights */}
      <Card className="bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-3 text-indigo-700 dark:text-indigo-400">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <Bot className="h-5 w-5" />
            </div>
            Executive Intelligence Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-white/60 dark:bg-black/20 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                </div>
                <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
