/**
 * Revenue Operations — Role-Domain Module Registry
 *
 * Folder: /components/onboarding/role-domain/revops/
 * Domain: REVOPS
 */

// ─── Core RevOps Views ──────────────────────────────────────────────────────
export const dashboard = () => import("@/components/l1/domains/revops/dashboard");
export const pendingReview = () => import("@/components/l1/domains/revops/pending-review-view");
export const decisionLog = () => import("@/components/l1/domains/revops/decision-log-view");
// shell moved to _deprecated/domain-shells/ — no content-router key maps to shell
// export const shell = () => import("@/components/l1/domains/revops/shell");

// ─── Individual RevOps Views (from revops-views.tsx) ─────────────────────────
export const pipelineView = () =>
  import("@/components/l1/domains/revops/revops-views").then((m) => ({
    default: m.PipelineView,
  }));
export const forecastView = () =>
  import("@/components/l1/domains/revops/revops-views").then((m) => ({
    default: m.ForecastView,
  }));
export const quotaView = () =>
  import("@/components/l1/domains/revops/revops-views").then((m) => ({
    default: m.QuotaView,
  }));
export const analyticsView = () =>
  import("@/components/l1/domains/revops/revops-views").then((m) => ({
    default: m.AnalyticsView,
  }));
export const cohortView = () =>
  import("@/components/l1/domains/revops/revops-views").then((m) => ({
    default: m.CohortView,
  }));
export const teamView = () =>
  import("@/components/l1/domains/revops/revops-views").then((m) => ({
    default: m.TeamView,
  }));
export const metricsView = () =>
  import("@/components/l1/domains/revops/revops-views").then((m) => ({
    default: m.MetricsView,
  }));

// ─── Happy Path (L2) ───────────────────────────────────────────────────────
export const revopsToday = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.RevopsTodayView,
  }));
export const revopsQueue = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.RevopsQueueView,
  }));
export const revopsDecisions = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.RevopsDecisionsView,
  }));
