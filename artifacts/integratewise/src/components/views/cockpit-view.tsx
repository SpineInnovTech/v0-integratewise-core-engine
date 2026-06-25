import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, TrendingUp, TrendingDown, Users, DollarSign, Target,
  CheckSquare, AlertTriangle, Lightbulb, Activity, Zap, Clock,
  Calendar, MessageSquare, Mail, Bot, BarChart3, Building2,
  FolderKanban, Sparkles, Settings, GitBranch, Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function KpiCard({ label, value, change, trend, icon: Icon, href }: {
  label: string; value: string; change?: number; trend?: "up" | "down"; icon: any; href: string;
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

export function CockpitView() {
  const [activeTab, setActiveTab] = useState<"overview" | "insights" | "alerts">("overview");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-2 pb-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nirmal's Cockpit</h1>
            <p className="text-base text-muted-foreground">Good {greeting}, Nirmal. Your personal command view.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 py-1">
              <Activity className="h-3 w-3 text-green-500" /> All Systems Live
            </Badge>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-2"><Settings className="h-4 w-4" />Admin</Button>
            </Link>
            <Link href="/release-control">
              <Button variant="outline" size="sm" className="gap-2"><GitBranch className="h-4 w-4" />Releases</Button>
            </Link>
            <Button size="sm" className="gap-2"><Bot className="h-4 w-4" />AI Assistant</Button>
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <KpiCard label="MRR" value="₹5.4L" change={12} trend="up" icon={DollarSign} href="/metrics" />
        <KpiCard label="Pipeline" value="₹1.28Cr" change={8} trend="up" icon={Target} href="/pipeline" />
        <KpiCard label="Active Clients" value="10" change={5} trend="up" icon={Building2} href="/clients" />
        <KpiCard label="Open Deals" value="4" icon={BarChart3} href="/deals" />
        <KpiCard label="Pending Tasks" value="7" icon={CheckSquare} href="/tasks" />
        <KpiCard label="Active Projects" value="3" icon={FolderKanban} href="/projects" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
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
                  <Link href="/pipeline" className="text-xs text-primary hover:underline">View all</Link>
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
                  <Link href="/metrics" className="text-xs text-primary hover:underline">Details</Link>
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
                      <div className={cn("h-full rounded-full", (val as number) > 80 ? "bg-green-500/80" : (val as number) > 60 ? "bg-amber-500/80" : "bg-red-500/80")}
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
              {[
                [CheckSquare, "New Task", "/tasks"], [Target, "Add Deal", "/deals"],
                [Users, "Add Client", "/clients"], [Brain, "IQ Hub", "/iq-hub"],
                [Calendar, "Schedule", "/sessions"], [Mail, "Compose", "/campaigns"],
              ].map(([Icon, label, href]) => (
                <Link key={label as string} href={href as string}>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-10 bg-transparent">
                    {/* @ts-ignore */}
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{label as string}</span>
                  </Button>
                </Link>
              ))}
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
              {[
                ["Platform Gateway", "connected", "Live"], ["Stripe", "connected", "2 min ago"],
                ["Slack", "connected", "5 min ago"], ["HubSpot", "syncing", "Syncing..."],
                ["Gmail", "connected", "15 min ago"],
              ].map(([name, status, sync]) => (
                <div key={name as string} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", status === "connected" ? "bg-green-500" : "bg-amber-500 animate-pulse")} />
                    <span className="text-sm">{name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{sync}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
