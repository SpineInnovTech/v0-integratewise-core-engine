/**
 * Sales Operations — Role-Domain Module Registry
 *
 * COMBINED from:
 *   - /components/sales/ (7 files: activities, contacts, dashboard, deals, forecasting, pipeline, quotes)
 *   - /components/domains/salesops/ (3 files: dashboard, salesops-views, shell)
 *
 * Folder: /components/onboarding/role-domain/salesops/
 * Domain: SALES
 */

// ─── SalesOps Domain Views (from /components/domains/salesops/) ─────────────
export const dashboard = () => import("@/components/l1/domains/salesops/dashboard");
// shell moved to _deprecated/domain-shells/ — no content-router key maps to shell
// export const salesopsShell = () => import("@/components/l1/domains/salesops/shell");

// ─── Individual SalesOps Views (from salesops-views.tsx) ────────────────────
export const pipelineKanban = () =>
  import("@/components/l1/domains/salesops/salesops-views").then((m) => ({
    default: m.PipelineKanban,
  }));
export const pipeline = pipelineKanban;
export const salesDeals = () =>
  import("@/components/l1/domains/salesops/salesops-views").then((m) => ({
    default: m.DealsView,
  }));
export const deals = salesDeals;
export const salesContacts = () =>
  import("@/components/l1/domains/salesops/salesops-views").then((m) => ({
    default: m.ContactsView,
  }));
export const contacts = salesContacts;
export const salesActivities = () =>
  import("@/components/l1/domains/salesops/salesops-views").then((m) => ({
    default: m.ActivitiesView,
  }));
export const activities = salesActivities;
export const sequences = () =>
  import("@/components/l1/domains/salesops/salesops-views").then((m) => ({
    default: m.SequencesView,
  }));
export const salesAnalytics = () =>
  import("@/components/l1/domains/salesops/salesops-views").then((m) => ({
    default: m.SalesAnalyticsView,
  }));
export const forecasting = salesAnalytics;
export const quotes = salesDeals;

// ─── Happy Path (L2) ───────────────────────────────────────────────────────
export const salesToday = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.SalesTodayView,
  }));
export const salesQueue = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.SalesQueueView,
  }));
export const salesDecisions = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.SalesDecisionsView,
  }));
