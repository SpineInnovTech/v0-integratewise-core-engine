/**
 * Account Success / Customer Success — Role-Domain Module Registry
 *
 * Maps module IDs to lazy-loadable component imports.
 * All components originate from the account-success domain vertical.
 *
 * Folder: /components/onboarding/role-domain/account-success/
 * Domain: CUSTOMER_SUCCESS
 */

// ─── Core Views ─────────────────────────────────────────────────────────────
export const dashboard = () => import("@/components/l1/domains/account-success/dashboard");

// Canonical workbench (projection + 8 primitives)
export const csWorkbench = () =>
  import("@/components/workbench/cs-workbench").then((m) => ({
    default: m.CSWorkbench,
  }));
export const accounts = () => import("@/components/l1/domains/account-success/accounts-view");
export const contacts = () => import("@/components/l1/domains/account-success/contacts-view");
export const meetings = () => import("@/components/l1/domains/account-success/meetings-view");
export const tasks = () => import("@/components/l1/domains/account-success/tasks-view");
export const documents = () => import("@/components/l1/domains/account-success/documents-view");
export const projects = () => import("@/components/l1/domains/account-success/projects-view");
export const csToday = () => import("@/components/l1/domains/account-success/views/cs-today-view");

// ─── Deep Intelligence Views ────────────────────────────────────────────────
export const healthScores = () =>
  import("@/components/l1/domains/account-success/views/platform-health-view");
export const engagementLog = () =>
  import("@/components/l1/domains/account-success/views/engagement-log-view");
export const valueStreams = () =>
  import("@/components/l1/domains/account-success/views/value-streams-view");
export const successPlans = () =>
  import("@/components/l1/domains/account-success/views/success-plans-view");
export const riskRegister = () =>
  import("@/components/l1/domains/account-success/views/risk-register-view");
export const atRisk = () => import("@/components/l1/domains/account-success/views/at-risk-view");
export const decisionLog = () =>
  import("@/components/l1/domains/account-success/views/cs-decision-log-view");
export const accountMaster = () =>
  import("@/components/l1/domains/account-success/views/account-master-view");
export const apiPortfolio = () =>
  import("@/components/l1/domains/account-success/views/api-portfolio-view");
export const businessContext = () =>
  import("@/components/l1/domains/account-success/views/business-context-view");
export const capabilities = () =>
  import("@/components/l1/domains/account-success/views/capabilities-view");
export const companyGrowth = () =>
  import("@/components/l1/domains/account-success/views/company-growth-view");
export const initiatives = () =>
  import("@/components/l1/domains/account-success/views/initiatives-view");
export const insights = () => import("@/components/l1/domains/account-success/views/insights-view");
export const peopleTeam = () =>
  import("@/components/l1/domains/account-success/views/people-team-view");
export const productClient = () =>
  import("@/components/l1/domains/account-success/views/product-client-view");
export const stakeholderOutcomes = () =>
  import("@/components/l1/domains/account-success/views/stakeholder-outcomes-view");
export const strategicObjectives = () =>
  import("@/components/l1/domains/account-success/views/strategic-objectives-view");
export const taskManager = () =>
  import("@/components/l1/domains/account-success/views/task-manager-view");
export const accountHealth = () =>
  import("@/components/l1/domains/account-success/views/account-health-view");
export const accountTeam = () =>
  import("@/components/l1/domains/account-success/views/account-team-view");
export const tasksCards = () =>
  import("@/components/l1/domains/account-success/views/tasks-cards-view");

// ─── Shell & Support ────────────────────────────────────────────────────────
// shell moved to _deprecated/domain-shells/ — no content-router key maps to shell
// export const shell = () => import("@/components/l1/domains/account-success/shell");
export const intelligenceOverlay = () =>
  import("@/components/l1/domains/account-success/intelligence-overlay");
export const fabricAdmin = () =>
  import("@/components/l1/domains/account-success/fabric-admin-view");
export const settings = () => import("@/components/l1/domains/account-success/settings-view");

// ─── Product Views (MuleSoft Account Success Family) ────────────────────────
export const csmAccountsHub = () =>
  import("@/components/l1/domains/account-success/views/csm-accounts-hub");
export const intelligenceCenter = () =>
  import("@/components/l1/domains/account-success/views/intelligence-center");
export const strategicAccountSuccess = () =>
  import("@/components/l1/domains/account-success/views/strategic-account-success");

// ─── Adaptive Product Views (generic renderer) ─────────────────────────────
export const dataSentinel = () =>
  import("@/components/l1/domains/account-success/views/product-views").then((m) => ({
    default: m.DataSentinelView,
  }));
export const vaultGuard = () =>
  import("@/components/l1/domains/account-success/views/product-views").then((m) => ({
    default: m.VaultGuardView,
  }));
export const architectIq = () =>
  import("@/components/l1/domains/account-success/views/product-views").then((m) => ({
    default: m.ArchitectIQView,
  }));
export const templateForge = () =>
  import("@/components/l1/domains/account-success/views/product-views").then((m) => ({
    default: m.TemplateForgeView,
  }));
export const dealDesk = () =>
  import("@/components/l1/domains/account-success/views/product-views").then((m) => ({
    default: m.DealDeskView,
  }));
