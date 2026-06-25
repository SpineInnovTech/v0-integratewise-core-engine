import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, TrendingUp, TrendingDown, Users, DollarSign, Target,
  CheckSquare, AlertTriangle, Lightbulb, Activity, Zap, Clock,
  Calendar, MessageSquare, Mail, Bot, BarChart3, Building2,
  FolderKanban, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function LiveKPI({ label, value, change, trend, icon: Icon, href }: {
  label: string; value: string; change?: number; trend?: "up" | "down";
  icon: any; href: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-28 hover:border-primary/50 transition-all cursor-pointer group">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors w-fit">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{value}</span>
              {change !== undefined && (
                <span className={cn("text-xs font-medium flex items-center", trend === "up" ? "text-green-600" : "text-red-500")}>
                  {trend === "up" ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {Math.abs(change)}%
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ActivityItem({ icon: Icon, title, time, type }: { icon: any; title: string; time: string; type: string }) {
  const colors: Record<string, string> = {
    task: "text-blue-500 bg-blue-500/10", deal: "text-green-500 bg-green-500/10",
    client: "text-purple-500 bg-purple-500/10", alert: "text-amber-500 bg-amber-500/10",
    insight: "text-primary bg-primary/10",
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={cn("p-2 rounded-lg shrink-0", colors[type] || colors.insight)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <Link href={href}>
      <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-10 bg-transparent">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{label}</span>
      </Button>
    </Link>
  );
}

function SystemStatus({ name, status, lastSync }: { name: string; status: "connected" | "syncing" | "error"; lastSync: string }) {
  const dot = { connected: "bg-green-500", syncing: "bg-amber-500 animate-pulse", error: "bg-red-500" };
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full", dot[status])} />
        <span className="text-sm">{name}</span>
      </div>
      <span className="text-xs text-muted-foreground">{lastSync}</span>
    </div>
  );
}

export function CommandCenterView() {
  const [activeTab, setActiveTab] = useState<"overview" | "insights" | "alerts">("overview");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Command Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Good {greeting}, Nirmal</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 py-1">
              <Activity className="h-3 w-3 text-green-500" /> All Systems Live
            </Badge>
            <Button size="sm" className="gap-2"><Bot className="h-4 w-4" /> AI Assistant</Button>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-4">
          {[{ id: "overview", label: "Overview" }, { id: "insights", label: "AI Insights" }, { id: "alerts", label: "Alerts" }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <LiveKPI label="MRR" value="₹5.4L" change={12} trend="up" icon={DollarSign} href="/app/metrics" />
          <LiveKPI label="Pipeline" value="₹1.28Cr" change={8} trend="up" icon={Target} href="/app/pipeline" />
          <LiveKPI label="Active Clients" value="10" change={5} trend="up" icon={Building2} href="/app/clients" />
          <LiveKPI label="Open Deals" value="4" icon={BarChart3} href="/app/deals" />
          <LiveKPI label="Pending Tasks" value="7" icon={CheckSquare} href="/app/tasks" />
          <LiveKPI label="Active Projects" value="3" icon={FolderKanban} href="/app/projects" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Today's Focus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { color: "green", icon: Target, title: "Follow up with TechCorp India", sub: "Contract renewal due in 5 days" },
                  { color: "amber", icon: AlertTriangle, title: "Review MuleSoft project milestone", sub: "Phase 2 deliverables pending review" },
                  { color: "blue", icon: Users, title: "Onboard EduTech Ventures", sub: "New client kickoff scheduled for today" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-lg bg-${item.color}-500/10 shrink-0`}>
                      <item.icon className={`h-4 w-4 text-${item.color}-500`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
                    </div>
                    <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Pipeline Stages
                    <Link href="/app/pipeline" className="text-xs text-primary hover:underline">View all</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[["Discovery", 2, "₹45L"], ["Qualification", 1, "₹28L"], ["Proposal", 3, "₹72L"], ["Negotiation", 1, "₹35L"]].map(([stage, count, value]) => (
                    <div key={stage as string} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm">{stage}</span>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </div>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Team Utilization
                    <Link href="/app/metrics" className="text-xs text-primary hover:underline">Details</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[["Consulting", 85], ["Implementation", 92], ["Support", 68]].map(([team, val]) => (
                    <div key={team as string}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{team}</span>
                        <span className="font-medium">{val}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", (val as number) > 80 ? "bg-green-500" : (val as number) > 60 ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Quick Actions</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <QuickAction icon={CheckSquare} label="New Task" href="/app/tasks" />
                <QuickAction icon={Target} label="Add Deal" href="/app/deals" />
                <QuickAction icon={Users} label="Add Client" href="/app/clients" />
                <QuickAction icon={Lightbulb} label="Brainstorm" href="/app/brainstorming" />
                <QuickAction icon={Calendar} label="Schedule" href="/app/sessions" />
                <QuickAction icon={Mail} label="Compose" href="/app/campaigns" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Recent Activity <Clock className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64 px-4">
                  <ActivityItem icon={CheckSquare} title="Task completed: Review MuleSoft docs" time="10 min ago" type="task" />
                  <ActivityItem icon={Target} title="Deal moved to Negotiation" time="25 min ago" type="deal" />
                  <ActivityItem icon={Users} title="New client: EduTech Ventures" time="1 hour ago" type="client" />
                  <ActivityItem icon={Sparkles} title="AI Insight: Revenue trend up 15%" time="2 hours ago" type="insight" />
                  <ActivityItem icon={AlertTriangle} title="Alert: Invoice overdue - FitServ" time="3 hours ago" type="alert" />
                  <ActivityItem icon={MessageSquare} title="Slack message from TechCorp" time="4 hours ago" type="task" />
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" /> Connected Systems
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                <SystemStatus name="Platform Gateway" status="connected" lastSync="Live" />
                <SystemStatus name="Stripe" status="connected" lastSync="2 min ago" />
                <SystemStatus name="Slack" status="connected" lastSync="5 min ago" />
                <SystemStatus name="HubSpot" status="syncing" lastSync="Syncing..." />
                <SystemStatus name="Gmail" status="connected" lastSync="15 min ago" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
