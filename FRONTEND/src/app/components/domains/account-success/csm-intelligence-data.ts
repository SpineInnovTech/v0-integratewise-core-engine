/**
 * CSM Intelligence Data Model — All 16 SSOT entity tables.
 * Maps exactly to the Accounts Intelligence schema:
 *   Account_Master, People_Team, Business_Context, Strategic_Objectives,
 *   MuleSoft_Capabilities, Value_Streams, API_Portfolio, Platform_Health_Metrics,
 *   Initiatives, Technical_Debt_&_Risk_Register, Stakeholder_Outcomes,
 *   Engagement_Log, Success_Plan_Tracker, Task_Manager, Generated_Insights
 *
 * In production, ALL data comes from Spine SSOT projections with source lineage.
 */

// ─── 1. Account Master ──────────────────────────────────────────────────────

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

// ─── 2. People / Team ──────────────────────────────────────────────────────

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

// ─── 3. Business Context ────────────────────────────────────────────────────

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

// ─── 4. Strategic Objectives ────────────────────────────────────────────────

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

// ─── 5. MuleSoft Capabilities ───────────────────────────────────────────────

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

// ─── 6. Value Streams ───────────────────────────────────────────────────────

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

// ─── 7. API Portfolio ───────────────────────────────────────────────────────

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

// ─── 8. Platform Health Metrics ─────────────────────────────────────────────

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

// ─── 9. Initiatives ─────────────────────────────────────────────────────────

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

// ─── 10. Technical Debt & Risk Register ─────────────────────────────────────

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

// ─── 11. Stakeholder Outcomes ───────────────────────────────────────────────

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

// ─── 12. Engagement Log ─────────────────────────────────────────────────────

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

// ─── 13. Success Plan Tracker ───────────────────────────────────────────────

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

// ─── 14. Task Manager ───────────────────────────────────────────────────────

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

// ─── 15. Generated Insights ────────────────────────────────────────────────

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

// ════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════════════════════════════════════════

export const accountMasterData: AccountMaster[] = [
  {
    accountId: "ACC-001", accountName: "TechServe India Pvt Ltd",
    csmNarrative: "Strategic enterprise account driving API-first transformation across 4 business units. Strong executive alignment with CTO as champion. MuleSoft platform is central to their digital integration strategy with 23 APIs in production.",
    industryVertical: "Technology", industrySubSector: "Enterprise Software",
    contractType: "Enterprise", contractStartDate: "2024-01-15", contractEndDate: "2027-01-14", renewalDate: "2026-12-15", daysToRenewal: 308,
    renewalRiskLevel: "Low", arr: 420000, acv: 450000,
    customerSuccessManager: "Priya Sharma", accountExecutive: "Michael Torres", solutionsArchitect: "Ravi Patel",
    executiveSponsorCustomer: "Ravi Sharma (CTO)", executiveSponsorMuleSoft: "Sarah Chen (VP CS)",
    healthScore: 92, healthScoreTrend3M: "Improving", healthScoreChange: 5,
    spRating: "A+", customerAnnualRevenue: 850000000, employeeCount: 4500,
    geography: "APAC - South Asia", country: "India",
    primaryContactName: "Ravi Sharma", primaryContactEmail: "ravi@techserve.in", primaryContactRole: "CTO",
    accountStatus: "Active", lastEngagementDate: "2026-02-08", nextEngagementDue: "2026-02-15", engagementCadence: "Weekly",
    createdDate: "2024-01-15", lastModified: "2026-02-10", modifiedBy: "Priya Sharma", dataSource: "Salesforce → Spine SSOT",
  },
  {
    accountId: "ACC-002", accountName: "CloudBridge APAC",
    csmNarrative: "Mid-cycle enterprise with cloud migration driving MuleSoft adoption. Usage has plateaued — engagement declining 15% WoW. Need to re-engage Head of Engineering and schedule architecture review.",
    industryVertical: "Technology", industrySubSector: "Cloud Services",
    contractType: "Enterprise", contractStartDate: "2024-06-01", contractEndDate: "2026-05-31", renewalDate: "2026-04-22", daysToRenewal: 72,
    renewalRiskLevel: "Medium", arr: 280000, acv: 295000,
    customerSuccessManager: "Arun Kumar", accountExecutive: "James Wilson", solutionsArchitect: "David Chen",
    executiveSponsorCustomer: "Sarah Lim (CEO)", executiveSponsorMuleSoft: "Mark Davis (RVP)",
    healthScore: 78, healthScoreTrend3M: "Declining", healthScoreChange: -8,
    spRating: "A", customerAnnualRevenue: 320000000, employeeCount: 1800,
    geography: "APAC - Southeast Asia", country: "Singapore",
    primaryContactName: "David Chen", primaryContactEmail: "dchen@cloudbridge.sg", primaryContactRole: "Head of Engineering",
    accountStatus: "Active", lastEngagementDate: "2026-02-09", nextEngagementDue: "2026-02-16", engagementCadence: "Weekly",
    createdDate: "2024-06-01", lastModified: "2026-02-09", modifiedBy: "Arun Kumar", dataSource: "HubSpot → Spine SSOT",
  },
  {
    accountId: "ACC-003", accountName: "FinanceFlow Solutions",
    csmNarrative: "HIGH RISK — Renewal in 29 days with declining health. Payment gateway project blocked, 5 open tickets, CFO unresponsive for 21 days. ARR declining -2.1%. Immediate rescue plan needed.",
    industryVertical: "Financial Services", industrySubSector: "FinTech",
    contractType: "Growth", contractStartDate: "2024-03-10", contractEndDate: "2026-03-09", renewalDate: "2026-03-10", daysToRenewal: 29,
    renewalRiskLevel: "Critical", arr: 180000, acv: 180000,
    customerSuccessManager: "Rajesh Menon", accountExecutive: "Lisa Park", solutionsArchitect: "Amit Joshi",
    executiveSponsorCustomer: "Neha Patel (CFO)", executiveSponsorMuleSoft: "Sarah Chen (VP CS)",
    healthScore: 54, healthScoreTrend3M: "Declining", healthScoreChange: -18,
    spRating: "B", customerAnnualRevenue: 120000000, employeeCount: 650,
    geography: "APAC - South Asia", country: "India",
    primaryContactName: "Arjun Mehta", primaryContactEmail: "arjun@financeflow.io", primaryContactRole: "Product Manager",
    accountStatus: "At Risk", lastEngagementDate: "2026-02-05", nextEngagementDue: "2026-02-11", engagementCadence: "Bi-weekly",
    createdDate: "2024-03-10", lastModified: "2026-02-09", modifiedBy: "Rajesh Menon", dataSource: "Salesforce → Spine SSOT",
  },
  {
    accountId: "ACC-004", accountName: "DataVault Australia",
    csmNarrative: "Strategic account with strong security-first posture. SOC2 audit completing, CISO is an active champion. Platform mature with 18 APIs, exploring expansion into event-driven architecture.",
    industryVertical: "Technology", industrySubSector: "Data Security",
    contractType: "Enterprise", contractStartDate: "2023-09-01", contractEndDate: "2026-08-31", renewalDate: "2026-08-01", daysToRenewal: 172,
    renewalRiskLevel: "Low", arr: 350000, acv: 375000,
    customerSuccessManager: "Anjali Patel", accountExecutive: "Tom Bradley", solutionsArchitect: "James Wu",
    executiveSponsorCustomer: "James Wu (CISO)", executiveSponsorMuleSoft: "Mark Davis (RVP)",
    healthScore: 88, healthScoreTrend3M: "Stable", healthScoreChange: 1,
    spRating: "A", customerAnnualRevenue: 520000000, employeeCount: 2200,
    geography: "APAC - Oceania", country: "Australia",
    primaryContactName: "James Wu", primaryContactEmail: "jwu@datavault.au", primaryContactRole: "CISO",
    accountStatus: "Active", lastEngagementDate: "2026-02-10", nextEngagementDue: "2026-02-17", engagementCadence: "Weekly",
    createdDate: "2023-09-01", lastModified: "2026-02-10", modifiedBy: "Anjali Patel", dataSource: "HubSpot → Spine SSOT",
  },
  {
    accountId: "ACC-005", accountName: "HealthTech Innovations",
    csmNarrative: "Fastest-growing account — 22% ARR growth. CTO is a strong advocate (NPS 10). Onboarding complete, now exploring 3 new module expansions. Perfect candidate for case study.",
    industryVertical: "Healthcare", industrySubSector: "HealthTech",
    contractType: "Growth", contractStartDate: "2025-01-15", contractEndDate: "2027-01-14", renewalDate: "2026-12-15", daysToRenewal: 308,
    renewalRiskLevel: "Low", arr: 210000, acv: 230000,
    customerSuccessManager: "Priya Sharma", accountExecutive: "Michael Torres", solutionsArchitect: "Suresh Rao",
    executiveSponsorCustomer: "Dr. Suresh Rao (CTO)", executiveSponsorMuleSoft: "Sarah Chen (VP CS)",
    healthScore: 95, healthScoreTrend3M: "Improving", healthScoreChange: 7,
    spRating: "A+", customerAnnualRevenue: 180000000, employeeCount: 1100,
    geography: "APAC - South Asia", country: "India",
    primaryContactName: "Dr. Suresh Rao", primaryContactEmail: "suresh@healthtech.in", primaryContactRole: "CTO",
    accountStatus: "Active", lastEngagementDate: "2026-02-10", nextEngagementDue: "2026-02-14", engagementCadence: "Weekly",
    createdDate: "2025-01-15", lastModified: "2026-02-10", modifiedBy: "Priya Sharma", dataSource: "Salesforce → Spine SSOT",
  },
  {
    accountId: "ACC-006", accountName: "LogiPrime Corp",
    csmNarrative: "CRITICAL — Renewal in 19 days. Health score 42, NPS -15, 7 open tickets, CEO unresponsive 8 days. Single integration point with no redundancy. Churn probability 91%. Exec escalation initiated.",
    industryVertical: "Logistics", industrySubSector: "Supply Chain",
    contractType: "Standard", contractStartDate: "2024-02-28", contractEndDate: "2026-02-27", renewalDate: "2026-02-28", daysToRenewal: 19,
    renewalRiskLevel: "Critical", arr: 145000, acv: 145000,
    customerSuccessManager: "Rajesh Menon", accountExecutive: "Lisa Park", solutionsArchitect: "Amit Joshi",
    executiveSponsorCustomer: "Kumar Verma (CEO)", executiveSponsorMuleSoft: "Mark Davis (RVP)",
    healthScore: 42, healthScoreTrend3M: "Declining", healthScoreChange: -23,
    spRating: "C", customerAnnualRevenue: 95000000, employeeCount: 800,
    geography: "APAC - South Asia", country: "India",
    primaryContactName: "Kumar Verma", primaryContactEmail: "kumar@logiprime.in", primaryContactRole: "CEO",
    accountStatus: "At Risk", lastEngagementDate: "2026-02-02", nextEngagementDue: "2026-02-10", engagementCadence: "Weekly",
    createdDate: "2024-02-28", lastModified: "2026-02-09", modifiedBy: "Rajesh Menon", dataSource: "Pipedrive → Spine SSOT",
  },
  {
    accountId: "ACC-007", accountName: "RetailNest Pte Ltd",
    csmNarrative: "SMB account with growth potential. Feature adoption at 25% — needs focused training. Responsive ops team but limited technical depth. Good candidate for guided adoption program.",
    industryVertical: "Retail", industrySubSector: "E-Commerce",
    contractType: "Standard", contractStartDate: "2025-05-18", contractEndDate: "2026-05-17", renewalDate: "2026-05-18", daysToRenewal: 98,
    renewalRiskLevel: "Medium", arr: 95000, acv: 95000,
    customerSuccessManager: "Vikram Rajan", accountExecutive: "Tom Bradley", solutionsArchitect: "David Chen",
    executiveSponsorCustomer: "Priya Nair (Ops Head)", executiveSponsorMuleSoft: "Sarah Chen (VP CS)",
    healthScore: 71, healthScoreTrend3M: "Stable", healthScoreChange: 2,
    spRating: "B+", customerAnnualRevenue: 45000000, employeeCount: 280,
    geography: "APAC - Southeast Asia", country: "Singapore",
    primaryContactName: "Priya Nair", primaryContactEmail: "priya@retailnest.sg", primaryContactRole: "Operations Head",
    accountStatus: "Active", lastEngagementDate: "2026-02-08", nextEngagementDue: "2026-02-22", engagementCadence: "Bi-weekly",
    createdDate: "2025-05-18", lastModified: "2026-02-08", modifiedBy: "Vikram Rajan", dataSource: "Zoho → Spine SSOT",
  },
  {
    accountId: "ACC-008", accountName: "GreenEnergy Solutions",
    csmNarrative: "Enterprise account with sustainability-focused integration needs. Custom analytics dashboard in progress (60%). Strong COO relationship. Exploring event-driven patterns for IoT sensor data.",
    industryVertical: "Energy", industrySubSector: "Renewable Energy",
    contractType: "Enterprise", contractStartDate: "2024-05-30", contractEndDate: "2026-11-29", renewalDate: "2026-10-30", daysToRenewal: 263,
    renewalRiskLevel: "Low", arr: 260000, acv: 275000,
    customerSuccessManager: "Anjali Patel", accountExecutive: "James Wilson", solutionsArchitect: "Mark Thompson",
    executiveSponsorCustomer: "Mark Thompson (COO)", executiveSponsorMuleSoft: "Mark Davis (RVP)",
    healthScore: 81, healthScoreTrend3M: "Improving", healthScoreChange: 4,
    spRating: "A-", customerAnnualRevenue: 680000000, employeeCount: 3200,
    geography: "APAC - Oceania", country: "Australia",
    primaryContactName: "Mark Thompson", primaryContactEmail: "mark@greenenergy.au", primaryContactRole: "COO",
    accountStatus: "Active", lastEngagementDate: "2026-02-07", nextEngagementDue: "2026-02-14", engagementCadence: "Weekly",
    createdDate: "2024-05-30", lastModified: "2026-02-07", modifiedBy: "Anjali Patel", dataSource: "HubSpot → Spine SSOT",
  },
];

