import { AcceleratorManifest } from "../types";

export const AutomationMining: AcceleratorManifest = {
  id: "accel-gov-automation-001",
  name: "Automation Mining & Workflow Mirror",
  version: "1.0.0",
  type: "intelligence",
  description: "Detects workflows from Jira/HubSpot/Zapier and creates an inventory/risk report.",
  tools_supported: ["jira", "hubspot", "zapier"],
  signals: [
    {
      name: "workflow_risk_count",
      source: "computed",
      description: "Risky/Unowned automations",
      trigger: "schedule",
      logic: "Owner check",
    },
  ],
};

export const FormulaTranslation: AcceleratorManifest = {
  id: "accel-gov-formula-001",
  name: "Formula & Computation Translation",
  version: "1.0.0",
  type: "intelligence",
  description: "Extracts formulas from Airtable/Sheets/HubSpot and converts to portable DSL.",
  tools_supported: ["airtable", "sheets", "hubspot"],
  signals: [
    {
      name: "formula_lockin_score",
      source: "computed",
      description: "Complexity of proprietary formulas",
      trigger: "schedule",
      logic: "Parser analysis",
    },
  ],
};

export const ComplianceReadiness: AcceleratorManifest = {
  id: "accel-gov-compliance-001",
  name: "Data Residency / Compliance Readiness",
  version: "1.0.0",
  type: "intelligence",
  description: "Detects PII patterns and regulated data across connectors.",
  tools_supported: ["all"],
  signals: [
    {
      name: "pii_exposure_count",
      source: "computed",
      description: "Records with exposed PII",
      trigger: "schedule",
      logic: "Regex scan",
    },
  ],
};

export const AgentROI: AcceleratorManifest = {
  id: "accel-gov-agent-roi-001",
  name: "Agent ROI & Cost Governance",
  version: "1.0.0",
  type: "intelligence",
  description: "Tracks agent effectiveness, time saved, and cost efficiency.",
  tools_supported: ["ai-gateway"],
  signals: [
    {
      name: "agent_roi_ratio",
      source: "computed",
      description: "Value delivered vs Cost",
      trigger: "event",
      logic: "Time saved * Rate / Compute Cost",
    },
  ],
};
