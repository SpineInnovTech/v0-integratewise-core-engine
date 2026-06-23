export interface AccountMaster {
  accountId: string;
  accountName: string;
  csmNarrative: string;
  industryVertical: string;
  industrySubSector: string;
  contractType: string;
  contractStartDate: string;
  contractEndDate: string;
  renewalDate: string;
  daysToRenewal: number;
  renewalRiskLevel: "Low" | "Medium" | "High" | "Critical";
  arr: number;
  acv: number;
  customerSuccessManager: string;
  accountExecutive: string;
  solutionsArchitect: string;
  executiveSponsorCustomer: string;
  executiveSponsorMuleSoft: string;
  healthScore: number;
  healthScoreTrend3M: "Improving" | "Stable" | "Declining";
  healthScoreChange: number;
  spRating: string;
  customerAnnualRevenue: number;
  employeeCount: number;
  geography: string;
  country: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactRole: string;
  accountStatus: "Active" | "Onboarding" | "At Risk" | "Churned";
  lastEngagementDate: string;
  nextEngagementDue: string;
  engagementCadence: string;
  createdDate: string;
  lastModified: string;
  modifiedBy: string;
  dataSource: string;
}

export interface PeopleTeam {
  personId: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  region: string;
  slackUserId: string;
  activeStatus: "Active" | "Inactive";
  accountsAssigned: string[];
  accountCount: number;
  totalArrManaged: number;
  avgHealthScore: number;
  atRiskAccountCount: number;
}