// ─── People & Team ──────────────────────────────────────────────────────────

export const peopleTeamData: PeopleTeam[] = [
  { personId: "P-001", fullName: "Priya Sharma", email: "priya.sharma@mulesoft.com", role: "Senior CSM", department: "Customer Success", region: "APAC - India", slackUserId: "@priya.sharma", activeStatus: "Active", accountsAssigned: ["ACC-001", "ACC-005"], accountCount: 2, totalArrManaged: 630000, avgHealthScore: 93.5, atRiskAccountCount: 0 },
  { personId: "P-002", fullName: "Arun Kumar", email: "arun.kumar@mulesoft.com", role: "CSM", department: "Customer Success", region: "APAC - SEA", slackUserId: "@arun.kumar", activeStatus: "Active", accountsAssigned: ["ACC-002"], accountCount: 1, totalArrManaged: 280000, avgHealthScore: 78, atRiskAccountCount: 0 },
  { personId: "P-003", fullName: "Rajesh Menon", email: "rajesh.menon@mulesoft.com", role: "CSM", department: "Customer Success", region: "APAC - India", slackUserId: "@rajesh.menon", activeStatus: "Active", accountsAssigned: ["ACC-003", "ACC-006"], accountCount: 2, totalArrManaged: 325000, avgHealthScore: 48, atRiskAccountCount: 2 },
  { personId: "P-004", fullName: "Anjali Patel", email: "anjali.patel@mulesoft.com", role: "CSM", department: "Customer Success", region: "APAC - ANZ", slackUserId: "@anjali.patel", activeStatus: "Active", accountsAssigned: ["ACC-004", "ACC-008"], accountCount: 2, totalArrManaged: 610000, avgHealthScore: 84.5, atRiskAccountCount: 0 },
  { personId: "P-005", fullName: "Vikram Rajan", email: "vikram.rajan@mulesoft.com", role: "Associate CSM", department: "Customer Success", region: "APAC - SEA", slackUserId: "@vikram.rajan", activeStatus: "Active", accountsAssigned: ["ACC-007"], accountCount: 1, totalArrManaged: 95000, avgHealthScore: 71, atRiskAccountCount: 0 },
  { personId: "P-006", fullName: "Sarah Chen", email: "sarah.chen@mulesoft.com", role: "VP Customer Success", department: "Customer Success", region: "APAC", slackUserId: "@sarah.chen", activeStatus: "Active", accountsAssigned: [], accountCount: 0, totalArrManaged: 0, avgHealthScore: 0, atRiskAccountCount: 0 },
];

// ─── Business Context ───────────────────────────────────────────────────────

export const businessContextData: BusinessContext[] = [
  { contextId: "BC-001", account: "ACC-001", businessModel: "B2B SaaS", marketPosition: "Market Leader", operatingEnvironment: "Hybrid Cloud (AWS + On-Prem)", keyBusinessChallenges: ["Legacy system modernization", "Real-time data integration", "Multi-region compliance"], strategicPrioritiesCustomer: ["API-first architecture", "Customer experience digitization", "Operational efficiency"], digitalMaturity: "Advancing", itComplexityScore: 78, legacySystemCount: 12, cloudStrategy: "Cloud-First with Hybrid", dataClassification: "Regulated (PII + Financial)", lastUpdated: "2026-02-01", updatedBy: "Priya Sharma" },
  { contextId: "BC-002", account: "ACC-002", businessModel: "B2B IaaS/PaaS", marketPosition: "Fast Follower", operatingEnvironment: "Multi-Cloud (AWS + GCP)", keyBusinessChallenges: ["Cloud migration complexity", "Service mesh sprawl", "Developer velocity"], strategicPrioritiesCustomer: ["Cloud-native migration", "Developer platform", "Cost optimization"], digitalMaturity: "Leading", itComplexityScore: 82, legacySystemCount: 5, cloudStrategy: "Cloud-Native", dataClassification: "Standard", lastUpdated: "2026-01-28", updatedBy: "Arun Kumar" },
  { contextId: "BC-003", account: "ACC-003", businessModel: "B2B/B2C FinTech", marketPosition: "Challenger", operatingEnvironment: "Cloud (AWS)", keyBusinessChallenges: ["Regulatory compliance (RBI)", "Payment gateway reliability", "Scale for UPI volumes"], strategicPrioritiesCustomer: ["Payment reliability", "Regulatory compliance automation", "Real-time fraud detection"], digitalMaturity: "Developing", itComplexityScore: 65, legacySystemCount: 8, cloudStrategy: "Cloud-First", dataClassification: "Highly Regulated (PCI-DSS + RBI)", lastUpdated: "2026-01-15", updatedBy: "Rajesh Menon" },
  { contextId: "BC-004", account: "ACC-004", businessModel: "B2B SaaS", marketPosition: "Niche Leader", operatingEnvironment: "Private Cloud (Azure)", keyBusinessChallenges: ["SOC2/ISO compliance", "Data sovereignty", "Zero-trust architecture"], strategicPrioritiesCustomer: ["Security-first integration", "Compliance automation", "Event-driven architecture"], digitalMaturity: "Advancing", itComplexityScore: 72, legacySystemCount: 6, cloudStrategy: "Private Cloud with Edge", dataClassification: "Highly Classified", lastUpdated: "2026-02-05", updatedBy: "Anjali Patel" },
  { contextId: "BC-005", account: "ACC-005", businessModel: "B2B HealthTech", marketPosition: "Disruptor", operatingEnvironment: "Cloud (GCP)", keyBusinessChallenges: ["HIPAA compliance", "EHR interoperability", "IoT device integration"], strategicPrioritiesCustomer: ["Patient data interoperability", "HL7/FHIR API strategy", "Telehealth platform"], digitalMaturity: "Developing", itComplexityScore: 58, legacySystemCount: 4, cloudStrategy: "Cloud-First", dataClassification: "Regulated (HIPAA + PHI)", lastUpdated: "2026-02-08", updatedBy: "Priya Sharma" },
];

