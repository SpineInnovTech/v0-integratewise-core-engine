/**
 * Personal Dashboard — "Today" view for the individual workspace.
 * Shows: greeting, today's schedule, tasks, recent activity, goals progress.
 */
import {
  CheckSquare,
  Calendar,
  ArrowRight,
  Target,
  Activity,
  Flame,
  Star,
  Coffee,
} from "lucide-react";
import { useSpine } from "../../spine/spine-client";

export function PersonalDashboard() {
  const spine = useSpine();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const todayTasks = [
    { id: 1, title: "Review Q1 OKR alignment doc", priority: "high", done: false },
    { id: 2, title: "Prepare customer health report", priority: "high", done: false },
    { id: 3, title: "Update pipeline forecasting model", priority: "medium", done: false },
    { id: 4, title: "Send follow-up to CloudBridge APAC", priority: "medium", done: true },
    { id: 5, title: "Team sync preparation", priority: "low", done: true },
  ];

  const schedule = [
    { time: "09:00", title: "Team Standup", type: "meeting" },
    { time: "10:00", title: "CloudBridge QBR Prep", type: "work" },
    { time: "11:30", title: "Product Demo — HealthTech", type: "meeting" },
    { time: "14:00", title: "Pipeline Review", type: "meeting" },
    { time: "15:30", title: "Deep Work — Forecasting", type: "focus" },
  ];

  const streak = 12; // days streak
  const completedToday = todayTasks.filter(t => t.done).length;
  const totalToday = todayTasks.length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Hero Greeting */}
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl mb-1" style={{ fontWeight: 600 }}>
              {greeting}, {spine.userName.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              You have {totalToday - completedToday} tasks and {schedule.filter(s => s.type === "meeting").length} meetings today
            </p>
          </div>
          <div className="flex items-center gap-2 bg-card/50 backdrop-blur px-3 py-1.5 rounded-lg">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm" style={{ fontWeight: 600 }}>{streak} day streak</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStat icon={<CheckSquare className="w-4 h-4" />} label="Tasks Done" value={`${completedToday}/${totalToday}`} color="var(--iw-success)" />
        <QuickStat icon={<Calendar className="w-4 h-4" />} label="Meetings" value={`${schedule.filter(s => s.type === "meeting").length}`} color="var(--iw-blue)" />
        <QuickStat icon={<Target className="w-4 h-4" />} label="Goals Progress" value="68%" color="var(--iw-purple)" />
        <QuickStat icon={<Activity className="w-4 h-4" />} label="Focus Hours" value="3.5h" color="var(--iw-warning)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3>Today's Tasks</h3>
            <button className="text-xs text-primary flex items-center gap-1 hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {todayTasks.map(t => (
              <div key={t.id} className={`flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors ${t.done ? "opacity-50" : ""}`}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${t.done ? "bg-[var(--iw-success)] border-[var(--iw-success)]" : "border-border"}`}>
                  {t.done && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.priority === "high" ? "bg-[var(--iw-danger)]/10 text-[var(--iw-danger)]" : t.priority === "medium" ? "bg-[var(--iw-warning)]/10 text-[var(--iw-warning)]" : "bg-secondary text-muted-foreground"}`} style={{ fontWeight: 500 }}>{t.priority}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3>Schedule</h3>
            <span className="text-xs text-muted-foreground">Feb 10 · IST</span>
          </div>
          <div className="space-y-1">
            {schedule.map((ev, i) => {
              const typeColors: Record<string, string> = { meeting: "var(--iw-blue)", work: "var(--iw-purple)", focus: "var(--iw-success)" };
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors">
                  <span className="text-xs text-muted-foreground w-10 font-mono">{ev.time}</span>
                  <div className="w-0.5 h-6 rounded-full" style={{ backgroundColor: typeColors[ev.type] || "var(--border)" }} />
                  <div className="flex-1">
                    <div className="text-sm" style={{ fontWeight: 500 }}>{ev.title}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{ev.type}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity (from Spine) */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {[
            { action: "Updated deal stage for TechServe Expansion", time: "1h ago", icon: "📊" },
            { action: "Added note to CloudBridge QBR doc", time: "2h ago", icon: "📝" },
            { action: "Reviewed PR #234 — connector retry logic", time: "3h ago", icon: "🐙" },
            { action: "Sent follow-up email to HealthTech", time: "5h ago", icon: "📧" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors">
              <span className="text-sm">{a.icon}</span>
              <span className="flex-1 text-sm">{a.action}</span>
              <span className="text-[11px] text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg" style={{ fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
