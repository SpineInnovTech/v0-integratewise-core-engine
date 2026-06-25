import { AcceleratorManifest } from "../types";

export const CustomerHealthScore: AcceleratorManifest = {
  id: "intel-health-score-001",
  name: "Customer Health Score",
  version: "1.0.0",
  type: "intelligence",
  description:
    "Calculate health scores with component analysis derived from Usage, Sentiment, and Support tickets.",
  tools_supported: ["salesforce", "zendesk", "intercom", "amplitude"],
  signals: [
    {
      id: "sig_health_comp",
      name: "health_score_composite",
      description: "0-100 score indicating overall account health.",
      source: "computed",
      trigger: "schedule",
      logic: "packages/connectors/src/accelerators/index.ts (CustomerHealth)",
    },
  ],
};

export const ChurnPrediction: AcceleratorManifest = {
  id: "intel-churn-pred-001",
  name: "Churn Prediction",
  version: "1.0.0",
  type: "intelligence",
  description: "Predict churn probability using risk factors and historical trends.",
  tools_supported: ["stripe", "salesforce", "zendesk"],
  signals: [
    {
      id: "sig_churn_prob",
      name: "churn_probability",
      description: "Likelihood of churn in next 90 days (0-1).",
      source: "computed",
      trigger: "schedule",
      logic: "packages/connectors/src/accelerators/index.ts (ChurnPrediction)",
    },
  ],
};

export const RevenueForecaster: AcceleratorManifest = {
  id: "intel-rev-forecast-001",
  name: "Revenue Forecaster",
  version: "1.0.0",
  type: "intelligence",
  description: "Multi-source revenue forecasting combining CRM pipeline and Billing metrics.",
  tools_supported: ["salesforce", "hubspot", "stripe", "quickbooks"],
  signals: [
    {
      id: "sig_rev_forecast",
      name: "revenue_forecast_q_plus_1",
      description: "Projected revenue for next quarter.",
      source: "computed",
      trigger: "schedule",
      logic: "packages/connectors/src/accelerators/index.ts (RevenueForecaster)",
    },
  ],
};

export const PipelineVelocity: AcceleratorManifest = {
  id: "intel-pipe-velocity-001",
  name: "Pipeline Velocity",
  version: "1.0.0",
  type: "intelligence",
  description:
    "Sales pipeline performance metrics including stage conversion rates and time-in-stage.",
  tools_supported: ["salesforce", "hubspot", "pipedrive"],
  signals: [
    {
      id: "sig_pipe_vel",
      name: "sales_velocity_days",
      description: "Average days to close.",
      source: "computed",
      trigger: "schedule",
      logic: "packages/connectors/src/accelerators/index.ts (PipelineVelocity)",
    },
  ],
};

export const SupportHealth: AcceleratorManifest = {
  id: "intel-support-health-001",
  name: "Support Health",
  version: "1.0.0",
  type: "intelligence",
  description:
    "Account-level support metrics focusing on SLA breaches and ticket volume intensity.",
  tools_supported: ["zendesk", "freshworks", "intercom"],
  signals: [
    {
      id: "sig_supp_intensity",
      name: "support_intensity_score",
      description: "Volume of tickets normalized by ARR.",
      source: "computed",
      trigger: "event",
      logic: "packages/connectors/src/accelerators/support-marketing.ts (SupportHealth)",
    },
  ],
};

export const MarketingAttribution: AcceleratorManifest = {
  id: "intel-mkt-attrib-001",
  name: "Marketing Attribution",
  version: "1.0.0",
  type: "intelligence",
  description: "Multi-touch attribution models to link revenue back to campaign sources.",
  tools_supported: ["google-analytics", "hubspot", "salesforce"],
  signals: [
    {
      id: "sig_attrib_first",
      name: "first_touch_attribution",
      description: "Source of initial contact.",
      source: "computed",
      trigger: "schedule",
      logic: "packages/connectors/src/accelerators/support-marketing.ts (MarketingAttribution)",
    },
  ],
};