// ─── Strategic Objectives ────────────────────────────────────────────────────

export const strategicObjectivesData: StrategicObjective[] = [
  { objectiveId: "SO-001", account: "ACC-001", strategicPillar: "Digital Transformation", objectiveName: "API-First Architecture Adoption", description: "Migrate all point-to-point integrations to API-led connectivity pattern across 4 BUs", businessDriver: "Operational Efficiency", quantifiedGoal: "100% API coverage by Q4 2026", targetDate: "2026-12-31", businessOwner: "Ravi Sharma (CTO)", businessValueUsd: 1200000, muleSoftRelevance: "High", status: "In Progress", progressPercent: 65, healthIndicator: "Green", lastReviewDate: "2026-02-01", notes: "23 of 35 APIs deployed. On track for Q3 milestone.", linkedCapabilities: ["CAP-001", "CAP-002"], linkedValueStreams: ["VS-001", "VS-002"], linkedInitiatives: ["INI-001"], linkedMetrics: ["M-001", "M-002", "M-003"] },
  { objectiveId: "SO-002", account: "ACC-001", strategicPillar: "Customer Experience", objectiveName: "Real-Time Customer 360", description: "Build unified customer view aggregating data from 7 systems via experience APIs", businessDriver: "Customer Retention", quantifiedGoal: "Single view for 100% of customer touchpoints", targetDate: "2026-09-30", businessOwner: "Meera Krishnan (VP Eng)", businessValueUsd: 800000, muleSoftRelevance: "High", status: "In Progress", progressPercent: 42, healthIndicator: "Amber", lastReviewDate: "2026-02-01", notes: "Data quality issues in legacy CRM slowing progress.", linkedCapabilities: ["CAP-003"], linkedValueStreams: ["VS-003"], linkedInitiatives: ["INI-002"], linkedMetrics: ["M-001"] },
  { objectiveId: "SO-003", account: "ACC-003", strategicPillar: "Regulatory Compliance", objectiveName: "RBI Payment Compliance Automation", description: "Automate compliance reporting and real-time transaction monitoring per RBI guidelines", businessDriver: "Risk Mitigation", quantifiedGoal: "Zero compliance violations, 100% automated reporting", targetDate: "2026-06-30", businessOwner: "Neha Patel (CFO)", businessValueUsd: 500000, muleSoftRelevance: "High", status: "At Risk", progressPercent: 20, healthIndicator: "Red", lastReviewDate: "2026-01-28", notes: "Blocked by payment gateway integration failure. CFO disengaged.", linkedCapabilities: ["CAP-004"], linkedValueStreams: ["VS-004"], linkedInitiatives: ["INI-003"], linkedMetrics: ["M-004"] },
  { objectiveId: "SO-004", account: "ACC-004", strategicPillar: "Security & Compliance", objectiveName: "Zero-Trust API Security", description: "Implement zero-trust security model across all API endpoints with mTLS and OAuth 2.0", businessDriver: "Security Posture", quantifiedGoal: "100% API endpoints secured, SOC2 certified", targetDate: "2026-08-31", businessOwner: "James Wu (CISO)", businessValueUsd: 650000, muleSoftRelevance: "High", status: "On Track", progressPercent: 78, healthIndicator: "Green", lastReviewDate: "2026-02-05", notes: "SOC2 audit 90% complete. mTLS rollout in final phase.", linkedCapabilities: ["CAP-005"], linkedValueStreams: ["VS-005"], linkedInitiatives: ["INI-004"], linkedMetrics: ["M-005"] },
  { objectiveId: "SO-005", account: "ACC-005", strategicPillar: "Innovation", objectiveName: "FHIR API Interoperability", description: "Build HL7 FHIR-compliant APIs for EHR data exchange across hospital networks", businessDriver: "Market Expansion", quantifiedGoal: "Connect 50+ hospital systems via FHIR APIs", targetDate: "2026-12-31", businessOwner: "Dr. Suresh Rao (CTO)", businessValueUsd: 950000, muleSoftRelevance: "High", status: "In Progress", progressPercent: 35, healthIndicator: "Green", lastReviewDate: "2026-02-08", notes: "12 hospital connections live. FHIR R4 adapter performing well.", linkedCapabilities: ["CAP-006"], linkedValueStreams: ["VS-006"], linkedInitiatives: ["INI-005"], linkedMetrics: ["M-006"] },
];

// ─── MuleSoft Capabilities ──────────────────────────────────────────────────

export const capabilitiesData: MuleSoftCapability[] = [
  { capabilityId: "CAP-001", account: "ACC-001", capabilityDomain: "Integration", capabilityName: "API-Led Connectivity", description: "Three-tier API architecture (System, Process, Experience)", currentMaturity: "Advanced", currentMaturityNum: 4, targetMaturity: "Optimized", targetMaturityNum: 5, maturityGap: 1, gapStatus: "Minor", linkedStrategicObjectives: ["SO-001"], supportingValueStreams: ["VS-001"], investmentRequiredUsd: 120000, priority: "P1", implementationStatus: "In Progress", businessImpactStatement: "Reduces integration time by 60% for new projects", technicalOwnerCustomer: "Ravi Sharma", lastAssessmentDate: "2026-01-15", linkedMetrics: ["M-001", "M-002"] },
  { capabilityId: "CAP-002", account: "ACC-001", capabilityDomain: "API Management", capabilityName: "API Governance & Lifecycle", description: "Centralized API design, publish, version, deprecate lifecycle", currentMaturity: "Defined", currentMaturityNum: 3, targetMaturity: "Advanced", targetMaturityNum: 4, maturityGap: 1, gapStatus: "Moderate", linkedStrategicObjectives: ["SO-001"], supportingValueStreams: ["VS-001", "VS-002"], investmentRequiredUsd: 85000, priority: "P2", implementationStatus: "Planning", businessImpactStatement: "Eliminates API sprawl and reduces governance overhead by 40%", technicalOwnerCustomer: "Meera Krishnan", lastAssessmentDate: "2026-01-15", linkedMetrics: ["M-003"] },
  { capabilityId: "CAP-003", account: "ACC-001", capabilityDomain: "Data", capabilityName: "Unified Data Access", description: "Single data access layer aggregating 7 backend systems", currentMaturity: "Initial", currentMaturityNum: 2, targetMaturity: "Advanced", targetMaturityNum: 4, maturityGap: 2, gapStatus: "Significant", linkedStrategicObjectives: ["SO-002"], supportingValueStreams: ["VS-003"], investmentRequiredUsd: 200000, priority: "P1", implementationStatus: "In Progress", businessImpactStatement: "Enables real-time customer 360 reducing support resolution by 35%", technicalOwnerCustomer: "Ravi Sharma", lastAssessmentDate: "2026-01-20", linkedMetrics: ["M-001"] },
  { capabilityId: "CAP-004", account: "ACC-003", capabilityDomain: "Compliance", capabilityName: "Regulatory Automation", description: "Automated compliance checks and reporting for RBI/PCI-DSS", currentMaturity: "Ad Hoc", currentMaturityNum: 1, targetMaturity: "Defined", targetMaturityNum: 3, maturityGap: 2, gapStatus: "Critical", linkedStrategicObjectives: ["SO-003"], supportingValueStreams: ["VS-004"], investmentRequiredUsd: 150000, priority: "P1", implementationStatus: "Not Started", businessImpactStatement: "Eliminates manual compliance work (200hrs/quarter) and violation risk", technicalOwnerCustomer: "Arjun Mehta", lastAssessmentDate: "2026-01-10", linkedMetrics: ["M-004"] },
  { capabilityId: "CAP-005", account: "ACC-004", capabilityDomain: "Security", capabilityName: "Zero-Trust API Security", description: "mTLS, OAuth 2.0, API threat protection across all endpoints", currentMaturity: "Advanced", currentMaturityNum: 4, targetMaturity: "Optimized", targetMaturityNum: 5, maturityGap: 1, gapStatus: "Minor", linkedStrategicObjectives: ["SO-004"], supportingValueStreams: ["VS-005"], investmentRequiredUsd: 95000, priority: "P1", implementationStatus: "In Progress", businessImpactStatement: "Achieves SOC2 certification and zero-trust posture", technicalOwnerCustomer: "James Wu", lastAssessmentDate: "2026-02-01", linkedMetrics: ["M-005"] },
  { capabilityId: "CAP-006", account: "ACC-005", capabilityDomain: "Healthcare", capabilityName: "FHIR Interoperability", description: "HL7 FHIR R4 compliant API adapter for EHR data exchange", currentMaturity: "Defined", currentMaturityNum: 3, targetMaturity: "Advanced", targetMaturityNum: 4, maturityGap: 1, gapStatus: "Moderate", linkedStrategicObjectives: ["SO-005"], supportingValueStreams: ["VS-006"], investmentRequiredUsd: 175000, priority: "P1", implementationStatus: "In Progress", businessImpactStatement: "Enables 50+ hospital connections generating $950K annual value", technicalOwnerCustomer: "Dr. Suresh Rao", lastAssessmentDate: "2026-02-05", linkedMetrics: ["M-006"] },
];

