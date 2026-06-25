/**
 * Optimized Content Router
 *
 * Eliminates duplicates, standardizes patterns, and improves maintainability.
 * Uses helper functions to reduce repetitive mappings.
 */

import React, { Suspense, Component, type ReactNode } from "react";
import type { Domain } from "./workspace-config";
import { shouldRenderModule, getEmptyStateMessage, type ModuleData } from "./data-density-scorer";

// ─── ERROR BOUNDARY ─────────────────────────────────────────────────────────
class ModuleErrorBoundary extends Component<
  { children: ReactNode; moduleId: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; moduleId: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ContentRouter] Error loading module ${this.props.moduleId}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-12">
          <div className="text-center space-y-4 max-w-md font-iw-sans">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>
            <div className="font-medium text-muted-foreground">Failed to load module</div>
            <div className="text-xs text-muted-foreground/80 font-iw-mono">
              {this.props.moduleId}
            </div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-iw-forest-bright transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Role-Domain Module Registries ──────────────────────────────────────────
import * as csModules from "@/components/activation/onboarding/role-domain/account-success/modules";
import * as salesModules from "@/components/activation/onboarding/role-domain/salesops/modules";
import * as revopsModules from "@/components/activation/onboarding/role-domain/revops/modules";
import * as genericModules from "@/components/activation/onboarding/role-domain/business-ops/modules";
import * as bizopsDomainModules from "@/components/activation/onboarding/role-domain/bizops/modules";
import * as itAdminModules from "@/components/activation/onboarding/role-domain/it-admin/modules";
import * as serviceModules from "@/components/activation/onboarding/role-domain/service/modules";
import * as procurementModules from "@/components/activation/onboarding/role-domain/procurement/modules";
import * as studentTeacherModules from "@/components/activation/onboarding/role-domain/student-teacher/modules";
import * as financeModules from "@/components/activation/onboarding/role-domain/finance/modules";
import * as productEngineeringModules from "@/components/activation/onboarding/role-domain/product-engineering/modules";
import * as marketingModules from "@/components/activation/onboarding/role-domain/marketing/modules";

// ─── SHARED HELPERS ────────────────────────────────────────────────────────
const lazyCache = new Map<string, React.LazyExoticComponent<React.ComponentType<any>>>();

function wrapNamedExport(loader: () => Promise<any>): () => Promise<{ default: any }> {
  return async () => {
    const module = await loader();
    // Prefer explicit default export
    if (module.default) return { default: module.default };
    // No default export — find the first named export that's a React component (function)
    const namedExport = Object.values(module).find((v) => typeof v === "function");
    if (namedExport) return { default: namedExport };
    // Last resort: pass module itself (error boundary will catch)
    return { default: module };
  };
}

function getLazyComponent(
  cacheKey: string,
  loader: () => Promise<any>
): React.LazyExoticComponent<React.ComponentType<any>> {
  if (!lazyCache.has(cacheKey)) {
    lazyCache.set(cacheKey, React.lazy(wrapNamedExport(loader)));
  }
  return lazyCache.get(cacheKey)!;
}

// Standard domain modules pattern
const createDomainWithStandardModules = (
  baseModules: Record<string, () => Promise<any>>,
  happyPathModules?: Record<string, () => Promise<any>>
) => ({
  ...baseModules,
  ...happyPathModules,
  "fabric-admin": baseModules.fabricAdmin,
  settings: baseModules.settings,
});

// Standard happy path modules
const createHappyPathModules = (prefix: string, modules: any) => ({
  [`${prefix}-today`]: modules[`${prefix}Today`],
  [`${prefix}-queue`]: modules[`${prefix}Queue`],
  [`${prefix}-decisions`]: modules[`${prefix}Decisions`],
});

