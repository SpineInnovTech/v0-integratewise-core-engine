import { useState } from "react";
import {
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
  Target, Users, DollarSign, Activity, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Insight {
  id: string;
  type: "trend" | "risk" | "opportunity" | "metric";
  title: string;
  description: string;
  value?: string;
  change?: number;
  priority: "high" | "medium" | "low";
  source: string;
}

const INSIGHTS: Insight[] = [
  { id: "1", type: "metric", title: "Monthly Recurring Revenue", description: "Total MRR from all active subscriptions", value: "$124,500", change: 12.5, priority: "high", source: "Stripe" },
  { id: "2", type: "trend", title: "Customer Engagement Up", description: "Average session duration increased by 23% this week", change: 23, priority: "medium", source: "Analytics" },
  { id: "3", type: "risk", title: "Churn Risk Detected", description: "3 enterprise accounts showing reduced activity", priority: "high", source: "CRM" },
  { id: "4", type: "opportunity", title: "Upsell Opportunity", description: "5 accounts approaching usage limits — potential upgrade candidates", priority: "medium", source: "Internal" },
  { id: "5", type: "trend", title: "Pipeline Velocity +18%", description: "Deals moving faster through stages compared to last quarter", change: 18, priority: "medium", source: "CRM" },
  { id: "6", type: "opportunity", title: "Content Engagement Peak", description: "Blog posts driving 40% of inbound leads this week", change: 40, priority: "low", source: "Analytics" },
];

const TYPE_ICON: Record<string, React.ReactNode> = {
  trend: <TrendingUp className="h-5 w-5 text-blue-500" />,
  risk: <AlertTriangle className="h-5 w-5 text-red-500" />,
  opportunity: <Lightbulb className="h-5 w-5 text-yellow-500" />,
  metric: <Activity className="h-5 w-5 text-green-500" />,
};

const KPI_CARDS = [
  { label: "Total Revenue", value: "$124,500", change: "+12.5%", up: true, icon: <DollarSign className="h-5 w-5 text-green-600" />, bg: "bg-green-100", sub: "vs last month" },
  { label: "Active Clients", value: "48", change: "+3", up: true, icon: <Users className="h-5 w-5 text-blue-600" />, bg: "bg-blue-100", sub: "this month" },
  { label: "Tasks Completed", value: "156", change: "+28%", up: true, icon: <Target className="h-5 w-5 text-purple-600" />, bg: "bg-purple-100", sub: "productivity" },
  { label: "Health Score", value: "87%", change: "-2%", up: false, icon: <Activity className="h-5 w-5 text-yellow-600" />, bg: "bg-yellow-100", sub: "vs last week" },
];

export function InsightsView() {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all" ? INSIGHTS : INSIGHTS.filter((i) => i.type === activeTab);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-muted-foreground mt-1">AI-powered insights and signals from your connected data</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {KPI_CARDS.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold">{k.value}</p>
                </div>
                <div className={`p-2 ${k.bg} rounded-lg`}>{k.icon}</div>
              </div>
              <div className={`flex items-center gap-1 mt-2 text-sm ${k.up ? "text-green-600" : "text-red-600"}`}>
                {k.up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{k.change}</span>
                <span className="text-muted-foreground">{k.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
              {filtered.map((insight) => (
                <div key={insight.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-2 bg-muted rounded-lg">{TYPE_ICON[insight.type] ?? TYPE_ICON.metric}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant={insight.priority === "high" ? "destructive" : insight.priority === "medium" ? "default" : "secondary"}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {insight.value && <span className="text-lg font-semibold">{insight.value}</span>}
                      {insight.change !== undefined && (
                        <span className={`flex items-center text-sm ${insight.change > 0 ? "text-green-600" : "text-red-600"}`}>
                          {insight.change > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                          {insight.change > 0 ? "+" : ""}{insight.change}%
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
  );
}