// ─── Value Streams ──────────────────────────────────────────────────────────

export const valueStreamsData: ValueStream[] = [
  { streamId: "VS-001", account: "ACC-001", valueStreamName: "Order-to-Cash", businessProcess: "Order processing, invoicing, payment collection", processOwner: "Ravi Sharma", linkedStrategicObjectives: ["SO-001"], enabledMuleSoftCapabilities: ["CAP-001", "CAP-002"], integrationEndpoints: 8, apisConsumed: 12, annualTransactionVolume: 2400000, cycleTimeBaselineHours: 72, cycleTimeCurrentHours: 48, cycleTimeTargetHours: 24, cycleTimeReductionPercent: 33, totalBusinessValueUsd: 450000, customerSatisfactionImpact: "High", operationalRiskLevel: "Low", linkedMetrics: ["M-001", "M-002"] },
  { streamId: "VS-002", account: "ACC-001", valueStreamName: "Lead-to-Opportunity", businessProcess: "Lead capture, qualification, opportunity creation", processOwner: "Meera Krishnan", linkedStrategicObjectives: ["SO-001", "SO-002"], enabledMuleSoftCapabilities: ["CAP-001"], integrationEndpoints: 5, apisConsumed: 7, annualTransactionVolume: 180000, cycleTimeBaselineHours: 120, cycleTimeCurrentHours: 72, cycleTimeTargetHours: 48, cycleTimeReductionPercent: 40, totalBusinessValueUsd: 320000, customerSatisfactionImpact: "Medium", operationalRiskLevel: "Low", linkedMetrics: ["M-003"] },
  { streamId: "VS-003", account: "ACC-001", valueStreamName: "Customer 360 Data Sync", businessProcess: "Real-time customer data aggregation from 7 systems", processOwner: "Ravi Sharma", linkedStrategicObjectives: ["SO-002"], enabledMuleSoftCapabilities: ["CAP-003"], integrationEndpoints: 7, apisConsumed: 14, annualTransactionVolume: 8500000, cycleTimeBaselineHours: 24, cycleTimeCurrentHours: 4, cycleTimeTargetHours: 0.5, cycleTimeReductionPercent: 83, totalBusinessValueUsd: 280000, customerSatisfactionImpact: "High", operationalRiskLevel: "Medium", linkedMetrics: ["M-001"] },
  { streamId: "VS-004", account: "ACC-003", valueStreamName: "Payment Processing", businessProcess: "Transaction processing, compliance validation, settlement", processOwner: "Arjun Mehta", linkedStrategicObjectives: ["SO-003"], enabledMuleSoftCapabilities: ["CAP-004"], integrationEndpoints: 4, apisConsumed: 6, annualTransactionVolume: 12000000, cycleTimeBaselineHours: 0.5, cycleTimeCurrentHours: 0.5, cycleTimeTargetHours: 0.1, cycleTimeReductionPercent: 0, totalBusinessValueUsd: 180000, customerSatisfactionImpact: "High", operationalRiskLevel: "Critical", linkedMetrics: ["M-004"] },
  { streamId: "VS-005", account: "ACC-004", valueStreamName: "Security Event Processing", businessProcess: "Real-time threat detection, analysis, and response", processOwner: "James Wu", linkedStrategicObjectives: ["SO-004"], enabledMuleSoftCapabilities: ["CAP-005"], integrationEndpoints: 12, apisConsumed: 18, annualTransactionVolume: 45000000, cycleTimeBaselineHours: 1, cycleTimeCurrentHours: 0.08, cycleTimeTargetHours: 0.05, cycleTimeReductionPercent: 92, totalBusinessValueUsd: 520000, customerSatisfactionImpact: "High", operationalRiskLevel: "Low", linkedMetrics: ["M-005"] },
  { streamId: "VS-006", account: "ACC-005", valueStreamName: "EHR Data Exchange", businessProcess: "Patient record exchange between hospital systems via FHIR", processOwner: "Dr. Suresh Rao", linkedStrategicObjectives: ["SO-005"], enabledMuleSoftCapabilities: ["CAP-006"], integrationEndpoints: 12, apisConsumed: 8, annualTransactionVolume: 3200000, cycleTimeBaselineHours: 48, cycleTimeCurrentHours: 2, cycleTimeTargetHours: 0.5, cycleTimeReductionPercent: 96, totalBusinessValueUsd: 380000, customerSatisfactionImpact: "High", operationalRiskLevel: "Medium", linkedMetrics: ["M-006"] },
];

// ─── API Portfolio ──────────────────────────────────────────────────────────

export const apiPortfolioData: APIPortfolio[] = [
  { apiId: "API-001", account: "ACC-001", apiName: "customer-system-api", apiType: "System", apiVersion: "v2.3", businessCapability: "Customer Data", linkedValueStreams: ["VS-001", "VS-003"], linkedStrategicObjectives: ["SO-001", "SO-002"], environment: "Production", monthlyTransactions: 1250000, avgResponseTimeMs: 45, slaTargetMs: 100, slaCompliancePercent: 99.8, errorRatePercent: 0.02, uptimePercent: 99.99, consumingApplications: ["CRM Portal", "Mobile App", "Analytics"], businessCriticality: "Critical", healthStatus: "Healthy", ownerTeam: "Platform Engineering", lastSyncFromAnypoint: "2026-02-10T08:00:00", linkedMetrics: ["M-001", "M-002"] },
  { apiId: "API-002", account: "ACC-001", apiName: "order-process-api", apiType: "Process", apiVersion: "v1.8", businessCapability: "Order Management", linkedValueStreams: ["VS-001"], linkedStrategicObjectives: ["SO-001"], environment: "Production", monthlyTransactions: 200000, avgResponseTimeMs: 120, slaTargetMs: 200, slaCompliancePercent: 98.5, errorRatePercent: 0.15, uptimePercent: 99.95, consumingApplications: ["E-Commerce", "ERP"], businessCriticality: "Critical", healthStatus: "Healthy", ownerTeam: "Integration Team", lastSyncFromAnypoint: "2026-02-10T08:00:00", linkedMetrics: ["M-001"] },
  { apiId: "API-003", account: "ACC-001", apiName: "customer-360-exp-api", apiType: "Experience", apiVersion: "v1.2", businessCapability: "Customer Experience", linkedValueStreams: ["VS-003"], linkedStrategicObjectives: ["SO-002"], environment: "Production", monthlyTransactions: 850000, avgResponseTimeMs: 180, slaTargetMs: 250, slaCompliancePercent: 97.2, errorRatePercent: 0.35, uptimePercent: 99.9, consumingApplications: ["Support Portal", "Mobile App"], businessCriticality: "High", healthStatus: "Warning", ownerTeam: "CX Team", lastSyncFromAnypoint: "2026-02-10T08:00:00", linkedMetrics: ["M-001"] },
  { apiId: "API-004", account: "ACC-003", apiName: "payment-gateway-api", apiType: "System", apiVersion: "v3.1", businessCapability: "Payment Processing", linkedValueStreams: ["VS-004"], linkedStrategicObjectives: ["SO-003"], environment: "Production", monthlyTransactions: 1000000, avgResponseTimeMs: 85, slaTargetMs: 100, slaCompliancePercent: 94.1, errorRatePercent: 1.2, uptimePercent: 98.5, consumingApplications: ["Merchant Portal", "Mobile SDK"], businessCriticality: "Critical", healthStatus: "Critical", ownerTeam: "Payments Team", lastSyncFromAnypoint: "2026-02-10T06:00:00", linkedMetrics: ["M-004"] },
  { apiId: "API-005", account: "ACC-004", apiName: "security-event-api", apiType: "System", apiVersion: "v2.0", businessCapability: "Security", linkedValueStreams: ["VS-005"], linkedStrategicObjectives: ["SO-004"], environment: "Production", monthlyTransactions: 3750000, avgResponseTimeMs: 12, slaTargetMs: 50, slaCompliancePercent: 99.9, errorRatePercent: 0.01, uptimePercent: 99.999, consumingApplications: ["SIEM", "SOC Dashboard", "Threat Intel"], businessCriticality: "Critical", healthStatus: "Healthy", ownerTeam: "Security Ops", lastSyncFromAnypoint: "2026-02-10T08:00:00", linkedMetrics: ["M-005"] },
  { apiId: "API-006", account: "ACC-005", apiName: "fhir-patient-api", apiType: "Experience", apiVersion: "v1.0", businessCapability: "Healthcare Interop", linkedValueStreams: ["VS-006"], linkedStrategicObjectives: ["SO-005"], environment: "Production", monthlyTransactions: 267000, avgResponseTimeMs: 95, slaTargetMs: 200, slaCompliancePercent: 99.5, errorRatePercent: 0.08, uptimePercent: 99.95, consumingApplications: ["Hospital Portal", "Telehealth App", "Lab Systems"], businessCriticality: "Critical", healthStatus: "Healthy", ownerTeam: "Health Integration", lastSyncFromAnypoint: "2026-02-10T07:00:00", linkedMetrics: ["M-006"] },
  { apiId: "API-007", account: "ACC-001", apiName: "erp-system-api", apiType: "System", apiVersion: "v2.1", businessCapability: "ERP Integration", linkedValueStreams: ["VS-001", "VS-002"], linkedStrategicObjectives: ["SO-001"], environment: "Production", monthlyTransactions: 450000, avgResponseTimeMs: 200, slaTargetMs: 300, slaCompliancePercent: 96.8, errorRatePercent: 0.45, uptimePercent: 99.8, consumingApplications: ["Finance Portal", "HR System"], businessCriticality: "High", healthStatus: "Warning", ownerTeam: "Platform Engineering", lastSyncFromAnypoint: "2026-02-10T08:00:00", linkedMetrics: ["M-001", "M-002"] },
];

