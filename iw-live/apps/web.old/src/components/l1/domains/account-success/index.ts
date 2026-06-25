/**
 * Account Success Domain — Component Exports
 * L1 Workspace Components for Customer Success Management
 */

// Views
export { AccountSuccessDashboard } from "./dashboard";
// executive-dashboard.tsx moved to _deprecated/ — wired version retained as executive-dashboard-wired.tsx
// export { ExecutiveDashboard } from "./executive-dashboard";
export { RenewalsView } from "./renewals-view";
export { RiskMatrixView } from "./risk-matrix-view";

// Components
export { KanbanBoard } from "./kanban-board";
export { HealthGauge, HealthBadge } from "./health-gauge";
export { IntelligenceOverlay } from "./intelligence-overlay";

// Data types and utilities
export { getPriorityColor, type CSMTask, type CSMContact } from "./csm-data";

// Shell moved to _deprecated/domain-shells/
// export { AccountSuccessShell } from "./shell";
