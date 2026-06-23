"use client";

import {
  DashboardLayout,
  Section,
  StandardEmptyState,
} from "@/components/common/layouts/page-layouts";
import { CheckSquare, Play, XCircle } from "lucide-react";
import { useEvidence } from "@/components/core/providers/evidence-provider";

export function ActDashboard({ actions }: { actions: any[] }) {
  const { openEvidence } = useEvidence();

  return (
    <DashboardLayout
      title="Act"
      description="Review, approve, and execute proposed actions."
      stageId="ACT-031"
    >
      <Section title="Proposed Actions">
        <div className="grid gap-4 md:grid-cols-2">
          {actions.length > 0 ? (
            actions.map((action: any) => (
              <div
                key={action.id}
                className="p-4 bg-white border border-gray-200 rounded-lg flex items-start gap-4"
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">{action.title}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        action.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {action.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                  {action.situations && (
                    <p className="text-xs text-gray-500 mb-3">
                      Triggered by: <span className="font-medium">{action.situations.title}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d5a3d] text-white text-sm font-medium rounded hover:bg-[#1a3a2a] transition-colors">
                      <Play className="w-3 h-3" />
                      Approve & Execute
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded hover:bg-gray-50 transition-colors">
                      <XCircle className="w-3 h-3" />
                      Reject
                    </button>
                    <button
                      onClick={() =>
                        openEvidence("Action Logic", [], "Why this action was proposed.")
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 text-sm font-medium hover:text-[#2d5a3d]"
                    >
                      Why?
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2">
              <StandardEmptyState
                icon={<CheckSquare className="w-12 h-12 text-gray-300" />}
                title="No Pending Actions"
                description="You're all caught up! The engine has no proposed actions waiting for approval."
              />
            </div>
          )}
        </div>
      </Section>
    </DashboardLayout>
  );
}
