import { AcceleratorManifest } from "../types";

export const RenewalExpansionSignal: AcceleratorManifest = {
  id: "accel-growth-renewal-001",
  name: "Renewal & Expansion Signal Accelerator",
  version: "1.0.0",
  type: "intelligence",
  description:
    "Builds renewal readiness and expansion signals based on usage trends and engagement.",
  tools_supported: ["salesforce", "zendesk", "amplitude"],
  signals: [
    {
      name: "renewal_risk_score",
      source: "computed",
      description: "Risk score derived from gaps",
      trigger: "schedule",
      logic: "Composite Health",
    },
    {
      name: "expansion_propensity",
      source: "computed",
      description: "Likelihood to buy more",
      trigger: "event",
      logic: "Usage > 90%",
    },
  ],
};

export const PlaybookCompliance: AcceleratorManifest = {
  id: "accel-growth-playbook-001",
  name: "Playbook Compliance & Outcome",
  version: "1.0.0",
  type: "intelligence",
  description: "Checks whether CS/TAM/Sales playbooks are followed (cadence, artifacts).",
  tools_supported: ["salesforce", "hubspot"],
  signals: [
    {
      name: "playbook_compliance_score",
      source: "computed",
      description: "% of required steps completed",
      trigger: "schedule",
      logic: "Step check",
    },
  ],
};

export const ExecutiveAlignment: AcceleratorManifest = {
  id: "accel-growth-exec-001",
  name: "Executive Alignment & Decision Trace",
  version: "1.0.0",
  type: "intelligence",
  description: "Creates decision objects from meetings/docs and tracks outcomes.",
  tools_supported: ["zoom", "gcal", "notion"],
  signals: [
    {
      name: "decision_trace_gap",
      source: "computed",
      description: "Decisions without implementation",
      trigger: "schedule",
      logic: "Task link check",
    },
  ],
};
