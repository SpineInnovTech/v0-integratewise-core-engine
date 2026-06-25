import { AcceleratorManifest } from "../types";

export const ContractIntelligence: AcceleratorManifest = {
  id: "accel-comm-contract-001",
  name: "Contract/Commercial Intelligence",
  version: "1.0.0",
  type: "intelligence",
  description: "Extracts renewal terms, pricing, and SLAs from contracts (MSAs/SOWs).",
  tools_supported: ["docusign", "drive", "salesforce"],
  signals: [
    {
      name: "sla_breach_risk",
      source: "computed",
      description: "Risk of breaching contract SLA",
      trigger: "event",
      logic: "Terms vs Actuals",
    },
    {
      name: "notice_window_alert",
      source: "computed",
      description: "Upcoming notification deadline",
      trigger: "schedule",
      logic: "Date check",
    },
  ],
};

export const RiskRegisterAutopilot: AcceleratorManifest = {
  id: "accel-comm-risk-001",
  name: "Risk Register Autopilot",
  version: "1.0.0",
  type: "intelligence",
  description: "Converts scattered risks (tickets, emails) into structured risk register entries.",
  tools_supported: ["jira", "email", "slack"],
  signals: [
    {
      name: "unmitigated_risk_count",
      source: "computed",
      description: "Risks without mitigation owner",
      trigger: "schedule",
      logic: "Field check",
    },
  ],
};
