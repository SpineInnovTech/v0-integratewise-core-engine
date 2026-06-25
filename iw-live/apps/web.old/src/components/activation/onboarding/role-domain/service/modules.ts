/**
 * Customer Service — Role-Domain Module Registry
 *
 * Maps module IDs to lazy-loadable component imports.
 * All components originate from the service domain vertical.
 *
 * Folder: /components/onboarding/role-domain/service/
 * Domain: SERVICE
 */

// ─── Core Views ─────────────────────────────────────────────────────
export const dashboard = () => import("@/components/l1/domains/service/dashboard");
export const slaDashboard = () => import("@/components/l1/domains/service/sla-dashboard-view");
// shell moved to _deprecated/domain-shells/ — no content-router key maps to shell
// export const shell = () => import("@/components/l1/domains/service/shell");

// ─── Service Views ───────────────────────────────────────────────────
export const tickets = () => import("@/components/l1/domains/service/tickets-view");
export const customers = () => import("@/components/l1/domains/service/customers-view");
export const knowledge = () => import("@/components/l1/domains/service/knowledge-view");
export const analytics = () => import("@/components/l1/domains/service/analytics-view");
export const satisfaction = () => import("@/components/l1/domains/service/satisfaction-view");

// ─── Happy Path (L2) ───────────────────────────────────────────────────────
export const serviceToday = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ServiceTodayView,
  }));
export const serviceQueue = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ServiceQueueView,
  }));
export const serviceDecisions = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ServiceDecisionsView,
  }));

// ─── Shell & Support ────────────────────────────────────────────────────────
export const fabricAdmin = () => import("@/components/l1/domains/service/fabric-admin-view");
