/**
 * SalesOps Domain Shell — Sales execution hub.
 * 8 views: Dashboard, Pipeline, Deals, Contacts, Activities, Sequences, Automation, Analytics
 */
import { useState } from "react";
import {
  LayoutDashboard, DollarSign, Users, Phone, Mail, FileText,
  Zap, BarChart3, Search, Bell, Plus,
} from "lucide-react";
import { DomainSidebar, type NavItem } from "../domain-sidebar";
import { domainConfigs } from "../domain-types";
import { SalesOpsDashboard } from "./dashboard";
import {
  PipelineKanban, DealsView, ContactsView,
  ActivitiesView, SequencesView, SalesAnalyticsView,
} from "./salesops-views";
import { useSpine } from "../../spine/spine-client";

const domain = domainConfigs["salesops"];

const navItems: NavItem[] = [
  { id: "dashboard", label: "Sales Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "pipeline", label: "Pipeline", icon: <DollarSign className="w-4 h-4" /> },
  { id: "deals", label: "Deals", icon: <FileText className="w-4 h-4" />, badge: "7" },
  { id: "contacts", label: "Contacts", icon: <Users className="w-4 h-4" /> },
  { id: "activities", label: "Activities", icon: <Phone className="w-4 h-4" />, section: "Execution" },
  { id: "sequences", label: "Sequences", icon: <Mail className="w-4 h-4" />, section: "Execution" },
  { id: "automation", label: "Automation", icon: <Zap className="w-4 h-4" />, section: "Tools" },
  { id: "analytics", label: "Sales Analytics", icon: <BarChart3 className="w-4 h-4" />, section: "Tools" },
];

interface SalesOpsShellProps {
  onSwitchDomain: () => void;
}

export function SalesOpsShell({ onSwitchDomain }: SalesOpsShellProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const spine = useSpine();

  const viewTitles: Record<string, string> = {
    dashboard: "Sales Dashboard", pipeline: "Pipeline", deals: "Deals",
    contacts: "Contacts", activities: "Activities", sequences: "Sequences",
    automation: "Automation", analytics: "Sales Analytics",
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <SalesOpsDashboard />;
      case "pipeline": return <PipelineKanban />;
      case "deals": return <DealsView />;
      case "contacts": return <ContactsView />;
      case "activities": return <ActivitiesView />;
      case "sequences": return <SequencesView />;
      case "analytics": return <SalesAnalyticsView />;
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
              {domain.icon} {viewTitles[activeView] || "SalesOps"}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {spine.connectedApps.length} sources · SSOT live
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors"><Search className="w-4 h-4 text-muted-foreground" /></button>
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
