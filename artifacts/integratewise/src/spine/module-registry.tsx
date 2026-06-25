import type { ComponentType } from "react";
import {
  Home, Target, GitBranch, ShoppingCart, Building2, Megaphone, FileText,
  ShoppingBag, Package, FolderKanban, BookOpen, BarChart3, Compass, Lightbulb,
  Layers, Database, Globe, Webhook, Shield, Settings, Users, CalendarDays, Mail,
  Brain,
  type LucideIcon,
} from "lucide-react";
import type { ModuleId, NavGroup, SchemaGroup } from "./types";

import { ContextualMemoryView } from "@/components/views/contextual-memory-view";
import { CommandCenterView } from "@/components/views/command-center-view";
import { CockpitView } from "@/components/views/cockpit-view";
import { IQHubView } from "@/components/views/iq-hub-view";
import { GovernanceView } from "@/components/views/governance-view";
import { CSAccountsView } from "@/components/views/cs-accounts-view";
import { CSContactsView } from "@/components/views/cs-contacts-view";
import { CSMeetingsView } from "@/components/views/cs-meetings-view";
import { ReleaseControlView } from "@/components/views/release-control-view";
import { InsightsView } from "@/components/views/insights-view";
import { LoaderView } from "@/components/views/loader-view";
import { ProfileView } from "@/components/views/profile-view";
import { SpendInsightsView } from "@/components/views/spend-insights-view";
import { TodayView } from "@/components/views/today-view";
import { LeadsView } from "@/components/views/leads-view";
import { PipelineView } from "@/components/views/pipeline-view";
import { DealsView } from "@/components/views/deals-view";
import { CampaignsView } from "@/components/views/campaigns-view";
import { ContentLibraryView } from "@/components/views/content-library-view";
import { SalesHubView } from "@/components/views/sales-hub-view";
import { ClientsView } from "@/components/views/clients-view";
import { SessionsView } from "@/components/views/sessions-view";
import { ProjectsView } from "@/components/views/projects-view";
import { TasksView } from "@/components/views/tasks-view";
import { ProductsView } from "@/components/views/products-view";
import { ServicesView } from "@/components/views/services-view";
import { KnowledgeView } from "@/components/views/knowledge-view";
import { MetricsView } from "@/components/views/metrics-view";
import { StrategicHubView } from "@/components/views/strategic-hub-view";
import { BrainstormingView } from "@/components/views/brainstorming-view";
import { ArchitectureView } from "@/components/views/architecture-view";
import { DataFlowView } from "@/components/views/data-flow-view";
import { DataSourcesView } from "@/components/views/data-sources-view";
import { WebsiteManagerView } from "@/components/views/website-manager-view";
import { IntegrationsView } from "@/components/views/integrations-view";
import { AdminDashboardView } from "@/components/views/admin-dashboard-view";
import { SettingsView } from "@/components/views/settings-view";
import { EmailView } from "@/components/views/email-view";
import { MOCK_USER } from "@/lib/mock-auth";

function AdminModule() {
  return <AdminDashboardView userEmail={MOCK_USER.email} />;
}

export interface ModuleDef {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  /** Canonical deep-link route. */
  path: string;
  group: NavGroup;
  /** Schema groups this module needs; omitted = always available. */
  requiredSchema?: SchemaGroup[];
  /** The view rendered when the module's schema is available. Home has none
   * (the role dashboard is rendered by the shell directly). */
  Component?: ComponentType<any>;
}

/**
 * Module registry — the single map from module id → { label, icon, route,
 * required schema, component }. The sidebar and content host both read from
 * here; nothing hardcodes a per-module branch.
 */