// ─── Platform Health Metrics ─────────────────────────────────────────────────

export const platformHealthData: PlatformHealthMetric[] = [
  { metricId: "M-001", account: "ACC-001", metricCategory: "Performance", metricName: "API Response Time (P95)", metricType: "SLA", currentValue: 145, targetValue: 200, thresholdWarning: 180, thresholdCritical: 250, unit: "ms", measurementFrequency: "Real-time", healthStatus: "Healthy", healthStatusNumerical: 3, trendIsGood: true, lastMeasured: "2026-02-10T09:00:00", linkedCapability: "CAP-001", linkedStrategicObjectives: ["SO-001", "SO-002"], linkedValueStream: "VS-001", dataSource: "Anypoint Monitoring", businessImpactStatement: "Sub-200ms response ensures seamless user experience" },
  { metricId: "M-002", account: "ACC-001", metricCategory: "Reliability", metricName: "Platform Uptime", metricType: "SLA", currentValue: 99.97, targetValue: 99.95, thresholdWarning: 99.9, thresholdCritical: 99.5, unit: "%", measurementFrequency: "Daily", healthStatus: "Healthy", healthStatusNumerical: 3, trendIsGood: true, lastMeasured: "2026-02-10T00:00:00", linkedCapability: "CAP-001", linkedStrategicObjectives: ["SO-001"], linkedValueStream: "VS-001", dataSource: "Anypoint Monitoring", businessImpactStatement: "Exceeding SLA target by 0.02%" },
  { metricId: "M-003", account: "ACC-001", metricCategory: "Adoption", metricName: "Active API Consumers", metricType: "KPI", currentValue: 23, targetValue: 35, thresholdWarning: 20, thresholdCritical: 15, unit: "apps", measurementFrequency: "Weekly", healthStatus: "Healthy", healthStatusNumerical: 3, trendIsGood: true, lastMeasured: "2026-02-09", linkedCapability: "CAP-002", linkedStrategicObjectives: ["SO-001"], linkedValueStream: "VS-002", dataSource: "Anypoint Exchange", businessImpactStatement: "23 internal apps consuming APIs, growing 15% QoQ" },
  { metricId: "M-004", account: "ACC-003", metricCategory: "Reliability", metricName: "Payment API Error Rate", metricType: "SLA", currentValue: 1.2, targetValue: 0.1, thresholdWarning: 0.5, thresholdCritical: 1.0, unit: "%", measurementFrequency: "Real-time", healthStatus: "Critical", healthStatusNumerical: 1, trendIsGood: false, lastMeasured: "2026-02-10T09:00:00", linkedCapability: "CAP-004", linkedStrategicObjectives: ["SO-003"], linkedValueStream: "VS-004", dataSource: "Anypoint Monitoring", businessImpactStatement: "Error rate 12x above target — impacting ~12,000 transactions/month" },
  { metricId: "M-005", account: "ACC-004", metricCategory: "Security", metricName: "API Threat Blocks", metricType: "Operational", currentValue: 4521, targetValue: 0, thresholdWarning: 1000, thresholdCritical: 5000, unit: "events/day", measurementFrequency: "Real-time", healthStatus: "Warning", healthStatusNumerical: 2, trendIsGood: false, lastMeasured: "2026-02-10T09:00:00", linkedCapability: "CAP-005", linkedStrategicObjectives: ["SO-004"], linkedValueStream: "VS-005", dataSource: "API Gateway", businessImpactStatement: "Elevated threat activity — 4.5K blocks/day, monitoring pattern" },
  { metricId: "M-006", account: "ACC-005", metricCategory: "Adoption", metricName: "Hospital Connections Live", metricType: "KPI", currentValue: 12, targetValue: 50, thresholdWarning: 8, thresholdCritical: 5, unit: "hospitals", measurementFrequency: "Monthly", healthStatus: "Healthy", healthStatusNumerical: 3, trendIsGood: true, lastMeasured: "2026-02-01", linkedCapability: "CAP-006", linkedStrategicObjectives: ["SO-005"], linkedValueStream: "VS-006", dataSource: "FHIR Registry", businessImpactStatement: "12 hospitals connected, 3 more in pipeline for Q1" },
];

// ─── Initiatives ─────────────────────────────────────────────────────────────

export const initiativesData: Initiative[] = [
  { initiativeId: "INI-001", account: "ACC-001", initiativeName: "API Catalog Modernization", initiativeType: "Platform Enhancement", linkedStrategicObjectives: ["SO-001"], linkedCapabilities: ["CAP-001", "CAP-002"], businessDriver: "Developer Productivity", proposedBy: "Ravi Sharma", priority: "P1", phase: "Execution", status: "On Track", startDate: "2025-10-01", targetCompletionDate: "2026-04-30", actualCompletionDate: null, daysOverdue: 0, investmentAmountUsd: 180000, muleSoftServicesUsd: 75000, expectedAnnualBenefitUsd: 320000, expectedPaybackMonths: 7, realizedAnnualBenefitUsd: 140000, successCriteria: "All APIs discoverable in Exchange with auto-generated docs", ownerMuleSoft: "Priya Sharma", ownerCustomer: "Ravi Sharma", blockers: "", linkedMetrics: ["M-001", "M-002", "M-003"] },
  { initiativeId: "INI-002", account: "ACC-001", initiativeName: "Customer 360 Data Hub", initiativeType: "New Capability", linkedStrategicObjectives: ["SO-002"], linkedCapabilities: ["CAP-003"], businessDriver: "Customer Experience", proposedBy: "Meera Krishnan", priority: "P1", phase: "Execution", status: "At Risk", startDate: "2025-11-15", targetCompletionDate: "2026-06-30", actualCompletionDate: null, daysOverdue: 0, investmentAmountUsd: 250000, muleSoftServicesUsd: 120000, expectedAnnualBenefitUsd: 480000, expectedPaybackMonths: 6, realizedAnnualBenefitUsd: 0, successCriteria: "Unified customer view with <500ms data freshness", ownerMuleSoft: "Priya Sharma", ownerCustomer: "Meera Krishnan", blockers: "Legacy CRM data quality — deduplication needed", linkedMetrics: ["M-001"] },
  { initiativeId: "INI-003", account: "ACC-003", initiativeName: "Payment Gateway v3 Migration", initiativeType: "Technical Debt Remediation", linkedStrategicObjectives: ["SO-003"], linkedCapabilities: ["CAP-004"], businessDriver: "Compliance & Reliability", proposedBy: "Arjun Mehta", priority: "P1", phase: "Execution", status: "Blocked", startDate: "2026-01-15", targetCompletionDate: "2026-03-01", actualCompletionDate: null, daysOverdue: 0, investmentAmountUsd: 120000, muleSoftServicesUsd: 60000, expectedAnnualBenefitUsd: 200000, expectedPaybackMonths: 7, realizedAnnualBenefitUsd: 0, successCriteria: "Error rate <0.1%, PCI-DSS compliant, zero downtime migration", ownerMuleSoft: "Rajesh Menon", ownerCustomer: "Arjun Mehta", blockers: "Payment provider API incompatibility — waiting for v3 SDK release", linkedMetrics: ["M-004"] },
  { initiativeId: "INI-004", account: "ACC-004", initiativeName: "mTLS Rollout Phase 2", initiativeType: "Security Enhancement", linkedStrategicObjectives: ["SO-004"], linkedCapabilities: ["CAP-005"], businessDriver: "Zero-Trust Security", proposedBy: "James Wu", priority: "P1", phase: "Execution", status: "On Track", startDate: "2025-12-01", targetCompletionDate: "2026-03-31", actualCompletionDate: null, daysOverdue: 0, investmentAmountUsd: 95000, muleSoftServicesUsd: 45000, expectedAnnualBenefitUsd: 180000, expectedPaybackMonths: 6, realizedAnnualBenefitUsd: 80000, successCriteria: "100% endpoints mTLS-enabled, zero certificate failures", ownerMuleSoft: "Anjali Patel", ownerCustomer: "James Wu", blockers: "", linkedMetrics: ["M-005"] },
  { initiativeId: "INI-005", account: "ACC-005", initiativeName: "FHIR API Expansion Pack", initiativeType: "Product Extension", linkedStrategicObjectives: ["SO-005"], linkedCapabilities: ["CAP-006"], businessDriver: "Market Expansion", proposedBy: "Dr. Suresh Rao", priority: "P1", phase: "Execution", status: "On Track", startDate: "2025-11-01", targetCompletionDate: "2026-06-30", actualCompletionDate: null, daysOverdue: 0, investmentAmountUsd: 200000, muleSoftServicesUsd: 95000, expectedAnnualBenefitUsd: 450000, expectedPaybackMonths: 5, realizedAnnualBenefitUsd: 120000, successCriteria: "30 new hospital connections live with FHIR R4 compliance", ownerMuleSoft: "Priya Sharma", ownerCustomer: "Dr. Suresh Rao", blockers: "", linkedMetrics: ["M-006"] },
];