export interface BusinessContext {
  contextId: string;
  account: string;
  businessModel: string;
  marketPosition: string;
  operatingEnvironment: string;
  keyBusinessChallenges: string[];
  strategicPrioritiesCustomer: string[];
  digitalMaturity: "Nascent" | "Developing" | "Advancing" | "Leading";
  itComplexityScore: number;
  legacySystemCount: number;
  cloudStrategy: string;
  dataClassification: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface StrategicObjective {
  objectiveId: string;
  account: string;
  strategicPillar: string;
  objectiveName: string;
  description: string;
  businessDriver: string;
  quantifiedGoal: string;
  targetDate: string;
  businessOwner: string;
  businessValueUsd: number;
  muleSoftRelevance: "High" | "Medium" | "Low";
  status: "Not Started" | "In Progress" | "On Track" | "At Risk" | "Completed";
  progressPercent: number;
  healthIndicator: "Green" | "Amber" | "Red";
  lastReviewDate: string;
  notes: string;
  linkedCapabilities: string[];
  linkedValueStreams: string[];
  linkedInitiatives: string[];
  linkedMetrics: string[];
}

export interface MuleSoftCapability {
  capabilityId: string;
  account: string;
  capabilityDomain: string;
  capabilityName: string;
  description: string;
  currentMaturity: string;
  currentMaturityNum: number;
  targetMaturity: string;
  targetMaturityNum: number;
  maturityGap: number;
  gapStatus: "Critical" | "Significant" | "Moderate" | "Minor" | "Closed";
  linkedStrategicObjectives: string[];
  supportingValueStreams: string[];
  investmentRequiredUsd: number;
  priority: "P1" | "P2" | "P3" | "P4";
  implementationStatus: "Not Started" | "Planning" | "In Progress" | "Completed";
  businessImpactStatement: string;
  technicalOwnerCustomer: string;
  lastAssessmentDate: string;
  linkedMetrics: string[];
}

export interface ValueStream {
  streamId: string;
  account: string;
  valueStreamName: string;
  businessProcess: string;
  processOwner: string;
  linkedStrategicObjectives: string[];
  enabledMuleSoftCapabilities: string[];
  integrationEndpoints: number;
  apisConsumed: number;
  annualTransactionVolume: number;
  cycleTimeBaselineHours: number;
  cycleTimeCurrentHours: number;
  cycleTimeTargetHours: number;
  cycleTimeReductionPercent: number;
  totalBusinessValueUsd: number;
  customerSatisfactionImpact: "High" | "Medium" | "Low";
  operationalRiskLevel: "Low" | "Medium" | "High" | "Critical";
  linkedMetrics: string[];
}

export interface APIPortfolio {
  apiId: string;
  account: string;
  apiName: string;
  apiType: "System" | "Process" | "Experience";
  apiVersion: string;
  businessCapability: string;
  linkedValueStreams: string[];
  linkedStrategicObjectives: string[];
  environment: "Production" | "Staging" | "Development";
  monthlyTransactions: number;
  avgResponseTimeMs: number;
  slaTargetMs: number;
  slaCompliancePercent: number;
  errorRatePercent: number;
  uptimePercent: number;
  consumingApplications: string[];
  businessCriticality: "Critical" | "High" | "Medium" | "Low";
  healthStatus: "Healthy" | "Warning" | "Critical" | "Offline";
  ownerTeam: string;
  lastSyncFromAnypoint: string;
  linkedMetrics: string[];
}

export interface PlatformHealthMetric {
  metricId: string;
  account: string;
  metricCategory: string;
  metricName: string;
  metricType: "KPI" | "SLA" | "Operational" | "Business";
  currentValue: number;
  targetValue: number;
  thresholdWarning: number;
  thresholdCritical: number;
  unit: string;
  measurementFrequency: string;
  healthStatus: "Healthy" | "Warning" | "Critical";
  healthStatusNumerical: number;
  trendIsGood: boolean;
  lastMeasured: string;
  linkedCapability: string;
  linkedStrategicObjectives: string[];
  linkedValueStream: string;
  dataSource: string;
  businessImpactStatement: string;
}

export interface Initiative {
  initiativeId: string;
  account: string;
  initiativeName: string;
  initiativeType: string;
  linkedStrategicObjectives: string[];
  linkedCapabilities: string[];
  businessDriver: string;
  proposedBy: string;
  priority: "P1" | "P2" | "P3" | "P4";
  phase: "Ideation" | "Planning" | "Execution" | "Monitoring" | "Completed" | "Cancelled";
  status: "On Track" | "At Risk" | "Delayed" | "Completed" | "Blocked";
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate: string | null;
  daysOverdue: number;
  investmentAmountUsd: number;
  muleSoftServicesUsd: number;
  expectedAnnualBenefitUsd: number;
  expectedPaybackMonths: number;
  realizedAnnualBenefitUsd: number;
  successCriteria: string;
  ownerMuleSoft: string;
  ownerCustomer: string;
  blockers: string;
  linkedMetrics: string[];
}

export interface TechnicalRisk {
  riskId: string;
  account: string;
  riskCategory: string;
  riskTitle: string;
  description: string;
  affectedCapability: string;
  affectedApis: string[];
  linkedStrategicObjectives: string[];
  impact: "Critical" | "High" | "Medium" | "Low";
  impactScore: number;
  probability: "Very Likely" | "Likely" | "Possible" | "Unlikely";
  probabilityScore: number;
  riskScore: number;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  mitigationStrategy: string;
  mitigationInitiative: string;
  mitigationOwner: string;
  targetResolutionDate: string;
  status: "Open" | "Mitigating" | "Resolved" | "Accepted";
  dateIdentified: string;
}

export interface StakeholderOutcome {
  outcomeId: string;
  account: string;
  stakeholderType: string;
  stakeholderName: string;
  outcomeStatement: string;
  linkedStrategicObjectives: string[];
  linkedValueStreams: string[];
  successMetricName: string;
  baselineValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  targetAchievementPercent: number;
  measurementMethod: string;
  status: "On Track" | "At Risk" | "Behind" | "Achieved";
}

export interface EngagementLog {
  engagementId: string;
  account: string;
  engagementDate: string;
  engagementType: string;
  attendeesMuleSoft: string[];
  attendeesCustomer: string[];
  customerSeniority: "C-Suite" | "VP" | "Director" | "Manager" | "Individual";
  topicsDiscussed: string[];
  actionItems: string[];
  sentiment: "Very Positive" | "Positive" | "Neutral" | "Negative" | "Concerning";
  relationshipDepthScore: number;
  nextSteps: string;
  nextEngagementDate: string;
  linkedStrategicObjectives: string[];
  linkedInitiatives: string[];
}

export interface SuccessPlan {
  successPlanId: string;
  account: string;
  executiveSummary: string;
  planPeriod: string;
  planStatus: "Active" | "Draft" | "Under Review" | "Completed";
  creationDate: string;
  lastUpdated: string;
  strategicObjectivesCount: number;
  linkedStrategicObjectives: string[];
  linkedInitiatives: string[];
  keyInitiatives: string[];
  top3Risks: string[];
  linkedMetrics: string[];
  executiveSponsorCustomer: string;
  executiveSponsorMuleSoft: string;
  nextQbrDate: string;
}

export interface TaskItem {
  taskId: string;
  taskName: string;
  account: string;
  owner: string;
  dueDate: string;
  status: "Open" | "In Progress" | "Done" | "Overdue" | "Blocked";
  priority: "Critical" | "High" | "Medium" | "Low";
  linkedRisk: string;
  linkedInitiative: string;
  linkedObjective: string;
  linkedMetric: string;
  source: string;
  externalTaskId: string;
}

export interface GeneratedInsight {
  insightId: string;
  account: string;
  csm: string;
  insightText: string;
  recommendedAction: string;
  status: "New" | "Acknowledged" | "Actioned" | "Dismissed";
  dateGenerated: string;
  linkedMetric: string;
  linkedRisk: string;
  linkedInitiative: string;
  linkedObjective: string;
}

export function getAccountName(id: string): string {
  return id;
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

export function healthColor(score: number): string {
  if (score >= 80) return "var(--iw-success)";
  if (score >= 60) return "var(--iw-warning)";
  return "var(--iw-danger)";
}

export function riskColor(level: string): string {
  switch (level) {
    case "Critical":
      return "#ef4444";
    case "High":
      return "#b8943f";
    case "Medium":
      return "#b8943f";
    case "Low":
      return "#22c55e";
    default:
      return "#6b665f";
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "On Track":
    case "Healthy":
    case "Active":
    case "Completed":
    case "Achieved":
    case "Done":
      return "#22c55e";
    case "At Risk":
    case "Warning":
    case "Amber":
    case "Behind":
      return "#b8943f";
    case "Blocked":
    case "Critical":
    case "Declined":
    case "Overdue":
    case "Churned":
      return "#ef4444";
    case "In Progress":
    case "Mitigating":
      return "#3d7a50";
    default:
      return "#6b665f";
  }
}

export function getHealthLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "At Risk";
  return "Critical";
}

export function getIndustryIcon(industry: string): string {
  const icons: Record<string, string> = {
    Technology: "🏢",
    "Enterprise Software": "🏢",
    "Cloud Services": "☁️",
    "Financial Services": "💰",
    FinTech: "💰",
    "Data Security": "🔒",
    Healthcare: "🏥",
    HealthTech: "🏥",
    Logistics: "🚚",
    "Supply Chain": "🚚",
    Retail: "🛍️",
    "E-Commerce": "🛍️",
    Energy: "🌱",
    "Renewable Energy": "🌱",
    EdTech: "📚",
    Education: "📚",
  };
  return icons[industry] || "🏢";
}

export function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "Very Positive":
    case "Positive":
      return "var(--iw-success)";
    case "Neutral":
      return "var(--iw-forest-bright)";
    case "Negative":
    case "Concerning":
      return "var(--iw-danger)";
    default:
      return "var(--muted-foreground)";
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "Critical":
    case "P1":
      return "var(--iw-danger)";
    case "High":
    case "P2":
      return "#b8943f";
    case "Medium":
    case "P3":
      return "var(--iw-warning)";
    case "Low":
    case "P4":
      return "var(--iw-forest-bright)";
    default:
      return "var(--muted-foreground)";
  }
}
