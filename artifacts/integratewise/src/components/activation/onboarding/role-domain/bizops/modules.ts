/**
 * Business Operations — Role-Domain Module Registry (BIZOPS domain)
 *
 * BIZOPS is the super-domain: it has its own domain-specific views AND
 * cross-department access to all other domains' views.
 *
 * All views live in: /components/l1/domains/bizops/
 */

// ─── BizOps Domain-Specific Views ───────────────────────────────────────────
// Canonical workbench (projection + 8 primitives)
export const dashboard = () =>
  import("@/components/workbench/bizops-workbench").then((m) => ({
    default: m.BizOpsWorkbench,
  }));

// Legacy dashboard (preserved for reference)
export const legacyDashboard = () => import("@/components/l1/domains/bizops/dashboard");
export const opsCommandCenter = () =>
  import("@/components/l1/domains/bizops/ops-command-center-view");

// Core workspace views (now using rich implementations from domains/bizops/)
export const bizopsProjects = () =>
  import("@/components/l1/domains/bizops/workflows-view").then((m) => ({
    default: m.WorkflowsView,
  }));
export const bizopsWorkflows = () =>
  import("@/components/l1/domains/bizops/workflow-canvas-view").then((m) => ({
    default: m.WorkflowCanvas,
  }));
export const bizopsAnalytics = () =>
  import("@/components/l1/domains/bizops/analytics-view").then((m) => ({
    default: m.OpsAnalyticsView,
  }));
export const bizopsAccounts = () =>
  import("@/components/l1/domains/bizops/accounts-view").then((m) => ({ default: m.AccountsView }));
export const bizopsTasks = () =>
  import("@/components/l1/domains/bizops/tasks-view").then((m) => ({ default: m.TasksView }));
export const bizopsDocs = () =>
  import("@/components/l1/domains/bizops/documents-view").then((m) => ({
    default: m.DocumentsView,
  }));

// 14-module schema views
export const strategicHub = () =>
  import("@/components/l1/domains/bizops/strategic-hub-view").then((m) => ({
    default: m.StrategicHubView,
  }));
export const metricsView = () =>
  import("@/components/l1/domains/bizops/metrics-view").then((m) => ({
    default: m.MetricsView,
  }));
export const crmView = () =>
  import("@/components/l1/domains/bizops/crm-view").then((m) => ({
    default: m.CRMView,
  }));
export const salesHub = () =>
  import("@/components/l1/domains/bizops/sales-hub-view").then((m) => ({
    default: m.SalesHubView,
  }));
export const clientsView = () =>
  import("@/components/l1/domains/bizops/clients-view").then((m) => ({
    default: m.ClientsView,
  }));

// ─── Happy Path (L2) ───────────────────────────────────────────────────────
export const bizopsToday = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.BizopsTodayView,
  }));
export const bizopsQueue = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.BizopsQueueView,
  }));
export const bizopsDecisions = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.BizopsDecisionsView,
  }));

// ─── Executive Product Views ────────────────────────────────────────────────
export const founderOps = () =>
  import("@/components/l1/domains/bizops/views/founder-ops-view").then((m) => ({
    default: m.FounderOpsView,
  }));
export const ceoView = () =>
  import("@/components/l1/domains/bizops/views/ceo-view").then((m) => ({
    default: m.CEOView,
  }));
export const cooView = () =>
  import("@/components/l1/domains/bizops/views/coo-view").then((m) => ({
    default: m.COOView,
  }));
export const cioCtoView = () =>
  import("@/components/l1/domains/bizops/views/cio-cto-view").then((m) => ({
    default: m.CIOCTOView,
  }));

// ─── 14-Department Unified Views ────────────────────────────────────────────
export const strategyLeadership = () =>
  import("@/components/l1/domains/bizops/views").then((m) => ({
    default: m.StrategyLeadershipView,
  }));
export const operationsCenter = () =>
  import("@/components/l1/domains/bizops/views").then((m) => ({
    default: m.OperationsCenterView,
  }));
export const humanResources = () =>
  import("@/components/l1/domains/bizops/views").then((m) => ({
    default: m.HumanResourcesView,
  }));
export const legalCompliance = () =>
  import("@/components/l1/domains/bizops/views").then((m) => ({
    default: m.LegalComplianceView,
  }));
export const businessIntelligence = () =>
  import("@/components/bi/bi-dashboard").then((m) => ({
    default: m.default,
  }));
export const partnerships = () =>
  import("@/components/l1/domains/bizops/views").then((m) => ({
    default: m.PartnershipsView,
  }));
export const knowledgeManagement = () =>
  import("@/components/l1/domains/bizops/views").then((m) => ({
    default: m.KnowledgeManagementView,
  }));

// ─── Adaptive Product Views (generic renderer) ─────────────────────────────
export const complianceVault = () =>
  import("@/components/l1/domains/bizops/views/product-views").then((m) => ({
    default: m.ComplianceVaultView,
  }));
export const vendorGuard = () =>
  import("@/components/l1/domains/bizops/views/product-views").then((m) => ({
    default: m.VendorGuardView,
  }));
export const partnerBridge = () =>
  import("@/components/l1/domains/bizops/views/product-views").then((m) => ({
    default: m.PartnerBridgeView,
  }));
export const growthDesk = () =>
  import("@/components/l1/domains/bizops/views/product-views").then((m) => ({
    default: m.GrowthDeskView,
  }));
export const hirePilot = () =>
  import("@/components/l1/domains/bizops/views/product-views").then((m) => ({
    default: m.HirePilotView,
  }));
export const finPulse = () =>
  import("@/components/l1/domains/bizops/views/product-views").then((m) => ({
    default: m.FinPulseView,
  }));
