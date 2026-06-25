import { AcceleratorManifest } from "../types";

export const ExecBusinessCockpit: AcceleratorManifest = {
  id: "accel-role-exec-001",
  name: "Business Exec Cockpit",
  version: "1.0.0",
  type: "role_view",
  description: "Executive view focusing on portfolio health, NRR, and systemic risks.",

  tools_supported: [],
  roles_supported: ["business", "executive"],

  views: {
    business: {
      modules_enabled: [
        "Portfolio Dashboard",
        "Revenue",
        "Risks",
        "Strategic Initiatives",
        "Team Health",
      ],
      widgets: ["GlobalNRR", "ARRAtRisk", "SystemicTrends", "TeamPerformance"],
      field_sets: {
        account_master: ["name", "tier", "arr_current", "health_score", "renewal_date"],
      },
      default_filters: {
        accounts: { tier: "Strategic" }, // Focus on big accounts
        risks: { severity: "Critical" },
      },
      actions_allowed: ["risk.acknowledge", "initiative.sponsor"],
    },
  },
};
