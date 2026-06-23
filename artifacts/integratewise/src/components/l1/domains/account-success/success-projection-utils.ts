import type { SectionContract, SuccessPageProjection } from "@integratewise/types";
import type { Account, Contact, Insight, Renewal, Risk, Task } from "@/lib/api-cs";

export interface SuccessSummaryData {
  totalAccounts: number;
  totalARR: number;
  avgHealth: number;
  atRiskAccounts: number;
  renewalsTracked: number;
  activeRisks: number;
}

export interface UsageMetricProjection {
  id: string;
  metricName: string;
  currentValue: number;
  targetValue: number;
  healthStatus: string;
  trend: string;
  source?: string;
  updatedAt?: string | null;
}

export interface TechnicalAssetProjection {
  id: string;
  name: string;
  type: string;
  healthStatus: string;
  ownerTeam?: string;
  source?: string;
  updatedAt?: string | null;
}

export interface UsageAdoptionSectionData {
  usage: UsageMetricProjection[];
  environment: UsageMetricProjection[];
  technicalAssets: TechnicalAssetProjection[];
}

export interface IntegrationsSyncHealthSectionData {
  integrations: Array<{
    id: string;
    systemName: string;
    integrationType: string;
    status: string;
    lastSyncAt?: string | null;
    source?: string;
  }>;
  syncs: Array<{
    id: string;
    systemName: string;
    integrationType: string;
    status: string;
    lastSyncAt?: string | null;
    source?: string;
  }>;
  connectorCoverage?: Record<string, string[]>;
}

export interface TeamMemberProjection {
  id: string;
  fullName: string;
  email?: string | null;
  role: string;
  department?: string | null;
  region?: string | null;
  accountCount: number;
  totalArrManaged: number;
  avgHealthScore: number;
  atRiskAccountCount: number;
  source?: string;
}

export interface StakeholdersSectionData {
  stakeholders: ProjectionContact[];
  internalTeam: TeamMemberProjection[];
}

export interface SuccessPlanProjection {
  id: string;
  accountId: string;
  executiveSummary: string;
  planPeriod: string;
  planStatus: string;
  creationDate?: string | null;
  nextQbrDate?: string | null;
  executiveSponsorCustomer?: string | null;
  executiveSponsorInternal?: string | null;
  source?: string;
  updatedAt?: string | null;
}

export interface SupportCasesSectionData {
  risks: Risk[];
  engagements: Task[];
}

export interface SuccessPlansSectionData {
  plans: SuccessPlanProjection[];
  objectives: Array<Record<string, unknown>>;
  initiatives: Task[];
}

export function getSection<T>(
  projection: SuccessPageProjection | undefined,
  key: string
): SectionContract<T> | undefined {
  return projection?.sections?.[key] as SectionContract<T> | undefined;
}

export function getSectionArray<T>(
  projection: SuccessPageProjection | undefined,
  key: string
): T[] {
  const section = getSection<T[]>(projection, key);
  return Array.isArray(section?.data) ? section.data : [];
}

export function getSectionObject<T extends object>(
  projection: SuccessPageProjection | undefined,
  key: string
): T | undefined {
  const section = getSection<T>(projection, key);
  if (!section?.data || Array.isArray(section.data) || typeof section.data !== "object") {
    return undefined;
  }
  return section.data;
}

export function formatCurrency(value?: number | null) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount >= 1000000 ? 1 : 0,
    notation: amount >= 1000000 ? "compact" : "standard",
  }).format(amount);
}

export function formatCompactNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

export function formatPercent(value?: number | null, suffix = "%") {
  if (value == null || Number.isNaN(Number(value))) return `0${suffix}`;
  return `${Math.round(Number(value))}${suffix}`;
}

export function formatDateLabel(value?: string | null) {
  if (!value) return "Not scheduled";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeLabel(value?: string | null) {
  if (!value) return "No recent activity";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const diffMs = parsed.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays > 0) return `${diffDays}d ahead`;
  return `${Math.abs(diffDays)}d ago`;
}

export function daysUntil(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.ceil((parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function sortRenewals(items: Renewal[]) {
  return [...items].sort((left, right) => {
    const leftDays = left.daysUntilRenewal ?? Number.MAX_SAFE_INTEGER;
    const rightDays = right.daysUntilRenewal ?? Number.MAX_SAFE_INTEGER;
    return leftDays - rightDays;
  });
}

export function sortTasks(items: Task[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });
}

export function summarizeProof(
  ...sections: Array<SectionContract<unknown> | undefined>
): Array<{ source: string; count: number }> {
  const counts = new Map<string, number>();
  for (const section of sections) {
    for (const proof of section?.proof || []) {
      counts.set(proof.source, (counts.get(proof.source) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((left, right) => right.count - left.count);
}

export function coverageLabel(section?: SectionContract<unknown>) {
  if (!section) return "No projection";
  if (section.status === "ready") return `${section.coverage}% coverage`;
  if (section.status === "partial") return `${section.coverage}% coverage · partial`;
  return "Awaiting data";
}

export type ProjectionAccount = Account;
export type ProjectionContact = Contact;
export type ProjectionInsight = Insight;
export type ProjectionRenewal = Renewal;
export type ProjectionRisk = Risk;
export type ProjectionTask = Task;