// ─── PATH VALIDATION ────────────────────────────────────────────────────────
function validateModulePaths() {
  const missingModules: string[] = [];

  // Check that all MODULE_PATH_MAP paths have corresponding modules
  const WORK_PATHS = [
    "/work/dashboard",
    "/work/projects",
    "/work/accounts",
    "/work/contacts",
    "/work/meetings",
    "/work/docs",
    "/work/tasks",
    "/work/calendar",
    "/work/notes",
    // Add more paths as needed
  ];

  const PERSONAL_PATHS = [
    "/personal/dashboard",
    "/personal/calendar",
    "/personal/notes",
    // Add more paths as needed
  ];

  // This validation would be expanded to check all paths
  // For now, it's a placeholder for future validation

  return missingModules;
}

// ─── DOMAIN CONTENT MAPS ─────────────────────────────────────────────────
// Each domain maps moduleId → lazy loader. No duplicates. Every view reachable.

// ─── Shared BI/BA loader — resolves to live D1-backed BiDashboard ────────────
const biDashboardLoader = () =>
  import("@/components/bi/bi-dashboard").then((m) => ({
    default: m.default,
  }));

// ─── Dedicated Layer Workbenches ────────────────────────────────────────────
// Customer Product (Intelligence Infrastructure):
//   L1 Workbench + L2 Overlay + L3 Twin + L4 Memory + L7 Approval Center (insights)
// Internal / Customer Zero only (full stack including execution):
//   + L5 Operations + L6 Execution
//
// Doctrine: IntegrateWise Collects / Understands / Remembers / Reasons / Proposes / Governs / Packages.
// Execution happens in the customer's environment (their Hermes, Claw, n8n, etc.).
// Twin produces formal "Execution Packages" as first-class handoff artifacts.
const LAYER_MODULES: Record<string, () => Promise<any>> = {
  twin: () =>
    import("@/components/l1/twin/twin-workbench").then((m) => ({ default: m.TwinWorkbench })),
  memory: () =>
    import("@/components/layers/l4-memory-hub").then((m) => ({ default: m.L4MemoryHub })),
  governance: () =>
    import("@/components/layers/l7-governance-workbench").then((m) => ({
      default: m.L7GovernanceWorkbench,
    })),
};

// Full layers (L5 + L6) only for IntegrateWise internal / Customer Zero showcase
const FULL_LAYER_MODULES: Record<string, () => Promise<any>> = {
  ...LAYER_MODULES,
  operations: () =>
    import("@/components/layers/l5-operations-workbench").then((m) => ({
      default: m.L5OperationsWorkbench,
    })),
  execution: () =>
    import("@/components/layers/l6-execution-workbench").then((m) => ({
      default: m.L6ExecutionWorkbench,
    })),
};

const CS_MAP: Record<string, () => Promise<any>> = {
  dashboard: csModules.dashboard,
  workbench: csModules.csWorkbench,
  "cs-today": csModules.csToday,
  accounts: csModules.accounts,
  contacts: csModules.contacts,
  "health-scores": csModules.healthScores,
  meetings: csModules.meetings,
  tasks: csModules.tasks,
  touchpoints: csModules.engagementLog,
  expansion: csModules.valueStreams,
  renewals: csModules.successPlans,
  risks: csModules.riskRegister,
  "at-risk": csModules.atRisk,
  "cs-decisions": csModules.decisionLog,
  docs: csModules.documents,
  analytics: genericModules.analyticsView,
  // BI/BA surface — live D1 data (Executive / Founder / Signals / Decisions)
  bi: biDashboardLoader,
  "business-intelligence": biDashboardLoader,
  workflows: genericModules.workflows,
  integrations: genericModules.integrations,
  "account-master": csModules.accountMaster,
  "api-portfolio": csModules.apiPortfolio,
  "business-context": csModules.businessContext,
  capabilities: csModules.capabilities,
  "company-growth": csModules.companyGrowth,
  initiatives: csModules.initiatives,
  insights: csModules.insights,
  "people-team": csModules.peopleTeam,
  "product-client": csModules.productClient,
  "stakeholder-outcomes": csModules.stakeholderOutcomes,
  "strategic-objectives": csModules.strategicObjectives,
  "task-manager": csModules.taskManager,
  "account-health": csModules.accountHealth,
  "account-team": csModules.accountTeam,
  "tasks-cards": csModules.tasksCards,
  calendar: genericModules.calendarView,
  "ai-chat": genericModules.aiChat,
  "fabric-admin": csModules.fabricAdmin,
  settings: csModules.settings,
  billing: genericModules.billing,
  // Product Views (Account Success Family)
  "csm-hub": csModules.csmAccountsHub,
  "intelligence-center": csModules.intelligenceCenter,
  "strategic-success": csModules.strategicAccountSuccess,
  // Adaptive Product Views
  "data-sentinel": csModules.dataSentinel,
  "vault-guard": csModules.vaultGuard,
  "architect-iq": csModules.architectIq,
  "template-forge": csModules.templateForge,
  "deal-desk": csModules.dealDesk,
  // Shared views
  "entity-browser": genericModules.entityBrowser,
  "entity-360": genericModules.entity360,
  "duplicate-resolution": genericModules.duplicateResolution,
};

