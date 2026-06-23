/**
 * Business Operations — Role-Domain Module Registry
 *
 * Generic operations modules used as fallback for domains without
 * custom components (Finance, Service, Procurement, IT, Education, BizOps).
 *
 * All views now live in: /components/l1/domains/bizops/
 * This file is the shared fallback registry — do not delete.
 */

// ─── Core Views ─────────────────────────────────────────────────────────────
export const dashboard = () => import("@/components/l1/domains/bizops/dashboard");
export const accounts = () =>
  import("@/components/l1/domains/bizops/accounts-view").then((m) => ({ default: m.AccountsView }));
export const tasks = () =>
  import("@/components/l1/domains/bizops/tasks-view").then((m) => ({ default: m.TasksView }));
export const workflows = () =>
  import("@/components/l1/domains/bizops/workflows-view").then((m) => ({
    default: m.WorkflowsView,
  }));
export const documents = () =>
  import("@/components/l1/domains/bizops/documents-view").then((m) => ({
    default: m.DocumentsView,
  }));
export const analyticsView = () =>
  import("@/components/l1/domains/bizops/analytics-view").then((m) => ({
    default: m.OpsAnalyticsView,
  }));
export const calendarView = () =>
  import("@/components/l1/domains/bizops/calendar-view").then((m) => ({ default: m.CalendarView }));
export const integrations = () =>
  import("@/components/l1/domains/bizops/integrations-view").then((m) => ({
    default: m.IntegrationHub,
  }));
export const workflowCanvas = () =>
  import("@/components/l1/domains/bizops/workflow-canvas-view").then((m) => ({
    default: m.WorkflowCanvas,
  }));
export const aiChat = () =>
  import("@/components/_deprecated/l2-removed/ai-chat").then((m) => ({ default: m.AIChat }));

// ─── Admin / IT Views (used by IT_ADMIN domain) ────────────────────────────
export const userManagement = () => import("@/components/l1/admin/user-management");
export const rbacManager = () => import("@/components/l1/admin/rbac-manager");
export const approvalWorkflows = () => import("@/components/l1/admin/approval-workflows");
export const integrationsHub = () => import("@/components/connectivity/integrations-hub");
export const auditLogs = () =>
  import("@/components/l1/domains/it-admin/it-admin-views").then((m) => ({
    default: m.IncidentsView,
  }));

// ─── IT Admin Happy Path (L2) ──────────────────────────────────────────────
export const itAdminToday = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ItAdminTodayView,
  }));
export const itAdminQueue = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ItAdminQueueView,
  }));
export const itAdminDecisions = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ItAdminDecisionsView,
  }));

// ─── Personal / Workspace Views (used by PERSONAL domain) ───────────────────
export const personalDashboard = () => import("@/components/l1/domains/personal/dashboard");
export const hubHome = () => import("@/components/l1/domains/personal/hub-home-view");
export const hubToday = () => import("@/components/l1/domains/personal/hub-today-view");
export const founderToday = () => import("@/components/l1/domains/personal/founder-today-view");
export const founderProjects = () =>
  import("@/components/l1/domains/personal/founder-projects-view");
export const founderDecisions = () =>
  import("@/components/l1/domains/personal/founder-decisions-view");
export const knowledgeHub = () => import("@/components/l1/domains/personal/knowledge-hub-view");
export const whatsNew = () => import("@/components/l1/domains/personal/whats-new-view");
export const documentStorage = () =>
  import("@/components/_deprecated/l2-removed/document-storage/document-storage");
export const bookmarks = () => import("@/components/l1/domains/personal/bookmarks-view");

// ─── Hydration Fabric Admin (system-wide) ───────────────────────────────────
export const fabricAdmin = () => import("@/components/core/hydration/fabric-admin-panel");

// ─── Workspace Settings (system-wide) ───────────────────────────────────────
export const settings = () =>
  import("@/components/l1/workspace/settings-view").then((m) => ({ default: m.SettingsView }));

// ─── Billing / Subscription (system-wide) ───────────────────────────────────
export const billing = () =>
  import("@/components/billing/subscriptions-page").then((m) => ({
    default: m.SubscriptionsPage,
  }));

// ─── Entity Browser & Entity 360 (shared across all domains) ────────────────
export const entityBrowser = () =>
  import("@/components/l1/views/entity-browser").then((m) => ({ default: m.EntityBrowser }));
export const entity360 = () => import("@/components/l1/views/Entity360View");
export const duplicateResolution = () =>
  import("@/components/l1/views/duplicate-resolution-view").then((m) => ({
    default: m.DuplicateResolutionView,
  }));

export const knowledgeHubView = () =>
  import("@/components/l1/views/knowledge-hub").then((m) => ({ default: m.KnowledgeHub }));

// ─── Adaptive Product Views (Personal Space — generic renderer) ─────────────
export const wealthPilot = () =>
  import("@/components/l1/domains/personal/product-views").then((m) => ({
    default: m.WealthPilotView,
  }));
export const wellnessCore = () =>
  import("@/components/l1/domains/personal/product-views").then((m) => ({
    default: m.WellnessCoreView,
  }));
export const learningDesk = () =>
  import("@/components/l1/domains/personal/product-views").then((m) => ({
    default: m.LearningDeskView,
  }));
export const relationshipMap = () =>
  import("@/components/l1/domains/personal/product-views").then((m) => ({
    default: m.RelationshipMapView,
  }));
