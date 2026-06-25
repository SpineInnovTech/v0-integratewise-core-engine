/**
 * Workspace Shell (NEW ARCHITECTURE)
 *
 * 2 Views: Personal | Work
 * - Personal: Same for everyone (tasks, calendar, notes)
 * - Work: Domain-specific content (role-based)
 * - Team: IGNORED FOR NOW (appears only when org adopts)
 *
 * Navigation: Header tabs (not sidebar context switcher)
 * AI Layer: Hidden by default (Cmd+K only)
 *
 * Content: Rendered via ContentRouter (lazy-loaded, density-gated)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn, StaggerChildren, StaggerItem, SlideUp, ScaleIn } from "@/components/common/motion";
import { apiFetch } from "@/lib/api-client";
import {
  LayoutDashboard,
  Search,
  Bell,
  User as UserIcon,
  Command,
  CheckSquare,
  CheckCircle,
  Calendar,
  CalendarDays,
  StickyNote,
  FileText,
  Briefcase,
  Bookmark,
  Home,
  Building2,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Code,
  Mail,
  ShoppingCart,
  Wrench,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Activity,
  MessageSquare,
  Phone,
  RefreshCw,
  AlertTriangle,
  Map as MapIcon,
  Shield,
  Plug,
  BookOpen,
  Heart,
  Zap,
  Repeat,
  Package,
  GitBranch,
  CreditCard,
  PieChart,
  Share2,
  Globe,
  Award,
  ShieldCheck,
  Ticket,
  TrendingDown,
  FormInput,
  FilePen,
  HeartPulse,
  ChevronDown,
  Bot,
  ExternalLink,
  Brain,
} from "lucide-react";
import { LogoMark } from "@/components/common/brand/logo";
import { CommandPalette } from "../navigation/command-palette";
import { NotificationCenter } from "../notifications/notification-center";
import type { Domain } from "./workspace-config";
import { getDomainConfig, getWorkNavigation, getPersonalNavigation } from "./workspace-config";
import { ContentRouter } from "./content-router";
import { AnimatedContentRouter, FadeInSection } from "./animated-content-router";
import { useModuleDataContext } from "@/hooks/use-module-data-context";
import { L2DrawerProvider } from "@/components/l2/cognitive/l2-drawer-animated";
import { useFabricStatus, useScopedSlots } from "@/components/core/hydration";
import { useTenantProducts, useProductNav } from "@/hooks/use-tenant-products";
import { useDemoData } from "@/hooks/use-demo-data";
import { useProjection, buildNavFromProjection } from "@/lib/projection";
import { DemoDataBanner } from "./demo-data-banner";

// ─── Stream C: Surface Shells ───────────────────────────────────────────────
import { PersonalShell } from "@/components/shells/PersonalShell";
import { WorkShell } from "@/components/shells/WorkShell";
import { GovernanceOverlay } from "@/components/shells/shared/GovernanceOverlay";
import { openTwinWorkbench } from "@/lib/twin-handoff";
import { InsightPopupProvider } from "@/components/l2/insights/insight-popup-provider";
import type { InsightPopup } from "@/components/l2/insights/types";
import type { DepartmentWorkbenchMetric } from "@/components/workbench/department-workbench";

export type WorkspaceView = "PERSONAL" | "WORK" | Domain;

interface WorkspaceShellNewProps {
  domain: Domain;
  userName: string;
  department?: string;
  userRole?: string;
  initialView?: WorkspaceView;
  initialPath?: string;
  useCase?: "personal" | "work" | "business";
  onLogout?: () => void;
}

// ─── ICON MAP ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  CheckSquare,
  CheckCircle,
  Calendar,
  CalendarDays,
  StickyNote,
  FileText,
  Briefcase,
  Bookmark,
  Building2,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Code,
  Mail,
  ShoppingCart,
  Wrench,
  GraduationCap,
  BarChart3,
  Home,
  Activity,
  MessageSquare,
  Phone,
  RefreshCw,
  AlertTriangle,
  Map: MapIcon,
  Shield,
  Plug,
  BookOpen,
  Heart,
  Zap,
  Repeat,
  Package,
  GitBranch,
  CreditCard,
  PieChart,
  Share2,
  Globe,
  Award,
  ShieldCheck,
  Ticket,
  TrendingDown,
  FormInput,
  FileEdit: FilePen,
  HeartPulse,
  // L4–L7 layer workbench icons
  Brain,
};

const MODULE_PATH_MAP: Record<string, string> = {
  Home: "/work/dashboard",
  Projects: "/work/projects",
  Accounts: "/work/accounts",
  Account: "/work/accounts",
  Contacts: "/work/contacts",
  Contact: "/work/contacts",
  Meetings: "/work/meetings",
  Docs: "/work/docs",
  Tasks: "/work/tasks",
  Calendar: "/personal/calendar",
  Notes: "/personal/notes",
  "Knowledge Space": "/work/docs",
  Team: "/work/team",
  Pipeline: "/work/pipeline",
  Risks: "/work/risks",
  Expansion: "/work/expansion",
  Analytics: "/work/analytics",
  "Business Intelligence": "/work/bi",
  "AI Chat": "/work/ai-chat",
  Settings: "/work/settings",
  Subscriptions: "/work/subscriptions",
  Profile: "/personal/dashboard",
  Campaigns: "/work/campaigns",
  Workflows: "/work/workflows",
  Deals: "/work/deals",
  Forecasting: "/work/forecasting",
  Activities: "/work/activities",
  Quotes: "/work/quotes",
  Attribution: "/work/attribution",
  Forms: "/work/forms",
  Social: "/work/social",
  "Email Studio": "/work/email",
  Blog: "/work/blog",
  SEO: "/work/seo",
  "Media Library": "/work/media",
  Pages: "/work/pages",
  Theme: "/work/theme",
  Website: "/work/website",
  RBAC: "/work/permissions",
  Approvals: "/work/compliance",
  Admin: "/work/users",
  "Account Health": "/work/account-health",
  "Account Team": "/work/account-team",
  "Tasks & Actions": "/work/tasks-cards",
  "Hub Home": "/personal/hub-home",
  Today: "/personal/hub-today",
  "Knowledge Hub": "/personal/knowledge-hub",
  "Pending review": "/work/pending-review",
  "Decision log": "/work/decision-log",
  "Revenue Command Center": "/work/revenue-command",
  "Pipeline Forecasting": "/work/pipeline-forecasting",
  Collections: "/work/collections",
  "Payment Portal": "/work/payment-portal",
  Compliance: "/work/compliance",
  "Data Governance": "/work/data-governance",
  "Invoice Approvals": "/work/invoice-approvals",
  Integrations: "/work/integrations",
  Knowledge: "/work/knowledge",
  "Entity 360": "/work/entity-360",
  "Duplicate Resolution": "/work/duplicate-resolution",
  "CEO View": "/work/ceo-view",
  "COO View": "/work/coo-view",
  "CIO / CTO View": "/work/cio-cto-view",
  Billing: "/work/billing",
  Accounting: "/work/accounting",
  "Tax Compliance": "/work/tax",
  Payroll: "/work/payroll",
  "Pipeline View": "/work/pipeline-view",
  Inventory: "/work/inventory",
  "Incident Queue": "/work/incident-queue",
  "Ops Command Center": "/work/ops-command-center",
  "SLA Dashboard": "/work/sla-dashboard",
  Renewals: "/work/renewals",
  "At-risk students": "/work/at-risk",
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const DEFAULT_WORK_PATH = "/work/dashboard";
const DEFAULT_PERSONAL_PATH = "/personal/dashboard";

function normalizeNavigationToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\/app\//, "")
    .replace(/^\//, "")
    .replace(/\?.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function WorkspaceShellNew({
  domain,
  userName,
  department,
  userRole,
  initialView = "WORK",
  initialPath,
  useCase = "work",
  onLogout,
}: WorkspaceShellNewProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const pathFromUrl = (() => {
    const p = location.pathname;
    const fullPath = `${location.pathname}${location.search}`;
    if (p === "/app/settings") return "/work/settings";
    if (p.startsWith("/app/work/") || p.startsWith("/app/personal/")) {
      return fullPath.replace(/^\/app/, ""); // "/app/work/dashboard?x=1" -> "/work/dashboard?x=1"
    }
    return null;
  })();

  const defaultPath = initialView === "PERSONAL" ? DEFAULT_PERSONAL_PATH : DEFAULT_WORK_PATH;
  const [activeView, setActiveView] = useState<WorkspaceView>(initialView);
  const [activePath, setActivePath] = useState(pathFromUrl || initialPath || defaultPath);

  // Domain is IMMUTABLE — always the user's role domain from onboarding.
  // Users do not switch between domains. They switch between Work and Personal views only.
  // activeDomain is only kept as a ref to domain prop for contentDomain derivation.
  const activeDomain = domain;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync URL when activePath changes (e.g. nav click)
  useEffect(() => {
    const targetPath = `/app${activePath}`;
    const currentPath = `${location.pathname}${location.search}`;
    if (currentPath !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [activePath, navigate, location.pathname, location.search]);

  // Sync activePath when URL changes externally (e.g. browser back, deep link)
  useEffect(() => {
    if (pathFromUrl && pathFromUrl !== activePath) {
      setActivePath(pathFromUrl);
      if (pathFromUrl.startsWith("/personal")) setActiveView("PERSONAL");
      else if (pathFromUrl.startsWith("/work")) setActiveView("WORK");
    }
  }, [pathFromUrl, activePath]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [governanceOverlayOpen, setGovernanceOverlayOpen] = useState(false);
  const [governanceScope, setGovernanceScope] = useState<"all" | "personal" | "org">("all");
  const [signalCount, setSignalCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Fetch signal count for notification badge
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await apiFetch<{ signal_count?: number; unread_count?: number; data?: any[] }>(
          `/api/v1/intelligence/signals?limit=1&domain=${activeDomain}`,
          {},
          "SignalCount"
        );
        setSignalCount(res.unread_count ?? res.signal_count ?? res.data?.length ?? 0);
      } catch {
        /* silent */
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // Hydration Fabric status — live indicator in header
  const fabricStatus = useFabricStatus();

  // Demo data banner — shown when tenant has seed data
  const { hasDemoData, isCleaning, cleanup: cleanupDemoData } = useDemoData();

  // Scoped slots for view-based data routing
  // Each view loads only its relevant slots (personal, work, or team)
  const personalSlots = useScopedSlots("personal");
  const workSlots = useScopedSlots("work");
  const teamSlots = useScopedSlots("team");

  // ─── Projection-based navigation ───────────────────────────────────────
  // Doctrine: Sidebar must consume projected modules, not raw product nav.
  // Single authority: seed projection with the gateway-resolved domain/department
  // (passed from AppShell) so the nav cannot diverge from the workbench/content.
  const projection = useProjection({ department, domain: activeDomain });

  // Build projection-native nav sections (Three Doors: Dept / Org / Personal)
  const projectionNativeNav = buildNavFromProjection(
    projection,
    activeView === "PERSONAL" ? "PERSONAL" : "WORK",
    { includeCrossDept: true, maxCrossDepth: 3 }
  );

  // ─── Product-based navigation (legacy fallback) ──────────────────────────
  // Load the tenant's assigned products and their nav items from DB.
  const { workProduct, personalProduct } = useTenantProducts();
  const { navSections: workProductNav } = useProductNav(workProduct?.product_id ?? null);
  const { navSections: personalProductNav } = useProductNav(personalProduct?.product_id ?? null);

  // For display logic
  const domainConfig = getDomainConfig(activeDomain);

  // Navigation priority: projection-native > product > domain
  const domainWorkNav = getWorkNavigation(activeDomain, false); // customer default: no ops/execution
  const domainPersonalNav = getPersonalNavigation();
  const currentNav =
    activeView === "PERSONAL"
      ? projectionNativeNav.length > 0
        ? projectionNativeNav
        : personalProductNav.length > 0
          ? personalProductNav
          : domainPersonalNav
      : projectionNativeNav.length > 0
        ? projectionNativeNav
        : workProductNav.length > 0
          ? workProductNav
          : domainWorkNav;
  const navigationPathIndex = useMemo(() => {
    const index = new Map<string, string>();
    const add = (key: string | undefined, path: string) => {
      if (!key) return;
      const normalized = normalizeNavigationToken(key);
      if (!normalized || index.has(normalized)) return;
      index.set(normalized, path);
    };

    Object.entries(MODULE_PATH_MAP).forEach(([key, path]) => add(key, path));
    currentNav.forEach((section) => {
      section.items.forEach((item) => {
        add(item.id, item.path);
        add(item.label, item.path);
        add(item.path, item.path);
      });
    });

    return index;
  }, [currentNav]);

  // Extract moduleId from activePath: "/work/dashboard?foo=bar" → "dashboard"
  const modulePath = activePath.split("?")[0];
  const moduleId = modulePath.split("/").pop() || "dashboard";
  // For content routing, personal view uses PERSONAL domain
  const contentDomain = activeView === "PERSONAL" ? ("PERSONAL" as Domain) : activeDomain;

  // Density-gated rendering: compute data context for the active module
  const moduleDataContext = useModuleDataContext(contentDomain, moduleId);

  // ─── View Scope Documentation ──────────────────────────────────────────────
  // The workspace uses view-scoped slot loading for data optimization:
  //
  // PERSONAL view: Loads only personal slots (tasks, calendar, notes)
  //   - Same for all users regardless of domain
  //   - Typical slots: {tasks, calendar, notes, dashboard}
  //
  // WORK view: Loads domain-specific work slots
  //   - Content varies by domain (SALES, CS, REVOPS, etc.)
  //   - Typical slots: {signals, entities, knowledge, goals, connectors}
  //
  // TEAM view: Loads organization-level collaboration data
  //   - Presence and activity feeds shared across org
  //   - Typical slots: {team.presence, team.activity}
  // ─────────────────────────────────────────────────────────────────────────

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = () => setUserMenuOpen(false);
    const timer = setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [userMenuOpen]);

  const resolveNavigationTarget = useCallback(
    (value: string) => {
      if (value.startsWith("/")) return value;

      const normalized = normalizeNavigationToken(value);
      if (!normalized) return DEFAULT_WORK_PATH;

      const exact = navigationPathIndex.get(normalized);
      if (exact) return exact;

      const singularOrPlural = normalized.endsWith("s")
        ? normalized.slice(0, -1)
        : `${normalized}s`;
      const fallback = navigationPathIndex.get(singularOrPlural);
      if (fallback) return fallback;

      return DEFAULT_WORK_PATH;
    },
    [navigationPathIndex]
  );

  const handleNavigate = useCallback(
    (pathOrModule: string) => {
      const path = resolveNavigationTarget(pathOrModule);
      setActivePath(path);
      const pathRoot = path.split("?")[0];
      // Determine view from path
      if (pathRoot.startsWith("/personal")) {
        setActiveView("PERSONAL");
      } else if (pathRoot.startsWith("/work")) {
        setActiveView("WORK");
      }
    },
    [resolveNavigationTarget]
  );

  const handleDeepDive = useCallback(
    (target: string) => {
      // Maps landing use cases + command palette deep dives to workspace paths
      const deepDivePathMap: Record<string, string> = {
        "account-success": "/work/accounts",
        "customer-success": "/work/accounts",
        personal: "/personal/dashboard",
        revops: "/work/revenue",
        salesops: "/work/pipeline",
        sales: "/work/pipeline",
        marketing: "/work/campaigns",
        product: "/work/roadmap",
        bizops: "/work/projects",
        finance: "/work/revenue",
      };
      handleNavigate(deepDivePathMap[target] || "/work/dashboard");
    },
    [handleNavigate]
  );

  // Insight popup action handlers
  const handleInsightAct = useCallback((popup: InsightPopup) => {
    // Open governance overlay for approval
    setGovernanceOverlayOpen(true);
  }, []);

  const handleInsightAskTwin = useCallback(
    (popup: InsightPopup) => {
      openTwinWorkbench({
        entityId: popup.entityId,
        entityType: popup.entityType,
        entityName: popup.entityName,
        domain: contentDomain,
        insightTitle: popup.title,
        source: "insight",
      });
    },
    [contentDomain]
  );

  // ─── Workbench config mapping (domain → DepartmentWorkbench props) ─────────
  const workbenchConfig = useMemo(() => {
    const defaults: Record<
      string,
      {
        department: string;
        title: string;
        entityTypes: string[];
        metrics: DepartmentWorkbenchMetric[];
      }
    > = {
      CUSTOMER_SUCCESS: {
        department: "CUSTOMER_SUCCESS",
        title: "Account Success",
        entityTypes: [
          "account",
          "contact",
          "success_plan",
          "risk",
          "generated_insight",
          "task",
          "engagement",
        ],
        metrics: [
          {
            id: "total-arr",
            label: "Total ARR",
            entityType: "account",
            field: "arr",
            type: "currency",
            icon: <TrendingUp className="w-4 h-4" />,
          },
          {
            id: "active-accounts",
            label: "Active Accounts",
            entityType: "account",
            field: "id",
            type: "number",
            icon: <Users className="w-4 h-4" />,
          },
          {
            id: "at-risk",
            label: "At Risk",
            entityType: "risk",
            field: "id",
            type: "number",
            icon: <AlertTriangle className="w-4 h-4" />,
          },
          {
            id: "avg-health",
            label: "Avg Health",
            entityType: "account",
            field: "health_score",
            type: "percentage",
            icon: <HeartPulse className="w-4 h-4" />,
          },
        ],
      },
      BIZOPS: {
        department: "BIZOPS",
        title: "Business Operations",
        entityTypes: ["account", "contact", "project", "task", "opportunity"],
        metrics: [
          {
            id: "accounts",
            label: "Accounts",
            entityType: "account",
            field: "id",
            type: "number",
            icon: <Building2 className="w-4 h-4" />,
          },
          {
            id: "contacts",
            label: "Contacts",
            entityType: "contact",
            field: "id",
            type: "number",
            icon: <Users className="w-4 h-4" />,
          },
          {
            id: "projects",
            label: "Projects",
            entityType: "project",
            field: "id",
            type: "number",
            icon: <Target className="w-4 h-4" />,
          },
          {
            id: "tasks",
            label: "Tasks",
            entityType: "task",
            field: "id",
            type: "number",
            icon: <CheckSquare className="w-4 h-4" />,
          },
        ],
      },
      SALES: {
        department: "SALES",
        title: "Sales",
        entityTypes: ["account", "contact", "opportunity", "task"],
        metrics: [
          {
            id: "pipeline",
            label: "Pipeline",
            entityType: "opportunity",
            field: "amount",
            type: "currency",
            icon: <TrendingUp className="w-4 h-4" />,
          },
          {
            id: "deals",
            label: "Deals",
            entityType: "opportunity",
            field: "id",
            type: "number",
            icon: <DollarSign className="w-4 h-4" />,
          },
          {
            id: "accounts",
            label: "Accounts",
            entityType: "account",
            field: "id",
            type: "number",
            icon: <Building2 className="w-4 h-4" />,
          },
          {
            id: "activities",
            label: "Activities",
            entityType: "task",
            field: "id",
            type: "number",
            icon: <Activity className="w-4 h-4" />,
          },
        ],
      },
      MARKETING: {
        department: "MARKETING",
        title: "Marketing",
        entityTypes: ["campaign", "lead", "contact", "task"],
        metrics: [
          {
            id: "campaigns",
            label: "Campaigns",
            entityType: "campaign",
            field: "id",
            type: "number",
            icon: <Target className="w-4 h-4" />,
          },
          {
            id: "leads",
            label: "Leads",
            entityType: "lead",
            field: "id",
            type: "number",
            icon: <Users className="w-4 h-4" />,
          },
          {
            id: "mqls",
            label: "MQLs",
            entityType: "lead",
            field: "mql_count",
            type: "number",
            icon: <TrendingUp className="w-4 h-4" />,
          },
          {
            id: "spend",
            label: "Spend",
            entityType: "campaign",
            field: "budget",
            type: "currency",
            icon: <DollarSign className="w-4 h-4" />,
          },
        ],
      },
      REVOPS: {
        department: "REVOPS",
        title: "Revenue Operations",
        entityTypes: ["account", "opportunity", "forecast", "task"],
        metrics: [
          {
            id: "arr",
            label: "ARR",
            entityType: "account",
            field: "arr",
            type: "currency",
            icon: <DollarSign className="w-4 h-4" />,
          },
          {
            id: "pipeline",
            label: "Pipeline",
            entityType: "opportunity",
            field: "amount",
            type: "currency",
            icon: <TrendingUp className="w-4 h-4" />,
          },
          {
            id: "forecast",
            label: "Forecast",
            entityType: "forecast",
            field: "value",
            type: "currency",
            icon: <BarChart3 className="w-4 h-4" />,
          },
          {
            id: "quota",
            label: "Quota Attainment",
            entityType: "opportunity",
            field: "quota",
            type: "percentage",
            icon: <Target className="w-4 h-4" />,
          },
        ],
      },
      FINANCE: {
        department: "FINANCE",
        title: "Finance",
        entityTypes: ["account", "invoice", "payment", "task"],
        metrics: [
          {
            id: "revenue",
            label: "Revenue",
            entityType: "account",
            field: "arr",
            type: "currency",
            icon: <DollarSign className="w-4 h-4" />,
          },
          {
            id: "invoices",
            label: "Invoices",
            entityType: "invoice",
            field: "id",
            type: "number",
            icon: <FileText className="w-4 h-4" />,
          },
          {
            id: "collections",
            label: "Collections",
            entityType: "payment",
            field: "amount",
            type: "currency",
            icon: <CreditCard className="w-4 h-4" />,
          },
          {
            id: "renewals",
            label: "Renewals",
            entityType: "account",
            field: "renewal_date",
            type: "number",
            icon: <RefreshCw className="w-4 h-4" />,
          },
        ],
      },
      PRODUCT_ENGINEERING: {
        department: "PRODUCT_ENGINEERING",
        title: "Product & Engineering",
        entityTypes: ["project", "task", "bug", "feature"],
        metrics: [
          {
            id: "sprints",
            label: "Sprints",
            entityType: "project",
            field: "id",
            type: "number",
            icon: <GitBranch className="w-4 h-4" />,
          },
          {
            id: "bugs",
            label: "Bugs",
            entityType: "bug",
            field: "id",
            type: "number",
            icon: <AlertTriangle className="w-4 h-4" />,
          },
          {
            id: "features",
            label: "Features",
            entityType: "feature",
            field: "id",
            type: "number",
            icon: <Zap className="w-4 h-4" />,
          },
          {
            id: "velocity",
            label: "Velocity",
            entityType: "project",
            field: "velocity",
            type: "number",
            icon: <TrendingUp className="w-4 h-4" />,
          },
        ],
      },
      SERVICE: {
        department: "SERVICE",
        title: "Service & Support",
        entityTypes: ["ticket", "contact", "account", "task"],
        metrics: [
          {
            id: "tickets",
            label: "Tickets",
            entityType: "ticket",
            field: "id",
            type: "number",
            icon: <Ticket className="w-4 h-4" />,
          },
          {
            id: "csat",
            label: "CSAT",
            entityType: "ticket",
            field: "csat",
            type: "percentage",
            icon: <Heart className="w-4 h-4" />,
          },
          {
            id: "response",
            label: "Response Time",
            entityType: "ticket",
            field: "response_time",
            type: "number",
            icon: <Activity className="w-4 h-4" />,
          },
          {
            id: "accounts",
            label: "Accounts",
            entityType: "account",
            field: "id",
            type: "number",
            icon: <Building2 className="w-4 h-4" />,
          },
        ],
      },
    };

    return (
      defaults[activeDomain] || {
        department: activeDomain,
        title: activeDomain.replace(/_/g, " "),
        entityTypes: ["account", "contact", "task", "opportunity"],
        metrics: [
          {
            id: "accounts",
            label: "Accounts",
            entityType: "account",
            field: "id",
            type: "number",
            icon: <Building2 className="w-4 h-4" />,
          },
          {
            id: "contacts",
            label: "Contacts",
            entityType: "contact",
            field: "id",
            type: "number",
            icon: <Users className="w-4 h-4" />,
          },
          {
            id: "tasks",
            label: "Tasks",
            entityType: "task",
            field: "id",
            type: "number",
            icon: <CheckSquare className="w-4 h-4" />,
          },
          {
            id: "opportunities",
            label: "Opportunities",
            entityType: "opportunity",
            field: "id",
            type: "number",
            icon: <TrendingUp className="w-4 h-4" />,
          },
        ],
      }
    );
  }, [activeDomain]);

  return (
    <L2DrawerProvider>
      <div
        className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-iw-sans"
        style={{ fontFamily: "var(--font-iw-sans)" }}
        /* Single-authority observability: the one projection context every surface reads. */
        data-iw-projection-department={projection.user.department}
        data-iw-active-domain={activeDomain}
      >
        {/* ─── ENHANCED LEFT SIDEBAR ─────────────────────────────────────────────── */}
        <aside className="w-[260px] border-r border-border bg-card flex flex-col shrink-0 z-20">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
            <LogoMark size={24} />
            <span className="ml-2 font-bold text-foreground tracking-tight text-lg">
              IntegrateWise
            </span>
          </div>

          {/* Workspace / View Selector — 2 options only: Work (role domain) + Personal */}
          {/* Domain is LOCKED to the user's role. No domain switching. */}
          <div className="p-4 border-b border-border shrink-0 relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between group hover:bg-muted p-1.5 -m-1.5 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 border border-white/20 shadow-md"
                  style={{
                    background:
                      activeView === "PERSONAL"
                        ? "linear-gradient(135deg, #b8943f, #c79f4a)"
                        : domainConfig.theme.accentGradient,
                  }}
                >
                  <span className="text-white text-base">
                    {activeView === "PERSONAL" ? "🧑‍💻" : domainConfig.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[13px] font-bold text-foreground">
                    {activeView === "PERSONAL" ? "Personal" : domainConfig.label}
                  </div>
                  <div className="truncate text-[9px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">
                    {activeView === "PERSONAL" ? "PRIVATE SPACE" : "WORKSPACE"}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            {/* Dropdown — exactly 2 options: Personal Space + Work (role domain) */}
            {isDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-4 right-4 bg-card border border-border shadow-lg rounded-xl overflow-hidden z-50 py-1">
                {/* Work view — always the user's role domain, never switchable */}
                <button
                  onClick={() => {
                    setActiveView("WORK");
                    setActivePath(DEFAULT_WORK_PATH);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-muted min-h-[44px] ${activeView === "WORK" ? "bg-muted" : ""}`}
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-xs shadow-sm"
                    style={{ background: domainConfig.theme.accentGradient }}
                  >
                    {domainConfig.icon}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-foreground">
                      {workProduct?.display_name ?? domainConfig.label}
                    </div>
                    <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                      Work
                    </div>
                  </div>
                </button>

                {/* Personal view — private space, same for every user */}
                <button
                  onClick={() => {
                    setActiveView("PERSONAL");
                    setActivePath(DEFAULT_PERSONAL_PATH);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-muted min-h-[44px] ${activeView === "PERSONAL" ? "bg-muted" : ""}`}
                >
                  <div className="w-6 h-6 rounded bg-linear-to-br from-iw-forest to-iw-gold flex items-center justify-center text-xs shadow-sm">
                    🧑‍💻
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-foreground">
                      {personalProduct?.display_name ?? "Personal"}
                    </div>
                    <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                      Personal Space
                    </div>
                  </div>
                </button>
              </div>
            )}
            {/* Overlay to close dropdown */}
            {isDropdownOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 flex flex-col">
            {currentNav.map((section, idx) => (
              <div key={section.label || idx} className="mb-6 last:mb-0">
                <div className="px-6 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {section.label}
                </div>
                <div className="space-y-0.5 px-3">
                  {section.items.map((item) => {
                    const Icon = ICON_MAP[item.icon] || Home;
                    const isActive = activePath === item.path;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 group ${
                          isActive
                            ? "font-bold text-primary-foreground bg-primary shadow-sm"
                            : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${isActive ? "opacity-100" : "opacity-70"}`}
                        />
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-destructive text-destructive-foreground shadow-sm">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* L2 insights + L3 Twin workbench */}
            <div className="mt-6 px-3 pb-2 shrink-0 space-y-1">
              <button
                onClick={() =>
                  openTwinWorkbench({
                    domain: contentDomain,
                    source: "sidebar",
                  })
                }
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-bold text-primary hover:bg-primary/10 transition-colors border border-primary/20"
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4" />
                  <span>Twin</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-cognitive-layer"))}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-bold text-destructive hover:bg-destructive/10 transition-colors"
                style={{ background: "rgba(139, 32, 32, 0.05)" }}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4" />
                  <span>Insights (L2)</span>
                </div>
                <span className="text-[10px] bg-destructive/10 px-1.5 py-0.5 rounded text-destructive opacity-80">
                  ⌘J
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Profile Block */}
          <div className="p-4 border-t border-border shrink-0 bg-muted/40">
            <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[13px] font-bold shadow-inner">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-foreground truncate">{userName}</div>
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider truncate mt-0.5">
                  {department || "OPERATIONS LEAD"}
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors pl-1 uppercase tracking-wider"
            >
              <LogOut className="w-3.5 h-3.5" />
              Back to Site
            </button>
          </div>
        </aside>

        {/* ─── RIGHT MAIN AREA ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-card shrink-0 z-10 transition-all">
            {/* Left: Breadcrumbs */}
            <div className="flex items-center gap-2.5">
              <span className="text-muted-foreground font-semibold text-[13px]">Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-border" />
              <span className="text-foreground font-bold text-[13px]">
                {moduleId === "dashboard"
                  ? "Home"
                  : moduleId.charAt(0).toUpperCase() + moduleId.slice(1).replace("-", " ")}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-5">
              {/* Search */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-full border border-border bg-muted/40 text-muted-foreground hover:border-border/80 transition-colors group"
              >
                <Search className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                <span className="text-[12.5px] font-medium mr-16">Search everything...</span>
                <span className="text-[10px] font-bold bg-card text-muted-foreground border border-border shadow-sm rounded px-1.5 py-0.5">
                  ⌘K
                </span>
              </button>

              {/* Governance */}
              <button
                onClick={() => setGovernanceOverlayOpen(true)}
                className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Governance"
              >
                <Shield className="w-4 h-4" />
              </button>

              {/* Notifications */}
              <button
                onClick={() => setNotificationOpen(true)}
                className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {signalCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive border border-card flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">
                      {signalCount > 99 ? "99+" : signalCount}
                    </span>
                  </div>
                )}
              </button>

              {/* Pill Profile */}
              <div className="flex items-center gap-2.5 pl-5 border-l border-border cursor-pointer group">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                    {department || "OPERATIONS LEAD"}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2.5 border border-transparent group-hover:border-border transition-colors bg-muted/40">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[12.5px] font-bold text-foreground">{userName}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Demo Data Banner — shown when tenant has sample data */}
          {hasDemoData && <DemoDataBanner onCleanup={cleanupDemoData} isCleaning={isCleaning} />}

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            <InsightPopupProvider
              domain={contentDomain}
              moduleId={moduleId}
              onAct={handleInsightAct}
              onAskTwin={handleInsightAskTwin}
            >
              <main className="flex-1 overflow-hidden bg-background">
                {activeView === "PERSONAL" ? (
                  <PersonalShell
                    moduleId={moduleId}
                    domain={contentDomain}
                    dataContext={moduleDataContext}
                    userRole={userRole}
                    fullLayers={true} // CZ full layers for demo
                  />
                ) : (
                  <WorkShell
                    {...workbenchConfig}
                    moduleId={moduleId}
                    domain={contentDomain}
                    dataContext={moduleDataContext}
                    userRole={userRole}
                    fullLayers={true} // CZ: full L5/L6 for end-to-end with real handoffs
                  />
                )}
              </main>
            </InsightPopupProvider>
          </div>
        </div>

        {/* Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onNavigate={handleNavigate}
          onDeepDive={handleDeepDive}
        />

        {/* Notifications */}
        <NotificationCenter
          isOpen={notificationOpen}
          onClose={() => setNotificationOpen(false)}
          onNavigate={(module) => handleNavigate(module)}
        />

        {/* Governance Overlay — unified approvals & execution stream */}
        <GovernanceOverlay
          isOpen={governanceOverlayOpen}
          onClose={() => setGovernanceOverlayOpen(false)}
          scope={governanceScope}
          onScopeChange={setGovernanceScope}
        />
      </div>
    </L2DrawerProvider>
  );
}
