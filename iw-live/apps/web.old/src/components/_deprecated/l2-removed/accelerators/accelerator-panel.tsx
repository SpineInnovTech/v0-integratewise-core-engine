"use client";

/**
 * AcceleratorPanel — Dashboard panel showing all 6 domain accelerators.
 *
 * Renders in a responsive grid. Each card auto-fetches from
 * /api/v1/intelligence/accelerator/* via useAccelerator() hook.
 *
 * Used in:
 *   - CS Dashboard (health_score, churn_prediction, nps_analysis)
 *   - Sales Dashboard (pipeline_velocity)
 *   - RevOps Dashboard (revenue_forecast)
 *   - Admin/Global view (all 6)
 */

import React from "react";
import { AcceleratorCard } from "./accelerator-card";
import type { AcceleratorType } from "@/hooks/use-accelerator";

interface AcceleratorPanelProps {
  /** Which accelerators to show. Defaults to all 6. */
  types?: AcceleratorType[];
  /** Additional params passed to each accelerator API call */
  params?: Record<string, any>;
  /** Grid columns override (default: responsive 2→3) */
  columns?: number;
  className?: string;
}

const ALL_ACCELERATORS: AcceleratorType[] = [
  "health_score",
  "churn_prediction",
  "revenue_forecast",
  "pipeline_velocity",
  "nps_analysis",
  "data_quality",
];

/** Recommended accelerators per domain context */
export const DOMAIN_ACCELERATORS: Record<string, AcceleratorType[]> = {
  customer_success: ["health_score", "churn_prediction", "nps_analysis"],
  sales: ["pipeline_velocity", "revenue_forecast", "churn_prediction"],
  revops: ["revenue_forecast", "pipeline_velocity", "data_quality"],
  salesops: ["pipeline_velocity", "data_quality"],
  marketing: ["nps_analysis", "revenue_forecast"],
  bizops: ["revenue_forecast", "data_quality", "pipeline_velocity"],
  finance: ["revenue_forecast", "data_quality"],
  product_engineering: ["nps_analysis", "data_quality"],
  service: ["health_score", "nps_analysis"],
  procurement: ["data_quality"],
  it_admin: ["data_quality"],
  personal: ["health_score"],
};

export function AcceleratorPanel({
  types = ALL_ACCELERATORS,
  params,
  columns,
  className,
}: AcceleratorPanelProps) {
  const gridClass = columns ? `grid gap-4` : "grid grid-cols-2 lg:grid-cols-3 gap-4";

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          Domain Accelerators
        </h3>
        <span className="text-[10px] text-slate-400">{types.length} active</span>
      </div>
      <div
        className={gridClass}
        style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
      >
        {types.map((type) => (
          <AcceleratorCard key={type} type={type} params={params} />
        ))}
      </div>
    </div>
  );
}

export default AcceleratorPanel;