const SALES_MAP: Record<string, () => Promise<any>> = {
  dashboard: salesModules.dashboard,
  pipeline: salesModules.pipeline,
  "pipeline-kanban": salesModules.pipelineKanban,
  deals: salesModules.deals,
  contacts: salesModules.contacts,
  activities: salesModules.activities,
  forecasting: salesModules.forecasting,
  quotes: salesModules.quotes,
  sequences: salesModules.sequences,
  "sales-analytics": salesModules.salesAnalytics,
  ...createHappyPathModules("sales", salesModules),
  billing: genericModules.billing,
  "ai-chat": genericModules.aiChat,
};

const MARKETING_MAP: Record<string, () => Promise<any>> = {
  dashboard: marketingModules.dashboard,
  campaigns: marketingModules.campaigns,
  leads: marketingModules.leads,
  analytics: marketingModules.marketingAnalytics,
  email: marketingModules.emailStudio,
  social: marketingModules.social,
  attribution: marketingModules.attribution,
  forms: marketingModules.forms,
  blog: marketingModules.blog,
  website: marketingModules.website,
  ...createHappyPathModules("marketing", marketingModules),
  billing: genericModules.billing,
  "ai-chat": genericModules.aiChat,
};

const REVOPS_MAP: Record<string, () => Promise<any>> = {
  dashboard: revopsModules.dashboard,
  pipeline: revopsModules.pipelineView,
  forecasting: revopsModules.forecastView,
  quotas: revopsModules.quotaView,
  analytics: revopsModules.analyticsView,
  cohorts: revopsModules.cohortView,
  team: revopsModules.teamView,
  metrics: revopsModules.metricsView,
  "pending-review": revopsModules.pendingReview,
  "decision-log": revopsModules.decisionLog,
  ...createHappyPathModules("revops", revopsModules),
  billing: genericModules.billing,
  "ai-chat": genericModules.aiChat,
};

const PE_MAP: Record<string, () => Promise<any>> = {
  dashboard: productEngineeringModules.dashboard,
  "incident-queue": productEngineeringModules.incidentQueue,
  roadmap: productEngineeringModules.roadmap,
  features: productEngineeringModules.features,
  bugs: productEngineeringModules.bugs,
  sprints: productEngineeringModules.sprints,
  tasks: productEngineeringModules.tasks,
  releases: productEngineeringModules.releases,
  analytics: productEngineeringModules.analytics,
  feedback: productEngineeringModules.feedback,
  ...createHappyPathModules("pe", productEngineeringModules),
  "fabric-admin": productEngineeringModules.fabricAdmin,
  settings: productEngineeringModules.settings,
  billing: genericModules.billing,
  "ai-chat": genericModules.aiChat,
};

