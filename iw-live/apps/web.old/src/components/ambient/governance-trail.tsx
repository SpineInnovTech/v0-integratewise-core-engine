import React from "react";
import { ShieldCheck, ShieldAlert, Award, XSquare, CheckCircle2, Clock } from "lucide-react";
import { mockGovernanceEvents } from "@/lib/mock-data";
import { GovernanceEvent } from "@/lib/types";

interface GovernanceTrailProps {
  limit?: number;
  compact?: boolean;
}

export function GovernanceTrail({ limit = 10, compact = false }: GovernanceTrailProps) {
  const events = mockGovernanceEvents.slice(0, limit);

  return (
    <div className="space-y-3 font-mono text-xs">
      {events.map((evt) => {
        const isApproved = evt.result === "approved";
        const isBlocked = evt.result === "blocked" || evt.result === "rejected";

        return (
          <div
            key={evt.id}
            className={`p-3 border rounded-sm flex flex-col gap-2 ${
              isApproved
                ? "border-emerald-500/20 bg-emerald-500/5"
                : isBlocked
                  ? "border-rose-500/20 bg-rose-500/5"
                  : "border-amber-500/20 bg-amber-500/5"
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex gap-2 items-start">
                {isApproved ? (
                  <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : isBlocked ? (
                  <ShieldAlert className="size-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="size-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <span className="font-semibold text-slate-200 block font-sans">{evt.action}</span>
                  {!compact && (
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      {evt.details}
                    </p>
                  )}
                </div>
              </div>

              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                  isApproved
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : isBlocked
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}
              >
                {evt.result.toUpperCase()}
              </span>
            </div>

            {!compact && (
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1.5 border-t border-slate-900">
                <span className="flex items-center gap-1">
                  <Award className="size-3 text-slate-600" />
                  Operator: <strong className="text-slate-400">{evt.operator}</strong>
                </span>
                <span>Rule: {evt.ruleApplied}</span>
                <span>{evt.timestamp}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
