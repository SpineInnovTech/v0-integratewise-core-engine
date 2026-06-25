import { AcceleratorManifest } from "../types";

/**
 * Section 8 — REVENUE (MRR) ACCELERATORS (Sellable Add-ons)
 * These packs compute high-value signals from normalized Spine data.
 */

export const RevenueAcceleratorPack: AcceleratorManifest = {
  id: "revenue-mrr-pack",
  name: "Revenue & MRR Accelerator",
  version: "1.0.0",
  type: "intelligence", // Mapped to intelligence per types.ts
  description: "Advanced ARR/MRR engine for SaaS growth and renewal management",
  tools_supported: ["all"],
  signals: [
    {
      name: "M1_MRR_ARR_Engine",
      description: "Computes MRR, ARR, NRR, GRR, Cohorts and Movements",
      logic: "revenue_compute.mrr_movements()",
      trigger: "schedule",
    },
    {
      name: "M2_Renewal_Risk_Engine",
      description: "Renewal calendar + risk factors + next-best-action",
      logic: "revenue_compute.renewal_risk()",
      trigger: "event",
    },
    {
      name: "M3_Expansion_Engine",
      description: "Upsell/cross-sell signals + white-space mapping",
      logic: "revenue_compute.expansion_signals()",
      trigger: "event",
    },
    {
      name: "M4_Pricing_Discount_Guard",
      description: "Margin leak detection + policy-driven thresholds",
      logic: "revenue_compute.pricing_compliance()",
      trigger: "event",
    },
    {
      name: "M5_Collections_Forecast_Engine",
      description: "Cashflow + overdue risk + payment sync",
      logic: "revenue_compute.collection_risk()",
      trigger: "schedule",
    },
    {
      name: "M6_Commission_Quota_Engine",
      description: "Attainment + pipeline coverage + rep rollups",
      logic: "revenue_compute.quota_attainment()",
      trigger: "schedule",
    },
  ],
};
