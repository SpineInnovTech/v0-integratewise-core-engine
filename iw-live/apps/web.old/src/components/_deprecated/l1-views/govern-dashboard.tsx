"use client";

import { useState } from "react";
import {
  DashboardLayout,
  Section,
  StandardEmptyState,
} from "@/components/common/layouts/page-layouts";
import { useEvidence } from "@/components/core/providers/evidence-provider";
import { useSpineContext } from "@/components/core/providers/spine-context-provider";
import { apiFetch } from "@/lib/api-client";
import useSWR from "swr";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Settings,
  Plus,
  Unlock,
  Lock,
  DollarSign,
  Users,
  RefreshCw,
} from "lucide-react";

interface Policy {
  id: string;
  policy_name: string;
  action_type_pattern: string;
  min_severity: string;
  required_roles: string[];
  auto_approve: boolean;
  max_auto_amount?: number;
  require_evidence_count: number;
  is_active: boolean;
  created_at: string;
}

interface ApprovalQueueItem {
  id: string;
  action_id: string;
  action_type: string;
  action_title: string;
  action_description: string;
  severity: string;
  estimated_impact?: number;
  evidence_refs: Array<{ type: string; id: string; confidence: number }>;
  status: string;
  priority: number;
  created_at: string;
  due_by: string;
  governance_policies?: Policy;
}

interface GovernDashboardProps {
  policies: Policy[];
  approvalQueue: ApprovalQueueItem[];
}

