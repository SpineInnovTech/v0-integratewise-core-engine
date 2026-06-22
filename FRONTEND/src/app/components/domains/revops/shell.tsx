/**
 * RevOps Domain Shell — Revenue intelligence across the org.
 * 8 views: Dashboard, Pipeline, Forecast, Quota, Analytics, Cohorts, Teams, Metrics
 */
import { useState } from "react";
import {
  LayoutDashboard, TrendingUp, Target, BarChart3, PieChart, DollarSign,
  Users, Activity, Search, Bell, Brain, Sparkles, Command, Plus,
} from "lucide-react";
import { DomainSidebar, type NavItem } from "../domain-sidebar";
import { domainConfigs } from "../domain-types";
import { RevOpsDashboard } from "./dashboard";
import {
  PipelineView, ForecastView, QuotaView, AnalyticsView,
  CohortView, TeamView, MetricsView,
} from "./revops-views";
import { useSpine } from "../../spine/spine-client";

const domain = domainConfigs["revops"];

const navItems: NavItem[] = [
  { id: "dashboard", label: "Revenue Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "pipeline", label: "Pipeline Visibility", icon: <DollarSign className="w-4 h-4" /> },
  { id: "forecast", label: "Forecasting", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "quota", label: "Quota Tracking", icon: <Target className="w-4 h-4" /> },
  { id: "analytics", label: "Rev Analytics", icon: <BarChart3 className="w-4 h-4" />, section: "Intelligence" },
  { id: "cohorts", label: "Cohort Analysis", icon: <PieChart className="w-4 h-4" />, section: "Intelligence" },
  { id: "teams", label: "Team Performance", icon: <Users className="w-4 h-4" />, section: "People" },
  { id: "metrics", label: "Operating Metrics", icon: <Activity className="w-4 h-4" />, section: "People" },
];

interface RevOpsShellProps {
  onSwitchDomain: () => void;
}

export function RevOpsShell({ onSwitchDomain }: RevOpsShellProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const spine = useSpine();

  const viewTitles: Record<string, string> = {
    dashboard: "Revenue Dashboard", pipeline: "Pipeline Visibility",
    forecast: "Forecasting", quota: "Quota Tracking",
    analytics: "Rev Analytics", cohorts: "Cohort Analysis",
    teams: "Team Performance", metrics: "Operating Metrics",
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <RevOpsDashboard />;
      case "pipeline": return <PipelineView />;
      case "forecast": return <ForecastView />;
      case "quota": return <QuotaView />;
      case "analytics": return <AnalyticsView />;
      case "cohorts": return <CohortView />;
      case "teams": return <TeamView />;
      case "metrics": return <MetricsView />;
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
              {domain.icon} {viewTitles[activeView] || "RevOps"}
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
