/**
 * Procurement — Role-Domain Module Registry
 *
 * Maps module IDs to lazy-loadable component imports.
 * All components originate from the procurement domain vertical.
 *
 * Folder: /components/onboarding/role-domain/procurement/
 * Domain: PROCUREMENT
 */

// ─── Core Views ─────────────────────────────────────────────────────
export const dashboard = () => import("@/components/l1/domains/procurement/dashboard");
export const renewals = () => import("@/components/l1/domains/procurement/renewals-view");

// ─── Individual Procurement Views (from procurement-views.tsx) ──────
export const vendors = () =>
  import("@/components/l1/domains/procurement/procurement-views").then((m) => ({
    default: m.VendorsView,
  }));
export const orders = () =>
  import("@/components/l1/domains/procurement/procurement-views").then((m) => ({
    default: m.OrdersView,
  }));
export const contracts = () =>
  import("@/components/l1/domains/procurement/procurement-views").then((m) => ({
    default: m.ContractsView,
  }));
export const spend = () =>
  import("@/components/l1/domains/procurement/procurement-views").then((m) => ({
    default: m.SpendView,
  }));
export const savings = () =>
  import("@/components/l1/domains/procurement/procurement-views").then((m) => ({
    default: m.SavingsView,
  }));

// ─── Happy Path (L2) ───────────────────────────────────────────────────────
export const procurementToday = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ProcurementTodayView,
  }));
export const procurementQueue = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ProcurementQueueView,
  }));
export const procurementDecisions = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ProcurementDecisionsView,
  }));
