/**
 * IT & Admin Domain Shell — User management, integrations, security, compliance
 * Views: Dashboard, Users, Permissions, Integrations, Audit Logs, Compliance
 */
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Plug,
  FileText,
  ShieldCheck,
  Search,
  Bell,
} from "lucide-react";
import { DomainSidebar, type NavItem } from "../domain-sidebar";
import { domainConfigs } from "../domain-types";
import { ITAdminDashboard } from "./dashboard";
import {
  ITUsersView,
  ITPermissionsView,
  ITIntegrationsView,
  ITAuditLogsView,
  ITComplianceView,
} from "./it-admin-views";
import { useSpine } from "@/components/l2/spine/spine-client";

const domain = domainConfigs["it-admin"];

const navItems: NavItem[] = [
  { id: "dashboard", label: "IT Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
  { id: "permissions", label: "Permissions", icon: <Shield className="w-4 h-4" /> },
  { id: "integrations", label: "Integrations", icon: <Plug className="w-4 h-4" />, badge: "8" },
  {
    id: "audit-logs",
    label: "Audit Logs",
    icon: <FileText className="w-4 h-4" />,
    section: "Security",
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: <ShieldCheck className="w-4 h-4" />,
    section: "Security",
  },
];

interface ITAdminShellProps {
  onSwitchDomain: () => void;
}

export function ITAdminShell({ onSwitchDomain }: ITAdminShellProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const spine = useSpine();

  const viewTitles: Record<string, string> = {
    dashboard: "IT Dashboard",
    users: "Users",
    permissions: "Permissions",
    integrations: "Integrations",
    "audit-logs": "Audit Logs",
    compliance: "Compliance",
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <ITAdminDashboard />;
      case "users":
        return <ITUsersView />;
      case "permissions":
        return <ITPermissionsView />;
      case "integrations":
        return <ITIntegrationsView />;
      case "audit-logs":
        return <ITAuditLogsView />;
      case "compliance":
        return <ITComplianceView />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="text-3xl">{domain.icon}</div>
              <p className="text-sm text-muted-foreground capitalize">
                {activeView.replace("-", " ")} — Coming soon
              </p>
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
              {domain.icon} {viewTitles[activeView] || "IT & Admin"}
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
