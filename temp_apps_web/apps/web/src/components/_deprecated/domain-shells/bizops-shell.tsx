/**
 * Business Operations Domain Shell — Projects, workflows, analytics, account management
 * Views: Dashboard, Projects, Workflows, Analytics, Accounts, Tasks, Documents
 */
import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  GitBranch,
  BarChart3,
  Building2,
  CheckSquare,
  FileText,
  Search,
  Bell,
} from "lucide-react";
import { DomainSidebar, type NavItem } from "../domain-sidebar";
import { domainConfigs } from "../domain-types";
import { BizOpsDashboard } from "./dashboard";
import {
  BizOpsProjectsView,
  BizOpsWorkflowsView,
  BizOpsAnalyticsView,
  BizOpsAccountsView,
  BizOpsTasksView,
  BizOpsDocsView,
} from "./bizops-views";
import { useSpine } from "@/components/l2/spine/spine-client";

const domain = domainConfigs["bizops"];

const navItems: NavItem[] = [
  { id: "dashboard", label: "BizOps Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "projects", label: "Projects", icon: <Briefcase className="w-4 h-4" />, badge: "12" },
  { id: "workflows", label: "Workflows", icon: <GitBranch className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  {
    id: "accounts",
    label: "Accounts",
    icon: <Building2 className="w-4 h-4" />,
    section: "Management",
  },
  { id: "tasks", label: "Tasks", icon: <CheckSquare className="w-4 h-4" />, section: "Management" },
  { id: "docs", label: "Documents", icon: <FileText className="w-4 h-4" />, section: "Management" },
];

interface BizOpsShellProps {
  onSwitchDomain: () => void;
}

export function BizOpsShell({ onSwitchDomain }: BizOpsShellProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const spine = useSpine();

  const viewTitles: Record<string, string> = {
    dashboard: "BizOps Dashboard",
    projects: "Projects",
    workflows: "Workflows",
    analytics: "Analytics",
    accounts: "Accounts",
    tasks: "Tasks",
    docs: "Documents",
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <BizOpsDashboard />;
      case "projects":
        return <BizOpsProjectsView />;
      case "workflows":
        return <BizOpsWorkflowsView />;
      case "analytics":
        return <BizOpsAnalyticsView />;
      case "accounts":
        return <BizOpsAccountsView />;
      case "tasks":
        return <BizOpsTasksView />;
      case "docs":
        return <BizOpsDocsView />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="text-3xl">{domain.icon}</div>
              <p className="text-sm text-muted-foreground capitalize">{activeView} — Coming soon</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans">
      <DomainSidebar
        domain={domain}
        navItems={navItems}
        activeView={activeView}
        onViewChange={setActiveView}
        onBackToConsole={onSwitchDomain}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-shrink-0 h-12 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ fontWeight: 600, color: domain.accentColor }}>
              {domain.icon} {viewTitles[activeView] || "BizOps"}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {spine.connectedApps.length} sources · SSOT live
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors relative">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--iw-danger)]" />
            </button>
          </div>
        </div>
        <main className="flex-1 overflow-hidden bg-background">{renderView()}</main>
      </div>
    </div>
  );
}
