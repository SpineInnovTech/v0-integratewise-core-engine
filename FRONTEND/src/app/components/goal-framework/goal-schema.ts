/**
 * GOAL-ANCHORED SCHEMA — The Non-Negotiable Rule
 * 
 * "If it doesn't trace to org growth or client outcomes, it's noise."
 * 
 * This module defines the complete goal taxonomy that drives EVERY view,
 * metric, entity, and KPI in IntegrateWise. Two org archetypes:
 * 
 *   PRODUCT ORG → North Star: Product-led Growth (MRR, Adoption, NRR)
 *   SERVICES ORG → North Star: Service Delivery Excellence (Utilization, Margins, Outcomes)
 * 
 * Two measurement lenses:
 *   PROVIDER LENS → "How is MY org growing?" (internal)
 *   CLIENT LENS → "Is the client getting value?" (external)
 * 
 * Every canonical entity gets goal_refs[]. Every view is a goal-scoped projection.
 */

// ─── Org Archetype ───────────────────────────────────────────────────────────

export type OrgType = "PRODUCT" | "SERVICES" | "HYBRID";
export type MeasurementLens = "PROVIDER" | "CLIENT";

// ─── Goal Hierarchy ──────────────────────────────────────────────────────────
// NorthStar → Strategic Goals → Department Goals → Team KPIs → Individual Metrics

export type GoalTier = "NORTH_STAR" | "STRATEGIC" | "DEPARTMENT" | "TEAM" | "INDIVIDUAL";
export type GoalStatus = "ON_TRACK" | "AT_RISK" | "OFF_TRACK" | "EXCEEDED" | "NOT_STARTED";
export type GoalDomain = "REVENUE" | "PRODUCT" | "CUSTOMER" | "DELIVERY" | "PEOPLE" | "OPERATIONS";

export interface Goal {
  id: string;
  name: string;
  description: string;
  tier: GoalTier;
  domain: GoalDomain;
  orgType: OrgType | "UNIVERSAL"; // which org archetype this applies to
  lens: MeasurementLens | "BOTH";
  parentGoalId: string | null;
  childGoalIds: string[];
  kpiIds: string[];
  weight: number; // 0-1, importance relative to siblings
  status: GoalStatus;
  progress: number; // 0-100
  target: string;
  current: string;
  trend: number; // positive = improving, negative = declining
  ownerDepartment: string; // CTX_CS, CTX_SALES, etc.
  impactedDepartments: string[];
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  goalId: string;
  unit: string; // "%", "$", "days", "count", "ratio"
  currentValue: number;
  targetValue: number;
  previousValue: number;
  trend: number;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY";
  formula?: string; // human-readable calculation
  dataSource: string[]; // which spine entities feed this
  status: GoalStatus;
  sparkline?: number[]; // last N data points for mini chart
}

export interface ValueStream {
  id: string;
  name: string;
  description: string;
  orgType: OrgType;
  lens: MeasurementLens;
  stages: ValueStreamStage[];
  totalValue: number;
  healthScore: number;
}

export interface ValueStreamStage {
  id: string;
  name: string;
  entityCount: number;
  value: number;
  conversionRate: number;
  avgTimeInStage: number; // days
  goalId: string;
}

// ─── Department Goal Schemas ─────────────────────────────────────────────────
// What each department cares about — always traced to org growth

export interface DepartmentGoalSchema {
  department: string;
  label: string;
  orgType: OrgType | "UNIVERSAL";
  northStarContribution: string; // How this dept contributes to the north star
  primaryGoals: Goal[];
  kpis: KPI[];
  entityGoalMapping: Record<string, string[]>; // entity type → relevant goal IDs
}

// ─── Entity Goal Annotation ──────────────────────────────────────────────────
// Every spine entity carries this

export interface EntityGoalRef {
  goalId: string;
  goalName: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  contribution: number; // dollar or unit value this entity contributes
  alignmentScore: number; // 0-100, how aligned is this entity with the goal
  lens: MeasurementLens;
}

// ─── Goal Resolution ─────────────────────────────────────────────────────────
// Traces an entity all the way up to the north star