const FINANCE_MAP: Record<string, () => Promise<any>> = {
  dashboard: financeModules.dashboard,
  revenue: financeModules.revenue,
  expenses: financeModules.expenses,
  reports: financeModules.reports,
  forecasting: financeModules.forecasting,
  budget: financeModules.budget,
  "invoice-approvals": financeModules.invoiceApprovals,
  "finance-today": financeModules.financeToday,
  "finance-queue": financeModules.financeStrategy,
  "finance-decisions": financeModules.financeDecisions,
  "data-governance": () =>
    import("@/components/l1/knowledge/document-governance-workbench").then((m) => ({
      default: m.DocumentGovernanceWorkbench,
    })),
  subscriptions: genericModules.billing,
  "ai-chat": genericModules.aiChat,
};

const SERVICE_MAP: Record<string, () => Promise<any>> = {
  dashboard: serviceModules.dashboard,
  "sla-dashboard": serviceModules.slaDashboard,
  tickets: serviceModules.tickets,
  customers: serviceModules.customers,
  knowledge: serviceModules.knowledge,
  analytics: serviceModules.analytics,
  satisfaction: serviceModules.satisfaction,
  ...createHappyPathModules("service", serviceModules),
  "fabric-admin": serviceModules.fabricAdmin,
  billing: genericModules.billing,
  "ai-chat": genericModules.aiChat,
};

const PROCUREMENT_MAP: Record<string, () => Promise<any>> = {
  dashboard: procurementModules.dashboard,
  renewals: procurementModules.renewals,
  vendors: procurementModules.vendors,
  orders: procurementModules.orders,
  contracts: procurementModules.contracts,
  spend: procurementModules.spend,
  savings: procurementModules.savings,
  ...createHappyPathModules("procurement", procurementModules),
  billing: genericModules.billing,
  "ai-chat": genericModules.aiChat,
};

const IT_ADMIN_MAP: Record<string, () => Promise<any>> = {
  dashboard: itAdminModules.dashboard,
  systems: itAdminModules.systems,
  incidents: itAdminModules.incidents,
  vulnerabilities: itAdminModules.vulnerabilities,
  certificates: itAdminModules.certificates,
  licenses: itAdminModules.licenses,
  "it-admin-today": itAdminModules.itAdminToday,
  "it-admin-queue": itAdminModules.itAdminQueue,
  "it-admin-decisions": itAdminModules.itAdminDecisions,
  billing: genericModules.billing,
  "ai-chat": genericModules.aiChat,
};

const STUDENT_TEACHER_MAP: Record<string, () => Promise<any>> = {
  dashboard: studentTeacherModules.dashboard,
  "at-risk": studentTeacherModules.atRisk,
  students: studentTeacherModules.students,
  courses: studentTeacherModules.courses,
  assignments: studentTeacherModules.assignments,
  gradebook: studentTeacherModules.gradebook,
  ...createHappyPathModules("student", studentTeacherModules),
  billing: genericModules.billing,
  "ai-chat": genericModules.aiChat,
};

const PERSONAL_MAP: Record<string, () => Promise<any>> = {
  dashboard: genericModules.personalDashboard,
  "hub-home": genericModules.hubHome,
  "hub-today": genericModules.hubToday,
  "founder-today": genericModules.founderToday,
  "founder-projects": genericModules.founderProjects,
  "founder-decisions": genericModules.founderDecisions,
  "knowledge-hub": genericModules.knowledgeHub,
  "whats-new": genericModules.whatsNew,
  tasks: genericModules.tasks,
  calendar: genericModules.calendarView,
  notes: genericModules.documents,
  projects: genericModules.workflows,
  docs: genericModules.documentStorage,
  bookmarks: genericModules.bookmarks,
  // Adaptive Product Views (Personal Space Surface)
  "wealth-pilot": genericModules.wealthPilot,
  "wellness-core": genericModules.wellnessCore,
  "learning-desk": genericModules.learningDesk,
  "relationship-map": genericModules.relationshipMap,
  "fabric-admin": genericModules.fabricAdmin,
  settings: genericModules.settings,
  billing: genericModules.billing,
  "ai-chat": genericModules.aiChat,
};

