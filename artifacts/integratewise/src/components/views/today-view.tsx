import { useState } from "react";
import { Link } from "wouter";
import {
  TrendingUp, CheckCircle, FileText, Calendar, CheckSquare,
  Clock, Plus, Brain, Target, Users, ArrowRight, Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

interface Task { id: string; title: string; description?: string; priority: "high" | "medium" | "low"; done: boolean; }
interface Event { id: string; title: string; time: string; duration: number; type: string; }
interface Activity { id: string; text: string; relative: string; icon: React.ReactNode; }

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Follow up with TechCorp India on renewal", description: "Contract renewal due in 5 days", priority: "high", done: false },
  { id: "t2", title: "Review MuleSoft project milestone", description: "Phase 2 deliverables pending review", priority: "high", done: false },
  { id: "t3", title: "Send Q4 pipeline report to leadership", priority: "medium", done: false },
  { id: "t4", title: "Update EduTech Ventures onboarding deck", priority: "low", done: true },
];

const EVENTS: Event[] = [
  { id: "e1", title: "Weekly CS Sync", time: "10:00 AM", duration: 30, type: "internal" },
  { id: "e2", title: "Nexlify QBR Prep", time: "2:00 PM", duration: 60, type: "customer" },
  { id: "e3", title: "Pipeline Review — Nirmal", time: "4:30 PM", duration: 45, type: "internal" },
];

const ACTIVITY: Activity[] = [
  { id: "a1", text: "Deal updated: CloudScale expansion to $450K ARR", relative: "1 hour ago", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "a2", text: "Lead qualified: Hyderabad Fintech (score 84)", relative: "2 hours ago", icon: <Target className="h-4 w-4" /> },
  { id: "a3", text: "Email received from mike.j@nexlify.com", relative: "3 hours ago", icon: <FileText className="h-4 w-4" /> },
  { id: "a4", text: "Task completed: Q3 retrospective doc", relative: "Yesterday", icon: <CheckSquare className="h-4 w-4" /> },
];

const KPI = [
  { title: "MRR", value: "₹5.4L", icon: TrendingUp, delta: "+12%" },
  { title: "Pipeline", value: "₹1.28Cr", icon: TrendingUp, delta: "+8%" },
  { title: "Active Clients", value: "10", icon: Users, delta: "+5%" },
  { title: "Open Tasks", value: "7", icon: CheckSquare, delta: "" },
];

export function TodayView() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Today</h1>
          <p className="text-base text-muted-foreground mt-1">{TODAY}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/iq-hub"><Button variant="outline" size="sm"><Brain className="h-4 w-4 mr-2" />IQ Hub</Button></Link>
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />Quick Add</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map((k) => (
          <Card key={k.title} className="bg-gradient-to-br from-card to-card/95">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{k.title}</p>
                  <p className="text-3xl font-bold mt-1">{k.value}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10"><k.icon className="h-5 w-5 text-primary" /></div>
              </div>
              {k.delta && <p className="text-xs text-green-600 font-semibold mt-2">{k.delta}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><CheckSquare className="h-5 w-5" />Today's Tasks</span>
                <Link href="/tasks"><Button variant="ghost" size="sm">View All<ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className={cn("flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors", task.done && "opacity-60")}>
                  <Checkbox checked={task.done} onCheckedChange={() => toggle(task.id)} />
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", task.done && "line-through text-muted-foreground")}>{task.title}</p>
                    {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                  </div>
                  <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}>{task.priority}</Badge>
                </div>
              ))}
              {tasks.every((t) => t.done) && (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All tasks done — great work!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Calendar className="h-5 w-5" />Today's Schedule</span>
                <Link href="/sessions"><Button variant="ghost" size="sm">View Calendar<ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {EVENTS.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="p-2 rounded-lg bg-primary/10"><Calendar className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{ev.time} · {ev.duration} min</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{ev.type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ACTIVITY.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">{a.icon}</div>
                  <div>
                    <p className="text-sm font-medium">{a.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.relative}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/tasks", icon: CheckSquare, label: "New Task" },
                { href: "/iq-hub", icon: Brain, label: "Open IQ Hub" },
                { href: "/clients", icon: Users, label: "Add Client" },
                { href: "/deals", icon: Target, label: "New Deal" },
                { href: "/cockpit", icon: Zap, label: "Business OS" },
              ].map((a) => (
                <Link key={a.href} href={a.href}>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <a.icon className="h-4 w-4 mr-2" />{a.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Switch View</CardTitle>
              <CardDescription>Navigate to role-based views</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/cs-accounts", icon: Users, label: "CS View" },
                { href: "/pipeline", icon: Target, label: "Sales View" },
                { href: "/campaigns", icon: FileText, label: "Marketing View" },
                { href: "/cockpit", icon: TrendingUp, label: "Cockpit" },
              ].map((a) => (
                <Link key={a.href} href={a.href}>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <a.icon className="h-4 w-4 mr-2" />{a.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
