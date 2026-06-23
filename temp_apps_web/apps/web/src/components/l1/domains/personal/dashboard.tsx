/**
 * Personal Dashboard — "Today" view for the individual workspace.
 * Shows: greeting, today's schedule, tasks, recent activity.
 *
 * All data is live from D1 Spine via useWorkspaceEntitiesBatch (workspace=PERSONAL).
 * No hardcoded values.
 */
import {
  CheckSquare,
  Calendar,
  ArrowRight,
  Activity,
  Flame,
  FileText,
  Bookmark,
  Brain,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSpine } from "@/components/l2/spine/spine-client";
import { useSpineEntitiesBatch } from "@/hooks/use-spine-entities";
import { ReadinessBar } from "@/components/l2/spine/readiness-bar";

export function PersonalDashboard({ domain = "PERSONAL" }: { domain?: string } = {}) {
  const spine = useSpine();
  // Batch to the main write path (_data tables populated by pipeline writeToEntityCache for task/calendar/document).
  // domain passed for scoping; use canonical "bookmark".
  const {
    data: batch = {},
    isLoading: batchLoading = false,
    error: batchError,
  } = useSpineEntitiesBatch(["task", "calendar_event", "document", "bookmark"], {
    domain: "PERSONAL",
  });

  // Aggressive safety: personal is sparse by design at start. Force render fast, never hang the workbench.
  const [forcedReady, setForcedReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForcedReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const taskEntities = (batch as any).task ?? [];
  const calendarEntities = (batch as any).calendar_event ?? [];
  const documentEntities = (batch as any).document ?? [];
  const bookmarkEntities = (batch as any).bookmark ?? [];

  const effectiveLoading = (batchLoading || !!batchError) && !forcedReady;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const todayTasks =
    taskEntities.length > 0
      ? taskEntities.slice(0, 5).map((t: any, i: number) => ({
          id: t.task_id || i,
          title: t.title || t.task_name || "Untitled task",
          priority: t.priority || "medium",
          done: t.status === "Done" || t.status === "done",
        }))
      : [];

  const schedule =
    calendarEntities.length > 0
      ? calendarEntities.slice(0, 5).map((e: any) => ({
          time: e.start_time
            ? new Date(e.start_time).toLocaleTimeString("en", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : "—",
          title: e.title || "Event",
          type: e.meeting_type || "meeting",
        }))
      : [];

  const completedToday = todayTasks.filter((t) => t.done).length;
  const totalToday = todayTasks.length;
  const totalConnected = spine.connectedApps?.length ?? 0;
  const hasData = taskEntities.length > 0 || calendarEntities.length > 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full bg-background min-h-[60vh]">
      {effectiveLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-iw-forest" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading personal data from Spine...
          </span>
        </div>
      )}
      <ReadinessBar department="personal" />

      {/* Hero Greeting */}
      <div className="bg-gradient-to-r from-[var(--iw-forest)]/10 to-[var(--iw-gold)]/10 border border-iw-slate-mid/20 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl mb-1" style={{ fontWeight: 600 }}>
              {greeting}, {spine.userName.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              {hasData ? (
                <>
                  You have {totalToday - completedToday} tasks and{" "}
                  {schedule.filter((s) => s.type === "meeting").length} meetings today
                </>
              ) : (
                <>Your personal workspace is ready. Connect tools or add tasks to get started.</>
              )}
            </p>
          </div>
          {totalConnected > 0 && (
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur px-3 py-1.5 rounded-lg">
              <Flame className="w-4 h-4 text-iw-gold-light" />
              <span className="text-sm" style={{ fontWeight: 600 }}>
                {totalConnected} connected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats — all derived from real data */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStat
          icon={<CheckSquare className="w-4 h-4" />}
          label="Tasks"
          value={totalToday > 0 ? `${completedToday}/${totalToday}` : "0"}
          color="var(--iw-success)"
        />
        <QuickStat
          icon={<Calendar className="w-4 h-4" />}
          label="Meetings"
          value={`${schedule.filter((s) => s.type === "meeting").length}`}
          color="var(--iw-forest-mid)"
        />
        <QuickStat
          icon={<FileText className="w-4 h-4" />}
          label="Documents"
          value={`${documentEntities.length}`}
          color="var(--iw-gold)"
        />
        <QuickStat
          icon={<Bookmark className="w-4 h-4" />}
          label="Bookmarks"
          value={`${bookmarkEntities.length}`}
          color="var(--iw-warning)"
        />
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
            {todayTasks.length > 0 ? (
              todayTasks.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors ${t.done ? "opacity-50" : ""}`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${t.done ? "bg-[var(--iw-success)] border-[var(--iw-success)]" : "border-border"}`}
                  >
                    {t.done && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span
                    className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}
                  >
                    {t.title}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.priority === "high" ? "bg-[var(--iw-danger)]/10 text-[var(--iw-danger)]" : t.priority === "medium" ? "bg-[var(--iw-warning)]/10 text-[var(--iw-warning)]" : "bg-secondary text-muted-foreground"}`}
                    style={{ fontWeight: 500 }}
                  >
                    {t.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 space-y-2">
                <CheckSquare className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">No tasks yet</p>
                <p className="text-xs text-muted-foreground/70">
                  Connect a task manager or create tasks from AI Chat
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3>Schedule</h3>
            <span className="text-xs text-muted-foreground">{todayStr}</span>
          </div>
          <div className="space-y-1">
            {schedule.length > 0 ? (
              schedule.map((ev, i) => {
                const typeColors: Record<string, string> = {
                  meeting: "var(--iw-forest-mid)",
                  work: "var(--iw-gold)",
                  focus: "var(--iw-success)",
                };
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-xs text-muted-foreground w-10 font-mono">{ev.time}</span>
                    <div
                      className="w-0.5 h-6 rounded-full"
                      style={{ backgroundColor: typeColors[ev.type] || "var(--border)" }}
                    />
                    <div className="flex-1">
                      <div className="text-sm" style={{ fontWeight: 500 }}>
                        {ev.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground capitalize">{ev.type}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 space-y-2">
                <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">No events today</p>
                <p className="text-xs text-muted-foreground/70">
                  Connect Google Calendar or Outlook to see your schedule
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Getting Started / Activity */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-3">{hasData ? "Recent Activity" : "Get Started"}</h3>
        <div className="space-y-2">
          {hasData ? (
            <div className="space-y-2">
              {taskEntities.length > 0 && (
                <ActivityRow
                  icon={<CheckSquare className="w-3.5 h-3.5" />}
                  text={`${taskEntities.length} tasks synced from connected tools`}
                  color="var(--iw-success)"
                />
              )}
              {calendarEntities.length > 0 && (
                <ActivityRow
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  text={`${calendarEntities.length} calendar events loaded`}
                  color="var(--iw-forest-mid)"
                />
              )}
              {documentEntities.length > 0 && (
                <ActivityRow
                  icon={<FileText className="w-3.5 h-3.5" />}
                  text={`${documentEntities.length} documents in your workspace`}
                  color="var(--iw-gold)"
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <GetStartedCard
                icon={<Activity className="w-5 h-5" />}
                title="Connect Tools"
                description="Link your calendar, task manager, or CRM"
              />
              <GetStartedCard
                icon={<Brain className="w-5 h-5" />}
                title="Try AI Chat"
                description="Ask your Digital Twin anything about your workspace"
              />
              <GetStartedCard
                icon={<CheckSquare className="w-5 h-5" />}
                title="Add a Task"
                description="Create your first task to start tracking work"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg" style={{ fontWeight: 600, color }}>
        {value}
      </div>
    </div>
  );
}

function ActivityRow({
  icon,
  text,
  color,
}: {
  icon: React.ReactNode;
  text: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-secondary/30">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

function GetStartedCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-dashed border-border rounded-lg p-4 hover:bg-secondary/30 transition-colors cursor-pointer">
      <div className="text-muted-foreground mb-2">{icon}</div>
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  );
}