// ─── BIZOPS: Super-domain with cross-department access ──────────────────────
// BizOps users get their own domain-specific views PLUS access to every
// other department's views via prefixed moduleIds (e.g. "sales--pipeline").
function buildBizOpsMap(): Record<string, () => Promise<any>> {
  const crossDomainMaps: Record<string, Record<string, () => Promise<any>>> = {
    sales: SALES_MAP,
    cs: CS_MAP,
    revops: REVOPS_MAP,
    marketing: MARKETING_MAP,
    pe: PE_MAP,
    finance: FINANCE_MAP,
    service: SERVICE_MAP,
    procurement: PROCUREMENT_MAP,
    "it-admin": IT_ADMIN_MAP,
    "student-teacher": STUDENT_TEACHER_MAP,
  };

  const crossDomain: Record<string, () => Promise<any>> = {};
  for (const [prefix, map] of Object.entries(crossDomainMaps)) {
    for (const [key, loader] of Object.entries(map)) {
      if (key !== "fabric-admin" && key !== "settings") {
        crossDomain[`${prefix}--${key}`] = loader;
      }
    }
  }

  return {
    // BizOps domain-specific views (Spine + Recharts dashboard, domain views)
    dashboard: bizopsDomainModules.dashboard,
    "ops-command-center": bizopsDomainModules.opsCommandCenter,
    "strategic-hub": bizopsDomainModules.strategicHub,
    metrics: bizopsDomainModules.metricsView,
    crm: bizopsDomainModules.crmView,
    "sales-hub": bizopsDomainModules.salesHub,
    clients: bizopsDomainModules.clientsView,
    projects: bizopsDomainModules.bizopsProjects,
    workflows: bizopsDomainModules.bizopsWorkflows,
    analytics: bizopsDomainModules.bizopsAnalytics,
    accounts: bizopsDomainModules.bizopsAccounts,
    tasks: bizopsDomainModules.bizopsTasks,
    docs: bizopsDomainModules.bizopsDocs,
    // Generic utilities (no BizOps-specific version)
    calendar: genericModules.calendarView,
    integrations: genericModules.integrations,
    "workflow-canvas": genericModules.workflowCanvas,
    // Happy path
    "bizops-today": bizopsDomainModules.bizopsToday,
    "bizops-queue": bizopsDomainModules.bizopsQueue,
    "bizops-decisions": bizopsDomainModules.bizopsDecisions,
    // Executive Product Views
    "founder-ops": bizopsDomainModules.founderOps,
    "ceo-dashboard": bizopsDomainModules.ceoView,
    "coo-dashboard": bizopsDomainModules.cooView,
    "cio-cto-dashboard": bizopsDomainModules.cioCtoView,
    // 14-Department Unified Views
    "strategy-leadership": bizopsDomainModules.strategyLeadership,
    "operations-center": bizopsDomainModules.operationsCenter,
    "human-resources": bizopsDomainModules.humanResources,
    "legal-compliance": bizopsDomainModules.legalCompliance,
    "business-intelligence": bizopsDomainModules.businessIntelligence,
    partnerships: bizopsDomainModules.partnerships,
    "knowledge-management": bizopsDomainModules.knowledgeManagement,
    knowledge: () =>
      import("@/components/l1/knowledge/KnowledgeWorkbench").then((m) => ({
        default: m.KnowledgeWorkbench,
      })),
    "data-governance": () =>
      import("@/components/l1/knowledge/document-governance-workbench").then((m) => ({
        default: m.DocumentGovernanceWorkbench,
      })),
    "document-governance": () =>
      import("@/components/l1/knowledge/document-governance-workbench").then((m) => ({
        default: m.DocumentGovernanceWorkbench,
      })),
    // Adaptive Product Views (Business Ops Surface)
    "compliance-vault": bizopsDomainModules.complianceVault,
    "vendor-guard": bizopsDomainModules.vendorGuard,
    "partner-bridge": bizopsDomainModules.partnerBridge,
    "growth-desk": bizopsDomainModules.growthDesk,
    "hire-pilot": bizopsDomainModules.hirePilot,
    "fin-pulse": bizopsDomainModules.finPulse,
    // Shared views
    "entity-browser": genericModules.entityBrowser,
    "entity-360": genericModules.entity360,
    "duplicate-resolution": genericModules.duplicateResolution,
    // Cross-department access
    ...crossDomain,
    // System
    "fabric-admin": genericModules.fabricAdmin,
    settings: genericModules.settings,
    billing: genericModules.billing,
    // AI Chat (direct access — not just via cs--ai-chat cross-domain)
    "ai-chat": genericModules.aiChat,
  };
}

