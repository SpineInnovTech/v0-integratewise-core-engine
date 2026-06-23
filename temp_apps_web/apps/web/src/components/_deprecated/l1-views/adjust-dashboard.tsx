"use client";

import { useState } from "react";
import {
  DashboardLayout,
  Section,
  StandardEmptyState,
} from "@/components/common/layouts/page-layouts";
import { useSpineContext } from "@/components/core/providers/spine-context-provider";
import useSWR from "swr";
import {
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Settings,
  Target,
  Gauge,
  Sparkles,
  Filter,
} from "lucide-react";

interface FeedbackLog {
  id: string;
  action_id?: string;
  situation_id?: string;
  feedback_type: string;
  feedback_rating?: number;
  feedback_text?: string;
  provided_at: string;
  processed: boolean;
}

interface LearningInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  sample_count: number;
  confidence: number;
  status: string;
  proposed_at: string;
  affected_signals?: string[];
  affected_rules?: string[];
}

interface AdjustDashboardProps {
  feedbackLogs: FeedbackLog[];
  learningInsights: LearningInsight[];
}

const FEEDBACK_TYPE_CONFIG: Record<
  string,
  { icon: typeof ThumbsUp; color: string; label: string }
> = {
  outcome_positive: { icon: ThumbsUp, color: "text-green-600 bg-green-50", label: "Positive" },
  outcome_negative: { icon: ThumbsDown, color: "text-red-600 bg-red-50", label: "Negative" },
  correction: { icon: AlertCircle, color: "text-orange-600 bg-orange-50", label: "Correction" },
  refinement: { icon: Settings, color: "text-blue-600 bg-blue-50", label: "Refinement" },
};

const INSIGHT_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  proposed: { color: "bg-yellow-100 text-yellow-700", label: "Proposed" },
  approved: { color: "bg-blue-100 text-blue-700", label: "Active" },
  rejected: { color: "bg-red-100 text-red-700", label: "Rejected" },
  implemented: { color: "bg-green-100 text-green-700", label: "Live" },
};

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((r) => r.data);

export function AdjustDashboard({
  feedbackLogs: initialLogs,
  learningInsights: initialInsights,
}: AdjustDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<"feedback" | "insights">("feedback");
  const { getQueryParams, category } = useSpineContext();

  // Context-Aware Data Fetching
  const queryParams = new URLSearchParams(getQueryParams());
  const { data: logsData, isLoading: loadingLogs } = useSWR<FeedbackLog[]>(
    `/api/adjust/feedback?${queryParams.toString()}`,
    fetcher,
    { fallbackData: initialLogs }
  );
  const { data: insightsData, isLoading: loadingInsights } = useSWR<LearningInsight[]>(
    `/api/adjust/insights?${queryParams.toString()}`,
    fetcher,
    { fallbackData: initialInsights }
  );

  const feedbackLogs = logsData || [];
  const learningInsights = insightsData || [];

  const processedCount = feedbackLogs.filter((f) => f.processed).length;
  const pendingInsights = learningInsights.filter((i) => i.status === "proposed").length;
  const activeRules = learningInsights.filter(
    (i) => i.status === "approved" || i.status === "implemented"
  ).length;

  return (
    <DashboardLayout
      title="Adjust"
      description="System learning, feedback loops, and optimization."
      stageId="ADJUST-043"
      actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Force Re-train
        </button>
      }
    >
      {/* Context Badge */}
      <div
        className={`mb-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize 
                ${
                  category === "personal"
                    ? "bg-blue-100 text-blue-800"
                    : category === "csm"
                      ? "bg-green-100 text-green-800"
                      : category === "business"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                }`}
      >
        Viewing: {category} Learning Context
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{feedbackLogs.length}</p>
              <p className="text-xs text-gray-500">Total Feedback</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{processedCount}</p>
              <p className="text-xs text-gray-500">Processed Items</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingInsights}</p>
              <p className="text-xs text-gray-500">New Insights</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeRules}</p>
              <p className="text-xs text-gray-500">Optimizations Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: "feedback", label: "Feedback Log", icon: MessageSquare },
          { key: "insights", label: "Learning Insights", icon: Lightbulb },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === tab.key
                ? "border-[#2d5a3d] text-[#2d5a3d]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feedback Tab */}
      {selectedTab === "feedback" && (
        <Section title="Recent Feedback">
          {feedbackLogs.length > 0 ? (
            <div className="space-y-4">
              {feedbackLogs.map((log) => {
                const config =
                  FEEDBACK_TYPE_CONFIG[log.feedback_type] || FEEDBACK_TYPE_CONFIG.refinement;
                const Icon = config.icon;
                return (
                  <div
                    key={log.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 capitalize">
                            {log.feedback_type.replace(/_/g, " ")}
                          </h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              log.processed
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {log.processed ? "Processed" : "Pending Analysis"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{log.feedback_text}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.provided_at).toLocaleString()}
                          </span>
                          {log.feedback_rating && (
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              Rating: {log.feedback_rating}/5
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <StandardEmptyState
              icon={<MessageSquare className="w-12 h-12 text-gray-300" />}
              title="No Feedback Logged"
              description={
                loadingLogs ? "Loading feedback..." : "User feedback events will appear here."
              }
            />
          )}
        </Section>
      )}

      {/* Insights Tab */}
      {selectedTab === "insights" && (
        <Section title="Proposed Optimizations">
          {learningInsights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningInsights.map((insight) => {
                const statusConfig =
                  INSIGHT_STATUS_CONFIG[insight.status] || INSIGHT_STATUS_CONFIG.proposed;
                return (
                  <div
                    key={insight.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 h-10 line-clamp-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Confidence</span>
                          <span className="font-medium text-gray-900">
                            {(insight.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${insight.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Based on</p>
                        <p className="text-xs font-medium text-gray-900">
                          {insight.sample_count} events
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">
                        {new Date(insight.proposed_at).toLocaleDateString()}
                      </span>
                      <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        Details <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <StandardEmptyState
              icon={<Lightbulb className="w-12 h-12 text-gray-300" />}
              title="No Insights Yet"
              description={
                loadingInsights
                  ? "Loading insights..."
                  : "AI learning insights will appear here as the system observes usage."
              }
            />
          )}
        </Section>
      )}
    </DashboardLayout>
  );
}
