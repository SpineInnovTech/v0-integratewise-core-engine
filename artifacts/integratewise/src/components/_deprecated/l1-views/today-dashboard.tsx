"use client";

import { DashboardLayout, Section, StatCard } from "@/components/common/layouts/page-layouts";
import { CheckSquare, Calendar, Zap, Clock, Activity } from "lucide-react";
import { useEvidence } from "@/components/core/providers/evidence-provider";

interface TodayDashboardProps {
  tasks?: Array<{ status?: string; title?: string; assignee?: string; priority?: string }>;
  events?: Array<Record<string, unknown>>;
  insights?: Array<{ key_actions?: string[] }>;
}

export function TodayDashboard({ tasks = [], events = [], insights = [] }: TodayDashboardProps) {
  const { openEvidence } = useEvidence();

  const todaysTasks = tasks.filter((t) => !t.status || t.status !== "completed").slice(0, 5);
  const todaysEvents = events;
  const latestInsight = insights[0] || {};
  const suggestions = (latestInsight.key_actions || []) as string[];

  const handleExplainSuggestion = (suggestion: string) => {
    openEvidence(
      "AI Suggestion Logic",
      [
        {
          type: "spine",
          title: "User Activity Drop",
          source: "Metrics Table",
          date: "2 hours ago",
          confidence: 0.85,
        },
        {
          type: "knowledge",
          title: "Churn Prevention Strategy",
          source: "Brainstorm Session #12",
          date: "Yesterday",
        },
        {
          type: "context",
          title: "Client Email: Urgent Issue",
          source: "Gmail",
          date: "3 hours ago",
        },
      ],
      `Why we suggested: "${suggestion}"`
    );
  };

  return (
    <DashboardLayout
      title="Today"
      description="Your daily overview and priorities"
      stageId="TODAY-011"
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Tasks Due" value={String(todaysTasks.length)} color="blue" />
        <StatCard label="Meetings" value={String(todaysEvents.length)} color="gray" />
        <StatCard label="AI Suggestions" value={String(suggestions.length)} color="green" />
        <StatCard label="Focus Time" value="4h" color="gray" />
      </div>

      {/* Today's Tasks */}
      <Section title="Priority Tasks">
        <div className="grid gap-4 md:grid-cols-2">
          {todaysTasks.length > 0 ? (
            todaysTasks.map((task: any, i: number) => (
              <div
                key={i}
                className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {task.assignee || "Unassigned"}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${task.priority === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}
                  >
                    {task.priority || "medium"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <button
                    onClick={() =>
                      openEvidence("Task Priority Logic", [
                        {
                          type: "spine",
                          title: "Deadline Approaching",
                          source: "Task signals",
                          date: "Today",
                        },
                      ])
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    title="Why is this prioritized?"
                  >
                    <Activity className="w-4 h-4" />
                    Why
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No priority tasks due today.
            </div>
          )}
        </div>
      </Section>

      {/* Shadow Suggestions */}
      <Section title="Shadow Suggestions">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-[#2d5a3d]" />
          <h3 className="font-semibold text-gray-900">Shadow Suggestions (AI Engine)</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion: string, i: number) => (
              <div key={i} className="p-4 bg-white rounded-xl border border-green-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-50 text-[#2d5a3d]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Shadow Suggestion</p>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{suggestion}</p>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleExplainSuggestion(suggestion)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        Explain
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
              <div className="p-2 rounded-lg bg-gray-50 text-gray-500">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-sm text-gray-500">
                Engine is analyzing... No immediate suggestions.
              </p>
            </div>
          )}
        </div>
      </Section>
    </DashboardLayout>
  );
}
