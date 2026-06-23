/**
 * Finance — Role-Domain Module Registry
 *
 * Maps module IDs to lazy-loadable component imports.
 * All components originate from the finance domain vertical.
 *
 * Folder: /components/onboarding/role-domain/finance/
 * Domain: FINANCE
 */

// ─── Core Views ─────────────────────────────────────────────────────
export const dashboard = () => import("@/components/l1/domains/finance/dashboard");
export const invoiceApprovals = () =>
  import("@/components/l1/domains/finance/invoice-approvals-view");
// shell moved to _deprecated/domain-shells/ — no content-router key maps to shell
// export const shell = () => import("@/components/l1/domains/finance/shell");

// ─── Financial Views ───────────────────────────────────────────────
export const revenue = () => import("@/components/l1/domains/finance/revenue-view");
export const expenses = () => import("@/components/l1/domains/finance/expenses-view");
export const reports = () =>
  import("@/components/l1/domains/finance/finance-views").then((m) => ({
    default: m.FinanceReportsView,
  }));
export const forecasting = () =>
  import("@/components/l1/domains/finance/finance-views").then((m) => ({
    default: m.FinanceForecastingView,
  }));
export const budget = () =>
  import("@/components/l1/domains/finance/finance-views").then((m) => ({
    default: m.FinanceBudgetView,
  }));

// ─── Happy Path (L2) ───────────────────────────────────────────────────────
export const financeToday = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.FinanceTodayView,
  }));
export const financeStrategy = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.FinanceStrategyView,
  }));
export const financeDecisions = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.FinanceDecisionsView,
  }));