// ─── Technical Debt & Risk Register ──────────────────────────────────────────

export const riskRegisterData: TechnicalRisk[] = [
  { riskId: "RSK-001", account: "ACC-003", riskCategory: "Integration Failure", riskTitle: "Payment Gateway API Instability", description: "Payment API error rate at 1.2% (target <0.1%). Blocking compliance automation and causing transaction failures.", affectedCapability: "CAP-004", affectedApis: ["API-004"], linkedStrategicObjectives: ["SO-003"], impact: "Critical", impactScore: 5, probability: "Very Likely", probabilityScore: 5, riskScore: 25, riskLevel: "Critical", mitigationStrategy: "Emergency hotfix + vendor escalation for v3 SDK", mitigationInitiative: "INI-003", mitigationOwner: "Rajesh Menon", targetResolutionDate: "2026-02-28", status: "Mitigating", dateIdentified: "2026-01-20" },
  { riskId: "RSK-002", account: "ACC-006", riskCategory: "Customer Churn", riskTitle: "LogiPrime Contract Non-Renewal", description: "Health score 42, CEO unresponsive 8 days, 7 open tickets, NPS -15. Renewal in 19 days with 91% churn probability.", affectedCapability: "", affectedApis: [], linkedStrategicObjectives: [], impact: "Critical", impactScore: 5, probability: "Very Likely", probabilityScore: 5, riskScore: 25, riskLevel: "Critical", mitigationStrategy: "Executive escalation + immediate value demonstration + ticket resolution sprint", mitigationInitiative: "", mitigationOwner: "Sarah Chen (VP CS)", targetResolutionDate: "2026-02-25", status: "Mitigating", dateIdentified: "2026-02-02" },
  { riskId: "RSK-003", account: "ACC-001", riskCategory: "Data Quality", riskTitle: "Legacy CRM Data Deduplication", description: "Customer 360 initiative blocked by 23% duplicate records in legacy CRM. Impacts unified data access capability.", affectedCapability: "CAP-003", affectedApis: ["API-003"], linkedStrategicObjectives: ["SO-002"], impact: "High", impactScore: 4, probability: "Likely", probabilityScore: 4, riskScore: 16, riskLevel: "High", mitigationStrategy: "Data cleansing sprint + automated dedup rules in DataWeave", mitigationInitiative: "INI-002", mitigationOwner: "Priya Sharma", targetResolutionDate: "2026-03-15", status: "Mitigating", dateIdentified: "2026-01-15" },
  { riskId: "RSK-004", account: "ACC-004", riskCategory: "Security Threat", riskTitle: "Elevated API Threat Activity", description: "4.5K threat blocks/day — elevated above baseline. Pattern suggests coordinated scanning. Monitoring for escalation.", affectedCapability: "CAP-005", affectedApis: ["API-005"], linkedStrategicObjectives: ["SO-004"], impact: "High", impactScore: 4, probability: "Possible", probabilityScore: 3, riskScore: 12, riskLevel: "Medium", mitigationStrategy: "Enhanced WAF rules + IP reputation filtering + threat intel sharing with customer SOC", mitigationInitiative: "INI-004", mitigationOwner: "Anjali Patel", targetResolutionDate: "2026-02-20", status: "Mitigating", dateIdentified: "2026-02-05" },
  { riskId: "RSK-005", account: "ACC-002", riskCategory: "Adoption Risk", riskTitle: "Platform Usage Decline", description: "DAU dropped 15% WoW. 3 open support tickets. Engineering team may be evaluating alternatives.", affectedCapability: "", affectedApis: [], linkedStrategicObjectives: [], impact: "Medium", impactScore: 3, probability: "Possible", probabilityScore: 3, riskScore: 9, riskLevel: "Medium", mitigationStrategy: "Proactive engagement meeting + usage analysis + value reaffirmation", mitigationInitiative: "", mitigationOwner: "Arun Kumar", targetResolutionDate: "2026-02-28", status: "Open", dateIdentified: "2026-02-08" },
];

// ─── Stakeholder Outcomes ────────────────────────────────────────────────────

export const stakeholderOutcomesData: StakeholderOutcome[] = [
  { outcomeId: "OUT-001", account: "ACC-001", stakeholderType: "CTO", stakeholderName: "Ravi Sharma", outcomeStatement: "Reduce integration delivery time from 12 weeks to 3 weeks for new projects", linkedStrategicObjectives: ["SO-001"], linkedValueStreams: ["VS-001", "VS-002"], successMetricName: "Integration Delivery Time", baselineValue: 12, currentValue: 5, targetValue: 3, unit: "weeks", targetAchievementPercent: 78, measurementMethod: "Project tracking system", status: "On Track" },
  { outcomeId: "OUT-002", account: "ACC-001", stakeholderType: "VP Engineering", stakeholderName: "Meera Krishnan", outcomeStatement: "Achieve real-time customer data freshness across all touchpoints", linkedStrategicObjectives: ["SO-002"], linkedValueStreams: ["VS-003"], successMetricName: "Data Freshness", baselineValue: 1440, currentValue: 240, targetValue: 5, unit: "minutes", targetAchievementPercent: 84, measurementMethod: "Data pipeline monitoring", status: "On Track" },
  { outcomeId: "OUT-003", account: "ACC-003", stakeholderType: "CFO", stakeholderName: "Neha Patel", outcomeStatement: "Zero RBI compliance violations and 100% automated reporting", linkedStrategicObjectives: ["SO-003"], linkedValueStreams: ["VS-004"], successMetricName: "Compliance Violations", baselineValue: 3, currentValue: 2, targetValue: 0, unit: "violations/quarter", targetAchievementPercent: 33, measurementMethod: "Compliance dashboard", status: "Behind" },
  { outcomeId: "OUT-004", account: "ACC-004", stakeholderType: "CISO", stakeholderName: "James Wu", outcomeStatement: "Achieve SOC2 Type II certification and zero-trust API security posture", linkedStrategicObjectives: ["SO-004"], linkedValueStreams: ["VS-005"], successMetricName: "Security Posture Score", baselineValue: 62, currentValue: 89, targetValue: 95, unit: "score", targetAchievementPercent: 82, measurementMethod: "Security audit framework", status: "On Track" },
  { outcomeId: "OUT-005", account: "ACC-005", stakeholderType: "CTO", stakeholderName: "Dr. Suresh Rao", outcomeStatement: "Connect 50+ hospitals via FHIR APIs enabling real-time patient data exchange", linkedStrategicObjectives: ["SO-005"], linkedValueStreams: ["VS-006"], successMetricName: "Hospital Connections", baselineValue: 0, currentValue: 12, targetValue: 50, unit: "hospitals", targetAchievementPercent: 24, measurementMethod: "FHIR registry", status: "On Track" },
];

// ─── Engagement Log ──────────────────────────────────────────────────────────

