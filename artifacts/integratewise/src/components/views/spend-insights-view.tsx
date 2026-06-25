import { useState } from "react";
import { DollarSign, TrendingUp, AlertTriangle, CreditCard, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MOCK: Record<string, {
  mrr: number; arr: number; totalSpend: number; churnRate: number;
  trend: { month: string; mrr: number }[];
  insights: { id: string; type: string; title: string; description: string; value: number; period: string; source: string }[];
}> = {
  month: {
    mrr: 124500, arr: 1494000, totalSpend: 38200, churnRate: 1.8,
    trend: [
      { month: "Jul", mrr: 98000 }, { month: "Aug", mrr: 101000 }, { month: "Sep", mrr: 105000 },
      { month: "Oct", mrr: 108000 }, { month: "Nov", mrr: 112000 }, { month: "Dec", mrr: 115000 },
      { month: "Jan", mrr: 117500 }, { month: "Feb", mrr: 119000 }, { month: "Mar", mrr: 120500 },
      { month: "Apr", mrr: 121800 }, { month: "May", mrr: 123200 }, { month: "Jun", mrr: 124500 },
    ],
    insights: [
      { id: "1", type: "spend", title: "MRR Growth", description: "MRR grew 12.5% in the past 30 days", value: 124500, period: "Jun 2026", source: "Billing" },
      { id: "2", type: "forecast", title: "ARR Run Rate", description: "Annualized from current MRR", value: 1494000, period: "2026", source: "Internal" },
      { id: "3", type: "anomaly", title: "Infrastructure Spike", description: "Cloud spend 18% above forecast this month", value: 4200, period: "Jun 2026", source: "AWS" },
    ],
  },
  quarter: {
    mrr: 124500, arr: 1494000, totalSpend: 112000, churnRate: 2.1,
    trend: [
      { month: "Oct", mrr: 108000 }, { month: "Nov", mrr: 112000 }, { month: "Dec", mrr: 115000 },
      { month: "Jan", mrr: 117500 }, { month: "Feb", mrr: 119000 }, { month: "Mar", mrr: 120500 },
      { month: "Apr", mrr: 121800 }, { month: "May", mrr: 123200 }, { month: "Jun", mrr: 124500 },
    ],
    insights: [
      { id: "1", type: "spend", title: "Q2 Revenue", description: "Total revenue for the quarter", value: 373500, period: "Q2 2026", source: "Billing" },
    ],
  },
  year: {
    mrr: 124500, arr: 1494000, totalSpend: 428000, churnRate: 2.4,
    trend: [
      { month: "Jul", mrr: 85000 }, { month: "Aug", mrr: 89000 }, { month: "Sep", mrr: 93000 },
      { month: "Oct", mrr: 98000 }, { month: "Nov", mrr: 105000 }, { month: "Dec", mrr: 110000 },
      { month: "Jan", mrr: 114000 }, { month: "Feb", mrr: 117000 }, { month: "Mar", mrr: 119500 },
      { month: "Apr", mrr: 121000 }, { month: "May", mrr: 123200 }, { month: "Jun", mrr: 124500 },
    ],
    insights: [
      { id: "1", type: "spend", title: "Annual Revenue", description: "Total revenue for FY26", value: 1284000, period: "FY26", source: "Billing" },
      { id: "2", type: "forecast", title: "NRR", description: "Net Revenue Retention across all accounts", value: 118, period: "FY26", source: "Internal" },
    ],
  },
};

const fmt$ = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  spend: <DollarSign className="h-5 w-5 text-green-500" />,
  forecast: <TrendingUp className="h-5 w-5 text-blue-500" />,
  anomaly: <AlertTriangle className="h-5 w-5 text-red-500" />,
  usage: <BarChart3 className="h-5 w-5 text-purple-500" />,
};

export function SpendInsightsView() {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const data = MOCK[period];
  const maxMrr = Math.max(...data.trend.map((t) => t.mrr));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Spend Insights</h1>
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
          <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "MRR", value: fmt$(data.mrr), icon: <DollarSign className="h-5 w-5 text-green-600" />, bg: "bg-green-100", sub: "Monthly Recurring Revenue", up: true },
          { label: "ARR", value: fmt$(data.arr), icon: <BarChart3 className="h-5 w-5 text-blue-600" />, bg: "bg-blue-100", sub: "Annual Recurring Revenue", up: true },
          { label: "Total Spend", value: fmt$(data.totalSpend), icon: <CreditCard className="h-5 w-5 text-purple-600" />, bg: "bg-purple-100", sub: `This ${period}`, up: null },
          { label: "Churn Rate", value: `${data.churnRate}%`, icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />, bg: "bg-yellow-100", sub: "Low & stable", up: false },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold">{k.value}</p>
                </div>
                <div className={`p-2 ${k.bg} rounded-lg`}>{k.icon}</div>
              </div>
              <div className={`flex items-center gap-1 mt-2 text-sm ${k.up === true ? "text-green-600" : k.up === false ? "text-green-600" : "text-muted-foreground"}`}>
                {k.up === true ? <ArrowUpRight className="h-4 w-4" /> : k.up === false ? <ArrowDownRight className="h-4 w-4" /> : null}
                <span>{k.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MRR Trend</CardTitle>
          <CardDescription>Monthly recurring revenue over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-1.5">
            {data.trend.map((item, idx) => {
              const height = Math.max((item.mrr / maxMrr) * 100, 4);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full bg-primary/70 rounded-t hover:bg-primary transition-colors" style={{ height: `${height}%` }} title={`${item.month}: ${fmt$(item.mrr)}`} />
                  <span className="text-xs text-muted-foreground">{item.month}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend Insights</CardTitle>
          <CardDescription>AI-generated insights from your billing data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.insights.map((insight) => (
            <div key={insight.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-muted rounded-lg">{INSIGHT_ICONS[insight.type] ?? INSIGHT_ICONS.usage}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{insight.title}</h4>
                  <Badge variant="outline">{insight.period}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-lg font-semibold">{insight.type === "forecast" && insight.title === "NRR" ? `${insight.value}%` : fmt$(insight.value)}</span>
                  <span className="text-xs text-muted-foreground">Source: {insight.source}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