// Every domain gets the dedicated L3–L7 layer workbenches (Twin + Remember /
// Plan / Execute / Govern are universal intents, not domain features).
const withLayerModules = (
  map: Record<string, () => Promise<any>>,
  fullLayers = false
): Record<string, () => Promise<any>> => ({
  ...map,
  ...(fullLayers ? FULL_LAYER_MODULES : LAYER_MODULES),
});

// Precomputed maps per classification
const CUSTOMER_DOMAIN_CONTENT_MAP: Record<Domain, Record<string, () => Promise<any>>> = {
  CUSTOMER_SUCCESS: withLayerModules(CS_MAP, false),
  SALES: withLayerModules(SALES_MAP, false),
  MARKETING: withLayerModules(MARKETING_MAP, false),
  REVOPS: withLayerModules(REVOPS_MAP, false),
  PRODUCT_ENGINEERING: withLayerModules(PE_MAP, false),
  FINANCE: withLayerModules(FINANCE_MAP, false),
  SERVICE: withLayerModules(SERVICE_MAP, false),
  PROCUREMENT: withLayerModules(PROCUREMENT_MAP, false),
  IT_ADMIN: withLayerModules(IT_ADMIN_MAP, false),
  STUDENT_TEACHER: withLayerModules(STUDENT_TEACHER_MAP, false),
  BIZOPS: withLayerModules(buildBizOpsMap(), false),
  PERSONAL: withLayerModules(PERSONAL_MAP, false),
};

const FULL_DOMAIN_CONTENT_MAP: Record<Domain, Record<string, () => Promise<any>>> = {
  CUSTOMER_SUCCESS: withLayerModules(CS_MAP, true),
  SALES: withLayerModules(SALES_MAP, true),
  MARKETING: withLayerModules(MARKETING_MAP, true),
  REVOPS: withLayerModules(REVOPS_MAP, true),
  PRODUCT_ENGINEERING: withLayerModules(PE_MAP, true),
  FINANCE: withLayerModules(FINANCE_MAP, true),
  SERVICE: withLayerModules(SERVICE_MAP, true),
  PROCUREMENT: withLayerModules(PROCUREMENT_MAP, true),
  IT_ADMIN: withLayerModules(IT_ADMIN_MAP, true),
  STUDENT_TEACHER: withLayerModules(STUDENT_TEACHER_MAP, true),
  BIZOPS: withLayerModules(buildBizOpsMap(), true),
  PERSONAL: withLayerModules(PERSONAL_MAP, true),
};

// ─── UI COMPONENTS ────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-1/3 rounded bg-muted" />
      <div className="h-32 rounded bg-card border border-border shadow-xs" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded bg-card border border-border shadow-xs" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full p-12 font-iw-sans">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mx-auto shadow-xs">
          <span className="text-3xl opacity-60">📊</span>
        </div>
        <div className="font-medium text-muted-foreground">{message}</div>
      </div>
    </div>
  );
}

