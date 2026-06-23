/**
 * Service Domain Shell — Customer service tickets, CSAT, knowledge base
 * Views: Dashboard, Tickets, Customers, Knowledge, Analytics, CSAT
 */
import { useState } from "react";
import {
  LayoutDashboard,
  Ticket,
  Users,
  BookOpen,
  BarChart3,
  Heart,
  Search,
  Bell,
} from "lucide-react";
import { DomainSidebar, type NavItem } from "../domain-sidebar";
import { domainConfigs } from "../domain-types";
import { ServiceDashboard } from "./dashboard";
import {
  ServiceTicketsView,
  ServiceCustomersView,
  ServiceKnowledgeView,
  ServiceAnalyticsView,
  ServiceCSATView,
} from "./service-views";
import { useSpine } from "@/components/l2/spine/spine-client";

const domain = domainConfigs["service"];

const navItems: NavItem[] = [
  { id: "dashboard", label: "Service Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "tickets", label: "Tickets", icon: <Ticket className="w-4 h-4" />, badge: "18" },
  { id: "customers", label: "Customers", icon: <Users className="w-4 h-4" /> },
  { id: "knowledge", label: "Knowledge Base", icon: <BookOpen className="w-4 h-4" /> },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart3 className="w-4 h-4" />,
    section: "Insights",
  },
  { id: "satisfaction", label: "CSAT", icon: <Heart className="w-4 h-4" />, section: "Insights" },
];

interface ServiceShellProps {
  onSwitchDomain: () => void;
}

export function ServiceShell({ onSwitchDomain }: ServiceShellProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const spine = useSpine();

  const viewTitles: Record<string, string> = {
    dashboard: "Service Dashboard",
    tickets: "Tickets",
    customers: "Customers",
    knowledge: "Knowledge Base",
    analytics: "Analytics",
    satisfaction: "CSAT",
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <ServiceDashboard />;
      case "tickets":
        return <ServiceTicketsView />;
      case "customers":
        return <ServiceCustomersView />;
      case "knowledge":
        return <ServiceKnowledgeView />;
      case "analytics":
        return <ServiceAnalyticsView />;
      case "satisfaction":
        return <ServiceCSATView />;
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
              {domain.icon} {viewTitles[activeView] || "Service"}
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