const SEVERITY_CONFIG: Record<string, { color: string; icon: typeof AlertTriangle }> = {
  low: { color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2 },
  medium: { color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: AlertTriangle },
  high: { color: "text-orange-600 bg-orange-50 border-orange-200", icon: AlertTriangle },
  critical: { color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
};

const fetcher = (url: string) =>
  apiFetch<any>(url, {}, "GovernDashboard").then((r) => r?.data ?? r);

export function GovernDashboard({
  policies: initialPolicies,
  approvalQueue: initialQueue,
}: GovernDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<"queue" | "policies">("queue");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { openEvidence = () => {} } = (useEvidence?.() || {}) as any;
  const { getQueryParams, category } = useSpineContext();

  // Context-Aware Data Fetching
  const queryParams = new URLSearchParams(getQueryParams());
  const { data: policiesData, isLoading: loadingPolicies } = useSWR<Policy[]>(
    `/api/v1/cognitive/govern/policies?${queryParams.toString()}`,
    fetcher,
    { fallbackData: initialPolicies }
  );
  const {
    data: queueData,
    isLoading: loadingQueue,
    mutate: refreshQueue,
  } = useSWR<ApprovalQueueItem[]>(
    `/api/v1/cognitive/govern/pending?${queryParams.toString()}`,
    fetcher,
    { fallbackData: initialQueue }
  );

  const policies = policiesData || [];
  const approvalQueue = queueData || [];

  // Stats
  const pendingCount = approvalQueue.filter((a) => a.status === "pending").length;
  const activePolicies = policies.filter((p) => p.is_active).length;
  const autoApprovePolicies = policies.filter((p) => p.auto_approve).length;

  const handleApprove = async (itemId: string) => {
    setProcessingId(itemId);
    try {
      await apiFetch(
        "/api/v1/cognitive/govern/approve",
        {
          method: "POST",
          body: { itemId, decision: "approved" },
        },
        "GovernApprove"
      );
      refreshQueue();
    } catch (error) {
      console.error("[GovernDashboard] Failed to approve:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (itemId: string) => {
    setProcessingId(itemId);
    try {
      await apiFetch(
        "/api/v1/cognitive/govern/reject",
        {
          method: "POST",
          body: { itemId, decision: "rejected" },
        },
        "GovernReject"
      );
      refreshQueue();
    } catch (error) {
      console.error("[GovernDashboard] Failed to reject:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <DashboardLayout
      title="Govern"
      description="Policy management, approval workflows, and access control."
      stageId="GOVERN-042"
      actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2d5a3d] text-white text-sm font-medium rounded-lg hover:bg-[#1a3a2a] transition-colors">
          <Plus className="w-4 h-4" />
          New Policy
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
        Viewing: {category} Context
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-xs text-gray-500">Pending Approvals</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activePolicies}</p>
              <p className="text-xs text-gray-500">Active Policies</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{autoApprovePolicies}</p>
              <p className="text-xs text-gray-500">Auto-Approve Rules</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {policies.filter((p) => p.required_roles.length > 0).length}
              </p>
              <p className="text-xs text-gray-500">Role-Gated Policies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: "queue", label: "Approval Queue", icon: Clock },
          { key: "policies", label: "Policies", icon: Shield },
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
            {tab.key === "queue" && pendingCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Approval Queue Tab */}
      {selectedTab === "queue" && (
        <Section title="Pending Approvals">
          {approvalQueue.length > 0 ? (
            <div className="space-y-4">
              {approvalQueue.map((item) => {
                const severityConfig = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.medium;
                const SeverityIcon = severityConfig.icon;
                const isProcessing = processingId === item.id;
                const isOverdue = new Date(item.due_by) < new Date();

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border p-5 ${
                      isOverdue ? "border-red-200 bg-red-50/30" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${severityConfig.color}`}>
                          <SeverityIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.action_title}</h4>
                          <span className="text-xs text-gray-500">{item.action_type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full capitalize ${severityConfig.color}`}
                        >
                          {item.severity}
                        </span>
                        <span className="text-xs text-gray-400">Priority {item.priority}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{item.action_description}</p>

                    {item.estimated_impact && (
                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          Estimated Impact: {formatCurrency(item.estimated_impact)}
                        </span>
                      </div>
                    )}

                    {item.evidence_refs && item.evidence_refs.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {item.evidence_refs.length} evidence items
                        </span>
                        <button
                          onClick={() =>
                            openEvidence(
                              `Evidence for: ${item.action_title}`,
                              item.evidence_refs.map((e) => ({
                                type: e.type as "spine" | "context" | "knowledge",
                                title: e.id,
                                source: e.type,
                                date: "",
                              })),
                              item.action_description
                            )
                          }
                          className="text-sm text-[#2d5a3d] hover:underline"
                        >
                          View
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created: {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <span
                          className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : ""}`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Due: {new Date(item.due_by).toLocaleDateString()}
                          {isOverdue && " (Overdue)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-2 px-4 py-2 bg-[#2d5a3d] text-white text-sm font-medium rounded-lg hover:bg-[#1a3a2a] transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <StandardEmptyState
              icon={<CheckCircle2 className="w-12 h-12 text-gray-300" />}
              title="No Pending Approvals"
              description={
                loadingQueue
                  ? "Loading queue..."
                  : "All actions have been processed. New approvals will appear here."
              }
            />
          )}
        </Section>
      )}

      {/* Policies Tab */}
      {selectedTab === "policies" && (
        <Section title="Governance Policies">
          {policies.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Policy</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Pattern</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Severity</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Roles</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Auto</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {policies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{policy.policy_name}</p>
                      </td>
                      <td className="p-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {policy.action_type_pattern || "*"}
                        </code>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full capitalize ${
                            SEVERITY_CONFIG[policy.min_severity]?.color ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {policy.min_severity || "any"}
                        </span>
                      </td>
                      <td className="p-4">
                        {policy.required_roles.length > 0 ? (
                          <div className="flex gap-1">
                            {policy.required_roles.slice(0, 2).map((role, i) => (
                              <span
                                key={i}
                                className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                              >
                                {role}
                              </span>
                            ))}
                            {policy.required_roles.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{policy.required_roles.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Any</span>
                        )}
                      </td>
                      <td className="p-4">
                        {policy.auto_approve ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Unlock className="w-4 h-4" />
                            <span className="text-xs">Yes</span>
                            {policy.max_auto_amount && (
                              <span className="text-xs text-gray-400">
                                ≤{formatCurrency(policy.max_auto_amount)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Lock className="w-4 h-4" />
                            <span className="text-xs">No</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            policy.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {policy.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <Settings className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <StandardEmptyState
              icon={<Shield className="w-12 h-12 text-gray-300" />}
              title="No Policies Configured"
              description={
                loadingPolicies
                  ? "Loading policies..."
                  : "Create policies to define approval workflows and automation rules."
              }
            />
          )}
        </Section>
      )}
    </DashboardLayout>
  );
}