// ─── DOMAIN → CTXEnum MAPPING ─────────────────────────────────────────────────
// Maps Domain (workspace config) to CTXEnum (L2 spine types) for modules that
// need domain context as a prop (e.g. AIChat).
const DOMAIN_TO_CTX: Record<string, string> = {
  CUSTOMER_SUCCESS: "CTX_CS",
  SALES: "CTX_SALES",
  MARKETING: "CTX_MARKETING",
  REVOPS: "CTX_REVOPS",
  PRODUCT_ENGINEERING: "CTX_TECH",
  FINANCE: "CTX_FINANCE",
  SERVICE: "CTX_SUPPORT",
  PROCUREMENT: "CTX_SUPPLY_CHAIN",
  IT_ADMIN: "CTX_TECH",
  STUDENT_TEACHER: "CTX_CS",
  BIZOPS: "CTX_BIZOPS",
  PERSONAL: "CTX_PERSONAL",
};

// ─── OPTIMIZED CONTENT ROUTER COMPONENT ───────────────────────────────────────
export interface ContentRouterProps {
  domain: Domain;
  moduleId: string;
  dataContext?: ModuleData;
  forceRender?: boolean;
  userRole?: string;
  projectedModules?: Array<{ id: string; path: string }>;
  /**
   * fullLayers = true only for IntegrateWise internal / Customer Zero showcase.
   * Customers get: L1 + L2 + L3(Twin) + L4(Memory) + L7(Governance insights-only)
   * No L5 Operations, no L6 Execution.
   */
  fullLayers?: boolean;
}

export function ContentRouter({
  domain,
  moduleId,
  dataContext,
  forceRender = false,
  userRole,
  projectedModules,
  fullLayers = false,
}: ContentRouterProps) {
  const contentMap = fullLayers ? FULL_DOMAIN_CONTENT_MAP : CUSTOMER_DOMAIN_CONTENT_MAP;
  const componentLoader = contentMap[domain]?.[moduleId];

  if (!componentLoader) {
    return (
      <div className="flex items-center justify-center h-full p-12 font-iw-sans">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mx-auto shadow-xs">
            <span className="text-3xl opacity-60">🔍</span>
          </div>
          <div className="font-medium text-muted-foreground">Module not found</div>
          <div className="rounded bg-muted px-3 py-2 font-iw-mono text-xs text-muted-foreground/80 border border-border">
            {domain} / {moduleId}
          </div>
          <div className="text-xs text-muted-foreground/80">
            Use the sidebar or ⌘K to navigate to an available module
          </div>
        </div>
      </div>
    );
  }

  // Projection-based entitlement guard
  // Falls back to allowing all if projection data is not provided
  if (userRole && projectedModules && projectedModules.length > 0) {
    const canAccess =
      userRole === "owner" ||
      userRole === "admin" ||
      projectedModules.some((m) => m.id === moduleId || m.path.includes(moduleId));

    if (!canAccess) {
      return (
        <div className="flex items-center justify-center h-full p-12 font-iw-sans">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mx-auto shadow-xs">
              <span className="text-3xl opacity-60">🔒</span>
            </div>
            <div className="font-medium text-muted-foreground">Not entitled</div>
            <div className="text-xs text-muted-foreground/80">
              This module is not available in your current plan or role.
            </div>
          </div>
        </div>
      );
    }
  }

  if (dataContext && !forceRender) {
    const render = shouldRenderModule(dataContext, domain, "default");
    if (!render) {
      const message = getEmptyStateMessage(dataContext);
      return <EmptyState message={message} />;
    }
  }

  const cacheKey = `${domain}::${moduleId}`;
  const LazyComponent = getLazyComponent(cacheKey, componentLoader);

  // Modules that need domain context as props (e.g. AIChat needs activeCtx)
  // Always pass domain so L1 dashboards / views load data scoped to the single chosen work domain (or PERSONAL).
  const moduleProps: Record<string, any> = {
    domain,
    fullLayers,
    insightsOnly: !fullLayers,
    ...(moduleId === "ai-chat" || moduleId.endsWith("--ai-chat")
      ? { activeCtx: DOMAIN_TO_CTX[domain] || "CTX_CS" }
      : {}),
  };

  return (
    <ModuleErrorBoundary moduleId={moduleId}>
      <Suspense fallback={<LoadingSkeleton />}>
        <LazyComponent {...moduleProps} />
      </Suspense>
    </ModuleErrorBoundary>
  );
}