export const MODULE_REGISTRY: Record<ModuleId, ModuleDef> = {
  home: { id: "home", label: "Home", icon: Home, path: "/", group: "Workspace" },
  context: { id: "context", label: "Contextual Memory", icon: Brain, path: "/context", group: "Workspace", Component: ContextualMemoryView },
  email: { id: "email", label: "Email", icon: Mail, path: "/email", group: "Workspace", requiredSchema: ["email"], Component: EmailView },
  leads: { id: "leads", label: "Leads", icon: Target, path: "/leads", group: "Revenue", requiredSchema: ["person"], Component: LeadsView },
  pipeline: { id: "pipeline", label: "Pipeline", icon: GitBranch, path: "/pipeline", group: "Revenue", requiredSchema: ["deal"], Component: PipelineView },
  deals: { id: "deals", label: "Deals", icon: ShoppingCart, path: "/deals", group: "Revenue", requiredSchema: ["deal"], Component: DealsView },
  sales: { id: "sales", label: "Sales Hub", icon: ShoppingCart, path: "/sales", group: "Revenue", requiredSchema: ["deal"], Component: SalesHubView },
  campaigns: { id: "campaigns", label: "Campaigns", icon: Megaphone, path: "/campaigns", group: "Marketing", requiredSchema: ["campaign"], Component: CampaignsView },
  content: { id: "content", label: "Content", icon: FileText, path: "/content", group: "Marketing", requiredSchema: ["document"], Component: ContentLibraryView },
  clients: { id: "clients", label: "Clients", icon: Building2, path: "/clients", group: "Delivery", requiredSchema: ["company"], Component: ClientsView },
  sessions: { id: "sessions", label: "Sessions", icon: CalendarDays, path: "/sessions", group: "Delivery", requiredSchema: ["activity"], Component: SessionsView },
  projects: { id: "projects", label: "Projects", icon: FolderKanban, path: "/projects", group: "Delivery", requiredSchema: ["project"], Component: ProjectsView },
  tasks: { id: "tasks", label: "Tasks", icon: FolderKanban, path: "/tasks", group: "Delivery", requiredSchema: ["activity"], Component: TasksView },
  products: { id: "products", label: "Products", icon: ShoppingBag, path: "/products", group: "Catalog", requiredSchema: ["product"], Component: ProductsView },
  services: { id: "services", label: "Services", icon: Package, path: "/services", group: "Catalog", requiredSchema: ["service"], Component: ServicesView },
  knowledge: { id: "knowledge", label: "Knowledge", icon: BookOpen, path: "/knowledge", group: "Knowledge", requiredSchema: ["document"], Component: KnowledgeView },
  brainstorming: { id: "brainstorming", label: "Brainstorming", icon: Lightbulb, path: "/brainstorming", group: "Knowledge", requiredSchema: ["document"], Component: BrainstormingView },
  metrics: { id: "metrics", label: "Metrics", icon: BarChart3, path: "/metrics", group: "Platform", requiredSchema: ["metric"], Component: MetricsView },
  strategy: { id: "strategy", label: "Strategic Hub", icon: Compass, path: "/strategy", group: "Platform", requiredSchema: ["metric"], Component: StrategicHubView },
  architecture: { id: "architecture", label: "Architecture", icon: Layers, path: "/architecture", group: "Platform", requiredSchema: ["platform"], Component: ArchitectureView },
  "data-flow": { id: "data-flow", label: "Data Flow", icon: GitBranch, path: "/data-flow", group: "Platform", requiredSchema: ["platform"], Component: DataFlowView },
  "data-sources": { id: "data-sources", label: "Data Sources", icon: Database, path: "/data-sources", group: "Platform", requiredSchema: ["platform"], Component: DataSourcesView },
  website: { id: "website", label: "Website", icon: Globe, path: "/website", group: "Platform", requiredSchema: ["platform"], Component: WebsiteManagerView },
  integrations: { id: "integrations", label: "Integrations", icon: Webhook, path: "/integrations", group: "System", requiredSchema: ["platform"], Component: IntegrationsView },
  admin: { id: "admin", label: "Admin Console", icon: Shield, path: "/admin", group: "System", requiredSchema: ["platform"], Component: AdminModule },
  settings: { id: "settings", label: "Settings", icon: Settings, path: "/settings", group: "System", Component: SettingsView },
  "command-center": { id: "command-center", label: "Command Center", icon: Home, path: "/command-center", group: "Workspace", Component: CommandCenterView },
  cockpit: { id: "cockpit", label: "Cockpit", icon: Brain, path: "/cockpit", group: "Workspace", Component: CockpitView },
  "iq-hub": { id: "iq-hub", label: "IQ Hub", icon: Brain, path: "/iq-hub", group: "Knowledge", Component: IQHubView },
  governance: { id: "governance", label: "Governance", icon: Shield, path: "/governance", group: "System", Component: GovernanceView },
  "cs-accounts": { id: "cs-accounts", label: "CS Accounts", icon: Building2, path: "/cs-accounts", group: "Delivery", requiredSchema: ["company"], Component: CSAccountsView },
  "cs-contacts": { id: "cs-contacts", label: "CS Contacts", icon: Users, path: "/cs-contacts", group: "Delivery", requiredSchema: ["person"], Component: CSContactsView },
  "cs-meetings": { id: "cs-meetings", label: "CS Meetings", icon: CalendarDays, path: "/cs-meetings", group: "Delivery", requiredSchema: ["activity"], Component: CSMeetingsView },
  "release-control": { id: "release-control", label: "Release Control", icon: GitBranch, path: "/release-control", group: "System", Component: ReleaseControlView },
  insights: { id: "insights", label: "Insights", icon: BarChart3, path: "/insights", group: "Platform", Component: InsightsView },
  loader: { id: "loader", label: "AI Loader", icon: Database, path: "/loader", group: "Platform", Component: LoaderView },
  profile: { id: "profile", label: "Profile", icon: Settings, path: "/profile", group: "System", Component: ProfileView },
  "spend-insights": { id: "spend-insights", label: "Spend Insights", icon: BarChart3, path: "/spend-insights", group: "Platform", Component: SpendInsightsView },
  today: { id: "today", label: "Today", icon: Home, path: "/today", group: "Workspace", Component: TodayView },
  "cs-account-detail": { id: "cs-account-detail", label: "Account Detail", icon: Building2, path: "/cs-account-detail", group: "Delivery" },
};

export const NAV_GROUP_ORDER: NavGroup[] = [
  "Workspace", "Revenue", "Marketing", "Delivery", "Catalog", "Knowledge", "Platform", "System",
];

/** Lookup a module by its route path (for deriving the active module). */
export function moduleByPath(path: string): ModuleDef | undefined {
  return Object.values(MODULE_REGISTRY).find((m) => m.path === path);
}

export const ALL_MODULES: ModuleDef[] = Object.values(MODULE_REGISTRY);
