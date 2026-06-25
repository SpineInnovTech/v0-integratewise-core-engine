/**
 * Hub Home — Personal unified workspace home
 *
 * Uses real workspace data: tasks, calendar events, goals.
 * Shows computed metrics or proper empty states. No hardcoded values.
 */
import { useMemo } from "react";
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Activity,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";

export function HubHomeView() {
  const navigate = useNavigate();
  const { data: batch, isLoading } = useWorkspaceEntitiesBatch(["task", "calendar_event", "goal"], {
    domain: "PERSONAL",
  });

  const tasks = (batch.task ?? []) as any[];
  const calendarEvents = (batch.calendar_event ?? []) as any[];
  const goals = (batch.goal ?? []) as any[];

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === "Done" || t.status === "done"),
    [tasks]
  );
  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status !== "Done" && t.status !== "done"),
    [tasks]
  );
  const highPriorityTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (t.priority === "high" || t.priority === "critical") &&
          t.status !== "Done" &&
          t.status !== "done"
      ),
    [tasks]
  );

  const activeGoals = useMemo(
    () => goals.filter((g) => g.status !== "Completed" && g.status !== "Archived"),
    [goals]
  );

  const upcomingEvents = useMemo(() => {
    const now = new Date().toISOString();
    return calendarEvents
      .filter((e) => e.start_time > now || e.startTime > now)
      .sort((a, b) =>
        (a.start_time || a.startTime || "").localeCompare(b.start_time || b.startTime || "")
      )
      .slice(0, 5);
  }, [calendarEvents]);

  const hasAnyData = tasks.length > 0 || calendarEvents.length > 0 || goals.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading your workspace…</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-sm text-[var(--iw-text-secondary)]">
            {hasAnyData
              ? `You have ${pendingTasks.length} pending task${pendingTasks.length !== 1 ? "s" : ""} and ${upcomingEvents.length} upcoming event${upcomingEvents.length !== 1 ? "s" : ""}`
              : "Connect your tools to see your workspace activity here"}
          </p>
        </div>

        {/* Metrics Grid — from real data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Tasks Completed"
            value={completedTasks.length.toString()}
            sub={`${pendingTasks.length} pending`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            colorClass="text-[var(--iw-signal-success)] bg-[var(--iw-signal-success)]/10"
          />
          <MetricCard
            label="Active Goals"
            value={activeGoals.length.toString()}
            sub={`${goals.length} total tracked`}
            icon={<Target className="w-5 h-5" />}
            colorClass="text-[var(--brand-primary)] bg-[var(--brand-primary)]/10"
          />
          <MetricCard
            label="Productivity Score"
            value={
              tasks.length > 0
                ? `${Math.round((completedTasks.length / Math.max(tasks.length, 1)) * 100)}%`
                : "—"
            }
            sub={tasks.length > 0 ? "completion rate" : "No tasks yet"}
            icon={<TrendingUp className="w-5 h-5" />}
            colorClass="text-[var(--iw-gold)] bg-[var(--iw-gold)]/10"
          />
          <MetricCard
            label="Upcoming Events"
            value={upcomingEvents.length.toString()}
            sub={upcomingEvents.length > 0 ? "Next 24h" : "No events scheduled"}
            icon={<Activity className="w-5 h-5" />}
            colorClass="text-iw-gold-light bg-iw-gold-light/10"
          />
        </div>

        {/* AI Insight Banner */}
        <div
          className="rounded-xl p-6 mb-8 border"
          style={{
            background:
              "linear-gradient(135deg, rgba(61, 122, 80, 0.12) 0%, rgba(199, 159, 74, 0.08) 100%)",
            borderColor: "rgba(61, 122, 80, 0.22)",
          }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--brand-primary)]/20">
              <Sparkles className="w-6 h-6 text-[var(--brand-primary-light)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-2">AI Insight</h3>
              <p className="text-sm text-[var(--iw-text-secondary)] mb-3">
                {highPriorityTasks.length > 0
                  ? `You have ${highPriorityTasks.length} high-priority task${highPriorityTasks.length !== 1 ? "s" : ""} pending. Consider tackling these first to keep your workflow unblocked.`
                  : upcomingEvents.length > 0
                    ? `You have ${upcomingEvents.length} upcoming event${upcomingEvents.length !== 1 ? "s" : ""}. Review your calendar to prepare agendas and attendees.`
                    : "Your workspace is clear. Use this time for deep work or connect more tools to see AI-powered insights."}
              </p>
              <button
                type="button"
                onClick={() => navigate("/work/twin")}
                className="text-sm font-medium text-[var(--brand-primary-light)] hover:text-white transition-colors flex items-center gap-1"
              >
                Ask your Twin <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Goals */}
          <div
            className="rounded-xl p-6 border"
            style={{
              backgroundColor: "var(--iw-bg-secondary)",
              borderColor: "var(--iw-border)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Active Goals</h3>
              <button
                type="button"
                onClick={() => navigate("/personal/goals")}
                className="text-sm font-medium text-[#3d7a50] hover:text-[#5e9277]"
              >
                View all
              </button>
            </div>
            {activeGoals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No active goals</p>
                <p className="text-xs mt-1">Goals from your workspace will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeGoals.slice(0, 5).map((goal: any) => (
                  <div key={goal.id || goal.goal_id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white truncate pr-2">
                        {goal.title || goal.name || "Untitled goal"}
                      </span>
                      <span className="text-sm font-semibold text-white shrink-0">
                        {goal.progress || 0}%
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--iw-bg-tertiary)" }}
                    >
                      <div
                        className="h-full transition-all rounded-full"
                        style={{
                          width: `${Math.min(100, goal.progress || 0)}%`,
                          backgroundColor:
                            goal.progress >= 80
                              ? "var(--iw-signal-success)"
                              : goal.progress >= 50
                                ? "var(--iw-warning)"
                                : "var(--iw-signal-info)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div
            className="rounded-xl p-6 border"
            style={{
              backgroundColor: "var(--iw-bg-secondary)",
              borderColor: "var(--iw-border)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <button
                type="button"
                onClick={() => navigate("/personal/today")}
                className="text-sm font-medium text-[var(--brand-primary-light)] hover:text-white"
              >
                View all
              </button>
            </div>
            {tasks.length === 0 && calendarEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs mt-1">Connect tools to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.slice(0, 3).map((t: any, idx: number) => (
                  <div key={t.id || idx} className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2 shrink-0"
                      style={{
                        backgroundColor:
                          t.status === "Done" || t.status === "done"
                            ? "var(--iw-signal-success)"
                            : t.priority === "critical" || t.priority === "high"
                              ? "var(--iw-signal-critical)"
                              : "var(--iw-signal-info)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {t.title || t.task_name || "Untitled task"}
                      </div>
                      <div className="text-xs text-[var(--iw-text-tertiary)]">
                        {t.status || "todo"} · {t.priority || "medium"} priority
                        {t.due_date ? ` · due ${t.due_date}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingEvents.slice(0, 2).map((e: any, idx: number) => (
                  <div key={`evt-${e.id || idx}`} className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2 shrink-0"
                      style={{ backgroundColor: "var(--iw-gold)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {e.title || e.summary || "Event"}
                      </div>
                      <div className="text-xs text-[var(--iw-text-tertiary)]">
                        Calendar · {e.start_time || e.startTime || "scheduled"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon,
  colorClass,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <div
      className="rounded-xl p-5 border border-border hover:border-iw-slate-mid/40 transition-colors"
      style={{ backgroundColor: "var(--iw-bg-secondary)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[var(--iw-text-tertiary)]">{label}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-[var(--iw-text-tertiary)]">{sub}</div>
    </div>
  );
}
