"use client";

import { Clock } from "lucide-react";

export interface AuditEntry {
  id: string;
  from_state: string;
  to_state: string;
  actor: string;
  timestamp: string;
  reason?: string;
}

interface AuditTrailProps {
  entries: AuditEntry[];
}

/**
 * AuditTrail — Displays every state transition with actor, timestamp, and reason.
 */
export function AuditTrail({ entries }: AuditTrailProps) {
  if (entries.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center" role="status">
        No audit entries yet.
      </div>
    );
  }

  return (
    <div aria-label="Audit trail" role="list" className="space-y-0">
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;
        const formattedTime = new Date(entry.timestamp).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        });

        return (
          <div key={entry.id} role="listitem" className="relative flex gap-3 pb-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-iw-forest mt-1.5 shrink-0" />
              {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-900">
                  {entry.from_state} → {entry.to_state}
                </span>
                <span className="text-xs text-gray-500">by {entry.actor}</span>
              </div>

              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-gray-400" aria-hidden="true" />
                <time className="text-xs text-gray-400" dateTime={entry.timestamp}>
                  {formattedTime}
                </time>
              </div>

              {entry.reason && (
                <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1">
                  {entry.reason}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
