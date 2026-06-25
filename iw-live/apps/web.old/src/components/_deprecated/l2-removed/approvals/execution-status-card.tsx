/**
 * Execution Status Card
 * Shows running/completed actions on Today view
 * Day 4: UI Polish + Integration
 */

"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Building2,
  Mail,
  Phone,
  DollarSign,
  Zap,
} from "lucide-react";

export interface ExecutionRun {
  id: string;
  actionType: "outreach" | "discount" | "escalation" | "renewal" | "upsell" | "follow_up";
  title: string;
  entity: {
    id: string;
    name: string;
    type: "account" | "contact" | "deal" | "ticket";
  };
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt?: string;
  duration?: number; // seconds
  result?: {
    success: boolean;
    message: string;
    outputUrl?: string;
  };
  approvedBy: string;
  retryCount: number;
}

const mockExecutions: ExecutionRun[] = [];
// Hardcoded demo data removed — wired to Act service execution stream

const statusConfig = {
  queued: {
    icon: Clock,
    color: "text-gray-500",
    bg: "bg-gray-100",
    label: "Queued",
    animate: false,
  },
  running: {
    icon: Loader2,
    color: "text-blue-600",
    bg: "bg-blue-100",
    label: "Running",
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Completed",
    animate: false,
  },
  failed: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    label: "Failed",
    animate: false,
  },
  cancelled: {
    icon: Pause,
    color: "text-gray-500",
    bg: "bg-gray-100",
    label: "Cancelled",
    animate: false,
  },
};

const typeIcons = {
  outreach: Mail,
  discount: DollarSign,
  escalation: AlertTriangle,
  renewal: Clock,
  upsell: Zap,
  follow_up: Phone,
};

interface ExecutionStatusCardProps {
  executions?: ExecutionRun[];
  onExecutionClick?: (execution: ExecutionRun) => void;
  onRetry?: (execution: ExecutionRun) => void;
  className?: string;
}

export function ExecutionStatusCard({
  executions = mockExecutions,
  onExecutionClick,
  onRetry,
  className = "",
}: ExecutionStatusCardProps) {
  const runningCount = executions.filter((e) => e.status === "running").length;
  const completedCount = executions.filter((e) => e.status === "completed").length;
  const failedCount = executions.filter((e) => e.status === "failed").length;

  // Sort: running first, then queued, then completed, then failed
  const sortedExecutions = [...executions].sort((a, b) => {
    const order = { running: 0, queued: 1, completed: 2, failed: 3, cancelled: 4 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Play className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Execution Status</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {runningCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {runningCount} running
            </span>
          )}
          {failedCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
              {failedCount} failed
            </span>
          )}
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
            {completedCount} done
          </span>
        </div>
      </div>

      {/* Executions List */}
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {sortedExecutions.length === 0 ? (
          <div className="p-8 text-center">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">No recent executions</p>
            <p className="text-xs text-gray-500 mt-1">Approved actions will appear here</p>
          </div>
        ) : (
          sortedExecutions.map((execution) => {
            const status = statusConfig[execution.status];
            const StatusIcon = status.icon;
            const TypeIcon = typeIcons[execution.actionType];

            return (
              <div
                key={execution.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                onClick={() => onExecutionClick?.(execution)}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className={`p-2 rounded-lg ${status.bg}`}>
                    <StatusIcon
                      className={`w-4 h-4 ${status.color} ${(status as any).animate ? "animate-spin" : ""}`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}
                      >
                        {status.label}
                      </span>
                      <TypeIcon className="w-3 h-3 text-gray-400" />
                      {execution.retryCount > 0 && (
                        <span className="text-xs text-gray-400">
                          (Retry #{execution.retryCount})
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">
                      {execution.title}
                    </h4>

                    {/* Entity */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        <Building2 className="w-3 h-3" />
                        {execution.entity.name}
                      </span>
                    </div>

                    {/* Result Message */}
                    {execution.result && (
                      <p
                        className={`text-xs ${execution.result.success ? "text-green-600" : "text-red-600"}`}
                      >
                        {execution.result.message}
                      </p>
                    )}

                    {/* Duration/Time */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {execution.status === "running" ? (
                        <RunningTimer startedAt={execution.startedAt} />
                      ) : execution.duration ? (
                        <span>{execution.duration}s</span>
                      ) : (
                        <span>
                          {new Date(execution.startedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      <span className="text-gray-300">•</span>
                      <span>Approved by {execution.approvedBy}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {execution.status === "failed" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetry?.(execution);
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#2d5a3d] hover:bg-green-50 rounded-lg transition-colors"
                        title="Retry"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    {execution.result?.outputUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(execution.result!.outputUrl, "_blank");
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Output"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {sortedExecutions.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <button className="text-sm text-[#2d5a3d] hover:underline font-medium">
            View execution history →
          </button>
        </div>
      )}
    </div>
  );
}

// Running timer component
function RunningTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <span className="font-mono">
      {mins > 0 ? `${mins}m ` : ""}
      {secs}s
    </span>
  );
}

export { mockExecutions };
export default ExecutionStatusCard;