export const engagementLogData: EngagementLog[] = [
  { engagementId: "ENG-001", account: "ACC-001", engagementDate: "2026-02-08", engagementType: "Weekly Check-in", attendeesMuleSoft: ["Priya Sharma"], attendeesCustomer: ["Ravi Sharma", "Meera Krishnan"], customerSeniority: "C-Suite", topicsDiscussed: ["API Catalog progress", "Customer 360 data quality", "Q1 QBR planning"], actionItems: ["Share data dedup proposal", "Finalize QBR deck by Feb 12"], sentiment: "Positive", relationshipDepthScore: 9, nextSteps: "Send QBR agenda and invite exec sponsor", nextEngagementDate: "2026-02-15", linkedStrategicObjectives: ["SO-001", "SO-002"], linkedInitiatives: ["INI-001", "INI-002"] },
  { engagementId: "ENG-002", account: "ACC-002", engagementDate: "2026-02-09", engagementType: "Technical Review", attendeesMuleSoft: ["Arun Kumar", "Ravi Patel"], attendeesCustomer: ["David Chen"], customerSeniority: "Director", topicsDiscussed: ["Usage decline investigation", "Cloud migration blockers", "Performance benchmarking"], actionItems: ["Run usage analytics report", "Schedule architecture review", "Share best practices guide"], sentiment: "Neutral", relationshipDepthScore: 6, nextSteps: "Deliver usage analysis by Feb 14", nextEngagementDate: "2026-02-16", linkedStrategicObjectives: [], linkedInitiatives: [] },
  { engagementId: "ENG-003", account: "ACC-003", engagementDate: "2026-02-05", engagementType: "Escalation Call", attendeesMuleSoft: ["Rajesh Menon", "Sarah Chen"], attendeesCustomer: ["Arjun Mehta"], customerSeniority: "Manager", topicsDiscussed: ["Payment API failures", "Renewal concerns", "CFO engagement"], actionItems: ["Hotfix deployment by Feb 10", "Draft CFO re-engagement plan", "Prepare renewal rescue package"], sentiment: "Negative", relationshipDepthScore: 4, nextSteps: "Deploy hotfix and schedule CFO meeting", nextEngagementDate: "2026-02-12", linkedStrategicObjectives: ["SO-003"], linkedInitiatives: ["INI-003"] },
  { engagementId: "ENG-004", account: "ACC-004", engagementDate: "2026-02-10", engagementType: "SOC2 Review Meeting", attendeesMuleSoft: ["Anjali Patel"], attendeesCustomer: ["James Wu"], customerSeniority: "C-Suite", topicsDiscussed: ["SOC2 audit results", "mTLS rollout status", "Threat activity analysis"], actionItems: ["Send final audit report", "Schedule threat review with SOC team"], sentiment: "Very Positive", relationshipDepthScore: 9, nextSteps: "Share audit report and celebrate milestone", nextEngagementDate: "2026-02-17", linkedStrategicObjectives: ["SO-004"], linkedInitiatives: ["INI-004"] },
  { engagementId: "ENG-005", account: "ACC-005", engagementDate: "2026-02-10", engagementType: "Strategy Session", attendeesMuleSoft: ["Priya Sharma"], attendeesCustomer: ["Dr. Suresh Rao"], customerSeniority: "C-Suite", topicsDiscussed: ["FHIR expansion roadmap", "New module proposals", "Case study opportunity"], actionItems: ["Draft expansion proposal", "Identify case study format", "Connect with product team re: new modules"], sentiment: "Very Positive", relationshipDepthScore: 10, nextSteps: "Send expansion proposal by Feb 14", nextEngagementDate: "2026-02-14", linkedStrategicObjectives: ["SO-005"], linkedInitiatives: ["INI-005"] },
  { engagementId: "ENG-006", account: "ACC-006", engagementDate: "2026-02-02", engagementType: "Rescue Attempt", attendeesMuleSoft: ["Rajesh Menon"], attendeesCustomer: ["Kumar Verma"], customerSeniority: "C-Suite", topicsDiscussed: ["Service gaps", "Ticket backlog", "Renewal discussion"], actionItems: ["Clear ticket backlog within 5 days", "VP escalation meeting", "Prepare remediation plan"], sentiment: "Concerning", relationshipDepthScore: 2, nextSteps: "Escalate to VP CS for executive intervention", nextEngagementDate: "2026-02-11", linkedStrategicObjectives: [], linkedInitiatives: [] },
];

// ─── Success Plan Tracker ────────────────────────────────────────────────────

export const successPlanData: SuccessPlan[] = [
  { successPlanId: "SP-001", account: "ACC-001", executiveSummary: "TechServe is executing a multi-year API-first transformation. 2 strategic objectives on track, 1 at amber due to data quality. Strong exec alignment with CTO and VP Eng as active sponsors. Expansion opportunity identified for Q3.", planPeriod: "FY2026", planStatus: "Active", creationDate: "2025-12-01", lastUpdated: "2026-02-08", strategicObjectivesCount: 2, linkedStrategicObjectives: ["SO-001", "SO-002"], linkedInitiatives: ["INI-001", "INI-002"], keyInitiatives: ["API Catalog Modernization", "Customer 360 Data Hub"], top3Risks: ["Legacy CRM data quality", "Integration team capacity", "Budget approval for Phase 3"], linkedMetrics: ["M-001", "M-002", "M-003"], executiveSponsorCustomer: "Ravi Sharma (CTO)", executiveSponsorMuleSoft: "Sarah Chen (VP CS)", nextQbrDate: "2026-02-12" },
  { successPlanId: "SP-002", account: "ACC-003", executiveSummary: "RESCUE PLAN — FinanceFlow renewal at critical risk. Payment gateway blocked, CFO disengaged. Immediate actions: hotfix deployment, CFO re-engagement, renewal rescue package with 15% discount + dedicated SA.", planPeriod: "Q1 2026", planStatus: "Active", creationDate: "2026-02-05", lastUpdated: "2026-02-09", strategicObjectivesCount: 1, linkedStrategicObjectives: ["SO-003"], linkedInitiatives: ["INI-003"], keyInitiatives: ["Payment Gateway v3 Migration"], top3Risks: ["Payment API instability", "CFO disengagement", "Competitive evaluation"], linkedMetrics: ["M-004"], executiveSponsorCustomer: "Neha Patel (CFO)", executiveSponsorMuleSoft: "Sarah Chen (VP CS)", nextQbrDate: "2026-02-13" },
  { successPlanId: "SP-003", account: "ACC-004", executiveSummary: "DataVault executing on zero-trust security strategy. SOC2 audit 90% complete, mTLS rollout on track. CISO is active champion. Monitoring elevated threat activity but defense posture is strong.", planPeriod: "FY2026", planStatus: "Active", creationDate: "2025-11-15", lastUpdated: "2026-02-10", strategicObjectivesCount: 1, linkedStrategicObjectives: ["SO-004"], linkedInitiatives: ["INI-004"], keyInitiatives: ["mTLS Rollout Phase 2"], top3Risks: ["Elevated threat activity", "Certificate management complexity", "Security team bandwidth"], linkedMetrics: ["M-005"], executiveSponsorCustomer: "James Wu (CISO)", executiveSponsorMuleSoft: "Mark Davis (RVP)", nextQbrDate: "2026-03-01" },
  { successPlanId: "SP-004", account: "ACC-005", executiveSummary: "HealthTech is fastest-growing account. FHIR expansion on track, CTO is advocate. Exploring 3 new modules for expansion. Perfect case study candidate. Focus: scale connections from 12 to 50 hospitals.", planPeriod: "FY2026", planStatus: "Active", creationDate: "2025-12-15", lastUpdated: "2026-02-10", strategicObjectivesCount: 1, linkedStrategicObjectives: ["SO-005"], linkedInitiatives: ["INI-005"], keyInitiatives: ["FHIR API Expansion Pack"], top3Risks: ["Hospital onboarding velocity", "FHIR compliance variations", "Support scaling"], linkedMetrics: ["M-006"], executiveSponsorCustomer: "Dr. Suresh Rao (CTO)", executiveSponsorMuleSoft: "Sarah Chen (VP CS)", nextQbrDate: "2026-03-15" },
];

// ─── Task Manager ────────────────────────────────────────────────────────────

export const taskManagerData: TaskItem[] = [
  { taskId: "T-001", taskName: "Finalize QBR deck for TechServe", account: "ACC-001", owner: "Priya Sharma", dueDate: "2026-02-12", status: "In Progress", priority: "High", linkedRisk: "", linkedInitiative: "INI-001", linkedObjective: "SO-001", linkedMetric: "M-001", source: "Manual", externalTaskId: "" },
  { taskId: "T-002", taskName: "Deploy payment API hotfix for FinanceFlow", account: "ACC-003", owner: "Rajesh Menon", dueDate: "2026-02-10", status: "Overdue", priority: "Critical", linkedRisk: "RSK-001", linkedInitiative: "INI-003", linkedObjective: "SO-003", linkedMetric: "M-004", source: "Risk Register", externalTaskId: "" },
  { taskId: "T-003", taskName: "Send SOC2 audit report to DataVault", account: "ACC-004", owner: "Anjali Patel", dueDate: "2026-02-14", status: "Open", priority: "Medium", linkedRisk: "", linkedInitiative: "INI-004", linkedObjective: "SO-004", linkedMetric: "M-005", source: "Engagement Log", externalTaskId: "" },
  { taskId: "T-004", taskName: "Schedule CFO re-engagement call (FinanceFlow)", account: "ACC-003", owner: "Sarah Chen", dueDate: "2026-02-11", status: "Overdue", priority: "Critical", linkedRisk: "RSK-001", linkedInitiative: "", linkedObjective: "SO-003", linkedMetric: "M-004", source: "Insight", externalTaskId: "" },
  { taskId: "T-005", taskName: "Prepare churn mitigation plan for LogiPrime", account: "ACC-006", owner: "Rajesh Menon", dueDate: "2026-02-13", status: "In Progress", priority: "Critical", linkedRisk: "RSK-002", linkedInitiative: "", linkedObjective: "", linkedMetric: "", source: "Risk Register", externalTaskId: "" },
  { taskId: "T-006", taskName: "Run CloudBridge usage analytics report", account: "ACC-002", owner: "Arun Kumar", dueDate: "2026-02-14", status: "Open", priority: "High", linkedRisk: "RSK-005", linkedInitiative: "", linkedObjective: "", linkedMetric: "", source: "Engagement Log", externalTaskId: "" },
  { taskId: "T-007", taskName: "Draft expansion proposal for HealthTech", account: "ACC-005", owner: "Priya Sharma", dueDate: "2026-02-14", status: "In Progress", priority: "Medium", linkedRisk: "", linkedInitiative: "INI-005", linkedObjective: "SO-005", linkedMetric: "M-006", source: "Engagement Log", externalTaskId: "" },
  { taskId: "T-008", taskName: "RetailNest analytics training session", account: "ACC-007", owner: "Vikram Rajan", dueDate: "2026-02-17", status: "Open", priority: "Medium", linkedRisk: "", linkedInitiative: "", linkedObjective: "", linkedMetric: "", source: "Manual", externalTaskId: "" },
  { taskId: "T-009", taskName: "Escalation review with LogiPrime CEO", account: "ACC-006", owner: "Sarah Chen", dueDate: "2026-02-11", status: "Overdue", priority: "Critical", linkedRisk: "RSK-002", linkedInitiative: "", linkedObjective: "", linkedMetric: "", source: "Engagement Log", externalTaskId: "" },
  { taskId: "T-010", taskName: "Share data dedup proposal with TechServe", account: "ACC-001", owner: "Priya Sharma", dueDate: "2026-02-15", status: "Open", priority: "High", linkedRisk: "RSK-003", linkedInitiative: "INI-002", linkedObjective: "SO-002", linkedMetric: "M-001", source: "Engagement Log", externalTaskId: "" },
];

