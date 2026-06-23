"use client";

import { Circle, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";

interface Signal {
  id: string;
  source: string;
  sourceIcon: string;
  event: string;
  entity: string;
  entityLink?: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
}

interface LiveSignalsStripProps {
  signals: Signal[];
  onSignalClick?: (signal: Signal) => void;
}

export function LiveSignalsStrip({ signals, onSignalClick }: LiveSignalsStripProps) {
  const severityStyles = {
    info: "bg-iw-forest/10 border-iw-forest/20 text-iw-forest",
    warning: "bg-iw-gold/10 border-iw-gold/20 text-iw-gold",
    critical: "bg-red-50 border-red-200 text-red-700",
  };

  const severityDots = {
    info: "bg-iw-forest-bright",
    warning: "bg-iw-gold",
    critical: "bg-red-500",
  };

  // Show actual signals only — no hardcoded fallback data
  const displaySignals = signals;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Circle className="w-3 h-3 text-iw-forest-bright fill-iw-forest-bright animate-pulse" />
          <span className="text-xs font-medium text-gray-600">Live Signals</span>
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex items-center gap-2">
            {displaySignals.map((signal) => (
              <button
                key={signal.id}
                onClick={() => onSignalClick?.(signal)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border flex-shrink-0 transition-all hover:shadow-sm ${
                  severityStyles[signal.severity]
                }`}
              >
                <span className="text-sm">{signal.sourceIcon}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${severityDots[signal.severity]}`}
                ></span>
                <span className="text-xs font-medium whitespace-nowrap">{signal.event}</span>
                <span className="text-xs whitespace-nowrap">•</span>
                <span className="text-xs font-medium whitespace-nowrap underline">
                  {signal.entity}
                </span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{signal.timestamp}</span>
              </button>
            ))}
          </div>
        </div>

        <Link
          to="/signals"
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#2d5a3d] hover:bg-[#EEF3F0] rounded-lg transition-colors flex-shrink-0"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