export interface GoalTrace {
  entity: { id: string; type: string; name: string };
  immediateGoal: { id: string; name: string; tier: GoalTier };
  departmentGoal: { id: string; name: string };
  strategicGoal: { id: string; name: string };
  northStar: { id: string; name: string };
  impactPath: string; // human-readable trace
  totalImpact: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED DATA — Product Org & Services Org Goal Trees
// ═══════════════════════════════════════════════════════════════════════════════

// ─── PRODUCT ORG Goal Tree ───────────────────────────────────────────────────

export const PRODUCT_ORG_GOALS: Goal[] = [
  // NORTH STAR
  {
    id: "NS_PROD_001", name: "Product-Led Growth", description: "Maximize sustainable product-led revenue growth through adoption, retention, and expansion",
    tier: "NORTH_STAR", domain: "REVENUE", orgType: "PRODUCT", lens: "BOTH", parentGoalId: null,
    childGoalIds: ["SG_PROD_001", "SG_PROD_002", "SG_PROD_003", "SG_PROD_004"],
    kpiIds: ["KPI_NS_ARR", "KPI_NS_NRR"], weight: 1.0, status: "ON_TRACK", progress: 72, target: "$5M ARR", current: "$3.6M ARR", trend: 12.5,
    ownerDepartment: "CTX_BIZOPS", impactedDepartments: ["CTX_CS", "CTX_SALES", "CTX_MARKETING", "CTX_TECH", "CTX_FINANCE"]
  },

  // STRATEGIC GOALS
  {
    id: "SG_PROD_001", name: "Revenue Expansion", description: "Grow revenue through new logos and expansion of existing accounts",
    tier: "STRATEGIC", domain: "REVENUE", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "NS_PROD_001",
    childGoalIds: ["DG_SALES_001", "DG_SALES_002", "DG_CS_004"], kpiIds: ["KPI_SG_NEW_LOGO", "KPI_SG_EXPANSION"],
    weight: 0.35, status: "ON_TRACK", progress: 68, target: "+40% YoY", current: "+32% YoY", trend: 8.3,
    ownerDepartment: "CTX_SALES", impactedDepartments: ["CTX_CS", "CTX_MARKETING"]
  },
  {
    id: "SG_PROD_002", name: "Product Adoption & Value", description: "Maximize product adoption depth and time-to-value for all customers",
    tier: "STRATEGIC", domain: "PRODUCT", orgType: "PRODUCT", lens: "CLIENT", parentGoalId: "NS_PROD_001",
    childGoalIds: ["DG_CS_001", "DG_CS_002", "DG_TECH_001"], kpiIds: ["KPI_SG_ADOPTION", "KPI_SG_TTV"],
    weight: 0.30, status: "AT_RISK", progress: 58, target: "85% feature adoption", current: "62% feature adoption", trend: -2.1,
    ownerDepartment: "CTX_CS", impactedDepartments: ["CTX_TECH", "CTX_SUPPORT"]
  },
  {
    id: "SG_PROD_003", name: "Customer Retention", description: "Retain and grow existing customer base through proactive success management",
    tier: "STRATEGIC", domain: "CUSTOMER", orgType: "PRODUCT", lens: "BOTH", parentGoalId: "NS_PROD_001",
    childGoalIds: ["DG_CS_003", "DG_SUPPORT_001"], kpiIds: ["KPI_SG_RETENTION", "KPI_SG_HEALTH"],
    weight: 0.25, status: "ON_TRACK", progress: 81, target: "95% GRR", current: "93% GRR", trend: 1.5,
    ownerDepartment: "CTX_CS", impactedDepartments: ["CTX_SUPPORT", "CTX_SALES"]
  },
  {
    id: "SG_PROD_004", name: "Operational Excellence", description: "Build scalable operations that support 10x growth",
    tier: "STRATEGIC", domain: "OPERATIONS", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "NS_PROD_001",
    childGoalIds: ["DG_TECH_002", "DG_HR_001", "DG_FIN_001", "DG_BIZOPS_001", "DG_BIZOPS_002", "DG_BIZOPS_003", "DG_PM_001", "DG_PM_002", "DG_LEGAL_001", "DG_LEGAL_002"], kpiIds: ["KPI_SG_EFFICIENCY"],
    weight: 0.10, status: "ON_TRACK", progress: 76, target: "<15% burn ratio", current: "12% burn ratio", trend: 3.2,
    ownerDepartment: "CTX_BIZOPS", impactedDepartments: ["CTX_TECH", "CTX_HR", "CTX_FINANCE"]
  },

  // DEPARTMENT GOALS — CS (Product Org)
  {
    id: "DG_CS_001", name: "Activation & Onboarding", description: "Get customers to first value milestone within 14 days",
    tier: "DEPARTMENT", domain: "CUSTOMER", orgType: "PRODUCT", lens: "CLIENT", parentGoalId: "SG_PROD_002",
    childGoalIds: [], kpiIds: ["KPI_CS_TTV", "KPI_CS_ACTIVATION"], weight: 0.30, status: "AT_RISK", progress: 52,
    target: "14 day avg TTV", current: "21 day avg TTV", trend: -5.0,
    ownerDepartment: "CTX_CS", impactedDepartments: ["CTX_TECH"]
  },
  {
    id: "DG_CS_002", name: "Feature Adoption Depth", description: "Drive adoption of core features across customer base",
    tier: "DEPARTMENT", domain: "PRODUCT", orgType: "PRODUCT", lens: "CLIENT", parentGoalId: "SG_PROD_002",
    childGoalIds: [], kpiIds: ["KPI_CS_FEATURE_DEPTH", "KPI_CS_DAU"], weight: 0.25, status: "ON_TRACK", progress: 65,
    target: "3+ core features per account", current: "2.4 avg features", trend: 4.2,
    ownerDepartment: "CTX_CS", impactedDepartments: ["CTX_TECH", "CTX_MARKETING"]
  },
  {
    id: "DG_CS_003", name: "Proactive Retention", description: "Identify and mitigate churn risk before it materializes",
    tier: "DEPARTMENT", domain: "CUSTOMER", orgType: "PRODUCT", lens: "BOTH", parentGoalId: "SG_PROD_003",
    childGoalIds: [], kpiIds: ["KPI_CS_CHURN_RATE", "KPI_CS_HEALTH_SCORE", "KPI_CS_NPS"], weight: 0.30, status: "ON_TRACK", progress: 78,
    target: "<5% annual churn", current: "4.2% annual churn", trend: 2.1,
    ownerDepartment: "CTX_CS", impactedDepartments: ["CTX_SUPPORT"]
  },
  {
    id: "DG_CS_004", name: "Expansion Revenue", description: "Drive upsell and cross-sell within existing accounts",
    tier: "DEPARTMENT", domain: "REVENUE", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "SG_PROD_001",
    childGoalIds: [], kpiIds: ["KPI_CS_EXPANSION_MRR", "KPI_CS_NRR"], weight: 0.15, status: "ON_TRACK", progress: 71,
    target: "120% NRR", current: "115% NRR", trend: 3.8,
    ownerDepartment: "CTX_CS", impactedDepartments: ["CTX_SALES"]
  },

  // DEPARTMENT GOALS — Sales (Product Org)
  {
    id: "DG_SALES_001", name: "New Logo Acquisition", description: "Acquire new customers through outbound and inbound motions",
    tier: "DEPARTMENT", domain: "REVENUE", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "SG_PROD_001",
    childGoalIds: [], kpiIds: ["KPI_SALES_WIN_RATE", "KPI_SALES_ACV", "KPI_SALES_CYCLE"], weight: 0.50, status: "ON_TRACK", progress: 64,
    target: "120 new logos/year", current: "82 logos YTD (pro-rata on track)", trend: 6.1,
    ownerDepartment: "CTX_SALES", impactedDepartments: ["CTX_MARKETING"]
  },
  {
    id: "DG_SALES_002", name: "Pipeline Health", description: "Maintain healthy and predictable sales pipeline",
    tier: "DEPARTMENT", domain: "REVENUE", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "SG_PROD_001",
    childGoalIds: [], kpiIds: ["KPI_SALES_PIPELINE", "KPI_SALES_VELOCITY"], weight: 0.30, status: "AT_RISK", progress: 55,
    target: "4x pipeline coverage", current: "3.1x coverage", trend: -1.8,
    ownerDepartment: "CTX_SALES", impactedDepartments: []
  },

  // DEPARTMENT GOALS — Engineering (Product Org)
  {
    id: "DG_TECH_001", name: "Product Velocity", description: "Ship features that drive adoption and retention",
    tier: "DEPARTMENT", domain: "PRODUCT", orgType: "PRODUCT", lens: "BOTH", parentGoalId: "SG_PROD_002",
    childGoalIds: [], kpiIds: ["KPI_TECH_VELOCITY", "KPI_TECH_QUALITY"], weight: 0.50, status: "ON_TRACK", progress: 74,
    target: "12 feature releases/quarter", current: "9 releases this quarter", trend: 8.0,
    ownerDepartment: "CTX_TECH", impactedDepartments: ["CTX_CS"]
  },
  {
    id: "DG_TECH_002", name: "Platform Reliability", description: "Maintain platform uptime and performance SLAs",
    tier: "DEPARTMENT", domain: "OPERATIONS", orgType: "PRODUCT", lens: "CLIENT", parentGoalId: "SG_PROD_004",
    childGoalIds: [], kpiIds: ["KPI_TECH_UPTIME", "KPI_TECH_LATENCY"], weight: 0.50, status: "ON_TRACK", progress: 96,
    target: "99.95% uptime", current: "99.97% uptime", trend: 0.02,
    ownerDepartment: "CTX_TECH", impactedDepartments: ["CTX_SUPPORT"]
  },

  // DEPARTMENT GOALS — Marketing (Product Org)
  {
    id: "DG_MARKETING_001", name: "Demand Generation", description: "Generate qualified pipeline through marketing motions",
    tier: "DEPARTMENT", domain: "REVENUE", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "SG_PROD_001",
    childGoalIds: [], kpiIds: ["KPI_MKT_MQL", "KPI_MKT_PIPELINE"], weight: 0.60, status: "ON_TRACK", progress: 69,
    target: "500 MQLs/month", current: "420 MQLs/month", trend: 5.3,
    ownerDepartment: "CTX_MARKETING", impactedDepartments: ["CTX_SALES"]
  },

  // Support
  {
    id: "DG_SUPPORT_001", name: "Resolution Excellence", description: "Resolve customer issues quickly to protect retention",
    tier: "DEPARTMENT", domain: "CUSTOMER", orgType: "PRODUCT", lens: "CLIENT", parentGoalId: "SG_PROD_003",
    childGoalIds: [], kpiIds: ["KPI_SUP_CSAT", "KPI_SUP_RESOLUTION"], weight: 0.50, status: "ON_TRACK", progress: 82,
    target: "95% CSAT, <4hr resolution", current: "93% CSAT, 3.2hr resolution", trend: 2.4,
    ownerDepartment: "CTX_SUPPORT", impactedDepartments: ["CTX_CS"]
  },

  // HR
  {
    id: "DG_HR_001", name: "Talent & Capacity", description: "Build team capacity to support growth trajectory",
    tier: "DEPARTMENT", domain: "PEOPLE", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "SG_PROD_004",
    childGoalIds: [], kpiIds: ["KPI_HR_RETENTION", "KPI_HR_HIRING"], weight: 0.50, status: "ON_TRACK", progress: 75,
    target: "<10% attrition, fill within 45 days", current: "8% attrition, 38 day avg fill", trend: 1.5,
    ownerDepartment: "CTX_HR", impactedDepartments: ["CTX_TECH", "CTX_CS"]
  },

  // Finance
  {
    id: "DG_FIN_001", name: "Unit Economics", description: "Maintain healthy unit economics for sustainable growth",
    tier: "DEPARTMENT", domain: "REVENUE", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "SG_PROD_004",
    childGoalIds: [], kpiIds: ["KPI_FIN_LTV_CAC", "KPI_FIN_PAYBACK"], weight: 0.50, status: "ON_TRACK", progress: 80,
    target: "LTV:CAC > 4:1", current: "LTV:CAC = 4.2:1", trend: 0.3,
    ownerDepartment: "CTX_FINANCE", impactedDepartments: ["CTX_SALES", "CTX_MARKETING"]
  },

  // BizOps — Owns the cross-functional operational view
  {
    id: "DG_BIZOPS_001", name: "Cross-Functional Alignment", description: "Ensure all departments are executing towards the North Star",
    tier: "DEPARTMENT", domain: "OPERATIONS", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "SG_PROD_004",
    childGoalIds: [], kpiIds: ["KPI_NS_ARR", "KPI_NS_NRR"], weight: 0.40, status: "ON_TRACK", progress: 74,
    target: "All depts >70% alignment", current: "Avg 72% alignment", trend: 3.5,
    ownerDepartment: "CTX_BIZOPS", impactedDepartments: ["CTX_CS", "CTX_SALES", "CTX_TECH"]
  },
  {
    id: "DG_BIZOPS_002", name: "Integration & Data Health", description: "Maintain full Spine coverage and data freshness across all connectors",
    tier: "DEPARTMENT", domain: "OPERATIONS", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "SG_PROD_004",
    childGoalIds: [], kpiIds: [], weight: 0.30, status: "ON_TRACK", progress: 84,
    target: "95% data freshness, 0 stale connectors", current: "92% freshness, 1 stale", trend: 2.0,
    ownerDepartment: "CTX_BIZOPS", impactedDepartments: []
  },
  {
    id: "DG_BIZOPS_003", name: "Revenue Forecasting Accuracy", description: "Deliver predictable revenue forecasts within 5% variance",
    tier: "DEPARTMENT", domain: "REVENUE", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "SG_PROD_001",
    childGoalIds: [], kpiIds: [], weight: 0.30, status: "AT_RISK", progress: 62,
    target: "<5% forecast variance", current: "8% variance", trend: -1.2,
    ownerDepartment: "CTX_BIZOPS", impactedDepartments: ["CTX_SALES", "CTX_FINANCE"]
  },

  // PM — Product Org (owns roadmap and project delivery)
  {
    id: "DG_PM_001", name: "Roadmap Execution", description: "Deliver roadmap commitments on time to drive adoption",
    tier: "DEPARTMENT", domain: "PRODUCT", orgType: "PRODUCT", lens: "BOTH", parentGoalId: "SG_PROD_002",
    childGoalIds: [], kpiIds: ["KPI_TECH_VELOCITY"], weight: 0.50, status: "ON_TRACK", progress: 70,
    target: "90% roadmap delivery", current: "85% delivery rate", trend: 5.0,
    ownerDepartment: "CTX_PM", impactedDepartments: ["CTX_TECH", "CTX_CS"]
  },
  {
    id: "DG_PM_002", name: "Sprint Delivery Quality", description: "Ensure high-quality deliverables with minimal rework",
    tier: "DEPARTMENT", domain: "PRODUCT", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "SG_PROD_004",
    childGoalIds: [], kpiIds: [], weight: 0.50, status: "ON_TRACK", progress: 78,
    target: "<5% rework rate", current: "4.2% rework rate", trend: 1.8,
    ownerDepartment: "CTX_PM", impactedDepartments: ["CTX_TECH"]
  },

  // Legal — Compliance protects growth
  {
    id: "DG_LEGAL_001", name: "Contract Velocity", description: "Accelerate contract turnaround to unblock revenue",
    tier: "DEPARTMENT", domain: "OPERATIONS", orgType: "PRODUCT", lens: "PROVIDER", parentGoalId: "SG_PROD_001",
    childGoalIds: [], kpiIds: [], weight: 0.50, status: "ON_TRACK", progress: 76,
    target: "<5 day avg turnaround", current: "4.8 day avg", trend: 2.0,
    ownerDepartment: "CTX_LEGAL", impactedDepartments: ["CTX_SALES"]
  },
  {
    id: "DG_LEGAL_002", name: "Compliance & Risk", description: "Maintain compliance to protect customer trust and revenue",
    tier: "DEPARTMENT", domain: "OPERATIONS", orgType: "PRODUCT", lens: "BOTH", parentGoalId: "SG_PROD_003",
    childGoalIds: [], kpiIds: [], weight: 0.50, status: "ON_TRACK", progress: 88,
    target: "Zero compliance incidents", current: "0 incidents (12mo)", trend: 0,
    ownerDepartment: "CTX_LEGAL", impactedDepartments: ["CTX_CS", "CTX_FINANCE"]
  },
];

// ─── SERVICES ORG Goal Tree ─────────────────────────────────────────────────

export const SERVICES_ORG_GOALS: Goal[] = [
  // NORTH STAR
  {
    id: "NS_SVC_001", name: "Service Delivery Excellence", description: "Maximize client outcomes, utilization, and sustainable revenue growth through service excellence",
    tier: "NORTH_STAR", domain: "DELIVERY", orgType: "SERVICES", lens: "BOTH", parentGoalId: null,
    childGoalIds: ["SG_SVC_001", "SG_SVC_002", "SG_SVC_003", "SG_SVC_004"],
    kpiIds: ["KPI_NS_SVC_REV", "KPI_NS_SVC_UTIL"], weight: 1.0, status: "ON_TRACK", progress: 71,
    target: "$8M Revenue, 82% Utilization", current: "$5.7M Revenue, 78% Utilization", trend: 9.2,
    ownerDepartment: "CTX_BIZOPS", impactedDepartments: ["CTX_CS", "CTX_SALES", "CTX_PM", "CTX_TECH", "CTX_FINANCE"]
  },

  // STRATEGIC GOALS
  {
    id: "SG_SVC_001", name: "Client Value Delivery", description: "Deliver measurable business outcomes for every client engagement",
    tier: "STRATEGIC", domain: "DELIVERY", orgType: "SERVICES", lens: "CLIENT", parentGoalId: "NS_SVC_001",
    childGoalIds: ["DG_SVC_PM_001", "DG_SVC_CS_001"], kpiIds: ["KPI_SVC_OUTCOME", "KPI_SVC_CSAT"],
    weight: 0.35, status: "ON_TRACK", progress: 76, target: "90% outcome achievement", current: "84% outcome achievement", trend: 3.5,
    ownerDepartment: "CTX_PM", impactedDepartments: ["CTX_CS", "CTX_TECH"]
  },
  {
    id: "SG_SVC_002", name: "Revenue Growth", description: "Grow service revenue through new engagements and account expansion",
    tier: "STRATEGIC", domain: "REVENUE", orgType: "SERVICES", lens: "PROVIDER", parentGoalId: "NS_SVC_001",
    childGoalIds: ["DG_SVC_SALES_001", "DG_SVC_CS_002"], kpiIds: ["KPI_SVC_REV_GROWTH", "KPI_SVC_DEAL_SIZE"],
    weight: 0.30, status: "AT_RISK", progress: 60, target: "+35% YoY", current: "+22% YoY", trend: -3.1,
    ownerDepartment: "CTX_SALES", impactedDepartments: ["CTX_MARKETING"]
  },
  {
    id: "SG_SVC_003", name: "Operational Efficiency", description: "Maximize billable utilization and delivery margins",
    tier: "STRATEGIC", domain: "OPERATIONS", orgType: "SERVICES", lens: "PROVIDER", parentGoalId: "NS_SVC_001",
    childGoalIds: ["DG_SVC_PM_002", "DG_SVC_HR_001"], kpiIds: ["KPI_SVC_UTILIZATION", "KPI_SVC_MARGIN"],
    weight: 0.25, status: "ON_TRACK", progress: 74, target: "82% utilization, 40% margin", current: "78% utilization, 37% margin", trend: 2.0,
    ownerDepartment: "CTX_BIZOPS", impactedDepartments: ["CTX_PM", "CTX_HR", "CTX_FINANCE"]
  },
  {
    id: "SG_SVC_004", name: "Client Retention & Growth", description: "Retain clients and grow account value through repeat engagements",
    tier: "STRATEGIC", domain: "CUSTOMER", orgType: "SERVICES", lens: "BOTH", parentGoalId: "NS_SVC_001",
    childGoalIds: ["DG_SVC_CS_003"], kpiIds: ["KPI_SVC_RETENTION", "KPI_SVC_REPEAT"],
    weight: 0.10, status: "ON_TRACK", progress: 82, target: "85% client retention", current: "88% client retention", trend: 4.2,
    ownerDepartment: "CTX_CS", impactedDepartments: ["CTX_SALES"]
  },

  // DEPARTMENT GOALS — PM (Services Org)
  {
    id: "DG_SVC_PM_001", name: "On-Time Delivery", description: "Deliver all milestones on time and within scope",
    tier: "DEPARTMENT", domain: "DELIVERY", orgType: "SERVICES", lens: "CLIENT", parentGoalId: "SG_SVC_001",
    childGoalIds: [], kpiIds: ["KPI_SVC_OTD", "KPI_SVC_SCOPE"], weight: 0.50, status: "AT_RISK", progress: 68,
    target: "90% on-time milestones", current: "82% on-time milestones", trend: -1.5,
    ownerDepartment: "CTX_PM", impactedDepartments: ["CTX_TECH"]
  },
  {
    id: "DG_SVC_PM_002", name: "Resource Optimization", description: "Optimize resource allocation to maximize utilization without burnout",
    tier: "DEPARTMENT", domain: "OPERATIONS", orgType: "SERVICES", lens: "PROVIDER", parentGoalId: "SG_SVC_003",
    childGoalIds: [], kpiIds: ["KPI_SVC_BENCH", "KPI_SVC_ALLOC"], weight: 0.50, status: "ON_TRACK", progress: 72,
    target: "<10% bench, 85% allocation efficiency", current: "12% bench, 81% allocation", trend: 2.3,
    ownerDepartment: "CTX_PM", impactedDepartments: ["CTX_HR"]
  },

  // DEPARTMENT GOALS — CS (Services Org)
  {
    id: "DG_SVC_CS_001", name: "Client Outcomes", description: "Ensure every engagement delivers measurable client business outcomes",
    tier: "DEPARTMENT", domain: "CUSTOMER", orgType: "SERVICES", lens: "CLIENT", parentGoalId: "SG_SVC_001",
    childGoalIds: [], kpiIds: ["KPI_SVC_CS_OUTCOME", "KPI_SVC_CS_NPS"], weight: 0.40, status: "ON_TRACK", progress: 77,
    target: "NPS > 60, 90% outcome score", current: "NPS 58, 84% outcome score", trend: 3.0,
    ownerDepartment: "CTX_CS", impactedDepartments: ["CTX_PM"]
  },
  {
    id: "DG_SVC_CS_002", name: "Account Expansion", description: "Grow existing accounts through repeat and adjacent engagements",
    tier: "DEPARTMENT", domain: "REVENUE", orgType: "SERVICES", lens: "PROVIDER", parentGoalId: "SG_SVC_002",
    childGoalIds: [], kpiIds: ["KPI_SVC_CROSS_SELL", "KPI_SVC_REPEAT_REV"], weight: 0.30, status: "ON_TRACK", progress: 65,
    target: "60% repeat engagement rate", current: "54% repeat rate", trend: 4.5,
    ownerDepartment: "CTX_CS", impactedDepartments: ["CTX_SALES"]
  },
  {
    id: "DG_SVC_CS_003", name: "Relationship Depth", description: "Build multi-threaded relationships for long-term partnerships",
    tier: "DEPARTMENT", domain: "CUSTOMER", orgType: "SERVICES", lens: "BOTH", parentGoalId: "SG_SVC_004",
    childGoalIds: [], kpiIds: ["KPI_SVC_CONTACTS_PER_ACC", "KPI_SVC_EXEC_COVERAGE"], weight: 0.30, status: "ON_TRACK", progress: 70,
    target: "5+ contacts per account, exec coverage 80%", current: "4.2 contacts, 72% exec coverage", trend: 2.1,
    ownerDepartment: "CTX_CS", impactedDepartments: []
  },

  // Sales (Services)
  {
    id: "DG_SVC_SALES_001", name: "New Engagement Wins", description: "Win new service engagements with strong margins",
    tier: "DEPARTMENT", domain: "REVENUE", orgType: "SERVICES", lens: "PROVIDER", parentGoalId: "SG_SVC_002",
    childGoalIds: [], kpiIds: ["KPI_SVC_PROPOSAL_WIN", "KPI_SVC_AVG_DEAL"], weight: 0.50, status: "AT_RISK", progress: 55,
    target: "35% proposal win rate, $250K avg deal", current: "28% win rate, $210K avg deal", trend: -2.0,
    ownerDepartment: "CTX_SALES", impactedDepartments: ["CTX_MARKETING"]
  },

  // HR (Services)
  {
    id: "DG_SVC_HR_001", name: "Capability Building", description: "Build and retain talent with skills aligned to service offerings",
    tier: "DEPARTMENT", domain: "PEOPLE", orgType: "SERVICES", lens: "PROVIDER", parentGoalId: "SG_SVC_003",
    childGoalIds: [], kpiIds: ["KPI_SVC_SKILL_COV", "KPI_SVC_ATTRITION"], weight: 0.50, status: "ON_TRACK", progress: 73,
    target: "90% skill coverage, <12% attrition", current: "85% skill coverage, 10% attrition", trend: 1.8,
    ownerDepartment: "CTX_HR", impactedDepartments: ["CTX_PM", "CTX_TECH"]
  },
];

// ─── KPI Seed Data ───────────────────────────────────────────────────────────

export const PRODUCT_ORG_KPIS: KPI[] = [
  // North Star KPIs
  { id: "KPI_NS_ARR", name: "Annual Recurring Revenue", description: "Total ARR across all active subscriptions", goalId: "NS_PROD_001", unit: "$", currentValue: 3600000, targetValue: 5000000, previousValue: 3200000, trend: 12.5, frequency: "MONTHLY", formula: "Sum of all active subscription values × 12", dataSource: ["accounts", "deals"], status: "ON_TRACK", sparkline: [2800000, 2950000, 3100000, 3200000, 3350000, 3450000, 3600000] },
  { id: "KPI_NS_NRR", name: "Net Revenue Retention", description: "Revenue retained + expansion from existing customers", goalId: "NS_PROD_001", unit: "%", currentValue: 115, targetValue: 120, previousValue: 112, trend: 2.7, frequency: "MONTHLY", formula: "(Starting MRR + Expansion - Contraction - Churn) / Starting MRR", dataSource: ["accounts", "deals"], status: "ON_TRACK", sparkline: [108, 110, 112, 111, 113, 114, 115] },

  // CS KPIs
  { id: "KPI_CS_TTV", name: "Time to First Value", description: "Days from sign-up to first value milestone achieved", goalId: "DG_CS_001", unit: "days", currentValue: 21, targetValue: 14, previousValue: 24, trend: -12.5, frequency: "WEEKLY", formula: "Median days from contract start to first value event", dataSource: ["accounts", "activities"], status: "AT_RISK", sparkline: [28, 26, 25, 24, 23, 22, 21] },
  { id: "KPI_CS_ACTIVATION", name: "Activation Rate", description: "% of new customers reaching activation milestone", goalId: "DG_CS_001", unit: "%", currentValue: 72, targetValue: 90, previousValue: 68, trend: 5.9, frequency: "WEEKLY", dataSource: ["accounts"], status: "AT_RISK", sparkline: [62, 64, 66, 68, 69, 71, 72] },
  { id: "KPI_CS_FEATURE_DEPTH", name: "Avg Feature Adoption", description: "Average number of core features used per account", goalId: "DG_CS_002", unit: "count", currentValue: 2.4, targetValue: 3.0, previousValue: 2.1, trend: 14.3, frequency: "MONTHLY", dataSource: ["accounts"], status: "ON_TRACK", sparkline: [1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4] },
  { id: "KPI_CS_HEALTH_SCORE", name: "Avg Health Score", description: "Composite health across all active accounts", goalId: "DG_CS_003", unit: "score", currentValue: 76, targetValue: 85, previousValue: 73, trend: 4.1, frequency: "WEEKLY", dataSource: ["accounts"], status: "ON_TRACK", sparkline: [70, 71, 72, 73, 74, 75, 76] },
  { id: "KPI_CS_CHURN_RATE", name: "Annual Churn Rate", description: "% of customers lost in rolling 12 months", goalId: "DG_CS_003", unit: "%", currentValue: 4.2, targetValue: 5.0, previousValue: 4.8, trend: -12.5, frequency: "MONTHLY", dataSource: ["accounts"], status: "ON_TRACK", sparkline: [5.8, 5.5, 5.2, 5.0, 4.8, 4.5, 4.2] },
  { id: "KPI_CS_EXPANSION_MRR", name: "Expansion MRR", description: "Monthly recurring revenue from upsell/cross-sell", goalId: "DG_CS_004", unit: "$", currentValue: 45000, targetValue: 60000, previousValue: 38000, trend: 18.4, frequency: "MONTHLY", dataSource: ["deals", "accounts"], status: "ON_TRACK", sparkline: [28000, 30000, 33000, 36000, 38000, 42000, 45000] },
  { id: "KPI_CS_NRR", name: "CS-Driven NRR", description: "Net revenue retention attributable to CS activities", goalId: "DG_CS_004", unit: "%", currentValue: 115, targetValue: 120, previousValue: 112, trend: 2.7, frequency: "MONTHLY", dataSource: ["accounts", "deals"], status: "ON_TRACK", sparkline: [108, 110, 111, 112, 113, 114, 115] },

  // Sales KPIs
  { id: "KPI_SALES_WIN_RATE", name: "Win Rate", description: "% of qualified opportunities that close-won", goalId: "DG_SALES_001", unit: "%", currentValue: 32, targetValue: 35, previousValue: 29, trend: 10.3, frequency: "MONTHLY", dataSource: ["deals"], status: "ON_TRACK", sparkline: [25, 27, 28, 29, 30, 31, 32] },
  { id: "KPI_SALES_ACV", name: "Avg Contract Value", description: "Average first-year contract value of new deals", goalId: "DG_SALES_001", unit: "$", currentValue: 42000, targetValue: 50000, previousValue: 38000, trend: 10.5, frequency: "MONTHLY", dataSource: ["deals"], status: "ON_TRACK", sparkline: [35000, 36000, 37000, 38000, 39000, 41000, 42000] },
  { id: "KPI_SALES_PIPELINE", name: "Pipeline Coverage", description: "Total qualified pipeline / quarterly target", goalId: "DG_SALES_002", unit: "x", currentValue: 3.1, targetValue: 4.0, previousValue: 3.4, trend: -8.8, frequency: "WEEKLY", dataSource: ["deals"], status: "AT_RISK", sparkline: [3.8, 3.6, 3.5, 3.4, 3.3, 3.2, 3.1] },

  // Tech KPIs
  { id: "KPI_TECH_VELOCITY", name: "Feature Releases/Quarter", description: "Number of features shipped this quarter", goalId: "DG_TECH_001", unit: "count", currentValue: 9, targetValue: 12, previousValue: 7, trend: 28.6, frequency: "QUARTERLY", dataSource: ["activities"], status: "ON_TRACK", sparkline: [5, 6, 7, 7, 8, 8, 9] },
  { id: "KPI_TECH_UPTIME", name: "Platform Uptime", description: "% uptime over rolling 30 days", goalId: "DG_TECH_002", unit: "%", currentValue: 99.97, targetValue: 99.95, previousValue: 99.96, trend: 0.01, frequency: "DAILY", dataSource: [], status: "EXCEEDED", sparkline: [99.94, 99.95, 99.96, 99.95, 99.96, 99.97, 99.97] },

  // Marketing KPIs
  { id: "KPI_MKT_MQL", name: "Marketing Qualified Leads", description: "Monthly MQLs generated", goalId: "DG_MARKETING_001", unit: "count", currentValue: 420, targetValue: 500, previousValue: 380, trend: 10.5, frequency: "MONTHLY", dataSource: ["leads", "campaigns"], status: "ON_TRACK", sparkline: [310, 340, 360, 380, 390, 410, 420] },
];

export const SERVICES_ORG_KPIS: KPI[] = [
  { id: "KPI_NS_SVC_REV", name: "Total Service Revenue", description: "Total revenue from all service engagements", goalId: "NS_SVC_001", unit: "$", currentValue: 5700000, targetValue: 8000000, previousValue: 5200000, trend: 9.6, frequency: "MONTHLY", dataSource: ["accounts", "deals"], status: "ON_TRACK", sparkline: [4200000, 4500000, 4800000, 5000000, 5200000, 5500000, 5700000] },
  { id: "KPI_NS_SVC_UTIL", name: "Billable Utilization", description: "% of available hours that are billable", goalId: "NS_SVC_001", unit: "%", currentValue: 78, targetValue: 82, previousValue: 76, trend: 2.6, frequency: "WEEKLY", dataSource: ["activities", "people"], status: "ON_TRACK", sparkline: [72, 73, 75, 76, 76, 77, 78] },
  { id: "KPI_SVC_OTD", name: "On-Time Delivery Rate", description: "% of milestones delivered on or before deadline", goalId: "DG_SVC_PM_001", unit: "%", currentValue: 82, targetValue: 90, previousValue: 79, trend: 3.8, frequency: "MONTHLY", dataSource: ["projects"], status: "AT_RISK", sparkline: [75, 76, 77, 79, 80, 81, 82] },
  { id: "KPI_SVC_CS_NPS", name: "Client NPS", description: "Net Promoter Score across all active clients", goalId: "DG_SVC_CS_001", unit: "score", currentValue: 58, targetValue: 60, previousValue: 54, trend: 7.4, frequency: "QUARTERLY", dataSource: ["accounts"], status: "ON_TRACK", sparkline: [48, 50, 52, 53, 54, 56, 58] },
  { id: "KPI_SVC_PROPOSAL_WIN", name: "Proposal Win Rate", description: "% of submitted proposals that convert to signed SOWs", goalId: "DG_SVC_SALES_001", unit: "%", currentValue: 28, targetValue: 35, previousValue: 31, trend: -9.7, frequency: "MONTHLY", dataSource: ["deals"], status: "AT_RISK", sparkline: [32, 31, 30, 31, 30, 29, 28] },
];

// ─── Department → Entity → Goal Mapping ─────────────────────────────────────
// Defines which entity types contribute to which goals in each department

export const ENTITY_GOAL_MAP_PRODUCT: Record<string, Record<string, string[]>> = {
  CTX_CS: {
    accounts: ["DG_CS_001", "DG_CS_002", "DG_CS_003", "DG_CS_004"],
    contacts: ["DG_CS_003"],
    deals: ["DG_CS_004"],
    activities: ["DG_CS_001", "DG_CS_002"],
    tickets: ["DG_CS_003"],
  },
  CTX_SALES: {
    accounts: ["DG_SALES_001"],
    contacts: ["DG_SALES_001"],
    deals: ["DG_SALES_001", "DG_SALES_002"],
    activities: ["DG_SALES_001"],
    leads: ["DG_SALES_001"],
  },
  CTX_TECH: {
    activities: ["DG_TECH_001", "DG_TECH_002"],
    tickets: ["DG_TECH_002"],
  },
  CTX_MARKETING: {
    leads: ["DG_MARKETING_001"],
    campaigns: ["DG_MARKETING_001"],
    contacts: ["DG_MARKETING_001"],
  },
  CTX_SUPPORT: {
    tickets: ["DG_SUPPORT_001"],
    accounts: ["DG_SUPPORT_001"],
    contacts: ["DG_SUPPORT_001"],
  },
  CTX_HR: {
    people: ["DG_HR_001"],
    activities: ["DG_HR_001"],
  },
  CTX_FINANCE: {
    accounts: ["DG_FIN_001"],
    deals: ["DG_FIN_001"],
    invoices: ["DG_FIN_001"],
  },
  CTX_BIZOPS: {
    accounts: ["DG_BIZOPS_001", "DG_BIZOPS_003"],
    deals: ["DG_BIZOPS_003"],
    activities: ["DG_BIZOPS_001", "DG_BIZOPS_002"],
    projects: ["DG_BIZOPS_001"],
  },
  CTX_PM: {
    projects: ["DG_PM_001", "DG_PM_002"],
    tasks: ["DG_PM_001"],
    activities: ["DG_PM_001"],
  },
  CTX_LEGAL: {
    deals: ["DG_LEGAL_001"],
    documents: ["DG_LEGAL_001", "DG_LEGAL_002"],
    accounts: ["DG_LEGAL_002"],
  },
};

export const ENTITY_GOAL_MAP_SERVICES: Record<string, Record<string, string[]>> = {
  CTX_CS: {
    accounts: ["DG_SVC_CS_001", "DG_SVC_CS_002", "DG_SVC_CS_003"],
    contacts: ["DG_SVC_CS_003"],
    deals: ["DG_SVC_CS_002"],
    activities: ["DG_SVC_CS_001"],
  },
  CTX_PM: {
    projects: ["DG_SVC_PM_001", "DG_SVC_PM_002"],
    tasks: ["DG_SVC_PM_001"],
    activities: ["DG_SVC_PM_001"],
    people: ["DG_SVC_PM_002"],
  },
  CTX_SALES: {
    accounts: ["DG_SVC_SALES_001"],
    contacts: ["DG_SVC_SALES_001"],
    deals: ["DG_SVC_SALES_001"],
  },
  CTX_HR: {
    people: ["DG_SVC_HR_001"],
  },
};

// ─── Goal Utility Functions ──────────────────────────────────────────────────

export function getGoalTree(orgType: OrgType): Goal[] {
  if (orgType === "SERVICES") return SERVICES_ORG_GOALS;
  return PRODUCT_ORG_GOALS; // HYBRID defaults to product for now
}

export function getKPIs(orgType: OrgType): KPI[] {
  if (orgType === "SERVICES") return SERVICES_ORG_KPIS;
  return PRODUCT_ORG_KPIS;
}

export function getNorthStar(orgType: OrgType): Goal {
  const goals = getGoalTree(orgType);
  return goals.find(g => g.tier === "NORTH_STAR")!;
}

export function getStrategicGoals(orgType: OrgType): Goal[] {
  return getGoalTree(orgType).filter(g => g.tier === "STRATEGIC");
}

export function getDepartmentGoals(orgType: OrgType, department: string): Goal[] {
  return getGoalTree(orgType).filter(g => g.tier === "DEPARTMENT" && g.ownerDepartment === department);
}

export function getGoalsByLens(orgType: OrgType, lens: MeasurementLens): Goal[] {
  return getGoalTree(orgType).filter(g => g.lens === lens || g.lens === "BOTH");
}

export function getKPIsForGoal(orgType: OrgType, goalId: string): KPI[] {
  return getKPIs(orgType).filter(k => k.goalId === goalId);
}

export function getGoalById(orgType: OrgType, goalId: string): Goal | undefined {
  return getGoalTree(orgType).find(g => g.id === goalId);
}

export function traceGoalToNorthStar(orgType: OrgType, goalId: string): string[] {
  const goals = getGoalTree(orgType);
  const path: string[] = [goalId];
  let current = goals.find(g => g.id === goalId);
  while (current && current.parentGoalId) {
    path.unshift(current.parentGoalId);
    current = goals.find(g => g.id === current!.parentGoalId);
  }
  return path;
}

export function getEntityGoalRefs(orgType: OrgType, department: string, entityType: string): EntityGoalRef[] {
  const map = orgType === "SERVICES" ? ENTITY_GOAL_MAP_SERVICES : ENTITY_GOAL_MAP_PRODUCT;
  const deptMap = map[department];
  if (!deptMap || !deptMap[entityType]) return [];
  
  const goals = getGoalTree(orgType);
  return deptMap[entityType].map(goalId => {
    const goal = goals.find(g => g.id === goalId);
    return {
      goalId,
      goalName: goal?.name || goalId,
      impact: goal?.weight && goal.weight > 0.3 ? "HIGH" : goal?.weight && goal.weight > 0.15 ? "MEDIUM" : "LOW",
      contribution: 0, // calculated per entity
      alignmentScore: goal?.progress || 0,
      lens: (goal?.lens === "BOTH" ? "PROVIDER" : goal?.lens || "PROVIDER") as MeasurementLens,
    };
  });
}

export function computeGoalAlignment(orgType: OrgType, department: string): {
  overallScore: number;
  goalBreakdown: { goalId: string; name: string; score: number; status: GoalStatus; trend: number }[];
  northStarContribution: number;
} {
  const deptGoals = getDepartmentGoals(orgType, department);
  if (deptGoals.length === 0) return { overallScore: 0, goalBreakdown: [], northStarContribution: 0 };
  
  const totalWeight = deptGoals.reduce((sum, g) => sum + g.weight, 0);
  const overallScore = Math.round(deptGoals.reduce((sum, g) => sum + g.progress * g.weight, 0) / totalWeight);
  
  return {
    overallScore,
    goalBreakdown: deptGoals.map(g => ({
      goalId: g.id,
      name: g.name,
      score: g.progress,
      status: g.status,
      trend: g.trend,
    })),
    northStarContribution: overallScore * 0.25, // simplified contribution calc
  };
}