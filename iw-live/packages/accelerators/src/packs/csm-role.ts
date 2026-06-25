import { AcceleratorManifest } from "../types";

export const CSMAccount360: AcceleratorManifest = {
  id: "accel-role-csm-001",
  name: "CSM Account 360",
  version: "1.0.0",
  type: "role_view",
  description:
    "Role-based projection for Customer Success Managers focusing on retention and adoption.",

  // This View Pack relies on the data provided by the Vertical Accelerator
  tools_supported: [],
  roles_supported: ["csm"],

  views: {
    csm: {
      modules_enabled: [
        "Accounts",
        "Meetings",
        "Tasks",
        "Success Plan",
        "Risks",
        "Adoption",
        "Tickets",
        "Stakeholders",
      ],
      widgets: ["EvidenceDrawer", "AccountHealth", "RenewalForecast", "PlaybookGenerator"],
      field_sets: {
        account_master: ["name", "arr_current", "health_score", "renewal_date", "status"],
        risks: ["description", "severity", "mitigation_plan"],
      },
      default_filters: {
        tasks: { status: "!=done" },
        accounts: { owner_id: "CURRENT_USER" },
      },
      actions_allowed: [
        "account.update",
        "task.create",
        "meeting.log",
        "risk.escalate",
        "playbook.trigger",
      ],
    },
  },
};
