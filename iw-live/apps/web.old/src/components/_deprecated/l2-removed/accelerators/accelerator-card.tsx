"use client";

/**
 * AcceleratorCard — Reusable card for domain accelerator metrics.
 * Renders a compact score card with trend indicator, refreshes via useAccelerator().
 *
 * Usage:
 *   <AcceleratorCard type="health_score" title="Account Health" />
 *   <AcceleratorCard type="churn_prediction" title="Churn Risk" />
 */

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Activity,
  ShieldAlert,
  TrendingUp,
  Gauge,
  MessageSquare,
  Database,
  RefreshCcw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { useAccelerator, type AcceleratorType } from "@/hooks/use-accelerator";

interface AcceleratorCardProps {
  type: AcceleratorType;
  title?: string;
  params?: Record<string, any>;
  className?: string;
}

const ICONS: Record<AcceleratorType, React.ElementType> = {
  health_score: Activity,
  churn_prediction: ShieldAlert,
  revenue_forecast: TrendingUp,
  pipeline_velocity: Gauge,
  nps_analysis: MessageSquare,
  data_quality: Database,
};

const TITLES: Record<AcceleratorType, string> = {
  health_score: "Account Health",
  churn_prediction: "Churn Risk",
  revenue_forecast: "Revenue Forecast",
  pipeline_velocity: "Pipeline Velocity",
  nps_analysis: "NPS Score",
  data_quality: "Data Quality",
};

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === "improving" || trend === "accelerating") {
    return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />;
  }
  if (trend === "declining" || trend === "slowing") {
    return <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />;
  }
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
}

function extractScore(data: any, type: AcceleratorType): { value: number | string; label: string } {
  if (!data) return { value: "—", label: "" };

  switch (type) {
    case "health_score":
      return { value: data.score ?? 0, label: `/ 100` };
    case "churn_prediction":
      return {
        value: data.riskLevel || "N/A",
        label: data.confidence ? `${Math.round(data.confidence * 100)}% conf.` : "",
      };
    case "revenue_forecast":
      return {
        value: data.forecastedMrr ? `$${(data.forecastedMrr / 1000).toFixed(0)}k` : "—",
        label: data.growthRate ? `${data.growthRate > 0 ? "+" : ""}${data.growthRate}%` : "",
      };
    case "pipeline_velocity":
      return {
        value: data.velocity ?? 0,
        label: data.winRate ? `${Math.round(data.winRate * 100)}% win` : "",
      };
    case "nps_analysis":
      return { value: data.score ?? 0, label: "NPS" };
    case "data_quality":
      return { value: data.overallScore ?? 0, label: `/ 100` };
    default:
      return { value: "—", label: "" };
  }
}

export function AcceleratorCard({ type, title, params, className }: AcceleratorCardProps) {
  const { data, loading, error, refetch, lastUpdated } = useAccelerator(type, params);
  const Icon = ICONS[type] || Activity;
  const displayTitle = title || TITLES[type] || type;
  const score = extractScore(data, type);
  const trend = (data as any)?.trend;

  return (
    <Card className={`p-4 relative overflow-hidden ${className || ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{displayTitle}</p>
          </div>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          title="Refresh"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCcw className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-900 dark:text-white">{score.value}</span>
        {score.label && <span className="text-sm text-slate-400">{score.label}</span>}
        {trend && <TrendIcon trend={trend} />}
      </div>

      {error && !data && <p className="mt-2 text-xs text-red-500">Failed to load</p>}

      {lastUpdated && (
        <p className="mt-2 text-[10px] text-slate-400">
          Updated {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </Card>
  );
}

export default AcceleratorCard;