// ─── Generated Insights ──────────────────────────────────────────────────────

export const generatedInsightsData: GeneratedInsight[] = [
  { insightId: "INS-001", account: "ACC-006", csm: "Rajesh Menon", insightText: "LogiPrime churn probability has reached 91%. Health score dropped 23 points in 3 months. CEO Kumar Verma has not responded to outreach in 8 days. With renewal in 19 days, executive intervention is the only viable path.", recommendedAction: "Immediate: VP CS (Sarah Chen) to call CEO directly. Prepare a remediation package including: 72-hour ticket resolution sprint, dedicated SA for 30 days, 15% renewal discount.", status: "Actioned", dateGenerated: "2026-02-08", linkedMetric: "", linkedRisk: "RSK-002", linkedInitiative: "", linkedObjective: "" },
  { insightId: "INS-002", account: "ACC-003", csm: "Rajesh Menon", insightText: "FinanceFlow payment API error rate has spiked to 1.2% — 12x above target. This is directly impacting ~12,000 transactions/month and blocking the RBI compliance automation initiative. CFO Neha Patel hasn't been contacted in 21 days.", recommendedAction: "1) Emergency hotfix deployment (target: Feb 10). 2) Re-engage CFO Neha Patel with compliance impact analysis. 3) Prepare renewal rescue package before 29-day deadline.", status: "Actioned", dateGenerated: "2026-02-07", linkedMetric: "M-004", linkedRisk: "RSK-001", linkedInitiative: "INI-003", linkedObjective: "SO-003" },
  { insightId: "INS-003", account: "ACC-002", csm: "Arun Kumar", insightText: "CloudBridge DAU dropped 15% week-over-week while support tickets increased. Pattern suggests possible evaluation of alternatives. Head of Engineering David Chen's engagement frequency has also declined.", recommendedAction: "Schedule proactive architecture review meeting. Prepare competitive differentiation deck. Highlight migration sunk costs and switching risks. Engage CEO Sarah Lim for strategic alignment.", status: "New", dateGenerated: "2026-02-09", linkedMetric: "", linkedRisk: "RSK-005", linkedInitiative: "", linkedObjective: "" },
  { insightId: "INS-004", account: "ACC-005", csm: "Priya Sharma", insightText: "HealthTech Innovations is ready for expansion. NPS 10 from CTO, health score 95 (improving), 22% ARR growth. CTO mentioned interest in 3 new modules. This is a high-probability upsell opportunity worth ~$120K ACV.", recommendedAction: "Draft expansion proposal with ROI analysis for 3 new modules. Schedule deal review with AE Michael Torres. Position for case study simultaneously.", status: "Acknowledged", dateGenerated: "2026-02-08", linkedMetric: "", linkedRisk: "", linkedInitiative: "INI-005", linkedObjective: "SO-005" },
  { insightId: "INS-005", account: "ACC-001", csm: "Priya Sharma", insightText: "TechServe's Customer 360 initiative is at amber due to 23% duplicate records in legacy CRM. DataWeave dedup transformation could resolve this in 2 sprints, unblocking $800K in business value.", recommendedAction: "Propose data cleansing sprint with DataWeave templates. Estimate: 3 weeks, $25K MuleSoft services. ROI: unblocks $800K Customer 360 business value.", status: "New", dateGenerated: "2026-02-10", linkedMetric: "", linkedRisk: "RSK-003", linkedInitiative: "INI-002", linkedObjective: "SO-002" },
  { insightId: "INS-006", account: "ACC-004", csm: "Anjali Patel", insightText: "DataVault threat activity elevated to 4.5K blocks/day. While current defenses are holding, pattern suggests coordinated scanning. Recommend threat intel sharing session with customer SOC team.", recommendedAction: "Schedule joint threat analysis session with DataVault SOC team. Share anonymized threat intelligence patterns. Review WAF rule efficacy.", status: "Acknowledged", dateGenerated: "2026-02-09", linkedMetric: "M-005", linkedRisk: "RSK-004", linkedInitiative: "INI-004", linkedObjective: "SO-004" },
  { insightId: "INS-007", account: "ACC-008", csm: "Anjali Patel", insightText: "GreenEnergy's energy dashboard initiative is 60% complete and on schedule. COO Mark Thompson expressed interest in extending the platform to IoT sensor data integration for sustainability reporting.", recommendedAction: "Explore IoT/event-driven architecture add-on. Schedule technical discovery session for sensor data patterns. Potential $80K expansion opportunity.", status: "New", dateGenerated: "2026-02-07", linkedMetric: "", linkedRisk: "", linkedInitiative: "", linkedObjective: "" },
];

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getAccountById(id: string): AccountMaster | undefined {
  return accountMasterData.find(a => a.accountId === id);
}

export function getAccountName(id: string): string {
  return getAccountById(id)?.accountName || id;
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
    case "Critical": return "#ef4444";
    case "High": return "#f97316";
    case "Medium": return "#eab308";
    case "Low": return "#22c55e";
    default: return "#6b7280";
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "On Track": case "Healthy": case "Active": case "Completed": case "Achieved": case "Done": return "#22c55e";
    case "At Risk": case "Warning": case "Amber": case "Behind": return "#f59e0b";
    case "Blocked": case "Critical": case "Declined": case "Overdue": case "Churned": return "#ef4444";
    case "In Progress": case "Mitigating": return "#3b82f6";
    default: return "#6b7280";
  }
}

// ─── Additional helpers for dashboard & overlay compatibility ─────────────────

export function getHealthLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "At Risk";
  return "Critical";
}

export function getIndustryIcon(industry: string): string {
  const icons: Record<string, string> = {
    "Technology": "🏢", "Enterprise Software": "🏢",
    "Cloud Services": "☁️",
    "Financial Services": "💰", "FinTech": "💰",
    "Data Security": "🔒",
    "Healthcare": "🏥", "HealthTech": "🏥",
    "Logistics": "🚚", "Supply Chain": "🚚",
    "Retail": "🛍️", "E-Commerce": "🛍️",
    "Energy": "🌱", "Renewable Energy": "🌱",
    "EdTech": "📚", "Education": "📚",
  };
  return icons[industry] || "🏢";
}

export function getDaysUntilDue(dueDate: string): number {
  const today = new Date("2026-02-10");
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "Very Positive": case "Positive": return "var(--iw-success)";
    case "Neutral": return "var(--iw-blue)";
    case "Negative": case "Concerning": return "var(--iw-danger)";
    default: return "var(--muted-foreground)";
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "Critical": case "P1": return "var(--iw-danger)";
    case "High": case "P2": return "#f97316";
    case "Medium": case "P3": return "var(--iw-warning)";
    case "Low": case "P4": return "var(--iw-blue)";
    default: return "var(--muted-foreground)";
  }
}

/**
 * CSM Intelligence Table Registry — maps table names to their ID field and data arrays.
 * Used by the server seeder and client fetcher.
 */
export const CSM_TABLE_REGISTRY: Record<string, { idField: string; data: any[] }> = {
  account_master: { idField: "accountId", data: accountMasterData },
  people_team: { idField: "personId", data: peopleTeamData },
  business_context: { idField: "contextId", data: businessContextData },
  strategic_objectives: { idField: "objectiveId", data: strategicObjectivesData },
  capabilities: { idField: "capabilityId", data: capabilitiesData },
  value_streams: { idField: "streamId", data: valueStreamsData },
  api_portfolio: { idField: "apiId", data: apiPortfolioData },
  platform_health: { idField: "metricId", data: platformHealthData },
  initiatives: { idField: "initiativeId", data: initiativesData },
  risk_register: { idField: "riskId", data: riskRegisterData },
  stakeholder_outcomes: { idField: "outcomeId", data: stakeholderOutcomesData },
  engagement_log: { idField: "engagementId", data: engagementLogData },
  success_plans: { idField: "successPlanId", data: successPlanData },
  task_manager: { idField: "taskId", data: taskManagerData },
  generated_insights: { idField: "insightId", data: generatedInsightsData },
};
