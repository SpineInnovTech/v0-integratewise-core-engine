/**
 * Hub Today — Execution layer for today
 *
 * L2: useL2Insights for cross-domain AI signals (personal-today view).
 * "Suggested by IntegrateWise" card: What it found + Why it matters + Approve/Dismiss.
 *
 * Priority Cards + Next Steps are derived from real task/calendar data.
 * No hardcoded fake values.
 */
import { useState } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  CheckSquare,
  TrendingUp,
  Target,
  Zap,
  ThumbsUp,
  X,
  MessageSquare,
  Activity,
} from "lucide-react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { useL2Insights, useL2DismissInsight } from "@/hooks/use-l2";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import type { L2Insight } from "@/lib/l2-client";

function SuggestedByIntegrateWiseCard({
  insight,
  onApprove,
  onDismiss,
  isLoading,
}: {
  insight: L2Insight;
  onApprove: () => void;
  onDismiss: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="l2-suggested-card rounded-xl p-6 mb-8 border">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-iw-paper-deep/50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-6 h-6 text-iw-gold-light" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold text-iw-gold-light/90 uppercase tracking-wide">
              Suggested by IntegrateWise
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">What it found</h2>
          <p className="text-sm text-foreground/90 mb-3">{insight.title}</p>
          {insight.whyItMatters && (
            <>
              <h3 className="text-sm font-semibold text-muted-foreground/80 mb-1">
                Why it matters
              </h3>
              <p className="text-sm text-muted-foreground/80 mb-4">{insight.whyItMatters}</p>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center gap-2 px-4 py-2 bg-iw-paper-warm text-iw-forest rounded-lg font-semibold hover:shadow-lg transition-shadow text-sm border border-iw-rule"
            >
              <ThumbsUp className="w-4 h-4" />
              Show me the path
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-iw-paper-deep/30 text-iw-ink/90 rounded-lg font-medium hover:bg-iw-paper-deep/50 transition-colors text-sm border border-iw-rule/30"
            >
              <X className="w-4 h-4" />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HubTodayView() {
  const auth = useAuth();
  const l2Ctx = auth.user?.id
    ? { userId: auth.user.id, domain: "PERSONAL", viewId: "personal-today" }
    : null;
  const { data: insights = [] } = useL2Insights(l2Ctx);
  const dismissMutation = useL2DismissInsight(l2Ctx);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Real data from Supabase
  const { data: batch } = useWorkspaceEntitiesBatch(["task", "calendar_event"], {
    domain: "PERSONAL",
  });
  const taskEntities = batch.task ?? [];
  const calendarEntities = batch.calendar_event ?? [];

  const visibleInsights = insights.filter((i) => !dismissedIds.has(i.id));

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Derive priority stats from real tasks
  const highPriorityTasks = taskEntities.filter(
    (t: any) => t.priority === "high" && t.status !== "Done" && t.status !== "done"
  );
  const pendingTasks = taskEntities.filter((t: any) => t.status !== "Done" && t.status !== "done");
  const completedTasks = taskEntities.filter(
    (t: any) => t.status === "Done" || t.status === "done"
  );
  const upcomingMeetings = calendarEntities.slice(0, 5);
  const hasData = taskEntities.length > 0 || calendarEntities.length > 0;

  return (
    <div className="p-6 md:p-8 min-h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[var(--iw-text-secondary)] mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{today}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{greeting}</h1>
          <p className="text-sm text-[var(--iw-text-secondary)]">
            {hasData
              ? `${pendingTasks.length} tasks pending · ${upcomingMeetings.length} upcoming events`
              : "Your execution layer for today — connect tools to populate"}
          </p>
        </div>

        {/* Suggested by IntegrateWise — L2 insight card (Approval-First pattern) */}
        {visibleInsights.length > 0 ? (
          visibleInsights.map((insight: L2Insight) => (
            <SuggestedByIntegrateWiseCard
              key={insight.id}
              insight={insight}
              onApprove={() => {
                window.dispatchEvent(
                  new CustomEvent("open-cognitive-layer", { detail: { insightId: insight.id } })
                );
              }}
              onDismiss={() => {
                setDismissedIds((prev) => new Set(prev).add(insight.id));
                dismissMutation.mutate(insight.id);
              }}
              isLoading={dismissMutation.isPending}
            />
          ))
        ) : hasData ? (
          /* Only show welcome card when there's data but no AI insights yet */
          <div className="l2-suggested-card rounded-xl p-6 mb-8 border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-iw-paper-deep/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-iw-gold-light" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white mb-2">AI Insights</h2>
                <p className="text-sm text-foreground/90 mb-4">
                  IntegrateWise is analyzing your workspace data. AI-generated insights and
                  recommendations will appear here as patterns emerge.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Priority Cards — derived from real data */}
        {hasData ? (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Today's Focus</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl p-6 border-l-4 border-[var(--iw-signal-critical)] bg-[var(--iw-bg-secondary)] border border-border hover:border-iw-slate-mid/40 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-[var(--iw-signal-critical)]" />
                  <span className="text-xs font-semibold text-[var(--iw-signal-critical)] uppercase">
                    High Priority
                  </span>
                </div>
                <h3 className="font-bold text-white mb-2">
                  {highPriorityTasks.length} urgent task{highPriorityTasks.length !== 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-[var(--iw-text-secondary)] mb-4">
                  {highPriorityTasks.length > 0
                    ? highPriorityTasks
                        .slice(0, 2)
                        .map((t: any) => t.title || t.task_name)
                        .join(", ")
                    : "No urgent items right now"}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--iw-text-tertiary)]">
                  <CheckSquare className="w-4 h-4" />
                  <span>{highPriorityTasks.length} need attention</span>
                </div>
              </div>

              <div className="rounded-xl p-6 border-l-4 border-iw-gold bg-[var(--iw-bg-secondary)] border border-border hover:border-iw-slate-mid/40 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-iw-gold" />
                  <span className="text-xs font-semibold text-iw-gold uppercase">Pending</span>
                </div>
                <h3 className="font-bold text-white mb-2">
                  {pendingTasks.length} open task{pendingTasks.length !== 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-[var(--iw-text-secondary)] mb-4">
                  {pendingTasks.length > 0
                    ? `${completedTasks.length} completed so far`
                    : "All caught up"}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--iw-text-tertiary)]">
                  <Clock className="w-4 h-4" />
                  <span>
                    {taskEntities.length > 0
                      ? `${Math.round((completedTasks.length / taskEntities.length) * 100)}% completion`
                      : "No tasks"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl p-6 border-l-4 border-[var(--iw-signal-success)] bg-[var(--iw-bg-secondary)] border border-border hover:border-iw-slate-mid/40 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-[var(--iw-signal-success)]" />
                  <span className="text-xs font-semibold text-[var(--iw-signal-success)] uppercase">
                    Upcoming
                  </span>
                </div>
                <h3 className="font-bold text-white mb-2">
                  {upcomingMeetings.length} event{upcomingMeetings.length !== 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-[var(--iw-text-secondary)] mb-4">
                  {upcomingMeetings.length > 0
                    ? (upcomingMeetings[0] as any).title || "Next event"
                    : "No events scheduled"}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--iw-text-tertiary)]">
                  <Calendar className="w-4 h-4" />
                  <span>From connected calendars</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Getting started — when no data exists */
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Get Started</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GetStartedCard
                icon={<Activity className="w-5 h-5" />}
                color="var(--iw-signal-critical)"
                title="Connect Your Tools"
                description="Link your calendar, task manager, or CRM to populate your workspace"
                cta="Settings"
              />
              <GetStartedCard
                icon={<MessageSquare className="w-5 h-5" />}
                color="amber"
                title="Talk to Your Twin"
                description="Your AI Digital Twin can help you plan your day and manage tasks"
                cta="Open AI Chat"
              />
              <GetStartedCard
                icon={<CheckSquare className="w-5 h-5" />}
                color="var(--iw-signal-success)"
                title="Add Your First Task"
                description="Create a task to start tracking your work right away"
                cta="Add Task"
              />
            </div>
          </div>
        )}

        {/* Next Steps — contextual, derived from actual state */}
        <div className="rounded-xl p-6 border border-border bg-card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-[var(--brand-primary-light)]" />
            <h2 className="text-xl font-bold text-white">
              {hasData ? "Recommended Next Steps" : "Quick Actions"}
            </h2>
          </div>
          <div className="space-y-4">
            {hasData ? (
              <>
                {highPriorityTasks.length > 0 && (
                  <NextStepRow
                    step={1}
                    title={`Review ${highPriorityTasks.length} high-priority task${highPriorityTasks.length !== 1 ? "s" : ""}`}
                    desc="Clearing urgent items first keeps your workflow unblocked"
                    cta="View Tasks"
                  />
                )}
                {upcomingMeetings.length > 0 && (
                  <NextStepRow
                    step={highPriorityTasks.length > 0 ? 2 : 1}
                    title={`Prepare for ${upcomingMeetings.length} upcoming event${upcomingMeetings.length !== 1 ? "s" : ""}`}
                    desc="Check your calendar to review agendas and attendees"
                    cta="View Calendar"
                  />
                )}
                <NextStepRow
                  step={
                    (highPriorityTasks.length > 0 ? 1 : 0) +
                    (upcomingMeetings.length > 0 ? 1 : 0) +
                    1
                  }
                  title="Ask your Digital Twin for suggestions"
                  desc="Your Twin analyzes your workspace and surfaces actionable recommendations"
                  cta="Open AI Chat"
                />
              </>
            ) : (
              <>
                <NextStepRow
                  step={1}
                  title="Connect your first tool"
                  desc="Link a calendar, task manager, or CRM to bring your data into the workspace"
                  cta="Integrations"
                />
                <NextStepRow
                  step={2}
                  title="Explore the Knowledge Hub"
                  desc="Your AI-powered knowledge base organizes sessions, topics, and insights"
                  cta="Open"
                />
                <NextStepRow
                  step={3}
                  title="Chat with your Digital Twin"
                  desc="Your Twin learns about your workspace and helps you work faster"
                  cta="Open AI Chat"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GetStartedCard({
  icon,
  color,
  title,
  description,
  cta,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <div
      className="rounded-xl p-6 border-l-4 bg-[var(--iw-bg-secondary)] border border-border hover:border-iw-slate-mid/40 transition-colors cursor-pointer"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center gap-2 mb-3 text-muted-foreground/70">{icon}</div>
      <h3 className="font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-[var(--iw-text-secondary)] mb-4">{description}</p>
      <span className="text-sm font-semibold text-[var(--brand-primary-light)]">{cta}</span>
    </div>
  );
}

function NextStepRow({
  step,
  title,
  desc,
  cta,
}: {
  step: number;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center flex-shrink-0">
        <span className="text-[var(--brand-primary-light)] font-semibold text-sm">{step}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-[var(--iw-text-secondary)]">{desc}</p>
      </div>
      <button
        type="button"
        className="text-sm font-semibold text-[var(--brand-primary-light)] hover:underline"
      >
        {cta}
      </button>
    </div>
  );
}
