/**
 * RevOps — Complete 12-Module Data Types
 * ARR, MRR, NRR, GRR, Pipeline Intelligence, Forecasting, Renewals, Attribution, Governed Actions.
 */

// ─── 2. REVENUE DASHBOARD ────────────────────────────────────────────────────
export interface RevenueMetrics {
  arr: number;
  arrChange: number;
  mrr: number;
  mrrChange: number;
  nrr: number; // Net Revenue Retention %
  grr: number; // Gross Revenue Retention %
  expansionRevenue: number;
  contractionRevenue: number;
  churnedRevenue: number;
  revenuePerEmployee: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
}

// ─── 3. PIPELINE INTELLIGENCE ────────────────────────────────────────────────
export interface PipelineIntelligence {
  totalValue: number;
  weightedValue: number;
  coverageRatio: number; // pipeline ÷ quota (healthy = 3x+)
  velocity: number; // $/day
  avgDaysPerStage: Record<string, number>;
  stuckDeals: StuckDeal[];
  stageConversionRates: { from: string; to: string; rate: number }[];
  pipelineCreatedMTD: number;
  pipelineBySource: { source: string; value: number; pct: number }[];
}

export interface StuckDeal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
  daysInStage: number;
  owner: string;
  lastActivity: string;
}

// ─── 4. FORECASTING ──────────────────────────────────────────────────────────
export interface ForecastPeriod {
  period: string;
  quota: number;
  closedWon: number;
  commit: number;
  bestCase: number;
  upside: number;
  attainment: number;
  forecastAccuracy: number; // historical %
  gapToPlan: number;
}

export interface ForecastScenario {
  label: "best" | "expected" | "worst";
  value: number;
  probability: number;
}

// ─── 5. DEAL ANALYTICS ───────────────────────────────────────────────────────
export type LossReason =
  | "budget"
  | "timing"
  | "competitor"
  | "no-decision"
  | "champion-left"
  | "other";

export interface DealAnalytics {
  avgDealSize: number;
  winRate: number;
  lossReasons: { reason: LossReason; count: number; pct: number }[];
  avgSaleCycleDays: number;
  avgDiscountPct: number;
  avgMultiThreadScore: number; // contacts engaged per deal
  competitiveWinLoss: { competitor: string; wins: number; losses: number; winRate: number }[];
}

// ─── 6. QUOTA & TERRITORY ────────────────────────────────────────────────────
export interface Territory {
  id: string;
  name: string;
  owner: string;
  accountCount: number;
  quota: number;
  attainment: number;
  pipeline: number;
  coveragePct: number;
}

export interface RepQuota {
  repId: string;
  name: string;
  initials: string;
  quota: number;
  attainment: number;
  closedWon: number;
  pipeline: number;
  rampStatus: "ramping" | "ramped" | "new";
  rampWeek: number;
}

// ─── 7. BILLING & SUBSCRIPTION ───────────────────────────────────────────────
export interface Subscription {
  id: string;
  clientName: string;
  plan: string;
  mrr: number;
  status: "active" | "past-due" | "cancelled" | "trialing";
  renewalDate: string;
  paymentMethod: "card" | "wire" | "ach";
  dunningStatus?: "none" | "warning" | "failed" | "escalated";
}

export interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: "draft" | "sent" | "partial" | "paid" | "overdue" | "written-off";
  recognizedRevenue: number;
  deferredRevenue: number;
}

// ─── 8. RENEWAL INTELLIGENCE ─────────────────────────────────────────────────
export interface RenewalRecord {
  id: string;
  clientName: string;
  arr: number;
  renewalDate: string;
  daysUntilRenewal: number;
  healthScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  expansionCandidate: boolean;
  contractionRisk: boolean;
  csm: string;
  lastEngagement: string;
}

// ─── 9. ATTRIBUTION & SOURCE ─────────────────────────────────────────────────
export interface AttributionRecord {
  source: string;
  spend: number;
  pipeline: number;
  revenue: number;
  roi: number;
  firstTouchRevenue: number;
  multiTouchRevenue: number;
  timeToRevenueDays: number;
}

// ─── 10. PROCESS COMPLIANCE ──────────────────────────────────────────────────
export interface ProcessCompliance {
  crmHygieneScore: number;
  activityCompliancePct: number;
  forecastSubmissionPct: number;
  avgDealQualificationScore: number;
  handoffCompliancePct: number;
  period: string;
}

// ─── 12. GOVERNED ACTIONS ────────────────────────────────────────────────────
export interface GovernedAction {
  id: string;
  type:
    | "forecast-override"
    | "discount-approval"
    | "territory-reassignment"
    | "renewal-escalation"
    | "billing-correction";
  title: string;
  description: string;
  trigger: string;
  requestedBy: string;
  approver: string;
  status: "pending" | "approved" | "denied" | "escalated";
  createdAt: string;
  urgency: "high" | "medium" | "low";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

export function nrrColor(nrr: number): string {
  if (nrr >= 110) return "var(--iw-success)";
  if (nrr >= 100) return "var(--iw-forest-mid)";
  if (nrr >= 90) return "var(--iw-warning)";
  return "var(--iw-danger)";
}

export function riskColor(risk: string): string {
  if (risk === "low") return "var(--iw-success)";
  if (risk === "medium") return "var(--iw-warning)";
  if (risk === "high") return "#b8943f";
  return "var(--iw-danger)";
}
