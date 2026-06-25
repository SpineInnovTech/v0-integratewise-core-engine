"use client";

import { TrendingUp, Target, Clock, Zap } from "lucide-react";
import { useCallback } from "react";
import { LiveSignalsStrip } from "@/components/l2/signals/live-signals-strip";
import { ActiveSituations } from "@/components/l2/think/active-situations";

interface HomeViewProps {
  metrics?: any[];
  insights?: any[];
  sessions?: any[];
}

export function OsHomeView({ metrics = [], insights = [], sessions = [] }: HomeViewProps) {
  const openCognitiveView = useCallback((detail: any) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("iw:evidence:open", { detail }));
  }, []);

  const handleSignalClick = (signal: any) => {
    openCognitiveView({
      title: signal.event,
      description: `Signal from ${signal.source} for ${signal.entity}`,
      evidence: [
        {
          type: "spine",
          title: `${signal.source} event record`,
          source: signal.source,
          date: signal.timestamp,
          preview: signal.summary,
        },
      ],
    });
  };

  const handleSituationEvidenceView = (situation: any) => {
    if (situation?.id) {
      openCognitiveView({ situationId: situation.id });
      return;
    }

    openCognitiveView({
      title: situation.title,
      description: situation.narrative,
      evidence: Array.isArray(situation.evidence)
        ? situation.evidence.map((e: any) => ({
            type: e.type === "truth" ? "spine" : e.type === "ai-chat" ? "knowledge" : "context",
            title: e.title,
            source: e.source,
            date: e.date,
            preview: e.preview,
            link: e.link,
          }))
        : [],
    });
  };

  // Sample KPI data
  const kpis = [
    {
      label: "Active Tasks",
      value: "24",
      change: "+3",
      trend: "up",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Goals on Track",
      value: "8/12",
      change: "67%",
      trend: "neutral",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Velocity",
      value: "32pts",
      change: "-8%",
      trend: "down",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Hours This Week",
      value: "28.5h",
      change: "+2.5h",
      trend: "up",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  // Sample goal progress
  const goalProgress = [
    { title: "Launch Q1 Feature Set", progress: 78, due: "12 days", status: "on-track" },
    { title: "Customer Success Automation", progress: 45, due: "24 days", status: "at-risk" },
    { title: "API Documentation Refresh", progress: 92, due: "5 days", status: "ahead" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Live Signals Strip */}
      <LiveSignalsStrip signals={[]} onSignalClick={handleSignalClick} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Operations Home</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Your OS cockpit: signals, situations, and actions
              </p>
            </div>
            <button className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors">
              New Task
            </button>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="p-4 bg-white rounded-lg border border-slate-200/60 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-slate-500">{kpi.label}</span>
                  {kpi.trend === "up" && <TrendingUp className={`w-3.5 h-3.5 ${kpi.color}`} />}
                  {kpi.trend === "down" && (
                    <TrendingUp className={`w-3.5 h-3.5 ${kpi.color} rotate-180`} />
                  )}
                  {kpi.trend === "neutral" && <Target className={`w-3.5 h-3.5 ${kpi.color}`} />}
                </div>
                <div className={`text-2xl font-semibold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-[11px] text-slate-500 mt-1">{kpi.change} from last week</div>
              </div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Active Situations (2/3 width) */}
            <div className="lg:col-span-2">
              <ActiveSituations situations={[]} onEvidenceView={handleSituationEvidenceView} />
            </div>

            {/* Right: Goal Progress (1/3 width) */}
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Goal Progress</h2>
                <p className="text-xs text-slate-500 mt-0.5">Active goals & milestones</p>
              </div>
              <div className="space-y-2">
                {goalProgress.map((goal, idx) => {
                  const statusConfig = {
                    "on-track": {
                      bg: "bg-green-50",
                      border: "border-green-200/60",
                      text: "text-green-700",
                      badge: "bg-green-100 text-green-700",
                    },
                    "at-risk": {
                      bg: "bg-amber-50",
                      border: "border-amber-200/60",
                      text: "text-amber-700",
                      badge: "bg-amber-100 text-amber-700",
                    },
                    ahead: {
                      bg: "bg-blue-50",
                      border: "border-blue-200/60",
                      text: "text-blue-700",
                      badge: "bg-blue-100 text-blue-700",
                    },
                  };
                  const config = statusConfig[goal.status as keyof typeof statusConfig];

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${config.border} ${config.bg}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-900 flex-1 line-clamp-2">
                          {goal.title}
                        </h3>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${config.badge}`}
                        >
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-white/60 rounded-full h-1.5 mb-2">
                        <div
                          className={`h-1.5 rounded-full ${config.text.replace("text-", "bg-")}`}
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <Clock className="w-3 h-3" />
                        <span>{goal.due} remaining</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Quick Actions</h3>
                <div className="space-y-1.5">
                  <button className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                    <Zap className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-slate-700">Create New Task</span>
                  </button>
                  <button className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                    <Target className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-slate-700">Add Goal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence is shown in the single bottom Cognitive View (OS shell). */}
    </div>
  );
}
