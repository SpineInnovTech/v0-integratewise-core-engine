/**
 * Product & Engineering — Role-Domain Module Registry
 *
 * Maps module IDs to lazy-loadable component imports.
 * All components originate from the product-engineering domain vertical.
 *
 * Folder: /components/onboarding/role-domain/product-engineering/
 * Domain: PRODUCT_ENGINEERING
 */

// ─── Core Views ─────────────────────────────────────────────────────
export const dashboard = () => import("@/components/l1/domains/product-engineering/dashboard");
export const incidentQueue = () =>
  import("@/components/l1/domains/product-engineering/incident-queue-view");
// shell moved to _deprecated/domain-shells/ — no content-router key maps to shell
// export const shell = () => import("@/components/l1/domains/product-engineering/shell");

// ─── Development Views ─────────────────────────────────────────────
export const roadmap = () => import("@/components/l1/domains/product-engineering/roadmap-view");
export const features = () => import("@/components/l1/domains/product-engineering/features-view");
export const bugs = () => import("@/components/l1/domains/product-engineering/bugs-view");
export const sprints = () => import("@/components/l1/domains/product-engineering/sprints-view");
export const tasks = () => import("@/components/l1/domains/product-engineering/tasks-view");
export const releases = () => import("@/components/l1/domains/product-engineering/releases-view");
export const analytics = () => import("@/components/l1/domains/product-engineering/analytics-view");
export const feedback = () => import("@/components/l1/domains/product-engineering/feedback-view");

// ─── Happy Path (L2) ───────────────────────────────────────────────────────
export const peToday = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ProductEngineeringTodayView,
  }));
export const peQueue = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ProductEngineeringQueueView,
  }));
export const peDecisions = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ProductEngineeringDecisionsView,
  }));

// ─── Shell & Support ────────────────────────────────────────────────────────
export const fabricAdmin = () =>
  import("@/components/l1/domains/product-engineering/fabric-admin-view");
export const settings = () => import("@/components/l1/domains/product-engineering/settings-view");
