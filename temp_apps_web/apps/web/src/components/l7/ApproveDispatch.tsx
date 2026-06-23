"use client";

import { useState } from "react";
import { Check, Download, Send, Loader2 } from "lucide-react";
import { useGatewayMutation } from "@/hooks/use-gateway-query";

type DispatchAdapter = "json" | "webhook" | "email";

interface ApproveDispatchProps {
  handoffId: string;
  onApproved: () => void;
  onCancel: () => void;
}

interface ApproveResponse {
  success: boolean;
  state: string;
  playbook?: Record<string, unknown>;
}

const ADAPTERS: { id: DispatchAdapter; label: string; enabled: boolean }[] = [
  { id: "json", label: "JSON Playbook Download", enabled: true },
  { id: "webhook", label: "Webhook Dispatch", enabled: false },
  { id: "email", label: "Email Delivery", enabled: false },
];

/**
 * ApproveDispatch — Approval flow with adapter selection and dispatch action.
 * Transitions handoff to APPROVED state and serializes playbook for download or POST.
 */
export function ApproveDispatch({ handoffId, onApproved, onCancel }: ApproveDispatchProps) {
  const [selectedAdapter, setSelectedAdapter] = useState<DispatchAdapter>("json");
  const [playbook, setPlaybook] = useState<Record<string, unknown> | null>(null);

  const approveMutation = useGatewayMutation<ApproveResponse, { action: string }>(
    `/api/v1/handoff/${handoffId}/approve`,
    "POST",
    {
      invalidateKeys: [["handoff", "list"]],
      onSuccess: (data) => {
        if (data.playbook) {
          setPlaybook(data.playbook);
        }
        onApproved();
      },
    }
  );

  const handleApprove = () => {
    approveMutation.mutate({ action: "approve" });
  };

  const handleDownloadPlaybook = () => {
    if (!playbook) return;
    const blob = new Blob([JSON.stringify(playbook, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playbook-${handoffId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4" aria-label="Approve and dispatch">
      {/* Adapter selection */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">Dispatch Adapter</legend>
        <div className="space-y-2" role="radiogroup">
          {ADAPTERS.map((adapter) => (
            <label
              key={adapter.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedAdapter === adapter.id
                  ? "border-iw-forest bg-iw-forest/5"
                  : "border-gray-200 hover:border-gray-300"
              } ${!adapter.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                name="dispatch-adapter"
                value={adapter.id}
                checked={selectedAdapter === adapter.id}
                onChange={() => adapter.enabled && setSelectedAdapter(adapter.id)}
                disabled={!adapter.enabled}
                className="sr-only"
                aria-label={adapter.label}
              />
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedAdapter === adapter.id ? "border-iw-forest" : "border-gray-300"
                }`}
              >
                {selectedAdapter === adapter.id && (
                  <div className="w-2 h-2 rounded-full bg-iw-forest" />
                )}
              </div>
              <span className="text-sm text-gray-700">{adapter.label}</span>
              {!adapter.enabled && (
                <span className="ml-auto text-xs text-gray-400 italic">coming soon</span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleApprove}
          disabled={approveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-iw-forest text-white text-sm font-medium rounded-lg hover:bg-iw-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-iw-forest focus:ring-offset-2"
          aria-label="Approve proposal"
        >
          {approveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="w-4 h-4" aria-hidden="true" />
          )}
          Approve &amp; Dispatch
        </button>

        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          aria-label="Cancel approval"
        >
          Cancel
        </button>
      </div>

      {/* Playbook download (after approval) */}
      {playbook && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700 font-medium">Playbook ready for dispatch</span>
            <button
              onClick={handleDownloadPlaybook}
              className="flex items-center gap-1 text-sm text-green-700 hover:text-green-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-400 rounded"
              aria-label="Download playbook as JSON"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Download JSON
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {approveMutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <p className="text-sm text-red-700">
            {approveMutation.error?.message || "Failed to approve. Try again."}
          </p>
        </div>
      )}
    </div>
  );
}
