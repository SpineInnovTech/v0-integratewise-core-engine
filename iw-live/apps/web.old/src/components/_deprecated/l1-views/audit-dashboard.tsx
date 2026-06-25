"use client";

import { useState } from "react";
import {
  DashboardLayout,
  Section,
  StandardEmptyState,
} from "@/components/common/layouts/page-layouts";
import {
  Activity,
  Search,
  Filter,
  Download,
  Clock,
  User,
  Settings,
  Shield,
  Database,
  Zap,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface AuditLog {
  id: string;
  event_category: string;
  event_type: string;
  event_subtype?: string;
  actor_type: string;
  actor_id?: string;
  actor_details?: any;
  target_type?: string;
  target_id?: string;
  target_name?: string;
  before_state?: any;
  after_state?: any;
  metadata?: any;
  severity: string;
  is_system_event: boolean;
  created_at: string;
}

interface AuditDashboardProps {
  logs: AuditLog[];
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  action: { icon: Zap, color: "text-blue-600 bg-blue-50", label: "Action" },
  decision: { icon: Shield, color: "text-green-600 bg-green-50", label: "Decision" },
  access: { icon: User, color: "text-purple-600 bg-purple-50", label: "Access" },
  config: { icon: Settings, color: "text-orange-600 bg-orange-50", label: "Config" },
  integration: { icon: Database, color: "text-teal-600 bg-teal-50", label: "Integration" },
};

const SEVERITY_COLORS: Record<string, string> = {
  debug: "bg-gray-100 text-gray-600",
  info: "bg-blue-100 text-blue-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
  critical: "bg-red-200 text-red-800",
};

export function AuditDashboard({ logs }: AuditDashboardProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.event_type.toLowerCase().includes(search.toLowerCase()) ||
      log.target_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.event_category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || log.event_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate category counts
  const categoryCounts = logs.reduce(
    (acc, log) => {
      acc[log.event_category] = (acc[log.event_category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout
      title="Audit Trail"
      description="Complete activity log for compliance and debugging."
      stageId="AUDIT-029"
      actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      }
    >
      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/20 focus:border-[#2d5a3d]"
          />
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? "bg-[#2d5a3d] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <config.icon className="w-4 h-4" />
              <span className="hidden md:inline">{config.label}</span>
              <span className="text-xs opacity-75">({categoryCounts[key] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <Section title={`Audit Logs (${filteredLogs.length})`}>
        {filteredLogs.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 p-4"></th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Event</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Actor</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Target</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Severity</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => {
                  const categoryConfig =
                    CATEGORY_CONFIG[log.event_category] || CATEGORY_CONFIG.action;
                  const CategoryIcon = categoryConfig.icon;
                  const isExpanded = expandedLog === log.id;
                  const hasDetails = log.before_state || log.after_state || log.metadata;

                  return (
                    <>
                      <tr
                        key={log.id}
                        className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? "bg-gray-50" : ""}`}
                        onClick={() => hasDetails && setExpandedLog(isExpanded ? null : log.id)}
                      >
                        <td className="p-4">
                          {hasDetails ? (
                            isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${categoryConfig.color}`}>
                              <CategoryIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{log.event_type}</p>
                              {log.event_subtype && (
                                <p className="text-xs text-gray-500">{log.event_subtype}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {log.is_system_event ? (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                System
                              </span>
                            ) : (
                              <>
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {log.actor_details?.name ||
                                    log.actor_id?.substring(0, 8) ||
                                    log.actor_type}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {log.target_name || log.target_type ? (
                            <div>
                              <p className="text-gray-900">{log.target_name || log.target_type}</p>
                              {log.target_id && (
                                <p className="text-xs text-gray-400">
                                  {log.target_id.substring(0, 12)}...
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full capitalize ${SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info}`}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{formatTime(log.created_at)}</span>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && hasDetails && (
                        <tr key={`${log.id}-details`}>
                          <td colSpan={6} className="bg-gray-50 p-4 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {log.before_state && (
                                <div>
                                  <p className="font-medium text-gray-500 mb-2">Before State</p>
                                  <pre className="bg-white p-3 rounded-lg border border-gray-200 overflow-x-auto text-xs">
                                    {JSON.stringify(log.before_state, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.after_state && (
                                <div>
                                  <p className="font-medium text-gray-500 mb-2">After State</p>
                                  <pre className="bg-white p-3 rounded-lg border border-gray-200 overflow-x-auto text-xs">
                                    {JSON.stringify(log.after_state, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="col-span-2">
                                  <p className="font-medium text-gray-500 mb-2">Metadata</p>
                                  <pre className="bg-white p-3 rounded-lg border border-gray-200 overflow-x-auto text-xs">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <StandardEmptyState
            icon={<Activity className="w-12 h-12 text-gray-300" />}
            title="No Audit Logs"
            description={
              search || selectedCategory
                ? "No logs match your filters."
                : "Activity will be logged here as you use the system."
            }
          />
        )}
      </Section>
    </DashboardLayout>
  );
}
