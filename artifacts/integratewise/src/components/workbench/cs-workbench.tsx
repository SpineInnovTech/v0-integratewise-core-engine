"use client";

/**
 * Account Success Workbench — Configuration-driven department workbench
 *
 * Built on top of generic DepartmentWorkbench.
 * Proves the doctrine: "Every other workbench is a configuration, not a new product."
 */

import { HeartPulse, Users, AlertTriangle, TrendingUp } from "lucide-react";
import { DepartmentWorkbench } from "./department-workbench";

const CS_ENTITY_TYPES = [
  "account",
  "contact",
  "success_plan",
  "risk",
  "generated_insight",
  "task",
  "engagement",
];

const CS_METRICS = [
  {
    id: "total-arr",
    label: "Total ARR",
    entityType: "account",
    field: "arr",
    type: "currency" as const,
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    id: "active-accounts",
    label: "Active Accounts",
    entityType: "account",
    field: "id",
    type: "number" as const,
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: "at-risk",
    label: "At Risk",
    entityType: "risk",
    field: "id",
    type: "number" as const,
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    id: "avg-health",
    label: "Avg Health",
    entityType: "account",
    field: "health_score",
    type: "percentage" as const,
    icon: <HeartPulse className="w-4 h-4" />,
  },
];

export function CSWorkbench() {
  return (
    <DepartmentWorkbench
      department="CUSTOMER_SUCCESS"
      title="Account Success"
      entityTypes={CS_ENTITY_TYPES}
      metrics={CS_METRICS}
    />
  );
}
