/**
 * BizOps Views — Barrel re-exports for shell consumption
 */
export { AccountsView as BizOpsAccountsView } from "./accounts-view";
export { WorkflowsView as BizOpsWorkflowsView } from "./workflows-view";
export { OpsAnalyticsView as BizOpsAnalyticsView } from "./analytics-view";
export { TasksView as BizOpsTasksView } from "./tasks-view";
export { DocumentsView as BizOpsDocsView } from "./documents-view";

// Projects view — re-export from tasks (projects are tracked as tasks in BizOps)
export { TasksView as BizOpsProjectsView } from "./tasks-view";
